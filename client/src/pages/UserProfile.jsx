import "../App.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

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
  const navigate = useNavigate();

  // Fetch the logged-in user's info
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

  // Fetch the user profile info
  useEffect(() => {
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
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [userId, loggedInUser]);

  // Function to format "sober_status" (if needed)
  const formatSoberStatus = (status) => {
    switch (status) {
      case "sober":
        return "Sober";
      case "moderate":
        return "Moderate Drinker";
      case "social":
        return "Social Drinker";
      case "non-drinker":
        return "Non-Drinker";
      default:
        return "Not specified";
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h3>{user.username}</h3>
      <p>
        <strong>Bio:</strong> {user.bio || "No bio available"}
      </p>

      {/* Additional User Details */}
      <p>
        <strong>Sober Status:</strong> {formatSoberStatus(user.sober_status)}
      </p>
      <p>
        <strong>Orientation:</strong> {user.orientation || "Not specified"}
      </p>
      <p>
        <strong>Gender:</strong> {user.gender || "Not specified"}
      </p>

      {/* Friends List */}
      <div className="friends-list">
        <h4>Friends</h4>
        {user.friend_list && user.friend_list.length > 0 ? (
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

      {/* Friend Requests Section (Only visible when viewing own profile) */}
      {loggedInUser && loggedInUser.id === user.id && (
        <div className="friend-requests-list">
          <h4>Friend Requests</h4>
          {user.friend_requests_list && user.friend_requests_list.length > 0 ? (
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

      {/* Events RSVPed To */}
      <div className="events-list">
        <h4>Events Attending</h4>
        {user.events && user.events.length > 0 ? (
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
