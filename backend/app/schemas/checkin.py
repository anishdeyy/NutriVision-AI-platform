from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict

class DailyCheckinCreate(BaseModel):
    date: Optional[date] = None
    energy_score: int = 3
    hunger_score: int = 3
    sleep_quality: str = "Average"
    workout_level: str = "Light"
    water_ml: int = 2000
    notes: Optional[str] = None

class DailyCheckinResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int
    date: date
    energy_score: int
    hunger_score: int
    sleep_quality: str
    workout_level: str
    water_ml: int
    notes: Optional[str] = None
    created_at: datetime
