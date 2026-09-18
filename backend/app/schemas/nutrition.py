from datetime import date
from pydantic import BaseModel
from typing import List, Optional, Dict

class MacroProgress(BaseModel):
    consumed: float
    target: float
    remaining: float
    percentage: float

class DailyNutritionSummary(BaseModel):
    date: date
    calories: MacroProgress
    protein: MacroProgress
    effective_protein: float
    carbs: MacroProgress
    fat: MacroProgress
    fiber: MacroProgress
    water_liters: float
    water_target_liters: float
    nutrition_score: int
    meals_count: int
    logged_meals: List[Dict]

class NutritionScoreBreakdown(BaseModel):
    category: str
    points_earned: int
    max_points: int
    feedback: str

class NutritionScoreResponse(BaseModel):
    score: int
    rating: str  # Excellent, Good, Needs Attention
    breakdown: List[NutritionScoreBreakdown]
    recommendation: str

class PotentialNutrientGap(BaseModel):
    nutrient: str
    status: str  # "Low Intake Observed", "Adequate Intake", "Borderline"
    estimated_intake: str
    standard_target: str
    sources_detected: List[str]
    suggested_foods: List[str]
    safety_disclaimer: str

class NutrientGapsResponse(BaseModel):
    assessment_period: str
    potential_gaps: List[PotentialNutrientGap]
    general_disclaimer: str

class NutritionHistoryPoint(BaseModel):
    date: str
    calories: float
    protein: float
    carbs: float
    fat: float
    fiber: float
    nutrition_score: int
