from datetime import datetime
from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from backend.app.database import Base

class NutritionReport(Base):
    __tablename__ = "nutrition_reports"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(200), default="Weekly Nutrition Intelligence Audit")
    report_type = Column(String(50), default="WEEKLY")  # WEEKLY, MONTHLY, CUSTOM
    summary_data = Column(Text, default="{}")  # JSON string of averages, trends, gaps
    pdf_filename = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="reports")
