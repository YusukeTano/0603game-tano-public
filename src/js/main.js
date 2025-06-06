import { GAME_CONFIG, WEAPON_TYPES, SKILL_DEFINITIONS } from '../config/gameConfig.js';
import { AudioManager } from './audioManager.js';
import { ParticleSystem } from './particleSystem.js';
import { ObjectPool } from '../utils/objectPool.js';
import { checkCircleCollision, getDistance, getDistanceSquared } from '../utils/collision.js';
import { Player } from './entities/player.js';
import { WeaponSystem } from './entities/weaponSystem.js';

class Game {
    constructor() {
        this.init();
    }
    
    init() {
        // Canvas setup
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.minimapCanvas = document.querySelector('.minimap-canvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Game systems
        this.audioManager = new AudioManager();
        this.particleSystem = new ParticleSystem();
        this.objectPool = new ObjectPool();
        this.weaponSystem = new WeaponSystem();
        
        // Game state
        this.gameRunning = false;
        this.gamePaused = false;
        this.manualPause = false;
        
        // Entities
        this.player = new Player(GAME_CONFIG.VIRTUAL_MAP_WIDTH / 2, GAME_CONFIG.VIRTUAL_MAP_HEIGHT / 2);
        this.enemies = [];
        this.projectiles = [];
        this.expOrbs = [];
        this.weaponItems = [];
        
        // Game state variables
        this.score = 0;
        this.combo = 0;
        this.comboTimer = 0;
        this.skills = [];
        this.specialAvailable = false;
        this.currentPhase = 1;
        this.enemySpawnTimer = 0;
        this.enemySpawnRate = GAME_CONFIG.ENEMY_SPAWN_BASE_RATE;
        
        // Time management
        this.gameTime = 0;
        this.deltaTime = 0;
        this.lastTime = 0;
        this.remainingTime = GAME_CONFIG.TOTAL_GAME_TIME;
        this.totalGameTime = GAME_CONFIG.TOTAL_GAME_TIME;
        this.timePerPhase = GAME_CONFIG.PHASE_DURATION * 2;
        
        // Audio variables
        this.musicPhase = 0;
        this.currentBeat = 0;
        this.lastBeatTime = 0;
        this.beatInterval = GAME_CONFIG.BEAT_INTERVAL;
        this.feverMode = false;
        
        // Camera
        this.cameraOffset = { x: 0, y: 0 };
        this.virtualMapSize = {\n            width: GAME_CONFIG.VIRTUAL_MAP_WIDTH,\n            height: GAME_CONFIG.VIRTUAL_MAP_HEIGHT\n        };\n        \n        // Input\n        this.mouseX = 0;\n        this.mouseY = 0;\n        \n        // Effects\n        this.specialEffectActive = false;\n        this.specialEffectTime = 0;\n        this.damageWarningActive = false;\n        this.damageWarningTime = 0;\n        this.screenShakeTime = 0;\n        this.screenShakeIntensity = 0;\n        \n        this.setupEventListeners();\n        this.audioManager.init();\n    }\n    \n    resizeCanvas() {\n        this.canvas.width = window.innerWidth;\n        this.canvas.height = window.innerHeight;\n        this.width = this.canvas.width;\n        this.height = this.canvas.height;\n    }\n    \n    setupEventListeners() {\n        // Mouse events\n        document.addEventListener('mousemove', (e) => {\n            this.mouseX = e.clientX;\n            this.mouseY = e.clientY;\n            \n            // Update custom cursor\n            const cursor = document.getElementById('customCursor');\n            cursor.style.left = e.clientX + 'px';\n            cursor.style.top = e.clientY + 'px';\n        });\n        \n        document.addEventListener('mousedown', (e) => {\n            if (e.button === 0) { // Left click - weapon switch\n                if (this.gameRunning && !this.gamePaused) {\n                    if (this.weaponSystem.switchWeapon()) {\n                        this.updateWeaponUI();\n                        this.particleSystem.createParticles(\n                            this.player.x, this.player.y, \n                            this.weaponSystem.getCurrentWeapon().color, 15\n                        );\n                        this.audioManager.playSound('pickup', 800, 0.1);\n                    }\n                }\n            } else if (e.button === 2) { // Right click - special ability\n                e.preventDefault();\n                this.useSpecialAbility();\n            }\n        });\n        \n        document.addEventListener('contextmenu', (e) => e.preventDefault());\n        \n        // Keyboard events\n        document.addEventListener('keydown', (e) => {\n            if (e.key === 'Escape') {\n                if (this.gameRunning) {\n                    this.pauseGame();\n                }\n            }\n        });\n        \n        // Touch events for mobile\n        document.addEventListener('touchstart', (e) => {\n            e.preventDefault();\n            const touch = e.touches[0];\n            this.mouseX = touch.clientX;\n            this.mouseY = touch.clientY;\n        });\n        \n        document.addEventListener('touchmove', (e) => {\n            e.preventDefault();\n            const touch = e.touches[0];\n            this.mouseX = touch.clientX;\n            this.mouseY = touch.clientY;\n        });\n    }\n    \n    // Game loop methods would continue here...\n    // This is a partial implementation to show the structure\n}\n\n// Initialize game when DOM is loaded\ndocument.addEventListener('DOMContentLoaded', () => {\n    window.game = new Game();\n});\n\n// Export for debugging\nexport { Game };