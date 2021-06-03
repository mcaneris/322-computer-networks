import { io } from "socket.io-client";

let socket;

export const connect = ({ username, token }) => {
  if (socket) return socket;
  socket = io("http://3.121.223.135:3001", {
    auth: {
      username,
      token,
    },
  });
  return socket;
};
