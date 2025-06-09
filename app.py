import os
import sys
from flask import Flask, request, session, jsonify
from flask_socketio import SocketIO
from flask_migrate import Migrate
from server import create_app
from server.api_utils import fetch_and_add_events
from server.models import User, Event, ChatMessage, FriendRequest, EventPhoto, DirectMessage, UserBlock
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

# User blocking routes
@app.route('/api/users/<int:user_id>/block', methods=['POST'])
def block_user(user_id):
    """Block a user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    blocker_id = session['user_id']
    
    # Prevent self-blocking
    if blocker_id == user_id:
        return jsonify({'error': 'You cannot block yourself'}), 400
    
    # Check if users exist
    blocker = User.query.get(blocker_id)
    blocked_user = User.query.get(user_id)
    
    if not blocker or not blocked_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check if already blocked
    existing_block = UserBlock.query.filter_by(
        blocker_id=blocker_id, 
        blocked_id=user_id
    ).first()
    
    if existing_block:
        return jsonify({'error': 'User is already blocked'}), 400
    
    # Create the block
    new_block = UserBlock(blocker_id=blocker_id, blocked_id=user_id)
    db.session.add(new_block)
    
    # Remove friendship if it exists
    if blocked_user in blocker.friends:
        blocker.friends.remove(blocked_user)
        blocked_user.friends.remove(blocker)
    
    # Delete any pending friend requests between the users
    pending_requests = FriendRequest.query.filter(
        ((FriendRequest.sender_id == blocker_id) & (FriendRequest.receiver_id == user_id)) |
        ((FriendRequest.sender_id == user_id) & (FriendRequest.receiver_id == blocker_id))
    ).all()
    
    for request in pending_requests:
        db.session.delete(request)
    
    db.session.commit()
    
    return jsonify({'message': 'User blocked successfully'}), 201


@app.route('/api/users/<int:user_id>/unblock', methods=['DELETE'])
def unblock_user(user_id):
    """Unblock a user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    blocker_id = session['user_id']
    
    # Find the block
    block = UserBlock.query.filter_by(
        blocker_id=blocker_id, 
        blocked_id=user_id
    ).first()
    
    if not block:
        return jsonify({'error': 'User is not blocked'}), 404
    
    # Remove the block
    db.session.delete(block)
    db.session.commit()
    
    return jsonify({'message': 'User unblocked successfully'}), 200


@app.route('/api/users/blocked', methods=['GET'])
def get_blocked_users():
    """Get list of users that the current user has blocked"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    user_id = session['user_id']
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    blocked_users = []
    for block in user.sent_blocks:
        blocked_user = block.blocked_user
        blocked_users.append({
            'id': blocked_user.id,
            'username': blocked_user.username,
            'photo_url': blocked_user.photo_url,
            'blocked_at': block.timestamp.isoformat()
        })
    
    return jsonify(blocked_users), 200


@app.route('/api/users/<int:user_id>/is-blocked', methods=['GET'])
def check_block_status(user_id):
    """Check if there's a blocking relationship between current user and specified user"""
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    
    current_user_id = session['user_id']
    current_user = User.query.get(current_user_id)
    
    if not current_user:
        return jsonify({'error': 'User not found'}), 404
    
    # Check both directions
    is_blocked_by_me = current_user.has_blocked(user_id)
    is_blocking_me = current_user.is_blocked_by(user_id)
    
    return jsonify({
        'is_blocked_by_me': is_blocked_by_me,
        'is_blocking_me': is_blocking_me,
        'any_block_exists': is_blocked_by_me or is_blocking_me
    }), 200

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

    # Check for blocking relationships
    sender = User.query.get(sender_id)
    if sender.is_blocking_relationship(receiver_id):
        return jsonify({"error": "Cannot send friend request due to blocking"}), 403

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

        rsvped_users = event.attendees

        # If no user is logged in, return all RSVP'd users
        if 'user_id' not in session:
            return jsonify({
                'all_users': [user.to_dict() for user in rsvped_users]
            }), 200

        # If user is logged in, filter out blocked users and separate friends
        current_user = User.query.get(session['user_id'])
        friends = current_user.friends

        # Filter out users with blocking relationships
        filtered_users = [
            user for user in rsvped_users 
            if not current_user.is_blocking_relationship(user.id)
        ]

        rsvped_friends = [user.to_dict() for user in filtered_users if user in friends]
        other_rsvped_users = [user.to_dict() for user in filtered_users if user not in friends]

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


