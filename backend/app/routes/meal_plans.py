from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.profile import UserProfile
from backend.app.schemas.meal_plan import MealPlanRequest, MealPlanResponse, GroceryListResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.meal_plan_service import generate_meal_plan, generate_grocery_list_from_plan

router = APIRouter(prefix="/api/meal-plans", tags=["meal-plans"])

@router.post("/generate", response_model=MealPlanResponse)
def create_plan(
    req: MealPlanRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=400, detail="Profile required to generate meal plans")

    budget = req.budget_per_day or profile.budget_per_day or 150.0
    region = req.region or profile.region or "North Indian"

    plan = generate_meal_plan(
        db=db,
        profile=profile,
        days=req.days,
        budget_per_day=budget,
        region=region
    )
    return plan

@router.post("/grocery", response_model=GroceryListResponse)
def get_grocery(
    plan: MealPlanResponse,
    current_user: User = Depends(get_current_user)
):
    grocery = generate_grocery_list_from_plan(plan)
    return grocery
