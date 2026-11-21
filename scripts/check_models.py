"""Load both YOLO models and run one dummy prediction each."""
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "backend"))
import numpy as np
from app.config import MODELS

ok = True
try:
    from ultralytics import YOLO
except Exception as e:
    print("[ERROR] ultralytics is not installed correctly:", e)
    sys.exit(1)

for kind, cfg in MODELS.items():
    p = cfg["path"]
    if not p.exists():
        print(f"[ERROR] {cfg['label']} model missing: {p}")
        ok = False
        continue
    try:
        m = YOLO(str(p))
        m.predict(np.zeros((cfg["imgsz"], cfg["imgsz"], 3), np.uint8), imgsz=cfg["imgsz"], verbose=False)
        print(f"[OK] {cfg['label']:13s} {p.name:16s} classes: {', '.join(map(str, m.names.values()))}")
    except Exception as e:
        print(f"[ERROR] {cfg['label']} model failed to load: {e}")
        ok = False
sys.exit(0 if ok else 1)
