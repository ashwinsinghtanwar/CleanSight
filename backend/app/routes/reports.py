import csv
import io
import json
import secrets
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.config import MODELS, REPORT_TYPES, STATUSES
from app.database.database import get_db
from app.models.report import Report
from app.models.user import User
from app.services.images import save_upload
from app.services.yolo_service import analyze
from app.utils.dependencies import current_user, municipal_user

r = APIRouter(prefix="/api", tags=["reports"])


def _now():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _iso(d):
    return d.isoformat() + "Z" if d else None


def out(x: Report, names=None):
    return {
        "id": x.id, "report_code": x.report_code, "user_id": x.user_id,
        "reporter_name": (names or {}).get(x.user_id, ""),
        "report_type": x.report_type or "garbage",
        "category": MODELS.get(x.report_type or "garbage", MODELS["garbage"])["label"],
        "original_image": x.original_image, "processed_image": x.processed_image,
        "latitude": x.latitude, "longitude": x.longitude, "accuracy": x.accuracy,
        "location_source": x.location_source, "address": x.location_description or "",
        "description": x.notes or "", "detection_count": x.garbage_count or 0,
        "coverage_percentage": x.coverage_percentage or 0, "severity": x.severity or "None",
        "detected_classes": json.loads(x.detected_classes or "{}"),
        "status": x.status, "assigned_to": x.assigned_to or "", "resolution_note": x.resolution_note or "",
        "created_at": _iso(x.created_at), "updated_at": _iso(x.updated_at), "resolved_at": _iso(x.resolved_at),
    }


def _names(db, rows):
    ids = {x.user_id for x in rows}
    return {u.id: u.full_name for u in db.query(User).filter(User.id.in_(ids)).all()} if ids else {}


def _new_code(db):
    while True:
        c = f"CS-{_now():%Y%m%d}-{secrets.token_hex(4).upper()}"
        if not db.query(Report).filter(Report.report_code == c).first():
            return c


# ------------------------------------------------------------------ create (upload + AI + save)
@r.post("/reports")
def create_report(
    file: UploadFile = File(...),
    report_type: str = Form(...),
    latitude: float = Form(...),
    longitude: float = Form(...),
    description: str = Form(""),
    address: str = Form(""),
    accuracy: Optional[float] = Form(None),
    location_source: str = Form("manual"),
    u=Depends(current_user),
    db: Session = Depends(get_db),
):
    report_type = (report_type or "").lower()
    if report_type not in REPORT_TYPES:
        raise HTTPException(400, "Choose a complaint type: waterlogging or garbage")
    if not (-90 <= latitude <= 90 and -180 <= longitude <= 180):
        raise HTTPException(400, "Invalid coordinates")
    path, url = save_upload(file)
    try:
        res = analyze(path, report_type)
    except RuntimeError as e:
        path.unlink(missing_ok=True); raise HTTPException(503, str(e))
    except ValueError as e:
        path.unlink(missing_ok=True); raise HTTPException(400, str(e))
    counts = {}
    for d in res["detections"]:
        counts[d["class_name"]] = counts.get(d["class_name"], 0) + 1
    rep = Report(
        report_code=_new_code(db), user_id=u.id, report_type=report_type,
        original_image=url, processed_image=res["processed_image"],
        latitude=latitude, longitude=longitude, accuracy=accuracy,
        location_source="gps" if location_source == "gps" else "manual",
        location_description=address.strip()[:300], notes=description.strip()[:2000],
        garbage_count=res["detection_count"], coverage_percentage=res["coverage_percentage"],
        severity=res["severity"], detected_classes=json.dumps(counts), status="Reported",
    )
    db.add(rep); db.commit(); db.refresh(rep)
    return out(rep, {u.id: u.full_name})


# ------------------------------------------------------------------ list / export
def _query(db, u, status=None, type=None, severity=None, q=None):
    qs = db.query(Report)
    if u.role != "municipal":
        qs = qs.filter(Report.user_id == u.id)
    if status and status != "all":
        qs = qs.filter(Report.status == status)
    if type and type != "all":
        qs = qs.filter(Report.report_type == type)
    if severity and severity != "all":
        qs = qs.filter(Report.severity == severity)
    rows = qs.order_by(Report.id.desc()).all()
    if q:
        k = q.lower()
        rows = [x for x in rows if k in " ".join([x.report_code or "", x.location_description or "", x.notes or "", x.assigned_to or ""]).lower()]
    return rows


@r.get("/reports")
def list_reports(status: str = "all", type: str = "all", severity: str = "all", q: str = "",
                 u=Depends(current_user), db: Session = Depends(get_db)):
    rows = _query(db, u, status, type, severity, q)
    names = _names(db, rows)
    return [out(x, names) for x in rows]


