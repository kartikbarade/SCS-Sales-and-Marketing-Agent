from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "New"
    source: Optional[str] = None
    notes: Optional[str] = None


class LeadResponse(LeadCreate):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)