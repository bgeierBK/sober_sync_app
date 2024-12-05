from flask import Flask
from flask_bcrypt import Bcrypt
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS
from config import Config

# Initialize the app
app = Flask(__name__)
app.config.from_object(Config)  # Load the config from the Config class

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

# Main entry point
if __name__ == '__main__':
    app.run(debug=True)
