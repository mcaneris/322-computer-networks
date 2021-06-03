import { io } from "socket.io-client";

let socket;

/*
 * Connects to remote socket sending username and
 * TOKEN received from AWS Cognito User Pool.
 * To ensure only a single connection, we assign an
 * established connection in an external variable,
 * an return it in subsequent evocations of the function.
 */
export const connect = ({ username, token }) => {
  if (socket) return socket;
  const server =
    process.env.NODE_ENV === "development"
      ? "localhost:3001"
      : "http://3.121.223.135:3001";

  console.log(`Establishing socket connection to ${server}`);

  socket = io(server, {
    auth: {
      username,
      token,
    },
  });
  return socket;
};
