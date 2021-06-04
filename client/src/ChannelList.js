import React from "react";

export default function ChannelList({
  channels,
  handleChannelCreate,
  handleChannelSelect,
  currentChannel,
}) {
  return (
    <div className="channels">
      <div className="divider">Rooms</div>
      {channels.sort((a,b) => a.id - b.id).map((channel) => {
        const pickDisplay = (channel) => {
          if (channel.name) return channel.name;
          if (channel.users) return channel.users.join(", ");
          return channel.id;
        }
        return (
          <div
            key={`channel-${channel.id}`}
            id={channel.id}
            className={currentChannel === channel.id ? "channel selected" : "channel"}
            onClick={handleChannelSelect}
          >
            {pickDisplay(channel)}
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
