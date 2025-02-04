import random
import requests
from flask_bcrypt import Bcrypt
from server.models import db, User, Event, FriendRequest
from server.api_utils import fetch_and_add_events
from app import app  # Import your Flask app here

bcrypt = Bcrypt(app)  # Initialize bcrypt with Flask app

def create_users():
    names = [
        "Alice", "Bobby", "Charlie", "David", "Eve-May", "Frank", "Grace", "Hannah", "Ivysaur", "Jackson",
        "Karen", "Leonardo", "Mason", "NinaLou", "Olivia", "Pauly", "Quincy", "Riley", "Sophia", "Tommy",
        "Umathurman", "Reginald", "Willy", "Xander", "Yaral", "Zanestopher"
    ]
    
    # Create user instances with hashed passwords
    users = [
        User(
            username=names[i], 
            email_address=f"user{i+1}@example.com", 
            _hashed_password=bcrypt.generate_password_hash("password").decode('utf-8'), 
            age=25  # Default age set to 25
        )
        for i in range(len(names))
    ]
    
    # Add users to the session
    db.session.add_all(users)
    
    # Commit to save the users in the database
    db.session.commit()
    
    print(f"{len(users)} users successfully added.")
    
    # Return the list of users
    return users

def create_friend_requests(users):
    friend_requests = []

    for user in users:
        potential_friends = [u for u in users if u.id != user.id]  # Avoid self-friend request
        if potential_friends:
            friend_requests.append(
                FriendRequest(
                    sender_id=user.id,
                    receiver_id=random.choice(potential_friends).id,
                    status="pending",
                )
            )

    db.session.add_all(friend_requests)  # Add friend requests to session
    db.session.commit()  # Commit to database

    print(f"{len(friend_requests)} friend requests successfully added.")

def add_users_to_events(users, events):
    if not events:
        print("No events available to assign users.")
        return

    for user in users:
        num_events = random.randint(1, min(3, len(events)))  # 1-3 events per user
        selected_events = random.sample(events, num_events)

        for event in selected_events:
            user.events.append(event)  # Many-to-many relationship

    db.session.commit()
    print(f"Assigned users to events.")

def seed_data():
    print("Clearing existing data...")
    db.session.query(User).delete()
    db.session.query(Event).delete()
    db.session.query(FriendRequest).delete()
    db.session.commit()
    print("Database cleared.")

    print("Fetching and Seeding Events...")
    fetch_and_add_events()

    print("Fetching Existing Events...")
    events = Event.query.all()
    print(f"Fetched {len(events)} events.")

    print("Seeding Users...")
    users = create_users()  # Capture the returned list of users
    if not users:
        print("Error: No users were created.")
        return
    
    print("Seeding Friend Requests...")
    create_friend_requests(users)  # Pass users to create_friend_requests
    print("Friend Requests successfully added.")

    print("Assigning Users to Events...")
    add_users_to_events(users, events)
    print("Users assigned to events.")

if __name__ == "__main__":
    with app.app_context():  # Ensure that we run the script within the app context
        print("Clearing existing data...")
        with db.session.begin():
            db.session.query(User).delete()
            db.session.query(Event).delete()
            db.session.query(FriendRequest).delete()
        db.session.commit()
        print("Database cleared.")

        seed_data()
