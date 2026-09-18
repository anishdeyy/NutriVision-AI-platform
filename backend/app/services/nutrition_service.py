from typing import Dict, List, Tuple
from datetime import date
from backend.app.models.profile import GoalType, ActivityLevel, DietType

def compute_bmi(weight_kg: float, height_cm: float) -> Tuple[float, str]:
    if height_cm <= 0:
        return 0.0, "Unknown"
    h_m = height_cm / 100.0
    bmi = round(weight_kg / (h_m * h_m), 1)
    if bmi < 18.5:
        category = "Underweight"
    elif bmi < 25.0:
        category = "Normal"
    elif bmi < 30.0:
        category = "Overweight"
    else:
        category = "Obese"
    return bmi, category

def calculate_targets(
    age: int,
    gender: str,
    height_cm: float,
    weight_kg: float,
    goal: str,
    activity_level: str
) -> Dict[str, float]:
    bmi, bmi_cat = compute_bmi(weight_kg, height_cm)
    
    # Mifflin-St Jeor BMR
    if gender.lower() == "female":
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 161
    else:
        bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age + 5
        
    activity_multipliers = {
        "SEDENTARY": 1.2,
        "LIGHT": 1.375,
        "MODERATE": 1.55,
        "VERY_ACTIVE": 1.725
    }
    multiplier = activity_multipliers.get(str(activity_level).upper(), 1.55)
    tdee = bmr * multiplier

    goal_str = str(goal).upper()
    if goal_str == "CUTTING":
        calories = round(tdee - 350)
        protein_per_kg = 2.0
    elif goal_str == "BULKING":
        calories = round(tdee + 300)
        protein_per_kg = 2.2
    else:  # MAINTAIN or GENERAL_HEALTH
        calories = round(tdee)
        protein_per_kg = 1.6

    protein = round(weight_kg * protein_per_kg)
    fat = round((calories * 0.25) / 9)
    carbs = round(max(50, (calories - (protein * 4) - (fat * 9)) / 4))
    fiber = 30.0
    water = round(max(2.0, weight_kg * 0.035), 1)

    return {
        "calories": calories,
        "protein": protein,
        "carbs": carbs,
        "fat": fat,
        "fiber": fiber,
        "water_liters": water,
        "bmi": bmi,
        "bmi_category": bmi_cat
    }

def calculate_daily_nutrition_score(
    cals_consumed: float,
    cals_target: float,
    pro_consumed: float,
    pro_target: float,
    fiber_consumed: float,
    fiber_target: float,
    water_consumed: float,
    water_target: float,
    food_diversity_count: int
) -> Tuple[int, str, List[Dict]]:
    breakdown = []
    
    # 1. Caloric Adherence (max 25 pts)
    if cals_target > 0:
        ratio = cals_consumed / cals_target
        if 0.90 <= ratio <= 1.10:
            cal_pts = 25
            cal_feed = "Optimal caloric balance within 10% of target."
        elif 0.80 <= ratio <= 1.20:
            cal_pts = 18
            cal_feed = "Moderate caloric adherence within 20% of target."
        elif 0.65 <= ratio <= 1.35:
            cal_pts = 12
            cal_feed = "Caloric intake significantly diverged from target."
        else:
            cal_pts = 5
            cal_feed = "Substantial calorie deficit or surplus today."
    else:
        cal_pts = 15
        cal_feed = "No calorie target configured."
    breakdown.append({"category": "Caloric Balance", "points_earned": cal_pts, "max_points": 25, "feedback": cal_feed})

    # 2. Protein Target Adherence (max 30 pts)
    if pro_target > 0:
        pro_ratio = pro_consumed / pro_target
        if pro_ratio >= 0.95:
            pro_pts = 30
            pro_feed = "Excellent! Hit 95%+ of your protein requirement."
        elif pro_ratio >= 0.80:
            pro_pts = 24
            pro_feed = "Good protein intake (80–94% of target)."
        elif pro_ratio >= 0.60:
            pro_pts = 16
            pro_feed = "Protein intake lagging; consider protein-dense evening choices."
        else:
            pro_pts = 8
            pro_feed = "Significantly below protein goal."
    else:
        pro_pts = 15
        pro_feed = "No protein target set."
    breakdown.append({"category": "Protein Sufficiency", "points_earned": pro_pts, "max_points": 30, "feedback": pro_feed})

    # 3. Dietary Fiber (max 15 pts)
    if fiber_target > 0:
        fib_ratio = fiber_consumed / fiber_target
        if fib_ratio >= 0.90:
            fib_pts = 15
            fib_feed = "Outstanding fiber intake supporting gut microbiome and satiety."
        elif fib_ratio >= 0.70:
            fib_pts = 11
            fib_feed = "Moderate fiber intake (70–89% of target)."
        else:
            fib_pts = 6
            fib_feed = "Low fiber intake; incorporate more whole grains and legumes."
    else:
        fib_pts = 10
        fib_feed = "Target 30g+ of dietary fiber daily."
    breakdown.append({"category": "Dietary Fiber", "points_earned": fib_pts, "max_points": 15, "feedback": fib_feed})

    # 4. Food Diversity (max 15 pts)
    if food_diversity_count >= 7:
        div_pts = 15
        div_feed = "High dietary variety across distinct food groups."
    elif food_diversity_count >= 4:
        div_pts = 11
        div_feed = "Moderate food variety."
    else:
        div_pts = 6
        div_feed = "Limited food diversity; diversify your staples and vegetables."
    breakdown.append({"category": "Nutrient Diversity", "points_earned": div_pts, "max_points": 15, "feedback": div_feed})

    # 5. Hydration (max 15 pts)
    if water_target > 0:
        wat_ratio = water_consumed / water_target
        if wat_ratio >= 0.90:
            wat_pts = 15
            wat_feed = "Optimal hydration achieved."
        elif wat_ratio >= 0.70:
            wat_pts = 11
            wat_feed = "Adequate water intake."
        else:
            wat_pts = 6
            wat_feed = "Below hydration target; drink more water."
    else:
        wat_pts = 10
        wat_feed = "Aim for 2.5L+ hydration daily."
    breakdown.append({"category": "Hydration", "points_earned": wat_pts, "max_points": 15, "feedback": wat_feed})

    total_score = sum(b["points_earned"] for b in breakdown)
    if total_score >= 85:
        rating = "Excellent"
    elif total_score >= 70:
        rating = "Good"
    elif total_score >= 50:
        rating = "Fair"
    else:
        rating = "Needs Attention"

    return total_score, rating, breakdown

