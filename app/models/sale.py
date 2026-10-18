import uuid
from datetime import datetime
from decimal import Decimal

from sqlalchemy import Column, Date, DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    sale_number = Column(String, unique=True, index=True, nullable=False)
    sale_date = Column(DateTime, default=datetime.now)
    subtotal = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    tax_amount = Column(Numeric(10, 2), default=Decimal("0.00"))
    discount_amount = Column(Numeric(10, 2), default=Decimal("0.00"))
    total_amount = Column(Numeric(10, 2), nullable=False, default=Decimal("0.00"))
    status = Column(String, default="completed")
    prescription_number = Column(String, nullable=True)
    prescribing_doctor = Column(String, nullable=True)
    dispense_date = Column(Date, nullable=True)
    notes = Column(String, nullable=True)

    customer_id = Column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)

    customer = relationship("Customer", back_populates="sales")
    user = relationship("User", back_populates="sales")
    sale_items = relationship(
        "SaleItem", back_populates="sale", cascade="all, delete-orphan"
    )
    payments = relationship(
        "Payment", back_populates="sale", cascade="all, delete-orphan"
    )
    receipt = relationship(
        "Receipt", back_populates="sale", cascade="all, delete-orphan", uselist=False
    )
