from enum import Enum, auto
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy_serializer import SerializerMixin
from sqlalchemy.orm import validates, relationship
from server.extensions import db, bcrypt
from datetime import datetime, timezone


# Enum for FriendRequest status
class FriendRequestStatus(Enum):
    PENDING = auto()
    APPROVED = auto()
    REJECTED = auto()


class User(db.Model, SerializerMixin):
    __tablename__ = 'users_table'

    serialize_rules = (
        '-messages',          # Exclude all ChatMessage objects
        '-events',            # Exclude events
        '-sent_requests',     # Exclude friend requests where this user is sender
        '-received_requests', # Exclude friend requests where this user is receiver
        '-friends',           # Exclude the full friends relationship to avoid recursion
        '-related_friends'    # Exclude the backref for friends
    )

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    age = db.Column(db.Integer, nullable=False)
    _hashed_password = db.Column(db.String, nullable=False)
    email_address = db.Column(db.String, unique=True, nullable=False)
    bio = db.Column(db.String)
    gender = db.Column(db.String)
    orientation = db.Column(db.String)
    sober_status = db.Column(db.String)

    # Relationships
    messages = db.relationship("ChatMessage", back_populates="user", cascade="all, delete-orphan", lazy='select')
    events = db.relationship('Event', secondary="user_event", back_populates="attendees", lazy='select')
    
    sent_requests = db.relationship(
        'FriendRequest',
        foreign_keys='FriendRequest.sender_id',
        back_populates='sender',
        cascade='all, delete-orphan',
        lazy='select'
    )
    received_requests = db.relationship(
        'FriendRequest',
        foreign_keys='FriendRequest.receiver_id',
        back_populates='receiver',
        cascade='all, delete-orphan',
        lazy='select'
    )
    
    friends = db.relationship(
        'User',
        secondary='friend_association',
        primaryjoin='User.id==friend_association.c.user_id',
        secondaryjoin='User.id==friend_association.c.friend_id',
        backref='related_friends',
        lazy='select'
    )

    # Add a custom property to return a simplified friend list
    @property
    def friend_list(self):
        return [{'id': friend.id, 'username': friend.username} for friend in self.friends]

    # (Password hash management and validators remain unchanged)
    @hybrid_property
    def hashed_password(self):
        raise AttributeError('Password hashes may not be viewed')

    @hashed_password.setter
    def hashed_password(self, password):
        self._hashed_password = bcrypt.generate_password_hash(password.encode('utf-8'))

    @validates('username')
    def validate_username(self, key, value):
        cleaned = value.strip().replace(' ', '_')
        if len(cleaned) >= 5:
            return cleaned
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



class FriendRequest(db.Model, SerializerMixin):
    __tablename__ = 'friend_requests'

    # Exclude sender and receiver objects to prevent recursion.
    serialize_rules = ('-sender', '-receiver')

    id = db.Column(db.Integer, primary_key=True)
    sender_id = db.Column(db.Integer, db.ForeignKey('users_table.id'), nullable=False)
    receiver_id = db.Column(db.Integer, db.ForeignKey('users_table.id'), nullable=False)
    status = db.Column(db.Enum(FriendRequestStatus), default=FriendRequestStatus.PENDING)
    timestamp = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    sender = db.relationship('User', foreign_keys=[sender_id], back_populates='sent_requests', lazy='joined')
    receiver = db.relationship('User', foreign_keys=[receiver_id], back_populates='received_requests', lazy='joined')


# Friend Association Table
friend_association = db.Table(
    'friend_association',
    db.Column('user_id', db.Integer, db.ForeignKey('users_table.id'), primary_key=True),
    db.Column('friend_id', db.Integer, db.ForeignKey('users_table.id'), primary_key=True)
)


class Event(db.Model, SerializerMixin):
    __tablename__ = 'events_table'

    # Exclude attendees and chat messages to avoid circular recursion.
    serialize_rules = (
        '-attendees',      # Don't include full user objects in attendees.
        '-chat_messages'   # Exclude chat messages.
    )

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    date = db.Column(db.String(50), nullable=False)
    venue_name = db.Column(db.String(255), nullable=False)
    city = db.Column(db.String(100), nullable=False)

    chat_messages = db.relationship("ChatMessage", back_populates="event", cascade="all, delete-orphan", lazy='select')
    attendees = db.relationship("User", secondary="user_event", back_populates="events", lazy='select')

    @validates('name')
    def validate_name(self, key, value):
        if len(value.strip()) > 0:
            return value
        else:
            raise ValueError('Event name cannot be empty')

    @validates('date')
    def validate_date(self, key, value):
        if len(value.strip()) > 0:
            return value
        else:
            raise ValueError('Event date cannot be empty')

    @validates('venue_name')
    def validate_venue_name(self, key, value):
        if len(value.strip()) > 0:
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
    __tablename__ = 'chat_message'  # fixed table name as per your update

    # Exclude the backreferences to avoid recursion.
    serialize_rules = (
        '-event',  # Do not include the full event object
        '-user'    # Do not include the full user object
    )

    id = db.Column(db.Integer, primary_key=True)
    event_id = db.Column(db.Integer, db.ForeignKey('events_table.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('users_table.id'), nullable=False)
    username = db.Column(db.String(80), nullable=False)
    message = db.Column(db.Text, nullable=False)
    timestamp = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    event = db.relationship("Event", back_populates="chat_messages", lazy='joined')
    user = db.relationship("User", back_populates='messages', lazy='joined')


# Association Table for User-Event Many-to-Many Relationship
user_event = db.Table(
    'user_event',
    db.Column('user_id', db.Integer, db.ForeignKey('users_table.id'), primary_key=True),
    db.Column('event_id', db.Integer, db.ForeignKey('events_table.id'), primary_key=True),
    extend_existing=True
)
