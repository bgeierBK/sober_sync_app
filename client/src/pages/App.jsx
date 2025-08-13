import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import "../App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);

  // Fetch all users on component mount
  useEffect(() => {
    fetch("/api/users", {
      credentials: "include",
    })
      .then((res) => res.json())
      .then((users) => setUsers(users))
      .catch((error) => console.error("Failed to fetch users:", error));
  }, []);

  // Check session and set the current user
  useEffect(() => {
    check_session()
  }, []);

  function check_session() {
    fetch("/api/check_session", {
      credentials: "include",
    })
      .then((response) => {
        if (response.status === 200) {
          response.json().then((loggedInUser) => setCurrentUser(loggedInUser));
        }
      })
      .catch((error) => console.error("Failed to check session:", error));
  }

  return (
    <>
      <NavBar currentUser={currentUser} setCurrentUser={setCurrentUser} />
      <Outlet context={{ currentUser, setCurrentUser, check_session }} />
      <Footer />
    </>
  );
}

export default App;
