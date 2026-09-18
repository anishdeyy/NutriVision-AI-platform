import random
from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.models.food import Food
from backend.app.models.profile import UserProfile
from backend.app.schemas.meal_plan import DayPlan, PlannedMeal, PlannedFoodItem, MealPlanResponse, GroceryItem, GroceryListResponse

REGIONAL_KEYWORDS = {
    "North Indian": ["roti", "dal tadka", "paneer", "rajma", "chana", "paratha", "poha", "lassi", "curd"],
    "South Indian": ["idli", "dosa", "sambar", "uttapam", "curd rice", "upma", "rasam", "medu vada"],
    "Bengali": ["fish", "rice", "dal", "moong dal", "baingan bharta", "rasgulla", "curd"],
    "Punjabi": ["paneer butter masala", "paratha", "dal makhani", "chole", "lassi", "roti", "curd"],
    "Maharashtrian": ["poha", "upma", "besan chilla", "bhindi masala", "roti", "sprouts salad", "sattu"],
    "Gujarati": ["dhokla", "khichdi", "roti", "dal", "kadhi pakoda", "chaas", "curd"]
}

def generate_meal_plan(
    db: Session,
    profile: UserProfile,
    days: int = 7,
    budget_per_day: float = 150.0,
    region: str = "North Indian"
) -> MealPlanResponse:
    # Query candidate foods matching diet
    q = db.query(Food)
    dt = profile.diet_type.value if hasattr(profile.diet_type, "value") else str(profile.diet_type)
    if "VEGAN" in dt.upper():
        q = q.filter(Food.vegan == True)
    elif "VEGETARIAN" in dt.upper():
        q = q.filter(Food.vegetarian == True)
    elif "EGGETARIAN" in dt.upper():
        q = q.filter((Food.vegetarian == True) | (Food.contains_egg == True))

    all_foods = q.all()
    if not all_foods:
        all_foods = db.query(Food).limit(50).all()

    # Categorize foods
    breakfast_candidates = [f for f in all_foods if f.category in ["Breakfast", "Bread", "Dairy", "South Indian", "Fruit"] or any(k in f.name.lower() for k in ["poha", "upma", "idli", "dosa", "egg", "oats", "chilla"])]
    main_candidates = [f for f in all_foods if f.category in ["Dal", "Curry", "Rice", "Bread", "Non-Veg"] or any(k in f.name.lower() for k in ["dal", "paneer", "chicken", "rajma", "chana", "roti", "rice"])]
    snack_candidates = [f for f in all_foods if f.category in ["Snack", "Dairy", "Beverage", "Fruit"] or any(k in f.name.lower() for k in ["chana", "sprouts", "curd", "makhana", "almonds", "tea", "coffee"])]

    # Fallbacks if list is empty
    if not breakfast_candidates: breakfast_candidates = all_foods
    if not main_candidates: main_candidates = all_foods
    if not snack_candidates: snack_candidates = all_foods

    days_list: List[DayPlan] = []
    day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

    calorie_target = profile.daily_calorie_target or 2000
    protein_target = profile.protein_target or 100.0

    for i in range(1, days + 1):
        day_name = day_names[(i - 1) % 7]
        
        # Select items for breakfast (~25% cals)
        b_food1 = random.choice(breakfast_candidates)
        b_food2 = random.choice(snack_candidates)
        b_items = [
            PlannedFoodItem(
                food_id=b_food1.id,
                name=b_food1.name,
                portion=b_food1.serving_size,
                calories=b_food1.calories,
                protein=b_food1.protein,
                carbs=b_food1.carbohydrates,
                fat=b_food1.fat,
                fiber=b_food1.fiber,
                estimated_cost=b_food1.price_estimate
            ),
            PlannedFoodItem(
                food_id=b_food2.id,
                name=b_food2.name,
                portion=b_food2.serving_size,
                calories=b_food2.calories,
                protein=b_food2.protein,
                carbs=b_food2.carbohydrates,
                fat=b_food2.fat,
                fiber=b_food2.fiber,
                estimated_cost=b_food2.price_estimate
            )
        ]
        b_cals = sum(it.calories for it in b_items)
        b_pro = sum(it.protein for it in b_items)
        b_cost = sum(it.estimated_cost for it in b_items)
        b_meal = PlannedMeal(meal_type="Breakfast", time_hint="08:30 AM", items=b_items, meal_calories=b_cals, meal_protein=b_pro, meal_cost=b_cost)

        # Lunch (~35% cals)
        l_staple = [f for f in main_candidates if "roti" in f.name.lower() or "rice" in f.name.lower()]
        l_protein = [f for f in main_candidates if f.protein >= 8.0]
        f_staple = random.choice(l_staple) if l_staple else random.choice(main_candidates)
        f_curry = random.choice(l_protein) if l_protein else random.choice(main_candidates)
        
        l_items = [
            PlannedFoodItem(food_id=f_staple.id, name=f_staple.name, portion=f_staple.serving_size, calories=f_staple.calories, protein=f_staple.protein, carbs=f_staple.carbohydrates, fat=f_staple.fat, fiber=f_staple.fiber, estimated_cost=f_staple.price_estimate),
            PlannedFoodItem(food_id=f_curry.id, name=f_curry.name, portion=f_curry.serving_size, calories=f_curry.calories, protein=f_curry.protein, carbs=f_curry.carbohydrates, fat=f_curry.fat, fiber=f_curry.fiber, estimated_cost=f_curry.price_estimate)
        ]
        l_cals = sum(it.calories for it in l_items)
        l_pro = sum(it.protein for it in l_items)
        l_cost = sum(it.estimated_cost for it in l_items)
        l_meal = PlannedMeal(meal_type="Lunch", time_hint="01:30 PM", items=l_items, meal_calories=l_cals, meal_protein=l_pro, meal_cost=l_cost)

        # Snack (~10% cals)
        s_food = random.choice(snack_candidates)
        s_items = [PlannedFoodItem(food_id=s_food.id, name=s_food.name, portion=s_food.serving_size, calories=s_food.calories, protein=s_food.protein, carbs=s_food.carbohydrates, fat=s_food.fat, fiber=s_food.fiber, estimated_cost=s_food.price_estimate)]
        s_meal = PlannedMeal(meal_type="Evening Snack", time_hint="05:00 PM", items=s_items, meal_calories=s_food.calories, meal_protein=s_food.protein, meal_cost=s_food.price_estimate)

        # Dinner (~30% cals)
        d_curry = random.choice(main_candidates)
        d_side = random.choice(main_candidates)
        d_items = [
            PlannedFoodItem(food_id=d_curry.id, name=d_curry.name, portion=d_curry.serving_size, calories=d_curry.calories, protein=d_curry.protein, carbs=d_curry.carbohydrates, fat=d_curry.fat, fiber=d_curry.fiber, estimated_cost=d_curry.price_estimate),
            PlannedFoodItem(food_id=d_side.id, name=d_side.name, portion=d_side.serving_size, calories=d_side.calories, protein=d_side.protein, carbs=d_side.carbohydrates, fat=d_side.fat, fiber=d_side.fiber, estimated_cost=d_side.price_estimate)
        ]
        d_cals = sum(it.calories for it in d_items)
        d_pro = sum(it.protein for it in d_items)
        d_cost = sum(it.estimated_cost for it in d_items)
        d_meal = PlannedMeal(meal_type="Dinner", time_hint="08:30 PM", items=d_items, meal_calories=d_cals, meal_protein=d_pro, meal_cost=d_cost)

        all_day_meals = [b_meal, l_meal, s_meal, d_meal]
        day_plan = DayPlan(
            day_number=i,
            day_name=f"{day_name} (Day {i})",
            meals=all_day_meals,
            total_calories=round(sum(m.meal_calories for m in all_day_meals)),
            total_protein=round(sum(m.meal_protein for m in all_day_meals), 1),
            total_carbs=round(sum(sum(it.carbs for it in m.items) for m in all_day_meals), 1),
            total_fat=round(sum(sum(it.fat for it in m.items) for m in all_day_meals), 1),
            total_fiber=round(sum(sum(it.fiber for it in m.items) for m in all_day_meals), 1),
            total_cost=round(sum(m.meal_cost for m in all_day_meals), 1)
        )
        days_list.append(day_plan)

    avg_cals = round(sum(d.total_calories for d in days_list) / len(days_list))
    avg_pro = round(sum(d.total_protein for d in days_list) / len(days_list), 1)
    avg_cost = round(sum(d.total_cost for d in days_list) / len(days_list), 1)

    return MealPlanResponse(
        plan_id=f"mp_{profile.user_id}_{days}d",
        duration_days=days,
        daily_budget_target=budget_per_day,
        region_mode=region,
        days=days_list,
        average_daily_calories=avg_cals,
        average_daily_protein=avg_pro,
        average_daily_cost=avg_cost,
        dietary_alignment_notes=f"Optimized for {profile.goal.value if hasattr(profile.goal, 'value') else profile.goal} with ₹{budget_per_day}/day target."
    )

