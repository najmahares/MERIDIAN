from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.security import hash_password
from app.dependencies import get_current_user, require_admin
from app.models.user import User
from app.repositories.user_repository import user_repository
from app.schemas.user import UserCreate, UserRead, UserUpdate

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/", response_model=list[UserRead])
def get_users(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    return user_repository.get_all(db, skip=skip, limit=limit)


@router.get("/me", response_model=UserRead)
def get_current_user_info(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.get("/username/{username}", response_model=UserRead)
def get_user_by_username(
    username: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    user = user_repository.get_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/email/{email}", response_model=UserRead)
def get_user_by_email(
    email: str,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    user = user_repository.get_by_email(db, email)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/{user_id}", response_model=UserRead)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def create_user(
    data: UserCreate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    if user_repository.get_by_username(db, data.username):
        raise HTTPException(status_code=400, detail="Username already taken")
    if user_repository.get_by_email(db, data.email):
        raise HTTPException(status_code=400, detail="Email already registered")
    
    values = data.model_dump(exclude={"password"})
    values["password_hash"] = hash_password(data.password)
    return user_repository.create(db, values)


@router.put("/{user_id}", response_model=UserRead)
def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user_repository.update(db, user, data.model_dump(exclude_unset=True))


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    _current_user: User = Depends(require_admin),
):
    user = user_repository.get(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user_repository.delete(db, user)
