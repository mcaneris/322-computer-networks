import React from "react";

export default function UserList({
  users = [],
  handleUserSelect,
  handleUserInvite,
  currentUser,
  channels,
  currentChannel,
  selectedUser,
}) {
  const roomUsers =
    channels.length && currentChannel
      ? channels.find(
          (channel) => channel.id.toString() === currentChannel
        ).users
      : [];
  return (
    <div className="users">
      <div className="divider">In Room</div>
      {roomUsers.map((username) => {
        return (
          <div
            key={`in-room-user-${username}`}
            id={username}
            className={selectedUser === username ? "user selected" : "user"}
            onClick={handleUserSelect}
          >
            {username}
          </div>
        );
      })}
      <div className="divider">Users</div>
      {users.filter(user => !roomUsers.includes(user.username)).map(({ username }) => {
        return (
          <div
            key={`user-${username}`}
            id={username}
            className={selectedUser === username ? "user selected" : "user"}
            onClick={handleUserInvite}
          >
            {username}
          </div>
        );
      })}
    </div>
  );
}
