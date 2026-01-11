from sqlmodel import SQLModel, create_engine, Session
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

# Ensure DATABASE_URL is set, otherwise default to a sensible local one for testing if not strict
if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set in .env file")

engine = create_engine(DATABASE_URL)

def get_session():
    with Session(engine) as session:
        yield session

def init_db():
    SQLModel.metadata.create_all(engine)
