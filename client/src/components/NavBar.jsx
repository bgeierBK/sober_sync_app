import { useState } from "react";
import { NavLink } from "react-router-dom";

function NavBar({ currentUser, setCurrentUser }) {
  return (
    <nav className="bg-blue-500 text-slate-200">
      {currentUser == null ? (
        <p>No active user</p>
      ) : (
        <p>There is an active user</p>
      )}
    </nav>
  );
}

export default NavBar;
