from datetime import date, datetime
from sqlalchemy import Column, Integer, String, Float, Date, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class DailyCheckin(Base):
    __tablename__ = "daily_checkins"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    date = Column(Date, default=date.today, nullable=False, index=True)
    energy_score = Column(Integer, default=3)              # 1 to 5
    hunger_score = Column(Integer, default=3)              # 1 to 5
    sleep_quality = Column(String(50), default="Average")  # Poor, Average, Good, Excellent
    workout_level = Column(String(50), default="Light")    # No, Light, Moderate, Hard
    water_ml = Column(Integer, default=2000)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", backref="checkins")
