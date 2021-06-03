# 322 Network Systems - Chat Application

## Server & Client
The server is written in NodeJS and uses Express to create a simple server, with Socket.io providing the websocket interface.

The client is written in Javascript using the React Framework and AWS Amplify Framework, with Socket.io providing the websocket interface. In this way, users are able to use the client application from any modern browser.

Both the server and the client are deployed to an AWS EC2 instance. 

### React
React is an open-source front-end JavaScript library for building user interfaces or UI components. It is maintained by Facebook and a community of individual developers and companies. React can be used as a base in the development of single-page or mobile applications.

### AWS Amplify
AWS Amplify is a set of tools and services that can be used together or on their own, to help front-end web and mobile developers build scalable full stack applications, powered by AWS.

### Express
Express.js, or simply Express, is a back end web application framework for Node.js, released as free and open-source software under the MIT License. It is designed for building web applications and APIs. It has been called the de facto standard server framework for Node.js. 

### Socket.io
Socket.IO is a JavaScript library for realtime web applications. It enables realtime, bi-directional communication between web clients and servers. It has two parts: a client-side library that runs in the browser, and a server-side library for Node.js. Both components have a nearly identical API.

## Authentication
The application uses AWS Cognito User Pools for authentication. Users can register/login through AWS Cognito, then the client sends the username and token to the server for authentication.

## Encryption
The application uses an envelope encryption mechanism to securely encrypt user messages until the messages reach the other users' clients.

When you encrypt your data, your data is protected, but you have to protect your encryption key. One strategy is to encrypt it. Envelope encryption is the practice of encrypting plaintext data with a data key, and then encrypting the data key under another key.  When you encrypt a data key, you don't have to worry about storing the encrypted data key, because the data key is inherently protected by encryption. You can safely store the encrypted data key alongside the encrypted data.  In general, symmetric key algorithms are faster and produce smaller ciphertexts than public key algorithms. But public key algorithms provide inherent separation of roles and easier key management. Envelope encryption lets you combine the strengths of each strategy. 

The encryption/decryption flow is as follows:

* The client requests (by using the user's credentials) an encryption key from the AWS Key Management Service (KMS). AWS KMS delivers a key in plain text as well as encrypted.
* The plain text key is used to encrypt the message locally, and then discarded.
* The client sends the encrypted message as well as the encrypted key to the server for storage in the database.
* The server stores encrypted messages and encrypted keys in the database.
* The server sends encrypted messages and encrypted keys to the clients.
* The client uses AWS KMS to decrypt the encrypted key, and then decrypts the encrypted message itself.

In this way, all encryption is done locally in the clients and all messages are encrypted during transport and during storage.

