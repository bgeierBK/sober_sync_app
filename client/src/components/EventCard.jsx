import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import { Link } from "react-router-dom";

function EventCard({ events, setEvent, event }) {
  return <h2>{event.name}</h2>;
}

export default EventCard;
