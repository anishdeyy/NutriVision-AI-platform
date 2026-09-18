from datetime import date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.food import Food
from backend.app.models.meal import Meal, MealItem, MealType
from backend.app.models.profile import UserProfile
from backend.app.schemas.meal import (
    MealCreate, MealResponse,
    NaturalLanguageMealParseRequest, NaturalLanguageMealParseResponse, ParsedMealItemMatch,
    MealReplacementRequest, MealReplacementOption, MealItemCreate
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.gemini_service import gemini_service
from backend.app.services.food_service import get_food_by_id

router = APIRouter(prefix="/api/meals", tags=["meals"])

@router.get("", response_model=List[MealResponse])
def get_user_meals(
    meal_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_date = meal_date or date.today()
    meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date == target_date
    ).order_by(Meal.id.asc()).all()
    return meals

@router.post("", response_model=MealResponse)
def create_meal(
    meal_in: MealCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_date = meal_in.meal_date or date.today()
    meal = Meal(
        user_id=current_user.id,
        meal_type=meal_in.meal_type,
        meal_date=target_date,
        notes=meal_in.notes or ""
    )
    db.add(meal)
    db.flush()

    tot_cal = 0.0
    tot_pro = 0.0
    tot_eff_pro = 0.0
    tot_carb = 0.0
    tot_fat = 0.0
    tot_fib = 0.0

    for item_in in meal_in.items:
        food = get_food_by_id(db, item_in.food_id)
        if not food:
            continue
        qty = item_in.quantity
        cals = round(food.calories * qty, 1)
        pro = round(food.protein * qty, 1)
        eff_pro = round(food.effective_protein * qty, 1)
        carb = round(food.carbohydrates * qty, 1)
        fat = round(food.fat * qty, 1)
        fib = round(food.fiber * qty, 1)

        tot_cal += cals
        tot_pro += pro
        tot_eff_pro += eff_pro
        tot_carb += carb
        tot_fat += fat
        tot_fib += fib

        m_item = MealItem(
            meal_id=meal.id,
            food_id=food.id,
            quantity=qty,
            serving_unit=item_in.serving_unit or food.serving_size,
            calories=cals,
            protein=pro,
            effective_protein=eff_pro,
            carbs=carb,
            fat=fat,
            fiber=fib
        )
        db.add(m_item)

    meal.total_calories = round(tot_cal, 1)
    meal.total_protein = round(tot_pro, 1)
    meal.total_effective_protein = round(tot_eff_pro, 1)
    meal.total_carbs = round(tot_carb, 1)
    meal.total_fat = round(tot_fat, 1)
    meal.total_fiber = round(tot_fib, 1)

    db.commit()
    db.refresh(meal)
    return meal

@router.delete("/{id}")
def delete_meal(id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    meal = db.query(Meal).filter(Meal.id == id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")
    db.delete(meal)
    db.commit()
    return {"success": True, "message": "Meal deleted"}

@router.post("/parse", response_model=NaturalLanguageMealParseResponse)
async def parse_meal_text(
    req: NaturalLanguageMealParseRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Parses natural language meal e.g. "2 rotis, 100g paneer and a bowl of dal"
    Uses Gemini to identify items, then matches them against verified DB foods.
    """
    foods = db.query(Food).all()
    food_dicts = [{"id": f.id, "name": f.name, "serving_size": f.serving_size} for f in foods]

    parsed_matches = await gemini_service.parse_natural_language_meal(req.text, food_dicts)
    
    result_items: List[ParsedMealItemMatch] = []
    tot_cal = 0.0
    tot_pro = 0.0
    tot_carb = 0.0
    tot_fat = 0.0
    tot_fib = 0.0

    for match in parsed_matches:
        f_id = match.get("food_id")
        food = get_food_by_id(db, f_id) if f_id else None
        if not food:
            # Fallback search by name
            food = db.query(Food).filter(Food.name.ilike(f"%{match.get('food_name', '')}%")).first()

        if food:
            qty = float(match.get("quantity", 1.0))
            cals = round(food.calories * qty, 1)
            pro = round(food.protein * qty, 1)
            carb = round(food.carbohydrates * qty, 1)
            fat = round(food.fat * qty, 1)
            fib = round(food.fiber * qty, 1)

            tot_cal += cals
            tot_pro += pro
            tot_carb += carb
            tot_fat += fat
            tot_fib += fib

            result_items.append(ParsedMealItemMatch(
                food_id=food.id,
                food_name=food.name,
                quantity=qty,
                unit=match.get("unit") or food.serving_size,
                matched_calories=cals,
                matched_protein=pro,
                matched_carbs=carb,
                matched_fat=fat,
                matched_fiber=fib
            ))

    return NaturalLanguageMealParseResponse(
        original_text=req.text,
        parsed_items=result_items,
        total_calories=round(tot_cal, 1),
        total_protein=round(tot_pro, 1),
        total_carbs=round(tot_carb, 1),
        total_fat=round(tot_fat, 1),
        total_fiber=round(tot_fib, 1),
        confidence="High" if result_items else "Needs Review"
    )

@router.post("/swap-options", response_model=List[MealReplacementOption])
def get_meal_swaps(
    req: MealReplacementRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Suggests smart alternative meals with higher protein density or fewer calories.
    """
    meal = db.query(Meal).filter(Meal.id == req.meal_id, Meal.user_id == current_user.id).first()
    if not meal:
        raise HTTPException(status_code=404, detail="Meal not found")

    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    diet = profile.diet_type.value if profile and hasattr(profile.diet_type, "value") else "VEGETARIAN"

    # Pre-calculated intelligent alternatives based on food database
    roti = db.query(Food).filter(Food.name.ilike("%chapati%") | Food.name.ilike("%roti%")).first()
    tofu = db.query(Food).filter(Food.name.ilike("%tofu%")).first()
    paneer = db.query(Food).filter(Food.name.ilike("%paneer bhurji%")).first()
    chana = db.query(Food).filter(Food.name.ilike("%chana masala%")).first()
    salad = db.query(Food).filter(Food.name.ilike("%green salad%")).first()

    options = []
    if paneer and roti:
        options.append(MealReplacementOption(
            name="Paneer Bhurji + 2 Whole Wheat Rotis",
            items_description="200g Fresh Paneer Bhurji with 2 Rotis",
            calories=round(paneer.calories + roti.calories * 2),
            protein=round(paneer.protein + roti.protein * 2, 1),
            carbs=round(paneer.carbohydrates + roti.carbohydrates * 2, 1),
            fat=round(paneer.fat + roti.fat * 2, 1),
            fiber=round(paneer.fiber + roti.fiber * 2, 1),
            estimated_cost=65.0,
            reason="Significantly higher bioavailable protein with minimal simple carbs.",
            swap_items=[
                MealItemCreate(food_id=paneer.id, quantity=1.0, serving_unit="bowl"),
                MealItemCreate(food_id=roti.id, quantity=2.0, serving_unit="piece")
            ]
        ))
    if chana and roti and salad:
        options.append(MealReplacementOption(
            name="Chana Masala + 2 Rotis + Fresh Salad",
            items_description="1 Bowl Chana Masala, 2 Rotis, Green Salad",
            calories=round(chana.calories + roti.calories * 2 + salad.calories),
            protein=round(chana.protein + roti.protein * 2 + salad.protein, 1),
            carbs=round(chana.carbohydrates + roti.carbohydrates * 2 + salad.carbohydrates, 1),
            fat=round(chana.fat + roti.fat * 2 + salad.fat, 1),
            fiber=round(chana.fiber + roti.fiber * 2 + salad.fiber, 1),
            estimated_cost=50.0,
            reason="Exceptional prebiotic fiber (+10g) promoting prolonged satiety during cutting.",
            swap_items=[
                MealItemCreate(food_id=chana.id, quantity=1.0, serving_unit="bowl"),
                MealItemCreate(food_id=roti.id, quantity=2.0, serving_unit="piece"),
                MealItemCreate(food_id=salad.id, quantity=1.0, serving_unit="bowl")
            ]
        ))

    return options
