from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse

router = APIRouter()


@router.get("/", response_model=list[LeadResponse])
def get_leads(db: Session = Depends(get_db)):
    return db.query(Lead).order_by(Lead.id.desc()).all()


@router.post("/", response_model=LeadResponse, status_code=201)
def create_lead(lead_data: LeadCreate, db: Session = Depends(get_db)):
    lead = Lead(**lead_data.model_dump())

    try:
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Lead not save."
        )

@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_data: LeadCreate,
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found."
        )

    try:
        update_data = lead_data.model_dump()

        for key, value in update_data.items():
            setattr(lead, key, value)

        db.commit()
        db.refresh(lead)
        return lead

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Lead update failed."
        )

@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db)
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found."
        )

    try:
        db.delete(lead)
        db.commit()

        return {
            "message": "Lead deleted successfully.",
            "id": lead_id
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Lead delete failed."
        )