// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Touch Controls Manager for mobile devices
class TouchControlsManager {
  constructor() {
    this.touches = {};
    this.activeButtons = new Set();
    this.enabled = false;

    // Virtual joystick state
    this.joystick = {
      active: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      identifier: null
    };

    // Check if device is mobile
    this.isMobile = this.checkIfMobile();
  }

  checkIfMobile() {
    // Check for mobile device
    var mobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    var touchCapable = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    return mobile || (touchCapable && window.innerWidth < 1024);
  }

  init() {
    if (!this.isMobile) {
      // Hide touch controls on desktop
      $('#touch-controls').hide();
      return;
    }

    this.enabled = true;
    $('#touch-controls').show();

    this.setupTouchListeners();
  }

  setupTouchListeners() {
    // Prevent default touch behavior
    document.addEventListener('touchmove', (e) => {
      if (this.enabled) {
        e.preventDefault();
      }
    }, { passive: false });

    // Virtual joystick
    var joystickArea = document.getElementById('joystick-area');
    if (joystickArea) {
      joystickArea.addEventListener('touchstart', (e) => this.handleJoystickStart(e));
      joystickArea.addEventListener('touchmove', (e) => this.handleJoystickMove(e));
      joystickArea.addEventListener('touchend', (e) => this.handleJoystickEnd(e));
      joystickArea.addEventListener('touchcancel', (e) => this.handleJoystickEnd(e));
    }

    // Action buttons
    this.setupButton('btn-jump', 'jump');
    this.setupButton('btn-punch', 'punch');
    this.setupButton('btn-throw', 'throw');
    this.setupButton('btn-block', 'block');
  }

  setupButton(elementId, action) {
    var button = document.getElementById(elementId);
    if (!button) return;

    button.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.activeButtons.add(action);
      button.classList.add('active');
    });

    button.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.activeButtons.delete(action);
      button.classList.remove('active');
    });

    button.addEventListener('touchcancel', (e) => {
      e.preventDefault();
      this.activeButtons.delete(action);
      button.classList.remove('active');
    });
  }

  handleJoystickStart(e) {
    e.preventDefault();

    var touch = e.changedTouches[0];
    this.joystick.active = true;
    this.joystick.identifier = touch.identifier;
    this.joystick.startX = touch.clientX;
    this.joystick.startY = touch.clientY;
    this.joystick.currentX = touch.clientX;
    this.joystick.currentY = touch.clientY;

    this.updateJoystickVisual();
  }

  handleJoystickMove(e) {
    e.preventDefault();

    if (!this.joystick.active) return;

    for (var i = 0; i < e.changedTouches.length; i++) {
      var touch = e.changedTouches[i];
      if (touch.identifier === this.joystick.identifier) {
        this.joystick.currentX = touch.clientX;
        this.joystick.currentY = touch.clientY;
        this.updateJoystickVisual();
        break;
      }
    }
  }

  handleJoystickEnd(e) {
    e.preventDefault();

    for (var i = 0; i < e.changedTouches.length; i++) {
      var touch = e.changedTouches[i];
      if (touch.identifier === this.joystick.identifier) {
        this.joystick.active = false;
        this.joystick.identifier = null;
        this.updateJoystickVisual();
        break;
      }
    }
  }

  updateJoystickVisual() {
    var stick = document.getElementById('joystick-stick');
    if (!stick) return;

    if (!this.joystick.active) {
      stick.style.transform = 'translate(-50%, -50%)';
      return;
    }

    var dx = this.joystick.currentX - this.joystick.startX;
    var dy = this.joystick.currentY - this.joystick.startY;

    // Limit stick movement to base radius
    var maxDistance = 40;
    var distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > maxDistance) {
      dx = dx / distance * maxDistance;
      dy = dy / distance * maxDistance;
    }

    stick.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
  }

  getJoystickDirection() {
    if (!this.joystick.active) {
      return { x: 0, y: 0 };
    }

    var dx = this.joystick.currentX - this.joystick.startX;
    var dy = this.joystick.currentY - this.joystick.startY;

    var distance = Math.sqrt(dx * dx + dy * dy);

    // Normalize and apply deadzone
    if (distance < 10) {
      return { x: 0, y: 0 };
    }

    return {
      x: dx / distance,
      y: dy / distance
    };
  }

  getInput() {
    var direction = this.getJoystickDirection();

    return {
      left: direction.x < -0.3,
      right: direction.x > 0.3,
      jump: this.activeButtons.has('jump'),
      punch: this.activeButtons.has('punch'),
      throw: this.activeButtons.has('throw'),
      block: this.activeButtons.has('block')
    };
  }

  isActive() {
    return this.enabled && this.isMobile;
  }

  show() {
    if (this.isMobile) {
      $('#touch-controls').show();
      this.enabled = true;
    }
  }

  hide() {
    $('#touch-controls').hide();
    this.enabled = false;
    this.activeButtons.clear();
    this.joystick.active = false;
  }
}
