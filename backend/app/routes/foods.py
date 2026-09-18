from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.food import Food
from backend.app.models.user import User
from backend.app.schemas.food import (
    FoodResponse, FoodCreate, FoodComparisonRequest, FoodComparisonItem,
    FoodProvenanceResponse, FoodStatsResponse
)
from backend.app.services.food_service import (
    get_foods, get_food_by_id, get_best_protein_sources,
    get_food_provenance, get_food_stats
)
from backend.app.services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/api/foods", tags=["foods"])

@router.get("", response_model=List[FoodResponse])
def list_foods(
    query: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    diet_type: Optional[str] = Query(None),
    high_protein: bool = Query(False),
    low_calorie: bool = Query(False),
    min_protein: Optional[float] = Query(None),
    max_calories: Optional[float] = Query(None),
    min_fiber: Optional[float] = Query(None),
    min_protein_density: Optional[float] = Query(None),
    source_type: Optional[str] = Query(None),
    sort_by: Optional[str] = Query(None),
    limit: int = Query(100, le=200),
    offset: int = Query(0),
    db: Session = Depends(get_db)
):
    foods = get_foods(
        db=db,
        query=query,
        category=category,
        diet_type=diet_type,
        high_protein=high_protein,
        low_calorie=low_calorie,
        min_protein=min_protein,
        max_calories=max_calories,
        min_fiber=min_fiber,
        min_protein_density=min_protein_density,
        source_type=source_type,
        sort_by=sort_by,
        limit=limit,
        offset=offset
    )
    return foods

@router.get("/stats", response_model=FoodStatsResponse)
def food_statistics(db: Session = Depends(get_db)):
    return get_food_stats(db)

@router.get("/protein-optimizer", response_model=List[FoodResponse])
def get_optimized_protein(
    diet_type: str = Query("VEGETARIAN"),
    max_calories: float = Query(300),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    foods = get_best_protein_sources(db, diet_type, max_calories, limit)
    return foods

@router.post("/compare", response_model=List[FoodComparisonItem])
def compare_foods(req: FoodComparisonRequest, db: Session = Depends(get_db)):
    foods = db.query(Food).filter(Food.id.in_(req.food_ids)).all()
    res = []
    for f in foods:
        res.append(FoodComparisonItem(
            id=f.id,
            name=f.name,
            category=f.category,
            serving_size=f.serving_size,
            calories=f.calories,
            protein=f.protein,
            effective_protein=f.effective_protein,
            carbohydrates=f.carbohydrates,
            fat=f.fat,
            fiber=f.fiber,
            price_estimate=f.price_estimate or 0.0,
            protein_per_rupee=f.protein_per_rupee,
            protein_density_ratio=f.protein_density_ratio,
            bioavailability_label=f.bioavailability_label or "Medium"
        ))
    return res

@router.get("/{food_id}/sources", response_model=FoodProvenanceResponse)
def food_sources_provenance(food_id: int, db: Session = Depends(get_db)):
    provenance = get_food_provenance(db, food_id)
    if not provenance:
        raise HTTPException(status_code=404, detail="Food item not found")
    return provenance

@router.get("/{food_id}", response_model=FoodResponse)
def get_single_food(food_id: int, db: Session = Depends(get_db)):
    food = get_food_by_id(db, food_id)
    if not food:
        raise HTTPException(status_code=404, detail="Food item not found")
    return food
