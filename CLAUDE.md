# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based game called "リズム・サバイバー" (Rhythm Survivor) - a modular JavaScript game with ES6 modules and organized architecture. The game combines rhythm-based mechanics with survival gameplay, where players collect experience orbs in sync with BGM beats to gain combo bonuses.

## Development Commands

### Development Workflow:
1. **Run locally**: `npm run dev` or `python3 -m http.server 8080` then open `http://localhost:8080/dist/`
2. **Build**: `npm run build` (creates optimized build in `dist/`)
3. **Deploy**: Push to `main` branch (GitHub Actions automatically builds and deploys to S3)

### Available Scripts:
- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run serve` - Serve built files
- `npm test` - Run tests (placeholder)
- `npm run lint` - Run linting (placeholder)

## Architecture

### New Modular File Structure
```
src/
├── js/                    # JavaScript modules
│   ├── entities/          # Game entities (Player, WeaponSystem)
│   ├── audioManager.js    # Web Audio API management
│   ├── particleSystem.js  # Particle effects
│   └── main.js           # Main game class
├── css/                   # Stylesheets
├── config/                # Game configuration
├── utils/                 # Utility functions
└── assets/                # Game assets

dist/                      # Build output
├── index.html            # Main HTML file
└── styles.css            # Compiled CSS

public/                    # Legacy structure (kept for compatibility)
└── index.html            # Original monolithic file
```

### Key Technical Details
- **ES6 Modules**: Modular architecture with import/export
- **Object-Oriented Design**: Game entities as classes
- **Performance Optimized**: Object pooling, optimized collision detection
- **Audio**: Web Audio API with dedicated AudioManager class
- **Graphics**: Canvas API with organized rendering system
- **Controls**: Mouse and touch support

### Deployment
- Automatic deployment via GitHub Actions on push to `main`
- Builds project with `node scripts/build.js`
- Deploys to S3 bucket: `s3://tano-0603game-bucket/`
- Uses AWS OIDC for authentication (no stored secrets)

### Game Systems (Modular Implementation)
- **Player System** (`src/js/entities/player.js`): Movement, health, leveling
- **Weapon System** (`src/js/entities/weaponSystem.js`): Weapon switching, firing logic
- **Audio System** (`src/js/audioManager.js`): Dynamic BGM generation and SFX
- **Particle System** (`src/js/particleSystem.js`): Effects with object pooling
- **Collision System** (`src/utils/collision.js`): Optimized collision detection
- **Object Pooling** (`src/utils/objectPool.js`): Memory management

## Important Notes

### New Code Architecture
The codebase has been refactored from a monolithic structure to a modular ES6 system:
- **Main Game Class** (`src/js/main.js`): Central game loop and coordination
- **Configuration** (`src/config/gameConfig.js`): All game constants and settings
- **Utility Functions**: Separated into focused modules
- **Component Systems**: Audio, particles, collision detection as separate classes

### Performance Optimizations
- **Object Pooling**: Reuse projectiles and particles to reduce GC pressure
- **Optimized Collision**: Use squared distance calculations where possible  
- **Modular Loading**: Only load needed systems
- **Efficient Rendering**: Separate render functions for different entity types

### Development Considerations
- **Module Support**: Requires modern browser with ES6 module support
- **Development Server**: Use provided scripts for local development
- **Build Process**: Simple concatenation/optimization for production
- **Hot Reload**: Changes require manual browser refresh (can be improved with build tools)

### Common Tasks
- **Testing changes**: Run `npm run dev` and test in browser
- **Adding features**: Create new modules in appropriate directories
- **Configuration**: Modify `src/config/gameConfig.js` for game balance
- **Debugging**: Use browser DevTools, game state accessible via `window.game`

### Migration Notes
- **Legacy Support**: Original `public/index.html` preserved for reference
- **Gradual Migration**: Can move additional systems to modular structure
- **Backwards Compatibility**: Old save systems and API remain functional
- **Performance**: New structure should show improved performance from optimizations

### Key Improvements in New Structure
- **Maintainability**: Separated concerns, easier to modify individual systems
- **Performance**: Object pooling and optimized algorithms
- **Scalability**: Easy to add new weapon types, enemies, effects
- **Debugging**: Better error isolation and logging
- **Code Quality**: TypeScript-ready structure, better organization