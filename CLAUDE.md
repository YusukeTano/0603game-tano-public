# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Local Testing
```bash
# Start local development server (from public/ directory)
python3 -m http.server 8080
# Then navigate to http://localhost:8080

# Alternative with different port if 8080 is occupied
python3 -m http.server 8000
```

### Git Operations
```bash
# Standard workflow - Use descriptive Japanese commit messages
git add .
git commit -m "機能追加と改良実装"
git push origin main

# Repository URL
# https://github.com/YusukeTano/0603game-tano-public.git
```

## Architecture Overview

This is a **monolithic HTML5 Canvas 2D space survival game** written in vanilla JavaScript. The entire game logic is contained in a single `game.js` file (~3000+ lines) with the main `ZombieSurvival` class.

### Core Architecture

**Single Class Design**: The `ZombieSurvival` class contains all game systems:
- Audio system (Web Audio API with dynamic sound generation)
- Weapon system (multiple weapon types with skill-based enhancements)
- Enemy/AI system (distinct enemy types with unique behaviors)
- Input handling (keyboard, mouse, touch for mobile)
- Rendering system (Canvas 2D with custom spaceship/monster designs)
- Game state management (menu, playing, paused, gameOver)

**Key Game Systems**:

1. **Audio System** - Dynamic sound generation using Web Audio API
   - BGM with phase-based progression and pause control
   - Individual sound effects for different pickup types (health, speed, nuke)
   - Combo system affects all game sounds with frequency modulation

2. **Weapon System** - Complex weapon mechanics with skill enhancements
   - Primary weapon: Plasma rifle (unlimited ammo)
   - Secondary weapon: Wave attack (charge-based, gained by killing enemies)
   - Temporary weapon: Nuke launcher (5-shot limited, reverts to previous weapon)
   - Player skills: Homing, Multi-shot, Piercing, Wall Reflection
   - Weighted rarity system for skill selection (Common: 50%, Legendary: 2%)

3. **Enemy System** - Distinct visual designs and behaviors
   - Boss: Dragon-type with wings and glowing eyes
   - Fast: Spider-type with 8 legs
   - Tank: Armored hexagonal design
   - Shooter: Alien-type with glowing eyes
   - Normal: Zombie-type with red eyes

4. **Item/Pickup System** - Advanced attraction and visual design
   - Health: Green crystal (increases max health permanently)
   - Speed: Blue lightning hexagon (permanent speed increase)
   - Nuke: Radioactive triangle (temporary 5-shot weapon)
   - Multi-stage attraction system prevents items from "sticking" around player

5. **Visual Design System** - Distinctive game element rendering
   - Player: Green spaceship with triangular design, cockpit, engine exhaust
   - Bullets: Glowing energy projectiles with shadow effects (plasma, laser, nuke, sniper)
   - Background: Space battlefield with stars and nebula effects
   - All elements use save/restore context with translation/rotation for proper rendering

### File Structure

```
public/
   game.js        # Main game class (~3000+ lines, all game logic)
   index.html     # Game screens and UI elements with pause buttons
   style.css      # Complete styling for all game states and pause functionality
```

### Game State Flow

1. **Loading Screen** → **Main Menu** → **Game Playing** → **Game Over**
2. **Level Up Modal** (interrupts gameplay for skill selection with rarity display)
3. **Pause System** (ESC key, pause buttons, maintains game state with BGM control)

### Critical Implementation Details

**Web Audio Context**: Must be initialized after user interaction (click/touch). The game handles this automatically on first user input.

**Canvas Rendering**: Uses immediate mode 2D canvas rendering with:
- Custom spaceship and monster designs using paths and shapes
- Glowing particle effects with shadow blur
- Real-time UI overlay rendering
- Space battlefield background with procedural stars

**Mobile Detection**: Uses comprehensive user agent and touch capability detection for responsive behavior with virtual joysticks and touch buttons.

**Save System**: Uses localStorage for high score persistence only.

**Skill Enhancement System**: Player bullets gain properties (homing, piercing, reflection, multi-shot) based on acquired skills with rarity-weighted selection.

### Language and Localization

- **Primary Language**: Japanese
- All UI text, item descriptions, and user-facing strings are in Japanese
- Comments and code structure documentation is in Japanese
- Commit messages should be in Japanese

### Performance Considerations

- Single-threaded game loop with requestAnimationFrame
- Particle system with automatic cleanup
- Efficient collision detection for bullets/enemies
- Mobile-optimized rendering paths
- Complex visual effects use save/restore context patterns

### Unique Features

- **Combo System**: Consecutive kills without taking damage modify all audio frequencies
- **Weapon Auto-switching**: When limited ammo weapons run out, automatically reverts to previous weapon
- **Dynamic BGM**: Background music changes intensity based on game phase/wave
- **Multi-stage Item Attraction**: Advanced attraction system with distance-based speed for smooth pickup
- **Charge-based Secondary Weapon**: Wave attack charges by killing enemies (max 10 charges)
- **Temporary Weapon System**: Nuke launcher becomes primary weapon for 5 shots then reverts

