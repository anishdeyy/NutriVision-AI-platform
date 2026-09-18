from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Index
from sqlalchemy.orm import relationship
from backend.app.database import Base

class FoodSource(Base):
    __tablename__ = "food_sources"

    id = Column(Integer, primary_key=True, index=True)
    food_id = Column(Integer, ForeignKey("foods.id", ondelete="CASCADE"), index=True, nullable=False)
    source_type = Column(String(50), nullable=False, default="KAGGLE")  # KAGGLE, EXISTING_NUTRIVISION, USER_ENTERED
    source_identifier = Column(String(150), nullable=False)  # e.g., batthulavinay/indian-food-nutrition
    source_file = Column(String(200), default="")  # e.g., Indian_Food_Nutrition_Processed.csv
    original_row_number = Column(Integer, nullable=True)
    source_record_hash = Column(String(64), index=True, nullable=False)  # SHA-256 hash of original record
    original_data = Column(Text, nullable=False)  # Raw JSON string of original source fields
    imported_at = Column(DateTime, default=datetime.utcnow)

    food = relationship("Food", back_populates="sources")

Index("idx_source_hash_ident", FoodSource.source_record_hash, FoodSource.source_identifier)
