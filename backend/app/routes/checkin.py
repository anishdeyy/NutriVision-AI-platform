from datetime import date, timedelta
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.checkin import DailyCheckin
from backend.app.schemas.checkin import DailyCheckinCreate, DailyCheckinResponse
from backend.app.services.auth_service import get_current_user

router = APIRouter(prefix="/api/checkins", tags=["checkins"])

@router.get("/today", response_model=Optional[DailyCheckinResponse])
def get_today_checkin(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.date == date.today()
    ).first()
    return checkin

@router.post("", response_model=DailyCheckinResponse)
def save_daily_checkin(
    data: DailyCheckinCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    target_date = data.date or date.today()
    checkin = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.date == target_date
    ).first()

    if checkin:
        checkin.energy_score = data.energy_score
        checkin.hunger_score = data.hunger_score
        checkin.sleep_quality = data.sleep_quality
        checkin.workout_level = data.workout_level
        checkin.water_ml = data.water_ml
        checkin.notes = data.notes
    else:
        checkin = DailyCheckin(
            user_id=current_user.id,
            date=target_date,
            energy_score=data.energy_score,
            hunger_score=data.hunger_score,
            sleep_quality=data.sleep_quality,
            workout_level=data.workout_level,
            water_ml=data.water_ml,
            notes=data.notes
        )
        db.add(checkin)

    db.commit()
    db.refresh(checkin)
    return checkin

@router.get("/history", response_model=List[DailyCheckinResponse])
def get_checkin_history(
    days: int = Query(30, ge=1, le=90),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    start_date = date.today() - timedelta(days=days)
    checkins = db.query(DailyCheckin).filter(
        DailyCheckin.user_id == current_user.id,
        DailyCheckin.date >= start_date
    ).order_by(DailyCheckin.date.desc()).all()
    return checkins
