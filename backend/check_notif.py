import sqlite3
import os

db_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'interview_app.db')

conn = sqlite3.connect(db_path)
c = conn.cursor()
cand = c.execute("SELECT id FROM users WHERE role='candidate' LIMIT 1").fetchone()

if cand:
    print('Candidate ID:', cand[0])
    rows = c.execute("SELECT * FROM notifications WHERE user_id=?", (cand[0],)).fetchall()
    print('DB Notifications:', rows)
else:
    print('No candidate found')
