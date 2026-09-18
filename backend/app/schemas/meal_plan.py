from pydantic import BaseModel
from typing import List, Dict, Optional

class MealPlanRequest(BaseModel):
    days: int = 7  # 1, 3, 7, 30
    budget_per_day: Optional[float] = None  # 100, 150, 200, 300
    region: Optional[str] = None  # North Indian, South Indian, Bengali, Punjabi, Gujarati, etc.
    preferred_meal_count: int = 4

class PlannedFoodItem(BaseModel):
    food_id: int
    name: str
    portion: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    estimated_cost: float

class PlannedMeal(BaseModel):
    meal_type: str  # Breakfast, Lunch, Snack, Dinner
    time_hint: str
    items: List[PlannedFoodItem]
    meal_calories: float
    meal_protein: float
    meal_cost: float

class DayPlan(BaseModel):
    day_number: int
    day_name: str
    meals: List[PlannedMeal]
    total_calories: float
    total_protein: float
    total_carbs: float
    total_fat: float
    total_fiber: float
    total_cost: float

class MealPlanResponse(BaseModel):
    plan_id: str
    duration_days: int
    daily_budget_target: float
    region_mode: str
    days: List[DayPlan]
    average_daily_calories: float
    average_daily_protein: float
    average_daily_cost: float
    dietary_alignment_notes: str

class GroceryItem(BaseModel):
    category: str  # Dairy, Legumes, Grains, Vegetables, Fruits, Spices/Oils
    item_name: str
    total_quantity: str
    estimated_cost_inr: float
    is_purchased: bool = False

class GroceryListResponse(BaseModel):
    plan_id: Optional[str] = None
    items: List[GroceryItem]
    estimated_weekly_cost: float
    category_totals: Dict[str, float]
