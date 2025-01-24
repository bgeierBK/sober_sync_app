import "../App.css";
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useOutletContext } from "react-router-dom";

function UserProfile() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetch(`http://localhost:5550/api/users/${id}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        setUser(data);
        setEvents(data.events);
        console.log(data.events);
        setLoading(false);
      })
      .catch((error) => {
        setError(error);
        setLoading(false);
      });
  }, [id]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }
  console.log(user);

  return (
    <>
      <h3>{user.username}</h3>
      <h4>{user.sober_status}</h4>
      <h4>{user.gender}</h4>
      <h4>{user.orientation}</h4>
    </>
  );
}

export default UserProfile;
