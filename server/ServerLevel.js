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
    this.heights = [];
    this.generate();
  }

  generate() {
    this.heights = [];
    const rng = new SeededRandom(this.seed);
    let height = 100;
    let change = 0;

    for (let i = 0; i < 5000; i++) {
      change += (rng.random() - 0.5) * 20;
      change = Math.max(-50, Math.min(50, change));
      height += change;
      height = Math.max(0, Math.min(400, height));

      // Randomly create holes
      if (rng.random() < 0.01) {
        this.heights.push(-100);
      } else {
        this.heights.push(height);
      }
    }
  }

  heightAt(x) {
    const index = Math.floor(x / 100);
    if (index < 0 || index >= this.heights.length) {
      return 0;
    }
    return this.heights[index];
  }

  // Serialize level data for clients (send seed instead of full array)
  serialize() {
    return {
      seed: this.seed
    };
  }
}

module.exports = ServerLevel;
