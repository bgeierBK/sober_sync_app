import os
from dotenv import load_dotenv
load_dotenv()

print("-----------------------ENV-----------------------")
print(os.environ.get('SECRET_KEY'))
print(os.environ.get('SQLALCHEMY_DATABASE_URI'))
print(os.environ.get('UPLOAD_FOLDER'))
print("-----------------------ENV-----------------------")

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY')
    SQLALCHEMY_DATABASE_URI = os.environ.get('SQLALCHEMY_DATABASE_URI')  # Updated for clarity
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = os.environ.get('UPLOAD_FOLDER')
    JSON_COMPACT = False


    @staticmethod
    def create_upload_folder():
        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)

# Call this function after the app is initialized
Config.create_upload_folder()
