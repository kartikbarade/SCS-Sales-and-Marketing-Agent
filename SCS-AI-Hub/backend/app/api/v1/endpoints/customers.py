
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_owner
from app.db.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerResponse

router = APIRouter()


@router.get("/", response_model=list[CustomerResponse])
def get_customers(
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    return db.query(Customer).order_by(Customer.id.desc()).all()


@router.post("/", response_model=CustomerResponse, status_code=201)
def create_customer(
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    customer = Customer(**customer_data.model_dump())

    try:
        db.add(customer)
        db.commit()
        db.refresh(customer)
        return customer
    except Exception as error:
        db.rollback()
        print(f"Customer create error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Customer could not be saved.",
        )


@router.put("/{customer_id}", response_model=CustomerResponse)
def update_customer(
    customer_id: int,
    customer_data: CustomerCreate,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    try:
        update_data = customer_data.model_dump()

        for key, value in update_data.items():
            setattr(customer, key, value)

        db.commit()
        db.refresh(customer)
        return customer
    except Exception as error:
        db.rollback()
        print(f"Customer update error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Customer update failed.",
        )


@router.delete("/{customer_id}")
def delete_customer(
    customer_id: int,
    db: Session = Depends(get_db),
    current_owner: dict = Depends(get_current_owner),
):
    customer = (
        db.query(Customer)
        .filter(Customer.id == customer_id)
        .first()
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found.",
        )

    try:
        db.delete(customer)
        db.commit()

        return {
            "message": "Customer deleted successfully.",
            "id": customer_id,
        }
    except Exception as error:
        db.rollback()
        print(f"Customer delete error: {error}")
        raise HTTPException(
            status_code=500,
            detail="Customer delete failed.",
        )
