/* eslint-disable react/prop-types */
import { useState } from "react";
import { useNavigate } from "react-router-dom";

function EventCard({ events, setEvents, event }) {
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRSVP = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // Include cookies in the request
      });

      if (response.ok) {
        const data = await response.json();
        setMessage("RSVP successful!");
        console.log(data);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to RSVP");
      }
    } catch (error) {
      console.error("Error during RSVP:", error);
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
        <button onClick={handleRSVP}>RSVP</button>
        <button onClick={handleGoToChat}>Go to Chat</button>
      </div>
      {message && <p>{message}</p>}
    </>
  );
}

export default EventCard;
