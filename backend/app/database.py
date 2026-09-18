import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Database URL from env or SQLite default for instant zero-dependency execution
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./zerodefect.db")

# SQLite requires check_same_thread=False
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    """Dependency for API endpoints to obtain a DB session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
