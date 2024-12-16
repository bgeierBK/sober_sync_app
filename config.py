import os

class Config:
    SECRET_KEY = 'something'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app.db'  # Updated for clarity
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    UPLOAD_FOLDER = '/Users/ben/Development/code/phase-5/headbangers_nyc/uploads'
    JSON_COMPACT = False

    @staticmethod
    def create_upload_folder():
        if not os.path.exists(Config.UPLOAD_FOLDER):
            os.makedirs(Config.UPLOAD_FOLDER)

# Call this function after the app is initialized
Config.create_upload_folder()
