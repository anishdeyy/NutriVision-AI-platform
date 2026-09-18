from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole, SubscriptionPlan
from backend.app.models.profile import UserProfile, GoalType, DietType, ActivityLevel
from backend.app.models.subscription import Subscription, SubscriptionStatus
from backend.app.schemas.auth import UserRegister, UserLogin, UserResponse, Token
from backend.app.services.auth_service import get_password_hash, verify_password, create_access_token, get_current_user
from backend.app.services.nutrition_service import calculate_targets

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        role=UserRole.USER,
        plan=SubscriptionPlan.FREE
    )
    db.add(user)
    db.flush()

    # Calculate initial targets using Mifflin-St Jeor
    targets = calculate_targets(
        age=user_in.age or 25,
        gender="male",
        height_cm=user_in.height_cm or 170.0,
        weight_kg=user_in.weight_kg or 70.0,
        goal=user_in.goal or "MAINTAIN",
        activity_level="MODERATE"
    )

    profile = UserProfile(
        user_id=user.id,
        age=user_in.age or 25,
        height_cm=user_in.height_cm or 170.0,
        weight_kg=user_in.weight_kg or 70.0,
        goal=GoalType(user_in.goal.upper()) if user_in.goal and user_in.goal.upper() in GoalType.__members__ else GoalType.MAINTAIN,
        diet_type=DietType(user_in.diet_type.upper()) if user_in.diet_type and user_in.diet_type.upper() in DietType.__members__ else DietType.VEGETARIAN,
        daily_calorie_target=targets["calories"],
        protein_target=targets["protein"],
        carb_target=targets["carbs"],
        fat_target=targets["fat"],
        fiber_target=targets["fiber"],
        water_target_liters=targets["water_liters"],
        budget_per_day=user_in.budget_per_day or 150.0
    )
    db.add(profile)

    # Initial Free Subscription
    sub = Subscription(
        user_id=user.id,
        plan="FREE",
        status=SubscriptionStatus.ACTIVE
    )
    db.add(sub)
    db.commit()
    db.refresh(user)

    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.post("/login", response_model=Token)
def login(user_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == user_in.email.lower()).first()
    if not user or not verify_password(user_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    token = create_access_token({"sub": str(user.id), "email": user.email, "role": user.role.value})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": user
    }

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
