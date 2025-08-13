import "../App.css";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, NavLink, Outlet, useOutletContext } from "react-router-dom";
import "./ModalStyles.css"; // Import the styles (we'll create this next)
import UserProfileHeader from "../components/UserProfile/UserProfileHeader";

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = Number(id);
  const fallbackImagePath = "/blank_profile.webp";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [isFriends, setIsFriends] = useState(false);
  const [friendRequestSent, setFriendRequestSent] = useState(false);
  const [incomingFriendRequest, setIncomingFriendRequest] = useState(null);

  const [selectedTab, setSelectedTab] = useState("get-to-know-me")

  // Blocking states
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockingMe, setIsBlockingMe] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  const { handleLogOut } = useOutletContext()

  // Check blocking status
  const checkBlockStatus = async () => {
    if (!loggedInUser || loggedInUser.id === userId) return;

    try {
      const response = await fetch(`/api/users/${userId}/is-blocked`, {
        credentials: "include",
      });
      if (response.ok) {
        const blockData = await response.json();
        setIsBlocked(blockData.is_blocked_by_me);
        setIsBlockingMe(blockData.is_blocking_me);
      }
    } catch (error) {
      console.error("Error checking block status:", error);
    }
  };

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

  // Fetch user profile and block status on mount and when dependencies change
  useEffect(() => {
    if (loggedInUser) {
      fetchUserProfile();
      checkBlockStatus();
    }
  }, [userId, loggedInUser]);

  // Block user function
  const handleBlockUser = async () => {
    setBlockingInProgress(true);
    try {
      const response = await fetch(`/api/users/${userId}/block`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        setIsBlocked(true);
        setIsFriends(false); // Remove friendship status
        setFriendRequestSent(false); // Remove friend request status
        setIncomingFriendRequest(null); // Remove incoming friend request
        setShowBlockModal(false);
        // Refresh user data to reflect changes
        await fetchUserProfile();
      } else {
        const errorData = await response.json();
        alert(`Failed to block user: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      alert("Failed to block user. Please try again.");
    } finally {
      setBlockingInProgress(false);
    }
  };

  // Unblock user function
  const handleUnblockUser = async () => {
    setBlockingInProgress(true);
    try {
      const response = await fetch(`/api/users/${userId}/unblock`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setIsBlocked(false);
        // Refresh user data
        await fetchUserProfile();
      } else {
        const errorData = await response.json();
        alert(`Failed to unblock user: ${errorData.error}`);
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      alert("Failed to unblock user. Please try again.");
    } finally {
      setBlockingInProgress(false);
    }
  };

  // Friend request functions
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
        const errorData = await response.json();
        alert(`Failed to send friend request: ${errorData.error}`);
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

  // New function to handle viewing conversation
  const handleViewConversation = () => {
    navigate(`/messages/${loggedInUser.id}`, {
      state: { openConversationWith: userId },
    });
  };

  // Helper function to get display text for field values
  const getDisplayText = (field, value) => {
    if (!value) return "";

    const fieldOptions = {
      gender: {
        male: "Male",
        female: "Female",
        "non-binary": "Non-Binary",
      },
      orientation: {
        straight: "Straight",
        gay: "Gay",
        bi: "Bisexual",
        pan: "Pansexual",
        "aro/ace": "Asexual/Aromantic",
      },
      soberstatus: {
        abstinent: "Abstinent",
        "sober-curious": "Sober-Curious",
        "california-sober": "California Sober",
      },
    };

    return fieldOptions[field][value.toLowerCase()] || value;
  };

  // if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div className="section is-fullheight has-background-white-ter"></div>;

  // If the current user is blocked by this user, show limited info
  if (isBlockingMe) {
    return (
      <div className="user-profile">
        <div style={{ textAlign: "center", padding: "2rem", color: "#666" }}>
          <h3 style={{ color: "#d32f2f", marginBottom: "1rem" }}>
            User Profile Unavailable
          </h3>
          <p>This user has restricted access to their profile.</p>
        </div>
      </div>
    );
  }

  const handleTabClick = (e) => {
    setSelectedTab(e.target.name)
  }

  return (
    <section className="section is-small has-background-white-ter is-flex is-justify-content-center" >
      <div className="container is-max-desktop">
        <div className="box">
          {/* User Profile Header */}
          <UserProfileHeader
            user={user}
            getDisplayText={getDisplayText}
            fallbackImagePath={fallbackImagePath}
            loggedInUser={loggedInUser}
          />
          <div className="columns">
            {/* Tabs */}
            <div className="tabs">
              <ul className="is-flex is-flex-direction-column">
                <li className="is-active">
                  <NavLink to={`/users/${user.id}/get-to-know-me`}>
                    <button
                      className={
                        selectedTab === "get-to-know-me" ?
                          "button is-link is-rounded" :
                          "button is-link is-outlined is-rounded"
                      }
                      name="get-to-know-me"
                      onClick={handleTabClick}>Get to know me
                    </button>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={`/users/${user.id}/friends`}>
                    <button
                      className={
                        selectedTab === "friends" ?
                          "button is-link is-rounded" :
                          "button is-link is-outlined is-rounded"
                      }
                      name="friends"
                      onClick={handleTabClick}>Friends
                    </button>
                  </NavLink>
                </li>
                <li>
                  <NavLink to={`/users/${user.id}/events`}>
                    <button
                      className={
                        selectedTab === "my-events" ?
                          "button is-link is-rounded" :
                          "button is-link is-outlined is-rounded"
                      }
                      name="my-events"
                      onClick={handleTabClick}>My events
                    </button>
                  </NavLink>
                </li>
                <li>
                    <button
                      className={"button is-danger is-outlined is-rounded"}
                      name="logout"
                      onClick={handleLogOut}> Log Out
                    </button>
                </li>
              </ul>
            </div>

            <div className="column">
              <Outlet context={{ user, setUser, loggedInUser }} />
            </div>
          </div>
          {/* Block Confirmation Modal */}
          {showBlockModal && (
            <div
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0, 0, 0, 0.5)",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 1000,
              }}
            >
              <div
                style={{
                  background: "white",
                  padding: "2rem",
                  borderRadius: "8px",
                  maxWidth: "400px",
                  width: "90%",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
                }}
              >
                <h3 style={{ marginTop: 0, color: "#d32f2f" }}>Block User</h3>
                <p style={{ margin: "1rem 0", lineHeight: "1.5" }}>
                  Are you sure you want to block <strong>{user.username}</strong>?
                </p>
                <p style={{ margin: "1rem 0", lineHeight: "1.5" }}>
                  This will remove them from your friends list, cancel any pending
                  friend requests, and prevent them from messaging you or seeing
                  your profile.
                </p>
                <div
                  style={{
                    display: "flex",
                    gap: "1rem",
                    justifyContent: "flex-end",
                    marginTop: "1.5rem",
                  }}
                >
                  <button
                    onClick={handleBlockUser}
                    disabled={blockingInProgress}
                    style={{
                      backgroundColor: blockingInProgress ? "#ccc" : "#d32f2f",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      cursor: blockingInProgress ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      transition: "background-color 0.2s",
                    }}
                  >
                    {blockingInProgress ? "Blocking..." : "Yes, Block User"}
                  </button>
                  <button
                    onClick={() => setShowBlockModal(false)}
                    disabled={blockingInProgress}
                    style={{
                      backgroundColor: blockingInProgress ? "#ccc" : "#757575",
                      color: "white",
                      border: "none",
                      padding: "0.5rem 1rem",
                      borderRadius: "4px",
                      cursor: blockingInProgress ? "not-allowed" : "pointer",
                      fontSize: "0.9rem",
                      transition: "background-color 0.2s",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* Messaging section with conditional rendering based on user context */}
          {loggedInUser && (
            <div className="messages-section">
              {/* Show "My Messages" when viewing own profile */}
              {loggedInUser.id === user.id && (
                <Link to={`/messages/${userId}`} className="message-button">
                  My Messages
                </Link>
              )}

              {/* Show "Message User" button ONLY when viewing a friend's profile and not blocked */}
              {loggedInUser.id !== user.id && isFriends && !isBlocked && (
                <button
                  onClick={handleViewConversation}
                  className="message-button"
                >
                  View Conversation
                </button>
              )}
            </div>
          )}

          {/* Action buttons section */}
          {loggedInUser && loggedInUser.id !== user.id && (
            <div
              style={{
                margin: "1.5rem 0",
                padding: "1rem",
                borderTop: "1px solid #eee",
                display: "flex",
                flexDirection: "column",
                gap: "0.5rem",
              }}
            >
              {/* Block/Unblock button */}
              {isBlocked ? (
                <button
                  onClick={handleUnblockUser}
                  disabled={blockingInProgress}
                  style={{
                    backgroundColor: blockingInProgress ? "#ccc" : "#388e3c",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: blockingInProgress ? "not-allowed" : "pointer",
                    fontSize: "0.9rem",
                    transition: "background-color 0.2s",
                    alignSelf: "flex-start",
                  }}
                >
                  {blockingInProgress ? "Unblocking..." : "Unblock User"}
                </button>
              ) : (
                <button
                  onClick={() => setShowBlockModal(true)}
                  style={{
                    backgroundColor: "#d32f2f",
                    color: "white",
                    border: "none",
                    padding: "0.5rem 1rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem",
                    transition: "background-color 0.2s",
                    alignSelf: "flex-start",
                  }}
                >
                  Block User
                </button>
              )}

              {/* Friend request buttons - only show if not blocked */}
              {!isBlocked && (
                <>
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
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </section>
  );
}

export default UserProfile;
