from flask import Flask, request, session
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


# Main entry point
    if __name__ == '__main__':
        app.run(debug=True)
   

