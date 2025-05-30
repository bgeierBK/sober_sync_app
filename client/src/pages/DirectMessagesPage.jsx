import React, { useState, useEffect } from "react";
import Modal from "react-modal"; // Import react-modal
import { useOutletContext, useLocation } from "react-router-dom"; // Add useLocation for navigation state

// Set the app element for accessibility
Modal.setAppElement("#root");

// ConversationsList component
function ConversationsList({ conversations, openConversation }) {
  const conversationsList = conversations || [];

  return (
    <div
      style={{ padding: "20px", borderRight: "1px solid #ccc", width: "30%" }}
    >
      <h2 style={{ fontSize: "18px", marginBottom: "10px" }}>Messages</h2>
      {conversationsList.length === 0 ? (
        <div style={{ fontStyle: "italic", color: "#888" }}>
          No conversations yet.
        </div>
      ) : (
        conversationsList.map((conversation) => (
          <div
            key={conversation.id}
            style={{
              padding: "10px",
              marginBottom: "10px",
              border: "1px solid #ddd",
              borderRadius: "5px",
              cursor: "pointer",
              backgroundColor: "#f9f9f9",
            }}
            onClick={() => openConversation(conversation)}
          >
            <div>
              <strong style={{ fontSize: "16px" }}>
                {conversation.username}
              </strong>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// Start Conversation component
function StartConversation({ friends, onStartConversation }) {
  const [selectedFriendId, setSelectedFriendId] = useState("");

  const handleStartConversation = () => {
    if (!selectedFriendId) return;

    const selectedFriend = friends.find(
      (friend) => friend.id === parseInt(selectedFriendId)
    );
    if (selectedFriend) {
      // Create a conversation object similar to existing conversations
      const newConversation = {
        id: selectedFriend.id,
        username: selectedFriend.username,
      };
      onStartConversation(newConversation);
      setSelectedFriendId(""); // Reset selection
    }
  };

  return (
    <div
      style={{
        padding: "20px",
        borderBottom: "1px solid #ddd",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h3 style={{ fontSize: "16px", marginBottom: "15px" }}>
        Start New Conversation
      </h3>
      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
        <select
          value={selectedFriendId}
          onChange={(e) => setSelectedFriendId(e.target.value)}
          style={{
            padding: "8px",
            fontSize: "14px",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          <option value="">Select a friend...</option>
          {friends.map((friend) => (
            <option key={friend.id} value={friend.id}>
              {friend.username}
            </option>
          ))}
        </select>
        <button
          onClick={handleStartConversation}
          disabled={!selectedFriendId}
          style={{
            padding: "8px 16px",
            fontSize: "14px",
            backgroundColor: selectedFriendId ? "#007bff" : "#ccc",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: selectedFriendId ? "pointer" : "not-allowed",
          }}
        >
          Start Conversation
        </button>
      </div>
    </div>
  );
}

function ConversationModal({
  isOpen,
  closeModal,
  conversation,
  currentUser,
  sendMessage,
}) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch messages when the modal is opened
  useEffect(() => {
    const fetchMessages = async () => {
      if (conversation) {
        try {
          setLoading(true);
          const response = await fetch(
            `/api/direct-messages/${conversation.id}`,
            {
              method: "GET",
              credentials: "include",
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch messages");
          }

          const data = await response.json();
          setMessages(data);
        } catch (error) {
          console.error("Error fetching messages:", error);
          // Set empty messages array if there's an error (like no previous conversation)
          setMessages([]);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchMessages();
  }, [conversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(`/api/direct-messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          receiver_id: conversation.id,
          message: newMessage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      const sentMessage = await response.json();
      setMessages((prevMessages) => [...prevMessages, sentMessage]);
      setNewMessage(""); // Clear the input field
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  if (!conversation) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeModal}
      contentLabel={`Conversation with ${conversation.username}`}
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          width: "500px",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
          backgroundColor: "#fff",
        },
        overlay: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "20px", margin: 0 }}>
          Conversation with {conversation.username}
        </h2>
        <button
          onClick={closeModal}
          style={{
            background: "none",
            border: "none",
            fontSize: "16px",
            color: "#888",
            cursor: "pointer",
          }}
        >
          ✖
        </button>
      </div>
      <div style={{ marginTop: "20px", maxHeight: "300px", overflowY: "auto" }}>
        {loading ? (
          <div>Loading messages...</div>
        ) : messages.length > 0 ? (
          messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: "10px",
                padding: "10px",
                borderRadius: "5px",
                backgroundColor:
                  message.sender_id === currentUser.id ? "#e6f7ff" : "#f6f6f6",
                textAlign:
                  message.sender_id === currentUser.id ? "right" : "left",
              }}
            >
              <span style={{ fontWeight: "bold", fontSize: "14px" }}>
                {message.sender_id === currentUser.id
                  ? "You"
                  : message.username}
                :
              </span>
              <span style={{ fontSize: "14px" }}> {message.message}</span>
            </div>
          ))
        ) : (
          <div style={{ fontStyle: "italic", color: "#888" }}>
            No messages yet. Start the conversation!
          </div>
        )}
      </div>
      <div style={{ marginTop: "20px", display: "flex", alignItems: "center" }}>
        <textarea
          placeholder="Type your message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          style={{
            flex: 1,
            padding: "10px",
            fontSize: "14px",
            borderRadius: "5px",
            border: "1px solid #ccc",
          }}
        />
        <button
          onClick={handleSendMessage}
          style={{
            marginLeft: "10px",
            padding: "10px 20px",
            fontSize: "14px",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Send
        </button>
      </div>
    </Modal>
  );
}

function DirectMessagesPage() {
  const { currentUser } = useOutletContext();
  const location = useLocation(); // Use location to read navigation state

  const [conversations, setConversations] = useState([]);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch friends list
  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser?.id) return;

      try {
        const response = await fetch(`/api/users/${currentUser.id}`, {
          credentials: "include",
        });

        if (response.ok) {
          const userData = await response.json();
          setFriends(userData.friend_list || []);
        }
      } catch (error) {
        console.error("Failed to fetch friends:", error);
      }
    };

    fetchFriends();
  }, [currentUser?.id]);

  useEffect(() => {
    const fetchConversations = async () => {
      if (!currentUser?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await fetch(`/api/direct-messages/conversations`, {
          method: "GET",
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch: ${response.status}`);
        }

        const data = await response.json();
        setConversations(data || []);

        // Automatically open a specific conversation if passed in state
        const openConversationWith = location.state?.openConversationWith;
        if (openConversationWith) {
          const conversation = data.find(
            (conv) => conv.id === openConversationWith
          );
          if (conversation) {
            setSelectedConversation(conversation);
            setIsModalOpen(true);
          } else {
            // If conversation doesn't exist in the list, create a temporary one
            // This handles the case where we're starting a new conversation
            const friend = friends.find((f) => f.id === openConversationWith);
            if (friend) {
              setSelectedConversation({
                id: friend.id,
                username: friend.username,
              });
              setIsModalOpen(true);
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch conversations:", error);
        setError("Failed to load conversations. Please try again later.");
        setConversations([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [currentUser?.id, location.state, friends]); // Re-fetch when user, navigation state, or friends change

  const openConversation = (conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  const handleStartConversation = (conversation) => {
    setSelectedConversation(conversation);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedConversation(null);
    setIsModalOpen(false);
  };

  if (!currentUser) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <div style={{ fontStyle: "italic", color: "#666" }}>
          Please log in to view your messages.
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <div style={{ width: "30%" }}>
        <StartConversation
          friends={friends}
          onStartConversation={handleStartConversation}
        />
        <ConversationsList
          conversations={conversations}
          openConversation={openConversation}
        />
      </div>

      {error && <div style={{ color: "red", padding: "20px" }}>{error}</div>}
      {isLoading && (
        <div style={{ padding: "20px", textAlign: "center" }}>
          Loading conversations...
        </div>
      )}

      <ConversationModal
        isOpen={isModalOpen}
        closeModal={closeModal}
        conversation={selectedConversation}
        currentUser={currentUser}
      />
    </div>
  );
}

export default DirectMessagesPage;
