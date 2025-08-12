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
            <section class="section is-medium">
                <div class="columns is-8">
                    <div class="column">
                        <h2 class="title is-2">Creating sober spaces everywhere for everyone</h2>
                        <div class="buttons are-medium">
                            <NavLink to="/login" className="button is-primary is-rounded">
                                Log In
                            </NavLink>
                            <NavLink to="/signup" className="button is-primary is-rounded is-outlined">
                                Sign Up
                            </NavLink>
                        </div>
                    </div>
                    <container class="image is-5by3 column">
                        <img src="https://bulma.io/assets/images/placeholders/128x128.png" />
                    </container>
                </div>
            </section>
            <section class="hero is-medium is-primary">
                <div class="hero-body columns is-8">
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
                </div>
            </section>
            <EventContainer
                events={events}
                setEvents={setEvents}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
            />
            <div className="section is-small is-flex is-justify-content-center">
                <div className="field">
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
            <section className="footer is-flex is-justify-content-space-between">
                <p className="has-text-white">© 2025 Sober Sync. All rights reserved.</p>
                {/* TODO: add links to terms, privacy policy, cookie settings */}
                {/* <p className="has-text-white">Links go here</p> */}
            </section>
        </>
    );
}

export default LoggedOutHome;
