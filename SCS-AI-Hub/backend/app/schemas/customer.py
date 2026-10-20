
from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional
from datetime import date, datetime


class CustomerCreate(BaseModel):
    name: str
    company: Optional[str] = None
    email: EmailStr
    phone: Optional[str] = None
    status: str = "Active"
    last_contact: Optional[date] = None
    notes: Optional[str] = None


class CustomerResponse(CustomerCreate):
    id: int
    created_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)
