import requests
import sys
import os
from werkzeug.security import generate_password_hash  # For password hashing
from app import db, create_app  # Assuming create_app initializes the app
from server.models import User, Event  # Adjust the import path based on your project structure
from server.api_utils import refresh_events


sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), 'app')))

app = create_app()  # This should be the function that sets up your Flask app

# Function to seed users
def seed_users():
    users = [
        {
            "username": "john_doe",
            "age": 28,
            "email_address": "john@example.com",
            "bio": "Love to go to events and concerts!",
            "profile_pic": "https://example.com/john.jpg",
            "gender": "Male",
            "orientation": "Straight",
            "sober_status": "No",
            "_hashed_password": generate_password_hash("password123")
        },
        {
            "username": "jane_smith",
            "age": 34,
            "email_address": "jane@example.com",
            "bio": "A big fan of EDM music and tech!",
            "profile_pic": "https://example.com/jane.jpg",
            "gender": "Female",
            "orientation": "Lesbian",
            "sober_status": "Yes",
            "_hashed_password": generate_password_hash("password123")
        }
    ]
    
    with app.app_context():
        for user_data in users:
            user = User(**user_data)
            db.session.add(user)

        db.session.commit()
        print("Users seeded successfully!")

def seed_events():
    """Clear and refresh events."""
    with app.app_context():
        refresh_events()

if __name__ == '__main__':
    action = sys.argv[1] if len(sys.argv) > 1 else None
    if action == 'users':
        seed_users()
    elif action == 'events':
        seed_events()
    else:
        print("Usage: python seed.py [users|events]")
