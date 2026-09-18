from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.meal import Meal
from backend.app.models.profile import UserProfile
from backend.app.schemas.nutrition import (
    DailyNutritionSummary, MacroProgress, NutritionScoreResponse,
    NutrientGapsResponse, NutritionHistoryPoint, PotentialNutrientGap
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.nutrition_service import calculate_daily_nutrition_score, assess_nutrient_gaps

router = APIRouter(prefix="/api/nutrition", tags=["nutrition"])

@router.get("/today", response_model=DailyNutritionSummary)
def get_today_summary(
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_date = target_date or date.today()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date == query_date
    ).all()

    cal_target = float(profile.daily_calorie_target if profile else 2000)
    pro_target = float(profile.protein_target if profile else 100)
    carb_target = float(profile.carb_target if profile else 250)
    fat_target = float(profile.fat_target if profile else 65)
    fiber_target = float(profile.fiber_target if profile else 30)
    water_target = float(profile.water_target_liters if profile else 2.5)

    tot_cal = sum(m.total_calories for m in meals)
    tot_pro = sum(m.total_protein for m in meals)
    tot_eff_pro = sum(m.total_effective_protein for m in meals)
    tot_carb = sum(m.total_carbs for m in meals)
    tot_fat = sum(m.total_fat for m in meals)
    tot_fib = sum(m.total_fiber for m in meals)
    tot_water = 2.1  # Mock default tracked water

    # Food diversity count
    distinct_foods = set()
    for m in meals:
        for it in m.items:
            distinct_foods.add(it.food_id)

    score, rating, breakdown = calculate_daily_nutrition_score(
        tot_cal, cal_target,
        tot_pro, pro_target,
        tot_fib, fiber_target,
        tot_water, water_target,
        len(distinct_foods)
    )

    return DailyNutritionSummary(
        date=query_date,
        calories=MacroProgress(
            consumed=round(tot_cal),
            target=cal_target,
            remaining=round(max(0, cal_target - tot_cal)),
            percentage=round(min(100.0, (tot_cal / max(cal_target, 1)) * 100), 1)
        ),
        protein=MacroProgress(
            consumed=round(tot_pro, 1),
            target=pro_target,
            remaining=round(max(0.0, pro_target - tot_pro), 1),
            percentage=round(min(100.0, (tot_pro / max(pro_target, 1)) * 100), 1)
        ),
        effective_protein=round(tot_eff_pro, 1),
        carbs=MacroProgress(
            consumed=round(tot_carb, 1),
            target=carb_target,
            remaining=round(max(0.0, carb_target - tot_carb), 1),
            percentage=round(min(100.0, (tot_carb / max(carb_target, 1)) * 100), 1)
        ),
        fat=MacroProgress(
            consumed=round(tot_fat, 1),
            target=fat_target,
            remaining=round(max(0.0, fat_target - tot_fat), 1),
            percentage=round(min(100.0, (tot_fat / max(fat_target, 1)) * 100), 1)
        ),
        fiber=MacroProgress(
            consumed=round(tot_fib, 1),
            target=fiber_target,
            remaining=round(max(0.0, fiber_target - tot_fib), 1),
            percentage=round(min(100.0, (tot_fib / max(fiber_target, 1)) * 100), 1)
        ),
        water_liters=tot_water,
        water_target_liters=water_target,
        nutrition_score=score,
        meals_count=len(meals),
        logged_meals=[{"id": m.id, "type": m.meal_type.value, "cals": m.total_calories, "pro": m.total_protein} for m in meals]
    )

@router.get("/score", response_model=NutritionScoreResponse)
def get_score_details(
    target_date: Optional[date] = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query_date = target_date or date.today()
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date == query_date
    ).all()

    tot_cal = sum(m.total_calories for m in meals)
    tot_pro = sum(m.total_protein for m in meals)
    tot_fib = sum(m.total_fiber for m in meals)
    
    score, rating, breakdown = calculate_daily_nutrition_score(
        tot_cal, profile.daily_calorie_target if profile else 2000,
        tot_pro, profile.protein_target if profile else 100,
        tot_fib, profile.fiber_target if profile else 30,
        2.1, profile.water_target_liters if profile else 2.5,
        len(meals) * 2
    )

    rec = "Focus on reaching your protein target with low-calorie, high-density options like paneer bhurji or sprouts."
    if score >= 85:
        rec = "Exceptional target consistency! Continue maintaining nutrient diversity."

    return NutritionScoreResponse(
        score=score,
        rating=rating,
        breakdown=breakdown,
        recommendation=rec
    )

@router.get("/gaps", response_model=NutrientGapsResponse)
def get_nutrient_gaps(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    diet = profile.diet_type.value if profile and hasattr(profile.diet_type, "value") else "VEGETARIAN"
    
    # Get last 7 days meals
    week_ago = date.today() - timedelta(days=7)
    recent_meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date >= week_ago
    ).all()

    logged_foods = []
    for m in recent_meals:
        for it in m.items:
            if it.food:
                logged_foods.append({
                    "name": it.food.name,
                    "calcium_mg": it.food.calcium_mg * it.quantity,
                    "iron_mg": it.food.iron_mg * it.quantity,
                    "b12_mcg": it.food.b12_mcg * it.quantity,
                    "fiber": it.food.fiber * it.quantity,
                    "omega_3_g": it.food.omega_3_g * it.quantity
                })

    gaps = assess_nutrient_gaps(logged_foods, diet)
    return NutrientGapsResponse(
        assessment_period="Last 7 Days Nutrition Log",
        potential_gaps=[PotentialNutrientGap(**g) for g in gaps],
        general_disclaimer="NutriVision AI identifies potential dietary intake patterns based on recorded meals. This is strictly educational guidance and does not constitute a clinical laboratory diagnosis."
    )

@router.get("/history", response_model=List[NutritionHistoryPoint])
def get_history(
    days: int = Query(7),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_date = date.today() - timedelta(days=days - 1)
    history_points = []
    
    # Fetch all meals in range
    meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date >= start_date
    ).all()
    
    meals_by_date = {}
    for m in meals:
        d_str = m.meal_date.isoformat()
        if d_str not in meals_by_date:
            meals_by_date[d_str] = []
        meals_by_date[d_str].append(m)

    for i in range(days):
        cur_d = start_date + timedelta(days=i)
        d_str = cur_d.isoformat()
        d_meals = meals_by_date.get(d_str, [])
        
        c = sum(m.total_calories for m in d_meals)
        p = sum(m.total_protein for m in d_meals)
        cb = sum(m.total_carbs for m in d_meals)
        f = sum(m.total_fat for m in d_meals)
        fb = sum(m.total_fiber for m in d_meals)
        
        score = 80 if c > 0 else 0
        history_points.append(NutritionHistoryPoint(
            date=cur_d.strftime("%b %d"),
            calories=round(c),
            protein=round(p, 1),
            carbs=round(cb, 1),
            fat=round(f, 1),
            fiber=round(fb, 1),
            nutrition_score=score
        ))

    return history_points
