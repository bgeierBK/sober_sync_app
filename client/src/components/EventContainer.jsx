import { useEffect } from "react";
import EventCard from "./EventCard";

function EventContainer({ events, setEvents, currentUser, setCurrentUser }) {
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((events) => {
        const now = new Date();
        const oneWeekFromNow = new Date();
        oneWeekFromNow.setDate(now.getDate() + 7);

        const upcomingWeek = [];
        const future = [];

        events.forEach((event) => {
          const eventDate = new Date(event.date);
          if (eventDate >= now && eventDate <= oneWeekFromNow) {
            upcomingWeek.push(event);
          } else if (eventDate > oneWeekFromNow) {
            future.push(event);
          }
        });

        // Sort both arrays ascending (soonest first)
        upcomingWeek.sort((a, b) => new Date(a.date) - new Date(b.date));
        future.sort((a, b) => new Date(a.date) - new Date(b.date));

        setEvents([...upcomingWeek, ...future]);
      })
      .catch((err) => console.error("Error fetching events:", err));
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
    <div className="columns is-centered">
    <div className="column is-half">
      <h2 className="title is-5">Upcoming Events</h2>
      {mappedEvents}
    </div>
    </div>
  );
}

export default EventContainer;
