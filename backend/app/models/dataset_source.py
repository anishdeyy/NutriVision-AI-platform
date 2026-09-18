from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text
from backend.app.database import Base

class DatasetSource(Base):
    __tablename__ = "dataset_sources"

    id = Column(Integer, primary_key=True, index=True)
    dataset_name = Column(String(150), nullable=False)
    kaggle_identifier = Column(String(150), unique=True, index=True, nullable=False)
    version = Column(String(50), default="latest")
    download_path = Column(String(300), default="")
    downloaded_at = Column(DateTime, default=datetime.utcnow)
    row_count = Column(Integer, default=0)
    file_count = Column(Integer, default=0)
    status = Column(String(50), default="ACTIVE")  # ACTIVE, PENDING, ARCHIVED
    metadata_json = Column(Text, default="{}")  # Discovered files, schema columns, dtypes
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
