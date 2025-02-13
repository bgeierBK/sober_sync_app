import { useEffect } from "react";
import EventCard from "./EventCard";

function EventContainer({ events, setEvents, currentUser, setCurrentUser }) {
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((events) => {
        setEvents(events);
      });
  }, [setEvents]);

  const mappedEvents = events
    .filter((event) => event.name !== "Unnamed Event")
    .map((event) => (
      <EventCard
        key={event.id}
        event={event}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    ));

  return (
    <>
      <h2>Upcoming Events</h2>
      {mappedEvents}
    </>
  );
}

export default EventContainer;
