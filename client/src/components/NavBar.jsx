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

  // Debug currentUser object - you can remove this after fixing the issue
  console.log("Current user in navbar:", currentUser);

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <NavLink className="navbar-item" to="/">
          <img src="https://images.squarespace-cdn.com/content/v1/67707a331f124554f5f908e0/8f58670c-c317-4a66-bb5b-66deaae5b52a/sober-sync-logo-files-logo-mark-white-rgb-900px-w-300ppi.png" />
        </NavLink>
        <NavLink className="navbar-item" to="/">
        <h1 class="title is-4">
        SOBER SYNC
        </h1>
        </NavLink>

        <NavLink role="button" className="navbar-burger" aria-label="menu" aria-expanded="false" data-target="navbarBasicExample">
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </NavLink>
      </div>

      {currentUser == null ? (

        <div id="navbarBasicExample" className="navbar-menu">
            <div className="navbar-end">
              <div className="navbar-item">
                <div className="buttons">
                  <NavLink to="/signup" className="button is-primary">
                    <strong>Sign up</strong>
                  </NavLink>
                  <NavLink to="/login" className="button is-light">
                    Log in
                  </NavLink>
                </div>
              </div>
            </div>
        </div>
      ) : (

        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-start">
            <NavLink to="/" className="navbar-item">
              Home
            </NavLink>
            <NavLink className="navbar-item"
              to={
                currentUser && currentUser.id
                  ? `/users/${currentUser.id}`
                  : "/profile"
              }>
              My Profile
            </NavLink>
            <NavLink to="/thelounge" className="navbar-item">
              The Lounge
            </NavLink>
            <NavLink to="/about" className="navbar-item">
              About
            </NavLink>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="buttons">
                <button onClick={handleLogOut} className="button is-light">
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default NavBar;