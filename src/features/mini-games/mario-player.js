/**
 * MarioPlayer - マリオ風ミニゲームプレイヤークラス
 * プレイヤーの状態管理・アニメーション・ゲームロジック
 */
export class MarioPlayer {
    constructor(x, y) {
        // 位置・サイズ
        this.x = x;
        this.y = y;
        this.width = 16;
        this.height = 16;
        
        // 物理状態
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.jumping = false;
        this.facing = 'right';
        
        // ゲーム状態
        this.health = 1;        // 1ヒットで死亡
        this.isDead = false;
        this.coins = 0;
        this.hasKey = false;    // ゴールキー所持状態
        this.active = true;     // 描画用フラグ
        
        // アニメーション
        this.animationState = 'idle';  // idle, running, jumping, falling, dead
        this.animationTime = 0;
        this.animationFrame = 0;
        
        // 時間管理
        this.coyoteTime = 0;
        this.jumpBufferTime = 0;
        
        // 効果音コールバック
        this.onJumpSound = null;
        this.onLandSound = null;
        this.onCoinSound = null;
        this.onDeathSound = null;
        this.onGoalSound = null;
        
        // 無敵時間
        this.invincibilityTime = 0;
        this.invincibilityDuration = 1000; // 1秒
        
        console.log('🍄 MarioPlayer: Player initialized at', x, y);
    }
    
    /**
     * プレイヤー更新
     * @param {number} deltaTime - フレーム時間(秒)
     * @param {Object} input - 入力状態
     * @param {Array} entities - ゲームエンティティ配列
     */
    update(deltaTime, input, entities) {
        if (this.isDead) {
            this.updateDeathAnimation(deltaTime);
            return;
        }
        
        // 無敵時間更新
        if (this.invincibilityTime > 0) {
            this.invincibilityTime -= deltaTime * 1000;
            this.invincibilityTime = Math.max(0, this.invincibilityTime);
        }
        
        // アニメーション更新
        this.updateAnimation(deltaTime);
        
        // エンティティとの相互作用
        this.checkEntityInteractions(entities);
    }
    
    /**
     * アニメーション更新
     */
    updateAnimation(deltaTime) {
        this.animationTime += deltaTime;
        
        // アニメーション状態ごとの処理
        switch (this.animationState) {
            case 'idle':
                // 静止アニメーション (ゆっくり呼吸)
                this.animationFrame = Math.floor(this.animationTime * 2) % 2;
                break;
                
            case 'running':
                // 走りアニメーション (速い切り替え)
                this.animationFrame = Math.floor(this.animationTime * 8) % 4;
                break;
                
            case 'jumping':
                // ジャンプポーズ (固定フレーム)
                this.animationFrame = 0;
                break;
                
            case 'falling':
                // 落下ポーズ (固定フレーム)
                this.animationFrame = 1;
                break;
                
            case 'dead':
                // 死亡アニメーション
                this.animationFrame = 0;
                break;
        }
    }
    
    /**
     * 死亡アニメーション更新
     */
    updateDeathAnimation(deltaTime) {
        // 死亡時は上向きに少し跳ねてから落下
        this.velocityY += 980 * deltaTime; // 重力
        this.y += this.velocityY * deltaTime;
        
        this.animationState = 'dead';
    }
    
    /**
     * エンティティとの相互作用チェック
     */
    checkEntityInteractions(entities) {
        if (this.isDead || this.invincibilityTime > 0) return;
        
        for (const entity of entities) {
            if (this.checkCollision(entity)) {
                this.handleEntityCollision(entity);
            }
        }
    }
    
    /**
     * エンティティとの衝突判定
     */
    checkCollision(entity) {
        return (
            this.x < entity.x + entity.width &&
            this.x + this.width > entity.x &&
            this.y < entity.y + entity.height &&
            this.y + this.height > entity.y
        );
    }
    
    /**
     * エンティティ衝突処理
     */
    handleEntityCollision(entity) {
        switch (entity.type) {
            case 'coin':
                this.collectCoin(entity);
                break;
                
            case 'enemy':
                this.handleEnemyCollision(entity);
                break;
                
            case 'goal':
                this.handleGoalCollision(entity);
                break;
                
            case 'key':
                this.collectKey(entity);
                break;
        }
    }
    
