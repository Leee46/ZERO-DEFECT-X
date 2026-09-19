"""
ZeroDefect X — Python FastAPI Backend API Server
Vision-Based Defect Intelligence & Preventive Manufacturing System API
"""

import os
from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from contextlib import asynccontextmanager


def get_cors_origins():
    raw = os.environ.get("CORS_ORIGINS", "*")
    if raw.strip() == "*":
        return ["*"]
    return [origin.strip() for origin in raw.split(",") if origin.strip()]

from app.database import Base, engine
from app.seed import init_and_seed
from app.routers.api_router import router as api_router

# Ensure uploads and static directories exist
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
uploads_dir = os.path.join(base_dir, "uploads")
static_dir = os.path.join(base_dir, "static")

os.makedirs(os.path.join(uploads_dir, "inspections", "raw"), exist_ok=True)
os.makedirs(os.path.join(uploads_dir, "inspections", "annotated"), exist_ok=True)
os.makedirs(static_dir, exist_ok=True)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize database tables and seed demonstration data on startup
    init_and_seed()
    yield

app = FastAPI(
    title="ZeroDefect X API",
    description="Vision-Based Defect Intelligence & Preventive Manufacturing API Node",
    version="3.0.0",
    lifespan=lifespan
)

# CORS configuration for cross-device & frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file endpoints for images
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Mount API Routers
app.include_router(api_router)

@app.get("/")
def read_root():
    return {
        "status": "ONLINE",
        "system": "ZeroDefect X Manufacturing Intelligence Node",
        "version": "3.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8001))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=True)
