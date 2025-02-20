import "../App.css";
import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

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

  const fallbackImagePath = "/blank_profile.webp";

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

  // Fetch logged-in user
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setLoggedInUser(data);
        }
      })
      .catch((err) => console.error("Error fetching logged-in user:", err));
  }, []);

  // Fetch user profile on mount and when dependencies change
  useEffect(() => {
    fetchUserProfile();
  }, [userId, loggedInUser]);

  // Fetch Friend Requests
  const fetchFriendRequests = async () => {
    try {
      const response = await fetch("/api/friend-requests", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        // You can use this data to update friend request states if needed
      } else {
        console.error("Error fetching friend requests");
      }
    } catch (error) {
      console.error("Error fetching friend requests:", error);
    }
  };

  // Send Friend Request
  const handleAddFriend = async () => {
    try {
      const response = await fetch("/api/friend-request", {
        method: "POST",
        credentials: "include",
        body: JSON.stringify({ receiver_id: userId }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setFriendRequestSent(true);
      } else {
        console.error("Failed to send friend request");
      }
    } catch (error) {
      console.error("Error sending friend request:", error);
    }
  };

  // Accept Friend Request
  const handleAcceptFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friend-request/${requestId}/approve`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchUserProfile(); // Refresh user data after accepting
      } else {
        console.error("Failed to accept friend request");
      }
    } catch (error) {
      console.error("Error accepting friend request:", error);
    }
  };

  // Reject Friend Request
  const handleRejectFriendRequest = async (requestId) => {
    try {
      const response = await fetch(`/api/friend-request/${requestId}/reject`, {
        method: "POST",
        credentials: "include",
      });

      if (response.ok) {
        fetchUserProfile(); // Refresh user data after rejecting
      } else {
        console.error("Failed to reject friend request");
      }
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h3>{user.username}</h3>
      <img
        src={user.photo_url || fallbackImagePath}
        alt={`${user.username}'s profile`}
        className="profile-picture"
        onError={(e) => {
          e.target.onerror = null; // Prevent infinite loop
          e.target.src = fallbackImagePath;
        }}
      />
      <p>
        <strong>Bio:</strong> {user.bio || "No bio available"}
      </p>

      <div className="friends-list">
        <h4>Friends</h4>
        {user.friend_list.length > 0 ? (
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

      {/* Friend Requests */}
      {loggedInUser && loggedInUser.id === user.id && (
        <div className="friend-requests-list">
          <h4>Friend Requests</h4>
          {user.friend_requests_list.length > 0 ? (
            <ul>
              {user.friend_requests_list.map((req) => (
                <li key={req.id}>
                  <Link to={`/users/${req.sender_id}`}>
                    {req.sender_username}
                  </Link>{" "}
                  sent you a friend request.
                  <button onClick={() => handleAcceptFriendRequest(req.id)}>
                    Accept
                  </button>
                  <button onClick={() => handleRejectFriendRequest(req.id)}>
                    Deny
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>No pending friend requests</p>
          )}
        </div>
      )}

      {/* Friend Actions */}
      {loggedInUser && loggedInUser.id !== user.id && (
        <div className="friend-action">
          {isFriends ? (
            <p>You and {user.username} are already friends.</p>
          ) : incomingFriendRequest ? (
            <div>
              <button
                onClick={() =>
                  handleAcceptFriendRequest(incomingFriendRequest.id)
                }
              >
                Accept Friend Request
              </button>
              <button
                onClick={() =>
                  handleRejectFriendRequest(incomingFriendRequest.id)
                }
              >
                Deny Friend Request
              </button>
            </div>
          ) : friendRequestSent ? (
            <p>Friend request sent!</p>
          ) : (
            <button onClick={handleAddFriend}>Add Friend</button>
          )}
        </div>
      )}

      {/* Events */}
      <div className="events-list">
        <h4>Events Attending</h4>
        {user.events.length > 0 ? (
          <ul>
            {user.events.map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                {event.date} at {event.venue_name}, {event.city}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events RSVPed to yet</p>
        )}
      </div>
    </div>
  );
}

export default UserProfile;