### Development Patterns

- Feature additions prioritized over code refactoring
- Visual distinction between game elements is critical
- Sound effects should be added for all interactive elements
- Mobile compatibility must be maintained for all new features
- Pause functionality should include BGM control

## Mobile Compatibility Implementation

### Touch and Scroll Prevention System

**Problem Solved**: iPhone/iPad users experienced unwanted scrolling when touching the game screen, preventing proper gameplay.

**Implementation**:
1. **Canvas Touch Events** (game.js lines 806-824):
   ```javascript
   // キャンバス要素のタッチスクロール防止
   this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
   this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
   this.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });
   
   // ドキュメント全体のタッチスクロール防止（ゲーム中のみ）
   document.addEventListener('touchmove', (e) => {
       if (this.gameState === 'playing') e.preventDefault();
   }, { passive: false });
   ```

2. **CSS Touch Action** (style.css):
   ```css
   body {
       touch-action: none;
       position: fixed;
       width: 100%;
       height: 100%;
   }
   
   #game-canvas {
       touch-action: none;
       -webkit-touch-callout: none;
       -webkit-user-select: none;
       user-select: none;
   }
   ```

3. **Virtual Stick Enhancement**: All virtual stick touch events use `{ passive: false }` option to ensure preventDefault() works on iOS Safari.

### Responsive Design System

**Mobile Portrait/Landscape Support**:

1. **Portrait Mode Optimization** (`@media (max-width: 768px)`):
   - Compact UI elements and reduced font sizes
   - Mobile-specific stat bars and control layouts
   - Optimized button spacing and touch targets

2. **Landscape Mode Optimization** (`@media screen and (orientation: landscape) and (max-height: 500px)`):
   - Compressed vertical layouts for limited height
   - Smaller virtual sticks (80px vs 120px)
   - Reduced UI padding and margins
   - Horizontal button arrangements where appropriate

3. **Game Over Screen**: 
   - Prevents text cutoff with `max-height: 90vh` and `overflow-y: auto`
   - Responsive font scaling based on orientation
   - Adaptive button layouts (vertical in portrait, horizontal in landscape)

### S3 Deployment Configuration

**Critical Settings**: For proper CSS/JS loading, ensure S3 objects have correct Content-Type headers:
- `style.css` → `Content-Type: text/css`
- `game.js` → `Content-Type: application/javascript`  
- `index.html` → `Content-Type: text/html`

**Access Method**: AWS S3 Console → Select file → Actions → Edit metadata

### Mobile Testing Strategy

1. **Local Testing**: Use `python3 -m http.server 8080` from public/ directory
2. **Device Testing**: iPhone/iPad access via `http://[Mac-IP]:8080`
3. **DevTools Limitation**: Chrome DevTools mobile emulation has User Agent detection issues
4. **Real Device Required**: Virtual stick display depends on proper mobile detection

### Known Mobile Behaviors

- **iOS Safari**: Requires `{ passive: false }` for preventDefault() to work
- **Touch Events**: Must be bound to specific elements, not document-wide
- **Viewport**: Uses fixed positioning to prevent iOS Safari address bar issues
- **Audio Context**: Automatically initialized on first user touch/click

## Responsive Scaling System

### Base Resolution Implementation

**Problem Solved**: Character sizes appeared drastically different between PC and mobile devices due to direct canvas sizing.

**Solution**: Fixed base resolution system (1280x720) with responsive scaling:

```javascript
// Base resolution setup in setupCanvas()
this.baseWidth = 1280;
this.baseHeight = 720;

// Aspect ratio maintained scaling
const scaleX = availableWidth / this.baseWidth;
const scaleY = availableHeight / this.baseHeight;
this.gameScale = Math.min(scaleX, scaleY);

// Canvas sizing with DPR support
this.canvas.width = this.baseWidth * dpr;
this.canvas.height = this.baseHeight * dpr;
this.ctx.scale(dpr, dpr);
```

### Safe Area Integration

**iOS Safari Address Bar Overlap Fix**:
```css
body {
    height: calc(var(--vh, 1vh) * 100);
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}
```

```javascript
// Dynamic viewport height calculation
if (this.isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    document.documentElement.style.setProperty('--vh', `${availableHeight * 0.01}px`);
}
```

### Coordinate System Unification

All game elements now use base resolution coordinates:
- Player spawn: (640, 360) - center of base resolution
- Enemy spawn boundaries: baseWidth/baseHeight instead of canvas dimensions
- Collision detection: unified coordinate system
- Camera positioning: base resolution relative

### Testing Protocol

**IMPORTANT**: Always test locally before pushing to production:

1. **Local Test**: `python3 -m http.server 8080` from public/ directory
2. **Device Test**: iPhone access via `http://[Mac-IP]:8080`
3. **Verify**: Character sizes consistent between PC and mobile
4. **Check**: No UI overlap with Safari address bar
5. **Confirm**: Proper scaling in both portrait and landscape modes

**DO NOT push changes without user testing approval**