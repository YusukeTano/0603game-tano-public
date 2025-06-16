/**
 * MarioEntities - マリオ風ミニゲームエンティティクラス群
 * コイン・敵・ゴール・プラットフォーム等のゲームオブジェクト
 */

/**
 * ベースエンティティクラス
 */
class BaseEntity {
    constructor(x, y, width, height, type) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type;
        this.active = true;
        this.id = Math.random().toString(36).substr(2, 9);
    }
    
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}

/**
 * コインエンティティ
 */
export class Coin extends BaseEntity {
    constructor(x, y) {
        super(x, y, 12, 12, 'coin');
        
        this.collected = false;
        this.animationTime = 0;
        this.rotationSpeed = 4; // 回転速度
        this.bobSpeed = 2;      // 上下浮遊速度
        this.bobAmount = 2;     // 浮遊幅
        this.originalY = y;
        this.glowIntensity = 0;
        
        console.log('🪙 Coin: Created at', x, y);
    }
    
    update(deltaTime) {
        if (this.collected) {
            // 収集アニメーション（上昇しながらフェード）
            this.y -= 100 * deltaTime;
            this.animationTime += deltaTime;
            return this.animationTime < 0.5; // 0.5秒で消える
        }
        
        this.animationTime += deltaTime;
        
        // 上下浮遊アニメーション
        this.y = this.originalY + Math.sin(this.animationTime * this.bobSpeed) * this.bobAmount;
        
        // グロー効果
        this.glowIntensity = 0.5 + Math.sin(this.animationTime * 3) * 0.3;
        
        return true; // 存続
    }
    
    getAnimationInfo() {
        return {
            rotation: this.animationTime * this.rotationSpeed,
            glow: this.glowIntensity,
            collected: this.collected,
            bobOffset: this.y - this.originalY
        };
    }
}

/**
 * 敵エンティティ（クリボー風）
 */
export class Enemy extends BaseEntity {
    constructor(x, y, patrolStartX, patrolEndX) {
        super(x, y, 16, 16, 'enemy');
        
        this.velocityX = -50; // 初期移動速度（左向き）
        this.velocityY = 0;
        this.onGround = false;
        this.isDead = false;
        this.deathTime = 0;
        
        // パトロール範囲
        this.patrolStartX = patrolStartX || x - 50;
        this.patrolEndX = patrolEndX || x + 50;
        
        // アニメーション
        this.animationTime = 0;
        this.animationFrame = 0;
        this.facing = 'left';
        
        console.log('👾 Enemy: Created at', x, y, 'patrol:', this.patrolStartX, '-', this.patrolEndX);
    }
    
    update(deltaTime) {
        if (this.isDead) {
            return this.updateDeathAnimation(deltaTime);
        }
        
        this.animationTime += deltaTime;
        
        // アニメーション更新
        this.animationFrame = Math.floor(this.animationTime * 4) % 2;
        
        // 移動
        this.x += this.velocityX * deltaTime;
        
        // パトロール範囲チェック
        if (this.x <= this.patrolStartX) {
            this.velocityX = Math.abs(this.velocityX);
            this.facing = 'right';
        } else if (this.x >= this.patrolEndX) {
            this.velocityX = -Math.abs(this.velocityX);
            this.facing = 'left';
        }
        
        return true; // 存続
    }
    
    updateDeathAnimation(deltaTime) {
        const deathDuration = 1000; // 1秒で消える
        const elapsed = Date.now() - this.deathTime;
        
        if (elapsed > deathDuration) {
            return false; // 削除
        }
        
        // 死亡エフェクト（縮小・フェード）
        const progress = elapsed / deathDuration;
        this.scale = 1 - progress * 0.5;
        this.opacity = 1 - progress;
        
        return true; // まだ存続
    }
    
    takeDamage() {
        if (!this.isDead) {
            this.isDead = true;
            this.deathTime = Date.now();
            this.velocityX = 0;
            console.log('💀 Enemy: Destroyed');
        }
    }
    
    getAnimationInfo() {
        return {
            frame: this.animationFrame,
            facing: this.facing,
            isDead: this.isDead,
            scale: this.scale || 1,
            opacity: this.opacity || 1
        };
    }
}

/**
 * プラットフォームエンティティ
 */
export class Platform extends BaseEntity {
    constructor(x, y, width, height, style = 'normal') {
        super(x, y, width, height, 'platform');
        
        this.style = style; // normal, brick, cloud, metal
        this.color = this.getColorByStyle(style);
        this.solid = true;
        
        console.log('🧱 Platform: Created', style, 'at', x, y, width, 'x', height);
    }
    
    getColorByStyle(style) {
        const colors = {
            normal: '#8B4513',   // 茶色
            brick: '#CD853F',    // レンガ色
            cloud: '#F0F8FF',    // 雲色
            metal: '#708090',    // 金属色
            grass: '#228B22'     // 草色
        };
        return colors[style] || colors.normal;
    }
    
    update(deltaTime) {
        // プラットフォームは通常静的
        return true;
    }
}

/**
 * ゴールエンティティ
 */
export class Goal extends BaseEntity {
    constructor(x, y, requiredCoins = 3) {
        super(x, y, 24, 32, 'goal');
        
        this.requiredCoins = requiredCoins;
        this.reached = false;
        this.animationTime = 0;
        this.flagWaving = true;
        
        console.log('🏁 Goal: Created at', x, y, 'requires', requiredCoins, 'coins');
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // 旗がはためくアニメーション
        if (this.flagWaving) {
            this.waveOffset = Math.sin(this.animationTime * 3) * 2;
        }
        
        return true;
    }
    
