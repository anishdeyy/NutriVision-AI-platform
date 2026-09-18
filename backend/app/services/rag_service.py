import os
import glob
import re
import math
from typing import List, Dict, Any, Tuple
from sqlalchemy.orm import Session
from backend.app.models.knowledge_source import KnowledgeDocument, KnowledgeChunk

def tokenize(text: str) -> List[str]:
    # Lowercase and clean alphanumeric words
    words = re.findall(r'\b[a-zA-Z0-9_-]{2,}\b', text.lower())
    stop_words = {
        "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
        "of", "with", "by", "from", "up", "about", "into", "over", "after",
        "is", "are", "was", "were", "be", "been", "being", "have", "has", "had",
        "do", "does", "did", "this", "that", "these", "those", "it", "its"
    }
    return [w for w in words if w not in stop_words]

def compute_similarity(query_tokens: List[str], chunk_tokens: List[str]) -> float:
    if not query_tokens or not chunk_tokens:
        return 0.0
    q_set = set(query_tokens)
    c_counts = {}
    for t in chunk_tokens:
        c_counts[t] = c_counts.get(t, 0) + 1
        
    score = 0.0
    for t in q_set:
        if t in c_counts:
            # Term frequency with log damping
            score += 1.0 + math.log(c_counts[t])
            
    # Normalize by chunk length
    return score / (math.sqrt(len(chunk_tokens)) + 1.0)

class RAGService:
    def __init__(self):
        # Resolve to project root knowledge_base/documents
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
        self.doc_dir = os.path.join(project_root, "knowledge_base", "documents")

    def ingest_documents(self, db: Session) -> int:
        """
        Parses all markdown files in knowledge_base/documents and populates database.
        """
        if not os.path.exists(self.doc_dir):
            os.makedirs(self.doc_dir, exist_ok=True)
            return 0

        files = glob.glob(os.path.join(self.doc_dir, "*.md"))
        ingested_count = 0

        for file_path in files:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read()

            # Parse title & metadata
            title = os.path.basename(file_path).replace(".md", "").replace("_", " ").title()
            org = "Scientific Institution"
            author = "Nutrition Expert Consortium"
            year = 2024
            url = ""
            topic = "General Nutrition"
            doc_type = "Scientific Review"

            lines = content.splitlines()
            for line in lines:
                if line.startswith("# "):
                    title = line.replace("# ", "").strip()
                elif "- **Title**:" in line:
                    title = line.split(":", 1)[1].strip()
                elif "- **Organization**:" in line:
                    org = line.split(":", 1)[1].strip()
                elif "- **Author**:" in line:
                    author = line.split(":", 1)[1].strip()
                elif "- **Year**:" in line:
                    try:
                        year = int(line.split(":", 1)[1].strip())
                    except:
                        pass
                elif "- **URL**:" in line:
                    url = line.split(":", 1)[1].strip()
                elif "- **Topic**:" in line:
                    topic = line.split(":", 1)[1].strip()
                elif "- **Document Type**:" in line:
                    doc_type = line.split(":", 1)[1].strip()

            # Check if document already exists
            existing_doc = db.query(KnowledgeDocument).filter(KnowledgeDocument.title == title).first()
            if existing_doc:
                doc = existing_doc
                doc.organization = org
                doc.author = author
                doc.year = year
                doc.url = url
                doc.topic = topic
                doc.document_type = doc_type
                doc.raw_content = content
                # Clear existing chunks
                db.query(KnowledgeChunk).filter(KnowledgeChunk.document_id == doc.id).delete()
            else:
                doc = KnowledgeDocument(
                    title=title,
                    organization=org,
                    author=author,
                    year=year,
                    url=url,
                    topic=topic,
                    document_type=doc_type,
                    raw_content=content
                )
                db.add(doc)
                db.flush()

            # Chunk document by sections (markdown headers or ~500 words)
            raw_sections = re.split(r'\n(?=###? )', content)
            chunks_created = 0
            for idx, sec in enumerate(raw_sections):
                sec_clean = sec.strip()
                if len(sec_clean) < 50:
                    continue
                chunk = KnowledgeChunk(
                    document_id=doc.id,
                    chunk_index=idx,
                    chunk_text=sec_clean
                )
                db.add(chunk)
                chunks_created += 1

            doc.chunk_count = chunks_created
            ingested_count += 1

        db.commit()
        return ingested_count

    def retrieve_context(self, db: Session, query: str, top_k: int = 3) -> Tuple[str, List[Dict[str, Any]]]:
        """
        Retrieves the top_k most relevant knowledge chunks for a query.
        Returns combined context text and list of citation objects.
        """
        chunks = db.query(KnowledgeChunk, KnowledgeDocument).\
            join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id).all()

        if not chunks:
            # Try auto-ingesting if DB is empty
            self.ingest_documents(db)
            chunks = db.query(KnowledgeChunk, KnowledgeDocument).\
                join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id).all()

        query_tokens = tokenize(query)
        scored = []
        for chunk, doc in chunks:
            chunk_tokens = tokenize(chunk.chunk_text)
            sim = compute_similarity(query_tokens, chunk_tokens)
            if sim > 0.05:
                scored.append((sim, chunk, doc))

        scored.sort(key=lambda x: x[0], reverse=True)
        top_matches = scored[:top_k]

        citations = []
        context_parts = []

        for sim, chunk, doc in top_matches:
            citations.append({
                "title": doc.title,
                "organization": doc.organization,
                "year": doc.year,
                "url": doc.url,
                "topic": doc.topic,
                "snippet": chunk.chunk_text[:180] + "..." if len(chunk.chunk_text) > 180 else chunk.chunk_text
            })
            context_parts.append(f"[{doc.organization} ({doc.year}) - {doc.title}]:\n{chunk.chunk_text}")

        combined_context = "\n\n".join(context_parts)
        return combined_context, citations

rag_service = RAGService()
