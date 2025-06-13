# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Quick Reference

### Development Commands
```bash
# Local development server
cd /Users/tano/0603game/public/
python3 -m http.server 8080

# Mobile testing (find Mac IP first)
ifconfig | grep "inet " | grep -v 127.0.0.1
# Then access from device: http://[Mac-IP]:8080

# Testing dependencies
npm install  # Installs puppeteer, express, ws, cors, node-fetch
```

### Git Workflow
```bash
# Standard workflow (Japanese commit messages)
git add .
git commit -m "機能追加と改良実装"
git push origin main

# Feature branch workflow
git checkout -b feature/new-system
git add .
git commit -m "NewSystem分離と統合"
git checkout main
git merge feature/new-system
```

## Architecture Overview

**Modular HTML5 Canvas 2D space survival game** written in vanilla JavaScript with ES6 modules.

### Current Architecture (2025/6/13)

**9 Core Systems** managing the main `ZombieSurvival` class:

| System | Lines | Purpose |
|--------|-------|---------|
| AudioSystem | 453 | Web Audio API, dynamic sound generation |
| InputSystem | 218 | PC/mobile input, virtual sticks |
| RenderSystem | 809 | Canvas 2D rendering for all entities |
| PhysicsSystem | 264 | Collision detection, physics simulation |
| WeaponSystem | 402 | Weapon management, bullet generation |
| EnemySystem | 525 | AI, spawning, boss management |
| ParticleSystem | 475 | Particle effects, visual enhancements |
| LevelSystem | 417 | Experience, leveling, skill selection |
| **StageSystem** | 392 | **NEW: Stage progression unification** |
| **PickupSystem** | 213 | **Item drop management, balanced rates** |

**Additional Systems**:
- TutorialConfig (120 lines) - Tutorial progression system
- UISystem, BulletSystem (integrated)

**Migration Progress**: 4,486 lines monolithic → 2,358 lines core + 10 systems
**Reduction**: 47% complexity reduction in main class

## Key Features

### Game Systems
- **Modular Architecture**: 9 independent systems for maintainability
- **Stage Progression**: Unified 4-wave per stage system with visual progress
- **Skill System**: Probability-based skills (25% chance) vs fixed upgrades (10%)
- **Tutorial System**: 3-stage difficulty progression for new players
- **Mobile Support**: Full iPhone/iPad compatibility with virtual controls

### Technical Features
- **ES6 Modules**: Native import/export system
- **Canvas 2D**: Hardware-accelerated rendering with base 1280x720 resolution
- **Web Audio API**: Dynamic sound generation and iOS compatibility
- **Touch Controls**: `{ passive: false }` implementation for scroll prevention
- **Responsive Design**: Portrait/landscape orientation support

## Critical Implementation Details

### System Integration
```javascript
// Systems communicate through main game instance
this.game.audioSystem.playSound();
this.game.particleSystem.createEffect();
this.game.levelSystem.addExperience(50);
```

