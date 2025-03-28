import os
import sys
from flask import Flask, request, session, jsonify
from flask_socketio import SocketIO
from flask_migrate import Migrate
from server import create_app
from server.api_utils import fetch_and_add_events
from server.models import User, Event, ChatMessage, FriendRequest
from server.extensions import db, bcrypt
from flask_cors import CORS
import cloudinary.uploader
import cloudinary.api


sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create and configure the app
app = create_app()

CORS(app, supports_credentials=True)

# Initialize SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")

# Cloudinary configuration
cloudinary.config(
    cloud_name=os.getenv("CLOUD_NAME", "dxtkrqdmo"),  # Ensure you set this in .env file or pass it here
    api_key=os.getenv("CLOUDINARY_API_KEY", "562345124685953"),  # Ensure this is set in .env or pass it here
    api_secret=os.getenv("CLOUDINARY_API_SECRET", "4pgVbgO8NdaOWgR7Zdz9GQ4Qaso"),  # Ensure this is set in .env or pass it here
    secure=True
)

# Function to upload image to Cloudinary
def upload_image(file):
    try:
        response = cloudinary.uploader.upload(file)
        return response['secure_url']  # This returns the image URL
    except Exception as e:
        print(f"Error uploading image: {e}")
        return None

# Example upload route
@app.route('/api/upload-image', methods=['POST'])
def upload_image_endpoint():
    if 'image' not in request.files:
        return jsonify({'error': 'No image file found'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Upload the image to Cloudinary and get the URL
    image_url = upload_image(image_file)
    if image_url:
        return jsonify({'image_url': image_url}), 200
    else:
        return jsonify({'error': 'Failed to upload image'}), 500



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
        # Extract the user details from the request JSON
        new_user = User(
            username=request.json.get('username'),
            age=int(request.json.get('age')),
            email_address=request.json.get('email_address'),
            bio=request.json.get('bio'),
            gender=request.json.get('gender'),
            orientation=request.json.get('orientation'),
            sober_status=request.json.get('sober_status'),
            photo_url=request.json.get('profile_image_url')  # Capture the profile image URL
        )
        
        # Hash the password
        new_user.hashed_password = request.json.get('password')

        # Add the new user to the session and commit
        db.session.add(new_user)
        db.session.commit()

        # Set session
        session['user_id'] = new_user.id
        session.permanent = True  # Explicitly make the session permanent
        
        # Return the user data as a dictionary
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


@app.route("/api/login", methods=["POST"])
def login():
    data = request.json
    user = User.query.filter_by(email_address=data.get("email")).first()

    if user and bcrypt.check_password_hash(user._hashed_password, data.get("password")):
        session["user_id"] = user.id  # Store user in session
        return jsonify({"message": "Login successful", "user_id": user.id})

    return jsonify({"error": "Invalid credentials"}), 401

@app.delete('/api/logout')
def logout():
    session.pop('user_id', None)
    return {}, 204

@app.route("/api/me", methods=["GET"])
def get_current_user():
    if "user_id" not in session:
        return jsonify({"error": "Not logged in"}), 401
    
    user = User.query.get(session["user_id"])
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": user.id,
        "username": user.username,
        "email": user.email_address,
        "friend_list": [{"id": f.id, "username": f.username} for f in user.friends],
        "friend_requests_list": [
            {"id": req.id, "sender_id": req.sender_id, "sender_username": req.sender.username}
            for req in user.received_requests if req.status == "pending"
        ]
    })

# User management routes
@app.get('/api/users')
def get_users():
    users = [user.to_dict() for user in User.query.all()]
    return jsonify(users), 200

@app.get('/api/users/<int:id>')
def get_user(id):
    user = User.query.get(id)
    if not user:
        return {"error": "User not found"}, 404

    user_dict = user.to_dict()  # Using SerializerMixin
    user_dict["friend_list"] = user.friend_list
    user_dict["friend_requests_list"] = user.friend_requests_list
    return user_dict, 200

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

