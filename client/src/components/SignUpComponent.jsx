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
  const [profileImage, setProfileImage] = useState(null); // state for the image
  const navigate = useNavigate();
  const { setCurrentUser } = useOutletContext();

  // Function to handle the image upload to Cloudinary
  const uploadImageToCloudinary = async (file) => {
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload-image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Image upload failed");
      }

      const data = await response.json();
      return data.image_url; // returns the Cloudinary image URL
    } catch (error) {
      console.error("Error uploading image: ", error);
      alert("Image upload failed. Please try again.");
      return null;
    }
  };

  async function handleSubmit(event) {
    event.preventDefault();

    // Upload the image if it was selected
    const imageUrl = profileImage
      ? await uploadImageToCloudinary(profileImage)
      : null;

    if (!imageUrl && profileImage) {
      return; // Prevent form submission if image upload failed
    }

    const userData = {
      username: userName,
      age: age,
      password: password,
      email_address: emailAddress,
      bio: bio,
      gender: gender,
      orientation: orientation,
      sober_status: soberStatus,
      profile_image_url: imageUrl, // Add the Cloudinary image URL here
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const newUser = await response.json();
        setCurrentUser(newUser);
        navigate("/");
      } else {
        const errorData = await response.json();
        alert(errorData?.message || "Problem with signup");
      }
    } catch (error) {
      console.error("Error during signup: ", error);
      alert("There was an error with the signup process. Please try again.");
    }
  }

  return (
    <div className="container" style={{ display: "flex", justifyContent: "center" }}>
      <div className="box" style={{ maxWidth: 500 }}>
        <form onSubmit={handleSubmit} className="field">
          <h5 className="title is-5">Sign Up</h5>
          {/* USERNAME */}
          <div className="field">
            <label className="label">Username</label>
            <input
              type="text"
              name="userName"
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Username"
              value={userName}
              className="input"
            />
          </div>
          {/* EMAIL ADDRESS */}
          <div className="field">
            <label className="label">Email Address</label>
            <input
              type="email"
              name="emailAddress"
              onChange={(e) => setEmailAddress(e.target.value)}
              placeholder="Email address"
              value={emailAddress}
              className="input"
            />
          </div>
          {/* BIO */}
          <div className="field">
            <label className="label">Bio</label>
            <textarea
              rows="5"
              cols="40"
              onChange={(e) => setBio(e.target.value)}
              placeholder="Bio"
              value={bio}
              className="textarea"
            />
          </div>
          {/* AGE */}
          <div className="field">
            <label className="label">Age</label>
            <input
              type="number"
              name="age"
              onChange={(e) => setAge(parseInt(e.target.value))}
              placeholder="Age"
              value={age}
              className="input"
            />
          </div>
          {/* SOBER STATUS */}
          <div className="field">
            <label className="label">Sober Status</label>
            <select
              name="soberStatus"
              onChange={(e) => setSoberStatus(e.target.value)}
              value={soberStatus}
              className="select"
            >
              <option value="" disabled>
                Select your status
              </option>
              <option value="abstinent">Abstinent</option>
              <option value="sober-curious">Sober-Curious</option>
              <option value="california-sober">California Sober</option>
            </select>
          </div>
          {/* GENDER */}
          <div className="field">
            <label className="label">Gender</label>
            <select
              name="gender"
              onChange={(e) => setGender(e.target.value)}
              value={gender}
              className="select"
            >
              <option value="" disabled>
                Select your gender
              </option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="non-binary">Non-Binary</option>
            </select>
          </div>
          {/* SEXUAL ORIENTATION */}
          <div className="field">
            <label className="label">Sexual Orientation</label>
            <select
              name="orientation"
              onChange={(e) => setOrientation(e.target.value)}
              value={orientation}
              className="select"
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
          </div>
          {/* PROFILE IMAGE */}
          <div className="field">
            <label className="label">Profile Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setProfileImage(e.target.files[0])}
            />
          </div>
          {/* PASSWORD */}
          <div className="field">
            <label className="label">Password</label>
            <input
              type="password"
              name="password"
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              value={password}
            />
          </div>
          <input type="submit" value="Sign Up!" className="button is-primary" />
        </form>
      </div>
    </div>
  );
}

export default SignUpComponent;
