import os
import sys
from flask import Flask, request, session, jsonify
from flask_socketio import SocketIO, join_room, leave_room, send
from flask_migrate import Migrate
from server import create_app
from server.api_utils import fetch_and_add_events
from server.models import User, Event, ChatMessage
from server.extensions import db, bcrypt
from server import socketio 

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Create and configure the app
app = create_app()

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
            username=request.json.get('username'),  # should match frontend key
            age=int(request.json.get('age')),
            email_address=request.json.get('email_address'),  # corrected from 'emailAddress'
            bio=request.json.get('bio'),
            gender=request.json.get('gender'),
            orientation=request.json.get('orientation'),
            sober_status=request.json.get('sober_status'),  # corrected from 'soberStatus'
        )
        new_user.hashed_password = request.json.get('password')
        db.session.add(new_user)
        db.session.commit()
        session['user_id'] = new_user.id
        return new_user.to_dict(), 201
    except Exception as e:
        print(f"Error: {e}")
        return {'error': str(e)}, 406



@app.get("/api/check_session")
def check_session():
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

@app.get('/api/events/<int:event_id>/chat_messages')
def get_event_chat_messages(event_id):
    try:
        event= Event.query.get(event_id)
        if not event:
            return {'error': 'Event not found'}, 404
        chat_messages = ChatMessage.query.filter_by(event_id=event_id).all()
        return [message.todict() for message in chat_messages], 200
    except Exception as e:
        return {'Error': str(e)}, 500

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

# Run the app
if __name__ == '__main__':
    socketio.run(app, port=5550, debug=True)
