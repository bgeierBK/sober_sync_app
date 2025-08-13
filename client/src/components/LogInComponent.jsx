import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

function LogInComponent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { check_session } = useOutletContext();

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
        check_session();
        navigate("/");
      } else {
        alert("Invalid email or password!");
      }
    });
  }

  return (
    <div className="section is-fullheight is-flex is-justify-content-center">
      <div className="box" style={{ maxWidth: 500, maxHeight: 300 }}>
        <h5 className="title is-5">Log In</h5>
        <form
          onSubmit={handleSubmit}
          className="field"
        >
          <div className="field">
            <label className="label">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              value={email}
              className="input"
            />
          </div>
          <div className="field">
            <label className="label">
              Password
            </label>
            <input
              type="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              value={password}
              className="input"
            />
          </div>
          <input type="submit" value="Log In!" className="button is-primary" />
        </form>
      </div>
    </div>
  );
}

export default LogInComponent;
