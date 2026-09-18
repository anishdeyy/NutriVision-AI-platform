import json
from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func
from backend.app.models.food import Food
from backend.app.models.food_source import FoodSource

def get_foods(
    db: Session,
    query: Optional[str] = None,
    category: Optional[str] = None,
    diet_type: Optional[str] = None,
    high_protein: bool = False,
    low_calorie: bool = False,
    min_protein: Optional[float] = None,
    max_calories: Optional[float] = None,
    min_fiber: Optional[float] = None,
    min_protein_density: Optional[float] = None,
    source_type: Optional[str] = None,
    sort_by: Optional[str] = None,
    limit: int = 100,
    offset: int = 0
) -> List[Food]:
    q = db.query(Food)
    
    if query:
        search = f"%{query.strip()}%"
        q = q.filter(
            or_(
                Food.name.ilike(search),
                Food.canonical_name.ilike(search),
                Food.regional_name.ilike(search),
                Food.category.ilike(search)
            )
        )
        
    if category and category.lower() != "all":
        q = q.filter(Food.category.ilike(category))

    if diet_type:
        dt = diet_type.upper()
        if dt == "VEGAN":
            q = q.filter(Food.vegan == True)
        elif dt == "VEGETARIAN":
            q = q.filter(Food.vegetarian == True)
        elif dt == "EGGETARIAN":
            q = q.filter(or_(Food.vegetarian == True, Food.contains_egg == True))

    if high_protein:
        q = q.filter(Food.protein >= 10.0)

    if low_calorie:
        q = q.filter(Food.calories <= 150.0)

    if min_protein is not None:
        q = q.filter(Food.protein >= min_protein)

    if max_calories is not None:
        q = q.filter(Food.calories <= max_calories)

    if min_fiber is not None:
        q = q.filter(Food.fiber >= min_fiber)

    if source_type:
        q = q.filter(Food.data_confidence == source_type.upper())

    if sort_by == "protein_desc":
        q = q.order_by(Food.protein.desc())
    elif sort_by == "calories_asc":
        q = q.order_by(Food.calories.asc())
    elif sort_by == "fiber_desc":
        q = q.order_by(Food.fiber.desc())
    elif sort_by == "price_asc":
        q = q.order_by(Food.price_estimate.asc())
    elif sort_by == "density_desc":
        # Protein density: (protein * 100 / calories)
        q = q.order_by((Food.protein * 100.0 / func.max(Food.calories, 1.0)).desc())
    else:
        q = q.order_by(Food.id.asc())

    foods = q.offset(offset).limit(limit).all()

    if min_protein_density is not None:
        foods = [f for f in foods if f.protein_density_ratio >= min_protein_density]

    return foods

def get_food_by_id(db: Session, food_id: int) -> Optional[Food]:
    return db.query(Food).filter(Food.id == food_id).first()

def get_food_provenance(db: Session, food_id: int) -> Optional[Dict[str, Any]]:
    food = db.query(Food).filter(Food.id == food_id).first()
    if not food:
        return None

    sources = db.query(FoodSource).filter(FoodSource.food_id == food_id).all()
    formatted_sources = []
    for s in sources:
        try:
            raw_data = json.loads(s.original_data) if isinstance(s.original_data, str) else s.original_data
        except Exception:
            raw_data = {"raw": str(s.original_data)}

        formatted_sources.append({
            "id": s.id,
            "food_id": s.food_id,
            "source_type": s.source_type,
            "source_identifier": s.source_identifier,
            "source_file": s.source_file,
            "original_row_number": s.original_row_number,
            "source_record_hash": s.source_record_hash,
            "original_data": raw_data,
            "imported_at": s.imported_at
        })

    return {
        "food_id": food.id,
        "food_name": food.name,
        "canonical_name": food.canonical_name,
        "category": food.category,
        "data_confidence": food.data_confidence or "SOURCE_IMPORTED",
        "nutrition_consistency_flag": food.nutrition_consistency_flag or "VALID",
        "source_count": food.source_count or len(sources) or 1,
        "sources": formatted_sources
    }

