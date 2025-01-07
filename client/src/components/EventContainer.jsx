import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventCard from "./EventCard";

// eslint-disable-next-line react/prop-types
function EventContainer({ events, setEvents }) {
  useEffect(() => {
    fetch("http://localhost:5550/api/events")
      .then((res) => res.json())
      .then((events) => {
        setEvents(events);
      });
  }, [setEvents]);

  console.log(events);

  const mappedEvents = events.map((event) => {
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
      <h2>This is the event container</h2>
      {mappedEvents}
    </>
  );
}

export default EventContainer;
