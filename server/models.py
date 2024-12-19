
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates
from server.extensions import db, bcrypt
from datetime import datetime, timezone



class User(db.Model, SerializerMixin):
    __tablename__ = 'users_table'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    age = db.Column(db.Integer, nullable=False)
    _hashed_password = db.Column(db.String, nullable=False)
    email_address = db.Column(db.String, unique=True, nullable=False)
    bio = db.Column(db.String)
    profile_pic = db.Column(db.String(255))
    gender = db.Column(db.String)
    orientation = db.Column(db.String)
    sober_status = db.Column(db.String)

    #relationships
    messages = db.relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan")
    events = db.relationship('Event', secondary="user_event", back_populates="attendees")

    #validators
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


class Event(db.Model, SerializerMixin):
    __tablename__ = 'events_table'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    venue_name = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)

    #relationships
    chat_messages = db.relationship("ChatMessage", back_populates="event", cascade="all, delete-orphan")
    attendees = db.relationship("User", secondary="user_event", back_populates="events")

    #validators

    @validates('name')
    def validate_name(self, key, value):
        if len(value.strip()) >0:
            return value
        else:
            raise ValueError('Event name cannot be empty')
    
    @validates('date')
    def validate_date(self, key, value):
        if len(value.strip()) >0:
            return value
        else:
            raise ValueError('Event date cannot be empty')
    
    @validates('venue_name')
    def validate_venue_name(self, key, value):
        if len(value.strip()) >0:
            return value
        else:
            raise ValueError('Venue name cannot be empty')
    
    @validates('city')
    def validate_city(self, key, value):
        if len(value.strip()) > 0:
            return value
        else:
            raise ValueError('City cannot be empty')
        
class ChatMessage(db.Model, SerializerMixin):
    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events_table.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users_table.id'), nullable=False)
    username= db.Column(db.String(80), nullable=False)
    message= db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default =datetime.now(timezone.utc))

    #relationships

    event = db.relationship("Event", back_populates = "chat_messages")
    user = db.relationship("User", back_populates='messages')

#association table

user_event = db.Table(
    'user_event',
    db.Column('user_id', db.ForeignKey('users_table.id'), primary_key=True),
    db.Column('event_id', db.Integer, db.ForeignKey('events_table.id'), primary_key=True),
    extend_existing=True  
)
    


