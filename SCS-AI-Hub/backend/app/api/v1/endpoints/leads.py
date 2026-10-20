from app.models.customer import Customer
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_owner
from app.db.database import get_db
from app.models.lead import Lead
from app.schemas.lead import LeadCreate, LeadResponse

router = APIRouter()


# ==========================================
# GET ALL LEADS (OWNER LOGIN REQUIRED)
# ==========================================
@router.get("/", response_model=list[LeadResponse])
def get_leads(
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    return db.query(Lead).order_by(Lead.id.desc()).all()


# ==========================================
# CREATE LEAD (OWNER LOGIN REQUIRED)
# ==========================================
@router.post("/", response_model=LeadResponse, status_code=201)
def create_lead(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
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
            detail="Lead not save.",
        )


# ==========================================
# PUBLIC CHATBOT INQUIRY
# OWNER LOGIN NOT REQUIRED
# ==========================================
@router.post(
    "/public-inquiry",
    response_model=LeadResponse,
    status_code=201,
)
def create_public_inquiry(
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
):
    name = lead_data.name.strip()
    email = (lead_data.email or "").strip()
    phone = (lead_data.phone or "").strip()

    if not name or not email or not phone:
        raise HTTPException(
            status_code=422,
            detail="Name, email and phone are required.",
        )

    lead = Lead(
        name=name,
        email=email,
        phone=phone,
        company=lead_data.company,
        status="New",
        source=lead_data.source or "Website Chatbot",
        notes=lead_data.notes,
    )

    try:
        db.add(lead)
        db.commit()
        db.refresh(lead)
        return lead

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Unable to submit inquiry. Please try again.",
        )

# ==========================================
# CONVERT LEAD TO CUSTOMER
# OWNER LOGIN REQUIRED
# ==========================================
@router.post("/{lead_id}/convert-to-customer", status_code=201)
def convert_lead_to_customer(
    lead_id: int,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    # Find the lead
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found.",
        )

    # Email is required by the Customer model
    email = (lead.email or "").strip()

    if not email:
        raise HTTPException(
            status_code=422,
            detail="This lead has no email address. Add an email before converting.",
        )

    # Prevent duplicate customers with the same email
    existing_customer = (
        db.query(Customer)
        .filter(Customer.email == email)
        .first()
    )

    if existing_customer:
        raise HTTPException(
            status_code=409,
            detail="A customer with this email already exists.",
        )

    try:
        customer = Customer(
            name=lead.name,
            company=lead.company,
            email=email,
            phone=lead.phone,
            status="Active",
            notes=lead.notes,
        )

        db.add(customer)

        # Mark the original lead as converted
        lead.status = "Converted"

        db.commit()
        db.refresh(customer)

        return {
            "message": "Lead converted to customer successfully.",
            "lead_id": lead.id,
            "lead_status": lead.status,
            "customer": {
                "id": customer.id,
                "name": customer.name,
                "company": customer.company,
                "email": customer.email,
                "phone": customer.phone,
                "status": customer.status,
                "notes": customer.notes,
            },
        }

    except Exception as error:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Lead conversion failed. Please try again.",
        )
    
# ==========================================
# UPDATE LEAD (OWNER LOGIN REQUIRED)
# ==========================================
@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(
    lead_id: int,
    lead_data: LeadCreate,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found.",
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
            detail="Lead update failed.",
        )


# ==========================================
# DELETE LEAD (OWNER LOGIN REQUIRED)
# ==========================================
@router.delete("/{lead_id}")
def delete_lead(
    lead_id: int,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()

    if not lead:
        raise HTTPException(
            status_code=404,
            detail="Lead not found.",
        )

    try:
        db.delete(lead)
        db.commit()

        return {
            "message": "Lead deleted successfully.",
            "id": lead_id,
        }

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="Lead delete failed.",
        )