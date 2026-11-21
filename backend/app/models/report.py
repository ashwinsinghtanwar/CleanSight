from sqlalchemy import Column, Integer, String, Float, Text, DateTime, ForeignKey
from datetime import datetime, timezone
from app.database.database import Base


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)   # stored as naive UTC


class Report(Base):
    __tablename__ = "reports"
    id = Column(Integer, primary_key=True, index=True)
    report_code = Column(String, unique=True, index=True)          # CS-20261117-ABCD1234
    user_id = Column(Integer, ForeignKey("users.id"))
    report_type = Column(String, default="garbage", index=True)    # garbage | waterlogging
    original_image = Column(String)
    processed_image = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    accuracy = Column(Float, nullable=True)                        # metres (browser GPS)
    location_source = Column(String, default="manual")             # gps | manual
    location_description = Column(String, default="")              # address / landmark
    notes = Column(Text, default="")                               # citizen description
    garbage_count = Column(Integer, default=0)                     # = number of detections (any type)
    coverage_percentage = Column(Float, default=0)
    severity = Column(String, default="None")                      # None | Low | Medium | High
    detected_classes = Column(Text, default="{}")
    status = Column(String, default="Reported", index=True)
    assigned_to = Column(String, default="")
    resolution_note = Column(Text, default="")
    created_at = Column(DateTime, default=_now)
    updated_at = Column(DateTime, default=_now)
    resolved_at = Column(DateTime, nullable=True)
