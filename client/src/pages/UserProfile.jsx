import "../App.css";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate, NavLink, Outlet, useOutletContext } from "react-router-dom";
import "./ModalStyles.css"; // Import the styles (we'll create this next)
import UserProfileHeader from "../components/UserProfile/UserProfileHeader";

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
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
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [selectedTab, setSelectedTab] = useState("get-to-know-me")

  // Blocking states
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockingMe, setIsBlockingMe] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockingInProgress, setBlockingInProgress] = useState(false);

  const fallbackImagePath = "/blank_profile.webp";
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

  const handleEditProfile = () => {
    setEditedUser({
      bio: user.bio || "",
      photo_url: user.photo_url || "",
      question1_answer: user.question1_answer || "",
      question2_answer: user.question2_answer || "",
      question3_answer: user.question3_answer || "",
      gender: user.gender || "",
      orientation: user.orientation || "",
      soberstatus: user.soberstatus || "",
    });
    setPreviewUrl(user.photo_url || "");
    setIsEditing(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
      // Create a preview URL
      const fileReader = new FileReader();
      fileReader.onload = () => {
        setPreviewUrl(fileReader.result);
      };
      fileReader.readAsDataURL(file);
    }
  };

  // Upload photo separately if needed
  const uploadPhoto = async () => {
    if (!photoFile) return null;

    setPhotoUploading(true);
    try {
      // Create FormData for just the photo
      const photoData = new FormData();
      photoData.append("profile_photo", photoFile);

      // Check if your API has a separate endpoint for photo uploads
      // If not, you might need to implement this on the backend
      const uploadResponse = await fetch(`/api/users/${user.id}/upload-photo`, {
        method: "POST",
        credentials: "include",
        body: photoData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload photo");
      }

      const uploadResult = await uploadResponse.json();
      setPhotoUploading(false);
      return uploadResult.photo_url; // Assuming the API returns the URL
    } catch (error) {
      console.error("Error uploading photo:", error);
      setPhotoUploading(false);
      throw error;
    }
  };

  const handleSaveProfile = async () => {
    try {
      let photoUrl = editedUser.photo_url;

      // Only attempt photo upload if we have a new file
      if (photoFile) {
        try {
          // If your API has a separate photo upload endpoint
          const newPhotoUrl = await uploadPhoto();
          if (newPhotoUrl) {
            photoUrl = newPhotoUrl;
          }
        } catch (photoError) {
          console.error("Photo upload failed, proceeding with profile update");
          // Continue with profile update even if photo upload fails
        }
      }

      // Create the JSON payload
      const profileData = {
        bio: editedUser.bio || "",
        photo_url: photoUrl || "",
        question1_answer: editedUser.question1_answer || "",
        question2_answer: editedUser.question2_answer || "",
        question3_answer: editedUser.question3_answer || "",
        gender: editedUser.gender || "",
        orientation: editedUser.orientation || "",
        soberstatus: editedUser.soberstatus || "",
      };

      console.log("Sending profile update as JSON:", profileData);

      const response = await fetch(`/api/users/${user.id}`, {
        method: "PATCH",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      });

      // Better error handling - check the response type
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        // If the response is HTML, we'll get the text for debugging
        if (contentType && contentType.indexOf("text/html") !== -1) {
          const htmlError = await response.text();
          console.error("Server returned HTML error:", htmlError);
          throw new Error("Server error - received HTML instead of JSON");
        } else {
          // Try to get JSON error if available
          try {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to save profile");
          } catch (jsonError) {
            throw new Error(
              `Server error (${response.status}): ${response.statusText}`
            );
          }
        }
      }

      // If we got here, the response is OK
      const updatedData = await response.json();
      console.log("Profile updated successfully:", updatedData);
      setUser(updatedData);
      setIsEditing(false);
      setPhotoFile(null);
      setPreviewUrl("");
    } catch (err) {
      console.error("Error saving profile:", err);
      alert("Failed to save profile: " + err.message);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedUser(null);
    setPhotoFile(null);
    setPreviewUrl("");
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

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!user) return <div>User not found</div>;

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
            handleEditProfile={handleEditProfile}
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

            <div>
              <Outlet context={{ user, loggedInUser }} />
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

          {isEditing && editedUser ? (
            <>
              <div className="profile-photo-edit">
                <img
                  src={previewUrl || fallbackImagePath}
                  alt="Profile preview"
                  className="profile-picture"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = fallbackImagePath;
                  }}
                />
                <div className="photo-upload-container">
                  <label htmlFor="profile-photo-upload" className="upload-label">
                    Upload New Photo
                  </label>
                  <input
                    type="file"
                    id="profile-photo-upload"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="file-input"
                  />
                  <p className="upload-hint">
                    Select an image file (JPG, PNG recommended)
                  </p>
                </div>
              </div>

              <div className="edit-profile">
                <label>Bio:</label>
                <textarea
                  value={editedUser.bio}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, bio: e.target.value })
                  }
                  maxLength={300}
                />

                {/* Dropdown for gender */}
                <label>Gender:</label>
                <select
                  value={editedUser.gender}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, gender: e.target.value })
                  }
                >
                  <option value="">Select Gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="non-binary">Non-Binary</option>
                </select>

                {/* Dropdown for orientation */}
                <label>Orientation:</label>
                <select
                  value={editedUser.orientation}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, orientation: e.target.value })
                  }
                >
                  <option value="">Select Orientation</option>
                  <option value="straight">Straight</option>
                  <option value="gay">Gay</option>
                  <option value="bi">Bisexual</option>
                  <option value="pan">Pansexual</option>
                  <option value="aro/ace">Asexual/Aromantic</option>
                </select>

                {/* Dropdown for sober status */}
                <label>Sober Status:</label>
                <select
                  value={editedUser.soberstatus}
                  onChange={(e) =>
                    setEditedUser({ ...editedUser, soberstatus: e.target.value })
                  }
                >
                  <option value="">Select Sober Status</option>
                  <option value="abstinent">Abstinent</option>
                  <option value="sober-curious">Sober-Curious</option>
                  <option value="california-sober">California Sober</option>
                </select>

                <label>
                  <strong>What is your dream concert lineup?</strong>
                </label>
                <textarea
                  value={editedUser.question1_answer}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      question1_answer: e.target.value,
                    })
                  }
                  maxLength={300}
                />
                <label>
                  <strong>
                    What is the best concert you've have ever been to?
                  </strong>
                </label>
                <textarea
                  value={editedUser.question2_answer}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      question2_answer: e.target.value,
                    })
                  }
                  maxLength={300}
                />
                <label>
                  <strong>What is your favorite concert venue?</strong>
                </label>
                <textarea
                  value={editedUser.question3_answer}
                  onChange={(e) =>
                    setEditedUser({
                      ...editedUser,
                      question3_answer: e.target.value,
                    })
                  }
                  maxLength={300}
                />
                <div className="button-group">
                  <button
                    type="button"
                    onClick={handleSaveProfile}
                    className="save-button"
                    disabled={photoUploading}
                  >
                    {photoUploading ? "Uploading..." : "Save Changes"}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="cancel-button"
                    disabled={photoUploading}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <>
              {user.question1_answer && (
                <p>
                  <strong>What is your dream concert lineup?</strong>{" "}
                  {user.question1_answer}
                </p>
              )}
              {user.question2_answer && (
                <p>
                  <strong>
                    What is the best concert you've have ever been to?
                  </strong>{" "}
                  {user.question2_answer}
                </p>
              )}
              {user.question3_answer && (
                <p>
                  <strong>What is your favorite concert venue?</strong>{" "}
                  {user.question3_answer}
                </p>
              )}
            </>
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
