import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";

function EditProfile() {
    const { user, setUser } = useOutletContext();
    const [photoFile, setPhotoFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const [photoUploading, setPhotoUploading] = useState(false);
    const fallbackImagePath = "/blank_profile.webp";
    const [editedUser, setEditedUser] = useState(user);

    useEffect(() => {
        setPreviewUrl(user.photo_url || "");
    }, [])

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setPhotoFile(file);
            // Create a preview URL
            const fileReader = new FileReader();
            fileReader.onload = () => {
                setPreviewUrl(fileReader.result);
            };
            fileReader.readAsDataURL(file);
        }
    };

    // Upload photo separately if needed
    const uploadPhoto = async () => {
        if (!photoFile) return null;

        setPhotoUploading(true);
        try {
            // Create FormData for just the photo
            const photoData = new FormData();
            photoData.append("profile_photo", photoFile);

            // Check if your API has a separate endpoint for photo uploads
            // If not, you might need to implement this on the backend
            const uploadResponse = await fetch(`/api/users/${user.id}/upload-photo`, {
                method: "POST",
                credentials: "include",
                body: photoData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Failed to upload photo");
            }

            const uploadResult = await uploadResponse.json();
            setPhotoUploading(false);
            return uploadResult.photo_url; // Assuming the API returns the URL
        } catch (error) {
            console.error("Error uploading photo:", error);
            setPhotoUploading(false);
            throw error;
        }
    };

    const handleSaveProfile = async () => {

        // Create the JSON payload
        const profileData = {
            bio: editedUser.bio || "",
            // photo_url: photoUrl || "",
            question1_answer: editedUser.question1_answer || "",
            question2_answer: editedUser.question2_answer || "",
            question3_answer: editedUser.question3_answer || "",
            gender: editedUser.gender || "",
            orientation: editedUser.orientation || "",
            sober_status: editedUser.sober_status || "",
        };

        console.log("Sending profile update as JSON:", profileData);
        try {
            //     let photoUrl = editedUser.photo_url;

            //     // Only attempt photo upload if we have a new file
            //     if (photoFile) {
            //         try {
            //             // If your API has a separate photo upload endpoint
            //             const newPhotoUrl = await uploadPhoto();
            //             if (newPhotoUrl) {
            //                 photoUrl = newPhotoUrl;
            //             }
            //         } catch (photoError) {
            //             console.error("Photo upload failed, proceeding with profile update");
            //             // Continue with profile update even if photo upload fails
            //         }
            //     }


            const response = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(profileData),
            });

                // Better error handling - check the response type
                const contentType = response.headers.get("content-type");
                if (!response.ok) {
                    // If the response is HTML, we'll get the text for debugging
                    if (contentType && contentType.indexOf("text/html") !== -1) {
                        const htmlError = await response.text();
                        console.error("Server returned HTML error:", htmlError);
                        throw new Error("Server error - received HTML instead of JSON");
                    } else {
                        // Try to get JSON error if available
                        try {
                            const errorData = await response.json();
                            throw new Error(errorData.message || "Failed to save profile");
                        } catch (jsonError) {
                            throw new Error(
                                `Server error (${response.status}): ${response.statusText}`
                            );
                        }
                    }
                }

                // If we got here, the response is OK
                const updatedData = await response.json();
                console.log("Profile updated successfully:", updatedData);
                setUser(updatedData);
                // setIsEditing(false);
                setPhotoFile(null);
                setPreviewUrl("");
            } catch (err) {
                console.error("Error saving profile:", err);
                alert("Failed to save profile: " + err.message);
            }
        };

        const handleCancelEdit = () => {
            // setIsEditing(false);
            setEditedUser(null);
            setPhotoFile(null);
            setPreviewUrl("");
        };

        return (
            <div className="column">
                <form onSubmit={handleSaveProfile} className="field">

                    {/* <div className="profile-photo-edit">
                <div className="photo-upload-container">
                    <label htmlFor="profile-photo-upload" className="upload-label">
                        Upload New Photo
                    </label>
                    <input
                        type="file"
                        id="profile-photo-upload"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="file-input"
                    />
                    <p className="upload-hint">
                        Select an image file (JPG, PNG recommended)
                    </p>
                </div>
            </div> */}

                    {/* BIO */}
                    <div className="field">
                        <label className="label">Bio</label>
                        <textarea
                            rows="5"
                            cols="40"
                            onChange={(e) =>
                                setEditedUser({ ...editedUser, bio: e.target.value })
                            }
                            placeholder="Bio"
                            value={editedUser.bio}
                            className="textarea"
                            maxLength={300}
                        />
                    </div>

                    {/* GENDER */}
                    <div className="field">
                        <label className="label">Gender</label>
                        <select
                            value={editedUser.gender}
                            onChange={(e) =>
                                setEditedUser({ ...editedUser, gender: e.target.value })
                            }
                            className="select"
                        >
                            <option value="">Select Gender</option>
                            <option value="male">Male</option>
                            <option value="female">Female</option>
                            <option value="non-binary">Non-Binary</option>
                        </select>
                    </div>

                    {/* ORIENTATION */}
                    <div className="field">
                        <label className="label">Orientation</label>
                        <select
                            value={editedUser.orientation}
                            onChange={(e) =>
                                setEditedUser({ ...editedUser, orientation: e.target.value })
                            }
                            className="select"
                        >
                            <option value="">Select Orientation</option>
                            <option value="straight">Straight</option>
                            <option value="gay">Gay</option>
                            <option value="bi">Bisexual</option>
                            <option value="pan">Pansexual</option>
                            <option value="aro/ace">Asexual/Aromantic</option>
                        </select>
                    </div>

                    {/* SOBER STATUS */}
                    <div className="field">
                        <label className="label">Sober Status:</label>
                        <select className="select"
                            value={editedUser.sober_status}
                            onChange={(e) =>
                                setEditedUser({ ...editedUser, sober_status: e.target.value })
                            }
                        >
                            <option value="">Select Sober Status</option>
                            <option value="abstinent">Abstinent</option>
                            <option value="sober-curious">Sober-Curious</option>
                            <option value="california-sober">California Sober</option>
                        </select>
                    </div>

                    {/* QUESTIONS */}
                    <div className="field">
                        <label className="label">
                            Dream concert lineup?
                        </label>
                        <textarea
                            value={editedUser.question1_answer}
                            onChange={(e) =>
                                setEditedUser({
                                    ...editedUser,
                                    question1_answer: e.target.value,
                                })
                            }
                            maxLength={100}
                            className="textarea"
                        />
                    </div>

                    <div className="field">
                        <label className="label">
                            Best concert you've ever been to?
                        </label>
                        <textarea
                            value={editedUser.question2_answer}
                            onChange={(e) =>
                                setEditedUser({
                                    ...editedUser,
                                    question2_answer: e.target.value,
                                })
                            }
                            maxLength={100}
                            className="textarea"
                        />
                    </div>

                    <div className="field">
                        <label className="label">
                            Favorite concert venue?
                        </label>
                        <textarea
                            value={editedUser.question3_answer}
                            onChange={(e) =>
                                setEditedUser({
                                    ...editedUser,
                                    question3_answer: e.target.value,
                                })
                            }
                            maxLength={100}
                            className="textarea"
                        />
                    </div>

                    {/* BUTTONS */}
                    <div className="level-right">
                        <button
                            type="button"
                            onClick={handleSaveProfile}
                            className="button is-success"
                            disabled={photoUploading}
                        >
                            {photoUploading ? "Uploading..." : "Save Changes"}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancelEdit}
                            className="cancel-button"
                            disabled={photoUploading}
                        >
                            Cancel
                        </button>
                    </div>
                </form >
            </div >
        );
    }

    export default EditProfile;