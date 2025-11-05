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

// Seeded random number generator (Mulberry32) - matches server implementation
function SeededRandom(seed) {
  this.seed = seed;

  this.random = function() {
    var t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Platform structure: {x, y, width, height}
function buildStaticLevel_(seed) {
  var rng = new SeededRandom(seed);

  // Static level with platforms - sized to fit viewport without scrolling
  var levelData = {
    width: 800,  // Smaller arena that fits on screen
    height: 600,
    groundHeight: 50,  // Base ground height
    platforms: []
  };

  // Generate fewer random platforms for smaller arena
  var numPlatforms = 3 + Math.floor(rng.random() * 2); // 3-4 platforms

  for (var i = 0; i < numPlatforms; i++) {
    var platform = {
      x: 100 + rng.random() * (levelData.width - 300),  // Random x position
      y: 150 + rng.random() * 250,  // Random height (150-400)
      width: 100 + rng.random() * 150,  // Random width (100-250)
      height: 20  // Fixed platform thickness
    };
    levelData.platforms.push(platform);
  }

  return levelData;
}

function Level(seed) {
  // Generate terrain from seed (or create random seed for local mode)
  this.seed = seed || Math.floor(Math.random() * 1000000);
  this.levelData = buildStaticLevel_(this.seed);
  this.BLOCK_SIZE = 100;

  this.image1_ = new Image();
  $(this.image1_).attr('src', 'ground1.png');
  this.image2_ = new Image();
  $(this.image2_).attr('src', 'ground2.png');

  // Draw the entire static level
  this.drawLevel = function(context) {
    // Draw ground
    var groundY = this.levelData.groundHeight;
    var numBlocks = Math.ceil(this.levelData.width / this.BLOCK_SIZE);

    for (var i = 0; i < numBlocks; i++) {
      var image = (i % 2) ? this.image1_ : this.image2_;
      context.drawImage(image, 0, 0, 100, 600,
        i * this.BLOCK_SIZE, groundY - 600, 100, 600);
    }

    // Draw platforms using the same grass texture
    for (var i = 0; i < this.levelData.platforms.length; i++) {
      var platform = this.levelData.platforms[i];
      this.drawPlatform(context, platform);
    }
  }

  this.drawPlatform = function(context, platform) {
    // Draw platform using grass texture
    var numBlocks = Math.ceil(platform.width / this.BLOCK_SIZE);

    for (var i = 0; i < numBlocks; i++) {
      var image = (i % 2) ? this.image1_ : this.image2_;
      var blockX = platform.x + i * this.BLOCK_SIZE;
      var blockWidth = Math.min(this.BLOCK_SIZE, platform.width - i * this.BLOCK_SIZE);

      // Draw scaled grass texture
      context.drawImage(image, 0, 0, 100, 600,
        blockX, platform.y - 600, blockWidth, 600);
    }
  }

  // Get height at position (supports both ground and platforms)
  this.getHeightAtPoint = function(x) {
    // Check if player is on a platform
    for (var i = 0; i < this.levelData.platforms.length; i++) {
      var platform = this.levelData.platforms[i];
      if (x >= platform.x && x <= platform.x + platform.width) {
        return platform.y + platform.height;
      }
    }

    // Return ground height
    return this.levelData.groundHeight;
  }

  // Check if position is on a platform (for more precise collision)
  this.getPlatformAt = function(x, y) {
    for (var i = 0; i < this.levelData.platforms.length; i++) {
      var platform = this.levelData.platforms[i];
      if (x >= platform.x &&
          x <= platform.x + platform.width &&
          y >= platform.y &&
          y <= platform.y + platform.height + 10) {  // Small tolerance
        return platform;
      }
    }
    return null;
  }

  // Get all platforms (for collision detection)
  this.getPlatforms = function() {
    return this.levelData.platforms;
  }

  // Get level bounds
  this.getWidth = function() {
    return this.levelData.width;
  }

  this.getHeight = function() {
    return this.levelData.height;
  }

  this.getGroundHeight = function() {
    return this.levelData.groundHeight;
  }
}
