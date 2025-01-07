import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";

function EventCard({ events, setEvent, event }) {
  return (
    <>
      <p>{event.name}</p>
      <p>{event.date}</p>
      <p>{event.venue_name}</p>
      <div>
        <button>RSVP</button>
        <button>Go to Chat</button>
      </div>
    </>
  );
}

export default EventCard;
