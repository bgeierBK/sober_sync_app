import { useState } from "react";
import { NavLink } from "react-router-dom";
import "../index.css";

// eslint-disable-next-line react/prop-types
function NavBar({ currentUser, setCurrentUser }) {
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
        } else {
          alert("failed to log out");
        }
      })
      .catch((error) => {
        console.error("Problem with logout:", error.message);
        alert("Problem with logout:" + error.message);
      });
  }

  return (
    <nav className="bg-blue-500 text-slate-200">
      {currentUser == null ? (
        <div className="flex justify-end space-x-2">
          <NavLink to="/" className="navlink">
            Home
          </NavLink>
          <NavLink
            to="/signup"
            className="navlink bg-slate-200 hover:bg-gray-200 text-blue-500 font-semibold py-2 px-4 border border-blue-500 rounded"
          >
            Signup
          </NavLink>
          <NavLink
            to="/login"
            className="navlink bg-slate-200 hover:bg-gray-200 text-blue-500 font-semibold py-2 px-4 border border-blue-500 rounded"
          >
            Login``
          </NavLink>
        </div>
      ) : (
        <div className="flex justify-end space-x-2">
          <NavLink to="/" className="navlink">
            Home
          </NavLink>
          <NavLink to={`/users/${currentUser.id}`} className="navlink">
            My Profile
          </NavLink>
          <NavLink to="/about" className="navlink">
            About
          </NavLink>
          <button
            className="navlink bg-slate-200 hover:bg-gray-200 text-blue-500 font-semibold py-2 px-4 border border-blue-500 rounded"
            onClick={handleLogOut}
          >
            Log Out
          </button>
        </div>
      )}
    </nav>
  );
}

export default NavBar;
