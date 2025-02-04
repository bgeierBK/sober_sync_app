import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";

function EventPage() {
  const { eventId } = useParams();
  const [loggedIn, setLoggedIn] = useState(false);
  const [friends, setFriends] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  useEffect(() => {
    const fetchRsvpedUsers = async () => {
      try {
        const response = await fetch(`/api/events/${eventId}/rsvped-users`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // If the user is not logged in, set all users under a single list
        if (data.all_users) {
          setAllUsers(data.all_users);
          setLoggedIn(false);
        } else {
          setFriends(data.friends || []);
          setOtherUsers(data.others || []);
          setLoggedIn(true);
        }
      } catch (error) {
        console.error("Error fetching RSVPed users:", error);
      }
    };

    if (eventId) {
      fetchRsvpedUsers();
    }
  }, [eventId]);

  return (
    <div>
      <h2>Welcome to the Event Page</h2>

      {/* Chat Room */}
      {loggedIn && <ChatRoom eventId={eventId} />}

      {/* RSVPed Users Section */}
      <div>
        {loggedIn ? (
          <>
            <h3>Friends Who RSVPed:</h3>
            {friends.length === 0 ? (
              <p>No friends have RSVPed yet.</p>
            ) : (
              <ul>
                {friends.map((user, index) => (
                  <li key={index}>{user.username}</li>
                ))}
              </ul>
            )}

            <h3>Other RSVP'd Users:</h3>
            {otherUsers.length === 0 ? (
              <p>No other users have RSVPed yet.</p>
            ) : (
              <ul>
                {otherUsers.map((user, index) => (
                  <li key={index}>{user.username}</li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <h3>RSVP'd Users:</h3>
            {allUsers.length === 0 ? (
              <p>No users have RSVPed yet.</p>
            ) : (
              <ul>
                {allUsers.map((user, index) => (
                  <li key={index}>{user.username}</li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default EventPage;
