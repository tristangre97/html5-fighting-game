# HTML5 Fighting Game - Multiplayer Edition

A 2D fighting game built with HTML5 Canvas, now featuring **online multiplayer** support with Node.js and Express!

## Features

- **Local 2-Player Mode**: Play with a friend on the same keyboard
- **Online Multiplayer**: Battle players from anywhere with real-time networking
- **High Performance**: 60-144 FPS with configurable frame rate for buttery-smooth gameplay
- **Server-Generated Terrain**: Seeded procedural generation ensures consistent levels across all clients
- **Gamepad/Controller Support**: Full Xbox, PlayStation, and generic controller support
- **Mobile Touch Controls**: On-screen virtual joystick and buttons for mobile devices
- **Modern UI**: Beautiful Tailwind CSS interface with glassmorphic design
- **Responsive Design**: Automatically adapts to desktop, tablet, and mobile
- **Real-time Health Bars**: Live HUD display with smooth animations
- Server-authoritative game logic to prevent cheating
- Real-time synchronization using WebSockets (Socket.IO) at 60fps
- Automatic matchmaking system
- Physics-based combat with punches, throws, and blocking

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

The game supports **three input methods**: keyboard, gamepad/controller, and mobile touch controls.

#### Keyboard Controls

**Local Mode - Player 1**
- **A/D**: Move left/right
- **W**: Jump
- **R**: Punch
- **T**: Throw

**Local Mode - Player 2**
- **Left/Right Arrow**: Move left/right
- **Up Arrow**: Jump
- **< (Comma)**: Punch
- **> (Period)**: Throw

**Online Mode**
You can use either set of controls:
- **A/D or Arrow Keys**: Move
- **W or Up Arrow**: Jump
- **R or <**: Punch
- **T or >**: Throw

#### Gamepad/Controller Controls

Supports Xbox, PlayStation, and standard gamepads:
- **Left Stick or D-Pad**: Move left/right
- **A Button (Xbox) / X Button (PlayStation)**: Jump
- **B Button (Xbox) / Circle Button (PlayStation)**: Punch
- **X Button (Xbox) / Square Button (PlayStation)**: Throw
- **Y Button (Xbox) / Triangle Button (PlayStation)**: Block
- **Right Bumper (RB/R1)**: Alternative Punch
- **Right Trigger (RT/R2)**: Alternative Throw
- **Left Bumper (LB/L1)**: Alternative Block

**Local Mode**: Player 1 uses gamepad 1, Player 2 uses gamepad 2
**Online Mode**: Use any connected gamepad

Controllers are automatically detected when connected. A notification will appear when a controller is connected or disconnected.

#### Mobile Touch Controls

On mobile devices, virtual on-screen controls automatically appear:
- **Virtual Joystick** (left side): Move left/right
- **Jump Button** (green, top right): Jump
- **Punch Button** (red, middle right): Punch
- **Throw Button** (orange, bottom right): Throw
- **Block Button** (blue, top middle right): Block

Touch controls are automatically enabled on mobile devices and hidden on desktop.

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
- **gamepad.js**: Gamepad/controller input manager
- **touchcontrols.js**: Mobile touch controls manager
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
├── gamepad.js               # Gamepad/controller input manager
├── touchcontrols.js         # Mobile touch controls manager
├── gamejam.js               # Game controller (local + online)
├── player.js                # Client player class
├── window.js                # Canvas rendering
├── level.js                 # Level rendering
├── sprite.js                # Sprite animation
├── index.html               # Game UI with touch controls
├── style.css                # Styles
├── package.json             # Node.js dependencies
└── README.md                # This file
```

## Testing Multiplayer

To test online multiplayer locally:

1. Start the server: `npm start`
2. Open two browser windows/tabs
3. In both windows, navigate to `http://localhost:3000`
4. Click "Online Multiplayer" in both windows
5. You should get matched together!

## Testing Controllers and Mobile

### Testing Gamepad/Controller Support

1. Connect your Xbox, PlayStation, or generic gamepad to your computer
2. Start the server and navigate to `http://localhost:3000`
3. A notification will appear confirming the controller is connected
4. Select either Local or Online mode
5. Use the gamepad buttons to control your character

**Testing Two Controllers (Local Mode):**
1. Connect two gamepads to your computer
2. Select "Local 2-Player" mode
3. Player 1 uses gamepad 1, Player 2 uses gamepad 2

### Testing Mobile Touch Controls

**Using Browser DevTools:**
1. Start the server: `npm start`
2. Open Chrome DevTools (F12)
3. Click "Toggle Device Toolbar" (Ctrl+Shift+M)
4. Select a mobile device (e.g., iPhone, iPad, Android)
5. Navigate to `http://localhost:3000`
6. Touch controls should automatically appear

**Testing on Actual Mobile Device:**
1. Ensure your mobile device is on the same network as your computer
2. Find your computer's local IP address (e.g., 192.168.1.100)
3. Start the server: `npm start`
4. On your mobile device, navigate to `http://[YOUR_IP]:3000`
5. Touch controls will automatically appear

**Tip**: For mobile testing, you may need to allow incoming connections through your firewall.

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

### Frame Rate
- **Client Rendering**: 60-144 FPS using requestAnimationFrame (configurable)
- **Server Update Rate**: 60 updates per second for responsive gameplay
- **Frame Time Limiting**: Optional frame rate cap for consistent performance
- **Debug Mode**: Press `P` to display real-time FPS counter

### Network Performance
- **Server Tick Rate**: 60 Hz (16.67ms per update)
- **Network Traffic**: ~0.5-1 KB/sec per player (optimized with seed-based terrain)
- **Latency Tolerance**: Best with <200ms ping
- **Concurrent Games**: Server can handle multiple simultaneous matches

### Optimization Features
- **Seeded Terrain Generation**: Send only seed (4 bytes) instead of full terrain data (~40KB)
- **requestAnimationFrame**: Browser-optimized rendering for better performance
- **Frame-Independent Physics**: Smooth gameplay at any frame rate
- **Efficient State Updates**: Delta-time calculations ensure consistent physics

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
- [ ] Vibration/haptic feedback for controllers and mobile
- [ ] Customizable control mappings
- [ ] Voice chat support

## License

Licensed under the Apache License, Version 2.0

Original game copyright 2010 Google Inc.
Multiplayer implementation copyright 2025

## Credits

- Original game developed for a Google game jam (2010)
- Multiplayer implementation adds Node.js/Express/Socket.IO networking (2025)
- Gamepad/controller support using standard Gamepad API (2025)
- Mobile touch controls with responsive design (2025)

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

### Controller not detected
- Make sure your controller is properly connected
- Try reconnecting the controller
- Check if the controller works in other browser games
- Some browsers have better gamepad support (Chrome/Edge recommended)
- Press any button on the controller after connecting

### Touch controls not appearing
- Touch controls only appear on mobile devices or touchscreen laptops
- Try using browser DevTools device emulation mode
- Check that screen width is less than 1024px
- Refresh the page after device detection

### Touch controls not responsive
- Ensure you're not accidentally triggering mouse/keyboard input
- Try reloading the page
- Check that JavaScript is enabled
- Clear browser cache and reload

### Mobile game too small/large
- The game canvas automatically scales to fit the screen
- Try rotating your device (landscape usually works better)
- Zoom out if the game appears too large
- On some devices, full-screen mode works better

## Contributing

Feel free to submit issues and enhancement requests!
