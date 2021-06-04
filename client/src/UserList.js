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
      ? channels.find((channel) => channel.id === currentChannel)
          .users
      : [];
  return (
    <div className="users">
      <div className="divider">In Room</div>
      {!roomUsers.length ? (
        <div className="user">-</div>
      ) : (
        roomUsers.map((username) => {
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
        })
      )}
      <div className="divider">All Users</div>
      <div style={{ padding: "12px 24px", fontSize: "12px", fontStyle: "italic" }}>
        Click user to invite to room
      </div>
      {users
        .filter((user) => !roomUsers.includes(user.username))
        .map(({ username }) => {
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
