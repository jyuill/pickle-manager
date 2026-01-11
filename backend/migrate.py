import sqlite3

def migrate():
    conn = sqlite3.connect('pickle_tracker.db')
    cursor = conn.cursor()
    
    # Add updated_at to recipe if not exists
    try:
        cursor.execute("ALTER TABLE recipe ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP")
        print("Added updated_at to recipe table")
    except sqlite3.OperationalError:
        print("updated_at already exists in recipe table")

    # Add tasting_notes to batch if not exists
    try:
        cursor.execute("ALTER TABLE batch ADD COLUMN tasting_notes TEXT")
        print("Added tasting_notes to batch table")
    except sqlite3.OperationalError:
        print("tasting_notes already exists in batch table")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
