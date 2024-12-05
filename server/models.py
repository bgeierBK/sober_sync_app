from app import db, bcrypt
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates

class User(db.Model, SerializerMixin):
    __tablename__ = 'users_table'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    age = db.Column(db.Integer, nullable=False)
    _hashed_password = db.Column(db.String, nullable=False)
    email_address = db.Column(db.String, unique=True, nullable=False)
    bio = db.Column(db.String)
    profile_pic = db.Column(db.String(255))

    @hybrid_property
    def hashed_password(self):
        raise AttributeError('Password hashes may not be viewed')
    
    @hashed_password.setter
    def hashed_password(self, password):
        self._hashed_password = bcrypt.generate_password_hash(password.encode('utf-8'))

    @validates('username')
    def validate_username(self, key, value):
        if len(value.strip().replace(' ', '_')) >= 5:
            return value.strip().replace(' ', '_')
        else:
            raise ValueError('Username must be at least five characters')

    @validates('age')
    def validate_age(self, key, value):
        if value >= 18:
            return value
        else:
            raise ValueError("You must be at least 18 years old to use this service")

    @validates('email_address')
    def validate_email(self, key, value):
        if '@' in value:
            return value
        else:
            raise ValueError('Not a valid email address')
