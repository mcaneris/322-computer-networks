import "./App.css";

import axios from "axios";
import { Auth } from "@aws-amplify/auth";
import { withAuthenticator, AmplifySignOut } from "@aws-amplify/ui-react";
import { values, type, uniqBy } from "ramda";
import React, { useCallback, useEffect, useState } from "react";
import { ulid } from "ulid";
import { encrypt, decrypt } from './crypto';
import { connect } from "./Socket";

import ChannelList from "./ChannelList";
import UserList from "./UserList";
import Message from "./Message";

function App() {
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
    (newMessages) => {
      type(newMessages) === "Array"
        ? setMessages(
            uniqBy((message) => message.id, [...messages, ...newMessages])
          )
        : setMessages(
            uniqBy((message) => message.id, [...messages, newMessages])
          );
    },
    [messages]
  );

  useEffect(() => {
    if (socket) {
      socket.on("message", (message) => {
        updateChannelMessages(message);
      });
      socket.on("channel-list", (channels) => {
        setChannels(channels);
      });
      socket.on("message-history", (data) => {
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
    setCurrentChannel(channel);
    try {
      socket.emit("channel-select", channel);
    } catch (error) {
      console.error(error);
    }
  };

  const handleChannelCreate = (event) => {
    const channel = event.target.id;

    try {
      socket.emit("new-channel", {});
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
          currentUser={userInfo?.username}
          selectedUser={selectedUser}
        />
      </div>
    </div>
  );
}

export default withAuthenticator(App);
