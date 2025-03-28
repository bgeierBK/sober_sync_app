import { useEffect, useState } from "react";
import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";

const ChatRoom = ({ event_id, username, user_id }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isRsvped, setIsRsvped] = useState(false);

  useEffect(() => {
    if (!event_id) {
      setError("Event ID is missing");
      return;
    }

    // Check if user has RSVP'd
    const checkRsvpStatus = async () => {
      try {
        const response = await fetch(
          `/api/events/${event_id}/rsvp-status?user_id=${user_id}`
        );
        if (!response.ok)
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        setIsRsvped(data.is_rsvped);
      } catch (err) {
        console.error("Error checking RSVP status:", err);
      }
    };

    checkRsvpStatus();

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/events/${event_id}/chat_messages`);
        if (!response.ok)
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load chat messages. Please try again later.");
      }
    };

    fetchMessages();

    // Join room only if RSVP'd
    if (isRsvped) {
      socket.emit("join_room", { username, event_id });

      const eventChannel = `receive_message_${event_id}`;
      socket.on(eventChannel, (newMessage) => {
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      });

      return () => {
        socket.emit("leave_room", { username, event_id });
        socket.off(eventChannel);
      };
    }
  }, [event_id, username, user_id, isRsvped]);

  const sendMessage = () => {
    if (!message.trim()) return;

    const newMessage = {
      event_id,
      username,
      message,
      user_id,
    };

    setMessages((prevMessages) => [
      ...prevMessages,
      { username, message, timestamp: new Date().toISOString() },
    ]);

    socket.emit("send_message", newMessage);
    setMessage("");
  };

  const handleRsvp = async () => {
    try {
      const response = await fetch(`/api/events/${event_id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id }),
      });

      if (!response.ok) throw new Error("Failed to RSVP");

      setIsRsvped(true);
    } catch (err) {
      console.error("Error RSVPing:", err);
    }
  };

  return (
    <div className="chat-room">
      <h2>Chat Room</h2>
      {error && <p className="error">{error}</p>}
      {!isRsvped ? (
        <button onClick={handleRsvp}>RSVP to event</button>
      ) : (
        <>
          <div className="messages">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index}>
                  <strong>{msg.username}</strong>: {msg.message}
                  <br />
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
            />
            <button onClick={sendMessage}>Send</button>
          </div>
        </>
      )}
    </div>
  );
};

export default ChatRoom;
