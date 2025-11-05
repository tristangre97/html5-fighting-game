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

// Controller and touch support
var gamepadManager = null;
var touchControls = null;
var player1JumpPressed = false;
var player2JumpPressed = false;

// FPS configuration
var TARGET_FPS = 60; // Target 60fps (can be increased to 120)
var FRAME_TIME = 1000 / TARGET_FPS;
var animationFrameId = null;

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
  // Get gamepad input
  var gamepad1Input = null;
  var gamepad2Input = null;

  if (gamepadManager) {
    gamepadManager.update();
    if (gamepadManager.hasGamepad(1)) {
      gamepad1Input = gamepadManager.getInput(1);
    }
    if (gamepadManager.hasGamepad(2)) {
      gamepad2Input = gamepadManager.getInput(2);
    }
  }

  // Player 1 input (keyboard or gamepad 1)
  var p1Left = keys.isPressed(KEY_A) || (gamepad1Input && gamepad1Input.left);
  var p1Right = keys.isPressed(KEY_D) || (gamepad1Input && gamepad1Input.right);
  var p1Punch = keys.isPressed(KEY_R) || (gamepad1Input && gamepad1Input.punch);
  var p1Throw = keys.isPressed(KEY_T) || (gamepad1Input && gamepad1Input.throw);

  if (p1Punch) {
    player1.punch();
  }
  if (p1Throw) {
    player1.throw_em();
  }
  player1.block(false);
  if (p1Left) {
    player1.moveLeft();
    player1.block(player1.facing_right);
  }
  if (p1Right) {
    player1.moveRight();
    player1.block(!player1.facing_right);
  }

  // Player 2 input (keyboard or gamepad 2)
  var p2Left = keys.isPressed(KEY_LEFT) || (gamepad2Input && gamepad2Input.left);
  var p2Right = keys.isPressed(KEY_RIGHT) || (gamepad2Input && gamepad2Input.right);
  var p2Punch = keys.isPressed(KEY_COMMA) || (gamepad2Input && gamepad2Input.punch);
  var p2Throw = keys.isPressed(KEY_PERIOD) || (gamepad2Input && gamepad2Input.throw);

  if (p2Punch) {
    player2.punch();
  }
  if (p2Throw) {
    player2.throw_em();
  }
  player2.block(false);
  if (p2Left) {
    player2.moveLeft();
    player2.block(player2.facing_right);
  }
  if (p2Right) {
    player2.moveRight();
    player2.block(!player2.facing_right);
  }
}

