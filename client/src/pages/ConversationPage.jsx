// ConversationPage.jsx
import { useParams } from "react-router-dom";

function ConversationPage() {
  const { id, conversationId } = useParams();
  // This gets both parameters:
  // - 'id' from the parent route (27 in your example)
  // - 'conversationId' from this route (28 in your example)

  return (
    <div className="conversation">
      <h3>
        Conversation {conversationId} with User {id}
      </h3>
      {/* Your conversation messages would go here */}
      {/* You would typically fetch conversation data using these IDs */}
    </div>
  );
}

export default ConversationPage;
