import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";

import "../App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5550/api/users")
      .then((res) => res.json())
      .then((users) => setUsers(users));
  }, []);

  useEffect(() => {
    fetch("/api/check_session").then((response) => {
      if (response.status === 200) {
        response.json().then((loggedInUser) => setCurrentUser(loggedInUser));
      }
    });
  }, []);

  console.log(currentUser);
  console.log(users);

  return (
    <>
      <h2>Sober Sync</h2>
      <Outlet
        context={{ currentUser: currentUser, setCurrentUser: setCurrentUser }}
      />
    </>
  );
}

export default App;
