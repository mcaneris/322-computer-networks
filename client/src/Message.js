import React from "react";

export default function Message({ belongsToCurrentUser, message }) {
  return (
    <div className={belongsToCurrentUser ? "message me" : "message"}>
      {message.body}
    </div>
  );
}
