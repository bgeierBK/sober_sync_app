import "../App.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
  const userId = Number(id); // Ensure id is a number
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [sessionUserId, setSessionUserId] = useState(null);
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [receivedRequest, setReceivedRequest] = useState(null);
  const navigate = useNavigate();

  // Fetch session user data first
  useEffect(() => {
    fetch("/api/check_session", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.error) {
          setSessionUserId(data.id);
        }
      })
      .catch((error) => {
        setError("Session check failed.");
        setLoading(false);
      });
  }, []);

  // Fetch user data only after sessionUserId is set
  useEffect(() => {
    if (!sessionUserId) return;

    fetch(`/api/users/${userId}`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);

        if (sessionUserId === data.id) {
          setIsLoggedInUser(true);
        }

        setIsFriend(
          Array.isArray(data.friends) &&
            data.friends.some((friend) => friend.id === sessionUserId)
        );

        return fetch("/api/friend-requests", {
          credentials: "include",
        });
      })
      .then((res) => res.json())
      .then((reqData) => {
        setIsRequestSent(
          Array.isArray(reqData.sent_requests) &&
            reqData.sent_requests.some((req) => req.receiver_id === userId)
        );

        const receivedReq = reqData.received_requests.find(
          (req) => req.sender_id === userId
        );
        setReceivedRequest(receivedReq);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [userId, sessionUserId]);

  const handleAddFriend = () => {
    fetch(`/api/friend-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: user.id }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => setIsRequestSent(true))
      .catch((error) => setError(error.message));
  };

  const handleAcceptFriendRequest = () => {
    if (!receivedRequest) return;
    fetch(`/api/friend-request/${receivedRequest.id}/approve`, {
      method: "POST",
      credentials: "include",
    }).then(() => {
      setIsFriend(true);
      setReceivedRequest(null);
    });
  };

  const handleDenyFriendRequest = () => {
    if (!receivedRequest) return;
    fetch(`/api/friend-request/${receivedRequest.id}/reject`, {
      method: "POST",
      credentials: "include",
    }).then(() => setReceivedRequest(null));
  };

  const handleRemoveFriend = (friendId) => {
    fetch(`/api/friend-request`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: friendId }),
      credentials: "include",
    }).then(() => setIsFriend(false));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h3>{user.username}</h3>
      <h4>{user.sober_status}</h4>
      <h4>{user.gender}</h4>
      <h4>{user.orientation}</h4>

      {sessionUserId && !isLoggedInUser && !isFriend && !isRequestSent && (
        <button onClick={handleAddFriend}>Add Friend</button>
      )}

      {sessionUserId && !isLoggedInUser && isRequestSent && (
        <p>Friend request sent</p>
      )}

      {sessionUserId && !isLoggedInUser && receivedRequest && (
        <>
          <button onClick={handleAcceptFriendRequest}>
            Accept Friend Request
          </button>
          <button onClick={handleDenyFriendRequest}>Deny Friend Request</button>
        </>
      )}

      {sessionUserId && isFriend && (
        <button onClick={handleRemoveFriend}>Remove Friend</button>
      )}

      {isLoggedInUser && (
        <>
          <button onClick={() => navigate(`/edit-profile/${user.id}`)}>
            Edit Profile
          </button>

          {/* List Friends */}
          <div className="friends-list">
            <h4>Friends</h4>
            {user.friends && user.friends.length > 0 ? (
              <ul>
                {user.friends.map((friend) => (
                  <li key={friend.id}>
                    <span>{friend.username}</span>
                    {sessionUserId === user.id && (
                      <button onClick={() => handleRemoveFriend(friend.id)}>
                        Remove Friend
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No friends yet</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default UserProfile;
