"""YOLO inference for both complaint types (garbage / waterlogging).

Models are loaded once (in a background thread at startup, or lazily on the first
request) and every call is serialised with a lock, so concurrent requests are safe.
"""
import threading
import uuid

import cv2
import numpy as np

from app.config import MODELS, PROCESSED_DIR, ROOT
from app.services.severity import severity

# BGR box colours drawn on the processed image
BOX_COLOR = {"garbage": (74, 163, 22), "waterlogging": (255, 119, 22)}

_state = {k: {"model": None, "error": None, "loaded": False, "lock": threading.Lock()} for k in MODELS}


def _load(kind):
    s = _state[kind]
    with s["lock"]:
        if s["loaded"]:
            return s
        cfg = MODELS[kind]
        path = cfg["path"]
        try:
            if not path.exists():
                s["error"] = f"{cfg['label']} model not found. Put it at {path.relative_to(ROOT.parent).as_posix()}"
            else:
                from ultralytics import YOLO
                m = YOLO(str(path))
                m.predict(np.zeros((cfg["imgsz"], cfg["imgsz"], 3), np.uint8), imgsz=cfg["imgsz"], verbose=False)  # warm-up
                s["model"] = m
        except Exception as e:  # noqa: BLE001
            s["error"] = f"{cfg['label']} model could not be loaded: {e}"
        s["loaded"] = True
        return s


def preload():
    for kind in MODELS:
        _load(kind)


def status():
    out = {}
    for kind, cfg in MODELS.items():
        s = _state[kind]
        info = {"label": cfg["label"]}
        if not s["loaded"]:
            info["status"] = "loading" if cfg["path"].exists() else "missing"
        elif s["model"] is not None:
            info["status"] = "ready"
            info["classes"] = [str(n) for n in s["model"].names.values()]
        else:
            info["status"] = "error"
            info["error"] = str(s["error"])
        out[kind] = info
    return out


def analyze(path, kind):
    if kind not in MODELS:
        raise ValueError("Unknown report type")
    cfg = MODELS[kind]
    s = _load(kind)
    if s["model"] is None:
        raise RuntimeError(s["error"])
    model = s["model"]

    im = cv2.imread(str(path))
    if im is None:
        raise ValueError("Corrupted or unreadable image")
    h, w = im.shape[:2]

    with s["lock"]:
        res = model.predict(im, conf=cfg["conf"], imgsz=cfg["imgsz"], augment=cfg["augment"], verbose=False)[0]

    names = res.names
    only = cfg["only_classes"]
    # if a user swaps in their own waterlogging model with different class names, don't drop everything
    if only and not any(str(n).lower() in only for n in names.values()):
        only = None

    mask = np.zeros((h, w), dtype=np.uint8)
    detections = []
    annotated = im.copy()
    tint = im.copy()
    color = BOX_COLOR[kind]
    thick = max(2, round(min(h, w) / 300))
    todo = []
    for b in res.boxes:
        cid = int(b.cls[0])
        name = str(names[cid])
        if only and name.lower() not in only:
            continue
        conf = float(b.conf[0])
        if conf < cfg["conf"]:
            continue
        x1, y1, x2, y2 = (int(round(v)) for v in b.xyxy[0].tolist())
        x1, y1, x2, y2 = max(0, x1), max(0, y1), min(w, x2), min(h, y2)
        if x2 <= x1 or y2 <= y1:
            continue
        mask[y1:y2, x1:x2] = 1
        detections.append({"class_id": cid, "class_name": name, "confidence": round(conf, 4), "bbox": [x1, y1, x2, y2]})
        cv2.rectangle(tint, (x1, y1), (x2, y2), color, -1)
        todo.append((x1, y1, x2, y2, name, conf))

    annotated = cv2.addWeighted(tint, 0.18, im, 0.82, 0)         # light tinted area
    fs = max(0.5, min(h, w) / 900)
    for x1, y1, x2, y2, name, conf in todo:
        o = thick // 2
        cv2.rectangle(annotated, (x1 + o, y1 + o), (x2 - o, y2 - o), color, thick)   # inset so full-photo boxes stay visible
        label = f"{name} {conf:.2f}"
        (tw, th), bl = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, fs, 1)
        ty = max(th + bl, y1)
        cv2.rectangle(annotated, (x1, ty - th - bl), (x1 + tw + 4, ty), color, -1)
        cv2.putText(annotated, label, (x1 + 2, ty - bl // 2), cv2.FONT_HERSHEY_SIMPLEX, fs, (255, 255, 255), 1, cv2.LINE_AA)

    fn = f"{uuid.uuid4().hex}.jpg"
    cv2.imwrite(str(PROCESSED_DIR / fn), annotated)
    cov = round(float(mask.mean() * 100), 2)
    return {
        "report_type": kind,
        "detections": detections,
        "detection_count": len(detections),
        "coverage_percentage": cov,
        "severity": severity(cov, len(detections), cfg["sev_low"], cfg["sev_medium"]),
        "processed_image": f"/uploads/processed/{fn}",
    }
