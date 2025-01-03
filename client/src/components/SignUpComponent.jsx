import { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

function SignUpComponent() {
  const [userName, setUserName] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [bio, setBio] = useState("");
  const [gender, setGender] = useState("");
  const [orientation, setOrientation] = useState("");
  const [soberStatus, setSoberStatus] = useState("");

  return (
    <form>
      <h3>Sign Up</h3>
      <div>
        <label>
          User Name:
          <input
            type="text"
            name="username"
            onChange={(e) => setUserName(e.target.value)}
            placeholder="Username"
            value={userName}
          />
        </label>
      </div>
      <div>
        <label>
          Email address:
          <input
            type="text"
            name="emailAddress"
            onChange={(e) => setEmailAddress(e.target.value)}
            placeholder="email address"
            value={emailAddress}
          />
        </label>
      </div>
      <div>
        <label>
          Bio:
          <textarea
            rows="5"
            cols="40"
            onChange={(e) => setBio(e.target.value)}
            placeholder="Bio"
            value={bio}
          />
        </label>
      </div>
      <div>
        <label>
          Age:
          <input
            type="number"
            name="age"
            onChange={(e) => setAge(e.target.value)}
            placeholder="Age"
            value={age}
          />
        </label>
      </div>
      <div>
        <label>
          Sober Status:
          <select
            name="soberStatus"
            onChange={(e) => setSoberStatus(e.target.value)}
            value={soberStatus}
          >
            <option value="" disabled>
              Select your status
            </option>
            <option value="abstinent">Abstinent</option>
            <option value="sober-curious">Sober-Curious</option>
            <option value="california-sober">California Sober</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Gender:
          <select
            name="gender"
            onChange={(e) => setGender(e.target.value)}
            value={gender}
          >
            <option value="" disabled>
              Select your gender
            </option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="non-binary">Non-Binary</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Sexual Orientation:
          <select
            name="orientation"
            onChange={(e) => setGender(e.target.value)}
            value={gender}
          >
            <option value="" disabled>
              Select your orientation
            </option>
            <option value="Straight">Straight</option>
            <option value="gay">Gay</option>
            <option value="bi">Bisexual</option>
            <option value="pan">Pansexual</option>
            <option value="aro/ace">Asexual/Aromantic</option>
          </select>
        </label>
      </div>
      <div>
        <label>
          Password:
          <input
            type="text"
            name="password"
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            value={password}
          />
        </label>
      </div>
    </form>
  );
}

export default SignUpComponent;
