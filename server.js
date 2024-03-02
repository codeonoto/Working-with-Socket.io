import express from 'express';
import { Server } from 'socket.io';
import cors from 'cors';
import http from 'http';
import { connect } from './config.js';
import { chatModel } from './chatSchema.js';

const app = express();

// 1. Creating server using http.
const server = http.createServer(app);

// 2. Create socket server.
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// 3. Use socket events.

io.on('connection', (socket) => {
  console.log('Connection is established');

  socket.on('join', (data) => {
    socket.username = data;
    // send old messages to the clients.
    chatModel
      .find()
      .sort({ timestamp: 1 })
      .limit(50)
      .then((messages) => {
        socket.emit('load_messages', messages);
      })
      .catch((err) => {
        console.log(err);
      });
  });

  socket.on('new_message', (message) => {
    let userMessage = {
      username: socket.username,
      message: message,
    };

    const newChat = new chatModel({
      username: socket.username,
      message: message,
      timestamp: new Date(),
    });
    newChat.save();

    // broadcast this message to all the clients.
    socket.broadcast.emit('broadcast_message', userMessage);
  });

  socket.on('disconnect', () => {
    console.log('Connection is disconnected');
  });
});

server.listen(3000, () => {
  console.log('App is listening on 3000');
  connect();
});
