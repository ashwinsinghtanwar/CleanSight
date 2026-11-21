import threading
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import CORS_ORIGINS, UPLOADS
from app.database.database import Base, engine, upgrade_schema
from app.models.user import User      # noqa: F401  (register tables)
from app.models.report import Report  # noqa: F401
from app.routes import auth, reports
from app.services import yolo_service

Base.metadata.create_all(bind=engine)
upgrade_schema()


@asynccontextmanager
async def lifespan(_app):
    # load both YOLO models in the background so the API is up immediately
    threading.Thread(target=yolo_service.preload, daemon=True).start()
    yield


app = FastAPI(title="CleanSight API", version="3.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.mount("/uploads", StaticFiles(directory=UPLOADS), name="uploads")
for x in (auth.r, reports.r):
    app.include_router(x)


@app.get("/api/health")
def health():
    return {"status": "ok", "models": yolo_service.status()}
