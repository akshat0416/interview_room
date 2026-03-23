import sqlite3
import os

DB_PATH = r"backend/data/interview_app.db"

def get_admin():
    if not os.path.exists(DB_PATH):
        print("none")
        return
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute("SELECT email FROM users WHERE role='admin' LIMIT 1").fetchone()
    print(row['email'] if row else "none")
    conn.close()

if __name__ == "__main__":
    get_admin()
