import React from "react";

function DirectMessagesPage({ conversations, selectedUserId }) {
  // Find the selected conversation
  const selectedConversation = conversations?.find(
    (conv) => conv.id === selectedUserId
  );

  if (!selectedConversation) {
    // Handle case where no conversation is found or selected
    return <div>Please select a conversation to view messages</div>;
  }

  return (
    <div>
      <h2>Conversation with {selectedConversation.username}</h2>
      {/* Render conversation messages */}
      <div className="messages-list">
        {selectedConversation.messages.map((message) => (
          <div key={message.id} className="message-item">
            <span className="message-sender">{message.sender}: </span>
            <span className="message-text">{message.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default DirectMessagesPage;
