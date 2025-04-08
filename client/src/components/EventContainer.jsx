import { useEffect } from "react";
import EventCard from "./EventCard";

function EventContainer({ events, setEvents, currentUser, setCurrentUser }) {
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((events) => {
        // Sort events by date in descending order (most recent first)
        const sortedEvents = events.sort(
          (a, b) => new Date(b.date) - new Date(a.date)
        );
        setEvents(sortedEvents);
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
  console.log("event container mounted");
  return (
    <>
      <h2>Upcoming Events</h2>
      {mappedEvents}
    </>
  );
}

export default EventContainer;
