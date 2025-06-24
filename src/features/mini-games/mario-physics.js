/**
 * MarioPhysics - マリオ風ミニゲーム物理エンジン
 * 重力・ジャンプ・衝突判定システム
 */
export class MarioPhysics {
    constructor() {
        // 物理定数
        this.constants = {
            gravity: 980,           // ピクセル/秒² (重力加速度)
            maxFallSpeed: 600,      // 最大落下速度
            jumpForce: -400,        // ジャンプ力 (上向き)
            moveSpeed: 200,         // 横移動速度
            friction: 0.8,          // 摩擦係数
            terminalVelocity: 800,  // 終端速度
            coyoteTime: 150,        // コヨーテタイム (ms)
            jumpBuffering: 100      // ジャンプバッファリング (ms)
        };
        
        console.log('🚀 MarioPhysics: Physics engine initialized');
    }
    
    /**
     * プレイヤー物理更新
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} deltaTime - フレーム時間(秒)
     * @param {Array} platforms - プラットフォーム配列
     * @param {Object} input - 入力状態
     */
    updatePlayer(player, deltaTime, platforms, input) {
        // 前の位置を保存
        const prevX = player.x;
        const prevY = player.y;
        
        // 横移動
        this.updateHorizontalMovement(player, deltaTime, input);
        
        // 重力・ジャンプ
        this.updateVerticalMovement(player, deltaTime, input);
        
        // プラットフォーム衝突判定
        this.handlePlatformCollisions(player, platforms, prevX, prevY);
        
        // 画面境界チェック
        this.handleScreenBounds(player);
        
        // 状態更新
        this.updatePlayerState(player, deltaTime);
    }
    
    /**
     * 横移動処理
     */
    updateHorizontalMovement(player, deltaTime, input) {
        let targetVelocityX = 0;
        
        // 入力チェック
        if (input.left) {
            targetVelocityX = -this.constants.moveSpeed;
            player.facing = 'left';
        } else if (input.right) {
            targetVelocityX = this.constants.moveSpeed;
            player.facing = 'right';
        }
        
        // 滑らかな加速・減速
        const acceleration = targetVelocityX === 0 ? this.constants.friction : 0.7;
        player.velocityX = this.lerp(player.velocityX, targetVelocityX, acceleration);
        
        // 極小値カット（振動防止）
        if (Math.abs(player.velocityX) < 1) player.velocityX = 0;
        
        // 位置更新
        player.x += player.velocityX * deltaTime;
    }
    
    /**
     * 縦移動・重力処理
     */
    updateVerticalMovement(player, deltaTime, input) {
        // 重力適用
        if (!player.onGround) {
            player.velocityY += this.constants.gravity * deltaTime;
            
            // 最大落下速度制限
            if (player.velocityY > this.constants.maxFallSpeed) {
                player.velocityY = this.constants.maxFallSpeed;
            }
        }
        
        // ジャンプ処理
        this.handleJump(player, input);
        
        // 位置更新
        player.y += player.velocityY * deltaTime;
    }
    
    /**
     * ジャンプ処理（コヨーテタイム・ジャンプバッファリング）
     */
    handleJump(player, input) {
        const now = Date.now();
        
        // ジャンプ入力検出
        if (input.jump && !input.jumpPressed) {
            player.jumpBufferTime = now;
            input.jumpPressed = true;
        } else if (!input.jump) {
            input.jumpPressed = false;
        }
        
        // コヨーテタイム更新
        if (player.onGround) {
            player.coyoteTime = now;
        }
        
        // ジャンプ実行判定
        const canJump = (
            (player.onGround || (now - player.coyoteTime < this.constants.coyoteTime)) &&
            (now - player.jumpBufferTime < this.constants.jumpBuffering) &&
            !player.jumping
        );
        
        if (canJump) {
            player.velocityY = this.constants.jumpForce;
            player.onGround = false;
            player.jumping = true;
            player.jumpBufferTime = 0; // バッファリセット
            
            // ジャンプ効果音トリガー
            if (player.onJumpSound) {
                player.onJumpSound();
            }
        }
        
        // ジャンプ中に離すと上昇力減少（可変ジャンプ）
        if (player.jumping && !input.jump && player.velocityY < -100) {
            player.velocityY *= 0.6;
        }
        
        // 着地でジャンプフラグリセット
        if (player.onGround && player.velocityY >= 0) {
            player.jumping = false;
        }
    }
    
