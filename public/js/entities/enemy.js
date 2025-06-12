/**
 * Enemy - 敵エンティティクラス
 * 全ての敵タイプ（normal, fast, tank, shooter, boss）の統一管理
 */
export class Enemy {
    constructor(x, y, type, wave = 1) {
        // 基本プロパティ
        this.x = x;
        this.y = y;
        this.type = type;
        this.wave = wave;
        
        // 敵設定を取得
        const config = this.getEnemyConfig(type, wave);
        
        // 体力・ダメージ
        this.health = config.health;
        this.maxHealth = config.health;
        this.damage = config.damage;
        
        // サイズ・速度
        this.width = config.width;
        this.height = config.height;
        this.speed = config.speed;
        
        // 攻撃設定
        this.lastAttack = 0;
        this.attackRate = config.attackRate;
        
        // 射撃設定（shooter, boss用）
        this.lastShot = 0;
        this.shootRate = config.shootRate || 2000;
        
        // ボス専用設定
        if (type === 'boss') {
            this.phase = 1;
            this.specialAttackTimer = 0;
            this.specialAttackRate = config.specialAttackRate || 8000;
        }
        
        // 色設定
        this.color = config.color;
        
        console.log(`Enemy created: ${this.type} (wave: ${this.wave}) at (${this.x}, ${this.y})`);
    }
    
    /**
     * 敵の更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス
     */
    update(deltaTime, game) {
        // 行動パターン更新
        this.updateBehavior(deltaTime, game);
        
        // ボスの特殊処理
        if (this.type === 'boss') {
            this.updateBossLogic(deltaTime, game);
        }
    }
    
    /**
     * 敵の行動パターン更新
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス
     * @private
     */
    updateBehavior(deltaTime, game) {
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch (this.type) {
            case 'fast':
                this.updateFastBehavior(deltaTime, dx, dy, distance);
                break;
                
            case 'tank':
                this.updateTankBehavior(deltaTime, dx, dy, distance);
                break;
                
            case 'shooter':
                this.updateShooterBehavior(deltaTime, dx, dy, distance, game);
                break;
                
            case 'boss':
                this.updateBossBehavior(deltaTime, dx, dy, distance, game);
                break;
                
            default: // normal
                this.updateNormalBehavior(deltaTime, dx, dy, distance);
                break;
        }
    }
    
    /**
     * 高速敵の行動パターン
     * @private
     */
    updateFastBehavior(deltaTime, dx, dy, distance) {
        // 高速で直進
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }
    
    /**
     * タンク敵の行動パターン
     * @private
     */
    updateTankBehavior(deltaTime, dx, dy, distance) {
        // ゆっくりと確実に追跡
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }
    
    /**
     * シューター敵の行動パターン
     * @private
     */
    updateShooterBehavior(deltaTime, dx, dy, distance, game) {
        // 中距離を保ちながら射撃
        if (distance > 200) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        } else if (distance < 150) {
            this.x -= (dx / distance) * this.speed * deltaTime * 0.5;
            this.y -= (dy / distance) * this.speed * deltaTime * 0.5;
        }
        
