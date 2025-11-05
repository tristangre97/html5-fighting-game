// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const GameRoom = require('./server/GameRoom');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(__dirname));

// Active game rooms
const gameRooms = new Map();
let waitingPlayer = null;

io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on('find_match', (data) => {
    console.log(`Player ${socket.id} looking for match with character:`, data?.characterData?.name);

    // Store character data on socket
    socket.characterData = data?.characterData;

    if (waitingPlayer && waitingPlayer.id !== socket.id) {
      // Match found! Create a new game room
      const roomId = `room_${Date.now()}`;
      const player1 = waitingPlayer;
      const player2 = socket;

      // Create game room with character data
      const gameRoom = new GameRoom(
        roomId,
        player1,
        player2,
        io,
        player1.characterData,
        player2.characterData
      );
      gameRooms.set(roomId, gameRoom);

      // Join both players to the room
      player1.join(roomId);
      player2.join(roomId);

      // Notify both players
      player1.emit('match_found', {
        roomId: roomId,
        playerNumber: 1,
        opponentId: player2.id
      });

      player2.emit('match_found', {
        roomId: roomId,
        playerNumber: 2,
        opponentId: player1.id
      });

      console.log(`Match created: ${roomId} - ${player1.id} vs ${player2.id}`);

      // Start the game
      gameRoom.start();

      waitingPlayer = null;
    } else {
      // No match found, add to waiting list
      waitingPlayer = socket;
      socket.emit('waiting_for_opponent');
      console.log(`Player ${socket.id} waiting for opponent`);
    }
  });

  socket.on('player_input', (data) => {
    const room = findRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerInput(socket.id, data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);

    // Remove from waiting list if present
    if (waitingPlayer && waitingPlayer.id === socket.id) {
      waitingPlayer = null;
    }

    // Handle game room cleanup
    const room = findRoomBySocketId(socket.id);
    if (room) {
      room.handlePlayerDisconnect(socket.id);
      gameRooms.delete(room.roomId);
    }
  });
});

function findRoomBySocketId(socketId) {
  for (const [roomId, room] of gameRooms) {
    if (room.hasPlayer(socketId)) {
      return room;
    }
  }
  return null;
}

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
