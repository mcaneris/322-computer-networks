require("dotenv").config();

const AWS = require("aws-sdk");
const express = require("express");
const app = express();
const http = require("http");
const { Server } = require("socket.io");

const server = http.createServer(app);

const Cognito = new AWS.CognitoIdentityServiceProvider({
  region: "eu-central-1",
});

const knex = require("knex")({
  client: "pg",
  connection: {
    host: "chat-app-db.cnqjdo13rbyx.eu-central-1.rds.amazonaws.com",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: "postgres",
  },
});

const io = new Server(server, {
  cors: true,
  origins: ["3.121.223.135:8080", "localhost:3000"],
});

/*
 * Register each connection as a presence in the database.
 * The presence table upserts on username, so we guarantee
 * that there is always a single row in the db for a user.
 */
const registerPresence = async (socket) => {
  const username = socket.handshake.auth.username;

  await knex("presence")
    .insert({
      username,
      socket_id: socket.id,
    })
    .onConflict("username")
    .merge();

  await knex("user_channels")
    .insert({ channel_id: 0, username })
    .onConflict(["username", "channel_id"])
    .ignore();

  broadcast();
};

/*
 * Register each connection as a presence in the database.
 */
const dropPresence = async (socket) => {
  try {
    const username = socket.handshake.auth.username;
    await knex("presence").delete(username);
    broadcast();
  } catch (error) {}
};

/*
 * Broadcast all present users.
 * registerPresence and dropPresence will
 * call the broadcast function to send
 * updated presence list to all users.
 */
const broadcast = () => {
  knex("presence")
    .select("username")
    .then((users) => {
      io.emit("presence", users);
    })
    .catch((error) => console.error(error));
};

const registerMessage = ({ id, channel_id, body, author, dataKey }) => {
  knex("messages")
    .insert({
      id,
      channel_id: channel_id ? channel_id : "public",
      body,
      author,
      data_key: dataKey,
    })
    .then((data) =>
      io.emit("message", { id, channel_id, body, author, data_key: dataKey })
    )
    .catch((error) => console.error(error));
};

const emitChannelList = async (socket) => {
  const username = socket.handshake.auth.username;
  const userChannels = await knex("user_channels")
    .select("channels.id", "channels.name")
    .where("username", username)
    .join("channels", "user_channels.channel_id", "channels.id");
  let channels = [];

  for (const userChannel of userChannels) {
    const users = await knex("user_channels")
      .select("username")
      .where("channel_id", userChannel.id);
    channels = [
      ...channels,
      {
        ...userChannel,
        users: users.map((user) => user.username),
      },
    ];
  }

  socket.emit("channel-list", channels);
};

const emitChannelHistory = (socket, channelId) => {
  knex("messages")
    .where("channel_id", channelId)
    .then((messages) => {
      socket.emit("message-history", messages);
    });
};

const addUserToChannel = async (socket, username, channel_id) => {
  await knex("user_channels")
    .insert({ channel_id, username })
    .onConflict(["username", "channel_id"])
    .ignore();

  emitChannelList(socket);
};

io.use((socket, next) => {
  const username = socket.handshake.auth.username;
  const token = socket.handshake.auth.token;
  next();
});

io.on("connection", (socket) => {
  try {
    console.log(`Connection FROM: ${socket.id}`);
    registerPresence(socket);
    emitChannelList(socket);

    socket.on("message", (message) => {
      registerMessage(message);
    });

    socket.on("invite-user", ({ username, channel_id }) => {
      addUserToChannel(socket, username, channel_id);
    });

    socket.on("new-channel", () => {
      const username = socket.handshake.auth.username;
      knex("channels")
        .insert({}, ["id"])
        .then((data) => {
          knex("user_channels")
            .insert({
              username: username,
              channel_id: data[0].id,
            })
            .then(() => emitChannelList(socket));
        });
    });

    socket.on("channel-select", (channelId) => {
      emitChannelHistory(socket, channelId);
    });

    socket.on("disconnect", () => dropPresence(socket));
  } catch (error) {
    console.error(error);
  }
});

server.listen(3001, () => {
  console.log("Listening on *:3001");
});
