from datetime import date, datetime
from pydantic import BaseModel
from typing import List, Optional
from backend.app.models.meal import MealType
from backend.app.schemas.food import FoodResponse

class MealItemCreate(BaseModel):
    food_id: int
    quantity: float = 1.0
    serving_unit: Optional[str] = "serving"

class MealItemResponse(BaseModel):
    id: int
    food_id: int
    quantity: float
    serving_unit: str
    calories: float
    protein: float
    effective_protein: float
    carbs: float
    fat: float
    fiber: float
    food: FoodResponse

    class Config:
        from_attributes = True

class MealCreate(BaseModel):
    meal_type: MealType = MealType.LUNCH
    meal_date: Optional[date] = None
    notes: Optional[str] = ""
    items: List[MealItemCreate]

class MealResponse(BaseModel):
    id: int
    user_id: int
    meal_type: MealType
    meal_date: date
    notes: str
    total_calories: float
    total_protein: float
    total_effective_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    created_at: datetime
    items: List[MealItemResponse]

    class Config:
        from_attributes = True

class NaturalLanguageMealParseRequest(BaseModel):
    text: str  # e.g. "2 rotis, 100g paneer and a bowl of dal"

class ParsedMealItemMatch(BaseModel):
    food_id: int
    food_name: str
    quantity: float
    unit: str
    matched_calories: float
    matched_protein: float
    matched_carbs: float
    matched_fat: float
    matched_fiber: float

class NaturalLanguageMealParseResponse(BaseModel):
    original_text: str
    parsed_items: List[ParsedMealItemMatch]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    confidence: str

class MealReplacementRequest(BaseModel):
    meal_id: int

class MealReplacementOption(BaseModel):
    name: str
    items_description: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    estimated_cost: float
    reason: str
    swap_items: List[MealItemCreate]
