// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Seeded random number generator (Mulberry32)
class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }

  random() {
    let t = this.seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

// Server-side level generation (seeded for reproducibility)
class ServerLevel {
  constructor(seed) {
    this.seed = seed || Math.floor(Math.random() * 1000000);
    this.generate();
  }

  generate() {
    const rng = new SeededRandom(this.seed);

    // Static level with platforms - sized to fit viewport without scrolling (matches client)
    this.levelData = {
      width: 800,
      height: 600,
      groundHeight: 50,
      platforms: []
    };

    // Generate fewer random platforms for smaller arena
    const numPlatforms = 3 + Math.floor(rng.random() * 2); // 3-4 platforms

    for (let i = 0; i < numPlatforms; i++) {
      const platform = {
        x: 100 + rng.random() * (this.levelData.width - 300),
        y: 150 + rng.random() * 250,
        width: 100 + rng.random() * 150,
        height: 20
      };
      this.levelData.platforms.push(platform);
    }
  }

  heightAt(x) {
    // Check if position is on a platform
    for (const platform of this.levelData.platforms) {
      if (x >= platform.x && x <= platform.x + platform.width) {
        return platform.y + platform.height;
      }
    }

    // Return ground height
    return this.levelData.groundHeight;
  }

  getPlatformAt(x, y) {
    for (const platform of this.levelData.platforms) {
      if (x >= platform.x &&
          x <= platform.x + platform.width &&
          y >= platform.y &&
          y <= platform.y + platform.height + 10) {
        return platform;
      }
    }
    return null;
  }

  getPlatforms() {
    return this.levelData.platforms;
  }

  getWidth() {
    return this.levelData.width;
  }

  getHeight() {
    return this.levelData.height;
  }

  getGroundHeight() {
    return this.levelData.groundHeight;
  }

  // Serialize level data for clients (send seed instead of full array)
  serialize() {
    return {
      seed: this.seed
    };
  }
}

module.exports = ServerLevel;