    /**
     * プラットフォーム衝突判定
     */
    handlePlatformCollisions(player, platforms, prevX, prevY) {
        player.onGround = false;
        
        // 各プラットフォームとの衝突チェック
        for (const platform of platforms) {
            if (this.checkAABBCollision(player, platform)) {
                this.resolvePlatformCollision(player, platform, prevX, prevY);
            }
        }
    }
    
    /**
     * AABB衝突判定
     */
    checkAABBCollision(player, platform) {
        return (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        );
    }
    
    /**
     * プラットフォーム衝突解決
     */
    resolvePlatformCollision(player, platform, prevX, prevY) {
        // 衝突方向の判定
        const overlapX = Math.min(
            (player.x + player.width) - platform.x,
            (platform.x + platform.width) - player.x
        );
        const overlapY = Math.min(
            (player.y + player.height) - platform.y,
            (platform.y + platform.height) - player.y
        );
        
        // より小さい重なりの方向で解決
        if (overlapX < overlapY) {
            // 横方向の衝突
            if (player.x < platform.x) {
                // 左から衝突
                player.x = platform.x - player.width;
            } else {
                // 右から衝突
                player.x = platform.x + platform.width;
            }
            player.velocityX = 0;
        } else {
            // 縦方向の衝突
            if (player.y < platform.y) {
                // 上から衝突（着地）
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.onGround = true;
                
                // 着地効果音トリガー
                if (player.onLandSound && player.jumping) {
                    player.onLandSound();
                }
            } else {
                // 下から衝突（天井）
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    }
    
    /**
     * 画面境界処理
     */
    handleScreenBounds(player) {
        const gameWidth = 1280;  // ゲーム幅
        const gameHeight = 720;  // ゲーム高さ
        
        // 横方向境界
        if (player.x < 0) {
            player.x = 0;
            player.velocityX = 0;
        } else if (player.x + player.width > gameWidth) {
            player.x = gameWidth - player.width;
            player.velocityX = 0;
        }
        
        // 下方向境界（落下死判定）
        if (player.y > gameHeight + 100) {
            player.isDead = true;
        }
    }
    
    /**
     * プレイヤー状態更新
     */
    updatePlayerState(player, deltaTime) {
        // アニメーション状態
        if (player.onGround) {
            if (Math.abs(player.velocityX) > 10) {
                player.animationState = 'running';
            } else {
                player.animationState = 'idle';
            }
        } else {
            if (player.velocityY < 0) {
                player.animationState = 'jumping';
            } else {
                player.animationState = 'falling';
            }
        }
        
        // アニメーションタイマー更新
        player.animationTime += deltaTime;
    }
    
    /**
     * 敵の物理更新
     */
    updateEnemy(enemy, deltaTime, platforms) {
        // 簡単な敵AI（左右移動）
        enemy.x += enemy.velocityX * deltaTime;
        
        // 重力適用
        enemy.velocityY += this.constants.gravity * deltaTime;
        enemy.y += enemy.velocityY * deltaTime;
        
        // プラットフォーム衝突（簡易版）
        for (const platform of platforms) {
            if (this.checkAABBCollision(enemy, platform)) {
                if (enemy.y < platform.y) {
                    enemy.y = platform.y - enemy.height;
                    enemy.velocityY = 0;
                    enemy.onGround = true;
                }
            }
        }
        
        // 端で方向転換
        if (enemy.x <= 0 || enemy.x + enemy.width >= 1280) {
            enemy.velocityX *= -1;
        }
    }
    
    /**
     * 線形補間ユーティリティ
     */
    lerp(start, end, factor) {
        return start + (end - start) * factor;
    }
    
    /**
     * 距離計算
     */
    distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 矩形の中心点取得
     */
    getCenter(rect) {
        return {
            x: rect.x + rect.width / 2,
            y: rect.y + rect.height / 2
        };
    }
}