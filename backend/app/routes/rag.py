from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from backend.app.database import get_db
from backend.app.models.knowledge_source import KnowledgeDocument
from backend.app.models.user import User
from backend.app.services.rag_service import rag_service
from backend.app.services.auth_service import get_current_user, require_admin

router = APIRouter(prefix="/api/rag", tags=["rag"])

class RAGQueryRequest(BaseModel):
    query: str
    top_k: int = 3

class RAGQueryResponse(BaseModel):
    query: str
    context: str
    sources: List[Dict[str, Any]]

@router.post("/query", response_model=RAGQueryResponse)
def query_rag(req: RAGQueryRequest, db: Session = Depends(get_db)):
    context, citations = rag_service.retrieve_context(db, req.query, top_k=req.top_k)
    return RAGQueryResponse(
        query=req.query,
        context=context,
        sources=citations
    )

@router.get("/sources")
def list_sources(db: Session = Depends(get_db)):
    docs = db.query(KnowledgeDocument).all()
    return [
        {
            "id": d.id,
            "title": d.title,
            "organization": d.organization,
            "author": d.author,
            "year": d.year,
            "url": d.url,
            "topic": d.topic,
            "document_type": d.document_type,
            "chunk_count": d.chunk_count,
            "created_at": d.created_at
        }
        for d in docs
    ]

@router.post("/index")
def trigger_index(current_user: User = Depends(require_admin), db: Session = Depends(get_db)):
    count = rag_service.ingest_documents(db)
    return {"success": True, "documents_indexed": count}
