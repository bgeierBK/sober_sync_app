from flask import Flask
from server.extensions import db, bcrypt, migrate, cors
from flask_socketio import SocketIO, join_room, leave_room, send
from config import Config
from server.models import ChatMessage

socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app)
    socketio.init_app(app) 

    @socketio.on("join_room")
    def handle_join(data):
        username = data.get('username')
        event_id = data.get('event_id')
        if not event_id:
            return {'error': 'Event ID required'}
        room = f"event_{event_id}"
        join_room(room)
        send(f"{username} has joined the chat", to=room)

    @socketio.on('leave_room')
    def handle_leave(data):
        username = data.get('username')
        event_id = data.get('event_id')
        if not event_id:
            return {'error': 'Event ID required'}, 400
        room = f"event_{event_id}"
        leave_room(room)
        send(f"{username} has left the chat", to=room, broadcast=True)
    
    @socketio.on('send_message')
    def handle_message(data):
        username = data.get('username')
        message = data.get('message')
        event_id = data.get('event_id')

        if not event_id or not message:
            return {'error': 'Event ID and message are required'}
        
        new_message = ChatMessage(event_id=event_id,username=username, message=message)
        db.session.add(new_message)
        db.session.commit()
        
        room = f"event_{event_id}"
        send({
    'username': username,
    'message': message,
    'timestamp': new_message.timestamp.isoformat()
}, to=room, broadcast=True)

    return app
