import os
from sqlalchemy import create_engine, Column, String, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Ensure directory exists
os.makedirs(settings.SESSION_DIR, exist_ok=True)

# Define SQLite database URL
SQLALCHEMY_DATABASE_URL = f"sqlite:///{os.path.join(settings.SESSION_DIR, 'sessions.db')}"

# Create engine (check_same_thread=False is needed for FastAPI with SQLite)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

class SessionRecord(Base):
    __tablename__ = "sessions"
    
    interview_id = Column(String, primary_key=True, index=True)
    data = Column(Text, nullable=False)

# Automatically create tables (production setups might use Alembic, but this handles initial DB creation perfectly)
Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
