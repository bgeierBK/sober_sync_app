import { useState, useEffect } from "react";

function ChatInterface({ messages, currentUser, selectedUser, onMessageSent }) {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    // Connect to socket.io
    const socketConnection = io();
    setSocket(socketConnection);

    // Listen for direct messages
    socketConnection.on(
      `receive_direct_message_${currentUser.id}_${selectedUser}`,
      (message) => {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    );

    return () => {
      socketConnection.disconnect();
    };
  }, [currentUser, selectedUser]);

  useEffect(() => {
    // Scroll to bottom when messages change
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    socket.emit("send_direct_message", {
      sender_id: currentUser.id,
      receiver_id: selectedUser,
      message: newMessage,
    });

    setNewMessage("");
    onMessageSent();
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${
              message.sender_id === currentUser.id ? "outgoing" : "incoming"
            }`}
          >
            <div className="message-content">{message.message}</div>
            <div className="message-timestamp">
              {formatTime(message.timestamp)}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form className="message-input" onSubmit={sendMessage}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.value)}
          placeholder="Type your message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default ChatInterface;
