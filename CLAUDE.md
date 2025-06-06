# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based game called "リズム・サバイバー" (Rhythm Survivor) - a 2D top-down rhythm action x survival-like game. Players control a character with mouse movement, automatically fire weapons at enemies, and collect experience orbs in sync with BGM beats to gain combo bonuses. The game features skill progression, weapon switching, and special attacks.

## Development Commands

### Available Scripts:
- `npm run dev` - Start development server (runs `scripts/dev-server.js`)
- `npm run build` - Build for production (runs `scripts/build.js`)
- `npm run serve` - Serve built files via Python HTTP server on port 8000
- `npm test` - Run tests (placeholder, currently no tests configured)
- `npm run lint` - Run linting (placeholder, currently no linting configured)

### Development Workflow:
1. **Run locally**: Use `npm run dev` to start development server, or manually run `python3 -m http.server 8000 --directory public` and open browser
2. **Deploy**: Push to `main` branch triggers automatic GitHub Actions deployment to S3

## Architecture

### Current Structure (Single File Implementation)
```
public/                    # Deployment target directory
├── index.html            # Single-file game implementation (if exists)
└── error.html            # Error page (if exists)

.github/workflows/         # CI/CD
└── deploy-to-s3.yml      # Automatic S3 deployment
```

### Technical Stack
- **Pure HTML/CSS/JavaScript**: No frameworks, vanilla implementation
- **Canvas API**: Game rendering and graphics
- **Web Audio API**: Dynamic BGM generation and sound effects
- **Mouse Controls**: Movement via mouse positioning, left-click for weapon switching, right-click for special attacks

### Deployment
- Automatic deployment via GitHub Actions on push to `main` branch
- Syncs `./public/` directory to S3 bucket: `s3://tano-0603game-bucket/`
- Uses AWS OIDC authentication (no stored secrets)
- Deploy target: Files in `public/` directory only

## Game Design Specifications

### Core Gameplay Loop
1. **Movement**: Mouse controls character movement (follows cursor)
2. **Combat**: Weapons auto-fire at nearby enemies
3. **Progression**: Collect experience orbs from defeated enemies to level up
4. **Rhythm System**: Collecting orbs in sync with BGM beats provides combo bonuses
5. **Skill Selection**: Choose from 3 random skills on level up
6. **Special Attacks**: Right-click triggers powerful special abilities

### Key Game Systems
- **Rhythm Combo System**: BGM beat-synced orb collection for bonus experience
- **Skill Build System**: Random skill selection with progression paths
- **Weapon Switching**: Left-click cycles through different weapon types
- **Dynamic Audio**: Web Audio API generates procedural BGM and reactive sound effects

### Visual Style
- **Neon/Cyberpunk**: Simple vector art style with high visibility
- **Effects-Heavy**: Emphasis on particle effects and visual feedback for combat
- **Screen Effects**: Screen shake, explosions, and dynamic lighting

## Important Development Notes

### File Structure Requirements
- Game files must be placed in `public/` directory for deployment
- Single-file implementations should be self-contained HTML files
- All assets (CSS, JavaScript) should be embedded or referenced relatively

### Audio Implementation
- Use Web Audio API for dynamic BGM generation
- Generate sound effects procedurally to match BGM key/tempo
- Target BPM should be clearly defined for rhythm mechanics
- Audio context requires user interaction to start (place in click handler)

### Performance Considerations
- Implement object pooling for projectiles and particles
- Use squared distance calculations for collision detection optimization
- Separate render functions for different entity types
- Minimize garbage collection pressure in game loop