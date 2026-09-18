import enum
from datetime import datetime, date
from sqlalchemy import Column, Integer, Float, String, Enum, ForeignKey, DateTime, Date, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class MealType(str, enum.Enum):
    BREAKFAST = "BREAKFAST"
    LUNCH = "LUNCH"
    DINNER = "DINNER"
    SNACK = "SNACK"
    PRE_WORKOUT = "PRE_WORKOUT"
    POST_WORKOUT = "POST_WORKOUT"

class Meal(Base):
    __tablename__ = "meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    meal_type = Column(Enum(MealType), default=MealType.LUNCH, nullable=False)
    meal_date = Column(Date, default=date.today, index=True, nullable=False)
    notes = Column(String(255), default="")
    
    # Aggregated totals
    total_calories = Column(Float, default=0.0)
    total_protein = Column(Float, default=0.0)
    total_effective_protein = Column(Float, default=0.0)
    total_carbs = Column(Float, default=0.0)
    total_fat = Column(Float, default=0.0)
    total_fiber = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="meals")
    items = relationship("MealItem", back_populates="meal", cascade="all, delete-orphan")

class MealItem(Base):
    __tablename__ = "meal_items"

    id = Column(Integer, primary_key=True, index=True)
    meal_id = Column(Integer, ForeignKey("meals.id"), nullable=False)
    food_id = Column(Integer, ForeignKey("foods.id"), nullable=False)
    
    quantity = Column(Float, default=1.0)
    serving_unit = Column(String(50), default="serving")
    
    # Computed based on quantity * food
    calories = Column(Float, default=0.0)
    protein = Column(Float, default=0.0)
    effective_protein = Column(Float, default=0.0)
    carbs = Column(Float, default=0.0)
    fat = Column(Float, default=0.0)
    fiber = Column(Float, default=0.0)

    # Relationships
    meal = relationship("Meal", back_populates="items")
    food = relationship("Food")
