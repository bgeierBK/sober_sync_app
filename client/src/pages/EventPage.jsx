import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";
import { useOutletContext } from "react-router-dom";

function EventPage() {
  const { id } = useParams();
  const [eventName, setEventName] = useState("");
  const [loggedIn, setLoggedIn] = useState(false);
  const [friends, setFriends] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const { currentUser } = useOutletContext();
  const [isRsvped, setIsRsvped] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [eventPhotos, setEventPhotos] = useState([]);

  // Styles
  const styles = {
    eventPage: {
      maxWidth: "1000px",
      margin: "0 auto",
      padding: "20px",
    },
    photoSection: {
      margin: "30px 0",
    },
    uploadContainer: {
      marginBottom: "20px",
      padding: "15px",
      backgroundColor: "#f9f9f9",
      borderRadius: "8px",
    },
    formGroup: {
      marginBottom: "15px",
    },
    label: {
      display: "block",
      marginBottom: "5px",
      fontWeight: "500",
    },
    uploadBtn: {
      padding: "8px 16px",
      backgroundColor: "#4a90e2",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "pointer",
      fontSize: "14px",
    },
    uploadBtnDisabled: {
      padding: "8px 16px",
      backgroundColor: "#cccccc",
      color: "white",
      border: "none",
      borderRadius: "4px",
      cursor: "not-allowed",
      fontSize: "14px",
    },
    photosGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
      gap: "15px",
      marginTop: "20px",
    },
    photoItem: {
      borderRadius: "8px",
      overflow: "hidden",
      boxShadow: "0 2px 5px rgba(0, 0, 0, 0.1)",
    },
    eventPhoto: {
      width: "100%",
      height: "200px",
      objectFit: "cover",
      display: "block",
    },
    userSection: {
      marginTop: "30px",
    },
    userLink: {
      color: "#4a90e2",
      textDecoration: "none",
    },
  };

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/events/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setEventName(data.name || "Event");
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    const fetchRsvpStatus = async () => {
      if (currentUser?.id) {
        try {
          const response = await fetch(`/api/events/${id}/rsvp-status`, {
            credentials: "include",
          });

          if (response.ok) {
            const data = await response.json();
            setIsRsvped(data.is_rsvped);
          }
        } catch (error) {
          console.error("Error checking RSVP status:", error);
        }
      }
    };

    const fetchRsvpedUsers = async () => {
      try {
        const response = await fetch(`/api/events/${id}/rsvped-users`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        if (data.all_users) {
          setAllUsers(data.all_users);
          setLoggedIn(false);
        } else {
          setFriends(data.friends || []);
          setOtherUsers(data.others || []);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Error fetching RSVPed users:", error);
      }
    };

    const fetchEventPhotos = async () => {
      try {
        const response = await fetch(`/api/events/${id}/photos`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setEventPhotos(data);
      } catch (error) {
        console.error("Error fetching event photos:", error);
      }
    };

    if (id) {
      fetchEventDetails();
      fetchRsvpedUsers();
      fetchEventPhotos();
      if (currentUser?.id) {
        fetchRsvpStatus();
      }
    }
  }, [id, currentUser?.id]);

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    setUploadingPhoto(true);

    const formData = new FormData();
    formData.append("image", e.target.image.files[0]);

    try {
      const response = await fetch(`/api/events/${id}/photos`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Add the new photo to the list
      setEventPhotos((prevPhotos) => [...prevPhotos, data.photo]);

      // Reset the form
      e.target.reset();
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Failed to upload photo. Please try again.");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Render user with link to their profile
  const renderUserWithLink = (user) => (
    <Link to={`/users/${user.id}`} style={styles.userLink}>
      {user.username}
    </Link>
  );

  return (
    <div style={styles.eventPage}>
      <h2>{eventName}</h2>

      <ChatRoom event_id={id} user_id={currentUser?.id || 0} />

      {/* Event Photos Section */}
      <div style={styles.photoSection}>
        <h3>Event Photos</h3>

        {isRsvped && currentUser?.id && (
          <div style={styles.uploadContainer}>
            <form onSubmit={handlePhotoUpload}>
              <div style={styles.formGroup}>
                <label style={styles.label} htmlFor="photo-upload">
                  Add a photo:
                </label>
                <input
                  type="file"
                  id="photo-upload"
                  name="image"
                  accept="image/*"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={uploadingPhoto}
                style={
                  uploadingPhoto ? styles.uploadBtnDisabled : styles.uploadBtn
                }
              >
                {uploadingPhoto ? "Uploading..." : "Upload Photo"}
              </button>
            </form>
          </div>
        )}

        <div>
          {eventPhotos.length === 0 ? (
            <p>No photos uploaded yet.</p>
          ) : (
            <div style={styles.photosGrid}>
              {eventPhotos.map((photo, index) => (
                <div key={index} style={styles.photoItem}>
                  <img
                    src={photo.url}
                    alt={`Event photo ${index + 1}`}
                    style={styles.eventPhoto}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* RSVP'd Users Section */}
      <div style={styles.userSection}>
        {loggedIn ? (
          <>
            <h3>Friends Who RSVPed:</h3>
            {friends.length === 0 ? (
              <p>No friends have RSVPed yet.</p>
            ) : (
              <ul>
                {friends.map((user, index) => (
                  <li key={index}>{renderUserWithLink(user)}</li>
                ))}
              </ul>
            )}

            <h3>Other RSVP'd Users:</h3>
            {otherUsers.length === 0 ? (
              <p>No other users have RSVPed yet.</p>
            ) : (
              <ul>
                {otherUsers.map((user, index) => (
                  <li key={index}>{renderUserWithLink(user)}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h3>RSVP'd Users:</h3>
            {allUsers.length === 0 ? (
              <p>No users have RSVPed yet.</p>
            ) : (
              <ul>
                {allUsers.map((user, index) => (
                  <li key={index}>{renderUserWithLink(user)}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventPage;
