from datetime import date, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.meal import Meal, MealItem, MealType
from backend.app.models.profile import UserProfile
from backend.app.models.checkin import DailyCheckin
from backend.app.services.auth_service import get_current_user
from backend.app.services.nutrition_service import calculate_daily_nutrition_score

router = APIRouter(prefix="/api/analytics", tags=["analytics"])

def _get_user_history_data(db: Session, user_id: int, days: int):
    profile = db.query(UserProfile).filter(UserProfile.user_id == user_id).first()
    start_date = date.today() - timedelta(days=days - 1)

    meals = db.query(Meal).filter(
        Meal.user_id == user_id,
        Meal.meal_date >= start_date
    ).all()

    meals_by_date: Dict[str, List[Meal]] = {}
    for m in meals:
        d_str = m.meal_date.isoformat()
        if d_str not in meals_by_date:
            meals_by_date[d_str] = []
        meals_by_date[d_str].append(m)

    dates = []
    formatted_dates = []
    calories = []
    target_calories = []
    protein = []
    target_protein = []
    carbs = []
    fat = []
    fiber = []
    scores = []

    target_cal = float(profile.daily_calorie_target if profile else 2000)
    target_pro = float(profile.protein_target if profile else 100)
    target_fib = float(profile.fiber_target if profile else 30)
    target_water = float(profile.water_target_liters if profile else 2.5)

    for i in range(days):
        cur_d = start_date + timedelta(days=i)
        d_str = cur_d.isoformat()
        dates.append(d_str)
        formatted_dates.append(cur_d.strftime("%b %d"))
        target_calories.append(target_cal)
        target_protein.append(target_pro)

        d_meals = meals_by_date.get(d_str, [])
        c = sum(m.total_calories for m in d_meals)
        p = sum(m.total_protein for m in d_meals)
        cb = sum(m.total_carbs for m in d_meals)
        ft = sum(m.total_fat for m in d_meals)
        fb = sum(m.total_fiber for m in d_meals)

        calories.append(round(c))
        protein.append(round(p, 1))
        carbs.append(round(cb, 1))
        fat.append(round(ft, 1))
        fiber.append(round(fb, 1))

        if c > 0:
            distinct_foods = len({it.food_id for m in d_meals for it in m.items})
            score, _, _ = calculate_daily_nutrition_score(
                c, target_cal, p, target_pro, fb, target_fib, 2.5, target_water, distinct_foods
            )
            scores.append(score)
        else:
            scores.append(0)

    return {
        "dates": dates,
        "formatted_dates": formatted_dates,
        "calories": calories,
        "target_calories": target_calories,
        "protein": protein,
        "target_protein": target_protein,
        "carbs": carbs,
        "fat": fat,
        "fiber": fiber,
        "scores": scores,
        "days": days
    }

@router.get("/trends")
def get_trends(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _get_user_history_data(db, current_user.id, days)

@router.get("/daily")
def get_daily_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    return _get_user_history_data(db, current_user.id, 1)

@router.get("/weekly")
def get_weekly_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = _get_user_history_data(db, current_user.id, 7)
    valid_cals = [c for c in data["calories"] if c > 0]
    valid_pro = [p for p in data["protein"] if p > 0]
    valid_scores = [s for s in data["scores"] if s > 0]

    return {
        **data,
        "avg_calories": round(sum(valid_cals) / max(1, len(valid_cals))),
        "avg_protein": round(sum(valid_pro) / max(1, len(valid_pro)), 1),
        "avg_score": round(sum(valid_scores) / max(1, len(valid_scores))),
        "days_logged": len(valid_cals)
    }

@router.get("/monthly")
def get_monthly_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = _get_user_history_data(db, current_user.id, 30)
    valid_cals = [c for c in data["calories"] if c > 0]
    valid_pro = [p for p in data["protein"] if p > 0]
    valid_scores = [s for s in data["scores"] if s > 0]

    # Calculate meal consistency
    start_date = date.today() - timedelta(days=29)
    meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date >= start_date
    ).all()

    bfast_count = len({m.meal_date for m in meals if m.meal_type == MealType.BREAKFAST})
    lunch_count = len({m.meal_date for m in meals if m.meal_type == MealType.LUNCH})
    dinner_count = len({m.meal_date for m in meals if m.meal_type == MealType.DINNER})
    snack_count = len({m.meal_date for m in meals if m.meal_type == MealType.SNACK})

    return {
        **data,
        "avg_calories": round(sum(valid_cals) / max(1, len(valid_cals))),
        "avg_protein": round(sum(valid_pro) / max(1, len(valid_pro)), 1),
        "avg_score": round(sum(valid_scores) / max(1, len(valid_scores))),
        "meal_consistency": {
            "breakfast": bfast_count,
            "lunch": lunch_count,
            "dinner": dinner_count,
            "snacks": snack_count,
            "total_days": 30
        }
    }

@router.get("/macros")
def get_macros_analytics(
    days: int = Query(7, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = _get_user_history_data(db, current_user.id, days)
    valid_count = max(1, len([c for c in data["calories"] if c > 0]))

    tot_p = sum(data["protein"]) / valid_count
    tot_cb = sum(data["carbs"]) / valid_count
    tot_ft = sum(data["fat"]) / valid_count
    tot_cal = sum(data["calories"]) / valid_count

    pro_energy = tot_p * 4
    carb_energy = tot_cb * 4
    fat_energy = tot_ft * 9
    total_energy = max(1.0, pro_energy + carb_energy + fat_energy)

    return {
        "protein_grams": round(tot_p, 1),
        "carbs_grams": round(tot_cb, 1),
        "fat_grams": round(tot_ft, 1),
        "calories": round(tot_cal),
        "protein_pct": round((pro_energy / total_energy) * 100, 1),
        "carbs_pct": round((carb_energy / total_energy) * 100, 1),
        "fat_pct": round((fat_energy / total_energy) * 100, 1)
    }

@router.get("/adherence")
def get_adherence_analytics(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = _get_user_history_data(db, current_user.id, 14)
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    target_c = profile.daily_calorie_target if profile else 2000
    target_p = profile.protein_target if profile else 100

    cal_diffs = [abs(c - target_c) / target_c for c in data["calories"] if c > 0]
    pro_diffs = [abs(p - target_p) / target_p for p in data["protein"] if p > 0]

    cal_adherence = round(max(0, 100 - (sum(cal_diffs) / max(1, len(cal_diffs)) * 100)))
    pro_adherence = round(max(0, 100 - (sum(pro_diffs) / max(1, len(pro_diffs)) * 100)))

    return {
        "calorie_adherence_pct": cal_adherence,
        "protein_adherence_pct": pro_adherence,
        "overall_score": round((cal_adherence * 0.45) + (pro_adherence * 0.55)),
        "rating": "High Consistency" if pro_adherence > 75 else "Moderate Consistency"
    }

@router.get("/nutrition-score")
def get_nutrition_score_trend(
    days: int = Query(14, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    data = _get_user_history_data(db, current_user.id, days)
    return {
        "dates": data["formatted_dates"],
        "scores": data["scores"],
        "target_score": 80
    }
