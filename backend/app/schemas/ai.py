from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class SourceCitation(BaseModel):
    title: str
    organization: str
    year: Optional[int] = 2024
    url: Optional[str] = ""
    topic: Optional[str] = ""
    snippet: Optional[str] = ""

class NutritionImpact(BaseModel):
    calories: Optional[float] = 0.0
    protein: Optional[float] = 0.0
    carbs: Optional[float] = 0.0
    fat: Optional[float] = 0.0
    fiber: Optional[float] = 0.0

class RecommendationItem(BaseModel):
    title: str
    why: str
    nutrition_impact: NutritionImpact
    how_to_implement: str
    time_horizon: str = "Today"  # Today, 3-7 Days, Long-Term
    confidence: str = "High"

class AIChatRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    include_rag: Optional[bool] = True

class AIChatResponse(BaseModel):
    conversation_id: int
    answer: str
    recommendations: List[RecommendationItem] = []
    clarifying_questions: List[str] = []
    sources: List[SourceCitation] = []
    limitations: List[str] = []
    user_context_used: Dict[str, Any] = {}

class WhatShouldIEatRequest(BaseModel):
    meal_type: Optional[str] = None  # BREAKFAST, LUNCH, DINNER, SNACK
    quick_prep: Optional[bool] = False

class WhatShouldIEatOption(BaseModel):
    food_name: str
    portion: str
    calories: float
    protein: float
    effective_protein: float
    carbs: float
    fat: float
    fiber: float
    estimated_cost: float
    why_selected: str

class WhatShouldIEatResponse(BaseModel):
    situation_summary: str
    remaining_calories: float
    remaining_protein: float
    options: List[WhatShouldIEatOption]

class FixMyDayResponse(BaseModel):
    current_status: str
    caloric_deficit_or_surplus: str
    protein_deficit: float
    fiber_deficit: float
    recommended_evening_strategy: str
    action_plan_meals: List[WhatShouldIEatOption]

class WeeklyReviewResponse(BaseModel):
    review_period: str
    what_went_well: List[str]
    what_needs_improvement: List[str]
    protein_consistency_score: int
    calorie_consistency_score: int
    meal_diversity_rating: str
    potential_nutrition_gaps: List[str]
    top_3_actions: List[str]

class RecipeRequest(BaseModel):
    available_ingredients: List[str]
    target_meal: Optional[str] = "Dinner"
    cooking_time_mins: Optional[int] = 30
    budget_max_inr: Optional[float] = 100.0

class RecipeResponse(BaseModel):
    recipe_name: str
    prep_time_mins: int
    cook_time_mins: int
    servings: int
    ingredients: List[Dict[str, str]]
    instructions: List[str]
    calories_per_serving: float
    protein_per_serving: float
    carbs_per_serving: float
    fat_per_serving: float
    fiber_per_serving: float
    estimated_cost_inr: float
    nutrition_notes: str

class FoodImageAnalysisRequest(BaseModel):
    image_base64: Optional[str] = None
    image_url: Optional[str] = None

class DetectedFoodItem(BaseModel):
    matched_food_id: Optional[int] = None
    food_name: str
    estimated_portion: str
    estimated_calories: float
    estimated_protein: float
    confidence_score: float

class FoodImageAnalysisResponse(BaseModel):
    detected_items: List[DetectedFoodItem]
    total_estimated_calories: float
    total_estimated_protein: float
    confirmation_prompt: str
    disclaimer: str
