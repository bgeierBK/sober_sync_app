import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventCard from "./EventCard";

// eslint-disable-next-line react/prop-types
function EventContainer({ events, setEvents }) {
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((events) => {
        setEvents(events);
      });
  }, [setEvents]);

  const mappedEvents = events
    // eslint-disable-next-line react/prop-types
    .filter((event) => event.name !== "Unnamed Event")
    .map((event) => {
      return (
        <EventCard
          key={event.id}
          events={events}
          setEvents={setEvents}
          event={event}
        />
      );
    });

  return (
    <>
      <h2>Upcoming Events</h2>
      {mappedEvents}
    </>
  );
}

export default EventContainer;
