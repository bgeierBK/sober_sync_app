import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import EventContainer from "../components/EventContainer";
import LoggedInHome from "./LoggedInHome";
import LoggedOutHome from "./LoggedOutHome";

function Home() {
  const { currentUser, setCurrentUser } = useOutletContext();
  const [events, setEvents] = useState([]);

  console.log("Home page mounted");

  return (
    <>
      { currentUser ? <LoggedInHome /> : <LoggedOutHome /> }
    </>
  );
}

export default Home;