        // 射撃
        if (Date.now() - this.lastShot > this.shootRate && distance < 300) {
            this.shoot(game);
            this.lastShot = Date.now();
        }
    }
    
    /**
     * 通常敵の行動パターン
     * @private
     */
    updateNormalBehavior(deltaTime, dx, dy, distance) {
        if (distance > 0) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        }
    }
    
    /**
     * ボスの行動パターン
     * @private
     */
    updateBossBehavior(deltaTime, dx, dy, distance, game) {
        // フェーズ管理
        const healthPercentage = this.health / this.maxHealth;
        if (healthPercentage < 0.5 && this.phase === 1) {
            this.phase = 2;
            this.speed *= 1.5;
            this.shootRate *= 0.7;
        }
        
        // 移動パターン
        if (distance > 100) {
            this.x += (dx / distance) * this.speed * deltaTime;
            this.y += (dy / distance) * this.speed * deltaTime;
        } else {
            // 円運動
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            this.x += Math.cos(angle) * this.speed * deltaTime;
            this.y += Math.sin(angle) * this.speed * deltaTime;
        }
        
        // 通常射撃
        if (Date.now() - this.lastShot > this.shootRate) {
            this.shootBoss(game);
            this.lastShot = Date.now();
        }
    }
    
    /**
     * ボス専用ロジック更新
     * @private
     */
    updateBossLogic(deltaTime, game) {
        // 特殊攻撃
        this.specialAttackTimer += deltaTime * 1000;
        if (this.specialAttackTimer > this.specialAttackRate) {
            this.specialAttack(game);
            this.specialAttackTimer = 0;
        }
    }
    
    /**
     * 敵の射撃
     * @param {Object} game - ゲームインスタンス
     */
    shoot(game) {
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            game.bulletSystem.addEnemyBullet(
                this.x,
                this.y,
                (dx / distance) * 300,
                (dy / distance) * 300,
                {
                    damage: this.damage * 0.6,
                    range: 400,
                    size: 6
                }
            );
        }
    }
    
    /**
     * ボスの射撃
     * @param {Object} game - ゲームインスタンス
     */
    shootBoss(game) {
        const angles = this.phase === 1 ? 
            [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] : 
            [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
        
        angles.forEach(angle => {
            game.bulletSystem.addBossBullet(
                this.x,
                this.y,
                Math.cos(angle) * 250,
                Math.sin(angle) * 250,
                {
                    damage: this.damage * 0.8,
                    range: 500,
                    size: 8
                }
            );
        });
    }
    
    /**
     * ボスの特殊攻撃
     * @param {Object} game - ゲームインスタンス
     */
    specialAttack(game) {
        // プレイヤーに向けた高速弾
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            game.bulletSystem.addBossBullet(
                this.x,
                this.y,
                (dx / distance) * 500,
                (dy / distance) * 500,
                {
                    damage: this.damage * 1.5,
                    range: 600,
                    size: 12
                }
            );
        }
    }
    
    /**
     * ダメージを受ける
     * @param {number} damage - ダメージ量
     */
    takeDamage(damage) {
        this.health -= damage;
        this.health = Math.max(0, this.health);
    }
    
    /**
     * 敵が死亡しているかチェック
     * @returns {boolean} 死亡状態
     */
    isDead() {
        return this.health <= 0;
    }
    
    /**
     * 描画データを取得
     * @returns {Object} 描画用データ
     */
    getRenderData() {
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            width: this.width,
            height: this.height,
            health: this.health,
            maxHealth: this.maxHealth,
            color: this.color,
            phase: this.phase || 1
        };
    }
    
    /**
     * 当たり判定データを取得
     * @returns {Object} 衝突判定用データ
     */
    getCollisionData() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            radius: Math.max(this.width, this.height) / 2
        };
    }
    
    /**
     * 敵の情報を取得
     * @returns {Object} 敵状態情報
     */
    getInfo() {
        return {
            type: this.type,
            position: { x: this.x, y: this.y },
            health: this.health,
            maxHealth: this.maxHealth,
            damage: this.damage,
            speed: this.speed,
            phase: this.phase
        };
    }
    
    /**
     * 敵タイプ別の設定を取得
     * @param {string} type - 敵タイプ
     * @param {number} wave - ウェーブ数
     * @returns {Object} 敵設定
     * @private
     */
    getEnemyConfig(type, wave) {
        const baseHealth = 50 + wave * 10;
        const baseSpeed = 60 + wave * 5;
        const baseDamage = 10 + wave * 2;
        
        const configs = {
            fast: {
                width: 12, height: 12,
                health: baseHealth * 0.6,
                speed: baseSpeed * 1.8,
                damage: baseDamage * 0.7,
                attackRate: 800,
                color: '#ff9ff3'
            },
            tank: {
                width: 25, height: 25,
                health: baseHealth * 2.5,
                speed: baseSpeed * 0.4,
                damage: baseDamage * 1.8,
                attackRate: 1500,
                color: '#2f3542'
            },
            shooter: {
                width: 18, height: 18,
                health: baseHealth * 1.2,
                speed: baseSpeed * 0.7,
                damage: baseDamage * 0.8,
                attackRate: 1200,
                shootRate: 2000,
                color: '#3742fa'
            },
            boss: {
                width: 60, height: 60,
                health: 800 + wave * 200,
                speed: 40 + wave * 3,
                damage: 25 + wave * 5,
                attackRate: 1000,
                shootRate: 1500,
                specialAttackRate: 8000,
                color: '#8B0000'
            },
            normal: {
                width: 15, height: 15,
                health: baseHealth,
                speed: baseSpeed,
                damage: baseDamage,
                attackRate: 1000,
                color: '#ff4757'
            }
        };
        
        return configs[type] || configs.normal;
    }
    
    /**
     * 通常敵作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ数
     * @returns {Enemy} 新しい敵インスタンス
     */
    static createNormalEnemy(x, y, wave = 1) {
        return new Enemy(x, y, 'normal', wave);
    }
    
    /**
     * 高速敵作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ数
     * @returns {Enemy} 新しい敵インスタンス
     */
    static createFastEnemy(x, y, wave = 1) {
        return new Enemy(x, y, 'fast', wave);
    }
    
    /**
     * タンク敵作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ数
     * @returns {Enemy} 新しい敵インスタンス
     */
    static createTankEnemy(x, y, wave = 1) {
        return new Enemy(x, y, 'tank', wave);
    }
    
    /**
     * シューター敵作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ数
     * @returns {Enemy} 新しい敵インスタンス
     */
    static createShooterEnemy(x, y, wave = 1) {
        return new Enemy(x, y, 'shooter', wave);
    }
    
    /**
     * ボス敵作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ数
     * @returns {Enemy} 新しい敵インスタンス
     */
    static createBossEnemy(x, y, wave = 1) {
        return new Enemy(x, y, 'boss', wave);
    }
}