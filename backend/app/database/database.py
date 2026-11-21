import secrets
from datetime import datetime
from sqlalchemy import create_engine, inspect, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import DATABASE_URL

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


_NEW_REPORT_COLS = {
    "report_type": "VARCHAR DEFAULT 'garbage'",
    "report_code": "VARCHAR",
    "accuracy": "FLOAT",
    "location_source": "VARCHAR DEFAULT 'manual'",
    "assigned_to": "VARCHAR DEFAULT ''",
    "resolution_note": "TEXT DEFAULT ''",
    "updated_at": "DATETIME",
    "resolved_at": "DATETIME",
}


def upgrade_schema():
    """Small migration so a database created by an older version keeps working."""
    insp = inspect(engine)
    tables = insp.get_table_names()
    with engine.begin() as conn:
        if "reports" in tables:
            cols = {c["name"] for c in insp.get_columns("reports")}
            for name, ddl in _NEW_REPORT_COLS.items():
                if name not in cols:
                    conn.execute(text(f"ALTER TABLE reports ADD COLUMN {name} {ddl}"))
            conn.execute(text("UPDATE reports SET report_type='garbage' WHERE report_type IS NULL"))
            conn.execute(text("UPDATE reports SET status='Reported' WHERE status IS NULL OR status='Pending'"))
            conn.execute(text("UPDATE reports SET severity='None' WHERE severity IS NULL"))
            for rid, created in conn.execute(text("SELECT id, created_at FROM reports WHERE report_code IS NULL")).fetchall():
                day = str(created or datetime.utcnow())[:10].replace("-", "")
                conn.execute(text("UPDATE reports SET report_code=:c WHERE id=:i"),
                             {"c": f"CS-{day}-{secrets.token_hex(4).upper()}", "i": rid})
        if "users" in tables:
            conn.execute(text("UPDATE users SET role='municipal' WHERE role='admin'"))
            conn.execute(text("UPDATE users SET role='citizen' WHERE role='user' OR role IS NULL"))
