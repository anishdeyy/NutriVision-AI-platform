from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.profile import UserProfile, GoalType, DietType, ActivityLevel
from backend.app.schemas.profile import ProfileResponse, ProfileUpdate, NaturalLanguageProfileInput, ParsedProfileConfirmation
from backend.app.services.auth_service import get_current_user
from backend.app.services.nutrition_service import calculate_targets, compute_bmi
from backend.app.services.gemini_service import gemini_service

router = APIRouter(prefix="/api/profile", tags=["profile"])

@router.get("", response_model=ProfileResponse)
def get_profile(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        # Create default profile
        targets = calculate_targets(25, "male", 170.0, 70.0, "MAINTAIN", "MODERATE")
        profile = UserProfile(
            user_id=current_user.id,
            age=25,
            height_cm=170.0,
            weight_kg=70.0,
            daily_calorie_target=targets["calories"],
            protein_target=targets["protein"],
            carb_target=targets["carbs"],
            fat_target=targets["fat"],
            fiber_target=targets["fiber"],
            water_target_liters=targets["water_liters"]
        )
        db.add(profile)
        db.commit()
        db.refresh(profile)

    bmi, bmi_cat = compute_bmi(profile.weight_kg, profile.height_cm)
    resp = ProfileResponse.model_validate(profile)
    resp.bmi = bmi
    resp.bmi_category = bmi_cat
    return resp

@router.put("", response_model=ProfileResponse)
def update_profile(profile_in: ProfileUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    profile = db.query(UserProfile).filter(UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    update_data = profile_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(profile, field, value)

    # Recalculate targets if biometrics changed and targets weren't explicitly provided
    if any(k in update_data for k in ["age", "gender", "height_cm", "weight_kg", "goal", "activity_level"]):
        targets = calculate_targets(
            age=profile.age,
            gender=profile.gender,
            height_cm=profile.height_cm,
            weight_kg=profile.weight_kg,
            goal=profile.goal.value if hasattr(profile.goal, "value") else str(profile.goal),
            activity_level=profile.activity_level.value if hasattr(profile.activity_level, "value") else str(profile.activity_level)
        )
        if "daily_calorie_target" not in update_data:
            profile.daily_calorie_target = targets["calories"]
        if "protein_target" not in update_data:
            profile.protein_target = targets["protein"]
        if "carb_target" not in update_data:
            profile.carb_target = targets["carbs"]
        if "fat_target" not in update_data:
            profile.fat_target = targets["fat"]
        if "fiber_target" not in update_data:
            profile.fiber_target = targets["fiber"]
        if "water_target_liters" not in update_data:
            profile.water_target_liters = targets["water_liters"]

    db.commit()
    db.refresh(profile)

    bmi, bmi_cat = compute_bmi(profile.weight_kg, profile.height_cm)
    resp = ProfileResponse.model_validate(profile)
    resp.bmi = bmi
    resp.bmi_category = bmi_cat
    return resp

@router.post("/parse-natural-language", response_model=ParsedProfileConfirmation)
async def parse_profile_text(input_data: NaturalLanguageProfileInput, current_user: User = Depends(get_current_user)):
    """
    Parses natural language profile statement with Gemini.
    Returns structured data for user confirmation prior to saving.
    """
    parsed = await gemini_service.extract_profile_from_text(input_data.prompt)
    return ParsedProfileConfirmation(
        age=parsed.get("age"),
        weight_kg=parsed.get("weight_kg"),
        height_cm=parsed.get("height_cm"),
        goal=parsed.get("goal"),
        diet_type=parsed.get("diet_type"),
        activity_level=parsed.get("activity_level"),
        budget_per_day=parsed.get("budget_per_day"),
        region=parsed.get("region"),
        allergies=parsed.get("allergies"),
        explanation=parsed.get("explanation", "Parsed biometric profile from your statement.")
    )
