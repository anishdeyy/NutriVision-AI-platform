import os
import sys
import random
from datetime import date, timedelta, datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.app.database import SessionLocal, engine, Base
from backend.app.models.user import User, UserRole, SubscriptionPlan
from backend.app.models.profile import UserProfile, GoalType, DietType, ActivityLevel
from backend.app.models.food import Food
from backend.app.models.meal import Meal, MealItem, MealType
from backend.app.models.checkin import DailyCheckin

def seed_demo_history():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@nutrivision.ai").first()
        if not user:
            print("Demo user demo@nutrivision.ai not found! Creating demo user...")
            from backend.app.services.auth_service import get_password_hash
            user = User(
                email="demo@nutrivision.ai",
                hashed_password=get_password_hash("password123"),
                name="Rahul Sharma",
                role=UserRole.USER,
                subscription_plan=SubscriptionPlan.PRO
            )
            db.add(user)
            db.commit()
            db.refresh(user)

        profile = db.query(UserProfile).filter(UserProfile.user_id == user.id).first()
        if not profile:
            profile = UserProfile(
                user_id=user.id,
                age=26,
                gender="male",
                height_cm=176.0,
                weight_kg=72.5,
                goal=GoalType.CUTTING,
                diet_type=DietType.EGGETARIAN,
                activity_level=ActivityLevel.MODERATE,
                daily_calorie_target=2150.0,
                protein_target=110.0,
                carb_target=240.0,
                fat_target=60.0,
                fiber_target=30.0,
                water_target_liters=2.8,
                budget_per_day=150.0,
                region="North Indian"
            )
            db.add(profile)
            db.commit()

        # Find staple foods in database
        def find_food(kw):
            f = db.query(Food).filter(Food.name.ilike(f"%{kw}%")).first()
            return f

        roti = find_food("chapati") or find_food("roti")
        dal = find_food("dal tadka") or find_food("dal")
        paneer = find_food("paneer bhurji") or find_food("paneer")
        egg = find_food("boiled egg") or find_food("egg")
        poha = find_food("poha") or find_food("upma")
        curd = find_food("curd") or find_food("yogurt")
        chana = find_food("chana") or find_food("sprouts")
        khichdi = find_food("khichdi") or find_food("rice")

        print(f"Staples found: Roti={bool(roti)}, Dal={bool(dal)}, Paneer={bool(paneer)}, Egg={bool(egg)}, Poha={bool(poha)}")

        # Clear existing meals and checkins for demo user
        db.query(MealItem).filter(MealItem.meal.has(user_id=user.id)).delete(synchronize_session=False)
        db.query(Meal).filter(Meal.user_id == user.id).delete(synchronize_session=False)
        db.query(DailyCheckin).filter(DailyCheckin.user_id == user.id).delete(synchronize_session=False)
        db.commit()

        today = date.today()
        random.seed(42)

        # Seed 30 consecutive days
        for day_offset in range(29, -1, -1):
            cur_date = today - timedelta(days=day_offset)
            
            # Daily variations around targets
            target_cal = 2150.0
            day_variance = random.uniform(-150, 120)
            
            # 1. Breakfast
            bfast = Meal(
                user_id=user.id,
                meal_type=MealType.BREAKFAST,
                meal_date=cur_date,
                notes="Morning Fuel"
            )
            db.add(bfast)
            db.flush()

            b_cals, b_pro, b_carb, b_fat, b_fib = 0, 0, 0, 0, 0
            if poha:
                qty = 1.0
                m_it = MealItem(meal_id=bfast.id, food_id=poha.id, quantity=qty, serving_unit=poha.serving_size,
                                calories=poha.calories * qty, protein=poha.protein * qty,
                                effective_protein=poha.effective_protein * qty,
                                carbs=poha.carbohydrates * qty, fat=poha.fat * qty, fiber=poha.fiber * qty)
                db.add(m_it)
                b_cals += poha.calories * qty
                b_pro += poha.protein * qty
                b_carb += poha.carbohydrates * qty
                b_fat += poha.fat * qty
                b_fib += poha.fiber * qty
            if egg:
                qty = random.choice([2.0, 3.0])
                m_it = MealItem(meal_id=bfast.id, food_id=egg.id, quantity=qty, serving_unit="2 pieces",
                                calories=egg.calories * qty, protein=egg.protein * qty,
                                effective_protein=egg.effective_protein * qty,
                                carbs=egg.carbohydrates * qty, fat=egg.fat * qty, fiber=egg.fiber * qty)
                db.add(m_it)
                b_cals += egg.calories * qty
                b_pro += egg.protein * qty
                b_carb += egg.carbohydrates * qty
                b_fat += egg.fat * qty
                b_fib += egg.fiber * qty

            bfast.total_calories = round(b_cals, 1)
            bfast.total_protein = round(b_pro, 1)
            bfast.total_effective_protein = round(b_pro * 0.85, 1)
            bfast.total_carbs = round(b_carb, 1)
            bfast.total_fat = round(b_fat, 1)
            bfast.total_fiber = round(b_fib, 1)

            # 2. Lunch
            lunch = Meal(
                user_id=user.id,
                meal_type=MealType.LUNCH,
                meal_date=cur_date,
                notes="Balanced Indian Lunch"
            )
            db.add(lunch)
            db.flush()

            l_cals, l_pro, l_carb, l_fat, l_fib = 0, 0, 0, 0, 0
            if dal:
                qty = 1.0
                m_it = MealItem(meal_id=lunch.id, food_id=dal.id, quantity=qty, serving_unit="1 bowl",
                                calories=dal.calories * qty, protein=dal.protein * qty,
                                effective_protein=dal.effective_protein * qty,
                                carbs=dal.carbohydrates * qty, fat=dal.fat * qty, fiber=dal.fiber * qty)
                db.add(m_it)
                l_cals += dal.calories * qty
                l_pro += dal.protein * qty
                l_carb += dal.carbohydrates * qty
                l_fat += dal.fat * qty
                l_fib += dal.fiber * qty
            if roti:
                qty = random.choice([2.0, 3.0])
                m_it = MealItem(meal_id=lunch.id, food_id=roti.id, quantity=qty, serving_unit="piece",
                                calories=roti.calories * qty, protein=roti.protein * qty,
                                effective_protein=roti.effective_protein * qty,
                                carbs=roti.carbohydrates * qty, fat=roti.fat * qty, fiber=roti.fiber * qty)
                db.add(m_it)
                l_cals += roti.calories * qty
                l_pro += roti.protein * qty
                l_carb += roti.carbohydrates * qty
                l_fat += roti.fat * qty
                l_fib += roti.fiber * qty
            if curd:
                qty = 1.0
                m_it = MealItem(meal_id=lunch.id, food_id=curd.id, quantity=qty, serving_unit="1 cup",
                                calories=curd.calories * qty, protein=curd.protein * qty,
                                effective_protein=curd.effective_protein * qty,
                                carbs=curd.carbohydrates * qty, fat=curd.fat * qty, fiber=curd.fiber * qty)
                db.add(m_it)
                l_cals += curd.calories * qty
                l_pro += curd.protein * qty
                l_carb += curd.carbohydrates * qty
                l_fat += curd.fat * qty
                l_fib += curd.fiber * qty

            lunch.total_calories = round(l_cals, 1)
            lunch.total_protein = round(l_pro, 1)
            lunch.total_effective_protein = round(l_pro * 0.82, 1)
            lunch.total_carbs = round(l_carb, 1)
            lunch.total_fat = round(l_fat, 1)
            lunch.total_fiber = round(l_fib, 1)

            # 3. Dinner
            dinner = Meal(
                user_id=user.id,
                meal_type=MealType.DINNER,
                meal_date=cur_date,
                notes="High-Protein Dinner"
            )
            db.add(dinner)
            db.flush()

            d_cals, d_pro, d_carb, d_fat, d_fib = 0, 0, 0, 0, 0
            if paneer:
                qty = 1.0
                m_it = MealItem(meal_id=dinner.id, food_id=paneer.id, quantity=qty, serving_unit="bowl",
                                calories=paneer.calories * qty, protein=paneer.protein * qty,
                                effective_protein=paneer.effective_protein * qty,
                                carbs=paneer.carbohydrates * qty, fat=paneer.fat * qty, fiber=paneer.fiber * qty)
                db.add(m_it)
                d_cals += paneer.calories * qty
                d_pro += paneer.protein * qty
                d_carb += paneer.carbohydrates * qty
                d_fat += paneer.fat * qty
                d_fib += paneer.fiber * qty
            if roti:
                qty = 2.0
                m_it = MealItem(meal_id=dinner.id, food_id=roti.id, quantity=qty, serving_unit="piece",
                                calories=roti.calories * qty, protein=roti.protein * qty,
                                effective_protein=roti.effective_protein * qty,
                                carbs=roti.carbohydrates * qty, fat=roti.fat * qty, fiber=roti.fiber * qty)
                db.add(m_it)
                d_cals += roti.calories * qty
                d_pro += roti.protein * qty
                d_carb += roti.carbohydrates * qty
                d_fat += roti.fat * qty
                d_fib += roti.fiber * qty

            dinner.total_calories = round(d_cals, 1)
            dinner.total_protein = round(d_pro, 1)
            dinner.total_effective_protein = round(d_pro * 0.88, 1)
            dinner.total_carbs = round(d_carb, 1)
            dinner.total_fat = round(d_fat, 1)
            dinner.total_fiber = round(d_fib, 1)

            # 4. Snack (most days)
            if random.random() > 0.15 and chana:
                snack = Meal(
                    user_id=user.id,
                    meal_type=MealType.SNACK,
                    meal_date=cur_date,
                    notes="Evening High-Fiber Snack"
                )
                db.add(snack)
                db.flush()
                qty = 1.0
                m_it = MealItem(meal_id=snack.id, food_id=chana.id, quantity=qty, serving_unit="1 bowl",
                                calories=chana.calories * qty, protein=chana.protein * qty,
                                effective_protein=chana.effective_protein * qty,
                                carbs=chana.carbohydrates * qty, fat=chana.fat * qty, fiber=chana.fiber * qty)
                db.add(m_it)
                snack.total_calories = round(chana.calories * qty, 1)
                snack.total_protein = round(chana.protein * qty, 1)
                snack.total_effective_protein = round(chana.effective_protein * qty, 1)
                snack.total_carbs = round(chana.carbohydrates * qty, 1)
                snack.total_fat = round(chana.fat * qty, 1)
                snack.total_fiber = round(chana.fiber * qty, 1)

            # 5. Daily Checkin
            checkin = DailyCheckin(
                user_id=user.id,
                date=cur_date,
                energy_score=random.choice([3, 4, 4, 5]),
                hunger_score=random.choice([2, 3, 3, 4]),
                sleep_quality=random.choice(["Good", "Good", "Average", "Excellent"]),
                workout_level=random.choice(["Light", "Moderate", "Moderate", "Hard"]),
                water_ml=random.randint(2200, 2900),
                notes="Consistent energy throughout the afternoon. Post-workout recovery feeling great." if random.random() > 0.4 else None
            )
            db.add(checkin)

        db.commit()
        print("Successfully seeded 30 days of realistic meals and checkins for Rahul Sharma!")

    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_history()
