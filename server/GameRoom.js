// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

const ServerLevel = require('./ServerLevel');
const ServerPlayer = require('./ServerPlayer');

class GameRoom {
  constructor(roomId, player1Socket, player2Socket, io) {
    this.roomId = roomId;
    this.io = io;

    // Store socket references
    this.player1Socket = player1Socket;
    this.player2Socket = player2Socket;

    // Game state
    this.level = new ServerLevel();
    this.player1 = new ServerPlayer(1, this.level, 200, 100);
    this.player2 = new ServerPlayer(2, this.level, 400, 100);

    this.gameState = 'waiting'; // waiting, playing, game_over
    this.lastUpdate = Date.now();
    this.updateInterval = null;

    // Update rate: 30 updates per second (same as original game)
    this.UPDATE_RATE = 30;
    this.UPDATE_INTERVAL = 1000 / this.UPDATE_RATE;
  }

  start() {
    console.log(`Starting game in room ${this.roomId}`);

    // Send initial game state to both players
    this.sendInitialState();

    // Start game loop
    this.gameState = 'playing';
    this.lastUpdate = Date.now();

    this.updateInterval = setInterval(() => {
      this.update();
    }, this.UPDATE_INTERVAL);
  }

  sendInitialState() {
    const initialState = {
      level: this.level.serialize(),
      player1: this.player1.serialize(),
      player2: this.player2.serialize()
    };

    this.io.to(this.roomId).emit('game_start', initialState);
  }

  update() {
    const now = Date.now();
    const dt = now - this.lastUpdate;
    this.lastUpdate = now;

    if (this.gameState === 'playing') {
      // Update both players
      this.player1.update(dt, this.player2);
      this.player2.update(dt, this.player1);

      // Check for game over
      if (!this.player1.isAlive() || !this.player2.isAlive()) {
        this.gameOver();
      }

      // Broadcast game state to both players
      this.broadcastState();
    }
  }

  broadcastState() {
    const state = {
      player1: this.player1.serialize(),
      player2: this.player2.serialize(),
      timestamp: Date.now()
    };

    this.io.to(this.roomId).emit('game_update', state);
  }

  handlePlayerInput(socketId, input) {
    if (this.gameState !== 'playing') return;

    // Route input to correct player
    if (socketId === this.player1Socket.id) {
      this.player1.updateInput(input);
    } else if (socketId === this.player2Socket.id) {
      this.player2.updateInput(input);
    }
  }

  gameOver() {
    this.gameState = 'game_over';

    const winner = this.player1.isAlive() ? 1 : 2;

    this.io.to(this.roomId).emit('game_over', {
      winner: winner,
      player1Health: this.player1.health,
      player2Health: this.player2.health
    });

    // Clean up after 5 seconds
    setTimeout(() => {
      this.cleanup();
    }, 5000);
  }

  handlePlayerDisconnect(socketId) {
    console.log(`Player ${socketId} disconnected from room ${this.roomId}`);

    // Notify other player
    if (socketId === this.player1Socket.id) {
      this.player2Socket.emit('opponent_disconnected');
    } else if (socketId === this.player2Socket.id) {
      this.player1Socket.emit('opponent_disconnected');
    }

    this.cleanup();
  }

  hasPlayer(socketId) {
    return socketId === this.player1Socket.id || socketId === this.player2Socket.id;
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    console.log(`Cleaned up room ${this.roomId}`);
  }
}

module.exports = GameRoom;
