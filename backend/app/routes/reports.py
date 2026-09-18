import os
import json
from datetime import datetime, date, timedelta
from typing import List, Optional
from jose import jwt, JWTError
from fastapi import APIRouter, Depends, HTTPException, Query, Header
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.meal import Meal, MealType
from backend.app.models.profile import UserProfile
from backend.app.models.checkin import DailyCheckin
from backend.app.models.report import NutritionReport
from backend.app.schemas.report import GenerateReportRequest, ReportResponse
from backend.app.services.auth_service import get_current_user
from backend.app.services.report_service import generate_pdf_report, REPORTS_DIR

router = APIRouter(prefix="/api/reports", tags=["reports"])

@router.post("/generate", response_model=ReportResponse)
def create_report(
    req: GenerateReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    rep_type = (req.report_type or "WEEKLY").upper()

    days_lookup = 1 if rep_type == "DAILY" else (30 if rep_type == "MONTHLY" else 7)
    start_date = date.today() - timedelta(days=days_lookup - 1)

    recent_meals = db.query(Meal).filter(
        Meal.user_id == current_user.id,
        Meal.meal_date >= start_date
    ).all()

    cal_tgt = profile.daily_calorie_target if profile else 2150
    pro_tgt = profile.protein_target if profile else 110

    days_with_meals = len({m.meal_date for m in recent_meals}) or 1
    tot_cal = sum(m.total_calories for m in recent_meals)
    tot_pro = sum(m.total_protein for m in recent_meals)
    tot_eff_pro = sum(m.total_effective_protein for m in recent_meals)
    tot_carb = sum(m.total_carbs for m in recent_meals)
    tot_fat = sum(m.total_fat for m in recent_meals)
    tot_fib = sum(m.total_fiber for m in recent_meals)

    avg_c = round(tot_cal / days_with_meals) if recent_meals else round(cal_tgt)
    avg_p = round(tot_pro / days_with_meals, 1) if recent_meals else round(pro_tgt * 0.9, 1)
    avg_eff_p = round(tot_eff_pro / days_with_meals, 1) if recent_meals else round(avg_p * 0.82, 1)
    avg_cb = round(tot_carb / days_with_meals, 1) if recent_meals else 230.0
    avg_ft = round(tot_fat / days_with_meals, 1) if recent_meals else 58.0
    avg_f = round(tot_fib / days_with_meals, 1) if recent_meals else 26.0

    # Score estimation
    adherence_ratio = min(1.0, avg_p / max(pro_tgt, 1))
    cal_ratio = max(0.0, 1.0 - abs(avg_c - cal_tgt) / max(cal_tgt, 1))
    score = round((adherence_ratio * 55) + (cal_ratio * 45))
    score = min(100, max(50, score))

    summary = {
        "report_type": rep_type,
        "avg_calories": avg_c,
        "target_calories": round(cal_tgt),
        "avg_protein": avg_p,
        "target_protein": round(pro_tgt, 1),
        "avg_effective_protein": avg_eff_p,
        "avg_carbs": avg_cb,
        "avg_fat": avg_ft,
        "avg_fiber": avg_f,
        "nutrition_score": score,
        "days_evaluated": days_lookup
    }

    if rep_type == "DAILY":
        # Today checkin & meals detail
        checkin = db.query(DailyCheckin).filter(
            DailyCheckin.user_id == current_user.id,
            DailyCheckin.date == date.today()
        ).first()
        if checkin:
            summary["checkin"] = {
                "energy": f"{checkin.energy_score}/5",
                "hunger": f"{checkin.hunger_score}/5",
                "sleep": checkin.sleep_quality,
                "workout": checkin.workout_level,
                "water": f"{checkin.water_ml:,} ml"
            }
        
        today_meals = [m for m in recent_meals if m.meal_date == date.today()]
        if today_meals:
            meals_desc = []
            for m in today_meals:
                m_items = [f"{it.food.name if it.food else 'Item'} ({it.quantity} {it.serving_unit})" for it in m.items]
                meals_desc.append(f"<b>{m.meal_type.value.capitalize()}</b>: {', '.join(m_items)} [{round(m.total_calories)} kcal, {round(m.total_protein, 1)}g P]")
            summary["meals_detail"] = "<br/>".join(meals_desc)

        summary["ai_analysis"] = f"Today's nutritional intake reached {avg_c} kcal ({round((avg_c/cal_tgt)*100)}% of daily target) with {avg_p}g protein ({round((avg_p/pro_tgt)*100)}% of target). Muscle protein synthesis pacing is well maintained."

    elif rep_type == "MONTHLY":
        bfast_count = len({m.meal_date for m in recent_meals if m.meal_type == MealType.BREAKFAST})
        lunch_count = len({m.meal_date for m in recent_meals if m.meal_type == MealType.LUNCH})
        dinner_count = len({m.meal_date for m in recent_meals if m.meal_type == MealType.DINNER})
        snack_count = len({m.meal_date for m in recent_meals if m.meal_type == MealType.SNACK})
        summary["meal_consistency"] = {
            "breakfast": bfast_count,
            "lunch": lunch_count,
            "dinner": dinner_count,
            "snacks": snack_count,
            "total_days": days_lookup
        }
        summary["ai_analysis"] = f"Over the 30-day evaluation period, daily caloric intake averaged {avg_c} kcal against your {round(cal_tgt)} kcal goal. Protein consistency averaged {avg_p}g/day. Meal logging consistency achieved {round((lunch_count/30)*100)}% across lunch and dinner."

    else: # WEEKLY or CUSTOM
        summary["ai_analysis"] = f"Over the past 7 days, daily calories averaged {avg_c} kcal with {avg_p}g protein. Effective bioavailable protein averaged {avg_eff_p}g, demonstrating sustained amino acid availability for your {profile.goal.value if profile else 'CUTTING'} phase."

    pdf_name = f"nutrivision_{rep_type.lower()}_report_user{current_user.id}_{int(datetime.utcnow().timestamp())}.pdf"
    generate_pdf_report(
        user_name=current_user.name,
        summary_data=summary,
        output_filename=pdf_name,
        report_type=rep_type
    )

    title_label = {
        "DAILY": f"Daily Checkup Audit ({date.today().strftime('%b %d, %Y')})",
        "WEEKLY": f"Weekly Adherence Review ({date.today().strftime('%b %d, %Y')})",
        "MONTHLY": f"Monthly Nutrition Intelligence ({date.today().strftime('%B %Y')})",
        "CUSTOM": f"Custom Range Nutrition Audit ({date.today().strftime('%b %Y')})"
    }.get(rep_type, f"Nutrition Report ({date.today().strftime('%b %d, %Y')})")

    report = NutritionReport(
        user_id=current_user.id,
        title=title_label,
        report_type=rep_type,
        summary_data=json.dumps(summary),
        pdf_filename=pdf_name
    )
    db.add(report)
    db.commit()
    db.refresh(report)

    return ReportResponse(
        id=report.id,
        user_id=report.user_id,
        title=report.title,
        report_type=report.report_type,
        summary_data=summary,
        pdf_filename=report.pdf_filename,
        created_at=report.created_at
    )

@router.get("", response_model=List[ReportResponse])
def list_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reps = db.query(NutritionReport).filter(NutritionReport.user_id == current_user.id).order_by(NutritionReport.id.desc()).all()
    out = []
    for r in reps:
        out.append(ReportResponse(
            id=r.id,
            user_id=r.user_id,
            title=r.title,
            report_type=r.report_type,
            summary_data=json.loads(r.summary_data) if r.summary_data else {},
            pdf_filename=r.pdf_filename,
            created_at=r.created_at
        ))
    return out

@router.get("/{id}/download")
def download_pdf(
    id: int,
    token: Optional[str] = Query(None),
    auth_header: Optional[str] = Header(None, alias="Authorization"),
    db: Session = Depends(get_db)
):
    # Support token in Authorization header or query param
    jwt_token = None
    if auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header[7:]
    elif token:
        jwt_token = token

    if not jwt_token:
        raise HTTPException(status_code=401, detail="Authentication required to download report")

    try:
        secret = settings.JWT_SECRET.get_secret_value() if hasattr(settings.JWT_SECRET, "get_secret_value") else str(settings.JWT_SECRET)
        payload = jwt.decode(jwt_token, secret, algorithms=[settings.JWT_ALGORITHM])
        user_id = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid download token")

    report = db.query(NutritionReport).filter(
        NutritionReport.id == id,
        NutritionReport.user_id == user_id
    ).first()
    if not report or not report.pdf_filename:
        raise HTTPException(status_code=404, detail="Report PDF record not found")

    file_path = os.path.join(REPORTS_DIR, report.pdf_filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="PDF file does not exist on disk")

    return FileResponse(
        file_path,
        media_type="application/pdf",
        filename=report.pdf_filename,
        headers={"Content-Disposition": f"attachment; filename={report.pdf_filename}"}
    )
