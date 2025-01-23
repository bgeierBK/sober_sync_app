import os
import sys
from flask import Flask, request, session, jsonify
from flask_socketio import SocketIO, join_room, leave_room, send
from flask_migrate import Migrate
from server import create_app
from server.api_utils import fetch_and_add_events
from server.models import User, Event, ChatMessage
from server.extensions import db, bcrypt
from server import create_app, socketio
from datetime import timedelta
from flask_session import Session

sys.path.append(os.path.dirname(os.path.abspath(__file__)))



# Create and configure the app
app = create_app()

app.config['SESSION_PERMANENT'] = True
app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
app.config['SESSION_COOKIE_SAMESITE'] = "None"  # For cross-origin cookies
app.config['SESSION_COOKIE_SECURE'] = False     # Use True in production with HTTPS
app.config['SESSION_TYPE'] = "filesystem"       # Change to 'redis' for production
app.config['SESSION_FILE_DIR'] = "/tmp/flask_sessions"  # Local session storage

Session(app)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# Fetch events when the app starts up (if needed)
with app.app_context():
    fetch_and_add_events()

# Example root route
@app.route('/')
def home():
    return "<h1>Welcome to the Flask App</h1>"

@app.route('/favicon.ico')
def favicon():
    return "", 204

# Fetch and import events route
@app.route('/api/import-events', methods=['POST'])
def import_events():
    try:
        fetch_and_add_events()
        return {"message": "Events imported successfully."}, 200
    except Exception as e:
        return {"error": str(e)}, 500
    
    

# User login and authentication routes
@app.post('/api/users')
def create_user():
    try:
        new_user = User(
            username=request.json.get('username'),
            age=int(request.json.get('age')),
            email_address=request.json.get('email_address'),
            bio=request.json.get('bio'),
            gender=request.json.get('gender'),
            orientation=request.json.get('orientation'),
            sober_status=request.json.get('sober_status'),
        )
        new_user.hashed_password = request.json.get('password')
        db.session.add(new_user)
        db.session.commit()

        # Set session
        session['user_id'] = new_user.id
        session.permanent = True  # Explicitly make the session permanent
        return new_user.to_dict(), 201
    except Exception as e:
        print(f"Error: {e}")
        return {'error': str(e)}, 406




@app.get("/api/check_session")
def check_session():
    print("Session contents:", session)  # Debug session contents
    if 'user_id' in session:
        user = User.query.get(session['user_id'])
        if user:
            return user.to_dict(), 200
        else:
            return {'error': 'user not found'}, 404
    else:
        return {'error': 'no active session'}, 204



@app.post('/api/login')
def login():
    user = User.query.filter_by(username=request.json.get('username')).first()
    if user and bcrypt.check_password_hash(user._hashed_password, request.json.get('password')):
        session['user_id'] = user.id
        return user.to_dict(), 201
    else:
        return {'error': 'Username or password was invalid'}, 401

@app.delete('/api/logout')
def logout():
    session.pop('user_id', None)
    return {}, 204

# User management routes
@app.get('/api/users')
def get_users():
    return [user.to_dict() for user in User.query.all()], 200

@app.get('/api/users/<int:id>')
def get_one_user(id):
    user = User.query.get(id)
    if user:
        return jsonify(user.to_dict()), 200
    return {'error': 'User not found'}, 404

@app.patch('/api/users/<int:id>')
def update_user(id):
    user = User.query.get(id)
    if user:
        for key, value in request.json.items():
            setattr(user, key, value)
        db.session.commit()
        return user.to_dict(), 200
    return {'error': 'User not found'}, 404

@app.delete('/api/users/<int:id>')
def delete_user(id):
    user = User.query.get(id)
    if user:
        db.session.delete(user)
        db.session.commit()
        return {}, 204
    return {'error': 'User not found'}, 404

# chat message routes

