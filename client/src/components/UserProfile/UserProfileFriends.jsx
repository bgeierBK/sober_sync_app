import { useOutletContext } from "react-router-dom";

function UserProfileFriends() {
    const user = useOutletContext()
    const loggedInUser = useOutletContext()
    
    return (
        <div>
            {/* Friend Requests */}
            {loggedInUser && loggedInUser.id === user.id && (
                <div>
                    <h4 className="title is-4">Friend Requests</h4>
                    {user.friend_requests_list?.length > 0 ? (
                        <ul>
                            {user.friend_requests_list.map((req) => (
                                <li key={req.id}>
                                    <Link to={`/users/${req.sender_id}`}>
                                        {req.sender_username}
                                    </Link>{" "}
                                    sent you a friend request.
                                    <button onClick={() => handleAcceptFriendRequest(req.id)}>
                                        Accept
                                    </button>
                                    <button onClick={() => handleRejectFriendRequest(req.id)}>
                                        Deny
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p>No friend requests</p>
                    )}
                </div>
            )}

            {/* Friends List */}
            <div>
                <h4 className="title is-4">Friends</h4>
                {user.friend_list?.length > 0 ? (
                    <ul>
                        {user.friend_list.map((friend) => (
                            <li key={friend.id}>
                                <Link to={`/users/${friend.id}`}>{friend.username}</Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p>No friends yet</p>
                )}
            </div>
        </div>
    );
}

export default UserProfileFriends;