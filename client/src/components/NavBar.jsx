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

  return (
    <nav className="navbar" role="navigation" aria-label="main navigation" style={{ padding: "15px 30px" }}>
      <div className="navbar-brand">
        <NavLink to="/" style={{ width: "150px", height: "80px", padding: "15px" }} >
          <figure className="image" >
            <img src="/Logo.png" />
          </figure>
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

      <div id="menu" className={burgerIsOpen ? "navbar-menu is-active" : "navbar-menu"} >
        <div className="navbar-end">
          <div className="navbar-item">
            <NavLink to="/" className="navbar-item" onClick={handleBurgerClick}>
              Discover
            </NavLink>
          </div>
          <div className="navbar-item">
            <NavLink to="/" className="navbar-item" onClick={handleBurgerClick}>
              Connections
            </NavLink>
          </div>
          <div className="navbar-item">
            <NavLink to="/thelounge" className="navbar-item" onClick={handleBurgerClick}>
              The Lounge
            </NavLink>
          </div>
          <div className="navbar-item">
            <NavLink to="/about" className="navbar-item" onClick={handleBurgerClick}>
              Our Mission
            </NavLink>
          </div>
          {
            currentUser ? (
              <NavLink to={`/users/${currentUser.id}`} className="navbar-item" onClick={handleBurgerClick}>
                <button className="button is-rounded is-primary is-outlined">
                  My Profile
                </button>
              </NavLink>
            ) : (
              <NavLink to="/login" className="navbar-item" onClick={handleBurgerClick}>
                <button className="button is-rounded is-primary is-outlined">
                  Log in
                </button>
              </NavLink>
            )
          }
        </div>
      </div>
    </nav>
  );
}

export default NavBar;