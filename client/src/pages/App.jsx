import { Outlet, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import NavBar from "../components/NavBar";
import Footer from "../components/Footer";
import "../App.css";

function App() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [burgerIsOpen, setBurgerIsOpen] = useState()

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

  // Handle logout
  function handleLogOut() {
    fetch("/api/logout", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    })
      .then((response) => {
        if (response.ok) {
          setCurrentUser(null);
          alert("Logged out successfully!");
          navigate("/");
        } else {
          alert("failed to log out");
        }
      })
      .catch((error) => {
        console.error("Problem with logout:", error.message);
        alert("Problem with logout:" + error.message);
      });
    setBurgerIsOpen(state => false)
  }

  // Check session
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
      <NavBar 
        currentUser={currentUser} 
        setCurrentUser={setCurrentUser} 
        burgerIsOpen={burgerIsOpen} 
        setBurgerIsOpen={setBurgerIsOpen} 
      />
      <Outlet context={{ currentUser, setCurrentUser, check_session, handleLogOut }} />
      <Footer />
    </>
  );
}

export default App;
