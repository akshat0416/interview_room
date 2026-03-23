import sys
import os

# allow importing app module
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import get_db

conn = get_db()
cand = conn.execute("SELECT id FROM users WHERE email='testcand@test.com'").fetchone()

if cand:
    user_id = cand["id"]
    conn.execute("INSERT INTO notifications (id, user_id, message, is_read, created_at) VALUES ('test_new_subagent', ?, 'Test notification using real DB connection for testcand@test.com', 0, datetime('now'))", (user_id,))
    conn.commit()
    print('Notification inserted for candidate:', user_id)
else:
    print('No testcand@test.com found')
conn.close()
