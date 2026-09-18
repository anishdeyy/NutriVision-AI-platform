import pytest
from backend.app.database import SessionLocal
from backend.app.models.food import Food
from backend.app.models.food_source import FoodSource
from backend.app.models.dataset_source import DatasetSource
from scripts.ingest_kaggle_datasets import (
    map_column, parse_numeric, normalize_food_name,
    create_source_hash, check_nutrition_consistency
)

def test_column_alias_mapping():
    assert map_column("Dish Name") == "food_name"
    assert map_column("Food_Item") == "food_name"
    assert map_column("Calories (kcal)") == "calories"
    assert map_column("Protein (g)") == "protein_g"
    assert map_column("Carbohydrates (g)") == "carbohydrates_g"
    assert map_column("Fats (g)") == "fat_g"
    assert map_column("Fibre (g)") == "fiber_g"
    assert map_column("Sodium (mg)") == "sodium_mg"
    assert map_column("Unknown_Random_Header_123") is None

def test_safe_numeric_parsing():
    assert parse_numeric("120 kcal") == 120.0
    assert parse_numeric("12.5 g") == 12.5
    assert parse_numeric("<5") == 5.0
    assert parse_numeric("14") == 14.0
    assert parse_numeric(25) == 25.0
    assert parse_numeric("N/A") is None
    assert parse_numeric("-") is None
    assert parse_numeric(None) is None
    assert parse_numeric("") is None

def test_nutrition_consistency_check():
    # 20P (80) + 20C (80) + 10F (90) = 250 kcal -> within normal range
    assert check_nutrition_consistency(250.0, 20.0, 20.0, 10.0) == "VALID"
    # Severe discrepancy: 10P + 10C + 5F = 125 kcal reported as 600 kcal
    assert check_nutrition_consistency(600.0, 10.0, 10.0, 5.0) == "WARNING"

def test_food_name_normalization():
    assert normalize_food_name("  Paneer Butter-Masala!  ") == "paneer butter masala"
    assert normalize_food_name("Masoor Dal (Tadka)") == "masoor dal tadka"

def test_source_record_hash_idempotency():
    rec1 = {"food_name": "Tofu Bhurji", "calories": 180, "protein": 14}
    rec2 = {"calories": 180, "protein": 14, "food_name": "Tofu Bhurji"}
    # Sorting keys produces identical deterministic hash
    assert create_source_hash(rec1) == create_source_hash(rec2)
    assert len(create_source_hash(rec1)) == 64

def test_unified_database_provenance():
    db = SessionLocal()
    try:
        total_foods = db.query(Food).count()
        assert total_foods >= 1000, f"Expected >1000 foods in unified database, found {total_foods}"

        # Assert dataset sources are registered
        datasets = db.query(DatasetSource).all()
        assert len(datasets) >= 2, "Expected at least 2 Kaggle datasets registered"

        # Assert food sources provenance records exist
        sources = db.query(FoodSource).count()
        assert sources >= 1000, "Expected >=1000 source provenance links"

        # Verify a specific imported food
        chai = db.query(Food).filter(Food.name.ilike("%chai%")).first()
        assert chai is not None
        assert chai.data_confidence in ["SOURCE_IMPORTED", "CURATED"]
        assert chai.protein_density_ratio is not None
    finally:
        db.close()
