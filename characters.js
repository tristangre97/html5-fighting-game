/*
Copyright 2025 - HTML5 Fighting Game Multiplayer
Licensed under the Apache License, Version 2.0
*/

// Character Manager - Handles loading and managing character data
var CharacterManager = (function() {
  var characters = [];
  var loaded = false;
  var callbacks = [];

  function loadCharacters(callback) {
    if (loaded) {
      callback(characters);
      return;
    }

    if (callback) {
      callbacks.push(callback);
    }

    $.ajax({
      url: 'characters.json',
      dataType: 'json',
      success: function(data) {
        characters = data.characters;
        loaded = true;

        // Call all waiting callbacks
        callbacks.forEach(function(cb) {
          cb(characters);
        });
        callbacks = [];
      },
      error: function(error) {
        console.error('Failed to load characters.json:', error);
        // Fallback to default characters
        characters = getDefaultCharacters();
        loaded = true;
        callbacks.forEach(function(cb) {
          cb(characters);
        });
        callbacks = [];
      }
    });
  }

  function getDefaultCharacters() {
    return [
      {
        id: 'fighter1',
        name: 'Red Fighter',
        sprite: 'character.png',
        stats: {
          health: 100,
          maxSpeed: 0.3,
          acceleration: 0.05,
          jumpVelocity: 0.4,
          punchDamage: 5,
          punchRange: 70,
          throwDamage: 7,
          throwRange: 70
        },
        description: 'Balanced fighter with standard stats'
      },
      {
        id: 'fighter2',
        name: 'Blue Fighter',
        sprite: 'character_2.png',
        stats: {
          health: 100,
          maxSpeed: 0.3,
          acceleration: 0.05,
          jumpVelocity: 0.4,
          punchDamage: 5,
          punchRange: 70,
          throwDamage: 7,
          throwRange: 70
        },
        description: 'Balanced fighter with standard stats'
      }
    ];
  }

  function getCharacters() {
    return characters;
  }

  function getCharacterById(id) {
    return characters.find(function(char) {
      return char.id === id;
    });
  }

  function isLoaded() {
    return loaded;
  }

  return {
    load: loadCharacters,
    getCharacters: getCharacters,
    getCharacterById: getCharacterById,
    isLoaded: isLoaded
  };
})();
