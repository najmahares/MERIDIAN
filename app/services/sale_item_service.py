from uuid import UUID

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.repositories.sale_item_repository import sale_item_repository
from app.schemas.sale_item import SaleItemCreate, SaleItemUpdate


def get_sale_item(db: Session, sale_item_id: UUID):
    sale_item = sale_item_repository.get(db, sale_item_id)
    if not sale_item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Sale item not found"
        )
    return sale_item


def list_sale_items(db: Session):
    return sale_item_repository.get_all(db)


def create_sale_item(db: Session, data: SaleItemCreate):
    return sale_item_repository.create(db, data.model_dump())


def update_sale_item(db: Session, sale_item_id: UUID, data: SaleItemUpdate):
    sale_item = get_sale_item(db, sale_item_id)
    return sale_item_repository.update(db, sale_item, data.model_dump(exclude_unset=True))


def delete_sale_item(db: Session, sale_item_id: UUID):
    sale_item = get_sale_item(db, sale_item_id)
    sale_item_repository.delete(db, sale_item)
