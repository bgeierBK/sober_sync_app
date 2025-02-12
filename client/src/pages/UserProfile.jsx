import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";

const UserProfile = () => {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(`/api/users/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to fetch user data");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        setLoading(false);
      })
      .catch((error) => {
        setError(error.message);
        setLoading(false);
      });
  }, [id]);

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  if (!user) return <p>User not found</p>;

  return (
    <div className="user-profile">
      <h2>{user.username}'s Profile</h2>
      <p>Email: {user.email}</p>
      <p>Joined: {new Date(user.created_at).toLocaleDateString()}</p>

      {/* Events RSVPed To */}
      <div className="events-list">
        <h4>Events Attending</h4>
        {user.events && user.events.length > 0 ? (
          <ul>
            {user.events.map((event) => (
              <li key={event.id}>
                <Link to={`/events/${event.id}`}>{event.name}</Link> -{" "}
                {event.date} at {event.venue_name}, {event.city}
              </li>
            ))}
          </ul>
        ) : (
          <p>No events RSVPed to yet</p>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
