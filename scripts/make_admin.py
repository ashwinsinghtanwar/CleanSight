import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
from app.database.database import SessionLocal, Base, engine
from app.models.user import User
from app.models.report import Report  # noqa: F401

Base.metadata.create_all(bind=engine)
db = SessionLocal()
u = db.query(User).filter(User.email == sys.argv[1].lower()).first()
if not u:
    print("No user with that email. Register on the website first.")
    sys.exit(1)
u.role = "municipal"
db.commit()
print(u.email, "is now municipal staff. Log out and log in again.")
