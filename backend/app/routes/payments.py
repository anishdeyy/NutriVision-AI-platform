from datetime import datetime, timedelta
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Request, Header, status
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, SubscriptionPlan
from backend.app.models.subscription import Subscription, SubscriptionStatus
from backend.app.models.payment import Payment
from backend.app.schemas.payment import (
    PlanInfo, CreateOrderRequest, CreateOrderResponse,
    VerifyPaymentRequest, VerifyPaymentResponse, SubscriptionResponse
)
from backend.app.services.auth_service import get_current_user
from backend.app.services.razorpay_service import razorpay_service, PLANS_CONFIG

router = APIRouter(prefix="/api/payments", tags=["payments"])

@router.get("/plans", response_model=List[PlanInfo])
def get_plans():
    plans = []
    for pid, p in PLANS_CONFIG.items():
        plans.append(PlanInfo(
            id=pid,
            name=p["name"],
            price_inr=p["price_inr"],
            interval=p["interval"],
            features=p["features"],
            is_popular=p.get("is_popular", False)
        ))
    return plans

@router.post("/create-order", response_model=CreateOrderResponse)
def create_order(
    req: CreateOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        order_info = razorpay_service.create_order(req.plan_id, current_user.id)
        # Store payment record as created
        pay = Payment(
            user_id=current_user.id,
            razorpay_order_id=order_info["order_id"],
            plan=req.plan_id.upper(),
            amount=order_info["amount"],
            currency="INR",
            status="created"
        )
        db.add(pay)
        db.commit()
        return CreateOrderResponse(**order_info)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify", response_model=VerifyPaymentResponse)
def verify_payment(
    req: VerifyPaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    is_valid = razorpay_service.verify_payment_signature(
        order_id=req.razorpay_order_id,
        payment_id=req.razorpay_payment_id,
        signature=req.razorpay_signature
    )

    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid Razorpay payment signature verification failed"
        )

    # Update payment record
    pay = db.query(Payment).filter(Payment.razorpay_order_id == req.razorpay_order_id).first()
    if pay:
        pay.razorpay_payment_id = req.razorpay_payment_id
        pay.razorpay_signature = req.razorpay_signature
        pay.status = "paid"

    # Activate subscription
    plan_name = req.plan_id.upper()
    user_plan = SubscriptionPlan.PREMIUM if "PREMIUM" in plan_name else SubscriptionPlan.PRO
    current_user.plan = user_plan

    # Deactivate older subscriptions
    db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).update({"status": SubscriptionStatus.EXPIRED})

    new_sub = Subscription(
        user_id=current_user.id,
        plan=plan_name,
        status=SubscriptionStatus.ACTIVE,
        razorpay_order_id=req.razorpay_order_id,
        razorpay_payment_id=req.razorpay_payment_id,
        start_date=datetime.utcnow(),
        end_date=datetime.utcnow() + timedelta(days=30)
    )
    db.add(new_sub)
    db.commit()

    return VerifyPaymentResponse(
        verified=True,
        status="ACTIVE",
        plan=plan_name,
        message=f"Subscription successfully activated! Enjoy {plan_name} features."
    )

@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    x_razorpay_signature: str = Header(None),
    db: Session = Depends(get_db)
):
    body = await request.body()
    if x_razorpay_signature:
        valid = razorpay_service.verify_webhook_signature(body, x_razorpay_signature)
        if not valid:
            raise HTTPException(status_code=400, detail="Webhook signature mismatch")

    event = await request.json()
    event_type = event.get("event")

    if event_type in ["order.paid", "payment.captured"]:
        payload = event.get("payload", {})
        entity = payload.get("payment", {}).get("entity", {}) or payload.get("order", {}).get("entity", {})
        order_id = entity.get("order_id") or entity.get("id")
        
        # Idempotent check
        pay = db.query(Payment).filter(Payment.razorpay_order_id == order_id).first()
        if pay and pay.status != "paid":
            pay.status = "paid"
            pay.razorpay_payment_id = entity.get("id")
            # Upgrade user
            user = db.query(User).filter(User.id == pay.user_id).first()
            if user:
                user.plan = SubscriptionPlan.PREMIUM if "PREMIUM" in pay.plan else SubscriptionPlan.PRO
            db.commit()

    return {"status": "ok"}

@router.get("/subscription", response_model=SubscriptionResponse)
def get_user_subscription(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sub = db.query(Subscription).filter(
        Subscription.user_id == current_user.id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).order_by(Subscription.id.desc()).first()

    plan_key = current_user.plan.value.lower()
    plan_info = PLANS_CONFIG.get(plan_key, PLANS_CONFIG["free"])

    return SubscriptionResponse(
        plan=current_user.plan.value,
        status=sub.status.value if sub else "ACTIVE",
        start_date=sub.start_date if sub else current_user.created_at,
        end_date=sub.end_date if sub else None,
        daily_ai_limit=plan_info["daily_ai_limit"],
        daily_ai_used=3,  # demo usage count
        is_active=True
    )
