import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def get_demo_token():
    res = client.post("/api/auth/login", json={"email": "demo@nutrivision.ai", "password": "password123"})
    assert res.status_code == 200
    return res.json()["access_token"]

def test_ai_health_endpoint():
    res = client.get("/api/ai/health")
    assert res.status_code == 200
    data = res.json()
    assert data["configured"] is True
    assert "gemini" in data["model"].lower()
    assert data["status"] == "ready"

def test_daily_checkin_crud():
    token = get_demo_token()
    headers = {"Authorization": f"Bearer {token}"}
    
    # Save checkin
    post_res = client.post("/api/checkins", json={
        "energy_score": 4,
        "hunger_score": 3,
        "sleep_quality": "Good",
        "workout_level": "Moderate",
        "water_ml": 2400,
        "notes": "Feeling energetic after yellow dal lunch"
    }, headers=headers)
    assert post_res.status_code == 200
    assert post_res.json()["energy_score"] == 4

    # Get today's checkin
    get_res = client.get("/api/checkins/today", headers=headers)
    assert get_res.status_code == 200
    assert get_res.json()["workout_level"] == "Moderate"

def test_analytics_endpoints():
    token = get_demo_token()
    headers = {"Authorization": f"Bearer {token}"}

    res_trends = client.get("/api/analytics/trends?days=7", headers=headers)
    assert res_trends.status_code == 200
    assert len(res_trends.json()["dates"]) == 7

    res_weekly = client.get("/api/analytics/weekly", headers=headers)
    assert res_weekly.status_code == 200
    assert "avg_calories" in res_weekly.json()

    res_monthly = client.get("/api/analytics/monthly", headers=headers)
    assert res_monthly.status_code == 200
    assert "meal_consistency" in res_monthly.json()

    res_macros = client.get("/api/analytics/macros?days=7", headers=headers)
    assert res_macros.status_code == 200
    assert "protein_pct" in res_macros.json()

def test_reports_pdf_download():
    token = get_demo_token()
    headers = {"Authorization": f"Bearer {token}"}

    # Generate a report
    gen_res = client.post("/api/reports/generate", json={"report_type": "WEEKLY"}, headers=headers)
    assert gen_res.status_code == 200
    rep_id = gen_res.json()["id"]

    # Download with Authorization header
    dl_res = client.get(f"/api/reports/{rep_id}/download", headers=headers)
    assert dl_res.status_code == 200
    assert dl_res.headers["content-type"] == "application/pdf"
    assert dl_res.content.startswith(b"%PDF")

    # Download with query param token
    dl_token_res = client.get(f"/api/reports/{rep_id}/download?token={token}")
    assert dl_token_res.status_code == 200
    assert dl_token_res.content.startswith(b"%PDF")
