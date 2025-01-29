import { useEffect, useState } from "react";
import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";

const ChatRoom = ({ eventId, username }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    console.log("Event ID:", eventId); // Debugging log

    if (!eventId) {
      setError("Event ID is missing");
      return;
    }

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/chat_messages`);

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json(); // Parse JSON response
        setMessages(data);
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load chat messages. Please try again later.");
      }
    };

    fetchMessages();

    // Join the chat room with WebSocket
    socket.emit("join_room", { username, event_id: eventId });

    socket.on("receive_message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    return () => {
      socket.emit("leave_room", { username, event_id: eventId });
    };
  }, [eventId, username]);

  const sendMessage = () => {
    if (message.trim() === "") return;

    const chatMessage = {
      eventId,
      username,
      message,
    };

    socket.emit("send_message", chatMessage);
    setMessage(""); // Clear the input field
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
