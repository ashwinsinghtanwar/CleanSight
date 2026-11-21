import shutil
import uuid
from fastapi import HTTPException, UploadFile
from PIL import Image
from app.config import ORIGINAL_DIR, MAX_UPLOAD_BYTES


def save_upload(file: UploadFile):
    """Validate and store an uploaded photo. Returns (path, public_url). WEBP is converted to JPG."""
    tmp = ORIGINAL_DIR / f"{uuid.uuid4().hex}.tmp"
    with tmp.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    try:
        if tmp.stat().st_size > MAX_UPLOAD_BYTES:
            raise HTTPException(413, "Image is too large (max 15 MB)")
        try:
            with Image.open(tmp) as im:
                fmt = (im.format or "").upper()
                im.verify()
        except Exception:
            raise HTTPException(400, "Corrupted or unreadable image")
        if fmt not in {"JPEG", "PNG", "WEBP"}:
            raise HTTPException(415, "Only JPG, PNG and WEBP images are supported")
        if fmt == "WEBP":
            final = tmp.with_suffix(".jpg")
            with Image.open(tmp) as im:
                im.convert("RGB").save(final, "JPEG", quality=92)
            tmp.unlink(missing_ok=True)
        else:
            final = tmp.with_suffix(".png" if fmt == "PNG" else ".jpg")
            tmp.rename(final)
        return final, f"/uploads/original/{final.name}"
    except HTTPException:
        tmp.unlink(missing_ok=True)
        raise
