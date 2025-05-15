import "../App.css";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
  const userId = Number(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isFriends, setIsFriends] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [incomingFriendRequest, setIncomingFriendRequest] = useState(null);
  const [requestStatus, setRequestStatus] = useState(null);
  const [friendRequests, setFriendRequests] = useState([]);
  const [receivedFriendRequests, setReceivedFriendRequests] = useState([]);
  const [requestActionStatus, setRequestActionStatus] = useState({
    id: null,
    action: null,
    status: null,
  });

  const fallbackImagePath = "/blank_profile.webp";
  const today = new Date().toISOString().split("T")[0];
  const navigate = useNavigate();

  // Fetch user profile
  const fetchUserProfile = async () => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setUser(data);
      setLoading(false);

      if (loggedInUser) {
        setIsFriends(
          data.friend_list.some((friend) => friend.id === loggedInUser.id)
        );

        setFriendRequestSent(
          data.friend_requests_received?.some(
            (req) => req.sender_id === loggedInUser.id
          )
        );

        const incomingRequest = data.friend_requests_list?.find(
          (req) => req.sender_id === userId
        );
        setIncomingFriendRequest(incomingRequest);
      }
    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  // Fetch friend requests
  const fetchFriendRequests = async () => {
    try {
      const response = await fetch("/api/friend-requests", {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch friend requests");
      }

      const data = await response.json();
      setFriendRequests(data.sent_requests || []);
      setReceivedFriendRequests(data.received_requests || []);
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  // Fetch logged-in user and friend requests
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setLoggedInUser(data);
          // Fetch friend requests after we know who's logged in
          fetchFriendRequests();
        }
      })
      .catch((err) => console.error("Error fetching logged-in user:", err));
  }, []);

  // Fetch user profile on mount and when dependencies change
  useEffect(() => {
    if (loggedInUser) {
      fetchUserProfile();
    }
  }, [userId, loggedInUser]);

  const handleDirectMessage = () => {
    // Redirect to the messages page with the loggedInUser's ID and open the modal for this user
    if (loggedInUser?.id) {
      navigate(`/messages/${loggedInUser.id}`, {
        state: { openConversationWith: userId },
      });
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      setRequestActionStatus({
        id: requestId,
        action: "accept",
        status: "pending",
      });

      const response = await fetch(`/api/friend-request/${requestId}/approve`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept friend request");
      }

      // Find the request that was accepted
      const acceptedRequest = receivedFriendRequests.find(
        (req) => req.id === requestId
      );

      if (acceptedRequest) {
        // Add the sender to the current user's friend list
        setUser((prevUser) => {
          // Only update if we're viewing the logged-in user's profile
          if (prevUser && loggedInUser && prevUser.id === loggedInUser.id) {
            const newFriend = {
              id: acceptedRequest.sender_id,
              username: acceptedRequest.sender_username,
            };

            // Check if they're already in the friend list to avoid duplicates
            const isAlreadyFriend = prevUser.friend_list?.some(
              (friend) => friend.id === newFriend.id
            );

            if (!isAlreadyFriend) {
              return {
                ...prevUser,
                friend_list: [...(prevUser.friend_list || []), newFriend],
              };
            }
          }
          return prevUser;
        });

        // Also update the loggedInUser state to include the new friend
        setLoggedInUser((prevUser) => {
          if (prevUser) {
            const newFriend = {
              id: acceptedRequest.sender_id,
              username: acceptedRequest.sender_username,
            };

            // Check if they're already in the friend list to avoid duplicates
            const isAlreadyFriend = prevUser.friend_list?.some(
              (friend) => friend.id === newFriend.id
            );

            if (!isAlreadyFriend) {
              return {
                ...prevUser,
                friend_list: [...(prevUser.friend_list || []), newFriend],
              };
            }
          }
          return prevUser;
        });
      }

      // Remove the accepted request from receivedFriendRequests
      setReceivedFriendRequests((requests) =>
        requests.filter((req) => req.id !== requestId)
      );

      setRequestActionStatus({
        id: requestId,
        action: "accept",
        status: "success",
      });

      // Reset status after a delay
      setTimeout(() => {
        setRequestActionStatus({
          id: null,
          action: null,
          status: null,
        });
      }, 3000);
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setRequestActionStatus({
        id: requestId,
        action: "accept",
        status: "error",
      });

      // Reset status after a delay
      setTimeout(() => {
        setRequestActionStatus({
          id: null,
          action: null,
          status: null,
        });
      }, 3000);
    }
  };

  const handleRejectRequest = async (requestId) => {
    try {
      setRequestActionStatus({
        id: requestId,
        action: "reject",
        status: "pending",
      });

      const response = await fetch(`/api/friend-request/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to reject friend request");
      }

      // Remove the rejected request from receivedFriendRequests
      setReceivedFriendRequests((requests) =>
        requests.filter((req) => req.id !== requestId)
      );

      setRequestActionStatus({
        id: requestId,
        action: "reject",
        status: "success",
      });

      // Reset status after a delay
      setTimeout(() => {
        setRequestActionStatus({
          id: null,
          action: null,
          status: null,
        });
      }, 3000);
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setRequestActionStatus({
        id: requestId,
        action: "reject",
        status: "error",
      });

      // Reset status after a delay
      setTimeout(() => {
        setRequestActionStatus({
          id: null,
          action: null,
          status: null,
        });
      }, 3000);
    }
  };

  const handleGoToMyMessages = () => {
    if (loggedInUser?.id) {
      navigate(`/messages/${loggedInUser.id}`);
    }
  };

  const handleSendFriendRequest = async () => {
    if (!loggedInUser) {
      // Handle not logged in case
      return;
    }

    try {
      setRequestStatus("sending");
      const response = await fetch("/api/friend-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          receiver_id: userId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send friend request");
      }

      setFriendRequestSent(true);
      setRequestStatus("success");
    } catch (error) {
      console.error("Error sending friend request:", error);
      setRequestStatus("error");
      setTimeout(() => setRequestStatus(null), 3000);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  const upcomingEvents =
    user.events?.filter((event) => event.date >= today) || [];
  const pastEvents = user.events?.filter((event) => event.date < today) || [];

  return (
    <div className="profile-container">
      {/* Friend request actions - if current user is not the profile owner */}
      {loggedInUser && userId !== loggedInUser.id && (
        <div className="friend-actions">
          {isFriends ? (
            <button onClick={handleDirectMessage} className="message-button">
              Send Message
            </button>
          ) : friendRequestSent ? (
            <span className="request-pending">Friend Request Sent</span>
          ) : incomingFriendRequest ? (
            <div className="incoming-request">
              <p>This user sent you a friend request</p>
              <div className="request-buttons">
                <button
                  onClick={() => handleAcceptRequest(incomingFriendRequest.id)}
                  className="accept-button"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleRejectRequest(incomingFriendRequest.id)}
                  className="reject-button"
                >
                  Reject
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleSendFriendRequest}
              className="friend-request-button"
              disabled={requestStatus === "sending"}
            >
              {requestStatus === "sending"
                ? "Sending..."
                : "Send Friend Request"}
            </button>
          )}
          {requestStatus === "error" && (
            <p className="error-message">
              Failed to send friend request. Please try again.
            </p>
          )}
        </div>
      )}

      <img
        src={user.photo_url || fallbackImagePath}
        alt={`${user.username}'s profile`}
        className="profile-picture"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = fallbackImagePath;
        }}
      />

      <p>
        <strong>Bio:</strong> {user.bio || "No bio available"}
      </p>

      {/* Display gender, orientation, and sober status if available */}
      <div className="user-details">
        {user.gender && (
          <p>
            <strong>Gender:</strong> {user.gender}
          </p>
        )}
        {user.orientation && (
          <p>
            <strong>Orientation:</strong> {user.orientation}
          </p>
        )}
        {user.soberstatus && (
          <p>
            <strong>Sober Status:</strong> {user.soberstatus}
          </p>
        )}
      </div>

      {user.question1_answer && (
        <p>
          <strong>What is your dream concert lineup?</strong>{" "}
          {user.question1_answer}
        </p>
      )}
      {user.question2_answer && (
        <p>
          <strong>What is the best concert you've ever been to?</strong>{" "}
          {user.question2_answer}
        </p>
      )}
      {user.question3_answer && (
        <p>
          <strong>What is your favorite concert venue?</strong>{" "}
          {user.question3_answer}
        </p>
      )}

      <div className="friends-list">
        <h4>Friends</h4>
        {user.friend_list?.length > 0 ? (
          <ul>
            {user.friend_list.map((friend) => (
              <li key={friend.id}>
                <Link to={`/users/${friend.id}`}>{friend.username}</Link>
              </li>
            ))}
          </ul>
        ) : (
          <p>No friends yet</p>
        )}
      </div>

      <div className="events-list">
        <h4>Upcoming Events</h4>
        {upcomingEvents.length > 0 ? (
          <ul>
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                {event.date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming events</p>
        )}
      </div>

      <div className="events-list">
        <h4>Past Events</h4>
        {pastEvents.length > 0 ? (
          <ul>
            {pastEvents.map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                {event.date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No past events</p>
        )}
      </div>

      {/* Friend Requests Section - moved to the bottom */}
      {loggedInUser &&
        userId === loggedInUser.id &&
        receivedFriendRequests.length > 0 && (
          <div className="friend-requests-section">
            <h3>Friend Requests</h3>
            <ul className="friend-requests-list">
              {receivedFriendRequests.map((request) => (
                <li key={request.id} className="friend-request-item">
                  <div className="request-info">
                    {/* Displaying the sender's username */}
                    <strong>
                      {request.sender_username || "Unknown User"}
                    </strong>{" "}
                    sent you a friend request
                  </div>
                  <div className="request-actions">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="accept-request-button"
                      disabled={
                        requestActionStatus.id === request.id &&
                        requestActionStatus.status === "pending"
                      }
                    >
                      {requestActionStatus.id === request.id &&
                      requestActionStatus.action === "accept" &&
                      requestActionStatus.status === "pending"
                        ? "Accepting..."
                        : "Accept"}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="reject-request-button"
                      disabled={
                        requestActionStatus.id === request.id &&
                        requestActionStatus.status === "pending"
                      }
                    >
                      {requestActionStatus.id === request.id &&
                      requestActionStatus.action === "reject" &&
                      requestActionStatus.status === "pending"
                        ? "Rejecting..."
                        : "Reject"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      {/* Add some basic styling for the friend requests section */}
      <style jsx="true">{`
        .friend-requests-section {
          margin-top: 20px;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
        }

        .friend-requests-list {
          list-style: none;
          padding: 0;
        }

        .friend-request-item {
          display: flex;
          flex-direction: column;
          padding: 12px;
          margin-bottom: 10px;
          background-color: white;
          border-radius: 6px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .request-info {
          margin-bottom: 10px;
        }

        .request-actions {
          display: flex;
          gap: 10px;
        }

        .accept-request-button {
          background-color: #28a745;
          color: white;
          border: none;
          padding: 5px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .reject-request-button {
          background-color: #dc3545;
          color: white;
          border: none;
          padding: 5px 12px;
          border-radius: 4px;
          cursor: pointer;
        }

        .error-message {
          color: #dc3545;
          margin-top: 8px;
          font-size: 0.85rem;
        }

        .success-message {
          color: #28a745;
          margin-top: 8px;
          font-size: 0.85rem;
        }

        button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}

export default UserProfile;
