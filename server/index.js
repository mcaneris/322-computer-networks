require("dotenv").config();

const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");

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
  origins: ["http://localhost:3000"],
});

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

const dropPresence = async (socket) => {
  const username = socket.handshake.auth.username;
  await knex("presence").delete(username);
  broadcast();
};

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
    .then((data) => io.emit("message", { id, channel_id, body, author, dataKey }))
    .catch((error) => console.error(error));
};

const emitChannelList = async (socket) => {
  const username = socket.handshake.auth.username;
  const userChannels = await knex("user_channels");

  const channels = (await knex("channels")).map((channel) => {
    return {
      ...channel,
      users: userChannels
        .filter((userChannel) => userChannel.channel_id === channel.id)
        .map((userChannel) => userChannel.username),
    };
  });

  socket.emit("channel-list", channels);
};

const emitChannelHistory = (socket, channelId) => {
  knex("messages")
    .where("channel_id", channelId)
    .then((messages) => {
      socket.emit("message-history", messages);
    });
};

io.on("connection", (socket) => {
  try {
    console.log(`Connection FROM: ${socket.id}`);
    registerPresence(socket);
    emitChannelList(socket);

    socket.on("message", (message) => {
      registerMessage(message);
    });

    socket.on("new-channel", () => {
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
      console.log(channelId);
      emitChannelHistory(socket, channelId);
    });

    socket.on("disconnect", () => dropPresence(socket));
  } catch (error) {
    console.error(error);
  }
});

server.listen(3001, () => {
  console.log("listening on *:3001");
});