def generate_grocery_list_from_plan(meal_plan: MealPlanResponse) -> GroceryListResponse:
    item_frequencies: Dict[str, Dict[str, Any]] = {}
    for d in meal_plan.days:
        for m in d.meals:
            for it in m.items:
                if it.name not in item_frequencies:
                    item_frequencies[it.name] = {
                        "count": 0,
                        "cost": it.estimated_cost,
                        "portion": it.portion
                    }
                item_frequencies[it.name]["count"] += 1

    grocery_items: List[GroceryItem] = []
    category_totals: Dict[str, float] = {
        "Dairy": 0.0,
        "Legumes & Pulses": 0.0,
        "Grains & Breads": 0.0,
        "Vegetables": 0.0,
        "Fruits": 0.0,
        "Snacks & Health": 0.0
    }

    for name, data in item_frequencies.items():
        lower = name.lower()
        if any(w in lower for w in ["paneer", "curd", "milk", "dahi", "lassi", "yogurt", "cheese"]):
            cat = "Dairy"
        elif any(w in lower for w in ["dal", "chana", "rajma", "moong", "soya", "sprouts", "chole"]):
            cat = "Legumes & Pulses"
        elif any(w in lower for w in ["roti", "rice", "paratha", "naan", "poha", "upma", "idli", "dosa"]):
            cat = "Grains & Breads"
        elif any(w in lower for w in ["palak", "gobi", "bhindi", "baingan", "vegetable", "salad", "aloo"]):
            cat = "Vegetables"
        elif any(w in lower for w in ["banana", "apple", "papaya", "mango"]):
            cat = "Fruits"
        else:
            cat = "Snacks & Health"

        total_item_cost = round(data["cost"] * data["count"], 1)
        category_totals[cat] = round(category_totals.get(cat, 0.0) + total_item_cost, 1)

        grocery_items.append(GroceryItem(
            category=cat,
            item_name=name,
            total_quantity=f"{data['count']} × {data['portion']}",
            estimated_cost_inr=total_item_cost,
            is_purchased=False
        ))

    return GroceryListResponse(
        plan_id=meal_plan.plan_id,
        items=grocery_items,
        estimated_weekly_cost=round(sum(category_totals.values()), 1),
        category_totals=category_totals
    )
