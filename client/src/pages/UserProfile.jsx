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
      credentials: "include",
    })
      .then((response) => response.json())
      .then((data) => {
        if (!data.error) {
          setSessionUserId(data.id);
        }
      });
  }, []);

  // Fetch user data only after sessionUserId is set
  useEffect(() => {
    if (!sessionUserId) return;

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

        if (sessionUserId === data.id) {
          setIsLoggedInUser(true);
        }

        setIsFriend(data.friends.some((friend) => friend.id === sessionUserId));

        return fetch("/api/friend-requests");
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
        setError(error);
        setLoading(false);
      });
  }, [id, sessionUserId]);

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

  const handleRemoveFriend = () => {
    fetch(`/api/friend-request`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
      credentials: "include",
    }).then(() => setIsFriend(false));
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>User not found</div>;

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
          <button onClick={handleAcceptFriendRequest}>
            Accept Friend Request
          </button>
          <button onClick={handleDenyFriendRequest}>Deny Friend Request</button>
        </>
      )}

      {sessionUserId && isFriend && (
        <button onClick={handleRemoveFriend}>Remove Friend</button>
      )}
    </>
  );
}

export default UserProfile;
