import { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../index.css";

// eslint-disable-next-line react/prop-types
function NavBar({ currentUser, setCurrentUser }) {
  const [burgerIsOpen, setBurgerIsOpen] = useState()
  const navigate = useNavigate()

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

  function handleBurgerClick() {
    setBurgerIsOpen(state => !state);
  }

  // Debug currentUser object - you can remove this after fixing the issue
  console.log("Current user in navbar:", currentUser);

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-brand">
        <NavLink className="navbar-item" to="/">
          <div style={{ backgroundColor: "orange", padding: 10 }}>
            <img src="https://images.squarespace-cdn.com/content/v1/67707a331f124554f5f908e0/8f58670c-c317-4a66-bb5b-66deaae5b52a/sober-sync-logo-files-logo-mark-white-rgb-900px-w-300ppi.png" />
          </div>
        </NavLink>
        <NavLink className="navbar-item" to="/">
          <h1 class="title is-4">
            SOBER SYNC
          </h1>
        </NavLink>
        <button
          role="button"
          className={burgerIsOpen ? "navbar-burger is-active" : "navbar-burger"}
          aria-label="menu"
          aria-expanded="false"
          data-target="navbarBasicExample"
          onClick={handleBurgerClick}
        >
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
          <span aria-hidden="true"></span>
        </button>
      </div>

      {currentUser == null ? (

        <div id="menu" className={burgerIsOpen ? "navbar-menu is-active" : "navbar-menu"} >
          <div className="navbar-end">
            <div className="navbar-item">
              <NavLink to="/about" className="navbar-item" onClick={handleBurgerClick}>
                About
              </NavLink>
            </div>
            <div className="navbar-item">
              <NavLink to="/" className="navbar-item" onClick={handleBurgerClick}>
                Events
              </NavLink>
            </div>
            <div className="navbar-item">
              <NavLink to="/signup" className="button is-light" onClick={handleBurgerClick}>
                Sign up
              </NavLink>
            </div>
            <div className="navbar-item">
              <NavLink to="/login" className="button is-light" onClick={handleBurgerClick}>
                Log in
              </NavLink>
            </div>
          </div>
        </div>
      ) : (

        <div id="menu" className={burgerIsOpen ? "navbar-menu is-active" : "navbar-menu"} >
          <div className="navbar-start">
            <NavLink to="/" className="navbar-item" onClick={handleBurgerClick}>
              Home
            </NavLink>
            <NavLink className="navbar-item"
              to={
                currentUser && currentUser.id
                  ? `/users/${currentUser.id}`
                  : "/profile"
              }
              onClick={handleBurgerClick}
            >
              My Profile
            </NavLink>
            <NavLink to="/thelounge" className="navbar-item" onClick={handleBurgerClick}>
              The Lounge
            </NavLink>
            <NavLink to="/about" className="navbar-item"  onClick={handleBurgerClick}>
              About
            </NavLink>
          </div>
          <div className="navbar-end">
            <div className="navbar-item">
              <div className="navbar-item">
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