# Add these routes to your Flask app

@app.route("/api/lounge/messages", methods=["GET"])
def get_lounge_messages():
    try:
        # Fetch recent lounge messages (e.g., limit to last 100)
        messages = ChatMessage.query.filter_by(event_id="lounge").order_by(ChatMessage.timestamp).limit(100).all()
        
        # Prepare the response in the desired format
        result = [
            {
                "id": msg.id,
                "username": msg.username,
                "message": msg.message,
                "timestamp": msg.timestamp.isoformat(),
            }
            for msg in messages
        ]

        return jsonify(result), 200
    except Exception as e:
        print(f"Error fetching lounge messages: {str(e)}")
        return jsonify({"error": "Error fetching lounge messages"}), 500

@socketio.on("send_lounge_message")
def handle_lounge_message(data):
    """Handles incoming lounge messages and broadcasts them."""
    user_id = data.get("user_id")
    
    if not user_id:
        return {"error": "User not logged in"}, 401

    user = User.query.get(user_id)

    if not user:
        return {"error": "Invalid user"}, 404

    # Store the message with "lounge" as event_id
    new_message = ChatMessage(
        event_id="lounge",
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

    socketio.emit("receive_lounge_message", message_data)

    return message_data, 201



#photo routes

# Event photo routes
@app.post('/api/events/<int:event_id>/photos')
def upload_event_photo(event_id):
    if 'image' not in request.files:
        return jsonify({'error': 'No image file found'}), 400

    image_file = request.files['image']
    if image_file.filename == '':
        return jsonify({'error': 'No selected file'}), 400

    # Check if the event exists
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404

    # Upload the image to Cloudinary and get the URL
    image_url = upload_image(image_file)
    if not image_url:
        return jsonify({'error': 'Failed to upload image'}), 500

    # Create new event photo
    new_photo = EventPhoto(
        url=image_url,
        event_id=event_id
    )
    
    db.session.add(new_photo)
    db.session.commit()
    
    return jsonify({
        'message': 'Photo uploaded successfully',
        'photo': new_photo.to_dict()
    }), 201


@app.get('/api/events/<int:event_id>/photos')
def get_event_photos(event_id):
    # Check if the event exists
    event = Event.query.get(event_id)
    if not event:
        return jsonify({'error': 'Event not found'}), 404
    
    # Get all photos for the event
    photos = EventPhoto.query.filter_by(event_id=event_id).all()
    
    return jsonify([photo.to_dict() for photo in photos]), 200


@app.delete('/api/events/photos/<int:photo_id>')
def delete_event_photo(photo_id):
    # Check if user is logged in (optional - if you want to restrict deletion)
    # if 'user_id' not in session:
    #     return jsonify({'error': 'Unauthorized'}), 401
    
    # Find the photo
    photo = EventPhoto.query.get(photo_id)
    if not photo:
        return jsonify({'error': 'Photo not found'}), 404
    
    # Delete from database
    db.session.delete(photo)
    db.session.commit()
    
    # Optional: Delete from Cloudinary as well
    # This would require extracting the public_id from the URL
    # cloudinary.uploader.destroy(public_id)
    
    return jsonify({'message': 'Photo deleted successfully'}), 200


@app.patch('/api/events/photos/<int:photo_id>')
def update_event_photo(photo_id):
    # Find the photo
    photo = EventPhoto.query.get(photo_id)
    if not photo:
        return jsonify({'error': 'Photo not found'}), 404
    
    # Update only the fields that are provided
    if 'url' in request.json:
        photo.url = request.json['url']
    if 'event_id' in request.json:
        # Check if the new event exists
        event = Event.query.get(request.json['event_id'])
        if not event:
            return jsonify({'error': 'Event not found'}), 404
        photo.event_id = request.json['event_id']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Photo updated successfully',
        'photo': photo.to_dict()
    }), 200

