import pytest
from backend.app.services.auth_service import get_password_hash, verify_password, create_access_token
from backend.app.services.razorpay_service import razorpay_service
from backend.app.services.rag_service import rag_service
from backend.app.database import SessionLocal

def test_password_hashing():
    pw = "superSecurePass123"
    hashed = get_password_hash(pw)
    assert hashed != pw
    assert verify_password(pw, hashed) is True
    assert verify_password("wrongPass", hashed) is False

def test_token_creation():
    token = create_access_token({"sub": "1", "email": "test@nutrivision.ai", "role": "USER"})
    assert isinstance(token, str)
    assert len(token) > 20

def test_razorpay_signature_verification():
    order_id = "order_test_123"
    payment_id = "pay_test_456"
    import hmac, hashlib
    payload = f"{order_id}|{payment_id}".encode("utf-8")
    valid_sig = hmac.new(
        razorpay_service.key_secret.encode("utf-8"),
        payload,
        hashlib.sha256
    ).hexdigest()
    
    assert razorpay_service.verify_payment_signature(order_id, payment_id, valid_sig) is True
    assert razorpay_service.verify_payment_signature(order_id, payment_id, "invalid_sig") is False

def test_rag_knowledge_retrieval():
    db = SessionLocal()
    try:
        context, citations = rag_service.retrieve_context(db, "protein bioavailability DIAAS Indian vegetarian", top_k=2)
        assert len(citations) > 0
        assert "DIAAS" in context or "protein" in context.lower()
    finally:
        db.close()
