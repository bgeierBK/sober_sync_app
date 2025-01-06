import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

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
  return (
    <>
      <h2>This is the event container</h2>
    </>
  );
}

export default EventContainer;
