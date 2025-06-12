export class Player {
    constructor(x = 640, y = 360) {
        // 基本プロパティ
        this.x = x;
        this.y = y;
        this.width = 20;
        this.height = 20;
        this.speed = 200;
        this.health = 100;
        this.maxHealth = 100;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.angle = 0;
        
        // バリア効果
        this.barrierActive = false;
        this.barrierTimeLeft = 0;
        
        // ゲーム参照（システム通信用）
        this.game = null;
    }
    
    // ゲーム参照を設定
    setGame(game) {
        this.game = game;
    }
    
    // プレイヤーの更新処理
    update(deltaTime) {
        if (!this.game) return;
        
        const inputState = this.game.inputSystem.getInputState();
        const movementInput = this.game.inputSystem.getMovementInput();
        
        // 移動処理
        let moveX = 0;
        let moveY = 0;
        
        // PC（キーボード）入力
        if (inputState.keys['KeyW'] || inputState.keys['ArrowUp']) moveY -= 1;
        if (inputState.keys['KeyS'] || inputState.keys['ArrowDown']) moveY += 1;
        if (inputState.keys['KeyA'] || inputState.keys['ArrowLeft']) moveX -= 1;
        if (inputState.keys['KeyD'] || inputState.keys['ArrowRight']) moveX += 1;
        
        // モバイル（仮想スティック）入力
        if (movementInput.x !== 0 || movementInput.y !== 0) {
            moveX = movementInput.x;
            moveY = movementInput.y;
        }
        
        // 移動ベクトルの正規化
        if (moveX !== 0 || moveY !== 0) {
            const magnitude = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= magnitude;
            moveY /= magnitude;
        }
        
        // ダッシュ効果の適用
        let currentSpeed = this.speed;
        if (this.game.weaponSystem && this.game.weaponSystem.dashEffect && this.game.weaponSystem.dashEffect.active) {
            const dashMultiplier = this.game.weaponSystem.dashEffect.speedMultiplier || 1.5;
            currentSpeed *= dashMultiplier;
        }
        
        // 位置更新
        this.x += moveX * currentSpeed * deltaTime;
        this.y += moveY * currentSpeed * deltaTime;
        
        // 画面境界制限（基準解像度: 1280x720）
        const margin = this.width / 2;
        this.x = Math.max(margin, Math.min(1280 - margin, this.x));
        this.y = Math.max(margin, Math.min(720 - margin, this.y));
        
        // エイム角度の計算
        this.updateAiming();
        
        // バリア効果の更新
        this.updateBarrier(deltaTime);
    }
    
    // エイム角度の更新
    updateAiming() {
        if (!this.game) return;
        
        const inputState = this.game.inputSystem.getInputState();
        
        // モバイル判定はInputSystemを使用
        const isMobile = this.game.inputSystem.isMobile;
        
        if (isMobile) {
            // モバイル：右スティック（エイム）の入力
            const aimInput = this.game.inputSystem.getAimInput();
            
            // デバッグログ（問題特定用）
            console.log('🎯 Player.js updateAiming:', {
                isMobile: isMobile,
                gameIsMobile: this.game.isMobile,
                aimInput: aimInput,
                currentAngle: this.angle,
                willUpdateAngle: (aimInput.x !== 0 || aimInput.y !== 0)
            });
            
            if (aimInput.active && (aimInput.x !== 0 || aimInput.y !== 0)) {
                const newAngle = Math.atan2(aimInput.y, aimInput.x);
                this.angle = newAngle;
                console.log('✅ Player angle updated:', {
                    from: this.angle,
                    to: newAngle,
                    degrees: (newAngle * 180 / Math.PI).toFixed(1)
                });
            }
        } else {
            // PC：マウス位置へのエイム（既に変換済み座標を使用）
            if (inputState.mouse.x !== undefined && inputState.mouse.y !== undefined) {
                // handleMouseMoveで既に座標変換済みなので直接使用
                const dx = inputState.mouse.x - this.x;
                const dy = inputState.mouse.y - this.y;
                this.angle = Math.atan2(dy, dx);
            }
        }
    }
    
    // バリア効果の更新
    updateBarrier(deltaTime) {
        if (this.barrierActive) {
            this.barrierTimeLeft -= deltaTime;
            if (this.barrierTimeLeft <= 0) {
                this.barrierActive = false;
                this.barrierTimeLeft = 0;
            }
        }
    }
    
    // ダメージ処理
    takeDamage(damage) {
        if (!this.game) return;
        
        // バリア効果中はダメージ無効
        if (this.barrierActive) {
            return;
        }
        
        this.health = Math.max(0, this.health - damage);
        
        // コンボリセット
        if (this.game.combo) {
            this.game.combo.count = 0;
        }
        
        // 画面フラッシュ効果
        this.game.damageEffects.screenFlash = 0.8;
        
        // 画面揺れ効果
        this.game.damageEffects.screenShake.intensity = damage * 2;
        this.game.damageEffects.screenShake.duration = 300;
        
        // ゲームオーバーチェック
        if (this.health <= 0) {
            this.game.gameState = 'gameOver';
        }
    }
    
    // ヘルス回復
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    // 最大ヘルス増加
    increaseMaxHealth(amount) {
        this.maxHealth += amount;
        this.health += amount; // 現在ヘルスも同時に回復
        
        // サウンド再生
        if (this.game && this.game.audioSystem && this.game.audioSystem.sounds.pickupHealth) {
            this.game.audioSystem.sounds.pickupHealth();
        }
    }
    
    // スピード増加
    increaseSpeed(amount) {
        this.speed = Math.min(350, this.speed + amount); // 最大スピード制限
        
        // サウンド再生
        if (this.game && this.game.audioSystem && this.game.audioSystem.sounds.pickupSpeed) {
            this.game.audioSystem.sounds.pickupSpeed();
        }
    }
    
    // バリア効果の発動
    activateBarrier(duration) {
        this.barrierActive = true;
        this.barrierTimeLeft = duration;
    }
    
    // 経験値追加
    addExperience(amount) {
        if (!this.game) return;
        
        this.exp += amount;
        
        // レベルアップチェック
        while (this.exp >= this.expToNext) {
            this.levelUp();
        }
    }
    
    // レベルアップ処理
    levelUp() {
        this.exp -= this.expToNext;
        this.level++;
        this.expToNext = Math.floor(this.expToNext * 1.2); // 20%増加
        
        // レベルシステムに通知
        if (this.game && this.game.levelSystem) {
            this.game.levelSystem.levelUp();
        }
    }
    
    // ゲーム開始時のリセット
    reset() {
        this.x = 640;
        this.y = 360;
        this.health = 100;
        this.maxHealth = 100;
        this.speed = 200;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        this.angle = 0;
        this.barrierActive = false;
        this.barrierTimeLeft = 0;
    }
    
    // プレイヤーの状態取得（UI更新用）
    getStatus() {
        return {
            health: this.health,
            maxHealth: this.maxHealth,
            level: this.level,
            exp: this.exp,
            expToNext: this.expToNext,
            speed: this.speed,
            barrierActive: this.barrierActive,
            barrierTimeLeft: this.barrierTimeLeft
        };
    }
    
    // 位置とサイズ情報取得（衝突判定用）
    getBounds() {
        return {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            radius: this.width / 2 // 円形衝突判定用
        };
    }
}