@r.get("/reports/export.csv")
def export_csv(status: str = "all", type: str = "all", severity: str = "all", q: str = "",
               u=Depends(current_user), db: Session = Depends(get_db)):
    rows = _query(db, u, status, type, severity, q)
    names = _names(db, rows)
    buf = io.StringIO()
    w = csv.writer(buf)
    w.writerow(["Report ID", "Category", "Detections", "Coverage %", "Severity", "Status", "Assigned to",
                "Address", "Latitude", "Longitude", "Reporter", "Description", "Created (UTC)", "Resolved (UTC)"])
    for x in rows:
        o = out(x, names)
        w.writerow([o["report_code"], o["category"], o["detection_count"], o["coverage_percentage"], o["severity"],
                    o["status"], o["assigned_to"], o["address"], o["latitude"], o["longitude"], o["reporter_name"],
                    o["description"], o["created_at"] or "", o["resolved_at"] or ""])
    return Response("\ufeff" + buf.getvalue(), media_type="text/csv; charset=utf-8",
                    headers={"Content-Disposition": 'attachment; filename="cleansight-reports.csv"'})


@r.get("/reports/{rid}")
def get_report(rid: int, u=Depends(current_user), db: Session = Depends(get_db)):
    x = db.query(Report).filter(Report.id == rid).first()
    if not x:
        raise HTTPException(404, "Report not found")
    return out(x, _names(db, [x]))


# ------------------------------------------------------------------ municipal management
class StatusIn(BaseModel):
    status: str
    note: Optional[str] = None


class AssignIn(BaseModel):
    assigned_to: str = ""


@r.patch("/reports/{rid}/status")
def set_status(rid: int, b: StatusIn, u=Depends(municipal_user), db: Session = Depends(get_db)):
    if b.status not in STATUSES:
        raise HTTPException(400, "Status must be one of: " + ", ".join(STATUSES))
    x = db.query(Report).filter(Report.id == rid).first()
    if not x:
        raise HTTPException(404, "Report not found")
    x.status = b.status
    x.updated_at = _now()
    x.resolved_at = _now() if b.status == "Resolved" else None
    if b.note is not None:
        x.resolution_note = b.note.strip()[:1000]
    db.commit(); db.refresh(x)
    return out(x, _names(db, [x]))


@r.patch("/reports/{rid}/assign")
def assign(rid: int, b: AssignIn, u=Depends(municipal_user), db: Session = Depends(get_db)):
    x = db.query(Report).filter(Report.id == rid).first()
    if not x:
        raise HTTPException(404, "Report not found")
    x.assigned_to = b.assigned_to.strip()[:120]
    if x.assigned_to and x.status in ("Reported", "Verified"):
        x.status = "Assigned"
    x.updated_at = _now()
    db.commit(); db.refresh(x)
    return out(x, _names(db, [x]))


@r.delete("/reports/{rid}")
def delete_report(rid: int, u=Depends(municipal_user), db: Session = Depends(get_db)):
    x = db.query(Report).filter(Report.id == rid).first()
    if not x:
        raise HTTPException(404, "Report not found")
    db.delete(x); db.commit()
    return {"deleted": rid}


# ------------------------------------------------------------------ live map + analytics
@r.get("/map-data")
def map_data(include_resolved: bool = False, u=Depends(current_user), db: Session = Depends(get_db)):
    """Pins for the live map. Resolved issues are removed from the map unless include_resolved=true."""
    qs = db.query(Report).filter(Report.latitude.isnot(None), Report.longitude.isnot(None))
    if not include_resolved:
        qs = qs.filter(Report.status != "Resolved")
    return [{
        "id": x.id, "report_code": x.report_code, "report_type": x.report_type or "garbage",
        "latitude": x.latitude, "longitude": x.longitude, "severity": x.severity or "None",
        "coverage_percentage": x.coverage_percentage or 0, "status": x.status,
        "address": x.location_description or "", "assigned_to": x.assigned_to or "",
        "thumbnail": x.processed_image, "created_at": _iso(x.created_at),
    } for x in qs.order_by(Report.id.desc()).all()]


@r.get("/analytics")
def analytics(u=Depends(current_user), db: Session = Depends(get_db)):
    rows = db.query(Report).all()
    g = [x for x in rows if (x.report_type or "garbage") == "garbage"]
    w = [x for x in rows if x.report_type == "waterlogging"]
    avg = lambda L: round(sum(x.coverage_percentage or 0 for x in L) / len(L), 2) if L else None
    months = {}
    for x in rows:
        m = x.created_at.strftime("%Y-%m") if x.created_at else "unknown"
        d = months.setdefault(m, {"month": m, "reports": 0, "resolved": 0})
        d["reports"] += 1
        d["resolved"] += 1 if x.status == "Resolved" else 0
    cats = {}
    for x in rows:
        for k, v in json.loads(x.detected_classes or "{}").items():
            cats[k] = cats.get(k, 0) + v
    sev = lambda s: sum(1 for x in rows if x.severity == s)
    return {
        "total_reports": len(rows), "garbage_reports": len(g), "waterlogging_reports": len(w),
        "open_reports": sum(1 for x in rows if x.status != "Resolved"),
        "resolved_reports": sum(1 for x in rows if x.status == "Resolved"),
        "in_progress_reports": sum(1 for x in rows if x.status == "In Progress"),
        "high_open": sum(1 for x in rows if x.severity == "High" and x.status != "Resolved"),
        "avg_garbage_coverage": avg(g), "avg_water_coverage": avg(w),
        "status_counts": {s: sum(1 for x in rows if x.status == s) for s in STATUSES},
        "severity_counts": {s: sev(s) for s in ("Low", "Medium", "High", "None")},
        "monthly": [months[k] for k in sorted(months)],
        "category_counts": cats,
    }
