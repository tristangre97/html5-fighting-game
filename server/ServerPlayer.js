// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Server-side player physics and state (authoritative)
class ServerPlayer {
  constructor(playerNumber, level, x, y) {
    this.playerNumber = playerNumber;
    this.level = level;

    // Position and velocity
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;

    // Game state
    this.health = 100;
    this.facing_right = playerNumber === 1;

    // Action state
    this.action = 'idle';
    this.action_timer = 0;

    // Jump state
    this.airborne_time = 0;
    this.can_jump = true;

    // Constants
    this.MAX_SPEED = 0.3;
    this.ACCELERATION = 0.05;
    this.DECAY = 0.02;
    this.GRAVITY = 0.03;
    this.JUMP_VELOCITY = 0.4;
    this.JUMP_TIME = 800;

    // Combat constants
    this.PUNCH_RANGE = 70;
    this.PUNCH_DAMAGE = 5;
    this.THROW_RANGE = 70;
    this.THROW_DAMAGE = 7;

    // Pit damage
    this.PIT_DAMAGE = 0.1; // per millisecond

    // Input state
    this.input = {
      left: false,
      right: false,
      jump: false,
      punch: false,
      throw: false,
      block: false
    };
  }

  updateInput(input) {
    this.input = { ...this.input, ...input };
  }

  update(dt, opponent) {
    // Normalize dt to 60 FPS baseline for frame-rate independent physics
    const dtScale = dt / 16.67;

    // Update action timer
    if (this.action_timer > 0) {
      this.action_timer -= dt;
      if (this.action_timer <= 0) {
        this.setAction('idle');
      }
    }

    // Handle input (only if idle or blocking)
    if (this.action === 'idle' || this.action === 'block') {
      if (this.input.left) {
        this.moveLeft(dtScale);
      }
      if (this.input.right) {
        this.moveRight(dtScale);
      }
      if (this.input.jump && this.can_jump) {
        this.jump();
      }
      if (this.input.punch && this.action === 'idle') {
        this.punch(opponent);
      }
      if (this.input.throw && this.action === 'idle') {
        this.throw_em(opponent);
      }

      // Update facing direction based on opponent
      if (opponent) {
        this.facing_right = opponent.x > this.x;
      }

      // Handle blocking
      const should_block = this.input.block &&
                          opponent &&
                          ((this.facing_right && this.input.left) ||
                           (!this.facing_right && this.input.right));
      this.block(should_block);
    }

    // Apply physics
    this.applyPhysics(dt);

    // Check pit damage
    if (this.y < -100) {
      this.health -= this.PIT_DAMAGE * dt;
    }
  }

  applyPhysics(dt) {
    // Normalize dt to 60 FPS baseline (16.67ms) for frame-rate independent physics
    const dtScale = dt / 16.67;

    // Apply gravity
    this.dy -= this.GRAVITY * dtScale;

    // Update position
    this.x += this.dx * dt;
    this.y += this.dy * dt;

    // Ground collision
    const ground = this.level.heightAt(this.x);
    if (this.y <= ground) {
      this.y = ground;
      this.dy = 0;
      this.airborne_time = 0;
      this.can_jump = true;
    } else {
      this.airborne_time += dt;
      if (this.airborne_time > this.JUMP_TIME) {
        this.can_jump = false;
      }
    }

    // Apply friction
    if (this.dx > 0) {
      this.dx = Math.max(0, this.dx - this.DECAY * dtScale);
    } else if (this.dx < 0) {
      this.dx = Math.min(0, this.dx + this.DECAY * dtScale);
    }
  }

  moveLeft(dtScale = 1.0) {
    if (this.action !== 'idle' && this.action !== 'block') return;
    this.dx = Math.max(-this.MAX_SPEED, this.dx - this.ACCELERATION * dtScale);
  }

  moveRight(dtScale = 1.0) {
    if (this.action !== 'idle' && this.action !== 'block') return;
    this.dx = Math.min(this.MAX_SPEED, this.dx + this.ACCELERATION * dtScale);
  }

  jump() {
    if (!this.can_jump) return;
    if (this.action !== 'idle' && this.action !== 'block') return;

    this.dy = this.JUMP_VELOCITY;
    this.can_jump = false;
  }

  punch(opponent) {
    if (!opponent) return;

    const distance = Math.abs(this.x - opponent.x);
    if (distance <= this.PUNCH_RANGE) {
      this.setAction('punch');
      opponent.hit(this.PUNCH_DAMAGE);
      return true;
    }
    return false;
  }

  throw_em(opponent) {
    if (!opponent) return;

    const distance = Math.abs(this.x - opponent.x);
    if (distance <= this.THROW_RANGE) {
      this.setAction('throw');
      opponent.thrown(this.THROW_DAMAGE);
      return true;
    }
    return false;
  }

  hit(damage) {
    if (this.action === 'block') {
      return; // Blocked!
    }

    this.health -= damage;
    this.setAction('pain');
  }

  thrown(damage) {
    if (this.action === 'block') {
      return; // Blocked!
    }

    this.health -= damage;
    this.setAction('thrown');

    // Knockback
    if (this.facing_right) {
      this.x -= 5;
    } else {
      this.x += 5;
    }
  }

  block(should_block) {
    if (should_block && this.action === 'idle') {
      this.setAction('block');
    } else if (!should_block && this.action === 'block') {
      this.setAction('idle');
    }
  }

  setAction(action) {
    this.action = action;

    switch (action) {
      case 'idle':
        this.action_timer = 0;
        break;
      case 'punch':
        this.action_timer = 250;
        break;
      case 'throw':
        this.action_timer = 600;
        break;
      case 'block':
        this.action_timer = 250;
        break;
      case 'pain':
        this.action_timer = 200;
        break;
      case 'thrown':
        this.action_timer = 600;
        break;
    }
  }

  isAlive() {
    return this.health > 0;
  }

  // Serialize player state for network transmission
  serialize() {
    return {
      playerNumber: this.playerNumber,
      x: this.x,
      y: this.y,
      dx: this.dx,
      dy: this.dy,
      health: this.health,
      facing_right: this.facing_right,
      action: this.action,
      action_timer: this.action_timer
    };
  }
}

module.exports = ServerPlayer;
