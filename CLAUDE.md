# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# 開発状況
同じブランチで4人で作業してるので、ファイル編集競合が起こる可能性を加味して作業しましょう。

## Commands

### Running the Game
```bash
# Start local server (required for ES6 modules)
cd public && python3 -m http.server 8000
# Access at: http://localhost:8000/index.html
```

### Testing
```bash
# Audio system tests (HTML-based) - Total: 22 test files
open test-phase-1-foundation.html
open test-phase-3-integration.html
open test-phase-4-integration.html
open test-phase-5-integration.html

# Integration tests
open test-audio-foundation-layer.html
open test-new-audio-system.html
open test-combo-clarity-fix.html
open test-sounds-compatibility.html

# Phase-specific tests (JS files)
# test-phase-1-1.js, test-phase-1-2.js, test-phase-1-3-*.js
```

### Development
```bash
# No build process - direct ES6 modules
# No linting configured - manual code review
# No automated tests - HTML test pages only

# Debug log control (global console override system)
debugProduction()  # Disable all console.log/warn/error (default)
debugDevelopment() # Enable all console logs
debugClear()       # Clear console
```

## Architecture Overview

### Core Game Architecture
- **Pattern**: Central Game Controller with Dependency Injection
- **Main Class**: `ZombieSurvival` in `public/game.js`
- **System Design**: All systems receive game instance, communicate through central object
- **14 Core Systems**: Input, Render, Physics, Weapon, Enemy, Particle, Level, Pickup, UI, Bullet, Stage, Wave, Settings, Background

### Audio System (Critical - Currently in Emergency Mode)
- **5-Phase Layered Architecture** with graceful degradation
- **Current State**: Emergency recovery mode (Phase 1 direct integration)
- **Fallback Chain**: Phase5 → Phase3 → Phase1 → Emergency patch
- **Key Files**:
  - `integrated-audio-manager.js` - Main controller
  - `emergency-audio-patch.js` - Emergency fallback
  - `emergency-phase3-patch.js` - Simplified phase management
- **29 Audio Files** total across 5 phases (Foundation → Service → Manager → Engine → Integration)

### Entity System
- **Pattern**: Class-based Entity Component System with Factory Pattern
- **Characters**: 3 types (Ray, Luna, Aurum) via `CharacterFactory`
- **Entities**: Player, Enemy, Bullet, Pickup with inheritance
- **Key Files**: 
  - `character-factory.js` - Character creation
  - `player.js` - Main player entity
  - `enemy.js` - Enemy types and behavior

### Systems Architecture
- **Pattern**: Modular systems with game reference dependency injection
- **Communication**: Systems communicate through central game object
- **Key Systems**:
  - `weapon-system.js` - 4 weapon types, upgrade management
  - `render-system.js` - Canvas 2D rendering pipeline
  - `input-system.js` - Unified PC/mobile input handling

## Critical Development Constraints

### File Organization Crisis
- **Current**: 85 files scattered in `public/` directory (excluding node_modules)
- **Problem**: High merge conflict risk with 4-person team
- **Impact**: Audio system's 29 files are difficult to navigate
- **Planned**: Migration to `src/js/{systems,entities,weapons}` structure

### Audio System Emergency Mode
- **Status**: Phase 5 integration skipped, using Phase 1 + emergency patches
- **Limitation**: Simplified functionality, some features disabled
- **Stability**: Basic BGM, sound effects, and weapon audio working
- **Caution**: Avoid major audio system changes until full recovery

### Team Coordination
- **Branch**: Single `main` branch with 4 developers
- **Risk**: High file editing conflicts
- **Strategy**: Coordinate on system-level changes, avoid simultaneous edits

## Game Specifications

### Core Game Loop
- **Genre**: Bullet-Heaven (Vampire Survivors-like)
- **Waves**: 999 wave progression system
- **Characters**: Ray, Luna, Aurum with unique stats
- **Weapons**: 4 types (Plasma, Nuke, Super Homing, Super Shotgun)
- **Platform**: PC browser + mobile responsive

### Technical Stack
- **Engine**: Vanilla JavaScript + Canvas 2D API
- **Modules**: ES6 modules (requires local server)
- **Audio**: Web Audio API + Tone.js CDN
- **UI**: Responsive design (PC/mobile/landscape)

### Current Priorities
1. **🏗️ URGENT**: Project structure reorganization (reduce conflicts)
2. **🚨 URGENT**: Fix shooting + skill selection auto-fire bug
3. **🚨 URGENT**: Investigate post-audio-recovery bugs
4. **🔴 HIGH**: Element system (fire/ice/lightning attributes)

### Recent Improvements
- **✅ Debug Log Control**: 221 console outputs now controlled via production mode (2025-06-23)
- **✅ UI Debug Panel**: Right-top 🔧 button for real-time log control
- **✅ CLAUDE.md Accuracy**: Fixed file counts and system details

## Development Guidelines

### Audio System Safety
- **NEVER** modify Phase 2-5 files without emergency backup plan
- **ALWAYS** test audio changes in isolation first using test HTML files
- **USE** emergency fallback pattern for any audio modifications
- **COORDINATE** audio changes with team due to system complexity

### File Editing Strategy
- **CHECK** git status before editing any system file
- **PREFER** editing single files over multiple related files
- **AVOID** simultaneous work on systems/ directory
- **COMMUNICATE** before touching core game loop or entity system

### Testing Approach
- **HTML Test Files**: Use existing test-*.html files for integration testing
- **Manual Testing**: No automated test suite - rely on browser testing
- **Audio Testing**: Each phase has dedicated test environment
- **Cross-Platform**: Test on both desktop and mobile browsers
- **Debug Testing**: Use 🔧 debug panel (top-right) to control console output during testing

## Codebase Navigation

### High-Traffic Files (Avoid Simultaneous Edits)
- `public/game.js` - Main game controller
- `public/js/systems/weapon-system.js` - Weapon management
- `public/js/systems/integrated-audio-manager.js` - Audio controller
- `public/js/entities/player.js` - Player entity

### Safe Edit Zones
- `public/js/utils/` - Utility functions
- `public/js/config/` - Configuration files
- Individual enemy or entity files
- CSS and HTML files
- `public/debug-config.js` - Debug log control system

### Emergency Recovery Files
- `emergency-audio-patch.js` - Audio system fallback
- `emergency-phase3-patch.js` - Phase 3 fallback
- Always preserve these files for system stability

---

*Last Updated: 2025-06-23*
*Current Focus: Emergency audio system stability + conflict reduction + debug log control*