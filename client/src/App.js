import "./App.css";

import { Auth } from "@aws-amplify/auth";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { uniqBy } from "ramda";
import React, { useCallback, useEffect, useState } from "react";
import { ulid } from "ulid";
import { encrypt, decrypt } from "./crypto";
import { connect } from "./Socket";

import ChannelList from "./ChannelList";
import UserList from "./UserList";
import Message from "./Message";

function App() {
  const [loading, setLoading] = useState(false);
  const [credentials, setCredentials] = useState(null);
  const [socket, setSocket] = useState(null);
  const [currentChannel, setCurrentChannel] = useState(null);
  const [channels, setChannels] = useState([]);
  const [messages, setMessages] = useState([]);
  const [messageBody, setMessageBody] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const [users, setUsers] = useState([]);
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    Auth.currentUserInfo().then((userInfo) => {
      setUserInfo(userInfo);
    });
  }, []);

  useEffect(() => {
    if (userInfo?.username) {
      Auth.currentUserCredentials().then((credentials) => {
        setCredentials(credentials);
        const socket = connect({
          username: userInfo.username,
          token: credentials.sessionToken,
        });
        setSocket(socket);
      });
    }
  }, [userInfo]);

  useEffect(() => {
    if (socket) {
      socket.on("presence", (data) => {
        setUsers(data);
      });
    }
  }, [socket]);

  const updateChannelMessages = useCallback(
    async (newMessages) => {
      let decryptedMessages = [];
      for (const message of newMessages) {
        const decrypted = await decrypt(message, credentials);
        decryptedMessages = [...decryptedMessages, decrypted];
      }
      setMessages(
        uniqBy((message) => message.id, [...messages, ...decryptedMessages])
      );
    },
    [credentials, messages]
  );

  useEffect(() => {
    if (socket) {
      socket.on("message", (message) => {
        updateChannelMessages([message]);
      });
      socket.on("channel-list", (channels) => {
        setChannels(channels);
      });
      socket.on("message-history", (data) => {
        setLoading(false);
        updateChannelMessages(data);
      });
    }
  }, [socket, channels, updateChannelMessages]);

  const handleChange = (event) => {
    setMessageBody(event.target.value);
  };

  const handleUserSelect = (event) => {
    const username = event.target.id;
    setSelectedUser(username);
  };

  const handleChannelSelect = (event) => {
    const channel = event.target.id;
    try {
      setLoading(true);
      setCurrentChannel(channel);
      socket.emit("channel-select", channel);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChannelCreate = (event) => {
    try {
      socket.emit("new-channel", {});
    } catch (error) {
      console.error(error);
    }
  };

  const handleUserInvite = (event) => {
    const username = event.target.id;
    try {
      socket.emit("invite-user", { username, channel_id: currentChannel });
    } catch (error) {
      console.error(error);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    event.stopPropagation();

    try {
      const [body, dataKey] = await encrypt(messageBody.trim(), credentials);

      socket.emit("message", {
        id: ulid(),
        channel_id: currentChannel,
        author: userInfo?.username,
        body,
        dataKey,
      });

      setMessageBody("");
    } catch (error) {
      console.error(error);
    }
  };

  const channel = channels.filter(
    (channel) => channel.id.toString() === currentChannel
  )[0];

  return (
    <div className="app">
      {userInfo && (
        <div className="header">
          <div className="profile">
            You are logged in as: <strong>{userInfo.username}</strong>
          </div>
          <AmplifySignOut />
        </div>
      )}
      <div className="ui">
        <ChannelList
          channels={channels}
          handleChannelSelect={handleChannelSelect}
          handleChannelCreate={handleChannelCreate}
          currentChannel={currentChannel}
        />
        <div className="container">
          <h1 className="channel-title">
            <div style={{ flexGrow: 1 }}>{channel
              ? channel.name || channel.users.join(", ")
              : "Choose a room..."}</div>
            {loading ? <div>Loading...</div> : null}
          </h1>
          <div className="messages">
            <div className="messages-scroller">
              {messages
                .filter(
                  (message) => message.channel_id.toString() === currentChannel
                )
                .map((message) => {
                  return (
                    <Message
                      key={message.id}
                      message={message}
                      belongsToCurrentUser={
                        message.author === userInfo?.username
                      }
                    />
                  );
                })}
            </div>
          </div>
          <div className="chat-bar">
            <form onSubmit={handleSubmit}>
              <input
                type="text"
                name="messageBody"
                placeholder="Type your message"
                onChange={handleChange}
                disabled={!currentChannel}
                value={messageBody}
              />
            </form>
          </div>
        </div>
        <UserList
          users={users}
          channels={channels}
          currentChannel={currentChannel}
          handleUserSelect={handleUserSelect}
          handleUserInvite={handleUserInvite}
          currentUser={userInfo?.username}
          selectedUser={selectedUser}
        />
      </div>
    </div>
  );
}

export default withAuthenticator(App);
