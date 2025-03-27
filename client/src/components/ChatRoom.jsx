import { useEffect, useState } from "react";
import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";

const ChatRoom = ({ event_id, username, user_id }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!event_id) {
      setError("Event ID is missing");
      return;
    }

    // Fetch existing messages when component mounts
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

    // Join room for this specific event
    socket.emit("join_room", { username, event_id });

    // Listen for messages specific to this event
    const eventChannel = `receive_message_${event_id}`;
    socket.on(eventChannel, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup on unmount
    return () => {
      socket.emit("leave_room", { username, event_id });
      socket.off(eventChannel);
    };
  }, [event_id, username]);

  const sendMessage = () => {
    if (!message.trim()) return; // Prevent sending empty messages

    const newMessage = {
      event_id,
      username,
      message,
      user_id,
    };

    // Optimistically update UI
    setMessages((prevMessages) => [
      ...prevMessages,
      { username, message, timestamp: new Date().toISOString() },
    ]);

    socket.emit("send_message", newMessage);
    setMessage(""); // Clear input field
  };

  return (
    <div className="chat-room">
      <h2>Chat Room</h2>
      {error && <p className="error">{error}</p>}
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
    </div>
  );
};

export default ChatRoom;
