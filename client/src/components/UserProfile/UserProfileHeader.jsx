function UserProfileHeader({ user, getDisplayText, fallbackImagePath, loggedInUser, handleEditProfile }) {
    return (
        <div className="columns">
            {/* Photo Section */}
            <div className="is-flex is-justify-content-center column is-one-third">
                <figure className="image">
                    <img
                        src={user.photo_url || fallbackImagePath}
                        alt={`${user.username}'s profile`}
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = fallbackImagePath;
                        }}
                        style={{ borderRadius: 16, borderStyle: "solid", borderColor: "#f68c1f", borderWidth: 1, width: 275, height: "auto" }}
                    />
                </figure>
            </div>
            {/* Info Section */}
            <div className="column">
                <div className="level">
                    <div className="level-left">
                        <h5 className="title is-5">@{user.username}</h5>
                    </div>
                    {/* Buttons */}
                    {loggedInUser && loggedInUser.id === user.id && (
                        <div className="level-right">
                            <button className="button is-primary has-text-white" onClick={handleEditProfile}>Edit Profile</button>
                            <button className="button is-primary has-text-white" onClick={handleEditProfile}>Settings</button>
                        </div>
                    )}
                </div>
                {/* Display gender, orientation, and sober status if available */}
                <div className="block">
                    {user.gender && (
                        <div className="tag is-primary is-light mr-3">
                            {getDisplayText("gender", user.gender)}
                        </div>
                    )}
                    {user.orientation && (
                        <div className="tag is-primary is-light mr-3">
                            {getDisplayText("orientation", user.orientation)}
                        </div>
                    )}
                    {user.sober_status && (
                        <div className="tag is-primary is-light mr-3">
                            {getDisplayText("soberstatus", user.sober_status)}
                        </div>
                    )}
                </div>
                {/* Bio */}
                <div style={{ borderRadius: 8, borderStyle: "solid", borderWidth: 1, borderColor: "#263E88", padding: 20 }}>
                    {user.bio || "No bio available"}
                </div>
            </div>
        </div>
    );
}

export default UserProfileHeader;