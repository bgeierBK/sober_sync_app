import { useState, useEffect } from "react";
import { NavLink, useOutletContext } from "react-router-dom";
import EventContainer from "../components/EventContainer";

function LoggedOutHome() {
    const { currentUser, setCurrentUser } = useOutletContext();
    const [events, setEvents] = useState([]);
    const [fullName, setFullName] = useState([]);
    const [email, setEmail] = useState([]);

    function handleSubmit() {
        // TODO: Make email list signup work!
        alert("This is a placeholder for email list signup.")
    }

    return (
        <>
            <section class="hero is-primary is-medium">
                <div class="hero-body columns">
                    <div class="column">
                        <h2 class="title is-2">Creating sober-friendly spaces for everyone, everywhere</h2>
                        <div class="buttons are-large">
                            <NavLink to="/login" className="button is-link">
                                Log in
                            </NavLink>
                            <NavLink to="/signup" className="button is-white">
                                Sign up
                            </NavLink>
                        </div>
                    </div>
                    <container class="image is-5by3 column">
                        <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
                    </container>
                </div>
            </section>
            <section class="section is-small columns">
                <div class="container column">
                    <h3 class="title is-3 is-spaced">
                        Find events
                    </h3>
                    <h4 class="subtitle is-4">
                        Discover unforgettable shows and festivals
                    </h4>
                </div>
                <div class="container column">
                    <h3 class="title is-3 is-spaced">
                        Get connected
                    </h3>
                    <h4 class="subtitle is-4">
                        Meet like-minded sober music lovers
                    </h4>
                </div>
                <div class="container column">
                    <h3 class="title is-3 is-spaced">
                        Don't go it alone
                    </h3>
                    <h4 class="subtitle is-4">
                        Build a safety net of peer support
                    </h4>
                </div>
            </section>
            <EventContainer
                events={events}
                setEvents={setEvents}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            <section className="footer is-flex is-justify-content-center">
                <div className="field">
                    <div className="box is-flex-direction-columns" style={{ maxWidth: 500 }}>
                        <h3 className="title is-3 has-text-centered">Stay up to date on Sober Sync news</h3>
                        <form
                            onSubmit={handleSubmit}
                            className="field"
                        >
                            <div className="field">
                                <label className="label">
                                    Full Name
                                </label>
                                <input
                                    type="text"
                                    name="full-name"
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="Full Name"
                                    value={fullName}
                                    className="input"
                                />
                            </div>
                            <div className="field">
                                <label className="label">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Email"
                                    value={email}
                                    className="input"
                                />
                            </div>
                            <input type="submit" value="Submit" className="button is-primary" />
                        </form>
                    </div>
                </div>
            </section>
        </>
    );
}

export default LoggedOutHome;
