import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function EventCard({ event, currentUser, setCurrentUser }) {
  const [message, setMessage] = useState("");
  const [fallbackImage, setFallbackImage] = useState(null);
  const navigate = useNavigate();

  if (!event) {
    return null; // or return a loading state or placeholder
  }

  const isLoggedIn = Boolean(currentUser);
  const isRSVPed =
    isLoggedIn && currentUser?.events?.some((e) => e.id === event.id);

  // Set random fallback image if no photo is provided
  useEffect(() => {
    if (!event.photo) {
      const fallbackImages = [
        "/SoberSync1.png",
        "/SoberSync2.png",
        "/SoberSync3.png",
        "/SoberSync4.png",
        "/SoberSync5.png",
      ];
      const randomIndex = Math.floor(Math.random() * fallbackImages.length);
      setFallbackImage(fallbackImages[randomIndex]);
    }
  }, [event.photo]);

  const handleRSVP = async () => {
    try {
      const response = await fetch(`/api/events/${event.id}/rsvp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        setMessage("RSVP successful!");
        setCurrentUser((prevUser) => ({
          ...prevUser,
          events: [...prevUser.events, event],
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
    <div
      className="card"
      style={{
        display: "flex",
        gap: "16px",
        alignItems: "center",
        marginBottom: "24px",
      }}
    >
      <img
        src={event.photo || fallbackImage}
        alt="Event"
        style={{
          width: "150px",
          height: "150px",
          objectFit: "cover",
          borderRadius: "8px",
        }}
      />
      <div>
        <p>
          <h6 className="title is-6">{event.name}</h6>
        </p>
        <p>{event.date}</p>
        <p>{event.venue_name}</p>
        <div>
          {isLoggedIn ? (
            isRSVPed ? (
              <button onClick={handleCancelRSVP} className="button is-danger">Cancel RSVP</button>
            ) : (
              <button onClick={handleRSVP} className="button is-primary">RSVP</button>
            )
          ) : (
            <button className="button is-primary">Please log in to RSVP</button>
          )}
          <button onClick={() => navigate(`/events/${event.id}`)} className="button is-primary is-light">
            Go to Chat
          </button>
        </div>
        {message && <p>{message}</p>}
      </div>
    </div>
  );
}

export default EventCard;