    /**
     * コイン収集
     */
    collectCoin(coin) {
        if (coin.collected) return;
        
        this.coins++;
        coin.collected = true;
        
        // 効果音再生
        if (this.onCoinSound) {
            this.onCoinSound();
        }
        
        console.log('🪙 MarioPlayer: Coin collected! Total:', this.coins);
    }
    
    /**
     * キー収集
     */
    collectKey(key) {
        if (key.collected) return;
        
        this.hasKey = true;
        key.collected = true;
        
        console.log('🗝️ MarioPlayer: Key collected!');
    }
    
    /**
     * 敵との衝突処理
     */
    handleEnemyCollision(enemy) {
        if (enemy.isDead) return;
        
        // 上から踏みつけ判定
        const playerBottom = this.y + this.height;
        const enemyTop = enemy.y;
        const stompThreshold = 8; // 踏みつけ判定の閾値
        
        if (playerBottom - enemyTop <= stompThreshold && this.velocityY > 0) {
            // 敵を踏みつけた
            this.stompEnemy(enemy);
        } else {
            // プレイヤーがダメージを受ける
            this.takeDamage();
        }
    }
    
    /**
     * 敵踏みつけ
     */
    stompEnemy(enemy) {
        enemy.isDead = true;
        enemy.deathTime = Date.now();
        
        // 小さくジャンプ
        this.velocityY = -200;
        
        console.log('👟 MarioPlayer: Enemy stomped!');
    }
    
    /**
     * ダメージ処理
     */
    takeDamage() {
        if (this.invincibilityTime > 0) return;
        
        this.health--;
        
        if (this.health <= 0) {
            this.die();
        } else {
            // 無敵時間開始
            this.invincibilityTime = this.invincibilityDuration;
        }
    }
    
    /**
     * 死亡処理
     */
    die() {
        this.isDead = true;
        this.velocityX = 0;
        this.velocityY = -300; // 死亡時の跳ね上がり
        
        // 効果音再生
        if (this.onDeathSound) {
            this.onDeathSound();
        }
        
        console.log('💀 MarioPlayer: Player died!');
    }
    
    /**
     * ゴール衝突処理
     */
    handleGoalCollision(goal) {
        // ゴールに必要なコイン数チェック
        if (this.coins >= goal.requiredCoins) {
            goal.reached = true;
            
            // 効果音再生
            if (this.onGoalSound) {
                this.onGoalSound();
            }
            
            console.log('🏁 MarioPlayer: Goal reached! Coins:', this.coins);
        }
    }
    
    /**
     * プレイヤーリセット
     */
    reset(x, y) {
        this.x = x;
        this.y = y;
        this.velocityX = 0;
        this.velocityY = 0;
        this.onGround = false;
        this.jumping = false;
        this.facing = 'right';
        
        this.health = 1;
        this.isDead = false;
        this.coins = 0;
        this.hasKey = false;
        this.active = true;
        
        this.animationState = 'idle';
        this.animationTime = 0;
        this.animationFrame = 0;
        
        this.invincibilityTime = 0;
        
        console.log('🔄 MarioPlayer: Player reset');
    }
    
    /**
     * 無敵状態チェック
     */
    isInvincible() {
        return this.invincibilityTime > 0;
    }
    
    /**
     * アニメーション情報取得
     */
    getAnimationInfo() {
        return {
            state: this.animationState,
            frame: this.animationFrame,
            time: this.animationTime,
            facing: this.facing,
            invincible: this.isInvincible()
        };
    }
    
    /**
     * プレイヤー状態情報取得
     */
    getStatus() {
        return {
            position: { x: this.x, y: this.y },
            velocity: { x: this.velocityX, y: this.velocityY },
            health: this.health,
            coins: this.coins,
            hasKey: this.hasKey,
            onGround: this.onGround,
            isDead: this.isDead,
            animation: this.getAnimationInfo()
        };
    }
    
    /**
     * バウンディングボックス取得
     */
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };
    }
    
    /**
     * 中心座標取得
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
    
    /**
     * 足元座標取得（地面判定用）
     */
    getFeetPosition() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height
        };
    }
}