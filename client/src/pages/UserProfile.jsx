import "../App.css";
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./ModalStyles.css"; // Import the styles (we'll create this next)

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

  // New state for DM modal and message
  const [isDmModalOpen, setIsDmModalOpen] = useState(false);
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  const fallbackImagePath = "/blank_profile.webp";
  const today = new Date().toISOString().split("T")[0];

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

  // Direct Message Modal functions
  const openDmModal = () => {
    setIsDmModalOpen(true);
  };

  const closeDmModal = () => {
    setIsDmModalOpen(false);
    setMessageText("");
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    setSendingMessage(true);
    try {
      // Using the socketio endpoint from your routes
      const response = await fetch("/api/direct-messages", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sender_id: loggedInUser.id,
          receiver_id: userId,
          message: messageText,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }

      // Message sent successfully
      closeDmModal();
      alert("Message sent successfully!");
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Failed to send message: " + error.message);
    } finally {
      setSendingMessage(false);
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
  const upcomingEvents =
    user.events?.filter((event) => event.date >= today) || [];
  const pastEvents = user.events?.filter((event) => event.date < today) || [];

  return (
    <div className="user-profile">
      {/* Profile Header with Username */}
      <div className="profile-header">
        <h3>{user.username}</h3>

        {/* Messaging section with conditional rendering based on user context */}
        {loggedInUser && (
          <div className="messages-section">
            {/* Show "My Messages" when viewing own profile */}
            {loggedInUser.id === user.id && (
              <Link to={`/messages/${userId}`} className="message-button">
                My Messages
              </Link>
            )}

            {/* Show "Message User" button when viewing someone else's profile */}
            {loggedInUser.id !== user.id && (
              <div className="message-actions">
                <button
                  onClick={handleViewConversation}
                  className="message-button"
                >
                  View Conversation
                </button>
                <button onClick={openDmModal} className="send-dm-button">
                  Send Quick Message
                </button>
              </div>
            )}
          </div>
        )}
      </div>

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
          <img
            src={user.photo_url || fallbackImagePath}
            alt={`${user.username}'s profile`}
            className="profile-picture"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = fallbackImagePath;
            }}
          />

          <p>
            <strong>Bio:</strong> {user.bio || "No bio available"}
          </p>

          {/* Display gender, orientation, and sober status if available */}
          <div className="user-details">
            {user.gender && (
              <p>
                <strong>Gender:</strong> {getDisplayText("gender", user.gender)}
              </p>
            )}

            {user.orientation && (
              <p>
                <strong>Orientation:</strong>{" "}
                {getDisplayText("orientation", user.orientation)}
              </p>
            )}

            {user.soberstatus && (
              <p>
                <strong>Sober Status:</strong>{" "}
                {getDisplayText("soberstatus", user.soberstatus)}
              </p>
            )}
          </div>

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
      {loggedInUser &&
        loggedInUser.id !== user.id &&
        !isFriends &&
        !friendRequestSent && (
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
      <div className="events-list">
        <h4>Upcoming Events</h4>
        {upcomingEvents.length > 0 ? (
          <ul>
            {upcomingEvents.map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                {event.date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No upcoming events</p>
        )}
      </div>

      <div className="events-list">
        <h4>Past Events</h4>
        {pastEvents.length > 0 ? (
          <ul>
            {pastEvents.map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                {event.date}
              </li>
            ))}
          </ul>
        ) : (
          <p>No past events</p>
        )}
      </div>

      {/* DM Modal */}
      {isDmModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h4>Send Message to {user.username}</h4>
              <button onClick={closeDmModal} className="close-modal">
                ×
              </button>
            </div>
            <div className="modal-body">
              <textarea
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Write your message here..."
                rows={5}
                className="message-input"
              />
            </div>
            <div className="modal-footer">
              <button
                onClick={handleSendMessage}
                className="send-button"
                disabled={sendingMessage || !messageText.trim()}
              >
                {sendingMessage ? "Sending..." : "Send Message"}
              </button>
              <button onClick={closeDmModal} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
