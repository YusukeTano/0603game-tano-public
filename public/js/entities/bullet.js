/**
 * Bullet - 弾丸エンティティクラス
 * 全ての弾丸（プレイヤー・敵）の管理と更新処理
 */
export class Bullet {
    constructor(x, y, vx, vy, options = {}) {
        // 基本プロパティ
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        
        // 弾丸設定
        this.damage = options.damage || 10;
        this.range = options.range || 300;
        this.distance = 0;
        this.size = options.size || 4;
        
        // 弾丸タイプ
        this.enemyBullet = options.enemyBullet || false;
        this.weaponType = options.weaponType || 'plasma';
        this.color = options.color || '#00ccff';
        
        // 特殊効果
        this.explosive = options.explosive || false;
        this.explosionRadius = options.explosionRadius || 50;
        this.homing = options.homing || false;
        this.homingStrength = options.homingStrength || 0.1;
        this.piercing = options.piercing || false;
        this.piercingLeft = options.piercingLeft || 0;
        this.piercingChance = options.piercingChance || 0;
        
        // 多段階貫通システム
        this.piercesRemaining = Math.floor((options.piercingChance || 0) / 100);
        this.bonusPierceChance = (options.piercingChance || 0) % 100;
        
        // 反射・跳ね返り
        this.bouncesLeft = options.bouncesLeft || 0;
        this.bounceChance = options.bounceChance || 0;
        this.wallReflection = options.wallReflection || false;
        
        // 多段階反射システム
        this.bouncesRemaining = Math.floor((options.bounceChance || 0) / 100);
        this.bonusBounceChance = (options.bounceChance || 0) % 100;
        this.hasUsedBonusBounce = false;
        
        // 時限爆弾
        this.timeBomb = options.timeBomb || false;
        this.bombTimer = options.bombTimer || 3000; // 3秒
        
        // レーザー・ニューク等の特殊タイプ
        this.laser = options.laser || false;
        this.nuke = options.nuke || false;
        
        console.log(`Bullet created: ${this.weaponType} (${this.enemyBullet ? 'Enemy' : 'Player'})`);
    }
    
    /**
     * 弾丸の更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス（ホーミング用）
     * @returns {boolean} 弾丸が削除されるべきかどうか
     */
    update(deltaTime, game) {
        // 特殊弾丸の更新処理
        this.updateSpecialEffects(deltaTime, game);
        
        // 基本移動
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
        this.distance += Math.sqrt(this.vx * this.vx + this.vy * this.vy) * deltaTime;
        
        // 時限爆弾のタイマー更新
        if (this.timeBomb) {
            this.bombTimer -= deltaTime * 1000;
            if (this.bombTimer <= 0) {
                game.explode(this.x, this.y, this.explosionRadius, this.damage);
                
                // 設置済み爆弾リストからも削除
                const deployedIndex = game.deployedBombs.indexOf(this);
                if (deployedIndex !== -1) {
                    game.deployedBombs.splice(deployedIndex, 1);
                }
                
                return true; // 削除フラグ
            }
        }
        
        // 多段階反射処理
        let shouldBounce = false;
        
        // 従来の確実反射（最優先）
        if (this.bouncesLeft > 0) {
            shouldBounce = true;
            console.log('Bullet: Legacy bounce', {
                remaining: this.bouncesLeft
            });
        }
        // 新多段階反射システム
        else if (this.bouncesRemaining > 0) {
            // 確定反射
            this.bouncesRemaining--;
            shouldBounce = true;
            console.log('Bullet: Guaranteed bounce', {
                remaining: this.bouncesRemaining
            });
        }
        else if (!this.hasUsedBonusBounce && this.bonusBounceChance > 0 && 
                 Math.random() * 100 < this.bonusBounceChance) {
            // ボーナス確率反射（1回のみ）
            shouldBounce = true;
            this.hasUsedBonusBounce = true; // 1回限りの制限
            console.log('Bullet: Bonus bounce success', {
                chance: this.bonusBounceChance
            });
        }
        
        if (shouldBounce) {
            if (this.x < 0 || this.x > game.baseWidth) {
                this.vx = -this.vx;
                if (this.bouncesLeft > 0) this.bouncesLeft--;
            }
            if (this.y < 0 || this.y > game.baseHeight) {
                this.vy = -this.vy;
                if (this.bouncesLeft > 0) this.bouncesLeft--;
            }
        }
        
        // 射程チェック
        if (this.distance > this.range) {
            if (this.explosive) {
                game.explode(this.x, this.y, this.explosionRadius, this.damage);
            }
            return true; // 削除フラグ
        }
        
        return false; // 継続
    }
    
