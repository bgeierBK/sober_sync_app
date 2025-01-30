import "../App.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
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
      credentials: "include", // Ensures cookies are sent with the request
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

    fetch(`/api/users/${id}`, { credentials: "include" }) // Ensure session cookie is sent
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);

        // Check if the current user is logged in and whether they are the profile owner
        if (sessionUserId === data.id) {
          setIsLoggedInUser(true);
        }

        setIsFriend(data.friends.some((friend) => friend.id === sessionUserId));

        // Fetch friend requests data
        return fetch("/api/friend-requests", {
          credentials: "include", // Ensure session cookies are sent
        });
      })
      .then((res) => res.json())
      .then((reqData) => {
        setIsRequestSent(
          reqData.sent_requests.some((req) => req.receiver_id === id)
        );
        const receivedReq = reqData.received_requests.find(
          (req) => req.sender_id === id
        );
        setReceivedRequest(receivedReq);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id, sessionUserId]);

  const handleAddFriend = () => {
    fetch(`/api/friend-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: user.id }),
      credentials: "include", // Include session cookies
    })
      .then((res) => res.json())
      .then(() => setIsRequestSent(true))
      .catch((error) => setError(error.message));
  };

  const handleAcceptFriendRequest = () => {
    if (!receivedRequest) return;
    fetch(`/api/friend-request/${receivedRequest.id}/approve`, {
      method: "POST",
      credentials: "include", // Include session cookies
    }).then(() => {
      setIsFriend(true);
      setReceivedRequest(null);
    });
  };

  const handleDenyFriendRequest = () => {
    if (!receivedRequest) return;
    fetch(`/api/friend-request/${receivedRequest.id}/reject`, {
      method: "POST",
      credentials: "include", // Include session cookies
    }).then(() => setReceivedRequest(null));
  };

  const handleRemoveFriend = () => {
    fetch(`/api/friend-request`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
      credentials: "include", // Include session cookies
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

      {/* If the logged-in user is not the profile owner, show friend request buttons */}
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

      {/* If the logged-in user is viewing their own profile, provide options to edit or manage their profile */}
      {isLoggedInUser && (
        <button onClick={() => navigate(`/edit-profile/${user.id}`)}>
          Edit Profile
        </button>
      )}
    </div>
  );
}

export default UserProfile;
