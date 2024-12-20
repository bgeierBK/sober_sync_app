import { Outlet } from "react-router-dom";

import "../App.css";

function App() {
  return (
    <>
      <h2>Main Page</h2>
      <Outlet />
    </>
  );
}

export default App;
