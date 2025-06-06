# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based game called "リズム・サバイバー" (Rhythm Survivor) - a rhythm-action survival game built as a static HTML/CSS/JavaScript application with no build process or external dependencies. The game combines rhythm-based mechanics with survival gameplay, where players collect experience orbs in sync with BGM beats to gain combo bonuses.

## Development Commands

Since this is a pure static site, there are no build commands. Development workflow:

1. **Run locally**: Open `public/index.html` directly in a web browser
2. **Deploy**: Push to `main` branch (GitHub Actions automatically deploys to S3)

## Architecture

### File Structure
- `public/index.html` - Complete game implementation (all CSS/JS inline)
- `public/error.html` - Custom error page with animations
- `.github/workflows/deploy-to-s3.yml` - Automated S3 deployment

### Key Technical Details
- **No build process** - Direct HTML/CSS/JavaScript
- **No dependencies** - Everything is self-contained
- **Audio**: Uses Web Audio API for dynamic sound generation
- **Graphics**: Canvas API for game rendering
- **Controls**: Mouse and touch support

### Deployment
- Automatic deployment via GitHub Actions on push to `main`
- Deploys to S3 bucket: `s3://tano-0603game-bucket/`
- Uses AWS OIDC for authentication (no stored secrets)

### Game Systems
The game implements several interconnected systems in `index.html`:
- **Player movement**: Mouse/touch tracking with trail effect
- **Weapon system**: 6 weapon types (Normal, Rapid, Sniper, Shotgun, Explosive, Laser) unlocked by level
- **Rhythm combo system**: Experience orbs collected in sync with BGM create combo bonuses
- **Skill system**: 7 skill types chosen at level-up (damage, speed, multishot, shield, etc.)
- **Enemy system**: Dynamic spawning with increasing difficulty and variety
- **Special abilities**: Screen-clearing ultimate attack with cooldown
- **Level progression**: Experience-based with weapon unlocks at specific levels
- **Music phases**: Dynamic BGM generation using Web Audio API oscillators
- **Fever mode**: Activated at 50+ combo for enhanced gameplay
- **Particle effects**: Performance-optimized with automatic cleanup
- **Off-screen indicators**: Arrows showing direction of enemies outside view

## Important Notes

### Code Architecture
All game logic is contained within `public/index.html` (~2400+ lines) as inline JavaScript. The code follows these patterns:
- **Game state management**: Global `game` object containing enemies, projectiles, particles, skills arrays
- **Player state**: Global `player` object with position, health, level, experience
- **Weapon system**: `weaponTypes` array with `ownedWeapons` tracking unlocked weapons
- **Render loop**: `requestAnimationFrame` with `gameLoop()` for 60fps rendering
- **Event handling**: Unified mouse/touch input with custom cursor
- **Sound generation**: Dynamic Web Audio API synthesis with `generateBackgroundMusic()`
- **Camera system**: `cameraOffset` for smooth following with virtual map coordinates
- **UI updates**: Separate `updateUI()` function managing HUD elements
- **Notification system**: `showNotification()` for temporary user feedback

### Development Considerations
- **No hot reload**: Changes require manual browser refresh
- **No minification**: Code is readable but not optimized for size
- **Browser compatibility**: Modern browsers only (ES6+, Canvas, Web Audio API)
- **Mobile support**: Touch controls and responsive canvas sizing

### Common Tasks
- **Testing game changes**: Edit `public/index.html` and refresh browser
- **Debugging**: Use browser DevTools console (game logs errors/warnings)
- **Performance monitoring**: Check browser DevTools Performance tab for frame drops
- **Sound issues**: Web Audio API requires user interaction to start (click/tap)

### Key Game Mechanics Implementation
- **Weapon unlocking**: New weapons automatically unlock at specific levels (2-6) via `levelUp()` function
- **Special ability timing**: Available 10 seconds after game start, prevents immediate use
- **Rhythm combo system**: BGM beat detection for experience orb collection bonuses
- **Off-screen enemy indicators**: Red arrows with pulsing effects show enemy directions
- **Skill selection**: 3 random skills presented at each level-up for player choice
- **Dynamic difficulty**: Enemy spawn rates and types scale with player level and time