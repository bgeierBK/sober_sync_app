import "../App.css";
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
  const userId = Number(id);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  // ... other state variables ...

  // Fetch session user data and user profile data as before...
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
        // ... other state updates ...
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
    </div>
  );
}

export default UserProfile;