    getAnimationInfo() {
        return {
            reached: this.reached,
            waveOffset: this.waveOffset || 0,
            glowing: this.reached
        };
    }
}

/**
 * 移動プラットフォーム
 */
export class MovingPlatform extends Platform {
    constructor(x, y, width, height, startX, endX, speed = 50) {
        super(x, y, width, height, 'metal');
        
        this.startX = startX;
        this.endX = endX;
        this.speed = speed;
        this.direction = 1; // 1: right, -1: left
        this.originalX = x;
        
        console.log('🚶 MovingPlatform: Created moving from', startX, 'to', endX);
    }
    
    update(deltaTime) {
        // 移動
        this.x += this.speed * this.direction * deltaTime;
        
        // 範囲チェック
        if (this.x <= this.startX) {
            this.x = this.startX;
            this.direction = 1;
        } else if (this.x >= this.endX) {
            this.x = this.endX;
            this.direction = -1;
        }
        
        return true;
    }
}

/**
 * キーアイテム
 */
export class Key extends BaseEntity {
    constructor(x, y) {
        super(x, y, 10, 14, 'key');
        
        this.collected = false;
        this.animationTime = 0;
        this.originalY = y;
        this.sparkles = [];
        
        // スパークル生成
        for (let i = 0; i < 3; i++) {
            this.sparkles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                life: Math.random() * 2
            });
        }
        
        console.log('🗝️ Key: Created at', x, y);
    }
    
    update(deltaTime) {
        if (this.collected) {
            return false; // 即座に削除
        }
        
        this.animationTime += deltaTime;
        
        // 浮遊アニメーション
        this.y = this.originalY + Math.sin(this.animationTime * 2) * 3;
        
        // スパークル更新
        this.sparkles.forEach(sparkle => {
            sparkle.life -= deltaTime;
            if (sparkle.life <= 0) {
                sparkle.x = Math.random() * this.width;
                sparkle.y = Math.random() * this.height;
                sparkle.life = 2;
            }
        });
        
        return true;
    }
    
    getAnimationInfo() {
        return {
            sparkles: this.sparkles,
            collected: this.collected,
            bobOffset: this.y - this.originalY
        };
    }
}

/**
 * 危険エリア（棘・溶岩など）
 */
export class Hazard extends BaseEntity {
    constructor(x, y, width, height, hazardType = 'spikes') {
        super(x, y, width, height, 'hazard');
        
        this.hazardType = hazardType; // spikes, lava, void
        this.damage = 1;
        this.animationTime = 0;
        
        console.log('⚠️ Hazard: Created', hazardType, 'at', x, y);
    }
    
    update(deltaTime) {
        this.animationTime += deltaTime;
        
        // 危険エリアのアニメーション
        if (this.hazardType === 'lava') {
            this.bubbleOffset = Math.sin(this.animationTime * 4) * 2;
        }
        
        return true;
    }
    
    getAnimationInfo() {
        return {
            type: this.hazardType,
            bubbleOffset: this.bubbleOffset || 0
        };
    }
}

/**
 * エンティティファクトリ
 */
export class EntityFactory {
    static createCoin(x, y) {
        return new Coin(x, y);
    }
    
    static createEnemy(x, y, patrolStart, patrolEnd) {
        return new Enemy(x, y, patrolStart, patrolEnd);
    }
    
    static createPlatform(x, y, width, height, style) {
        return new Platform(x, y, width, height, style);
    }
    
    static createMovingPlatform(x, y, width, height, startX, endX, speed) {
        return new MovingPlatform(x, y, width, height, startX, endX, speed);
    }
    
    static createGoal(x, y, requiredCoins) {
        return new Goal(x, y, requiredCoins);
    }
    
    static createKey(x, y) {
        return new Key(x, y);
    }
    
    static createHazard(x, y, width, height, type) {
        return new Hazard(x, y, width, height, type);
    }
    
    /**
     * 基本ステージレイアウト生成
     */
    static createBasicLevel(difficulty = 0) {
        const entities = [];
        
        // 地面プラットフォーム
        entities.push(this.createPlatform(0, 680, 1280, 40, 'grass'));
        
        // プラットフォーム配置
        entities.push(this.createPlatform(200, 600, 100, 20, 'brick'));
        entities.push(this.createPlatform(400, 520, 100, 20, 'brick'));
        entities.push(this.createPlatform(600, 440, 100, 20, 'brick'));
        entities.push(this.createPlatform(900, 500, 120, 20, 'brick'));
        
        // コイン配置
        entities.push(this.createCoin(250, 570));
        entities.push(this.createCoin(450, 490));
        entities.push(this.createCoin(650, 410));
        
        // 難易度に応じてコイン・敵追加
        if (difficulty >= 1) {
            entities.push(this.createCoin(950, 470));
            entities.push(this.createEnemy(300, 664, 200, 400));
        }
        
        if (difficulty >= 2) {
            entities.push(this.createCoin(100, 650));
            entities.push(this.createEnemy(500, 664, 450, 650));
            entities.push(this.createMovingPlatform(700, 360, 80, 20, 700, 800, 60));
        }
        
        if (difficulty >= 3) {
            entities.push(this.createEnemy(800, 664, 750, 950));
            entities.push(this.createHazard(1100, 680, 100, 40, 'spikes'));
        }
        
        // ゴール（右端）
        const requiredCoins = Math.min(3 + difficulty, entities.filter(e => e.type === 'coin').length);
        entities.push(this.createGoal(1200, 648, requiredCoins));
        
        console.log('🏗️ EntityFactory: Created level with difficulty', difficulty, '- entities:', entities.length);
        
        return entities;
    }
}