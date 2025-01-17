import { useEffect, useState } from "react";
import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";

const ChatRoom = ({ eventId, username }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/chat_messages`);
        if (response.ok) {
          const data = await response.json();
          setMessages(data);
        }
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();

    // Join the chat room
    socket.emit("join_room", eventId);

    // Listen for new messages
    socket.on("receive_message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup on component unmount
    return () => {
      socket.emit("leave_room", eventId);
    };
  }, [eventId]);

  const sendMessage = () => {
    const chatMessage = {
      eventId,
      username,
      message,
    };

    socket.emit("send_message", chatMessage);
    setMessage("");
  };

  return (
    <div className="chat-room">
      <h2>Chat Room</h2>
      <div className="messages">
        {messages.map((msg, index) => (
          <div key={index}>
            <strong>{msg.username}</strong>: {msg.message}
          </div>
        ))}
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
