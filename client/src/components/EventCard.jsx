/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

function EventCard({ event }) {
  const [message, setMessage] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isRSVPed, setIsRSVPed] = useState(false);
  const navigate = useNavigate();

  // Function to fetch user data and update RSVP status
  const fetchUserData = async () => {
    try {
      const res = await fetch("/api/me", { credentials: "include" });
      const data = await res.json();

      if (data && !data.error) {
        setIsLoggedIn(true);

        // Check if events exists and if it's an array before using .some()
        if (Array.isArray(data.events)) {
          // Check if user has already RSVPed to this event
          setIsRSVPed(data.events.some((e) => e.id === event.id));
        } else {
          setIsRSVPed(false); // Default to false if events is not an array
        }
      } else {
        setIsLoggedIn(false);
        setIsRSVPed(false);
      }
    } catch (err) {
      console.error("Error fetching user:", err);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [event.id]); // Re-fetch when event changes

  const handleRSVP = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        setMessage("RSVP successful!");
        fetchUserData(); // Re-fetch user data to update RSVP status
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to RSVP");
      }
    } catch (error) {
      console.error("Error during RSVP:", error);
      setMessage("An error occurred.");
    }
  };

  const handleCancelRSVP = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/cancel_rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        setMessage("RSVP canceled.");
        fetchUserData(); // Re-fetch user data to update RSVP status
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to cancel RSVP");
      }
    } catch (error) {
      console.error("Error canceling RSVP:", error);
      setMessage("An error occurred.");
    }
  };

  const handleGoToChat = () => {
    navigate(`/events/${event.id}`);
  };

  return (
    <>
      <p>{event.name}</p>
      <p>{event.date}</p>
      <p>{event.venue_name}</p>
      <div>
        {isLoggedIn ? (
          isRSVPed ? (
            <button onClick={handleCancelRSVP}>Cancel RSVP</button>
          ) : (
            <button onClick={handleRSVP}>RSVP</button>
          )
        ) : (
          <p>Please log in to RSVP</p>
        )}
        <button onClick={handleGoToChat}>Go to Chat</button>
      </div>
      {message && <p>{message}</p>}
    </>
  );
}

export default EventCard;
