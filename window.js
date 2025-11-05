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

  this.scroll_speed = .1;
  this.should_scroll = true;
  this.scroll_location = 0;

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
  this.should_scroll = false;
  $('#game_over').show();
};


Window.prototype.reset = function() {
  this.should_scroll = false;
  this.scroll_location = 0;
  $('#game_over').hide();
  $('#fight').show();
  // Ensure canvas is properly sized after reset
  setTimeout(() => this.resize(), 100);
};

Window.prototype.startGame = function() {
  this.should_scroll = true;
  $('#fight').hide();
}

Window.prototype.getContext = function() {
  return $('#canvas').get(0).getContext('2d');
};

Window.prototype.top = function() {
  return this.height - ORIGIN_VERTICAL_OFFSET;
};

Window.prototype.right = function() {
  return this.scroll_location + this.width;
};

Window.prototype.update = function(dt) {
  if (this.should_scroll) {
    this.scroll_location += dt * this.scroll_speed;
  }
  
  // Don't let the players past the left edge of the screen
  var min_player_x = this.scroll_location + SPRITE_HALF_WIDTH;
  if (player1.x < min_player_x) {
    player1.x = min_player_x;
  }
  if (player2.x < min_player_x) {
    player2.x = min_player_x;
  }
}

Window.prototype.drawPlayer = function(player) {
  var x = player.x - this.scroll_location;
  var y = player.y;
  player.sprite.drawAt(this.context, x, player.y, !player.facing_right);

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

Window.prototype.draw = function() {
  // Sky
  for (var i=0; i <= this.width; i += 200) {
    this.context.drawImage(this.sky_, 0, 0, 200, 600, 
        i - (this.scroll_location % 200), -ORIGIN_VERTICAL_OFFSET, 200, 600);
  }
  
  // Ground
  level.drawLevel(this.context, parseInt(this.scroll_location), this.width);

  // Sprites
  this.drawPlayer(player1);
  this.drawPlayer(player2);

  // HUD
  this.drawHealth(10, this.top() - 20, player1);
  this.drawHealth(this.width - 110, this.top() - 20, player2);
}
 
Window.prototype.drawHealth = function(x, y, player) {
  this.context.fillStyle = '#FF0';
  this.context.strokeStyle = '#FF0';
  this.context.strokeRect(x, y, 100, 10);
  this.context.fillRect(x, y, player.health, 10);
}


