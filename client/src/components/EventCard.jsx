import { useState } from "react";
import { useNavigate } from "react-router-dom";

function EventCard({ event, currentUser, setCurrentUser }) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const isLoggedIn = Boolean(currentUser);
  const isRSVPed =
    isLoggedIn && currentUser?.events?.some((e) => e.id === event.id);

  const handleRSVP = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        setMessage("RSVP successful!");

        // Update currentUser with the new RSVP event
        setCurrentUser((prevUser) => ({
          ...prevUser,
          events: [...prevUser.events, event], // Add event to user's RSVP list
        }));
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

        // Update currentUser by removing the event from RSVP list
        setCurrentUser((prevUser) => ({
          ...prevUser,
          events: prevUser.events.filter((e) => e.id !== event.id),
        }));
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to cancel RSVP");
      }
    } catch (error) {
      console.error("Error canceling RSVP:", error);
      setMessage("An error occurred.");
    }
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
        <button onClick={() => navigate(`/events/${event.id}`)}>
          Go to Chat
        </button>
      </div>
      {message && <p>{message}</p>}
    </>
  );
}

export default EventCard;
