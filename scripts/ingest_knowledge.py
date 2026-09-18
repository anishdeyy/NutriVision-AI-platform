import sys
import os

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except:
        pass


sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database import SessionLocal, Base, engine
from backend.app.services.rag_service import rag_service

def ingest_knowledge():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = rag_service.ingest_documents(db)
        print(f"✅ Successfully ingested {count} scientific nutrition documents into RAG vector knowledge base.")
    except Exception as e:
        db.rollback()
        print(f"❌ Error ingesting knowledge: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    ingest_knowledge()