@app.post('/api/events/<int:event_id>/cancel_rsvp')
def cancel_rsvp(event_id):
    if 'user_id' not in session:
        return {'error': 'You must be logged in to cancel RSVP'}, 401

    user_id = session['user_id']
    event = Event.query.get(event_id)
    user = User.query.get(user_id)

    if not event:
        return {'error': 'Event not found'}, 404
    if not user:
        return {'error': 'User not found'}, 404

    # Check if the user is attending the event
    if event not in user.events:
        return {'error': 'You are not RSVP\'d for this event'}, 400

    # Remove RSVP
    user.events.remove(event)
    db.session.commit()

    return {'message': 'RSVP canceled successfully'}


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

from flask import request, session

@app.get('/api/events/<int:event_id>/rsvped-users')
def get_rsvped_users(event_id):
    try:
        event = Event.query.get(event_id)
        if not event:
            return jsonify({'error': 'Event not found'}), 404

        rsvped_users = event.attendees  # Get all RSVP’d users

        # If no user is logged in, return all RSVP’d users under one list
        if 'user_id' not in session:
            return jsonify({
                'all_users': [user.to_dict() for user in rsvped_users]
            }), 200

        # If user is logged in, separate friends from other users
        current_user = User.query.get(session['user_id'])
        friends = current_user.friends  # Assuming a many-to-many friendship relationship

        rsvped_friends = [user.to_dict() for user in rsvped_users if user in friends]
        other_rsvped_users = [user.to_dict() for user in rsvped_users if user not in friends]

        return jsonify({
            'friends': rsvped_friends,
            'others': other_rsvped_users
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500



@app.route("/api/events/<int:id>/chat_messages", methods=["GET"])
def get_chat_messages(id):
    try:
        # Query chat messages based on event_id
        messages = ChatMessage.query.filter_by(event_id=id).all()

        if not messages:
            print(f"No messages found for event ID {id}")
            return jsonify([]), 200  # Return empty array if no messages found

        # Prepare the response in the desired format
        result = [
            {
                "id": msg.id,
                "username": msg.username,
                "message": msg.message,
                "timestamp": msg.timestamp.isoformat(),  # Ensure timestamp is in ISO format
            }
            for msg in messages
        ]

        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching chat messages for event ID {id}: {str(e)}")
        return jsonify({"error": "Error fetching chat messages"}), 500


@socketio.on("connect")
def handle_connect():
    print(f"User connected: {request.sid}")

@socketio.on("disconnect")
def handle_disconnect():
    print(f"User disconnected: {request.sid}")

@socketio.on("send_message")
def handle_send_message(data):
    """Handles incoming chat messages and broadcasts them."""
    event_id = data.get("event_id")
    user_id = data.get("user_id")
    
    if not user_id:
        return {"error": "User not logged in"}, 401

    user = User.query.get(user_id)
    event = Event.query.get(event_id)

    if not user or not event:
        return {"error": "Invalid event or user"}, 404

    print("messages sent")
    new_message = ChatMessage(
        event_id=event_id,
        user_id=user_id,
        username=user.username,
        message=data["message"]
    )

    db.session.add(new_message)
    db.session.commit()

    message_data = {
        "id": new_message.id,
        "username": user.username,
        "message": new_message.message,
        "timestamp": new_message.timestamp.isoformat()
    }

    socketio.emit(f"receive_message_{event_id}", message_data)

    return message_data, 201

@app.route('/api/events/<int:event_id>/rsvp-status', methods=['GET'])
<<<<<<< HEAD
def check_rsvp_status(event_id):
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401

    user_id = session['user_id']
    event = Event.query.get(event_id)
    user = User.query.get(user_id)

    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    is_rsvped = event in user.events

    return jsonify({
        'is_rsvped': is_rsvped
    }), 200
=======
def get_rsvp_status(event_id):
    # Get the user_id from the query string
    user_id = request.args.get('user_id', type=int)
    
    if not user_id:
        return jsonify({"error": "User ID is required"}), 400
    
    # Query the database to check if the user has RSVP'd for the event
    rsvp = Rsvp.query.filter_by(event_id=event_id, user_id=user_id).first()

    if rsvp:
        return jsonify({"is_rsvped": True})
    else:
        return jsonify({"is_rsvped": False})
>>>>>>> 09fe80680676b0e7e39febc6ae9f200661961d7d









# Run the app
if __name__ == '__main__':
    socketio.run(app, port=5550, debug=True)
