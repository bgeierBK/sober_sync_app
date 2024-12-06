from flask import Flask, request, session, jsonify
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config
from server.extensions import socketio

# Initialize the app
app = Flask(__name__)
app.config.from_object(Config)  # Load the config from the Config class
socketio.init_app(app)

# Initialize extensions
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)
migrate = Migrate(app, db)
CORS(app)

# Example root route
@app.route('/')
def home():
    return "<h1>Welcome to the Flask App</h1>"



# Import models (after app initialization)
from models import User

#login routes

@app.post('/api/users')
def create_user():
    try:
        new_user = User(
            username =request.json.get('username'),
            age=request.json.get('age'),
            email_address=request.json.get('email_address'),
            bio=request.json.get('bio'),
            profile_pic=request.json.get('profile_pic')
        )
        new_user.hashed_password=request.json.get('password')
        db.session.add(new_user)
        db.session.commit()
        session['user_id'] = new_user.id
        return new_user.to_dict(),201
    except Exception as e:
        return {'error': str(e)}, 406

@app.get("api/check_session")
def check_session():
    if 'user_id' in session:
        user = User.query.where(User.id == session['user_id']).first()
        if user:
            return user.to_dict(), 200
        else:
            return{'error': 'user not found'}, 404
    else:
        return {'error': 'no active session'}, 204

@app.post('/api/login')
def login():
    user = User.query.where(User.username == request.json.get('username')).first()
    if user and bcrypt.check_password_hash(user._hashed_password, request.json.get('pasword')):
        session['user_id'] = user.id
        return user.to_dict(), 201
    else:
        return {'error': 'Username or password was invalid'}

@app.delete('/api/logout')
def logout():
    session.pop('user_id')
    return {}, 204

# user routes

@app.get('/api/users')
def get_users():
    return [user.to_dict() for user in User.query.all()], 200

@app.get('/api/users/<int:id>')
def get_one_user(id):
    user = User.query.get(id)
    if user:
        return jsonify(user.to_dict()), 200
    return {}, 404

@app.patch('/api/users/<int:id>')
def update_user(id):
    user = User.query.where(User.id == id).first()
    if user:
        for key in request.json.keys():
            setattr(user,key,request.json[key])
        db.session.add(user)
        db.session.commit()
        return user.to_dict()
    return {}, 404

@app.delete('/api/users/<int:id>')
def delete_user(id):
    user = User.query.where(User.id == id).first()
    if user:
        db.session.delete(user)
        db.session.commit()
        return {}, 204
    return {}, 404



# Main entry point
if __name__ == '__main__':
    app.run(port=5555, debug=True)
   

