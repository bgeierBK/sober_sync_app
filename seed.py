import random
from flask_bcrypt import Bcrypt
from server.models import db, User, Event, FriendRequest, user_event, friend_association
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

def create_friendships(users):
    friendships = []

    # Clear existing friend associations and friend requests to avoid duplicates
    db.session.query(friend_association).delete()
    db.session.query(FriendRequest).delete()
    db.session.commit()

    for user in users:
        potential_friends = [u for u in users if u.id != user.id]  # Avoid self-friendship
        
        # Ensure the user gets at least 5 friends
        friends_to_add = random.sample(potential_friends, 5)  # Select 5 friends randomly
        for friend in friends_to_add:
            # Check if they are already friends (check both directions)
            existing_friendship = db.session.query(friend_association).filter(
                (friend_association.c.user_id == user.id) & (friend_association.c.friend_id == friend.id) | 
                (friend_association.c.user_id == friend.id) & (friend_association.c.friend_id == user.id)
            ).first()

            # If they are already friends, skip creating a friend request
            if not existing_friendship:
                # Create a new friend request with a "pending" status
                friendships.append(
                    FriendRequest(
                        sender_id=user.id,
                        receiver_id=friend.id,
                        status="pending"  # Friend request status is "pending"
                    )
                )

                # Add the friend association to the table to mark them as friends
                db.session.execute(
                    friend_association.insert().values(user_id=user.id, friend_id=friend.id)
                )
                db.session.execute(
                    friend_association.insert().values(user_id=friend.id, friend_id=user.id)
                )

    # Add all friendship requests to the session and commit the changes
    if friendships:
        db.session.add_all(friendships)
        db.session.commit()

    print(f"{len(friendships)} friendships successfully added.")









def add_users_to_events(users, events, max_events_per_user=5):
    # Clear the user_event table first to ensure a clean slate
    db.session.query(user_event).delete()
    db.session.commit()

    for user in users:
        # Randomly select a subset of events for the user
        events_to_assign = random.sample(events, min(len(events), max_events_per_user))  # Ensure user attends max_events_per_user or less
        
        for event in events_to_assign:
            # Add the user to the event
            event.attendees.append(user)
        
        db.session.commit()  # Commit the changes after adding users to events

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
    
    print("Seeding Friendships...")
    create_friendships(users)  # Create friendships for users
    print("Friendships successfully added.")

    print("Assigning Users to Events...")
    add_users_to_events(users, events)  # Assign users to events
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
