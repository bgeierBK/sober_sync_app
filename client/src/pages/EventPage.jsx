import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";

function EventPage() {
  const { eventId } = useParams(); // Get eventId from the URL
  const username = "YourUsername"; // Replace with the logged-in username (can fetch from session/context)

  const [rsvpedUsers, setRsvpedUsers] = useState([]);

  useEffect(() => {
    // Fetch RSVPed users from the API (this is a mock fetch, replace with your actual API call)
    const fetchRsvpedUsers = async () => {
      try {
        // Replace with actual API call
        const response = await fetch(`/api/events/${eventId}/rsvped-users`);
        const data = await response.json();
        setRsvpedUsers(data.users); // Assuming the response has an array of users
      } catch (error) {
        console.error("Error fetching RSVPed users:", error);
      }
    };

    fetchRsvpedUsers();
  }, [eventId]);

  return (
    <div>
      <h2>Welcome to the Event Page</h2>

      {/* Chat Room */}

      <ChatRoom eventId={eventId} username={username} />

      {/* RSVPed Users List */}
      <div>
        <h3>RSVP'd Users:</h3>
        {rsvpedUsers.length === 0 ? (
          <p>No users have RSVPed yet.</p>
        ) : (
          <ul>
            {rsvpedUsers.map((user, index) => (
              <li key={index}>{user.username}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default EventPage;
