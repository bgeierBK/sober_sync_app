import React from "react";

function ConversationsList({
  conversations,
  selectConversation,
  selectedUserId,
}) {
  return (
    <div className="conversations-list">
      <h2>Messages</h2>
      {conversations.length === 0 ? (
        <div className="no-conversations">No conversations yet.</div>
      ) : (
        conversations.map((conversation) => (
          <div
            key={conversation.user_id}
            className={`conversation-item ${
              selectedUserId === conversation.user_id ? "selected" : ""
            }`}
            onClick={() => selectConversation(conversation.user_id)}
          >
            <div className="conversation-preview">
              <div className="username">{conversation.username}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ConversationsList;
