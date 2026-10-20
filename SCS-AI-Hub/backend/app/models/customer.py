
from sqlalchemy import Column, Integer, String, Date, DateTime, Text
from sqlalchemy.sql import func

from app.db.database import Base


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    name = Column(String(100), nullable=False)
    company = Column(String(150), nullable=True)
    email = Column(String(150), nullable=False, index=True)
    phone = Column(String(20), nullable=True)
    status = Column(String(50), nullable=False, default="Active")
    last_contact = Column(Date, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(
        DateTime,
        server_default=func.now(),
        nullable=True,
    )
