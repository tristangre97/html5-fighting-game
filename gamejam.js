/*
Copyright 2010 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0
     
Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var STATE_BEFORE_START = 'before start';
var STATE_PLAYING = 'playing';
var STATE_GAME_OVER = 'game over';

var INITIAL_PLAYER_SEPARATION = 200;

// Key codes
var KEY_SPACE=32;
var KEY_W=87;
var KEY_A=65;
var KEY_S=83;
var KEY_D=68;
var KEY_X=88;
var KEY_R=82;
var KEY_ESC=27;
var KEY_O=79;
var KEY_T=84;
var KEY_P=80;
var KEY_COMMA=188;
var KEY_PERIOD=190;
var KEY_LEFT=37;
var KEY_RIGHT=39;
var KEY_UP=38;
var KEY_DOWN=40;

var ACTION_IDLE = 'idle';
var ACTION_PAIN = 'pain';
var ACTION_PUNCH = 'punch';
var ACTION_BLOCK = 'block';
var ACTION_THROW = 'throw';
var ACTION_THROWN = 'thrown';
var DEBUG = false;

var PIT_DAMAGE = .1;

var win; // The window (I'd call it window but that's a reserved word)
var keys;
var player1;
var player2;
var interval;
var level;
var lastTimeStamp = 0;

var JUMP_TIME_MS = 800;  // jump time in milliseconds
var JUMP_HEIGHT = 100;  // in pixels

// Multiplayer support
var gameMode = 'local'; // 'local' or 'online'
var network = null;
var myPlayerNumber = null;
var lastInputState = {};

function resetGameState() {
  level = new Level();
  win.reset();
  var player_offset = win.width/2 - INITIAL_PLAYER_SEPARATION;
  player1 = new Player(player_offset, 'character.png', true);
  player2 = new Player(win.right() - player_offset, 'character_2.png', false);
  player1.other_player = player2;
  player2.other_player = player1;
  keys = new KeyWatcher();
  lastTimeStamp = 0;
  game_state = STATE_BEFORE_START;
  setTimeout(startRound, 1000);
}

function startRound() {
  game_state = STATE_PLAYING;
  win.startGame();
}

function handleInput() {
  if (gameMode === 'local') {
    handleLocalInput();
  } else if (gameMode === 'online') {
    handleOnlineInput();
  }
}

function handleLocalInput() {
  if (keys.isPressed(KEY_R)) {
    player1.punch();
  }
  if (keys.isPressed(KEY_T)) {
    player1.throw_em();
  }
  player1.block(false);
  if (keys.isPressed(KEY_A)) {
    player1.moveLeft();
    player1.block(player1.facing_right);
  }
  if (keys.isPressed(KEY_D)) {
    player1.moveRight();
    player1.block(!player1.facing_right);
  }

  if (keys.isPressed(KEY_COMMA)) {
    player2.punch();
  }
  if (keys.isPressed(KEY_PERIOD)) {
    player2.throw_em();
  }
  player2.block(false);
  if (keys.isPressed(KEY_LEFT)) {
    player2.moveLeft();
    player2.block(player2.facing_right);
  }
  if (keys.isPressed(KEY_RIGHT)) {
    player2.moveRight();
    player2.block(!player2.facing_right);
  }
}

function handleOnlineInput() {
  // Collect input state
  var inputState = {
    left: keys.isPressed(KEY_A) || keys.isPressed(KEY_LEFT),
    right: keys.isPressed(KEY_D) || keys.isPressed(KEY_RIGHT),
    jump: keys.isPressed(KEY_W) || keys.isPressed(KEY_UP),
    punch: keys.isPressed(KEY_R) || keys.isPressed(KEY_COMMA),
    throw: keys.isPressed(KEY_T) || keys.isPressed(KEY_PERIOD),
    block: keys.isPressed(KEY_A) || keys.isPressed(KEY_D) ||
           keys.isPressed(KEY_LEFT) || keys.isPressed(KEY_RIGHT)
  };

  // Only send input if it changed
  var inputChanged = false;
  for (var key in inputState) {
    if (inputState[key] !== lastInputState[key]) {
      inputChanged = true;
      break;
    }
  }

  if (inputChanged && network) {
    network.sendInput(inputState);
    lastInputState = inputState;
  }
}

function update() {
  var now = new Date().getTime();
  if (lastTimeStamp == 0) {
    var dt = 0;
  } else {
    dt = now - lastTimeStamp;
  }
  lastTimeStamp = now;

  if (game_state == STATE_PLAYING) {
    if (gameMode === 'local') {
      handleInput();
      player1.update(dt);
      player2.update(dt);

      if (player1.y < -100) {
        player1.health -= dt * PIT_DAMAGE;
      }

      if (player2.y < -100) {
        player2.health -= dt * PIT_DAMAGE;
      }

      if (!player1.isAlive() || !player2.isAlive()) {
        game_state = STATE_GAME_OVER;
        win.gameOver();
        setTimeout(resetGameState, 2000);
      }
    } else if (gameMode === 'online') {
      // In online mode, just send input and render
      // Server handles all game logic
      handleInput();
    }
  }

  win.update(dt);
  win.draw();

  if (DEBUG) {
    $('#debug').html('Debug:<br>Key: ' + keys.lastKey);
  }
}

// Online multiplayer functions
function startOnlineMode() {
  gameMode = 'online';
  network = new NetworkManager();

  $('#menu').hide();
  $('#status').text('Connecting to server...').show();

  network.connect().then(() => {
    $('#status').text('Finding opponent...');
    network.findMatch();
  }).catch((error) => {
    $('#status').text('Connection failed: ' + error.message);
    setTimeout(() => {
      $('#menu').show();
      $('#status').hide();
    }, 3000);
  });

  // Set up network event handlers
  network.on('waitingForOpponent', () => {
    $('#status').text('Waiting for opponent...');
  });

  network.on('matchFound', (data) => {
    console.log('Match found:', data);
    myPlayerNumber = data.playerNumber;
    $('#status').text('Match found! Waiting for game to start...');
  });

  network.on('gameStart', (initialState) => {
    console.log('Game starting:', initialState);
    $('#status').hide();

    // Initialize game with server state
    level = new Level();
    level.heights = initialState.level.heights;

    win.reset();

    // Create players based on server initial state
    var char1 = myPlayerNumber === 1 ? 'character.png' : 'character_2.png';
    var char2 = myPlayerNumber === 1 ? 'character_2.png' : 'character.png';

    player1 = new Player(initialState.player1.x, char1, true);
    player2 = new Player(initialState.player2.x, char2, false);

    player1.y = initialState.player1.y;
    player2.y = initialState.player2.y;

    player1.other_player = player2;
    player2.other_player = player1;

    keys = new KeyWatcher();
    lastTimeStamp = 0;
    game_state = STATE_BEFORE_START;
    setTimeout(startRound, 1000);
  });

  network.on('gameUpdate', (state) => {
    // Update game state from server
    if (player1 && player2) {
      // Update player 1
      player1.x = state.player1.x;
      player1.y = state.player1.y;
      player1.dx = state.player1.dx;
      player1.dy = state.player1.dy;
      player1.health = state.player1.health;
      player1.facing_right = state.player1.facing_right;
      player1.setAction(state.player1.action);
      player1.action_timer = state.player1.action_timer;

      // Update player 2
      player2.x = state.player2.x;
      player2.y = state.player2.y;
      player2.dx = state.player2.dx;
      player2.dy = state.player2.dy;
      player2.health = state.player2.health;
      player2.facing_right = state.player2.facing_right;
      player2.setAction(state.player2.action);
      player2.action_timer = state.player2.action_timer;
    }
  });

  network.on('gameOver', (data) => {
    game_state = STATE_GAME_OVER;
    win.gameOver();

    var message = 'Game Over! ';
    if (data.winner === myPlayerNumber) {
      message += 'You won!';
    } else {
      message += 'You lost!';
    }

    $('#status').text(message).show();

    setTimeout(() => {
      network.disconnect();
      location.reload();
    }, 5000);
  });

  network.on('opponentDisconnected', () => {
    $('#status').text('Opponent disconnected!').show();
    game_state = STATE_GAME_OVER;

    setTimeout(() => {
      network.disconnect();
      location.reload();
    }, 3000);
  });
}

function startLocalMode() {
  gameMode = 'local';
  $('#menu').hide();
  resetGameState();
}

function KeyWatcher() {
  this.keys = {}
  this.lastKey = undefined;
  
  this.down = function(key) {
    this.keys[key] = true;
    this.lastKey = key;
  }

  this.up = function(key) {
    this.keys[key] = false;
  }
  
  this.isPressed = function(key) {
    return this.keys[key];
  }
}

$(document).ready(function() {
  win = new Window(800, 600);
  keys = new KeyWatcher();

  // Set up mode selection buttons
  $('#local-btn').click(function() {
    startLocalMode();
  });

  $('#online-btn').click(function() {
    startOnlineMode();
  });

  $(document).keydown(function(event) {
    if (!keys) return;

    // What a horrible hack, only allow the players to when the key is pressed
    // down and ignore hold down jump keys.
    if (event.which == KEY_W && !keys.isPressed(KEY_W)) {
      if (player1 && gameMode === 'local') player1.jump();
    }
    if (event.which == KEY_UP && !keys.isPressed(KEY_UP)) {
      if (player2 && gameMode === 'local') player2.jump();
    }

    keys.down(event.which);
    if (event.which == KEY_P) {
      DEBUG=!DEBUG;
      $('#debug').text('');
    }
    if (event.which == KEY_O) {
      if (win) win.should_scroll = !win.should_scroll;
    }
    if (event.which == KEY_ESC) { // Stop the game (helpful when developing)
      clearInterval(interval);
    }
  });

  $(document).keyup(function(event) {
    if (keys) keys.up(event.which);
  });

  interval = setInterval(update, 30);
});
