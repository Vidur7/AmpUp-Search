from app.database import SessionLocal
from app.models import User, Analysis

db = SessionLocal()

print("=== USERS ===")
users = db.query(User).all()
for u in users:
    print(f"{u.email}: {u.anonymous_id}")

print("\n=== RECENT ANALYSES ===")
analyses = db.query(Analysis).order_by(Analysis.created_at.desc()).limit(5).all()
for a in analyses:
    print(f"{a.created_at}: {a.anonymous_id} - {a.url}")

db.close()
