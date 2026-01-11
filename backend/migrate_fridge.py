import sqlite3

def migrate():
    conn = sqlite3.connect('pickle_tracker.db')
    cursor = conn.cursor()
    
    # Add fridge_date to batch if not exists
    try:
        cursor.execute("ALTER TABLE batch ADD COLUMN fridge_date DATE")
        print("Added fridge_date to batch table")
    except sqlite3.OperationalError as e:
        print(f"fridge_date might already exist: {e}")

    conn.commit()
    conn.close()

if __name__ == "__main__":
    migrate()
