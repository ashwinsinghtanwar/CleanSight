"""Central configuration. Loads backend/.env if present."""
import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parents[1]          # .../backend
load_dotenv(ROOT / ".env")
os.environ.setdefault("YOLO_AUTOINSTALL", "False")   # never let Ultralytics pip-install things at runtime
os.environ.setdefault("YOLO_VERBOSE", "False")

UPLOADS = ROOT / "uploads"
ORIGINAL_DIR = UPLOADS / "original"
PROCESSED_DIR = UPLOADS / "processed"
MODELS_DIR = ROOT / "ai_models"
for _d in (ORIGINAL_DIR, PROCESSED_DIR, MODELS_DIR):
    _d.mkdir(parents=True, exist_ok=True)

DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{(ROOT / 'cleansight.db').as_posix()}")
SECRET_KEY = os.getenv("SECRET_KEY", "dev-change-me")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
CORS_ORIGINS = [o.strip() for o in os.getenv(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",") if o.strip()]

REPORT_TYPES = ("garbage", "waterlogging")

# Every model must be at least this confident before a detection is shown/counted (40 %).
MIN_CONF = 0.40


def _conf(env_name):
    try:
        v = float(os.getenv(env_name, str(MIN_CONF)))
    except ValueError:
        v = MIN_CONF
    return max(MIN_CONF, min(v, 0.95))        # can be raised in .env, never lowered below 0.40


# One entry per complaint type the user can pick on the Report page.
MODELS = {
    "garbage": {
        "label": "Land Garbage",
        # YOLO11m, single class "garbage" (municipal waste imagery), 50 epochs, val mAP50 0.77.
        # Source: github.com/Pravesh-21/Garbage_Detection_System
        "path": MODELS_DIR / "garbage.pt",
        "imgsz": 640,
        "augment": False,
        "conf": _conf("GARBAGE_CONF"),
        "only_classes": None,                           # keep every class
        # share of the photo covered by garbage boxes -> severity (this model boxes whole heaps)
        "sev_low": 20, "sev_medium": 50,
    },
    "waterlogging": {
        "label": "Waterlogging",
        "path": MODELS_DIR / "waterlogging.pt",
        # Tuned on 500 held-out images: 640px was clearly worse (AP50 0.58) than 416 (0.70) / 512 (0.71);
        # 512px + test-time augmentation gave the best result (AP50 0.73).
        "imgsz": 512,
        "augment": True,
        "conf": _conf("WATERLOGGING_CONF"),
        # waterlogging.pt also knows pothole / crack / debris - we only want water.
        "only_classes": {"waterlogging"},
        "sev_low": 10, "sev_medium": 30,
    },
}

# ---- municipal workflow ----
STATUSES = ("Reported", "Verified", "Assigned", "In Progress", "Resolved")
MUNICIPAL_ACCESS_CODE = os.getenv("MUNICIPAL_ACCESS_CODE", "CLEANSIGHT-STAFF")
MAX_UPLOAD_BYTES = 15 * 1024 * 1024
