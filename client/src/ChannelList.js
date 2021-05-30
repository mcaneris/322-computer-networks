import React from "react";

export default function ChannelList({
  channels,
  handleChannelCreate,
  handleChannelSelect,
  currentChannel,
}) {
  console.log(channels);
  return (
    <div className="channels">
      {channels.map(({ id, name }) => {
        return (
          <div
            key={`channel-${id}`}
            id={id}
            className={currentChannel === id.toString() ? "channel selected" : "channel"}
            onClick={handleChannelSelect}
          >
            {name ? name : id}
          </div>
        );
      })}
      <div
        key={`channel-add`}
        className="channel"
        onClick={handleChannelCreate}
      >
        + New Chat
      </div>
    </div>
  );
}
