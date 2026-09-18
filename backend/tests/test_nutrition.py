import pytest
from backend.app.services.nutrition_service import (
    compute_bmi, calculate_targets, calculate_daily_nutrition_score, assess_nutrient_gaps
)
from backend.app.services.food_service import get_foods, get_best_protein_sources
from backend.app.database import SessionLocal, Base, engine
from backend.app.models.food import Food

def test_compute_bmi():
    bmi, cat = compute_bmi(70.0, 170.0)
    assert bmi == 24.2
    assert cat == "Normal"

    bmi_obese, cat_obese = compute_bmi(95.0, 170.0)
    assert bmi_obese >= 30.0
    assert cat_obese == "Obese"

def test_calculate_targets():
    targets = calculate_targets(
        age=25,
        gender="male",
        height_cm=175.0,
        weight_kg=75.0,
        goal="CUTTING",
        activity_level="MODERATE"
    )
    assert targets["calories"] > 1800
    assert targets["protein"] == 150.0  # 75kg * 2.0
    assert targets["fiber"] == 30.0
    assert targets["water_liters"] >= 2.5

def test_daily_nutrition_score():
    score, rating, breakdown = calculate_daily_nutrition_score(
        cals_consumed=2000,
        cals_target=2000,
        pro_consumed=100,
        pro_target=100,
        fiber_consumed=30,
        fiber_target=30,
        water_consumed=2.5,
        water_target=2.5,
        food_diversity_count=8
    )
    assert score == 100
    assert rating == "Excellent"
    assert len(breakdown) == 5

def test_food_bioavailability():
    db = SessionLocal()
    try:
        roti = db.query(Food).filter(Food.name.ilike("%chapati%")).first()
        paneer = db.query(Food).filter(Food.name.ilike("%paneer (raw%")).first()
        assert roti is not None
        assert paneer is not None
        assert roti.protein_quality_score == 0.45
        assert roti.effective_protein == round(roti.protein * 0.45, 1)
        assert paneer.protein_quality_score >= 0.80
    finally:
        db.close()