@app.get('/api/events/<int:event_id>/chat_messages', endpoint="fetch_event_chat_messages")
def get_event_chat_messages(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return {'error': 'Event not found'}, 404
        chat_messages = ChatMessage.query.filter_by(event_id=event_id).all()
        return [message.to_dict() for message in chat_messages], 200
    except Exception as e:
        return {'error': str(e)}, 500


#event routes

@app.get('/api/events')
def get_events():
    return [event.to_dict() for event in Event.query.all()], 200

@app.get('/api/events/<int:id>')
def get_one_event(id):
    event = Event.query.get(id)
    if event:
        return jsonify(event.to_dict()), 200
    return {'error': 'User not found'}, 404

@app.patch('/api/events/<int:id>')
def update_event(id):
    event = Event.query.get(id)
    if event:
        for key, value in request.json.items():
            setattr(event, key, value)
        db.session.commit()
        return event.to_dict(), 200
    return {'error': 'User not found'}, 404

@app.delete('/api/events/<int:id>')
def delete_event(id):
    event = Event.query.get(id)
    if event:
        db.session.delete(event)
        db.session.commit()
        return {}, 204
    return {'error': 'User not found'}, 404

@app.post('/api/events/<int:event_id>/rsvp')
def rsvp_to_event(event_id):
    if 'user_id' not in session:
        return {'error': 'You must be logged in to RSVP'}, 401

    user_id = session['user_id']
    event = Event.query.get(event_id)
    user = User.query.get(user_id)

    if not event:
        return {'error': 'Event not found'}, 404
    if not user:
        return {'error': 'User not found'}, 404

    # Check if the user is already attending
    if event in user.events:
        return {'message': 'You are already RSVP\'d for this event'}, 400

    # Add the user to the event's attendees and vice versa
    user.events.append(event)
    db.session.commit()

    return {'message': 'RSVP successful', 'event': event.to_dict()}, 200

from server.models import FriendRequest  # Import FriendRequest model

# Endpoint to send a friend request
@app.post('/api/friend-request')
def send_friend_request():
    if 'user_id' not in session:
        return {'error': 'You must be logged in to send a friend request'}, 401

    sender_id = session['user_id']
    receiver_id = request.json.get('receiver_id')

    if sender_id == receiver_id:
        return {'error': 'You cannot send a friend request to yourself'}, 400

    receiver = User.query.get(receiver_id)
    if not receiver:
        return {'error': 'Receiver not found'}, 404

    # Check if a pending or accepted friend request already exists
    existing_request = FriendRequest.query.filter_by(sender_id=sender_id, receiver_id=receiver_id).first()
    if existing_request:
        return {'error': 'Friend request already sent'}, 400

    # Create a new friend request
    friend_request = FriendRequest(sender_id=sender_id, receiver_id=receiver_id, status='pending')
    db.session.add(friend_request)
    db.session.commit()

    return {'message': 'Friend request sent successfully'}, 201


# Endpoint to approve a friend request
@app.post('/api/friend-request/<int:request_id>/approve')
def approve_friend_request(request_id):
    if 'user_id' not in session:
        return {'error': 'You must be logged in to approve a friend request'}, 401

    user_id = session['user_id']
    friend_request = FriendRequest.query.get(request_id)

    if not friend_request:
        return {'error': 'Friend request not found'}, 404

    if friend_request.receiver_id != user_id:
        return {'error': 'You are not authorized to approve this friend request'}, 403

    if friend_request.status != 'pending':
        return {'error': 'Friend request is not pending'}, 400

    # Approve the friend request
    friend_request.status = 'approved'

    # Add the users to the friend association table
    sender = User.query.get(friend_request.sender_id)
    receiver = User.query.get(friend_request.receiver_id)

    sender.friends.append(receiver)
    db.session.commit()

    return {'message': 'Friend request approved successfully'}, 200


# Endpoint to reject a friend request
@app.post('/api/friend-request/<int:request_id>/reject')
def reject_friend_request(request_id):
    if 'user_id' not in session:
        return {'error': 'You must be logged in to reject a friend request'}, 401

    user_id = session['user_id']
    friend_request = FriendRequest.query.get(request_id)

    if not friend_request:
        return {'error': 'Friend request not found'}, 404

    if friend_request.receiver_id != user_id:
        return {'error': 'You are not authorized to reject this friend request'}, 403

    if friend_request.status != 'pending':
        return {'error': 'Friend request is not pending'}, 400

    # Reject the friend request
    friend_request.status = 'rejected'
    db.session.commit()

    return {'message': 'Friend request rejected successfully'}, 200


# Endpoint to list all friend requests for the logged-in user
@app.get('/api/friend-requests')
def get_friend_requests():
    if 'user_id' not in session:
        return {'error': 'You must be logged in to view friend requests'}, 401

    user_id = session['user_id']

    received_requests = FriendRequest.query.filter_by(receiver_id=user_id).all()
    sent_requests = FriendRequest.query.filter_by(sender_id=user_id).all()

    return {
        'received_requests': [req.to_dict() for req in received_requests],
        'sent_requests': [req.to_dict() for req in sent_requests]
    }, 200

@app.get('/api/users/<int:user_id>/friends')
def get_user_friends(user_id):
    user = User.query.get(user_id)
    if not user:
        return {'error': 'User not found'}, 404

    # Get all friends of the user
    friends = user.friends
    return {'friends': [friend.to_dict() for friend in friends]}, 200



# Run the app
if __name__ == '__main__':
    socketio.run(app, port=5550, debug=True)
