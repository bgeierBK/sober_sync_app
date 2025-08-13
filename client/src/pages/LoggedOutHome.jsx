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
            <section className="section is-medium">
                <div className="columns is-8">
                    <div className="column">
                        <h2 className="title is-2">Creating sober spaces everywhere for everyone</h2>
                        <div className="buttons are-medium">
                            <NavLink to="/login" className="button is-primary is-rounded" style={{ color: "white " }}>
                                Log In
                            </NavLink>
                            <NavLink to="/signup" className="button is-primary is-rounded is-outlined">
                                Sign Up
                            </NavLink>
                        </div>
                    </div>
                    <div className="container column">
                        <figure className="image is-5by3">
                            <img src="/HomePhoto.jpg" alt="Festival audience" />
                        </figure>
                    </div>
                </div>
            </section>
            <section className="hero is-medium is-primary">
                <div className="hero-body columns is-8">
                    <div className="container column">
                        <h3 className="title is-3 is-spaced">
                            Find events
                        </h3>
                        <h4 className="subtitle is-4">
                            Discover unforgettable shows and festivals
                        </h4>
                    </div>
                    <div className="container column">
                        <h3 className="title is-3 is-spaced">
                            Get connected
                        </h3>
                        <h4 className="subtitle is-4">
                            Meet like-minded sober music lovers
                        </h4>
                    </div>
                    <div className="container column">
                        <h3 className="title is-3 is-spaced">
                            Don't go it alone
                        </h3>
                        <h4 className="subtitle is-4">
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
        </>
    );
}

export default LoggedOutHome;
