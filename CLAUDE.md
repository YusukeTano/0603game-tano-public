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

### File Organization Crisis → NEW STRUCTURE IMPLEMENTED ✅
- **Previous**: 77 files scattered in `public/` directory 
- **Problem**: High merge conflict risk with 4-person team
- **Impact**: Audio system's 29 files were difficult to navigate
- **New Structure**: `src/` with categorized organization (2025-06-24)
  ```
  src/
  ├── core/ (game.js, debug-config.js)
  ├── systems/
  │   ├── core/ (render, input, physics, ui)
  │   ├── gameplay/ (weapon, enemy, level, wave, stage)
  │   ├── audio/ (29 audio files organized)
  │   └── support/ (particle, background, pickup, settings)
  ├── entities/
  │   ├── core/ (player, bullet)
  │   ├── characters/ (character factories)
  │   └── gameplay/ (enemy, pickup)
  ├── features/mini-games/
  └── shared/ (utils, config)
  ```

### Audio System Emergency Mode → STABILIZED ✅
- **Status**: Emergency mode activated, complex fallback chains disabled (2025-06-24)
- **Configuration**: All feature flags set to safe mode, direct EmergencyAudioSystem usage
- **Stability**: Basic BGM, sound effects, and weapon audio working
- **Organization**: 29 audio files moved to `src/systems/audio/` for better management
- **Next**: Simplification to 5 core files (planned)

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
1. **🚨 URGENT**: Fix shooting + skill selection auto-fire bug
2. **🔴 HIGH**: RenderSystem modular split (3,417 lines → 5 modules)
3. **🔴 HIGH**: Import path updates for new file structure
4. **🔴 HIGH**: Element system (fire/ice/lightning attributes)
5. **📋 MEDIUM**: Complete audio system simplification (29 → 5 files)

### Recent Improvements
- **✅ Debug Log Control**: 221 console outputs now controlled via production mode (2025-06-23)
- **✅ UI Debug Panel**: Right-top 🔧 button for real-time log control
- **✅ CLAUDE.md Accuracy**: Fixed file counts and system details
- **✅ Rendering System Analysis**: Comprehensive architectural analysis completed (2025-06-23)
- **✅ Canvas globalAlpha Bug Fixed**: Added `ctx.globalAlpha = 1.0;` after star rendering (2025-06-24)
- **✅ Performance Optimization**: Removed 7 monitorCanvasStateDetailed calls (420 calls/sec reduction) (2025-06-24)
- **✅ Audio System Emergency Stabilization**: Activated emergency mode, disabled complex fallback chains (2025-06-24)
- **✅ File Structure Reorganization**: Created new src/ directory with categorized organization (2025-06-24)

## Development Guidelines

### Rendering System Safety (NEW - CRITICAL)
- **NEVER** modify Canvas state in game.js without proper reset
- **ALWAYS** use ctx.save()/ctx.restore() for temporary state changes
- **CRITICAL BUG**: game.js:3531 missing `this.ctx.globalAlpha = 1.0;` after star rendering
- **AVOID** Canvas state monitoring code - fix root causes instead
- **COORDINATE** rendering changes due to multiple systems (game.js, render-system.js, background-system.js)

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

### High-Traffic Files (Coordinate Team Edits) - Updated Paths
- `src/core/game.js` - Main game controller ✅ (Canvas bug fixed)
- `src/systems/core/render-system.js` - Rendering pipeline (3,417 lines, ready for split)
- `src/systems/support/background-system.js` - Background rendering
- `src/systems/gameplay/weapon-system.js` - Weapon management
- `src/systems/audio/integrated-audio-manager.js` - Audio controller ⚠️ (Emergency mode)
- `src/entities/core/player.js` - Player entity

### Safe Edit Zones - Updated Paths
- `src/shared/utils/` - Utility functions ✅ (Moved)
- `src/shared/config/` - Configuration files ✅ (Moved)
- `src/entities/gameplay/` - Individual enemy or entity files ✅ (Categorized)
- `src/features/mini-games/` - Mario mini-game system ✅ (Isolated)
- CSS and HTML files in `public/` (unchanged)
- `src/core/debug-config.js` - Debug log control system ✅ (Moved)

### Emergency Recovery Files - Updated Paths
- `src/systems/audio/emergency-audio-patch.js` - Audio system fallback ✅ (Organized)
- `src/systems/audio/emergency-phase3-patch.js` - Phase 3 fallback ✅ (Organized)
- Always preserve these files for system stability

---

---

## 🏗️ ARCHITECTURAL IMPROVEMENTS STATUS (2025-06-24)

### **✅ COMPLETED IMPROVEMENTS**
1. ~~**Canvas globalAlpha Bug**: `game.js:3532` - Added `this.ctx.globalAlpha = 1.0;` after star rendering~~ ✅ FIXED
2. ~~**Performance Issues**: Removed 7 monitorCanvasStateDetailed calls (420 calls/sec reduction)~~ ✅ FIXED
3. ~~**Audio System Stabilization**: Emergency mode activated, complex fallback chains disabled~~ ✅ FIXED
4. ~~**File Structure Reorganization**: Created new src/ directory with categorized organization~~ ✅ FIXED

### **🔄 IN PROGRESS**
5. **RenderSystem Modular Split**: 3,417 lines → 5 modules (BackgroundRenderer, BulletRenderer, EntityRenderer, PickupRenderer, EffectRenderer)

### **📋 NEXT PRIORITIES**
6. **Import Path Updates**: Update all import statements to new src/ structure
7. **Auto-fire Bug Fix**: Resolve skill selection + shooting timing conflict in level-system.js:206
8. **Fixed Delta Time**: Replace `const deltaTime = 1/60` with actual frame timing
9. **Viewport Culling**: Add rendering optimization for off-screen entities

### **🎯 RENDER SYSTEM SPLIT PLAN**
Ready for implementation:
```
src/systems/rendering/
├── render-system.js          (~200 lines) - Main coordinator
├── background-renderer.js    (~1200 lines) - Environment & particles
├── bullet-renderer.js        (~600 lines) - All projectile types
├── entity-renderer.js        (~650 lines) - Player & enemy rendering
├── pickup-renderer.js        (~760 lines) - Item collection effects
├── effect-renderer.js        (~200 lines) - Shared visual effects
└── rendering-utils.js        (~100 lines) - Color & math utilities
```

---

*Last Updated: 2025-06-24*
*Current Focus: Audio system stabilized, file structure reorganized, RenderSystem split ready*