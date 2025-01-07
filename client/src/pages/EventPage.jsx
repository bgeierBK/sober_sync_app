import React from "react";
import { useParams } from "react-router-dom";
import ChatRoom from "../components/ChatRoom";

function EventPage() {
  const { eventId } = useParams(); // Get eventId from the URL
  const username = "YourUsername"; // Replace with the logged-in username (can fetch from session/context)

  return (
    <div>
      <h2>Welcome to the Event Page</h2>
      <ChatRoom eventId={eventId} username={username} />
    </div>
  );
}

export default EventPage;
