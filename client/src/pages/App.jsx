import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";

import "../App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [users, setUsers] = useState([]);

  // Fetch all users on component mount
  useEffect(() => {
    fetch("/api/users", {
      credentials: "include", // Include credentials (cookies) in the request
    })
      .then((res) => res.json())
      .then((users) => setUsers(users))
      .catch((error) => console.error("Failed to fetch users:", error));
  }, []);

  // Check session and set the current user
  useEffect(() => {
    fetch("/api/check_session", {
      credentials: "include", // Ensure credentials are included (cookies)
    })
      .then((response) => {
        if (response.status === 200) {
          response.json().then((loggedInUser) => setCurrentUser(loggedInUser));
        }
      })
      .catch((error) => console.error("Failed to check session:", error));
  }, []);

  return (
    <>
      <NavBar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <h2>Sober Sync</h2>
      <Outlet
        context={{ currentUser: currentUser, setCurrentUser: setCurrentUser }}
      />
    </>
  );
}

export default App;
