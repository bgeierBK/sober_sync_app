import random
from datetime import datetime, timedelta
from server import db, create_app  # Import create_app to get the Flask app
from server.models import User, Event, FriendRequest, friend_association, user_event

# Create the Flask app instance
app = create_app()

# Helper function to create random users
def create_users():
    users = []
    for i in range(1, 6):
        user = User(
            username=f'User{i}',
            age=random.randint(18, 50),
            _hashed_password='password123',  # Ideally, use a real password hashing here
            email_address=f'user{i}@example.com',
            bio=f'This is the bio for user {i}.',
            gender=random.choice(['Male', 'Female', 'Non-binary']),
            orientation=random.choice(['Heterosexual', 'Homosexual', 'Bisexual']),
            sober_status=random.choice(['Sober', 'Not Sober'])
        )
        db.session.add(user)
        users.append(user)
    db.session.commit()
    return users

# Helper function to create friend requests and relationships
def create_friend_requests(users):
    for i in range(0, len(users)):
        for j in range(i + 1, len(users)):
            # Randomly decide if the request is approved or pending
            request_status = random.choice(['approved', 'pending'])

            # Send a friend request from user[i] to user[j]
            request = FriendRequest(
                sender_id=users[i].id,
                receiver_id=users[j].id,
                status=request_status  # Status is either 'approved' or 'pending'
            )
            db.session.add(request)
            
            if request.status == 'approved':
                reverse_request = FriendRequest(
                    sender_id=users[j].id,
                    receiver_id=users[i].id,
                    status='approved'
                )
                db.session.add(reverse_request)

                # Add users to each other's friends list
                users[i].friends.append(users[j])
                users[j].friends.append(users[i])

    db.session.commit()

# Helper function to add users to events (user_event table)
def add_users_to_events(users, events):
    for event in events:
        attendees = random.sample(users, random.randint(1, len(users)))
        for user in attendees:
            event.attendees.append(user)
        db.session.commit()

def seed_data():
    print("Seeding Users...")
    users = create_users()

    print("Fetching Existing Events...")
    events = Event.query.all()  # Fetch existing events from the database

    print("Seeding Friend Requests...")
    create_friend_requests(users)

    print("Adding Users to Events...")
    add_users_to_events(users, events)

    print("Data Seeding Complete!")

# Run the seeding within an app context
if __name__ == "__main__":
    with app.app_context():  # Ensure this block is run within the app context
        print("Clearing existing data...")
        db.drop_all()
        db.create_all()

        seed_data()
