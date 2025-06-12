/**
 * Pickup - アイテムエンティティクラス
 * 全てのアイテム（体力・速度・ニューク等）の管理と更新処理
 */
export class Pickup {
    constructor(x, y, type, options = {}) {
        // 基本プロパティ
        this.x = x;
        this.y = y;
        this.type = type;
        
        // アイテム設定
        this.value = options.value || this.getDefaultValue(type);
        this.life = options.life || 15000; // 15秒寿命
        this.maxLife = this.life;
        
        // 物理プロパティ
        this.width = options.width || 20;
        this.height = options.height || 20;
        this.radius = Math.max(this.width, this.height) / 2;
        
        // 引力プロパティ
        this.attractionRadius = options.attractionRadius || 80;
        this.instantRadius = options.instantRadius || 35;
        this.collectRadius = options.collectRadius || 25;
        
        // 視覚エフェクト
        this.glowPhase = Math.random() * Math.PI * 2; // 発光アニメーション用
        this.pulsePhase = Math.random() * Math.PI * 2; // パルスアニメーション用
        
        console.log(`Pickup created: ${this.type} at (${this.x}, ${this.y})`);
    }
    
    /**
     * アイテムの更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス
     * @returns {boolean} アイテムが削除されるべきかどうか
     */
    update(deltaTime, game) {
        // 寿命減少
        this.life -= deltaTime * 1000;
        
        // 寿命切れチェック
        if (this.life <= 0) {
            return true; // 削除フラグ
        }
        
        // アニメーション更新
        this.glowPhase += deltaTime * 3; // 発光速度
        this.pulsePhase += deltaTime * 2; // パルス速度
        
        // プレイヤーとの距離計算
        const dx = game.player.x - this.x;
        const dy = game.player.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 引力処理
        if (distance < this.attractionRadius && distance > this.collectRadius) {
            this.applyAttraction(game.player, deltaTime, distance);
        }
        
        // 収集判定
        if (distance < this.collectRadius) {
            this.collect(game);
            return true; // 削除フラグ
        }
        
        return false; // 継続
    }
    
    /**
     * プレイヤーへの引力適用
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} deltaTime - フレーム時間
     * @param {number} distance - プレイヤーからの距離
     * @private
     */
    applyAttraction(player, deltaTime, distance) {
        let attractSpeed;
        
        if (distance <= this.instantRadius) {
            // 近距離での瞬間吸引
            attractSpeed = 800;
        } else {
            // 中距離での段階的吸い寄せ
            attractSpeed = 300;
            const attractForce = Math.pow(1 - (distance / this.attractionRadius), 2);
            attractSpeed *= attractForce;
        }
        
        // 引力適用
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        this.x += (dx / distance) * attractSpeed * deltaTime;
        this.y += (dy / distance) * attractSpeed * deltaTime;
    }
    
    /**
     * アイテム収集処理
     * @param {Object} game - ゲームインスタンス
     */
    collect(game) {
        switch (this.type) {
            case 'health':
                game.player.increaseMaxHealth(this.value);
                if (game.audioSystem.sounds.pickupHealth) {
                    game.audioSystem.sounds.pickupHealth();
                }
                break;
                
            case 'speed':
                game.player.increaseSpeed(this.value);
                if (game.audioSystem.sounds.pickupSpeed) {
                    game.audioSystem.sounds.pickupSpeed();
                }
                break;
                
            case 'range':
                game.player.increaseRange(this.value);
                game.weaponSystem.applyRangeMultiplier(this.value);
                if (game.audioSystem.sounds.pickupSpeed) {
                    game.audioSystem.sounds.pickupSpeed();
                }
                break;
                
            case 'nuke':
                game.weaponSystem.equipNukeLauncher();
                if (game.audioSystem.sounds.pickupAmmo) {
                    game.audioSystem.sounds.pickupAmmo();
                }
                break;
                
            case 'dash':
                game.player.addDashCharges(this.value);
                if (game.audioSystem.sounds.pickupSpeed) {
                    game.audioSystem.sounds.pickupSpeed();
                }
                break;
                
            case 'ammo':
                game.weaponSystem.addAmmo(this.value);
                if (game.audioSystem.sounds.pickupAmmo) {
                    game.audioSystem.sounds.pickupAmmo();
                }
                break;
        }
        
        // 収集エフェクト
        game.particleSystem.createPickupEffect(this.x, this.y, this.getColor());
        
        console.log(`Pickup collected: ${this.type} (value: ${this.value})`);
    }
    
