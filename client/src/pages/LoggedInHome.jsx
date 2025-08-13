import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventContainer from "../components/EventContainer";

function LoggedInHome() {
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

export default LoggedInHome;