def assess_nutrient_gaps(logged_foods: List[Dict], diet_type: str) -> List[Dict]:
    """
    Identifies potential dietary gaps based on logged foods and diet classification.
    Adheres strictly to medical safety constraints: never provides diagnosis.
    """
    gaps = []
    names_str = " ".join([f.get("name", "").lower() for f in logged_foods])
    total_calcium = sum(f.get("calcium_mg", 0) for f in logged_foods)
    total_iron = sum(f.get("iron_mg", 0) for f in logged_foods)
    total_b12 = sum(f.get("b12_mcg", 0) for f in logged_foods)
    total_fiber = sum(f.get("fiber", 0) for f in logged_foods)
    total_omega3 = sum(f.get("omega_3_g", 0) for f in logged_foods)

    # Vitamin B12
    if total_b12 < 1.0 and "VEGETARIAN" in str(diet_type).upper():
        gaps.append({
            "nutrient": "Vitamin B12",
            "status": "Potential Dietary Gap",
            "estimated_intake": f"~{round(total_b12, 1)} mcg / day",
            "standard_target": "2.2 - 2.5 mcg / day (ICMR-NIN)",
            "sources_detected": ["Dairy in modest quantities"] if ("paneer" in names_str or "milk" in names_str or "curd" in names_str) else ["None detected"],
            "suggested_foods": ["Fortified plant milk", "Paneer", "Greek Curd", "Whole Eggs (if eggetarian)"],
            "safety_disclaimer": "This assessment highlights potential dietary gaps based on logged intake. It is not a clinical diagnosis. Consult a physician or registered dietitian for laboratory blood testing."
        })

    # Iron
    if total_iron < 12.0:
        gaps.append({
            "nutrient": "Iron (Non-Heme)",
            "status": "Moderate Gap Observed",
            "estimated_intake": f"~{round(total_iron, 1)} mg / day",
            "standard_target": "19 mg / day (Adults)",
            "sources_detected": [f for f in ["Palak", "Dal", "Chana", "Poha"] if f.lower() in names_str] or ["Limited"],
            "suggested_foods": ["Palak / Spinach", "Sprouted Moong", "Roasted Chana", "Poha", "Add fresh lemon juice (Vitamin C) to enhance absorption"],
            "safety_disclaimer": "Non-heme plant iron absorption is enhanced 2-3x when paired with ascorbic acid (Vitamin C). Avoid drinking tea or coffee within 1 hour of meals."
        })

    # Calcium
    if total_calcium < 600:
        gaps.append({
            "nutrient": "Calcium",
            "status": "Potential Gap Observed",
            "estimated_intake": f"~{round(total_calcium)} mg / day",
            "standard_target": "1000 mg / day (ICMR-NIN)",
            "sources_detected": [f for f in ["Curd", "Milk", "Paneer"] if f.lower() in names_str] or ["Minimal"],
            "suggested_foods": ["Ragi (Finger Millet)", "Curd / Dahi (200g)", "Paneer (100g)", "Sesame Seeds (Til Chikki)"],
            "safety_disclaimer": "Adequate calcium intake together with Vitamin D is essential for skeletal mineralization."
        })

    # Omega-3
    if total_omega3 < 1.0 and "NON_VEGETARIAN" not in str(diet_type).upper():
        gaps.append({
            "nutrient": "Omega-3 Fatty Acids (ALA)",
            "status": "Low Intake Observed",
            "estimated_intake": f"~{round(total_omega3, 2)} g / day",
            "standard_target": "1.1 - 1.6 g / day",
            "sources_detected": ["Limited plant seeds"],
            "suggested_foods": ["Flaxseeds (Alsi) 1 tbsp", "Chia seeds", "Walnuts (28g)", "Fatty fish (if non-veg)"],
            "safety_disclaimer": "Vegetarian sources provide alpha-linolenic acid (ALA). Ensure consistent daily intake."
        })

    return gaps
