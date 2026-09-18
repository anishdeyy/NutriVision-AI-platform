export type UserRole = "USER" | "ADMIN" | "NUTRITIONIST";
export type SubscriptionPlan = "FREE" | "PRO" | "PREMIUM";
export type GoalType = "CUTTING" | "MAINTAIN" | "BULKING" | "GENERAL_HEALTH";
export type DietType = "VEGETARIAN" | "EGGETARIAN" | "VEGAN" | "NON_VEGETARIAN";
export type ActivityLevel = "SEDENTARY" | "LIGHT" | "MODERATE" | "VERY_ACTIVE";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  plan: SubscriptionPlan;
  created_at: string;
}

export interface UserProfile {
  id: number;
  user_id: number;
  age: number;
  gender: string;
  height_cm: number;
  weight_kg: number;
  target_weight?: number;
  activity_level: ActivityLevel;
  goal: GoalType;
  diet_type: DietType;
  daily_calorie_target: number;
  protein_target: number;
  carb_target: number;
  fat_target: number;
  fiber_target: number;
  water_target_liters: number;
  budget_per_day: number;
  region: string;
  allergies: string;
  food_intolerances: string;
  dislikes: string;
  preferred_cuisines: string;
  bmi: number;
  bmi_category: string;
}

export interface Food {
  id: number;
  name: string;
  regional_name?: string;
  category: string;
  serving_size: string;
  serving_weight_g: number;
  emoji: string;
  calories: number;
  protein: number;
  effective_protein: number;
  carbohydrates: number;
  fat: number;
  fiber: number;
  calcium_mg: number;
  iron_mg: number;
  b12_mcg: number;
  omega_3_g: number;
  vegetarian: boolean;
  vegan: boolean;
  contains_egg: boolean;
  protein_quality_score: number;
  bioavailability_label: string;
  price_estimate: number;
  protein_per_rupee: number;
}

export interface MealItem {
  id: number;
  food_id: number;
  quantity: number;
  serving_unit: string;
  calories: number;
  protein: number;
  effective_protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  food: Food;
}

export interface Meal {
  id: number;
  user_id: number;
  meal_type: "BREAKFAST" | "LUNCH" | "DINNER" | "SNACK" | "PRE_WORKOUT" | "POST_WORKOUT";
  meal_date: string;
  notes: string;
  total_calories: number;
  total_protein: number;
  total_effective_protein: number;
  total_carbs: number;
  total_fat: number;
  total_fiber: number;
  created_at: string;
  items: MealItem[];
}

export interface MacroProgress {
  consumed: number;
  target: number;
  remaining: number;
  percentage: number;
}

export interface DailyNutritionSummary {
  date: string;
  calories: MacroProgress;
  protein: MacroProgress;
  effective_protein: number;
  carbs: MacroProgress;
  fat: MacroProgress;
  fiber: MacroProgress;
  water_liters: number;
  water_target_liters: number;
  nutrition_score: number;
  meals_count: number;
  logged_meals: Array<{ id: number; type: string; cals: number; pro: number }>;
}

export interface NutritionScoreBreakdown {
  category: string;
  points_earned: number;
  max_points: number;
  feedback: string;
}

export interface NutritionScoreResponse {
  score: number;
  rating: string;
  breakdown: NutritionScoreBreakdown[];
  recommendation: string;
}

export interface PotentialNutrientGap {
  nutrient: string;
  status: string;
  estimated_intake: string;
  standard_target: string;
  sources_detected: string[];
  suggested_foods: string[];
  safety_disclaimer: string;
}

export interface SourceCitation {
  title: string;
  organization: string;
  year: number;
  url: string;
  topic: string;
  snippet: string;
}

export interface RecommendationItem {
  title: string;
  why: string;
  nutrition_impact: {
    calories: number;
    protein: number;
    carbs?: number;
    fat?: number;
    fiber?: number;
  };
  how_to_implement: string;
  time_horizon: string;
  confidence: string;
}

export interface AIChatMessage {
  id?: number;
  role: "user" | "assistant";
  content: string;
  structured_data?: RecommendationItem[];
  sources_cited?: SourceCitation[];
  clarifying_questions?: string[];
  limitations?: string[];
  created_at?: string;
}

export interface PlanInfo {
  id: "free" | "pro" | "premium";
  name: string;
  price_inr: number;
  interval: string;
  features: string[];
  is_popular?: boolean;
}
