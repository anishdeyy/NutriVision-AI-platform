import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "healthy"
    assert data["app"] == "NutriVision AI"

def test_list_foods_endpoint():
    resp = client.get("/api/foods?limit=10")
    assert resp.status_code == 200
    foods = resp.json()
    assert len(foods) > 0
    assert "effective_protein" in foods[0]
    assert "protein_per_rupee" in foods[0]

def test_payment_plans_endpoint():
    resp = client.get("/api/payments/plans")
    assert resp.status_code == 200
    plans = resp.json()
    assert len(plans) == 3
    plan_ids = [p["id"] for p in plans]
    assert "free" in plan_ids
    assert "pro" in plan_ids
    assert "premium" in plan_ids

def test_demo_user_login():
    resp = client.post("/api/auth/login", json={
        "email": "demo@nutrivision.ai",
        "password": "password123"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert "access_token" in data
    token = data["access_token"]

    # Test authenticated summary
    headers = {"Authorization": f"Bearer {token}"}
    today_resp = client.get("/api/nutrition/today", headers=headers)
    assert today_resp.status_code == 200
    summary = today_resp.json()
    assert "calories" in summary
    assert "protein" in summary
    assert summary["calories"]["target"] > 0
