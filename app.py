import os
import sys
from flask import Flask, request, session, jsonify
from flask_socketio import SocketIO, join_room, leave_room, send
from flask_migrate import Migrate
from server import create_app
from server.api_utils import fetch_and_add_events
from server.models import User, Event, ChatMessage, FriendRequest
from server.extensions import db, bcrypt
from redis import Redis
from flask_session import Session
from datetime import timedelta
from flask_cors import CORS

# Enable CORS
 # This will allow your frontend to send and receive cookies


sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create and configure the app
app = create_app()

CORS(app, supports_credentials=True) 

# Initialize SocketIO (make sure it's initialized after `create_app()` is called)
socketio = SocketIO(app, cors_allowed_origins="*")

# app.config['SESSION_PERMANENT'] = True
# app.config['PERMANENT_SESSION_LIFETIME'] = timedelta(days=7)
# app.config['SESSION_COOKIE_SAMESITE'] = 'None'  # Ensure cookies are sent cross-origin
# app.config['SESSION_COOKIE_SECURE'] = False     # Set to True in production if using HTTPS
# app.config['SESSION_TYPE'] = 'redis'            # Using Redis for session storage
# app.config['SESSION_REDIS'] = Redis.from_url('redis://localhost:6379')  # Adjust Redis URL as needed


# Initialize Flask-Session
# Session(app)

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
    print("Session cookies:", request.cookies)  # Log cookies
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

# Chat message routes
@app.get('/api/events/<int:eventId>/chat_messages')
def get_event_chat_messages(eventId):
    try:
        # Find the event by ID
        event = Event.query.get(eventId)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        # Fetch chat messages for the event
        chat_messages = ChatMessage.query.filter_by(eventId=eventId).all()

        # Return messages as a list of dictionaries
        return jsonify([message.to_dict() for message in chat_messages]), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# Event routes
@app.get('/api/events')
def get_events():
    return [event.to_dict() for event in Event.query.all()], 200

@app.get('/api/events/<int:id>')
def get_one_event(id):
    event = Event.query.get(id)
    if event:
        return jsonify(event.to_dict()), 200
    return {'error': 'Event not found'}, 404

@app.patch('/api/events/<int:id>')
def update_event(id):
    event = Event.query.get(id)
    if event:
        for key, value in request.json.items():
            setattr(event, key, value)
        db.session.commit()
        return event.to_dict(), 200
    return {'error': 'Event not found'}, 404

@app.delete('/api/events/<int:id>')
def delete_event(id):
    event = Event.query.get(id)
    if event:
        db.session.delete(event)
        db.session.commit()
        return {}, 204
    return {'error': 'Event not found'}, 404

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

#friend request routes

@app.get("/api/friend-requests")
def get_friend_requests():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    sent_requests = FriendRequest.query.filter_by(sender_id=user_id).all()
    received_requests = FriendRequest.query.filter_by(receiver_id=user_id).all()

    return jsonify({
        "sent_requests": [req.to_dict() for req in sent_requests],
        "received_requests": [req.to_dict() for req in received_requests]
    }), 200

@app.post("/api/friend-request")
def send_friend_request():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    sender_id = session["user_id"]
    receiver_id = request.json.get("receiver_id")

    if sender_id == receiver_id:
        return jsonify({"error": "You can't send a request to yourself"}), 400

    # Check if request already exists
    existing_request = FriendRequest.query.filter_by(sender_id=sender_id, receiver_id=receiver_id).first()
    if existing_request:
        return jsonify({"error": "Friend request already sent"}), 400

    new_request = FriendRequest(sender_id=sender_id, receiver_id=receiver_id)
    db.session.add(new_request)
    db.session.commit()

    return jsonify({"message": "Friend request sent"}), 201

@app.post("/api/friend-request/<int:request_id>/approve")
def approve_friend_request(request_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    request_obj = FriendRequest.query.get(request_id)
    if not request_obj:
        return jsonify({"error": "Friend request not found"}), 404

    if request_obj.receiver_id != session["user_id"]:
        return jsonify({"error": "Not authorized to approve this request"}), 403

    # Add users as friends
    sender = User.query.get(request_obj.sender_id)
    receiver = User.query.get(request_obj.receiver_id)

    sender.friends.append(receiver)
    receiver.friends.append(sender)

    # Delete request after approval
    db.session.delete(request_obj)
    db.session.commit()

    return jsonify({"message": "Friend request approved"}), 200

@app.post("/api/friend-request/<int:request_id>/reject")
def reject_friend_request(request_id):
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    request_obj = FriendRequest.query.get(request_id)
    if not request_obj:
        return jsonify({"error": "Friend request not found"}), 404

    if request_obj.receiver_id != session["user_id"]:
        return jsonify({"error": "Not authorized to reject this request"}), 403

    db.session.delete(request_obj)
    db.session.commit()

    return jsonify({"message": "Friend request rejected"}), 200

@app.delete("/api/friend-request")
def remove_friend():
    if "user_id" not in session:
        return jsonify({"error": "Unauthorized"}), 401

    user_id = session["user_id"]
    friend_id = request.json.get("user_id")

    user = User.query.get(user_id)
    friend = User.query.get(friend_id)

    if not user or not friend:
        return jsonify({"error": "User not found"}), 404

    if friend in user.friends:
        user.friends.remove(friend)
        friend.friends.remove(user)
        db.session.commit()

    return jsonify({"message": "Friend removed"}), 200


# Run the app
if __name__ == '__main__':
    socketio.run(app, port=5550, debug=True)
