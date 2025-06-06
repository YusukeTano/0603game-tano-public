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
        this.virtualMapSize = {
            width: GAME_CONFIG.VIRTUAL_MAP_WIDTH,
            height: GAME_CONFIG.VIRTUAL_MAP_HEIGHT
        };
        
        // Input
        this.mouseX = 0;
        this.mouseY = 0;
        
        // Effects
        this.specialEffectActive = false;
        this.specialEffectTime = 0;
        this.damageWarningActive = false;
        this.damageWarningTime = 0;
        this.screenShakeTime = 0;
        this.screenShakeIntensity = 0;
        
        this.setupEventListeners();
        this.audioManager.init();
        
        console.log('Game initialized with auto-attack system');
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
    }
    
    setupEventListeners() {
        // Mouse events
        document.addEventListener('mousemove', (e) => {
            this.mouseX = e.clientX;
            this.mouseY = e.clientY;
            
            // Update custom cursor
            const cursor = document.getElementById('customCursor');
            cursor.style.left = e.clientX + 'px';
            cursor.style.top = e.clientY + 'px';
        });
        
        document.addEventListener('mousedown', (e) => {
            if (e.button === 0) { // Left click - weapon switch
                if (this.gameRunning && !this.gamePaused) {
                    if (this.weaponSystem.switchWeapon()) {
                        this.updateWeaponUI();
                        this.particleSystem.createParticles(
                            this.player.x, this.player.y, 
                            this.weaponSystem.getCurrentWeapon().color, 15
                        );
                        this.audioManager.playSound('pickup', 800, 0.1);
                    }
                }
            } else if (e.button === 2) { // Right click - special ability
                e.preventDefault();
                this.useSpecialAbility();
            }
        });
        
        document.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.gameRunning) {
                    this.pauseGame();
                }
            } else if (e.key === 'a' || e.key === 'A') {
                // Toggle auto-attack with A key
                if (this.gameRunning && !this.gamePaused) {
                    const enabled = this.weaponSystem.toggleAutoAttack();
                    this.showNotification(
                        enabled ? '自動攻撃: ON' : '自動攻撃: OFF',
                        enabled ? '#00ff00' : '#ff0000'
                    );
                }
            }
        });
        
        // Touch events for mobile
        document.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
        });
        
        document.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.mouseX = touch.clientX;
            this.mouseY = touch.clientY;
        });
    }
    
    // Auto-attack system
    updateAutoAttack(dt) {
        if (!this.weaponSystem.canAutoFire(this.enemies, this.player)) return;
        
        const targets = this.weaponSystem.getAutoAttackTargets(this.enemies, this.player, this.skills);
        
        if (targets.length === 0) return;
        
        this.weaponSystem.fire();
        const weapon = this.weaponSystem.getCurrentWeapon();
        
        targets.forEach((target, index) => {
            if (index < weapon.count + (this.skills.find(s => s.id === 'multishot')?.level || 0)) {
                // Calculate angle to target
                const angle = Math.atan2(target.dy, target.dx);
                
                // Add spread for weapons with multiple projectiles
                const spreadAngle = weapon.count > 1 ? 
                    angle + (index - weapon.count / 2) * GAME_CONFIG.WEAPON_FIRE_SPREAD : angle;
                
                const projectile = this.objectPool.getPooledProjectile();
                Object.assign(projectile, {
                    x: this.player.x,
                    y: this.player.y,
                    vx: Math.cos(spreadAngle) * weapon.speed,
                    vy: Math.sin(spreadAngle) * weapon.speed,
                    damage: weapon.damage + (this.skills.find(s => s.id === 'damage')?.level || 0) * 5,
                    range: weapon.range + (this.skills.find(s => s.id === 'range')?.level || 0) * 100,
                    traveled: 0,
                    piercing: weapon.piercing || (this.skills.find(s => s.id === 'piercing')?.level || 0) > 0,
                    explosive: weapon.explosive || (this.skills.find(s => s.id === 'explosion')?.level || 0) > 0,
                    color: weapon.color
                });
                projectile.hits.length = 0;
                this.projectiles.push(projectile);
            }
        });
        
        // Play attack sound
        this.audioManager.playSound('hit', 440 + Math.random() * 200, 0.05);
    }
    
    // Game methods that would be implemented...
    startGame() {
        this.gameRunning = true;
        this.gamePaused = false;
        
        // Hide title screen
        document.getElementById('titleScreen').classList.add('hidden');
        
        // Show game controls
        document.getElementById('pauseBtn').classList.remove('hidden');
        document.getElementById('titleBtn').classList.remove('hidden');
        
        // Reset game state
        this.score = 0;
        this.combo = 0;
        this.specialAvailable = false;
        
        // Enable special after 10 seconds
        setTimeout(() => {
            if (this.gameRunning) {
                this.specialAvailable = true;
                this.showNotification('必殺技が使用可能！', '#ffff00');
            }
        }, 10000);
        
        this.enemies = [];
        this.projectiles = [];
        this.expOrbs = [];
        this.weaponItems = [];
        this.particleSystem.particles = [];
        this.skills = [];
        
        // Reset player
        this.player = new Player(GAME_CONFIG.VIRTUAL_MAP_WIDTH / 2, GAME_CONFIG.VIRTUAL_MAP_HEIGHT / 2);
        
        // Reset weapon system
        this.weaponSystem = new WeaponSystem();
        
        // Start game loop
        this.lastTime = performance.now();
        this.gameLoop(this.lastTime);
        
        // Show auto-attack hint
        this.showNotification('Aキーで自動攻撃ON/OFF', '#00ffff');
    }
    
    gameLoop(timestamp) {
        if (!this.gameRunning) return;

        this.deltaTime = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        if (!this.gamePaused) {
            this.gameTime += this.deltaTime * 1000;
            
            this.updatePlayer(this.deltaTime);
            this.updateCamera();
            this.updateAutoAttack(this.deltaTime); // Auto-attack update
            this.updateProjectiles(this.deltaTime);
            this.updateEnemies(this.deltaTime);
            this.updateExpOrbs(this.deltaTime);
            this.particleSystem.update(this.deltaTime);
            
            // Spawn enemies
            this.enemySpawnTimer += this.deltaTime * 1000;
            if (this.enemySpawnTimer > this.enemySpawnRate) {
                this.enemySpawnTimer = 0;
                this.spawnEnemy();
                this.enemySpawnRate = Math.max(200, 1000 - this.player.level * 50);
            }
            
            // Check game over
            if (this.player.hp <= 0) {
                this.gameOver();
                return;
            }
        }

        this.render();
        this.updateUI();
        this.drawMinimap();
        requestAnimationFrame((ts) => this.gameLoop(ts));
    }
    
    // Placeholder methods - would need full implementation
    updatePlayer(dt) {
        this.player.update(dt, this.mouseX, this.mouseY, this.cameraOffset, this.virtualMapSize, this.skills);
    }
    
    updateCamera() {
        const targetX = this.player.x - this.width / 2;
        const targetY = this.player.y - this.height / 2;
        
        this.cameraOffset.x += (targetX - this.cameraOffset.x) * 0.1;
        this.cameraOffset.y += (targetY - this.cameraOffset.y) * 0.1;
        
        this.cameraOffset.x = Math.max(0, Math.min(this.virtualMapSize.width - this.width, this.cameraOffset.x));
        this.cameraOffset.y = Math.max(0, Math.min(this.virtualMapSize.height - this.height, this.cameraOffset.y));
    }
    
    updateProjectiles(dt) {
        this.projectiles = this.projectiles.filter(proj => {
            proj.x += proj.vx * dt;
            proj.y += proj.vy * dt;
            proj.traveled += Math.sqrt(proj.vx * proj.vx + proj.vy * proj.vy) * dt;

            if (proj.traveled > proj.range) {
                this.objectPool.returnProjectileToPool(proj);
                return false;
            }

            // Check collision with enemies
            for (let enemy of this.enemies) {
                if (proj.hits.includes(enemy)) continue;

                const distanceSquared = getDistanceSquared(proj.x, proj.y, enemy.x, enemy.y);
                const collisionRadiusSquared = (enemy.radius + GAME_CONFIG.PROJECTILE_BASE_RADIUS) ** 2;

                if (distanceSquared < collisionRadiusSquared) {
                    proj.hits.push(enemy);
                    enemy.hp -= proj.damage;
                    
                    this.particleSystem.createParticles(enemy.x, enemy.y, '#00ffff', 5);
                    this.audioManager.playSound('hit', 440 + Math.random() * 200, 0.05);

                    if (proj.explosive) {
                        this.createExplosion(proj.x, proj.y, 50, proj.damage * 0.5);
                    }

                    if (!proj.piercing) {
                        this.objectPool.returnProjectileToPool(proj);
                        return false;
                    }
                }
            }

            return proj.x > -100 && proj.x < this.virtualMapSize.width + 100 && 
                   proj.y > -100 && proj.y < this.virtualMapSize.height + 100;
        });
    }
    
    updateEnemies(dt) {
        this.enemies = this.enemies.filter(enemy => {
            // Move towards player
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed * dt;
                enemy.y += (dy / distance) * enemy.speed * dt;
            }

            // Check collision with player
            if (checkCircleCollision(this.player, enemy) && !this.player.invulnerable && !this.feverMode) {
                this.player.takeDamage(enemy.damage);
                this.damageWarningActive = true;
                this.damageWarningTime = GAME_CONFIG.DAMAGE_WARNING_DURATION;
                
                this.particleSystem.createParticles(this.player.x, this.player.y, '#ff0000', 10);
                this.audioManager.playSound('hit', 200, 0.2);
            }

            // Check if dead
            if (enemy.hp <= 0) {
                // Drop exp orb
                this.expOrbs.push({
                    x: enemy.x,
                    y: enemy.y,
                    value: enemy.exp,
                    radius: GAME_CONFIG.EXP_ORB_RADIUS,
                    attractRadius: GAME_CONFIG.EXP_ORB_ATTRACT_RADIUS,
                    speed: GAME_CONFIG.EXP_ORB_SPEED
                });

                // Weapon drop chance
                if (Math.random() < GAME_CONFIG.WEAPON_DROP_CHANCE) {
                    const availableWeapons = [1, 2, 3, 4, 5];
                    const weaponIndex = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
                    
                    this.weaponItems.push({
                        x: enemy.x,
                        y: enemy.y,
                        radius: 12,
                        attractRadius: 100,
                        speed: 200,
                        weaponIndex: weaponIndex,
                        color: WEAPON_TYPES[weaponIndex].color,
                        type: 'weapon'
                    });
                }

                this.particleSystem.createDeathParticles(enemy.x, enemy.y);
                this.score += enemy.exp * 10;
                
                return false;
            }

            return true;
        });
    }
    
    updateExpOrbs(dt) {
        this.expOrbs = this.expOrbs.filter(orb => {
            const distance = getDistance(this.player.x, this.player.y, orb.x, orb.y);

            // Attract to player if close
            if (distance < orb.attractRadius) {
                const moveDistance = orb.speed * dt;
                const dx = this.player.x - orb.x;
                const dy = this.player.y - orb.y;
                orb.x += (dx / distance) * moveDistance;
                orb.y += (dy / distance) * moveDistance;
            }

            // Collect
            if (checkCircleCollision(this.player, orb)) {
                if (orb.type === 'weapon') {
                    if (this.weaponSystem.addWeapon(orb.weaponIndex)) {
                        const weaponName = WEAPON_TYPES[orb.weaponIndex].name;
                        this.showNotification(`新武器獲得: ${weaponName}！`, WEAPON_TYPES[orb.weaponIndex].color);
                        this.audioManager.playSound('levelup', 880, 0.2);
                        this.updateWeaponUI();
                    } else {
                        this.player.exp += 25;
                        this.showNotification('経験値ボーナス +25！', '#ffff00');
                    }
                } else {
                    this.player.exp += orb.value;
                    this.audioManager.playSound('pickup', 880, 0.1);
                    
                    if (this.player.exp >= this.player.expToNext) {
                        this.levelUp();
                    }
                }

                this.particleSystem.createPickupParticles(orb.x, orb.y);
                return false;
            }

            return true;
        });
        
        // Handle weapon items
        this.weaponItems = this.weaponItems.filter(item => {
            const distance = getDistance(this.player.x, this.player.y, item.x, item.y);

            if (distance < item.attractRadius) {
                const moveDistance = item.speed * dt;
                const dx = this.player.x - item.x;
                const dy = this.player.y - item.y;
                item.x += (dx / distance) * moveDistance;
                item.y += (dy / distance) * moveDistance;
            }

            if (distance < this.player.radius + item.radius) {
                if (this.weaponSystem.addWeapon(item.weaponIndex)) {
                    const weaponName = WEAPON_TYPES[item.weaponIndex].name;
                    this.showNotification(`新武器獲得: ${weaponName}！`, item.color);
                    this.audioManager.playSound('levelup', 880, 0.2);
                    this.updateWeaponUI();
                } else {
                    this.player.exp += 25;
                    this.showNotification('経験値ボーナス +25！', '#ffff00');
                }
                
                this.particleSystem.createPickupParticles(item.x, item.y, item.color);
                return false;
            }

            return true;
        });
    }
    
    spawnEnemy() {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(this.width, this.height) * 0.8;
        const types = ['basic', 'fast', 'tank'];
        const weights = [0.5, 0.35, 0.15];
        
        let type = 'basic';
        const rand = Math.random();
        let cumulative = 0;
        for (let i = 0; i < types.length; i++) {
            cumulative += weights[i];
            if (rand < cumulative) {
                type = types[i];
                break;
            }
        }

        const spawnX = this.player.x + Math.cos(angle) * distance;
        const spawnY = this.player.y + Math.sin(angle) * distance;
        
        const clampedX = Math.max(50, Math.min(this.virtualMapSize.width - 50, spawnX));
        const clampedY = Math.max(50, Math.min(this.virtualMapSize.height - 50, spawnY));

        const enemy = {
            x: clampedX,
            y: clampedY,
            type: type,
            radius: 15,
            hp: 20,
            maxHp: 20,
            speed: 40,
            damage: 8,
            exp: 5
        };

        switch(type) {
            case 'fast':
                enemy.radius = 10;
                enemy.hp = enemy.maxHp = 15;
                enemy.speed = 60;
                enemy.damage = 6;
                enemy.exp = 3;
                break;
            case 'tank':
                enemy.radius = 25;
                enemy.hp = enemy.maxHp = 40;
                enemy.speed = 25;
                enemy.damage = 12;
                enemy.exp = 10;
                break;
        }

        // Scale with level
        const levelMultiplier = 1 + this.player.level * 0.2;
        enemy.hp = enemy.maxHp = Math.floor(enemy.maxHp * levelMultiplier);
        enemy.speed *= Math.min(2, levelMultiplier);
        enemy.damage *= Math.min(1.5, levelMultiplier);

        this.enemies.push(enemy);
    }
    
    levelUp() {
        this.player.levelUp();
        this.showSkillSelection();
        this.gamePaused = true;
    }
    
    useSpecialAbility() {
        if (!this.specialAvailable || this.gamePaused || !this.gameRunning) return;
        
        this.specialAvailable = false;
        
        // Clear all enemies
        this.enemies.forEach(enemy => {
            enemy.hp = 0;
        });
        
        // Visual effects
        this.specialEffectActive = true;
        this.specialEffectTime = 2000;
        this.screenShakeTime = 2000;
        this.screenShakeIntensity = 35;
        
        this.particleSystem.createExplosionParticles(this.player.x, this.player.y, '#ffff00', 5);
        this.audioManager.playSound('levelup', 880, 0.5);
        
        // Reset special availability
        setTimeout(() => {
            this.specialAvailable = true;
        }, GAME_CONFIG.SPECIAL_ABILITY_COOLDOWN);
    }
    
    createExplosion(x, y, radius, damage) {
        this.particleSystem.createExplosionParticles(x, y);
        
        this.enemies.forEach(enemy => {
            const distance = getDistance(x, y, enemy.x, enemy.y);
            if (distance < radius) {
                enemy.hp -= damage;
            }
        });
    }
    
    // UI methods
    updateWeaponUI() {
        const weapon = this.weaponSystem.getCurrentWeapon();
        document.getElementById('currentWeapon').textContent = weapon.name;
        document.getElementById('weaponStats').textContent = 
            `DMG: ${weapon.damage} | 速度: ${weapon.fireRate}ms | 射程: ${weapon.range}`;
    }
    
    updateUI() {
        document.getElementById('scoreValue').textContent = Math.floor(this.score);
        document.getElementById('levelValue').textContent = this.player.level;
        document.getElementById('hpFill').style.width = `${(this.player.hp / this.player.maxHp) * 100}%`;
        document.getElementById('expFill').style.width = `${(this.player.exp / this.player.expToNext) * 100}%`;
        
        if (this.specialAvailable) {
            document.getElementById('specialReady').classList.add('active');
        } else {
            document.getElementById('specialReady').classList.remove('active');
        }
        
        this.updateWeaponUI();
    }
    
    showNotification(text, color) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: ${color};
            padding: 20px 40px;
            border-radius: 10px;
            font-size: 24px;
            font-weight: bold;
            text-shadow: 0 0 10px ${color};
            border: 2px solid ${color};
            z-index: 10000;
            animation: fadeInOut 3s ease-in-out;
        `;
        notification.textContent = text;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 3000);
    }
    
    showSkillSelection() {
        // Simplified skill selection - would need full implementation
        setTimeout(() => {
            this.gamePaused = false;
        }, 100);
    }
    
    render() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // Apply camera transform
        this.ctx.save();
        this.ctx.translate(-this.cameraOffset.x, -this.cameraOffset.y);
        
        // Draw player
        this.player.render(this.ctx, this.feverMode);
        
        // Draw enemies
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.type === 'fast' ? '#ff00ff' : enemy.type === 'tank' ? '#ff6600' : '#ff0066';
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw projectiles
        this.projectiles.forEach(proj => {
            this.ctx.fillStyle = proj.color || '#00ffff';
            this.ctx.beginPath();
            this.ctx.arc(proj.x, proj.y, GAME_CONFIG.PROJECTILE_BASE_RADIUS, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw exp orbs
        this.expOrbs.forEach(orb => {
            this.ctx.fillStyle = '#00ff00';
            this.ctx.beginPath();
            this.ctx.arc(orb.x, orb.y, orb.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw weapon items
        this.weaponItems.forEach(item => {
            this.ctx.fillStyle = item.color;
            this.ctx.beginPath();
            this.ctx.arc(item.x, item.y, item.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw particles
        this.particleSystem.render(this.ctx);
        
        this.ctx.restore();
    }
    
    drawMinimap() {
        // Simplified minimap
        this.minimapCtx.fillStyle = '#0a0a0a';
        this.minimapCtx.fillRect(0, 0, 200, 150);
        
        this.minimapCtx.strokeStyle = '#00ffff';
        this.minimapCtx.lineWidth = 2;
        this.minimapCtx.strokeRect(0, 0, 200, 150);
    }
    
    // Game state methods
    pauseGame() {
        this.gamePaused = !this.gamePaused;
        this.manualPause = this.gamePaused;
        
        if (this.gamePaused) {
            document.getElementById('pauseMenu').classList.add('active');
        } else {
            document.getElementById('pauseMenu').classList.remove('active');
        }
    }
    
    resumeGame() {
        this.gamePaused = false;
        this.manualPause = false;
        document.getElementById('pauseMenu').classList.remove('active');
    }
    
    restartGame() {
        this.gameRunning = false;
        document.getElementById('gameOver').classList.remove('active');
        document.getElementById('pauseMenu').classList.remove('active');
        this.startGame();
    }
    
    backToTitle() {
        this.gameRunning = false;
        document.getElementById('titleScreen').classList.remove('hidden');
        document.getElementById('gameOver').classList.remove('active');
        document.getElementById('pauseMenu').classList.remove('active');
        document.getElementById('pauseBtn').classList.add('hidden');
        document.getElementById('titleBtn').classList.add('hidden');
    }
    
    gameOver() {
        this.gameRunning = false;
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        const minutes = Math.floor(this.gameTime / 60000);
        const seconds = Math.floor((this.gameTime % 60000) / 1000);
        document.getElementById('survivalTime').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('gameOver').classList.add('active');
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});

// Export for debugging
export { Game };