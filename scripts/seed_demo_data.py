import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except:
        pass

from datetime import date, timedelta, datetime

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal, Base, engine
from backend.app.models.user import User, UserRole, SubscriptionPlan
from backend.app.models.profile import UserProfile, GoalType, DietType, ActivityLevel
from backend.app.models.food import Food
from backend.app.models.meal import Meal, MealItem, MealType
from backend.app.models.conversation import Conversation, ConversationMessage
from backend.app.models.subscription import Subscription, SubscriptionStatus
from backend.app.models.payment import Payment
from backend.app.services.auth_service import get_password_hash
from backend.app.services.nutrition_service import calculate_targets

def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        # 1. Admin User
        admin = db.query(User).filter(User.email == "admin@nutrivision.ai").first()
        if not admin:
            admin = User(
                name="NutriVision Admin",
                email="admin@nutrivision.ai",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                plan=SubscriptionPlan.PREMIUM
            )
            db.add(admin)
            db.flush()

            admin_sub = Subscription(
                user_id=admin.id,
                plan="PREMIUM",
                status=SubscriptionStatus.ACTIVE
            )
            db.add(admin_sub)
            print("👤 Seeded Admin: admin@nutrivision.ai (password: admin123)")

        # 2. Demo User
        demo_user = db.query(User).filter(User.email == "demo@nutrivision.ai").first()
        if not demo_user:
            demo_user = User(
                name="Rahul Sharma",
                email="demo@nutrivision.ai",
                password_hash=get_password_hash("password123"),
                role=UserRole.USER,
                plan=SubscriptionPlan.PRO
            )
            db.add(demo_user)
            db.flush()

            # Targets
            targets = calculate_targets(25, "male", 175.0, 75.0, "CUTTING", "MODERATE")
            profile = UserProfile(
                user_id=demo_user.id,
                age=25,
                gender="male",
                height_cm=175.0,
                weight_kg=75.0,
                target_weight=70.0,
                activity_level=ActivityLevel.MODERATE,
                goal=GoalType.CUTTING,
                diet_type=DietType.EGGETARIAN,
                daily_calorie_target=targets["calories"],
                protein_target=targets["protein"],
                carb_target=targets["carbs"],
                fat_target=targets["fat"],
                fiber_target=targets["fiber"],
                water_target_liters=targets["water_liters"],
                budget_per_day=180.0,
                region="North Indian",
                allergies="None"
            )
            db.add(profile)

            # Pro Subscription & Payment
            sub = Subscription(
                user_id=demo_user.id,
                plan="PRO",
                status=SubscriptionStatus.ACTIVE,
                razorpay_order_id="order_demo_1001",
                razorpay_payment_id="pay_demo_1001",
                start_date=datetime.utcnow() - timedelta(days=5),
                end_date=datetime.utcnow() + timedelta(days=25)
            )
            db.add(sub)

            payment = Payment(
                user_id=demo_user.id,
                razorpay_order_id="order_demo_1001",
                razorpay_payment_id="pay_demo_1001",
                razorpay_signature="sig_demo_verified",
                plan="PRO",
                amount=29900,
                currency="INR",
                status="paid"
            )
            db.add(payment)

            print("👤 Seeded Demo User: demo@nutrivision.ai (password: password123)")

        # 3. Seed 14 Days of Meal Logs for Demo User
        foods = db.query(Food).all()
        if foods and demo_user:
            food_by_name = {f.name: f for f in foods}
            roti = food_by_name.get("Chapati / Whole Wheat Roti") or foods[0]
            dal = food_by_name.get("Dal Tadka (Yellow Toor)") or foods[1]
            paneer = food_by_name.get("Paneer Bhurji") or foods[2]
            egg = food_by_name.get("Boiled Whole Egg") or foods[3]
            sprouts = food_by_name.get("Sprouts Salad (Moong)") or foods[4]
            poha = food_by_name.get("Poha") or foods[5]

            # Clear existing meals for demo user
            db.query(Meal).filter(Meal.user_id == demo_user.id).delete()

            today = date.today()
            for day_offset in range(14, -1, -1):
                m_date = today - timedelta(days=day_offset)

                # Breakfast
                b_meal = Meal(
                    user_id=demo_user.id,
                    meal_type=MealType.BREAKFAST,
                    meal_date=m_date,
                    notes="Morning Energy Breakfast"
                )
                db.add(b_meal)
                db.flush()
                b_item1 = MealItem(meal_id=b_meal.id, food_id=poha.id, quantity=1.0, serving_unit=poha.serving_size, calories=poha.calories, protein=poha.protein, effective_protein=poha.effective_protein, carbs=poha.carbohydrates, fat=poha.fat, fiber=poha.fiber)
                b_item2 = MealItem(meal_id=b_meal.id, food_id=egg.id, quantity=2.0, serving_unit="2 pieces", calories=egg.calories * 2, protein=egg.protein * 2, effective_protein=egg.effective_protein * 2, carbs=egg.carbohydrates * 2, fat=egg.fat * 2, fiber=0.0)
                db.add_all([b_item1, b_item2])
                b_meal.total_calories = b_item1.calories + b_item2.calories
                b_meal.total_protein = b_item1.protein + b_item2.protein
                b_meal.total_effective_protein = b_item1.effective_protein + b_item2.effective_protein
                b_meal.total_carbs = b_item1.carbs + b_item2.carbs
                b_meal.total_fat = b_item1.fat + b_item2.fat
                b_meal.total_fiber = b_item1.fiber + b_item2.fiber

                # Lunch
                l_meal = Meal(
                    user_id=demo_user.id,
                    meal_type=MealType.LUNCH,
                    meal_date=m_date,
                    notes="Traditional Wholesome Lunch"
                )
                db.add(l_meal)
                db.flush()
                l_item1 = MealItem(meal_id=l_meal.id, food_id=dal.id, quantity=1.0, serving_unit=dal.serving_size, calories=dal.calories, protein=dal.protein, effective_protein=dal.effective_protein, carbs=dal.carbohydrates, fat=dal.fat, fiber=dal.fiber)
                l_item2 = MealItem(meal_id=l_meal.id, food_id=roti.id, quantity=2.0, serving_unit="2 pieces", calories=roti.calories * 2, protein=roti.protein * 2, effective_protein=roti.effective_protein * 2, carbs=roti.carbohydrates * 2, fat=roti.fat * 2, fiber=roti.fiber * 2)
                l_item3 = MealItem(meal_id=l_meal.id, food_id=paneer.id, quantity=0.8, serving_unit="small bowl", calories=paneer.calories * 0.8, protein=paneer.protein * 0.8, effective_protein=paneer.effective_protein * 0.8, carbs=paneer.carbohydrates * 0.8, fat=paneer.fat * 0.8, fiber=paneer.fiber * 0.8)
                db.add_all([l_item1, l_item2, l_item3])
                l_meal.total_calories = round(l_item1.calories + l_item2.calories + l_item3.calories, 1)
                l_meal.total_protein = round(l_item1.protein + l_item2.protein + l_item3.protein, 1)
                l_meal.total_effective_protein = round(l_item1.effective_protein + l_item2.effective_protein + l_item3.effective_protein, 1)
                l_meal.total_carbs = round(l_item1.carbs + l_item2.carbs + l_item3.carbs, 1)
                l_meal.total_fat = round(l_item1.fat + l_item2.fat + l_item3.fat, 1)
                l_meal.total_fiber = round(l_item1.fiber + l_item2.fiber + l_item3.fiber, 1)

                # Dinner (for past days)
                if day_offset > 0:
                    d_meal = Meal(
                        user_id=demo_user.id,
                        meal_type=MealType.DINNER,
                        meal_date=m_date,
                        notes="Light High-Protein Dinner"
                    )
                    db.add(d_meal)
                    db.flush()
                    d_item1 = MealItem(meal_id=d_meal.id, food_id=paneer.id, quantity=1.0, serving_unit=paneer.serving_size, calories=paneer.calories, protein=paneer.protein, effective_protein=paneer.effective_protein, carbs=paneer.carbohydrates, fat=paneer.fat, fiber=paneer.fiber)
                    d_item2 = MealItem(meal_id=d_meal.id, food_id=sprouts.id, quantity=1.0, serving_unit=sprouts.serving_size, calories=sprouts.calories, protein=sprouts.protein, effective_protein=sprouts.effective_protein, carbs=sprouts.carbohydrates, fat=sprouts.fat, fiber=sprouts.fiber)
                    db.add_all([d_item1, d_item2])
                    d_meal.total_calories = round(d_item1.calories + d_item2.calories, 1)
                    d_meal.total_protein = round(d_item1.protein + d_item2.protein, 1)
                    d_meal.total_effective_protein = round(d_item1.effective_protein + d_item2.effective_protein, 1)
                    d_meal.total_carbs = round(d_item1.carbs + d_item2.carbs, 1)
                    d_meal.total_fat = round(d_item1.fat + d_item2.fat, 1)
                    d_meal.total_fiber = round(d_item1.fiber + d_item2.fiber, 1)

            print("🍽 Seeded 14 days of realistic meal logs for Rahul Sharma.")

        # 4. Seed Sample AI Conversation with Scientific Retrieval
        if demo_user:
            conv = Conversation(
                user_id=demo_user.id,
                title="Increasing Bioavailable Protein on Eggetarian Diet"
            )
            db.add(conv)
            db.flush()

            m1 = ConversationMessage(
                conversation_id=conv.id,
                role="user",
                content="I'm trying to lose fat and maintain muscle, but my protein is lagging. How can I reach 120g protein on an eggetarian budget of ₹180/day?"
            )
            m2 = ConversationMessage(
                conversation_id=conv.id,
                role="assistant",
                content="Based on your current cutting goal (2100 kcal target) and eggetarian preference with a ₹180/day budget, reaching 120g protein requires prioritizing high protein-density and high DIAAS foods.",
                structured_data='[{"title":"Pacing Eggs & Low-Fat Paneer","why":"Whole eggs have a 1.0 bioavailability index, and paneer provides 0.80 bioavailable casein.","nutrition_impact":{"calories":360,"protein":32,"carbs":5,"fat":20,"fiber":0},"how_to_implement":"Consume 3 boiled egg whites + 1 whole egg for breakfast, and 150g paneer bhurji for dinner.","time_horizon":"Today","confidence":"High"}]',
                sources_cited='[{"title":"Dietary Guidelines for Indians","organization":"ICMR-NIN","year":2024,"snippet":"Recommends balancing cereal-pulse complementary proteins with dairy and poultry."}]'
            )
            db.add_all([m1, m2])

        db.commit()
        print("✅ Demo data seeded successfully!")
    except Exception as e:
        db.rollback()
        print(f"❌ Error seeding demo data: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_demo_data()