    /**
     * アイテムタイプ別のデフォルト値を取得
     * @param {string} type - アイテムタイプ
     * @returns {number} デフォルト値
     * @private
     */
    getDefaultValue(type) {
        switch (type) {
            case 'health': return 10; // 体力上限+10
            case 'speed': return 5;   // 速度+5
            case 'range': return 1.2; // 射程+20%
            case 'nuke': return 5;    // ニューク5発
            case 'dash': return 1;    // ダッシュチャージ+1
            case 'ammo': return 10;   // 弾薬+10
            default: return 1;
        }
    }
    
    /**
     * アイテムタイプ別の色を取得
     * @returns {string} CSS色文字列
     */
    getColor() {
        switch (this.type) {
            case 'health': return '#00ff66'; // 緑
            case 'speed': return '#0088ff';  // 青
            case 'range': return '#4fc3f7';  // 射程青
            case 'nuke': return '#ff8800';   // オレンジ
            case 'dash': return '#00ccff';   // 水色
            case 'ammo': return '#ffaa00';   // 黄色
            default: return '#ffffff';       // 白
        }
    }
    
    /**
     * アイテムの描画情報を取得
     * @returns {Object} 描画用データ
     */
    getRenderData() {
        const lifePercent = this.life / this.maxLife;
        const glowIntensity = 0.5 + 0.5 * Math.sin(this.glowPhase);
        const pulseScale = 1.0 + 0.1 * Math.sin(this.pulsePhase);
        
        return {
            x: this.x,
            y: this.y,
            type: this.type,
            color: this.getColor(),
            alpha: Math.min(1.0, lifePercent * 2), // 寿命に応じて透明度変化
            glowIntensity: glowIntensity,
            pulseScale: pulseScale,
            lifePercent: lifePercent
        };
    }
    
    /**
     * アイテムの当たり判定データを取得
     * @returns {Object} 衝突判定用データ
     */
    getCollisionData() {
        return {
            x: this.x,
            y: this.y,
            radius: this.collectRadius,
            attractionRadius: this.attractionRadius,
            instantRadius: this.instantRadius
        };
    }
    
    /**
     * アイテムの情報を取得
     * @returns {Object} アイテム状態情報
     */
    getInfo() {
        return {
            type: this.type,
            position: { x: this.x, y: this.y },
            value: this.value,
            life: this.life,
            maxLife: this.maxLife,
            lifePercent: this.life / this.maxLife
        };
    }
    
    /**
     * 体力アイテム作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} healthBoost - 体力増加量
     * @returns {Pickup} 新しいアイテムインスタンス
     */
    static createHealthPickup(x, y, healthBoost = 10) {
        return new Pickup(x, y, 'health', {
            value: healthBoost,
            life: 20000 // 体力アイテムは長めの寿命
        });
    }
    
    /**
     * 速度アイテム作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} speedBoost - 速度増加量
     * @returns {Pickup} 新しいアイテムインスタンス
     */
    static createSpeedPickup(x, y, speedBoost = 5) {
        return new Pickup(x, y, 'speed', {
            value: speedBoost,
            life: 18000
        });
    }
    
    /**
     * ニュークアイテム作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} nukeCount - ニューク発数
     * @returns {Pickup} 新しいアイテムインスタンス
     */
    static createNukePickup(x, y, nukeCount = 5) {
        return new Pickup(x, y, 'nuke', {
            value: nukeCount,
            life: 25000, // レアアイテムは長い寿命
            attractionRadius: 100 // 吸引範囲も広め
        });
    }
    
    /**
     * ダッシュアイテム作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} charges - ダッシュチャージ数
     * @returns {Pickup} 新しいアイテムインスタンス
     */
    static createDashPickup(x, y, charges = 1) {
        return new Pickup(x, y, 'dash', {
            value: charges,
            life: 15000
        });
    }
    
    /**
     * 弾薬アイテム作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} ammoCount - 弾薬数
     * @returns {Pickup} 新しいアイテムインスタンス
     */
    static createAmmoPickup(x, y, ammoCount = 10) {
        return new Pickup(x, y, 'ammo', {
            value: ammoCount,
            life: 12000
        });
    }
    
    /**
     * 射程アイテム作成用の静的メソッド
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} rangeMultiplier - 射程倍率
     * @returns {Pickup} 新しいアイテムインスタンス
     */
    static createRangePickup(x, y, rangeMultiplier = 1.2) {
        return new Pickup(x, y, 'range', {
            value: rangeMultiplier,
            life: 20000, // 体力アイテムと同じ長い寿命
            attractionRadius: 90 // やや広めの吸引範囲
        });
    }
}