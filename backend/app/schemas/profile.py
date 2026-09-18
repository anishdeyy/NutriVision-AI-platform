from pydantic import BaseModel
from typing import Optional, List
from backend.app.models.profile import GoalType, DietType, ActivityLevel

class ProfileUpdate(BaseModel):
    age: Optional[int] = None
    gender: Optional[str] = None
    height_cm: Optional[float] = None
    weight_kg: Optional[float] = None
    target_weight: Optional[float] = None
    activity_level: Optional[ActivityLevel] = None
    goal: Optional[GoalType] = None
    diet_type: Optional[DietType] = None
    daily_calorie_target: Optional[int] = None
    protein_target: Optional[float] = None
    carb_target: Optional[float] = None
    fat_target: Optional[float] = None
    fiber_target: Optional[float] = None
    water_target_liters: Optional[float] = None
    budget_per_day: Optional[float] = None
    region: Optional[str] = None
    allergies: Optional[str] = None
    food_intolerances: Optional[str] = None
    dislikes: Optional[str] = None
    preferred_cuisines: Optional[str] = None

class ProfileResponse(BaseModel):
    id: int
    user_id: int
    age: int
    gender: str
    height_cm: float
    weight_kg: float
    target_weight: Optional[float] = None
    activity_level: ActivityLevel
    goal: GoalType
    diet_type: DietType
    daily_calorie_target: int
    protein_target: float
    carb_target: float
    fat_target: float
    fiber_target: float
    water_target_liters: float
    budget_per_day: float
    region: str
    allergies: str
    food_intolerances: str
    dislikes: str
    preferred_cuisines: str
    bmi: float
    bmi_category: str

    class Config:
        from_attributes = True

class NaturalLanguageProfileInput(BaseModel):
    prompt: str  # e.g. "I'm 21, 65kg, 5'8, vegetarian except eggs, want to lose fat, ₹150 budget"

class ParsedProfileConfirmation(BaseModel):
    age: Optional[int] = None
    weight_kg: Optional[float] = None
    height_cm: Optional[float] = None
    goal: Optional[str] = None
    diet_type: Optional[str] = None
    activity_level: Optional[str] = None
    budget_per_day: Optional[float] = None
    region: Optional[str] = None
    allergies: Optional[str] = None
    explanation: str
