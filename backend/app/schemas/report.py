from datetime import datetime
from pydantic import BaseModel
from typing import Dict, Any, Optional

class GenerateReportRequest(BaseModel):
    report_type: str = "WEEKLY"  # "WEEKLY", "MONTHLY"

class ReportResponse(BaseModel):
    id: int
    user_id: int
    title: str
    report_type: str
    summary_data: Dict[str, Any]
    pdf_filename: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
