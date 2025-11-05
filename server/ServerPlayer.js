// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Server-side player physics and state (authoritative)
class ServerPlayer {
  constructor(playerNumber, level, x, y, characterData) {
    this.playerNumber = playerNumber;
    this.level = level;

    // Position and velocity
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;

    // Apply character stats or use defaults
    const stats = (characterData && characterData.stats) ? characterData.stats : {};
    this.health = stats.health || 100;
    this.maxHealth = stats.health || 100;
    this.characterData = characterData;

    this.facing_right = playerNumber === 1;

    // Action state
    this.action = 'idle';
    this.action_timer = 0;

    // Jump state
    this.airborne_time = 0;
    this.can_jump = true;

    // Constants - use character stats or defaults
    this.MAX_SPEED = stats.maxSpeed || 0.3;
    this.ACCELERATION = stats.acceleration || 0.05;
    this.DECAY = 0.02;
    this.GRAVITY = 0.03;
    this.JUMP_VELOCITY = stats.jumpVelocity || 0.4;
    this.JUMP_TIME = 800;

    // Combat constants
    this.PUNCH_RANGE = stats.punchRange || 70;
    this.PUNCH_DAMAGE = stats.punchDamage || 5;
    this.THROW_RANGE = stats.throwRange || 70;
    this.THROW_DAMAGE = stats.throwDamage || 7;

    // Pit damage
    this.PIT_DAMAGE = 0.1; // per millisecond

    // Projectile support
    this.projectiles = [];
    this.lastProjectileTime = 0;
    this.projectileData = (characterData && characterData.projectile) ? characterData.projectile : null;

    // Input state
    this.input = {
      left: false,
      right: false,
      jump: false,
      punch: false,
      throw: false,
      block: false,
      projectile: false
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
      if (this.input.projectile && this.action === 'idle') {
        this.fireProjectile(Date.now());
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

    // Update projectiles
    this.updateProjectiles(dt, opponent);

    // Check pit damage
    if (this.y < -100) {
      this.health -= this.PIT_DAMAGE * dt;
    }
  }

  updateProjectiles(dt, opponent) {
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const projectile = this.projectiles[i];

      // Update projectile age and position
      projectile.age += dt;
      projectile.x += projectile.dx * dt;
      projectile.y += projectile.dy * dt;

      // Check lifetime
      if (projectile.age > projectile.lifetime) {
        projectile.active = false;
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check bounds
      if (projectile.x < 0 || projectile.x > this.level.getWidth() || projectile.y < -100) {
        projectile.active = false;
        this.projectiles.splice(i, 1);
        continue;
      }

      // Check collision with opponent
      if (opponent) {
        const hitbox = this.checkProjectileCollision(projectile, opponent);
        if (hitbox) {
          opponent.hit(projectile.damage);
          projectile.active = false;
          this.projectiles.splice(i, 1);
        }
      }
    }
  }

  checkProjectileCollision(projectile, opponent) {
    const SPRITE_HALF_WIDTH = 48;
    const playerLeft = opponent.x - SPRITE_HALF_WIDTH;
    const playerRight = opponent.x + SPRITE_HALF_WIDTH;
    const playerBottom = opponent.y;
    const playerTop = opponent.y + 96;

    const projLeft = projectile.x - projectile.width / 2;
    const projRight = projectile.x + projectile.width / 2;
    const projBottom = projectile.y - projectile.height / 2;
    const projTop = projectile.y + projectile.height / 2;

    return (
      projRight > playerLeft &&
      projLeft < playerRight &&
      projTop > playerBottom &&
      projBottom < playerTop
    );
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

  fireProjectile(currentTime) {
    // Only fire if character has projectile ability
    if (!this.projectileData) {
      return null;
    }

    // Check cooldown
    const cooldown = this.projectileData.cooldown || 1000;
    if (currentTime - this.lastProjectileTime < cooldown) {
      return null;
    }

    // Create projectile at player position, slightly in front
    const direction = this.facing_right ? 1 : -1;
    const offsetX = direction * 30;
    const projectile = {
      id: `${this.playerNumber}_${currentTime}`,
      x: this.x + offsetX,
      y: this.y + 48,
      dx: direction * (this.projectileData.speed || 0.5),
      dy: 0,
      width: this.projectileData.width || 20,
      height: this.projectileData.height || 20,
      damage: this.projectileData.damage || 5,
      color: this.projectileData.color || '#FFD700',
      lifetime: this.projectileData.lifetime || 3000,
      age: 0,
      active: true,
      owner: this.playerNumber
    };

    this.projectiles.push(projectile);
    this.lastProjectileTime = currentTime;

    return projectile;
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
      action_timer: this.action_timer,
      projectiles: this.projectiles.map(p => ({
        id: p.id,
        x: p.x,
        y: p.y,
        width: p.width,
        height: p.height,
        color: p.color,
        active: p.active
      }))
    };
  }
}

module.exports = ServerPlayer;
