from datetime import datetime, timedelta, timezone
import bcrypt
from jose import jwt, JWTError
from app.config import SECRET_KEY, ACCESS_TOKEN_EXPIRE_MINUTES

ALGORITHM = "HS256"


def hash_password(x: str) -> str:
    return bcrypt.hashpw(x.encode()[:72], bcrypt.gensalt()).decode()


def verify_password(x: str, h: str) -> bool:
    try:
        return bcrypt.checkpw(x.encode()[:72], h.encode())
    except ValueError:
        return False


def create_token(uid):
    exp = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": str(uid), "exp": exp}, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(t):
    try:
        return int(jwt.decode(t, SECRET_KEY, algorithms=[ALGORITHM])["sub"])
    except (JWTError, KeyError, ValueError):
        return None
