import { Outlet } from "react-router-dom";
import { useState } from "react";

import "../App.css";

function App() {
  const [currentUser, setCurrentUser] = useState(null);

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
