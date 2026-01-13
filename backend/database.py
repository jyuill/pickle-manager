from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Ensure DATABASE_URL is set, otherwise default to a sensible local one for testing if not strict
# Ensure DATABASE_URL is set, otherwise default to a sensible local one for testing if not strict
if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in .env file")

# Clean URL if it contains psql command prefix or quotes (Common if copy-pasted from Neon)
if "psql" in DATABASE_URL:
    parts = DATABASE_URL.split()
    for p in parts:
        if p.startswith("'") and p.endswith("'"):
            DATABASE_URL = p.strip("'")
            break
        elif p.startswith("postgresql://") or p.startswith("postgres://"):
            DATABASE_URL = p
            break

# Fix postgres:// deprecated in SQLAlchemy 1.4+
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
