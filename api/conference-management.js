const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const https = require('https');
const fs = require('fs');
const cors = require('cors');

function createServer() {
  const app = express();
  app.use(cors());

  // Use the appropriate paths for your certificates
  //   const privateKey = fs.readFileSync(
  //     '/etc/letsencrypt/live/podcast.verchool.zone/privkey.pem',
  //     'utf8'
  //   );
  //   const certificate = fs.readFileSync(
  //     '/etc/letsencrypt/live/podcast.verchool.zone/fullchain.pem',
  //     'utf8'
  //   );
  //   const credentials = { key: privateKey, cert: certificate };

  // Create HTTPS server
  //   const server = https.createServer(credentials, app);
  const server = http.createServer(app);
  const io = socketIo(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  const mutedUsers = new Set();
  const mutedCamUsers = new Set();

  io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('toggle-mute', ({ uid, action }) => {
      console.log(`Received ${action} request for user ${uid}`);

      if (socket.handshake.auth.isAdmin) {
        if (action === 'mute') {
          mutedUsers.add(uid);
          io.emit('user-muted', uid);
        } else if (action === 'unmute') {
          mutedUsers.delete(uid);
          io.emit('user-unmuted', uid);
        }
        console.log(`User ${uid} ${action}d by admin`);

        io.emit('muted-users-list', Array.from(mutedUsers));
      } else {
        console.log('Mute/unmute request denied: not admin');
        socket.emit('mute-error', 'Only admin can mute/unmute users');
      }
    });

    socket.on('toogle-camera', ({ uid, action }) => {
      console.log(`Received ${action} request for user ${uid}`);
      if (socket.handshake.auth.isAdmin) {
        if (action === 'cam-mute') {
          mutedCamUsers.add(uid);
          io.emit('cam-muted', uid);
        } else if (action === 'cam-unmute') {
          mutedCamUsers.delete(uid);
          io.emit('cam-unmuted', uid);
        }
        console.log(`User ${uid} ${action}d by admin`);

        io.emit('muted-cam-users-list', Array.from(mutedCamUsers));
      } else {
        console.log('CamMute/Camunmute request denied: not admin');
        socket.emit('mute-error', 'Only admin can mute/unmute users');
      }
    });

    socket.on('kick-user', ({ uid, action }) => {
      console.log(`Received ${action} request for user ${uid}`);

      if (socket.handshake.auth.isAdmin) {
        if (action === 'kick') {
          mutedUsers.delete(uid);
          io.emit('kick', uid);
        } else if (action === 'invite') {
          console.log('future');
        }
        console.log(`User ${uid} ${action}d by admin`);
      } else {
        console.log('Kick request denied: not admin');
        socket.emit('kick', 'Only admin can mute/unmute users');
      }
    });

    socket.emit('muted-users-list', Array.from(mutedUsers));

    socket.on('get-muted-users', () => {
      socket.emit('muted-users-list', Array.from(mutedUsers));
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });

  return server;
}

module.exports = createServer;
