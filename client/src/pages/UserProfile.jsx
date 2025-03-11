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
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(null);

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
    if (loggedInUser) {
      fetchUserProfile();
    }
  }, [userId, loggedInUser]);

  const handleEditProfile = () => {
    setEditedUser({
      bio: user.bio || "",
      photo_url: user.photo_url || "",
      question1_answer: user.question1_answer || "",
      question2_answer: user.question2_answer || "",
      question3_answer: user.question3_answer || "",
    });
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(editedUser),
      });

      if (!response.ok) {
        throw new Error("Failed to save profile");
      }

      const updatedData = await response.json();
      setUser(updatedData);
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser(null);
  };

  // Friend request functions (unchanged)
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
          e.target.onerror = null;
          e.target.src = fallbackImagePath;
        }}
      />

      {isEditing && editedUser ? (
        <div className="edit-profile">
          <label>Bio:</label>
          <textarea
            value={editedUser.bio}
            onChange={(e) =>
              setEditedUser({ ...editedUser, bio: e.target.value })
            }
            maxLength={300}
          />
          <label>Photo URL:</label>
          <input
            type="text"
            value={editedUser.photo_url}
            onChange={(e) =>
              setEditedUser({ ...editedUser, photo_url: e.target.value })
            }
          />
          <label>Question 1:</label>
          <textarea
            value={editedUser.question1_answer}
            onChange={(e) =>
              setEditedUser({ ...editedUser, question1_answer: e.target.value })
            }
            maxLength={300}
          />
          <label>Question 2:</label>
          <textarea
            value={editedUser.question2_answer}
            onChange={(e) =>
              setEditedUser({ ...editedUser, question2_answer: e.target.value })
            }
            maxLength={300}
          />
          <label>Question 3:</label>
          <textarea
            value={editedUser.question3_answer}
            onChange={(e) =>
              setEditedUser({ ...editedUser, question3_answer: e.target.value })
            }
            maxLength={300}
          />
          <button onClick={handleSaveProfile}>Save Changes</button>
          <button onClick={handleCancelEdit}>Cancel</button>
        </div>
      ) : (
        <>
          <p>
            <strong>Bio:</strong> {user.bio || "No bio available"}
          </p>
          {user.question1_answer && (
            <p>
              <strong>Q1:</strong> {user.question1_answer}
            </p>
          )}
          {user.question2_answer && (
            <p>
              <strong>Q2:</strong> {user.question2_answer}
            </p>
          )}
          {user.question3_answer && (
            <p>
              <strong>Q3:</strong> {user.question3_answer}
            </p>
          )}
          {loggedInUser && loggedInUser.id === user.id && (
            <button onClick={handleEditProfile}>Edit Profile</button>
          )}
        </>
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

      {/* Friend Requests */}
      {loggedInUser && loggedInUser.id === user.id && (
        <div className="friend-requests-list">
          <h4>Friend Requests</h4>
          {user.friend_requests_list?.length > 0 ? (
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
            <p>No friend requests</p>
          )}
        </div>
      )}

      {/* Buttons for adding and removing friends */}
      {!isFriends && !friendRequestSent && (
        <button onClick={handleAddFriend}>Send Friend Request</button>
      )}

      {isFriends && <button>Unfriend</button>}
      {friendRequestSent && <p>Friend request sent</p>}
      {incomingFriendRequest && (
        <p>
          You have an incoming friend request from{" "}
          <Link to={`/users/${incomingFriendRequest.sender_id}`}>
            {incomingFriendRequest.sender_username}
          </Link>
        </p>
      )}
    </div>
  );
}

export default UserProfile;
