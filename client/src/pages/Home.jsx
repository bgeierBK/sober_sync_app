import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventContainer from "../components/EventContainer";

function Home() {
  const { currentUser, setCurrentUser } = useOutletContext();
  const [events, setEvents] = useState([]);

  return (
    <>
      <EventContainer
        events={events}
        setEvents={setEvents}
        currentUser={currentUser}
        setCurrentUser={setCurrentUser}
      />
    </>
  );
}

export default Home;
