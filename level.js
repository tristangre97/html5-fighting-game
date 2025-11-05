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

function buildLevel_(seed) {
  var level = [];
  var rng = new SeededRandom(seed);
  var height = 100;
  var change = 0;

  for (var i = 0; i < 5000; i++) {
    change += (rng.random() - 0.5) * 20;
    change = Math.max(-50, Math.min(50, change));
    height += change;
    height = Math.max(0, Math.min(400, height));

    // Randomly create holes
    if (rng.random() < 0.01) {
      level.push(-100);
    } else {
      level.push(height);
    }
  }
  return level;
}

function Level(seed) {
  // Generate terrain from seed (or create random seed for local mode)
  this.seed = seed || Math.floor(Math.random() * 1000000);
  this.level = buildLevel_(this.seed);
  this.BLOCK_SIZE=100;


  this.image1_ = new Image();
  $(this.image1_).attr('src', 'ground1.png');
  this.image2_ = new Image();
  $(this.image2_).attr('src', 'ground2.png');

  this.drawLevel = function(context, left_x, width) {
    for (var x = left_x; x <= left_x + width; x += this.BLOCK_SIZE) {
      var index = this.pixelToHeightIndex_(x);
      var height = this.getHeightAtPoint(x);
      var image;
      if (index % 2) { image = this.image1_ } else { image = this.image2_};
      context.drawImage(image, 0, 0, 100, 600, 
         index * this.BLOCK_SIZE - left_x, height - 600, 100, 600);
    }
  }
  
  this.getHeightAtPoint = function(x) {
    var index = this.pixelToHeightIndex_(x);
    return this.level[index];
  }
  
  this.pixelToHeightIndex_ = function(x) {
    return parseInt(x / this.BLOCK_SIZE);
  }
}
