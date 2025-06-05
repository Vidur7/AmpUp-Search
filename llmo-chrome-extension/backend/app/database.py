from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .db import Base, engine

# Create SQLite database engine
SQLALCHEMY_DATABASE_URL = "sqlite:///./ampup.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)


# Create database tables
def init_db():
    """Initialize database tables"""
    # Import models here to ensure they are registered with Base
    from . import models

    Base.metadata.create_all(bind=engine)


# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class
Base = declarative_base()


# Dependency to get DB session
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
