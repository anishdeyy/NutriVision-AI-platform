from datetime import datetime
from pydantic import BaseModel, EmailStr
from typing import Optional
from backend.app.models.user import UserRole, SubscriptionPlan

class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    age: Optional[int] = 25
    height_cm: Optional[float] = 170.0
    weight_kg: Optional[float] = 70.0
    goal: Optional[str] = "MAINTAIN"
    diet_type: Optional[str] = "VEGETARIAN"
    budget_per_day: Optional[float] = 150.0

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    role: UserRole
    plan: SubscriptionPlan
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

class TokenData(BaseModel):
    user_id: Optional[int] = None
    email: Optional[str] = None
    role: Optional[str] = None
