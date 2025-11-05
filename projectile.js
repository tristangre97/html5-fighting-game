/*
Copyright 2025 - HTML5 Fighting Game Multiplayer
Licensed under the Apache License, Version 2.0
*/

// Projectile for characters
function Projectile(x, y, direction, ownerPlayer, projectileData) {
  this.x = x;
  this.y = y;
  this.dx = direction * (projectileData.speed || 0.5);
  this.dy = 0;

  this.width = projectileData.width || 20;
  this.height = projectileData.height || 20;
  this.damage = projectileData.damage || 5;
  this.color = projectileData.color || '#FFD700';
  this.lifetime = projectileData.lifetime || 3000; // ms
  this.age = 0;
  this.active = true;
  this.owner = ownerPlayer;
  this.hitPlayers = []; // Track who has been hit

  this.update = function(dt) {
    this.age += dt;

    // Check lifetime
    if (this.age > this.lifetime) {
      this.active = false;
      return;
    }

    // Update position
    this.x += this.dx * dt;
    this.y += this.dy * dt;

    // Check if out of bounds
    if (level) {
      var levelWidth = level.getWidth();
      if (this.x < 0 || this.x > levelWidth || this.y < -100) {
        this.active = false;
      }
    }
  };

  this.checkCollision = function(player) {
    // Don't hit owner
    if (player === this.owner) return false;

    // Don't hit same player twice
    if (this.hitPlayers.indexOf(player) !== -1) return false;

    // Simple bounding box collision
    var playerLeft = player.x - SPRITE_HALF_WIDTH;
    var playerRight = player.x + SPRITE_HALF_WIDTH;
    var playerBottom = player.y;
    var playerTop = player.y + 96;

    var projLeft = this.x - this.width / 2;
    var projRight = this.x + this.width / 2;
    var projBottom = this.y - this.height / 2;
    var projTop = this.y + this.height / 2;

    if (projRight > playerLeft &&
        projLeft < playerRight &&
        projTop > playerBottom &&
        projBottom < playerTop) {

      this.hitPlayers.push(player);
      return true;
    }

    return false;
  };

  this.draw = function(context, cameraX) {
    if (!this.active) return;

    var screenX = this.x - cameraX;

    context.save();
    context.fillStyle = this.color;
    context.strokeStyle = '#000';
    context.lineWidth = 2;

    // Draw projectile as a circle
    context.beginPath();
    context.arc(screenX, this.y, this.width / 2, 0, Math.PI * 2);
    context.fill();
    context.stroke();

    // Add a glow effect
    context.fillStyle = 'rgba(255, 255, 255, 0.5)';
    context.beginPath();
    context.arc(screenX, this.y, this.width / 3, 0, Math.PI * 2);
    context.fill();

    context.restore();
  };
}
