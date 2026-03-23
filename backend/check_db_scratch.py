import sqlite3
import os
import json

DB_PATH = r"c:\Users\aksha\OneDrive\Desktop\VS Code\Ai_Interview_bps_antig\backend\data\interview_app.db"

def check_db():
    if not os.path.exists(DB_PATH):
        return {"error": "DB not found"}

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    
    # Recent completed interviews
    iv_rows = conn.execute("SELECT id, candidate_name, status, completed_at FROM interviews WHERE status='Completed' ORDER BY completed_at DESC LIMIT 10").fetchall()
    interviews = [dict(r) for r in iv_rows]
    
    # Answers by interview_id
    ans_counts = conn.execute("SELECT interview_id, COUNT(*) as count FROM answers GROUP BY interview_id").fetchall()
    answers = []
    for row in ans_counts:
        iid = row['interview_id']
        # Check if it exists exactly
        exists = conn.execute("SELECT id FROM interviews WHERE id = ?", (iid,)).fetchone()
        
        # Check if it exists if we strip it
        exists_stripped = conn.execute("SELECT id FROM interviews WHERE id = ?", (iid.strip(),)).fetchone()
        
        answers.append({
            "interview_id": iid,
            "count": row['count'],
            "exists_exact": True if exists else False,
            "exists_stripped": True if exists_stripped else False,
            "len": len(iid)
        })

    conn.close()
    return {
        "recent_completed_interviews": interviews,
        "answers_by_interview": answers
    }

if __name__ == "__main__":
    result = check_db()
    with open("db_check_results.json", "w") as f:
        json.dump(result, f, indent=2)
    print("Results written to db_check_results.json")
