// Copyright 2025 - HTML5 Fighting Game Multiplayer
// Licensed under the Apache License, Version 2.0

// Server-side level generation (same algorithm as client)
class ServerLevel {
  constructor() {
    this.heights = [];
    this.generate();
  }

  generate() {
    this.heights = [];
    let height = 100;
    let change = 0;

    for (let i = 0; i < 5000; i++) {
      change += (Math.random() - 0.5) * 20;
      change = Math.max(-50, Math.min(50, change));
      height += change;
      height = Math.max(0, Math.min(400, height));

      // Randomly create holes
      if (Math.random() < 0.01) {
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

  // Serialize level data for clients
  serialize() {
    return {
      heights: this.heights
    };
  }
}

module.exports = ServerLevel;
