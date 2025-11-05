// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Client-side network manager for multiplayer
class NetworkManager {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.roomId = null;
    this.playerNumber = null;
    this.callbacks = {
      onMatchFound: null,
      onGameStart: null,
      onGameUpdate: null,
      onGameOver: null,
      onOpponentDisconnected: null,
      onWaitingForOpponent: null
    };
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = io();

      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connected = true;
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connected = false;
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
      });

      // Set up game event listeners
      this.setupEventListeners();
    });
  }

  setupEventListeners() {
    this.socket.on('waiting_for_opponent', () => {
      console.log('Waiting for opponent...');
      if (this.callbacks.onWaitingForOpponent) {
        this.callbacks.onWaitingForOpponent();
      }
    });

    this.socket.on('match_found', (data) => {
      console.log('Match found!', data);
      this.roomId = data.roomId;
      this.playerNumber = data.playerNumber;

      if (this.callbacks.onMatchFound) {
        this.callbacks.onMatchFound(data);
      }
    });

    this.socket.on('game_start', (initialState) => {
      console.log('Game starting with initial state:', initialState);
      if (this.callbacks.onGameStart) {
        this.callbacks.onGameStart(initialState);
      }
    });

    this.socket.on('game_update', (state) => {
      if (this.callbacks.onGameUpdate) {
        this.callbacks.onGameUpdate(state);
      }
    });

    this.socket.on('game_over', (data) => {
      console.log('Game over!', data);
      if (this.callbacks.onGameOver) {
        this.callbacks.onGameOver(data);
      }
    });

    this.socket.on('opponent_disconnected', () => {
      console.log('Opponent disconnected');
      if (this.callbacks.onOpponentDisconnected) {
        this.callbacks.onOpponentDisconnected();
      }
    });
  }

  findMatch(characterData) {
    if (!this.connected) {
      console.error('Not connected to server');
      return;
    }
    console.log('Finding match with character:', characterData);
    this.socket.emit('find_match', { characterData: characterData });
  }

  sendInput(input) {
    if (!this.connected || !this.roomId) {
      return;
    }
    this.socket.emit('player_input', input);
  }

  on(event, callback) {
    if (this.callbacks.hasOwnProperty('on' + event.charAt(0).toUpperCase() + event.slice(1))) {
      this.callbacks['on' + event.charAt(0).toUpperCase() + event.slice(1)] = callback;
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.connected = false;
      this.roomId = null;
      this.playerNumber = null;
    }
  }
}
