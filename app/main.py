"""Main FastAPI application module."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    auth,
    category,
    customer,
    payment,
    product,
    receipt,
    sale,
    sale_item,
    supplier,
    user,
)

app = FastAPI(
    title="Hospital Pharmacy POS System",
    description="Point of Sale System for Hospital and Pharmacy Management",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(category.router)
app.include_router(customer.router)
app.include_router(payment.router)
app.include_router(product.router)
app.include_router(receipt.router)
app.include_router(sale.router)
app.include_router(sale_item.router)
app.include_router(supplier.router)
app.include_router(user.router)


@app.get("/")
def root():
    """Root endpoint."""
    return {"message": "Hospital Pharmacy POS System API", "status": "running"}


@app.get("/health")
def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}
