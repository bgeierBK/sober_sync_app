import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

function LogInComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { setCurrentUser } = useOutletContext();

  function handleSubmit(event) {
    event.preventDefault();

    fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    }).then((response) => {
      if (response.ok) {
        response.json().then((user) => setCurrentUser(user));
        navigate("/");
      } else {
        alert("Invalid email or password!");
      }
    });
  }

  return (
    <form
      className="bg-slate-300 p-6 rounded-lg shadow-lg w-full max-w-md mx-auto"
      onSubmit={handleSubmit}
    >
      <h3>Log In!</h3>
      <div className="mb-4">
        <label className="block font-medium mb-2">
          Email Address
          <input
            type="email"
            name="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            value={email}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
      </div>
      <div className="mb-4">
        <label className="block font-medium mb-2">
          Password
          <input
            type="password"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            value={password}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </label>
        <input type="submit" value="Log In" />
      </div>
    </form>
  );
}

export default LogInComponent;
