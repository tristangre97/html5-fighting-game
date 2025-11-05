# Character System - How to Add New Characters

This guide explains how to easily add new characters to the fighting game.

## Quick Start

To add a new character, you only need to:
1. Add the character sprite image to the game directory
2. Add the character entry to `characters.json`

That's it! The game will automatically load and display your new character.

## Character JSON Format

Edit `characters.json` and add a new character object to the `characters` array:

```json
{
  "id": "unique_character_id",
  "name": "Character Display Name",
  "sprite": "character_sprite.png",
  "stats": {
    "health": 100,
    "maxSpeed": 0.3,
    "acceleration": 0.05,
    "jumpVelocity": 0.4,
    "punchDamage": 5,
    "punchRange": 70,
    "throwDamage": 7,
    "throwRange": 70
  },
  "description": "Brief character description"
}
```

## Character Properties Explained

### Required Fields:
- **id** (string): Unique identifier for the character (no spaces, lowercase recommended)
- **name** (string): Display name shown in the character selection screen
- **sprite** (string): Filename of the character sprite sheet (must be in the game root directory)

### Stats Object:
- **health** (number): Starting health points (default: 100)
- **maxSpeed** (number): Maximum horizontal movement speed (default: 0.3)
  - Higher = faster movement
  - Range: 0.2 - 0.5 recommended

- **acceleration** (number): How quickly the character reaches max speed (default: 0.05)
  - Higher = faster acceleration
  - Range: 0.03 - 0.08 recommended

- **jumpVelocity** (number): Initial upward velocity when jumping (default: 0.4)
  - Higher = higher jumps
  - Range: 0.3 - 0.5 recommended

- **punchDamage** (number): Damage dealt per punch (default: 5)
  - Range: 3 - 10 recommended

- **punchRange** (number): Distance in pixels that punch can reach (default: 70)
  - Range: 50 - 100 recommended

- **throwDamage** (number): Damage dealt per throw (default: 7)
  - Range: 5 - 15 recommended

- **throwRange** (number): Distance in pixels that throw can reach (default: 70)
  - Range: 60 - 90 recommended

### Optional Fields:
- **description** (string): Short description displayed in character selection

## Example: Adding a Fast Character

```json
{
  "id": "speedster",
  "name": "The Speedster",
  "sprite": "speedster.png",
  "stats": {
    "health": 80,
    "maxSpeed": 0.5,
    "acceleration": 0.08,
    "jumpVelocity": 0.45,
    "punchDamage": 4,
    "punchRange": 60,
    "throwDamage": 6,
    "throwRange": 65
  },
  "description": "Fast and agile but lower health"
}
```

## Example: Adding a Tank Character

```json
{
  "id": "tank",
  "name": "The Tank",
  "sprite": "tank.png",
  "stats": {
    "health": 150,
    "maxSpeed": 0.2,
    "acceleration": 0.03,
    "jumpVelocity": 0.35,
    "punchDamage": 8,
    "punchRange": 80,
    "throwDamage": 12,
    "throwRange": 75
  },
  "description": "Slow but powerful with high health"
}
```

## Character Sprite Requirements

Your character sprite sheet should:
- Be a PNG file
- Contain sprite animations for: idle, punch, throw, block, pain, thrown
- Match the format of existing character sprites (character.png, character_2.png)
- Be approximately 100x100 pixels per frame (or similar to existing sprites)

## Testing Your Character

1. Save your changes to `characters.json`
2. Ensure the sprite image file is in the game directory
3. Restart the game server (if running)
4. Refresh the browser
5. Click "Local 2-Player" or "Online Multiplayer"
6. Your new character should appear in the character selection grid!

## Troubleshooting

**Character doesn't appear:**
- Check that `characters.json` is valid JSON (use a JSON validator)
- Ensure the sprite file exists and the filename matches exactly
- Check the browser console for errors

**Character stats don't work:**
- Verify all stat values are numbers (not strings)
- Make sure the stats object is properly formatted

**Sprite doesn't display:**
- Confirm the sprite file is in the correct directory
- Check that the filename matches exactly (case-sensitive)
- Verify the image file isn't corrupted

## Tips for Balanced Characters

- **Fast characters**: Lower health, lower damage
- **Slow characters**: Higher health, higher damage
- **Balanced characters**: Average stats across the board
- **Range specialists**: Lower damage but longer reach
- **Brawlers**: Higher damage but shorter reach

Have fun creating unique characters!
