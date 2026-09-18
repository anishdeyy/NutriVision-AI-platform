import hmac
import hashlib
import razorpay
from typing import Dict, Any
from backend.app.config import settings

# Plans pricing in Paise (1 INR = 100 paise)
PLANS_CONFIG = {
    "free": {
        "name": "NutriVision Free",
        "price_paise": 0,
        "price_inr": 0,
        "interval": "forever",
        "daily_ai_limit": 5,
        "features": [
            "Food logging & 100+ Indian food database",
            "Mifflin-St Jeor TDEE & macro targets",
            "Effective bioavailable protein estimation",
            "5 AI Advisor questions / day",
            "Standard 1-day meal plans"
        ]
    },
    "pro": {
        "name": "NutriVision Pro",
        "price_paise": 29900,  # ₹299.00
        "price_inr": 299,
        "interval": "monthly",
        "daily_ai_limit": 50,
        "is_popular": True,
        "features": [
            "Unlimited AI Nutrition Advisor",
            "Scientific RAG evidence-backed citations",
            "Multi-variable dietary reasoning",
            "7-day & 30-day AI meal plans with Budget Mode",
            "Weekly smart grocery list generation",
            "Deficiency-risk gap analysis & Nutrition Score",
            "AI Weekly Review & PDF Nutrition Audit reports",
            "50 AI queries / day"
        ]
    },
    "premium": {
        "name": "NutriVision Premium Elite",
        "price_paise": 59900,  # ₹599.00
        "price_inr": 599,
        "interval": "monthly",
        "daily_ai_limit": 200,
        "features": [
            "Everything in Pro plan",
            "Priority Gemini 2.5 Pro reasoning pipeline",
            "Long-term metabolic & trend detection",
            "Unlimited PDF Nutrition Intelligence Reports",
            "Custom regional recipe generator",
            "AI Meal Swap Optimizer & Food Comparisons",
            "200 AI queries / day"
        ]
    }
}

class RazorpayService:
    def __init__(self):
        self.key_id = settings.RAZORPAY_KEY_ID
        self.key_secret = (
            settings.RAZORPAY_KEY_SECRET.get_secret_value()
            if settings.RAZORPAY_KEY_SECRET and hasattr(settings.RAZORPAY_KEY_SECRET, "get_secret_value")
            else str(settings.RAZORPAY_KEY_SECRET) if settings.RAZORPAY_KEY_SECRET else None
        )
        self.webhook_secret = (
            settings.RAZORPAY_WEBHOOK_SECRET.get_secret_value()
            if settings.RAZORPAY_WEBHOOK_SECRET and hasattr(settings.RAZORPAY_WEBHOOK_SECRET, "get_secret_value")
            else str(settings.RAZORPAY_WEBHOOK_SECRET) if settings.RAZORPAY_WEBHOOK_SECRET else None
        )
        self.client = razorpay.Client(auth=(self.key_id, self.key_secret))

    def create_order(self, plan_id: str, user_id: int) -> Dict[str, Any]:
        plan_id = plan_id.lower()
        if plan_id not in PLANS_CONFIG or plan_id == "free":
            raise ValueError(f"Invalid plan for payment: {plan_id}")

        plan = PLANS_CONFIG[plan_id]
        amount = plan["price_paise"]

        data = {
            "amount": amount,
            "currency": "INR",
            "receipt": f"order_user_{user_id}_{plan_id}",
            "notes": {
                "user_id": str(user_id),
                "plan_id": plan_id,
                "plan_name": plan["name"]
            }
        }
        order = self.client.order.create(data=data)
        return {
            "order_id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"],
            "key_id": self.key_id,
            "plan_id": plan_id,
            "plan_name": plan["name"]
        }

    def verify_payment_signature(self, order_id: str, payment_id: str, signature: str) -> bool:
        """
        Verifies Razorpay payment signature using HMAC SHA256.
        """
        payload = f"{order_id}|{payment_id}".encode("utf-8")
        generated_signature = hmac.new(
            self.key_secret.encode("utf-8"),
            payload,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(generated_signature, signature)

    def verify_webhook_signature(self, body: bytes, signature: str) -> bool:
        generated_signature = hmac.new(
            self.webhook_secret.encode("utf-8"),
            body,
            hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(generated_signature, signature)

razorpay_service = RazorpayService()
