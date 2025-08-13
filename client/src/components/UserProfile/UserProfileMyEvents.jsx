import { useOutletContext, Link } from "react-router-dom";

function UserProfileMyEvents() {
    const { user, loggedInUser } = useOutletContext()
    const today = new Date().toISOString().split("T")[0];
    const upcomingEvents = user.events?.filter((event) => event.date >= today) || [];
    const pastEvents = user.events?.filter((event) => event.date < today) || [];

    console.log("USER:", user)

    return (
        <div>
            <div>
                <h4 className="title is-4">Upcoming Events</h4>
                {upcomingEvents.length > 0 ? (
                    upcomingEvents.map((event) => (
                        <li key={event.id}>
                            <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                            {event.date}
                        </li>
                    ))
                ) : (
                    <p>No upcoming events</p>
                )}
            </div>

            <div>
                <h4 className="title is-4">Past Events</h4>
                {pastEvents.length > 0 ? (
                    <ul>
                        {pastEvents.map((event) => (
                            <li key={event.id}>
                                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                                {event.date}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No past events</p>
                )}
            </div>
        </div>
    );
}

export default UserProfileMyEvents;