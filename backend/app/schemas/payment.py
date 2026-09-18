from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class PlanInfo(BaseModel):
    id: str  # "free", "pro", "premium"
    name: str
    price_inr: int
    interval: str
    features: List[str]
    is_popular: bool = False

class CreateOrderRequest(BaseModel):
    plan_id: str  # "pro" or "premium"

class CreateOrderResponse(BaseModel):
    order_id: str
    amount: int  # in paise
    currency: str
    key_id: str
    plan_id: str
    plan_name: str

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    plan_id: str

class VerifyPaymentResponse(BaseModel):
    verified: bool
    status: str
    plan: str
    message: str

class SubscriptionResponse(BaseModel):
    plan: str
    status: str
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    daily_ai_limit: int
    daily_ai_used: int
    is_active: bool
