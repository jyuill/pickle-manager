import sqlite3
from sqlmodel import Session, create_engine, SQLModel
from models import Recipe, Batch, TastingNote
from datetime import datetime

# Configuration
SQLITE_DB = "pickle_tracker.db"
POSTGRES_DB = "postgresql://jy@localhost/pickle_app" 

def migrate():
    print("Starting migration...")
    
    # 1. Connect to SQLite (Source)
    sqlite_conn = sqlite3.connect(SQLITE_DB)
    sqlite_conn.row_factory = sqlite3.Row
    cursor = sqlite_conn.cursor()
    
    # 2. Connect to Postgres (Destination)
    pg_engine = create_engine(POSTGRES_DB)
    SQLModel.metadata.create_all(pg_engine) # Create tables
    
    with Session(pg_engine) as session:
        # --- Migrate Recipes ---
        print("Migrating Recipes...")
        cursor.execute("SELECT * FROM recipe")
        sqlite_recipes = cursor.fetchall()
        
        for row in sqlite_recipes:
            # Map SQLite row to Postgres Model
            # Note: creating dict from row, handling potential missing fields if any
            recipe_data = dict(row)
            
            # Ensure timestamps are parsed if they are strings
            if isinstance(recipe_data.get('created_at'), str):
                try:
                    recipe_data['created_at'] = datetime.fromisoformat(recipe_data['created_at'])
                except ValueError:
                    pass # Keep as is or handle error
            if isinstance(recipe_data.get('updated_at'), str):
                 try:
                    recipe_data['updated_at'] = datetime.fromisoformat(recipe_data['updated_at'])
                 except ValueError:
                    pass

            recipe = Recipe(**recipe_data)
            session.add(recipe)
        
        session.commit()
        print(f"Migrated {len(sqlite_recipes)} recipes.")

        # --- Migrate Batches & Transform Tasting Notes ---
        print("Migrating Batches and transforming notes...")
        cursor.execute("SELECT * FROM batch")
        sqlite_batches = cursor.fetchall()
        
        for row in sqlite_batches:
            batch_data = dict(row)
            
            # Extract fields that are moving to TastingNote
            old_tasting_note = batch_data.pop('tasting_notes', None)
            old_rating = batch_data.pop('rating', None)
            
            # Handle timestamps
            if isinstance(batch_data.get('created_at'), str):
                try:
                    batch_data['created_at'] = datetime.fromisoformat(batch_data['created_at'])
                except ValueError:
                    pass
            # Handle dates (made_date, fridge_date) - SQLModel might handle strings but better to be safe?
            # actually SQLModel/Pydantic parses ISO date strings automatically.
            
            # Create Batch
            batch = Batch(**batch_data)
            session.add(batch)
            
            # Create TastingNote if data exists
            if old_tasting_note or old_rating:
                print(f"Creating tasting note for batch {batch.id}")
                note = TastingNote(
                    batch_id=batch.id,
                    reviewer_name="Maker", # Default name
                    note=old_tasting_note if old_tasting_note else "",
                    rating=old_rating if old_rating else 0,
                    created_at=datetime.utcnow()
                )
                session.add(note)
                
        session.commit()
        print(f"Migrated {len(sqlite_batches)} batches.")

    sqlite_conn.close()
    print("Migration complete!")

if __name__ == "__main__":
    migrate()
