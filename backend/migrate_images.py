from sqlmodel import create_engine, text
from dotenv import load_dotenv
import os

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL must be set")

# Clean URL if it contains psql command prefix or quotes
if "psql" in DATABASE_URL:
    # Extract the actual URL part (simple split usually works if it's "psql 'url'")
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

print(f"Using Database URL: {DATABASE_URL}")

engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        # 1. Add image_url to tasting_note if not exists
        print("Checking/Adding image_url to tasting_note...")
        try:
            conn.execute(text("ALTER TABLE tasting_note ADD COLUMN image_url VARCHAR"))
            print(" - Added image_url column.")
        except Exception as e:
            if "duplicate column" in str(e) or "already exists" in str(e):
                print(" - Column image_url already exists.")
            else:
                print(f" - Error adding column: {e}")

        # 2. Create batch_image table
        print("Creating batch_image table...")
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS batch_image (
                    id SERIAL PRIMARY KEY,
                    batch_id VARCHAR NOT NULL,
                    image_url VARCHAR NOT NULL,
                    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc'),
                    FOREIGN KEY (batch_id) REFERENCES batch (id)
                )
            """))
            print(" - Table batch_image ensures existence.")
        except Exception as e:
            print(f" - Error creating table: {e}")
            
        conn.commit()
        print("Migration complete.")

if __name__ == "__main__":
    migrate()
