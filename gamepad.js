// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Gamepad Manager for controller support
class GamepadManager {
  constructor() {
    this.gamepads = {};
    this.buttonStates = {};
    this.previousButtonStates = {};

    // Button mappings (standard gamepad layout)
    this.BUTTON_A = 0;        // Jump
    this.BUTTON_B = 1;        // Punch
    this.BUTTON_X = 2;        // Throw
    this.BUTTON_Y = 3;        // Block
    this.BUTTON_LB = 4;
    this.BUTTON_RB = 5;
    this.BUTTON_LT = 6;
    this.BUTTON_RT = 7;
    this.BUTTON_SELECT = 8;
    this.BUTTON_START = 9;
    this.BUTTON_L_STICK = 10;
    this.BUTTON_R_STICK = 11;
    this.BUTTON_DPAD_UP = 12;
    this.BUTTON_DPAD_DOWN = 13;
    this.BUTTON_DPAD_LEFT = 14;
    this.BUTTON_DPAD_RIGHT = 15;

    // Axis mappings
    this.AXIS_LEFT_STICK_X = 0;
    this.AXIS_LEFT_STICK_Y = 1;
    this.AXIS_RIGHT_STICK_X = 2;
    this.AXIS_RIGHT_STICK_Y = 3;

    // Deadzone for analog sticks
    this.DEADZONE = 0.2;

    // Connected gamepads
    this.connectedGamepads = [];

    // Set up event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    window.addEventListener('gamepadconnected', (e) => {
      console.log('Gamepad connected:', e.gamepad.id);
      this.connectedGamepads[e.gamepad.index] = e.gamepad;
      this.showGamepadNotification('Controller connected: ' + e.gamepad.id);
    });

    window.addEventListener('gamepaddisconnected', (e) => {
      console.log('Gamepad disconnected:', e.gamepad.id);
      delete this.connectedGamepads[e.gamepad.index];
      this.showGamepadNotification('Controller disconnected');
    });
  }

  showGamepadNotification(message) {
    // Create a temporary notification
    var notification = $('<div>')
      .text(message)
      .css({
        position: 'fixed',
        top: '10px',
        right: '10px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '10px 20px',
        borderRadius: '5px',
        zIndex: 10000,
        fontSize: '14px'
      });

    $('body').append(notification);

    setTimeout(() => {
      notification.fadeOut(300, function() {
        $(this).remove();
      });
    }, 3000);
  }

  update() {
    // Poll gamepad state (required by Gamepad API)
    var gamepads = navigator.getGamepads ? navigator.getGamepads() :
                   (navigator.webkitGetGamepads ? navigator.webkitGetGamepads() : []);

    // Update connected gamepads
    for (var i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        this.connectedGamepads[i] = gamepads[i];
      }
    }

    // Store previous button states
    this.previousButtonStates = JSON.parse(JSON.stringify(this.buttonStates));
  }

  getGamepad(playerNumber) {
    // Player 1 uses gamepad 0, Player 2 uses gamepad 1
    var index = playerNumber - 1;
    return this.connectedGamepads[index];
  }

  isButtonPressed(playerNumber, button) {
    var gamepad = this.getGamepad(playerNumber);
    if (!gamepad) return false;

    if (gamepad.buttons[button]) {
      return gamepad.buttons[button].pressed;
    }
    return false;
  }

  isButtonJustPressed(playerNumber, button) {
    var gamepad = this.getGamepad(playerNumber);
    if (!gamepad) return false;

    var key = playerNumber + '_' + button;
    var currentPressed = gamepad.buttons[button] && gamepad.buttons[button].pressed;
    var previousPressed = this.previousButtonStates[key] || false;

    this.buttonStates[key] = currentPressed;

    return currentPressed && !previousPressed;
  }

  getAxisValue(playerNumber, axis) {
    var gamepad = this.getGamepad(playerNumber);
    if (!gamepad) return 0;

    var value = gamepad.axes[axis] || 0;

    // Apply deadzone
    if (Math.abs(value) < this.DEADZONE) {
      return 0;
    }

    return value;
  }

  getInput(playerNumber) {
    var gamepad = this.getGamepad(playerNumber);
    if (!gamepad) {
      return {
        left: false,
        right: false,
        jump: false,
        punch: false,
        throw: false,
        block: false,
        justJumped: false
      };
    }

    // Get analog stick input
    var leftStickX = this.getAxisValue(playerNumber, this.AXIS_LEFT_STICK_X);

    // Get button input
    var left = this.isButtonPressed(playerNumber, this.BUTTON_DPAD_LEFT) || leftStickX < -0.5;
    var right = this.isButtonPressed(playerNumber, this.BUTTON_DPAD_RIGHT) || leftStickX > 0.5;
    var jump = this.isButtonPressed(playerNumber, this.BUTTON_A);
    var justJumped = this.isButtonJustPressed(playerNumber, this.BUTTON_A);
    var punch = this.isButtonPressed(playerNumber, this.BUTTON_B) ||
                this.isButtonPressed(playerNumber, this.BUTTON_RB);
    var throwBtn = this.isButtonPressed(playerNumber, this.BUTTON_X) ||
                   this.isButtonPressed(playerNumber, this.BUTTON_RT);
    var block = this.isButtonPressed(playerNumber, this.BUTTON_Y) ||
                this.isButtonPressed(playerNumber, this.BUTTON_LB);

    return {
      left: left,
      right: right,
      jump: jump,
      punch: punch,
      throw: throwBtn,
      block: block,
      justJumped: justJumped
    };
  }

  hasGamepad(playerNumber) {
    return !!this.getGamepad(playerNumber);
  }

  getConnectedCount() {
    return this.connectedGamepads.filter(gp => gp).length;
  }
}
