# ZeroDefect X — Backend API Service

FastAPI-powered REST API backend for Vision-Based Defect Intelligence & Preventive Manufacturing System.

## Architecture & Features
- **SQLAlchemy ORM**: Supports PostgreSQL & SQLite transparently.
- **Vision Abstraction**: Pluggable `VisionProvider` interface with initial `DemoVisionProvider`.
- **Root-Cause Service**: Non-causal multi-factor association analyzer.
- **Risk Service**: Transparent, explainable machine & plant risk engine.
- **FastAPI OpenAPI Documentation**: Auto-generated Swagger docs at `/docs`.

## Quick Start
```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Run backend (auto seeds database on startup)
python -m app.main
```

API Server running at: `http://localhost:8000`
Swagger UI Docs: `http://localhost:8000/docs`
