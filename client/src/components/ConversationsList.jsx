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
            <div className="user-avatar">
              {conversation.photo_url ? (
                <img src={conversation.photo_url} alt={conversation.username} />
              ) : (
                <div className="default-avatar">{conversation.username[0]}</div>
              )}
              {conversation.unread_count > 0 && (
                <span className="unread-badge">
                  {conversation.unread_count}
                </span>
              )}
            </div>
            <div className="conversation-preview">
              <div className="username">{conversation.username}</div>
              <div className="last-message">{conversation.latest_message}</div>
            </div>
            <div className="timestamp">
              {conversation.latest_timestamp &&
                formatTimeAgo(conversation.latest_timestamp)}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ConversationsList;
