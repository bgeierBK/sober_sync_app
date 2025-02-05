import { useEffect, useState } from "react";
import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";

// eslint-disable-next-line react/prop-types
const ChatRoom = ({ event_id, username }) => {
  // Using camelCase for eventId
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!event_id) {
      setError("Event ID is missing");
      return;
    }

    // Fetch existing messages when eventId is available
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/events/${event_id}/chat_messages`);
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setMessages(data); // Assuming data is an array of messages
      } catch (err) {
        console.error("Error fetching messages:", err);
        setError("Failed to load chat messages. Please try again later.");
      }
    };

    fetchMessages(); // Fetch messages when component mounts or eventId changes

    // Join the chat room when eventId or username changes
    socket.emit("join_room", { username, event_id: event_id });

    // Listen for new messages from other users
    socket.on("receive_message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup: Leave the chat room and remove socket listeners when component unmounts or eventId/username changes
    return () => {
      socket.emit("leave_room", { username, event_id: event_id });
      socket.off("receive_message"); // Clean up the socket listener
    };
  }, [event_id, username]); // Re-run when eventId or username changes

  // Function to handle sending messages
  const sendMessage = () => {
    if (message.trim() === "") return; // Don't send empty messages
    socket.emit("send_message", { event_id: event_id, username, message });
    setMessage(""); // Clear the input field after sending
  };

  return (
    <div className="chat-room">
      <h2>Chat Room</h2>
      {error && <p className="error">{error}</p>}{" "}
      {/* Display error if there's one */}
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
          onChange={(e) => setMessage(e.target.value)} // Update message state on input change
          placeholder="Type your message..."
        />
        <button onClick={sendMessage}>Send</button>{" "}
        {/* Send message when button clicked */}
      </div>
    </div>
  );
};

export default ChatRoom;
