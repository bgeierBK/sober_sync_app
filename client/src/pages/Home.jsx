import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventContainer from "../components/EventContainer";

function Home() {
  const [events, setEvents] = useState([]);
  return (
    <>
      <EventContainer events={events} setEvents={setEvents} />
    </>
  );
}

export default Home;
