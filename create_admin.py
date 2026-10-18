import argparse
from app.database import SessionLocal
from app.models.user import User
from app.core.security import hash_password

def main():
    parser = argparse.ArgumentParser(description="Create initial admin user.")
    parser.add_argument("--username", required=True)
    parser.add_argument("--email", required=True)
    parser.add_argument("--password", required=True)
    args = parser.parse_args()

    db = SessionLocal()
    existing = db.query(User).filter(User.role == "admin").first()
    
    if existing:
        print("Admin already exists. Use the UI to create more.")
        return

    user = User(
        username=args.username,
        email=args.email,
        password_hash=hash_password(args.password),
        first_name="System",
        last_name="Admin",
        role="admin",
        is_active=True
    )
    db.add(user)
    db.commit()
    print(f"Admin {args.username} created successfully.")

if __name__ == "__main__":
    main()