#direct message routes

@app.route('/api/direct-messages/<int:user_id>', methods=['GET'])
def get_direct_messages(user_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    current_user_id = session['user_id']
    
    # Get conversation between current user and specified user
    messages = DirectMessage.query.filter(
        ((DirectMessage.sender_id == current_user_id) & (DirectMessage.receiver_id == user_id)) |
        ((DirectMessage.sender_id == user_id) & (DirectMessage.receiver_id == current_user_id))
    ).order_by(DirectMessage.timestamp).all()
    
    return jsonify([message.to_dict() for message in messages]), 200

@app.route('/api/direct-messages/conversations', methods=['GET'])
def get_conversations():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    current_user_id = session['user_id']
    current_user = User.query.get(current_user_id)

    # Find all users the current user has exchanged messages with
    sent_to = db.session.query(DirectMessage.receiver_id).filter_by(sender_id=current_user_id).distinct().all()
    received_from = db.session.query(DirectMessage.sender_id).filter_by(receiver_id=current_user_id).distinct().all()

    # Combine and remove duplicates
    conversation_user_ids = set([user_id for (user_id,) in sent_to] + [user_id for (user_id,) in received_from])

    conversations = []
    for user_id in conversation_user_ids:
        # Skip if there's a blocking relationship
        if current_user.is_blocking_relationship(user_id):
            continue
            
        user = User.query.get(user_id)
        if user:
            # Fetch the latest message for preview
            latest_message = DirectMessage.query.filter(
                ((DirectMessage.sender_id == current_user_id) & (DirectMessage.receiver_id == user_id)) |
                ((DirectMessage.sender_id == user_id) & (DirectMessage.receiver_id == current_user_id))
            ).order_by(DirectMessage.timestamp.desc()).first()

            # Fetch all messages between current user and this user
            messages = DirectMessage.query.filter(
                ((DirectMessage.sender_id == current_user_id) & (DirectMessage.receiver_id == user_id)) |
                ((DirectMessage.sender_id == user_id) & (DirectMessage.receiver_id == current_user_id))
            ).order_by(DirectMessage.timestamp).all()

            # Count unread messages
            unread_count = DirectMessage.query.filter_by(
                sender_id=user_id,
                receiver_id=current_user_id,
                is_read=False
            ).count()

            conversations.append({
                "id": user.id,
                "username": user.username,
                "photo_url": user.photo_url,
                "latest_message": latest_message.message if latest_message else "",
                "latest_timestamp": latest_message.timestamp.isoformat() if latest_message else None,
                "unread_count": unread_count,
                "messages": [message.to_dict() for message in messages]
            })

    # Sort by latest message timestamp
    conversations.sort(key=lambda x: x["latest_timestamp"] or "", reverse=True)

    return jsonify(conversations), 200

@app.route('/api/direct-messages/mark-read/<int:user_id>', methods=['POST'])
def mark_messages_read(user_id):
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    current_user_id = session['user_id']
    
    # Mark all messages from specified user to current user as read
    unread_messages = DirectMessage.query.filter_by(
        sender_id=user_id, 
        receiver_id=current_user_id, 
        is_read=False
    ).all()
    
    for message in unread_messages:
        message.is_read = True
    
    db.session.commit()
    
    return jsonify({"message": "Messages marked as read"}), 200

#socket io for DMS

@socketio.on("send_direct_message")
def handle_direct_message(data):
    """Handles direct messages between users."""
    sender_id = data.get("sender_id")
    receiver_id = data.get("receiver_id")
    message_text = data.get("message")
    
    if not sender_id or not receiver_id:
        return {"error": "Missing user information"}, 400
    
    sender = User.query.get(sender_id)
    receiver = User.query.get(receiver_id)
    
    if not sender or not receiver:
        return {"error": "Invalid user"}, 404
    
    # Check for blocking relationships
    if sender.is_blocking_relationship(receiver_id):
        return {"error": "Cannot send message due to blocking"}, 403
    
    # Store the message
    new_message = DirectMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message_text
    )
    
    db.session.add(new_message)
    db.session.commit()
    
    message_data = {
        "id": new_message.id,
        "sender_id": sender_id,
        "sender_username": sender.username,
        "receiver_id": receiver_id,
        "message": message_text,
        "timestamp": new_message.timestamp.isoformat(),
        "is_read": False
    }
    
    # Emit to both sender and receiver channels
    socketio.emit(f"receive_direct_message_{sender_id}_{receiver_id}", message_data)
    socketio.emit(f"receive_direct_message_{receiver_id}_{sender_id}", message_data)
    
    # Also emit to a general notification channel for the receiver
    socketio.emit(f"message_notification_{receiver_id}", {
        "from_id": sender_id,
        "from_username": sender.username,
        "preview": message_text[:30] + ("..." if len(message_text) > 30 else "")
    })
    
    return message_data, 201

