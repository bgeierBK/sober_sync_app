import os
import sys
from flask import Flask, request, session, jsonify
from flask_migrate import Migrate
from server import create_app
from server.api_utils import fetch_and_add_events
from server.models import User
from server.extensions import db, bcrypt

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
            username=request.json.get('username'),
            age=request.json.get('age'),
            email_address=request.json.get('email_address'),
            bio=request.json.get('bio'),
            profile_pic=request.json.get('profile_pic')
        )
        new_user.hashed_password = request.json.get('password')
        db.session.add(new_user)
        db.session.commit()
        session['user_id'] = new_user.id
        return new_user.to_dict(), 201
    except Exception as e:
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

# Run the app
if __name__ == '__main__':
    app.run(port=5555, debug=True)
