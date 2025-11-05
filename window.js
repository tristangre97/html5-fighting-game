/*
Copyright 2010 Google Inc.
Copyright 2025 - HTML5 Fighting Game Multiplayer

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

var ORIGIN_VERTICAL_OFFSET=100;
var SPRITE_HALF_WIDTH = 96/2;

function Window(width, height) {
  this.baseWidth = width;
  this.baseHeight = height;
  this.width = width;
  this.height = height;

  // Camera for static arena (no scrolling)
  this.cameraX = 0;
  this.cameraY = 0;

  this.canvas = $('#canvas').get(0);
  this.context = null;

  // Initial resize
  this.resize();

  this.sky_ = new Image();
  $(this.sky_).attr('src', 'sky.png');
}

Window.prototype.resize = function() {
  var container = $('#game-container');
  var containerWidth = container.width();
  var containerHeight = container.height();

  // Calculate available space (accounting for HUD and padding)
  var hudHeight = $('#game-hud').is(':visible') ? 100 : 0;
  var availableHeight = containerHeight - hudHeight;

  // Calculate scale to fit screen while maintaining aspect ratio
  var scaleX = containerWidth / this.baseWidth;
  var scaleY = availableHeight / this.baseHeight;
  var scale = Math.min(scaleX, scaleY);

  // Apply scale with a maximum to prevent too large on big screens
  scale = Math.min(scale, 2); // Max 2x scale

  this.width = this.baseWidth;
  this.height = this.baseHeight;

  // Set canvas display size (CSS)
  var displayWidth = Math.floor(this.baseWidth * scale);
  var displayHeight = Math.floor(this.baseHeight * scale);

  this.canvas.style.width = displayWidth + 'px';
  this.canvas.style.height = displayHeight + 'px';

  // Set canvas internal size (actual resolution)
  this.canvas.width = this.baseWidth;
  this.canvas.height = this.baseHeight;

  // Get context and reset transformation
  this.context = this.getContext();

  // Flip y-axis, move camera down so (0, 0) isn't touching bottom of this
  this.context.setTransform(1, 0, 0, -1, 1, 1);
  this.context.translate(0, -this.height + ORIGIN_VERTICAL_OFFSET);
};

Window.prototype.gameOver = function() {
  $('#game_over').show();
};

Window.prototype.reset = function() {
  this.cameraX = 0;
  this.cameraY = 0;
  $('#game_over').hide();
  $('#fight').show();
  // Ensure canvas is properly sized after reset
  setTimeout(() => this.resize(), 100);
};

Window.prototype.startGame = function() {
  $('#fight').hide();
}

Window.prototype.getContext = function() {
  return $('#canvas').get(0).getContext('2d');
};

Window.prototype.top = function() {
  return this.height - ORIGIN_VERTICAL_OFFSET;
};

Window.prototype.right = function() {
  return level ? level.getWidth() : this.width;
};

Window.prototype.update = function(dt) {
  // Update camera to follow players (centered between them)
  if (player1 && player2 && level) {
    var midX = (player1.x + player2.x) / 2;
    var levelWidth = level.getWidth();

    // Center camera on midpoint, but keep within bounds
    this.cameraX = midX - this.width / 2;
    this.cameraX = Math.max(0, Math.min(this.cameraX, levelWidth - this.width));
  }

  // Keep players within level bounds
  if (level) {
    var levelWidth = level.getWidth();
    if (player1.x < SPRITE_HALF_WIDTH) {
      player1.x = SPRITE_HALF_WIDTH;
    }
    if (player1.x > levelWidth - SPRITE_HALF_WIDTH) {
      player1.x = levelWidth - SPRITE_HALF_WIDTH;
    }
    if (player2.x < SPRITE_HALF_WIDTH) {
      player2.x = SPRITE_HALF_WIDTH;
    }
    if (player2.x > levelWidth - SPRITE_HALF_WIDTH) {
      player2.x = levelWidth - SPRITE_HALF_WIDTH;
    }
  }
}

Window.prototype.drawPlayer = function(player) {
  var x = player.x - this.cameraX;
  var y = player.y;
  player.sprite.drawAt(this.context, x, player.y, !player.facing_right);

  // Draw player name above head
  this.drawPlayerName(player, x, y);

  if (DEBUG) {
    // Draw dot at foot location
    this.context.fillStyle = 'white';
    this.context.fillRect(x-3, player.y-3, 6, 6);

    // Hit box
    this.context.strokeStyle = 'white';
    this.context.fillStyle = 'rgba(255, 255, 0, .5)';
    this.context.beginPath();
    this.context.moveTo(x + player.PUNCH_RANGE/2, player.y);
    this.context.lineTo(x + player.PUNCH_RANGE/2, player.y + 96);
    this.context.lineTo(x - player.PUNCH_RANGE/2, player.y + 96);
    this.context.lineTo(x - player.PUNCH_RANGE/2, player.y);
    this.context.closePath();
    this.context.stroke();
    this.context.fill();
  };
}

Window.prototype.drawPlayerName = function(player, x, y) {
  if (!player.name) return;

  // Save current context state
  this.context.save();

  // Reset transformation for text (so it's not flipped)
  this.context.setTransform(1, 0, 0, 1, 0, 0);

  // Calculate position above player's head
  // Account for the flipped y-axis and vertical offset
  var nameX = x;
  var nameY = this.canvas.height - (y + 120 - ORIGIN_VERTICAL_OFFSET);

  // Set text properties
  this.context.font = 'bold 14px Arial';
  this.context.textAlign = 'center';
  this.context.textBaseline = 'bottom';

  // Measure text for background
  var textWidth = this.context.measureText(player.name).width;
  var padding = 6;
  var bgWidth = textWidth + padding * 2;
  var bgHeight = 20;

  // Draw background with semi-transparent black
  this.context.fillStyle = 'rgba(0, 0, 0, 0.6)';
  this.context.fillRect(nameX - bgWidth/2, nameY - bgHeight, bgWidth, bgHeight);

  // Draw border
  this.context.strokeStyle = 'rgba(255, 255, 255, 0.8)';
  this.context.lineWidth = 2;
  this.context.strokeRect(nameX - bgWidth/2, nameY - bgHeight, bgWidth, bgHeight);

  // Draw text with white color
  this.context.fillStyle = '#FFFFFF';
  this.context.fillText(player.name, nameX, nameY - 3);

  // Restore context state
  this.context.restore();
}

Window.prototype.draw = function() {
  // Save context and apply camera transform
  this.context.save();
  this.context.translate(-this.cameraX, 0);

  // Sky (repeating background)
  for (var i = Math.floor(this.cameraX / 200) * 200; i <= this.cameraX + this.width; i += 200) {
    this.context.drawImage(this.sky_, 0, 0, 200, 600,
      i, -ORIGIN_VERTICAL_OFFSET, 200, 600);
  }

  // Draw static level with platforms
  level.drawLevel(this.context);

  // Sprites
  this.drawPlayer(player1);
  this.drawPlayer(player2);

  // Draw projectiles
  if (player1 && player1.projectiles) {
    for (var i = 0; i < player1.projectiles.length; i++) {
      player1.projectiles[i].draw(this.context, this.cameraX);
    }
  }
  if (player2 && player2.projectiles) {
    for (var i = 0; i < player2.projectiles.length; i++) {
      player2.projectiles[i].draw(this.context, this.cameraX);
    }
  }

  // Restore context (remove camera transform for HUD)
  this.context.restore();

  // HUD (drawn in screen space, not world space)
  this.drawHealth(10, this.top() - 20, player1);
  this.drawHealth(this.width - 110, this.top() - 20, player2);
}
 
Window.prototype.drawHealth = function(x, y, player) {
  this.context.fillStyle = '#FF0';
  this.context.strokeStyle = '#FF0';
  this.context.strokeRect(x, y, 100, 10);
  this.context.fillRect(x, y, player.health, 10);
}


