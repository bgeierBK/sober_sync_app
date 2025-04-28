import { useState, useEffect } from "react";
import ConversationsList from "../components/ConversationsList";
import ChatInterface from "../components/ChatInterface";

function DirectMessagesPage() {
  const [conversations, setConversations] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    // Fetch the current user
    fetch("/api/check_session")
      .then((res) => res.json())
      .then((data) => setCurrentUser(data));

    // Fetch conversations
    fetchConversations();
  }, []);

  const fetchConversations = () => {
    fetch("/api/direct-messages/conversations")
      .then((res) => res.json())
      .then((data) => setConversations(data));
  };

  const selectConversation = (userId) => {
    setSelectedUser(userId);

    // Mark messages as read
    fetch(`/api/direct-messages/mark-read/${userId}`, {
      method: "POST",
    });

    // Fetch messages for this conversation
    fetch(`/api/direct-messages/${userId}`)
      .then((res) => res.json())
      .then((data) => setMessages(data));
  };

  return (
    <div className="dm-container">
      <ConversationsList
        conversations={conversations}
        selectConversation={selectConversation}
        selectedUserId={selectedUser}
      />

      {selectedUser ? (
        <ChatInterface
          messages={messages}
          currentUser={currentUser}
          selectedUser={selectedUser}
          onMessageSent={() => {
            // Refresh messages
            fetch(`/api/direct-messages/${selectedUser}`)
              .then((res) => res.json())
              .then((data) => setMessages(data));

            // Also refresh conversations to update last message
            fetchConversations();
          }}
        />
      ) : (
        <div className="empty-state">
          Select a conversation to start messaging
        </div>
      )}
    </div>
  );
}

export default DirectMessagesPage;
