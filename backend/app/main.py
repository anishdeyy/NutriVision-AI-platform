from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import engine, Base, SessionLocal
from backend.app.models import *
from backend.app.routes import (
    auth, profile, foods, meals, nutrition,
    ai, rag, meal_plans, reports, payments, admin, checkin, analytics
)

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Evidence-Grounded Personal AI Nutrition Intelligence Platform with Gemini & Razorpay"
)

# CORS configuration
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8080",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(foods.router)
app.include_router(meals.router)
app.include_router(nutrition.router)
app.include_router(ai.router)
app.include_router(rag.router)
app.include_router(meal_plans.router)
app.include_router(reports.router)
app.include_router(payments.router)
app.include_router(admin.router)
app.include_router(checkin.router)
app.include_router(analytics.router)

@app.get("/")
@app.get("/health")
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "gemini_model": settings.GEMINI_MODEL
    }

@app.on_event("startup")
def on_startup():
    db = SessionLocal()
    try:
        from backend.app.services.rag_service import rag_service
        # Auto-ingest scientific knowledge documents if none are indexed
        doc_count = db.query(KnowledgeDocument).count()
        if doc_count == 0:
            print("Indexing scientific nutrition knowledge base...")
            rag_service.ingest_documents(db)
    except Exception as e:
        print(f"Startup warning: {e}")
    finally:
        db.close()
