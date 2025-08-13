import socket from "../../socket.js";
import { useEffect, useState } from "react";

const ChatRoom = ({ event_id }) => {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState("");
  const [isRsvped, setIsRsvped] = useState(false);
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState(null);
  const [eventInfo, setEventInfo] = useState(null);
  const [isArchived, setIsArchived] = useState(false);

  useEffect(() => {
    // Fetch event data to check date
    const fetchEventInfo = async () => {
      try {
        const eventResponse = await fetch(`/api/events/${event_id}`);
        if (!eventResponse.ok) {
          throw new Error("Failed to fetch event information");
        }
        const eventData = await eventResponse.json();
        setEventInfo(eventData);

        // Check if event date is more than 2 days in the past
        const eventDate = new Date(eventData.date);
        const currentDate = new Date();
        const timeDifference = currentDate - eventDate;
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        if (daysDifference > 2) {
          setIsArchived(true);
          // If archived, still load messages for viewing
          try {
            const messagesResponse = await fetch(
              `/api/events/${event_id}/chat_messages`
            );
            if (messagesResponse.ok) {
              const messagesData = await messagesResponse.json();
              setMessages(messagesData);
            }
          } catch (err) {
            console.error("Error fetching messages:", err);
          }
          return; // Skip the rest of initialization
        }
      } catch (err) {
        console.error("Error fetching event info:", err);
        setError("Failed to load event information");
        return;
      }

      // Continue with regular initialization if not archived
      fetchUserInfo();
    };

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

    fetchEventInfo();
  }, [event_id]);

  // Socket.io connection effect
  useEffect(() => {
    if (isArchived || !isRsvped || !username || !userId) return;

    // Listen for new messages
    const eventChannel = `receive_message_${event_id}`;
    socket.on(eventChannel, (newMessage) => {
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    });

    // Cleanup when component unmounts
    return () => {
      socket.off(eventChannel);
    };
  }, [isArchived, isRsvped, username, userId, event_id]);

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

  // Render logic for archived chat
  if (isArchived) {
    return (
      <div className="chat-room archived">
        <div className="archived-banner">
          <h3>This event has passed and the chat has closed</h3>
        </div>
        <div className="messages archived-messages">
          {messages.length > 0 ? (
            messages.map((msg, index) => (
              <div key={msg.id || index} className="message">
                <strong>{msg.username}</strong>: {msg.message}
                <small>{new Date(msg.timestamp).toLocaleTimeString()}</small>
              </div>
            ))
          ) : (
            <p>No messages were sent for this event.</p>
          )}
        </div>
      </div>
    );
  }

  // Normal render logic for active chats
  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!isRsvped) {
    return (
      <div className="chat-room">
        <p>You must RSVP to this event to access the chat.</p>
        <button onClick={handleRsvp}>RSVP to Event</button>
      </div>
    );
  }

  return (
    <div className="chat-room">
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
