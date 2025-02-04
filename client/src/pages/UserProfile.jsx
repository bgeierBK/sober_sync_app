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
  const navigate = useNavigate();

  // Fetch the logged-in user's info
  useEffect(() => {
    fetch("/api/me", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data.error) {
          console.error("Not logged in:", data.error);
        } else {
          setLoggedInUser(data); // Set the logged-in user
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
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [userId]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h3>{user.username}</h3>
      {/* Other user details */}

      {/* List Friends */}
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

      {/* Show Friend Requests only if viewing own profile */}
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
                </li>
              ))}
            </ul>
          ) : (
            <p>No pending friend requests</p>
          )}
        </div>
      )}
    </div>
  );
}

export default UserProfile;
