from flask import Flask, request
from flask_socketio import SocketIO, join_room, leave_room, send
from server.extensions import db, bcrypt, migrate, cors
from config import Config
from server.models import ChatMessage
from datetime import datetime

# Initialize SocketIO with CORS allowed
socketio = SocketIO(cors_allowed_origins="*")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    cors.init_app(app, supports_credentials=True)
    socketio.init_app(app)

    # Register SocketIO events
    register_socketio_events()

    return app

def register_socketio_events():
    """Register WebSocket event handlers."""

    @socketio.on("join_room")
    def handle_join(data):
        username = data.get("username")
        event_id = data.get("event_id")

        if not event_id:
            send({"error": "Event ID is required"}, to=request.sid)
            return

        room = f"event_{event_id}"
        join_room(room)
        send(
            {
                "message": f"{username} has joined the chat",
                "username": "System",
                "timestamp": datetime.utcnow().isoformat(),
            },
            to=room,
        )

    @socketio.on("leave_room")
    def handle_leave(data):
        username = data.get("username")
        event_id = data.get("event_id")

        if not event_id:
            send({"error": "Event ID is required"}, to=request.sid)
            return

        room = f"event_{event_id}"
        leave_room(room)
        send(
            {
                "message": f"{username} has left the chat",
                "username": "System",
                "timestamp": datetime.utcnow().isoformat(),
            },
            to=room,
        )

    @socketio.on("send_message")
    def handle_message(data):
        username = data.get("username")
        message = data.get("message")
        event_id = data.get("event_id")

        if not event_id or not message:
            send({"error": "Event ID and message are required"}, to=request.sid)
            return

        try:
            new_message = ChatMessage(
                event_id=event_id,
                username=username,
                message=message,
                timestamp=datetime.utcnow(),
            )
            db.session.add(new_message)
            db.session.commit()

            room = f"event_{event_id}"
            socketio.emit(
                "receive_message",
                {
                    "username": username,
                    "message": message,
                    "timestamp": new_message.timestamp.isoformat(),
                },
                to=room,
            )
        except Exception as e:
            db.session.rollback()
            send({"error": str(e)}, to=request.sid)
