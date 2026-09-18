FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy backend requirements
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend code, knowledge base, and data
COPY backend /app/backend
COPY knowledge_base /app/knowledge_base
COPY data /app/data
COPY scripts /app/scripts

# Expose port
EXPOSE 8000

# Environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Run database seed and start API server
CMD ["sh", "-c", "python scripts/seed_foods.py && python scripts/ingest_knowledge.py && python scripts/seed_demo_data.py && uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"]
