import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.config import MUNICIPAL_ACCESS_CODE
from app.database.database import get_db
from app.models.user import User
from app.schemas.auth import Register, Login
from app.utils.security import hash_password, verify_password, create_token
from app.utils.dependencies import current_user

r = APIRouter(prefix="/api/auth", tags=["auth"])


def _user(u):
    return {"id": u.id, "full_name": u.full_name, "email": u.email, "role": u.role}


@r.post("/register")
def register(x: Register, db: Session = Depends(get_db)):
    email = x.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "Email already registered")
    role = "citizen"
    if x.account_type == "municipal":
        first_user = db.query(User).count() == 0          # very first account bootstraps the system
        if not first_user and not secrets.compare_digest(x.access_code or "", MUNICIPAL_ACCESS_CODE):
            raise HTTPException(403, "Wrong municipal access code")
        role = "municipal"
    elif db.query(User).count() == 0:
        role = "municipal"                                 # first ever account is always staff
    u = User(full_name=x.full_name.strip(), email=email, hashed_password=hash_password(x.password), role=role)
    db.add(u); db.commit(); db.refresh(u)
    return {"access_token": create_token(u.id), "user": _user(u)}


@r.post("/login")
def login(x: Login, db: Session = Depends(get_db)):
    u = db.query(User).filter(User.email == x.email.lower()).first()
    if not u or not verify_password(x.password, u.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    return {"access_token": create_token(u.id), "user": _user(u)}


@r.get("/me")
def me(u=Depends(current_user)):
    return _user(u)
