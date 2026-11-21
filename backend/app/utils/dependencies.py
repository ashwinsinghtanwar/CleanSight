from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.user import User
from app.utils.security import decode_token

oauth = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def current_user(token: str = Depends(oauth), db: Session = Depends(get_db)):
    uid = decode_token(token)
    u = db.query(User).filter(User.id == uid).first() if uid else None
    if not u:
        raise HTTPException(401, "Invalid or expired token")
    return u


def municipal_user(u=Depends(current_user)):
    if u.role != "municipal":
        raise HTTPException(403, "Municipal staff access required")
    return u
