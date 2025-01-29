import "../App.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [friends, setFriends] = useState([]);
  const [friendRequestStatus, setFriendRequestStatus] = useState(null); // Track friend request status
  const [isLoggedInUser, setIsLoggedInUser] = useState(false);
  const [isFriend, setIsFriend] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [receivedRequest, setReceivedRequest] = useState(false);
  const [sessionUserId, setSessionUserId] = useState(null);
  const navigate = useNavigate();

  // Fetch session user data and check if logged in
  useEffect(() => {
    fetch("api/check_session", {
      method: "GET",
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          setSessionUserId(null); // No user logged in
        } else {
          setSessionUserId(data.id);
        }
      });
  }, []);

  // Fetch user data
  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);

        // Check if this is the logged-in user's profile
        if (sessionUserId === data.id) {
          setIsLoggedInUser(true);
        }

        // Check if user is a friend
        const friendStatus = data.friends.some(
          (friend) => friend.id === sessionUserId
        );
        setIsFriend(friendStatus);

        // Check if a friend request has been sent
        fetch("/api/friend-requests")
          .then((res) => res.json())
          .then((reqData) => {
            const sentReq = reqData.sent_requests.some(
              (req) => req.receiver_id === data.id
            );
            const receivedReq = reqData.received_requests.some(
              (req) => req.sender_id === data.id
            );
            setIsRequestSent(sentReq);
            setReceivedRequest(receivedReq);
          });
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, [id, sessionUserId]);

  // Handle add friend request
  const handleAddFriend = () => {
    fetch(`/api/friend-request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiver_id: user.id }),
      credentials: "include",
    })
      .then((res) => res.json())
      .then(() => setIsRequestSent(true));
  };

  // Handle accept friend request
  const handleAcceptFriendRequest = (requestId) => {
    fetch(`/api/friend-request/${requestId}/approve`, {
      method: "POST",
      credentials: "include",
    }).then(() => setIsFriend(true));
  };

  // Handle deny friend request
  const handleDenyFriendRequest = (requestId) => {
    fetch(`/api/friend-request/${requestId}/reject`, {
      method: "POST",
      credentials: "include",
    }).then(() => setReceivedRequest(false));
  };

  // Handle remove friend
  const handleRemoveFriend = () => {
    fetch(`/api/friend-request`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
      credentials: "include",
    }).then(() => setIsFriend(false));
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return <div>User not found</div>;
  }

  return (
    <>
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
          <button onClick={() => handleAcceptFriendRequest(user.id)}>
            Accept Friend Request
          </button>
          <button onClick={() => handleDenyFriendRequest(user.id)}>
            Deny Friend Request
          </button>
        </>
      )}

      {sessionUserId && isFriend && (
        <button onClick={handleRemoveFriend}>Remove Friend</button>
      )}
    </>
  );
}

export default UserProfile;
