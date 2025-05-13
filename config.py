import os
from dotenv import load_dotenv
import pathlib

# Load environment variables from .env file
load_dotenv()

print("-----------------------ENV-----------------------")
print(f"SECRET_KEY: {os.environ.get('SECRET_KEY')}")
print(f"SQLALCHEMY_DATABASE_URI: {os.environ.get('SQLALCHEMY_DATABASE_URI')}")
print(f"UPLOAD_FOLDER: {os.environ.get('UPLOAD_FOLDER')}")
print("-----------------------ENV-----------------------")

class Config:
    # Set default values for when environment variables are missing
    BASE_DIR = pathlib.Path(__file__).parent.absolute()
    
    # Use environment variables if available, otherwise fallback to defaults
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-key-please-change')
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///app.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER', os.path.join(BASE_DIR, 'uploads'))
    JSON_COMPACT = False
    
    @staticmethod
    def create_upload_folder():
        if Config.UPLOAD_FOLDER and not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)
            print(f"Created upload folder at: {Config.UPLOAD_FOLDER}")

# Call this function after the app is initialized
Config.create_upload_folder()