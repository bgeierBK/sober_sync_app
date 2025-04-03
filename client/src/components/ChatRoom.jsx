import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";
import { useEffect, useState } from "react";

const ChatRoom = ({ event_id }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isRsvped, setIsRsvped] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    // Fetch current user info
    const fetchUserInfo = async () => {
      try {
        const response = await fetch("/api/me");
        if (!response.ok) {
          throw new Error("Not authenticated");
        }
        const userData = await response.json();
        setUsername(userData.username);
        setUserId(userData.id);
      } catch (err) {
        setError("Please log in to access this chat");
        return;
      }

      // Check RSVP status after confirming user is logged in
      try {
        const rsvpResponse = await fetch(`/api/events/${event_id}/rsvp-status`);
        if (!rsvpResponse.ok) {
          throw new Error("Failed to check RSVP status");
        }
        const rsvpData = await rsvpResponse.json();
        setIsRsvped(rsvpData.is_rsvped);
      } catch (err) {
        console.error("Error checking RSVP status:", err);
        setError("Failed to check event RSVP status");
      }

      // Fetch existing messages
      try {
        const messagesResponse = await fetch(
          `/api/events/${event_id}/chat_messages`
        );
        if (!messagesResponse.ok) {
          throw new Error("Failed to fetch messages");
        }
        const messagesData = await messagesResponse.json();
        setMessages(messagesData);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load chat messages");
      }
    };

    fetchUserInfo();
  }, [event_id]);

  // Socket.io connection effect
  useEffect(() => {
    if (!isRsvped || !username || !userId) return;

    // Listen for new messages
    const eventChannel = `receive_message_${event_id}`;
    socket.on(eventChannel, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup when component unmounts
    return () => {
      socket.off(eventChannel);
    };
  }, [isRsvped, username, userId, event_id]);

  const handleRsvp = async () => {
    try {
      const response = await fetch(`/api/events/${event_id}/rsvp`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("RSVP failed");
      }

      setIsRsvped(true);
    } catch (err) {
      console.error("Error RSVPing:", err);
      setError("Failed to RSVP to the event");
    }
  };

  const sendMessage = () => {
    if (!message.trim() || !isRsvped || !userId) return;

    const messageData = {
      event_id,
      user_id: userId,
      message: message.trim(),
    };

    // Send the message through socket.io
    socket.emit("send_message", messageData);

    // Clear input immediately (the message will appear when the socket returns it)
    setMessage("");
  };

  // Render logic
  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!isRsvped) {
    return (
      <div className="chat-room">
        <h2>Event Chat</h2>
        <p>You must RSVP to this event to access the chat.</p>
        <button onClick={handleRsvp}>RSVP to Event</button>
      </div>
    );
  }

  return (
    <div className="chat-room">
      <h2>Event Chat</h2>
      <div className="messages">
        {messages.length > 0 ? (
          messages.map((msg, index) => (
            <div
              key={msg.id || index}
              className={`message ${
                msg.username === username ? "my-message" : "other-message"
              }`}
            >
              <strong>{msg.username}</strong>: {msg.message}
              <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
            </div>
          ))
        ) : (
          <p>No messages yet...</p>
        )}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isRsvped}
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage} disabled={!isRsvped || !message.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChatRoom;
