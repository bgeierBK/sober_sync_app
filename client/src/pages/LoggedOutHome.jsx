import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventContainer from "../components/EventContainer";

function LoggedOutHome() {
    const { currentUser, setCurrentUser } = useOutletContext();
    const [events, setEvents] = useState([]);

    return (
        <>
            <section class="hero is-primary is-medium">
                <div class="hero-body columns">
                    <div class="column">
                        <h2 class="title is-2">Creating sober-friendly spaces for everyone, everywhere</h2>
                    </div>
                    <container class="image is-5by3 column">
                        <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
                    </container>
                </div>
            </section>
            <EventContainer
                events={events}
                setEvents={setEvents}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
        </>
    );
}

export default LoggedOutHome;
