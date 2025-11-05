# HTML5 Fighting Game - Multiplayer Edition

A 2D fighting game built with HTML5 Canvas, now featuring **online multiplayer** support with Node.js and Express!

## Features

- **Local 2-Player Mode**: Play with a friend on the same keyboard
- **Online Multiplayer**: Battle players from anywhere with real-time networking
- Server-authoritative game logic to prevent cheating
- Real-time synchronization using WebSockets (Socket.IO)
- Automatic matchmaking system
- Physics-based combat with punches, throws, and blocking
- Procedurally generated terrain

## Prerequisites

- Node.js (v14 or higher)
- npm (Node Package Manager)
- A modern web browser (Chrome, Firefox, Safari, Edge)

## Installation

1. **Clone or download this repository**

2. **Install dependencies**:
   ```bash
   npm install
   ```

## Running the Server

Start the game server:

```bash
npm start
```

For development with auto-restart on file changes:

```bash
npm run dev
```

The server will start on `http://localhost:3000` by default.

## How to Play

### Starting a Game

1. Open your browser and navigate to `http://localhost:3000`
2. Choose your game mode:
   - **Local 2-Player**: Play with a friend on the same computer
   - **Online Multiplayer**: Get matched with another online player

### Controls

#### Local Mode - Player 1
- **A/D**: Move left/right
- **W**: Jump
- **R**: Punch
- **T**: Throw

#### Local Mode - Player 2
- **Left/Right Arrow**: Move left/right
- **Up Arrow**: Jump
- **< (Comma)**: Punch
- **> (Period)**: Throw

#### Online Mode
You can use either set of controls:
- **A/D or Arrow Keys**: Move
- **W or Up Arrow**: Jump
- **R or <**: Punch
- **T or >**: Throw

### Combat Mechanics

- **Punching**: Close-range attack dealing 5 damage
- **Throwing**: Close-range attack dealing 7 damage with knockback
- **Blocking**: Move away from your opponent while they attack to block damage
- **Pit Damage**: Falling below the level deals continuous damage

### Winning

Reduce your opponent's health to 0 to win!

## Architecture

### Server-Side (Node.js/Express)

- **server.js**: Main Express server with Socket.IO
- **server/GameRoom.js**: Manages individual game sessions
- **server/ServerPlayer.js**: Server-authoritative player physics and combat
- **server/ServerLevel.js**: Procedural level generation

### Client-Side

- **network.js**: WebSocket client manager
- **gamejam.js**: Game controller supporting both local and online modes
- **player.js**: Client-side player rendering and prediction
- **window.js**: Canvas rendering
- **level.js**: Level rendering
- **sprite.js**: Sprite animation system

## Multiplayer Design

The multiplayer implementation uses a **server-authoritative** architecture:

1. **Client sends input** to the server (key presses)
2. **Server validates and processes** all game logic
3. **Server broadcasts game state** to both clients at 30 updates/sec
4. **Clients render** the authoritative state from the server

This prevents cheating and ensures both players see the same game state.

## Network Protocol

### Client → Server Events

- `find_match`: Request to find an opponent
- `player_input`: Send player input state (keys pressed)

### Server → Client Events

- `waiting_for_opponent`: Waiting in matchmaking queue
- `match_found`: Opponent found, game room created
- `game_start`: Game starting with initial state
- `game_update`: Game state update (30 times/sec)
- `game_over`: Match ended with winner
- `opponent_disconnected`: Opponent left the game

## File Structure

```
html5-fighting-game/
├── server/
│   ├── GameRoom.js          # Game session manager
│   ├── ServerPlayer.js      # Server-side player logic
│   └── ServerLevel.js       # Server-side level generation
├── server.js                # Express + Socket.IO server
├── network.js               # Client-side network manager
├── gamejam.js              # Game controller (local + online)
├── player.js               # Client player class
├── window.js               # Canvas rendering
├── level.js                # Level rendering
├── sprite.js               # Sprite animation
├── index.html              # Game UI
├── style.css               # Styles
├── package.json            # Node.js dependencies
└── README.md               # This file
```

## Testing Multiplayer

To test online multiplayer locally:

1. Start the server: `npm start`
2. Open two browser windows/tabs
3. In both windows, navigate to `http://localhost:3000`
4. Click "Online Multiplayer" in both windows
5. You should get matched together!

## Deployment

To deploy to a cloud platform (Heroku, Railway, etc.):

1. Ensure `PORT` environment variable is supported:
   ```javascript
   const PORT = process.env.PORT || 3000;
   ```

2. Add a start script in package.json (already included):
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```

3. Deploy according to your platform's instructions

## Performance Notes

- **Update Rate**: 30 updates per second (same as original game)
- **Network Traffic**: ~1-2 KB/sec per player
- **Latency Tolerance**: Best with <200ms ping
- **Concurrent Games**: Server can handle multiple simultaneous matches

## Known Limitations

- No client-side prediction/interpolation (direct server state rendering)
- Simple matchmaking (first-come-first-served pairing)
- No reconnection handling after disconnect
- No spectator mode
- No ranked matchmaking or player profiles

## Future Enhancements

- [ ] Client-side prediction for smoother gameplay
- [ ] Interpolation for network jitter handling
- [ ] Lobby system with room codes
- [ ] Spectator mode
- [ ] Player statistics and leaderboards
- [ ] Multiple character selection
- [ ] Power-ups and special moves
- [ ] Mobile touch controls

## License

Licensed under the Apache License, Version 2.0

Original game copyright 2010 Google Inc.
Multiplayer implementation copyright 2025

## Credits

- Original game developed for a Google game jam
- Multiplayer implementation adds Node.js/Express/Socket.IO networking

## Troubleshooting

### Server won't start
- Make sure port 3000 is not in use
- Run `npm install` to ensure dependencies are installed

### Can't connect in online mode
- Check that the server is running
- Verify you're accessing `http://localhost:3000`
- Check browser console for errors

### Game is laggy in online mode
- Check your network connection
- Close unnecessary browser tabs
- Online mode requires stable connection between both players

### No opponent found
- You need two players to connect simultaneously
- Open another browser window to test locally

## Contributing

Feel free to submit issues and enhancement requests!
