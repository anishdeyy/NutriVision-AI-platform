import json
from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.user import User, UserRole, SubscriptionPlan
from backend.app.models.food import Food
from backend.app.models.meal import Meal
from backend.app.models.payment import Payment
from backend.app.models.subscription import Subscription, SubscriptionStatus
from backend.app.models.knowledge_source import KnowledgeDocument
from backend.app.models.dataset_source import DatasetSource
from backend.app.schemas.food import DatasetSourceResponse, DataQualityResponse
from backend.app.services.auth_service import require_admin
from backend.app.services.food_service import get_data_quality_metrics

router = APIRouter(prefix="/api/admin", tags=["admin"])

@router.get("/stats")
def get_admin_stats(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    total_users = db.query(User).count()
    pro_users = db.query(User).filter(User.plan == SubscriptionPlan.PRO).count()
    premium_users = db.query(User).filter(User.plan == SubscriptionPlan.PREMIUM).count()
    
    total_meals = db.query(Meal).count()
    total_foods = db.query(Food).count()
    total_docs = db.query(KnowledgeDocument).count()
    
    # Total revenue from paid payments
    payments = db.query(Payment).filter(Payment.status == "paid").all()
    total_revenue_inr = sum(p.amount for p in payments) / 100.0

    return {
        "total_users": total_users,
        "active_users": total_users,
        "pro_subscribers": pro_users,
        "premium_subscribers": premium_users,
        "total_revenue_inr": total_revenue_inr,
        "total_meals_logged": total_meals,
        "total_foods_indexed": total_foods,
        "total_knowledge_documents": total_docs,
        "ai_requests_processed": 1420
    }

@router.get("/users")
def list_admin_users(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    users = db.query(User).order_by(User.id.desc()).limit(50).all()
    return [
        {
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "role": u.role.value,
            "plan": u.plan.value,
            "created_at": u.created_at
        }
        for u in users
    ]

@router.get("/payments")
def list_admin_payments(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    pays = db.query(Payment).order_by(Payment.id.desc()).limit(50).all()
    return [
        {
            "id": p.id,
            "user_id": p.user_id,
            "razorpay_order_id": p.razorpay_order_id,
            "plan": p.plan,
            "amount": p.amount,
            "status": p.status,
            "created_at": p.created_at
        }
        for p in pays
    ]

@router.get("/datasets", response_model=List[DatasetSourceResponse])
def list_dataset_sources(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    sources = db.query(DatasetSource).order_by(DatasetSource.id.asc()).all()
    result = []
    for s in sources:
        try:
            meta = json.loads(s.metadata_json) if isinstance(s.metadata_json, str) else s.metadata_json
        except Exception:
            meta = {}
        result.append(DatasetSourceResponse(
            id=s.id,
            dataset_name=s.dataset_name,
            kaggle_identifier=s.kaggle_identifier,
            version=s.version or "latest",
            download_path=s.download_path or "",
            downloaded_at=s.downloaded_at,
            row_count=s.row_count,
            file_count=s.file_count,
            status=s.status,
            metadata=meta or {}
        ))
    return result

@router.post("/datasets/import")
def trigger_dataset_import(current_user: User = Depends(require_admin)):
    try:
        from scripts.ingest_kaggle_datasets import process_and_import
        report = process_and_import(dry_run=False)
        return {
            "status": "success",
            "message": "Kaggle datasets ingested successfully",
            "report": report
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Dataset ingestion failed: {str(e)}")

@router.get("/data-quality", response_model=DataQualityResponse)
def get_data_quality(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    return get_data_quality_metrics(db)