    /**
     * 特殊効果の更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス
     * @private
     */
    updateSpecialEffects(deltaTime, game) {
        // ホーミング処理
        if (this.homing && !this.enemyBullet) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance && distance < 200) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            if (nearestEnemy) {
                const dx = nearestEnemy.x - this.x;
                const dy = nearestEnemy.y - this.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const targetVx = (dx / length) * currentSpeed;
                    const targetVy = (dy / length) * currentSpeed;
                    
                    this.vx += (targetVx - this.vx) * this.homingStrength;
                    this.vy += (targetVy - this.vy) * this.homingStrength;
                }
            }
        }
    }
    
    /**
     * 画面範囲外チェック
     * @param {number} screenWidth - 画面幅
     * @param {number} screenHeight - 画面高さ
     * @returns {boolean} 画面外かどうか
     */
    isOutOfBounds(screenWidth, screenHeight) {
        const margin = 100; // 余裕を持たせる
        return this.x < -margin || this.x > screenWidth + margin || 
               this.y < -margin || this.y > screenHeight + margin;
    }
    
    /**
     * 爆発を発生させる
     * @param {Object} game - ゲームインスタンス
     */
    explode(game) {
        if (this.explosive) {
            game.explode(this.x, this.y, this.explosionRadius, this.damage);
        }
    }
    
    /**
     * 弾丸の情報を取得
     * @returns {Object} 弾丸の状態情報
     */
    getInfo() {
        return {
            position: { x: this.x, y: this.y },
            velocity: { vx: this.vx, vy: this.vy },
            properties: {
                damage: this.damage,
                range: this.range,
                distance: this.distance,
                enemyBullet: this.enemyBullet,
                weaponType: this.weaponType,
                explosive: this.explosive,
                homing: this.homing,
                piercing: this.piercing,
                piercingLeft: this.piercingLeft
            }
        };
    }
    
    /**
     * プレイヤー弾丸作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {Object} weaponConfig - 武器設定
     * @returns {Bullet} 新しい弾丸インスタンス
     */
    static createPlayerBullet(x, y, vx, vy, weaponConfig) {
        return new Bullet(x, y, vx, vy, {
            damage: weaponConfig.damage,
            range: weaponConfig.range,
            weaponType: weaponConfig.type,
            explosive: weaponConfig.explosive,
            explosionRadius: weaponConfig.explosionRadius,
            homing: weaponConfig.homing,
            homingStrength: weaponConfig.homingStrength,
            piercing: weaponConfig.piercing,
            piercingLeft: weaponConfig.piercingLeft,
            bouncesLeft: weaponConfig.bouncesLeft,
            laser: weaponConfig.laser,
            nuke: weaponConfig.nuke,
            timeBomb: weaponConfig.timeBomb,
            bombTimer: weaponConfig.bombTimer,
            size: weaponConfig.size || 4,
            enemyBullet: false
        });
    }
    
    /**
     * 敵弾丸作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {Object} enemyConfig - 敵設定
     * @returns {Bullet} 新しい弾丸インスタンス
     */
    static createEnemyBullet(x, y, vx, vy, enemyConfig) {
        return new Bullet(x, y, vx, vy, {
            damage: enemyConfig.damage,
            range: enemyConfig.range || 400,
            color: enemyConfig.color || '#ff4444',
            size: enemyConfig.size || 6,
            enemyBullet: true
        });
    }
    
    /**
     * ボス弾丸作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {Object} bossConfig - ボス設定
     * @returns {Bullet} 新しい弾丸インスタンス
     */
    static createBossBullet(x, y, vx, vy, bossConfig) {
        return new Bullet(x, y, vx, vy, {
            damage: bossConfig.damage,
            range: bossConfig.range || 500,
            color: bossConfig.color || '#ff6b6b',
            size: bossConfig.size || 8,
            enemyBullet: true
        });
    }
}