def get_food_stats(db: Session) -> Dict[str, Any]:
    total_foods = db.query(Food).count()
    categories = db.query(Food.category, func.count(Food.id)).group_by(Food.category).all()
    category_counts = {c: cnt for c, cnt in categories if c}

    # Top protein per rupee
    top_value = db.query(Food).filter(Food.price_estimate > 0, Food.protein > 5).all()
    top_value = sorted(top_value, key=lambda f: f.protein_per_rupee, reverse=True)[:5]

    # Top protein density
    top_density = db.query(Food).filter(Food.calories > 30).all()
    top_density = sorted(top_density, key=lambda f: f.protein_density_ratio, reverse=True)[:5]

    all_foods = db.query(Food).limit(200).all()
    avg_density = round(sum(f.protein_density_ratio for f in all_foods) / max(1, len(all_foods)), 2)

    return {
        "total_foods": total_foods,
        "category_counts": category_counts,
        "avg_protein_density": avg_density,
        "top_protein_per_rupee": top_value,
        "top_protein_density": top_density
    }

def get_data_quality_metrics(db: Session) -> Dict[str, Any]:
    total_foods = db.query(Food).count()
    curated_foods = db.query(Food).filter(Food.data_confidence == "CURATED").count()
    imported_foods = db.query(Food).filter(Food.data_confidence == "SOURCE_IMPORTED").count()

    foods_with_micro = db.query(Food).filter(
        or_(
            Food.calcium_mg.isnot(None),
            Food.iron_mg.isnot(None),
            Food.folate_mcg.isnot(None)
        )
    ).count()

    foods_with_price = db.query(Food).filter(Food.price_estimate.isnot(None), Food.price_estimate > 0).count()

    # Nutrient completeness rates
    has_pro = db.query(Food).filter(Food.protein.isnot(None), Food.protein > 0).count()
    has_cals = db.query(Food).filter(Food.calories.isnot(None), Food.calories > 0).count()
    has_fib = db.query(Food).filter(Food.fiber.isnot(None), Food.fiber > 0).count()
    has_sod = db.query(Food).filter(Food.sodium_mg.isnot(None)).count()
    has_calc = db.query(Food).filter(Food.calcium_mg.isnot(None)).count()
    has_iron = db.query(Food).filter(Food.iron_mg.isnot(None)).count()

    completeness_rates = {
        "calories": round((has_cals / max(1, total_foods)) * 100, 1),
        "protein": round((has_pro / max(1, total_foods)) * 100, 1),
        "fiber": round((has_fib / max(1, total_foods)) * 100, 1),
        "sodium": round((has_sod / max(1, total_foods)) * 100, 1),
        "calcium": round((has_calc / max(1, total_foods)) * 100, 1),
        "iron": round((has_iron / max(1, total_foods)) * 100, 1),
    }

    consistency_counts = {
        "VALID": db.query(Food).filter(Food.nutrition_consistency_flag == "VALID").count(),
        "WARNING": db.query(Food).filter(Food.nutrition_consistency_flag == "WARNING").count(),
        "REVIEW": db.query(Food).filter(Food.nutrition_consistency_flag == "REVIEW").count(),
    }

    sources_counts = db.query(FoodSource.source_identifier, func.count(FoodSource.id)).group_by(FoodSource.source_identifier).all()
    source_dist = {s: cnt for s, cnt in sources_counts if s}

    return {
        "total_foods": total_foods,
        "curated_foods": curated_foods,
        "imported_foods": imported_foods,
        "foods_with_micronutrients": foods_with_micro,
        "foods_with_price": foods_with_price,
        "completeness_rates": completeness_rates,
        "consistency_flags": consistency_counts,
        "source_distribution": source_dist
    }

def get_best_protein_sources(
    db: Session,
    diet_type: str = "VEGETARIAN",
    max_calories: float = 300.0,
    limit: int = 10
) -> List[Food]:
    q = db.query(Food).filter(Food.calories <= max_calories)
    dt = diet_type.upper()
    if dt == "VEGAN":
        q = q.filter(Food.vegan == True)
    elif dt == "VEGETARIAN":
        q = q.filter(Food.vegetarian == True)
    elif dt == "EGGETARIAN":
        q = q.filter(or_(Food.vegetarian == True, Food.contains_egg == True))

    foods = q.all()
    # Sort by protein density (protein / calories)
    sorted_foods = sorted(foods, key=lambda f: (f.protein_per_rupee * 0.4 + f.protein_density_ratio * 0.6), reverse=True)
    return sorted_foods[:limit]