@socketio.on("join_dm_room")
def join_dm_room(data):
    """Joins a user to their direct message room."""
    user_id = data.get("user_id")
    
    if not user_id:
        return {"error": "User ID required"}, 400
    
    # Join a room for this user to receive notifications
    socketio.join_room(f"user_{user_id}")
    return {"message": "Joined DM room"}, 200

# unread messages

@app.route('/api/direct-messages/unread-count', methods=['GET'])
def get_unread_count():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    current_user_id = session['user_id']
    
    unread_count = DirectMessage.query.filter_by(
        receiver_id=current_user_id, 
        is_read=False
    ).count()
    
    return jsonify({"unread_count": unread_count}), 200

# recent messages

@app.route('/api/direct-messages/recent', methods=['GET'])
def get_recent_messages():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401
    
    current_user_id = session['user_id']
    
    # Use a subquery to get the most recent message for each conversation
    subq = db.session.query(
        DirectMessage.id,
        db.func.max(DirectMessage.timestamp).label('max_timestamp'),
        db.case(
            [(DirectMessage.sender_id == current_user_id, DirectMessage.receiver_id)],
            else_=DirectMessage.sender_id
        ).label('other_user_id')
    ).filter(
        (DirectMessage.sender_id == current_user_id) | 
        (DirectMessage.receiver_id == current_user_id)
    ).group_by('other_user_id').subquery()
    
    recent_messages = db.session.query(
        DirectMessage, 
        User
    ).join(
        subq, 
        DirectMessage.id == subq.c.id
    ).join(
        User, 
        User.id == subq.c.other_user_id
    ).all()
    
    result = []
    for message, user in recent_messages:
        result.append({
            "user_id": user.id,
            "username": user.username,
            "photo_url": user.photo_url,
            "last_message": message.message,
            "timestamp": message.timestamp.isoformat(),
            "unread": message.receiver_id == current_user_id and not message.is_read
        })
    
    # Sort by timestamp (newest first)
    result.sort(key=lambda x: x["timestamp"], reverse=True)
    
    return jsonify(result), 200

@app.route('/api/direct-messages', methods=['POST'])
def create_direct_message():
    if 'user_id' not in session:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    sender_id = session['user_id']
    receiver_id = data.get('receiver_id')
    message_text = data.get('message')

    if not receiver_id or not message_text:
        return jsonify({"error": "Missing receiver_id or message text"}), 400

    # Verify sender and receiver exist
    sender = User.query.get(sender_id)
    receiver = User.query.get(receiver_id)

    if not sender or not receiver:
        return jsonify({"error": "Invalid sender or receiver"}), 404

    # Check for blocking relationships
    if sender.is_blocking_relationship(receiver_id):
        return jsonify({"error": "Cannot send message due to blocking"}), 403

    # Create the new direct message
    new_message = DirectMessage(
        sender_id=sender_id,
        receiver_id=receiver_id,
        message=message_text
    )

    db.session.add(new_message)
    db.session.commit()

    return jsonify(new_message.to_dict()), 201

# Run the app
if __name__ == '__main__':
    socketio.run(app, port=5550, debug=True)