### Essential Requirements
- **HTTP Server**: ES6 modules require `python3 -m http.server` (not file://)
- **Mobile Touch**: All touch events use `{ passive: false }` for scroll prevention
- **Audio Context**: Must resume after user interaction (iOS Safari compatibility)
- **Game Initialization**: `window.game = new ZombieSurvival()` required for mobile UI
- **Canvas Scaling**: Base resolution 1280x720 with device pixel ratio support

### File Structure
```
public/
├── game.js                     # Main game class (2,358 lines)
├── index.html                  # Game UI and screens
├── style.css                   # Complete styling
└── js/
    ├── main.js                 # Entry point
    ├── config/tutorial.js      # Tutorial configuration
    ├── systems/                # 10 modular systems
    │   ├── stage-system.js     # Stage progression (NEW)
    │   ├── audio-system.js     # Web Audio API
    │   ├── input-system.js     # PC/mobile input
    │   ├── render-system.js    # Canvas rendering
    │   ├── physics-system.js   # Collision detection
    │   ├── weapon-system.js    # Weapon management
    │   ├── enemy-system.js     # AI and spawning
    │   ├── particle-system.js  # Visual effects
    │   ├── level-system.js     # Experience and skills
    │   └── pickup-system.js    # Item drops and effects
    └── entities/               # Entity classes
        ├── player.js
        ├── bullet.js
        ├── pickup.js
        └── enemy.js
```

## Development Guidelines

### Adding New Features
1. **Determine target system** - Which existing system should contain the feature?
2. **Create new system if needed** - Use established patterns for system communication
3. **Include mobile compatibility** - Touch events, responsive design, virtual controls
4. **Add audio feedback** - Coordinate with AudioSystem for sound effects
5. **Include visual feedback** - Use ParticleSystem for enhanced user experience
6. **Test on real devices** - Chrome DevTools insufficient for mobile testing

### System Creation Pattern
```javascript
export class NewSystem {
    constructor(game) {
        this.game = game; // Reference for system communication
        console.log('NewSystem: システム初期化完了');
    }
    
    update(deltaTime) {
        // Main update logic
    }
    
    // Public API methods for game integration
}

// Integration in ZombieSurvival constructor
this.newSystem = new NewSystem(this);

// Integration in ZombieSurvival.update()
this.newSystem.update(deltaTime);
```

### Code Standards
- **Language**: Japanese for UI text, commit messages, and user-facing content
- **Git Strategy**: Feature branches for major changes (`feature/system-name`)
- **Safety First**: Maintain backward compatibility during refactoring
- **Real Device Testing**: Always test iPhone/iPad on actual devices
- **ES6 Modules**: Use native import/export, avoid CommonJS

## Mobile Compatibility

### Touch Control Implementation
```javascript
// Essential touch event setup
this.canvas.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });
this.canvas.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });
this.canvas.addEventListener('touchend', (e) => e.preventDefault(), { passive: false });

// Document-wide scroll prevention during gameplay
document.addEventListener('touchmove', (e) => {
    if (this.gameState === 'playing') e.preventDefault();
}, { passive: false });
```

### CSS Mobile Optimization
```css
body {
    touch-action: none;
    position: fixed;
    width: 100%;
    height: 100%;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
}

#game-canvas {
    touch-action: none;
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    user-select: none;
}
```

### Mobile Detection
```javascript
detectMobile() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    const hasTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
    const hasTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
    const isAppleMobile = /iphone|ipad|ipod/i.test(userAgent);
    const isSmallScreen = window.innerWidth <= 1024 || window.innerHeight <= 1024;
    
    return isAppleMobile || isMobileUA || hasTouchPoints || hasTouch || isSmallScreen;
}
```

### Virtual Stick Configuration
- **High Sensitivity**: 1px dead zone, 20px max distance for competitive feel
- **Transparency**: Semi-transparent (0.05-0.3 opacity) to maintain game visibility
- **Responsive Positioning**: Adapts to portrait/landscape orientations
- **Force Display**: Delayed forced display after game start to prevent UI conflicts

## Recent Improvements (2025/6/13)

### Major Features Implemented

#### 1. Stage System Integration
- **Unified Progression**: 4-wave per stage system replacing confusing wave numbers
- **Visual Progress**: Stage display ("ステージ 2-3") with progress bar
- **System Unification**: BGM, boss spawning, and progression now synchronized
- **Safe Integration**: Parallel operation with legacy systems for stability

#### 2. Skill System Overhaul
- **Probability-Based Skills**: 25% chance effects vs 10% fixed upgrades
- **Balanced Design**: Higher risk/reward for chance-based skills
- **Fair Selection**: All skills now common rarity (no luck-based advantages)
- **Removed Homing**: Eliminated auto-targeting to preserve gameplay skill requirement

#### 3. Tutorial System
- **Stage 1**: 5 enemy limit, 3x XP boost, normal enemies only
- **Stage 2**: 15 enemy limit, 2x XP boost, normal + fast enemies
- **Stage 3+**: Full game experience with all enemy types
- **Gradual Learning**: Prevents new player overwhelm

#### 4. Mobile UI Optimization
- **Virtual Stick Fixes**: Proper display in both orientations
- **Touch Prevention**: Comprehensive scroll prevention system
- **Transparency**: Semi-transparent controls for better visibility
- **High Sensitivity**: 1px dead zone for competitive control

#### 5. Pickup System Cleanup (2025/6/13)
- **Removed Unused Items**: Eliminated dash/ammo pickup types (未実装機能削除)
- **Balanced Drop Rates**: Updated to nuke 1%, health 50%, range 25%, speed 25%
- **Range Nerf**: Reduced range multiplier from 1.2x (20%) to 1.05x (5%) for better balance
- **Code Reduction**: Removed ~40 lines of unused pickup functionality

#### 6. Homing System Integration & 17-Skill System (2025/6/14)
- **Homing Skill Added**: ホーミング精度向上スキル実装（追尾強度+0.02、範囲+40px）
- **Bullet Lifetime Management**: 4つの削除条件で弾丸残留問題解決（5秒制限、1000px制限、敵失敗1秒、画面外500px）
- **17-Skill Independent System**: 従来7種→17種独立スキルシステム実装
- **Rarity Rebalance**: Common 67.679%, Uncommon 17.591%, Rare 8.329%, Epic 5.391%, Legendary 1.010%

### Architecture Achievements
- **47% Code Reduction**: Main class reduced from 4,486 to 2,358 lines
- **12 Modular Systems**: Independent, testable system architecture including PickupSystem
- **100% Mobile Compatible**: Full iPhone/iPad support with virtual controls
- **Safety-First Approach**: All changes maintain backward compatibility

## Summary

**2025年6月14日** - CLAUDE.md更新完了

このドキュメントは、0603gameプロジェクトの**モジュラーHTML5 Canvas 2Dスペースサバイバルゲーム**の開発ガイドです。

### Current Status
- **47% Code Reduction**: 4,486行 → 2,358行 + 10モジュラーシステム
- **完全モバイル対応**: iPhone/iPad バーチャルコントロール
- **段階的チュートリアル**: 初心者挫折率低減システム
- **17種独立スキルシステム**: レアリティ別効果分散で戦略性向上
- **ホーミングシステム**: 弾丸追尾機能と寿命管理システム
- **統合ステージ進行**: 直感的な"ステージ 2-3"表示システム
- **最適化ピックアップ**: バランス調整されたアイテムドロップシステム

### Architecture Achievements
**モジュラーアーキテクチャ移行100%完了** - 保守性・拡張性・パフォーマンスが大幅向上した次世代ゲームアーキテクチャを確立。

### 17-Skill System Data Model (2025/6/14)
```javascript
// 新レアリティ確率分布
const RARITY_WEIGHTS = {
    common:    67.679%,  // 基本強化 I (10%効果) - 3種
    uncommon:  17.591%,  // 基本強化 II (20%効果) + 確率系 I (10%効果) - 5種
    rare:       8.329%,  // 基本強化 III (30%効果) + 確率系 II (20%効果) - 5種
    epic:       5.391%,  // 確率系 III (30%効果) - 2種
    legendary:  1.010%   // ホーミング/反射 (20%効果) - 2種
}

// スキル構成
Common: 攻撃力/連射速度/弾サイズ強化 I (各10%)
Uncommon: 上記 II (各20%) + 貫通/マルチショット I (各10%)
Rare: 上記 III (各30%) + 貫通/マルチショット II (各20%)
Epic: 貫通/マルチショット III (各30%)
Legendary: ホーミング性能/反射性能 (各20%)
```

### Homing System Implementation (2025/6/14)
```javascript
// ホーミング弾丸寿命管理
const BULLET_LIFETIME_CONDITIONS = {
    maxAge: 5.0,           // 最大生存時間（秒）
    maxDistance: 1000,     // 発射位置からの最大距離（px）
    homingFailTime: 1.0,   // ホーミング失敗時間（秒）
    offScreenMargin: 500   // 画面外マージン（px）
}

// ホーミング効果値
const HOMING_VALUES = {
    baseStrength: 0.1,     // 基本追尾強度
    baseRange: 200,        // 基本追尾範囲（px）
    bonusStrength: 0.02,   // スキル取得時追加強度
    bonusRange: 40         // スキル取得時追加範囲（px）
}
```

### Pickup System Data Model (2025/6/13)
```javascript
// 現在のドロップ確率分布
const ITEM_DROP_RATES = {
    nuke:   1%,   // Ultra Rare
    health: 50%,  // Most Common
    range:  25%,  // Common (1.05x = +5% range)
    speed:  25%   // Common (+5 speed)
}

// アイテム効果値
const ITEM_VALUES = {
    health: 10,    // 体力上限+10
    speed:  5,     // 移動速度+5
    range:  1.05,  // 射程5%増加 (累積乗算)
    nuke:   5      // ニューク5発装備
}
```