import enum
from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class GoalType(str, enum.Enum):
    CUTTING = "CUTTING"
    MAINTAIN = "MAINTAIN"
    BULKING = "BULKING"
    GENERAL_HEALTH = "GENERAL_HEALTH"

class DietType(str, enum.Enum):
    VEGETARIAN = "VEGETARIAN"
    EGGETARIAN = "EGGETARIAN"
    VEGAN = "VEGAN"
    NON_VEGETARIAN = "NON_VEGETARIAN"

class ActivityLevel(str, enum.Enum):
    SEDENTARY = "SEDENTARY"
    LIGHT = "LIGHT"
    MODERATE = "MODERATE"
    VERY_ACTIVE = "VERY_ACTIVE"

class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    
    age = Column(Integer, default=25)
    gender = Column(String(20), default="male")
    height_cm = Column(Float, default=170.0)
    weight_kg = Column(Float, default=70.0)
    target_weight = Column(Float, nullable=True)
    activity_level = Column(Enum(ActivityLevel), default=ActivityLevel.MODERATE)
    goal = Column(Enum(GoalType), default=GoalType.MAINTAIN)
    diet_type = Column(Enum(DietType), default=DietType.VEGETARIAN)
    
    # Nutritional Targets
    daily_calorie_target = Column(Integer, default=2000)
    protein_target = Column(Float, default=100.0)
    carb_target = Column(Float, default=250.0)
    fat_target = Column(Float, default=65.0)
    fiber_target = Column(Float, default=30.0)
    water_target_liters = Column(Float, default=2.5)
    
    # Financial & Cultural
    budget_per_day = Column(Float, default=150.0)  # INR
    region = Column(String(50), default="North Indian")
    
    # Preferences & Restrictions (comma-separated or JSON string)
    allergies = Column(Text, default="")
    food_intolerances = Column(Text, default="")
    dislikes = Column(Text, default="")
    preferred_cuisines = Column(Text, default="Indian")

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="profile")