function handleOnlineInput() {
  // Get gamepad input
  var gamepadInput = null;
  if (gamepadManager) {
    gamepadManager.update();
    if (gamepadManager.hasGamepad(1)) {
      gamepadInput = gamepadManager.getInput(1);
    }
  }

  // Get touch input
  var touchInput = null;
  if (touchControls && touchControls.isActive()) {
    touchInput = touchControls.getInput();
  }

  // Collect input state from keyboard, gamepad, or touch
  var inputState = {
    left: keys.isPressed(KEY_A) || keys.isPressed(KEY_LEFT) ||
          (gamepadInput && gamepadInput.left) ||
          (touchInput && touchInput.left),
    right: keys.isPressed(KEY_D) || keys.isPressed(KEY_RIGHT) ||
           (gamepadInput && gamepadInput.right) ||
           (touchInput && touchInput.right),
    jump: keys.isPressed(KEY_W) || keys.isPressed(KEY_UP) ||
          (gamepadInput && gamepadInput.jump) ||
          (touchInput && touchInput.jump),
    punch: keys.isPressed(KEY_R) || keys.isPressed(KEY_COMMA) ||
           (gamepadInput && gamepadInput.punch) ||
           (touchInput && touchInput.punch),
    throw: keys.isPressed(KEY_T) || keys.isPressed(KEY_PERIOD) ||
           (gamepadInput && gamepadInput.throw) ||
           (touchInput && touchInput.throw),
    block: keys.isPressed(KEY_A) || keys.isPressed(KEY_D) ||
           keys.isPressed(KEY_LEFT) || keys.isPressed(KEY_RIGHT) ||
           (gamepadInput && gamepadInput.block) ||
           (touchInput && touchInput.block)
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

function update(timestamp) {
  // Request next frame
  animationFrameId = requestAnimationFrame(update);

  // Calculate delta time
  var now = timestamp || new Date().getTime();
  if (lastTimeStamp == 0) {
    lastTimeStamp = now;
    return;
  }

  var dt = now - lastTimeStamp;

  // Frame rate limiting (optional, comment out for unlimited FPS)
  if (dt < FRAME_TIME) {
    return;
  }

  lastTimeStamp = now;

  if (game_state == STATE_PLAYING) {
    if (gameMode === 'local') {
      // Handle gamepad jump input (must be done here to prevent hold-down)
      if (gamepadManager) {
        var gamepad1Input = gamepadManager.getInput(1);
        var gamepad2Input = gamepadManager.getInput(2);

        if (gamepad1Input && gamepad1Input.justJumped && !player1JumpPressed) {
          if (player1) player1.jump();
          player1JumpPressed = true;
        } else if (!gamepad1Input || !gamepad1Input.jump) {
          player1JumpPressed = false;
        }

        if (gamepad2Input && gamepad2Input.justJumped && !player2JumpPressed) {
          if (player2) player2.jump();
          player2JumpPressed = true;
        } else if (!gamepad2Input || !gamepad2Input.jump) {
          player2JumpPressed = false;
        }
      }

      handleInput();
      player1.update(dt);
      player2.update(dt);

      if (player1.y < -100) {
        player1.health -= dt * PIT_DAMAGE;
      }

      if (player2.y < -100) {
        player2.health -= dt * PIT_DAMAGE;
      }

      // Update health bars
      updateHealthBars();

      if (!player1.isAlive() || !player2.isAlive()) {
        game_state = STATE_GAME_OVER;
        win.gameOver();
        setTimeout(resetGameState, 2000);
      }
    } else if (gameMode === 'online') {
      // In online mode, just send input and render
      // Server handles all game logic
      handleInput();
      updateHealthBars();
    }
  }

  win.update(dt);
  win.draw();

  if (DEBUG) {
    var fps = Math.round(1000 / dt);
    $('#debug').html('FPS: ' + fps + '<br>Key: ' + keys.lastKey).removeClass('hidden');
  }
}

// Update health bar display
function updateHealthBars() {
  if (player1) {
    var p1Health = Math.max(0, Math.round(player1.health));
    $('#p1-health-bar').css('width', p1Health + '%');
    $('#p1-health-text').text(p1Health);
  }
  if (player2) {
    var p2Health = Math.max(0, Math.round(player2.health));
    $('#p2-health-bar').css('width', p2Health + '%');
    $('#p2-health-text').text(p2Health);
  }
}

// Online multiplayer functions
function startOnlineMode() {
  gameMode = 'online';
  network = new NetworkManager();

  $('#menu').hide();
  $('#status').removeClass('hidden').addClass('animate-slideUp');
  $('#status-text').text('Connecting to server...');

  // Show touch controls on mobile
  if (touchControls && touchControls.isMobile) {
    touchControls.show();
  }

  network.connect().then(() => {
    $('#status-text').text('Finding opponent...');
    network.findMatch();
  }).catch((error) => {
    $('#status-text').text('Connection failed: ' + error.message);
    setTimeout(() => {
      $('#menu').show();
      $('#status').addClass('hidden');
    }, 3000);
  });

  // Set up network event handlers
  network.on('waitingForOpponent', () => {
    $('#status-text').text('Waiting for opponent...');
  });

  network.on('matchFound', (data) => {
    console.log('Match found:', data);
    myPlayerNumber = data.playerNumber;
    $('#status-text').text('Match found! Waiting for game to start...');
  });

  network.on('gameStart', (initialState) => {
    console.log('Game starting:', initialState);
    $('#status').addClass('hidden');
    $('#game-hud').removeClass('hidden');

    // Initialize game with server-generated terrain seed
    level = new Level(initialState.level.seed);

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

    $('#status-text').text(message);
    $('#status').removeClass('hidden');

    setTimeout(() => {
      network.disconnect();
      location.reload();
    }, 5000);
  });

  network.on('opponentDisconnected', () => {
    $('#status-text').text('Opponent disconnected!');
    $('#status').removeClass('hidden');
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
  $('#game-hud').removeClass('hidden');

  // Show touch controls on mobile
  if (touchControls && touchControls.isMobile) {
    touchControls.show();
  }

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

  // Initialize gamepad and touch controls
  gamepadManager = new GamepadManager();
  touchControls = new TouchControlsManager();
  touchControls.init();

  // Handle window resize
  var resizeTimeout;
  $(window).resize(function() {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function() {
      if (win) {
        win.resize();
      }
    }, 100);
  });

  // Set up FPS selection
  $('#fps-select').change(function() {
    TARGET_FPS = parseInt($(this).val());
    FRAME_TIME = 1000 / TARGET_FPS;
    console.log('FPS changed to:', TARGET_FPS);
  });

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
      if (!DEBUG) {
        $('#debug').addClass('hidden');
      }
    }
    if (event.which == KEY_O) {
      if (win) win.should_scroll = !win.should_scroll;
    }
    if (event.which == KEY_ESC) { // Stop the game (helpful when developing)
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = null;
      }
    }
  });

  $(document).keyup(function(event) {
    if (keys) keys.up(event.which);
  });

  // Start game loop with requestAnimationFrame for smoother performance
  animationFrameId = requestAnimationFrame(update);
});
