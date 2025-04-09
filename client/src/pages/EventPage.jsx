import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";
import { useOutletContext } from "react-router-dom";

function EventPage() {
  const { id } = useParams();
  const [eventName, setEventName] = useState(""); // Store event name
  const [loggedIn, setLoggedIn] = useState(false);
  const [friends, setFriends] = useState([]);
  const [otherUsers, setOtherUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const { currentUser } = useOutletContext();

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        const response = await fetch(`/api/events/${id}`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        setEventName(data.name || "Event"); // Set event name
      } catch (error) {
        console.error("Error fetching event details:", error);
      }
    };

    const fetchRsvpedUsers = async () => {
      try {
        const response = await fetch(`/api/events/${id}/rsvped-users`, {
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

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

    if (id) {
      fetchEventDetails();
      fetchRsvpedUsers();
    }
  }, [id]);

  // Render user with link to their profile
  const renderUserWithLink = (user) => (
    <Link to={`/users/${user.id}`} className="user-profile-link">
      {user.username}
    </Link>
  );

  return (
    <div>
      <h2>{eventName}</h2> {/* Display event name */}
      <ChatRoom event_id={id} user_id={currentUser?.id || 0} />
      <div>
        {loggedIn ? (
          <>
            <h3>Friends Who RSVPed:</h3>
            {friends.length === 0 ? (
              <p>No friends have RSVPed yet.</p>
            ) : (
              <ul>
                {friends.map((user, index) => (
                  <li key={index}>{renderUserWithLink(user)}</li>
                ))}
              </ul>
            )}

            <h3>Other RSVP'd Users:</h3>
            {otherUsers.length === 0 ? (
              <p>No other users have RSVPed yet.</p>
            ) : (
              <ul>
                {otherUsers.map((user, index) => (
                  <li key={index}>{renderUserWithLink(user)}</li>
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
                  <li key={index}>{renderUserWithLink(user)}</li>
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
