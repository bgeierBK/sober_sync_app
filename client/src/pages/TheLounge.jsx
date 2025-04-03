import { useEffect, useState, useRef } from "react";
import socket from "/Users/ben/Development/code/personal_projects/sober_sync_app/socket.js";

const TheLounge = () => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const messagesEndRef = useRef(null);

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
        setIsLoggedIn(true);

        // Fetch existing messages
        await fetchMessages();
      } catch (err) {
        setError("Please log in to access The Lounge");
        setIsLoggedIn(false);
      }
    };

    fetchUserInfo();
  }, []);

  const fetchMessages = async () => {
    try {
      const messagesResponse = await fetch("/api/lounge/messages");
      if (!messagesResponse.ok) {
        console.warn(
          "No messages found for Lounge, this is expected on first run"
        );
        setMessages([]);
        return;
      }
      const messagesData = await messagesResponse.json();
      setMessages(messagesData);
    } catch (err) {
      console.error("Error fetching messages:", err);
      setError("Failed to load chat messages");
    }
  };

  // Socket.io connection effect
  useEffect(() => {
    if (!isLoggedIn) return;

    // Listen for new messages
    socket.on("receive_lounge_message", (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup when component unmounts
    return () => {
      socket.off("receive_lounge_message");
    };
  }, [isLoggedIn]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = () => {
    if (!message.trim() || !isLoggedIn || !userId) return;

    const messageData = {
      user_id: userId,
      message: message.trim(),
    };

    // Send the message through socket.io
    socket.emit("send_lounge_message", messageData);

    // Clear input immediately
    setMessage("");
  };

  if (error && !isLoggedIn) {
    return (
      <div className="the-lounge">
        <h2>The Lounge</h2>
        <div className="error">{error}</div>
        <p>You need to log in to join the conversation.</p>
        <a href="/login" className="btn-login">
          Log In
        </a>
      </div>
    );
  }

  return (
    <div className="the-lounge">
      <div className="lounge-header">
        <h2>The Lounge</h2>
        <p>A place for everyone to chat and connect</p>
      </div>

      <div className="messages-container">
        <div className="messages">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div
                key={msg.id || index}
                className={`message ${
                  msg.username === username ? "my-message" : "other-message"
                }`}
              >
                <div className="message-header">
                  <strong className="username">{msg.username}</strong>
                  <span className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <div className="message-body">{msg.message}</div>
              </div>
            ))
          ) : (
            <p className="no-messages">
              No messages yet. Be the first to start the conversation!
            </p>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="input-container">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          disabled={!isLoggedIn}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          rows={2}
          className="message-input"
        />
        <button
          onClick={sendMessage}
          disabled={!isLoggedIn || !message.trim()}
          className="send-button"
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default TheLounge;
