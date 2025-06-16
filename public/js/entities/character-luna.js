/**
 * CharacterLuna - ルナキャラクター専用拡張メソッド
 * オートエイム・ハート装飾・マウス操作に特化
 */
export class CharacterLuna {
    
    /**
     * Luna専用更新処理
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     */
    static updateLuna(player, deltaTime) {
        // オートターゲットの生存確認
        this._validateAutoTarget(player);
        
        // エイムアシスト処理
        this._updateAimAssist(player, deltaTime);
        
        // 可愛い浮遊アニメーション
        this._updateFloatAnimation(player, deltaTime);
    }
    
    /**
     * オートターゲットの生存確認
     * @param {Object} player - プレイヤーインスタンス
     * @private
     */
    static _validateAutoTarget(player) {
        if (!player.autoTarget || !player.game || !player.game.enemies) {
            player.autoTarget = null;
            return;
        }
        
        // ターゲットが生存しているかチェック
        const targetExists = player.game.enemies.some(enemy => enemy === player.autoTarget);
        if (!targetExists) {
            player.autoTarget = null;
        }
    }
    
    /**
     * エイムアシスト処理
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    static _updateAimAssist(player, deltaTime) {
        if (!player.autoAim || !player.game) return;
        
        const enemies = player.game.enemies || [];
        const maxRange = player.specialAbilities?.autoTargeting?.range || 300;
        
        // 現在のターゲットが範囲外になった場合は解除
        if (player.autoTarget) {
            const dx = player.autoTarget.x - player.x;
            const dy = player.autoTarget.y - player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > maxRange) {
                player.autoTarget = null;
            }
        }
        
        // 新しいターゲットを検索（現在のターゲットがない場合）
        if (!player.autoTarget && enemies.length > 0) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            enemies.forEach(enemy => {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance && distance <= maxRange) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            player.autoTarget = nearestEnemy;
        }
        
        // ターゲットに向けて角度を調整（スムージング付き）
        if (player.autoTarget) {
            const dx = player.autoTarget.x - player.x;
            const dy = player.autoTarget.y - player.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // スムースな角度変更（急激な変化を避ける）
            const angleDiff = this._normalizeAngle(targetAngle - player.angle);
            const maxAngleChange = Math.PI * 2 * deltaTime; // 1秒で1回転
            
            if (Math.abs(angleDiff) > maxAngleChange) {
                player.angle += Math.sign(angleDiff) * maxAngleChange;
            } else {
                player.angle = targetAngle;
            }
            
            player.angle = this._normalizeAngle(player.angle);
        }
    }
    
    /**
     * 可愛い浮遊アニメーション
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    static _updateFloatAnimation(player, deltaTime) {
        // 浮遊アニメーション用のタイマー
        if (!player._floatTimer) {
            player._floatTimer = 0;
        }
        
        player._floatTimer += deltaTime;
        
        // 浮遊効果（上下に緩やかに移動）
        const floatAmplitude = 2; // 浮遊の振幅（ピクセル）
        const floatSpeed = 2; // 浮遊の速度
        player._floatOffset = Math.sin(player._floatTimer * floatSpeed) * floatAmplitude;
        
        // ハート装飾のパルス効果
        if (!player._heartPulse) {
            player._heartPulse = 0;
        }
        player._heartPulse += deltaTime * 3; // ハートの脈動速度
        
        // キラキラエフェクトのタイマー
        if (!player._sparkleTimer) {
            player._sparkleTimer = 0;
        }
        player._sparkleTimer += deltaTime;
        
        // ランダムキラキラ生成（0.5秒に1回）
        if (player._sparkleTimer > 0.5) {
            player._sparkleTimer = 0;
            if (player.game && player.game.particleSystem) {
                this._createSparkleEffect(player);
            }
        }
    }
    
    /**
     * キラキラエフェクト生成
     * @param {Object} player - プレイヤーインスタンス
     * @private
     */
    static _createSparkleEffect(player) {
        const sparkleCount = 3;
        const sparkleColors = ['#FFD700', '#FF69B4', '#FFF0F5', '#FFFF00'];
        
        for (let i = 0; i < sparkleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 10;
            const sparkleX = player.x + Math.cos(angle) * distance;
            const sparkleY = player.y + Math.sin(angle) * distance;
            const color = sparkleColors[Math.floor(Math.random() * sparkleColors.length)];
            
            player.game.particleSystem.createParticle(
                sparkleX,
                sparkleY,
                (Math.random() - 0.5) * 50, // vx
                (Math.random() - 0.5) * 50, // vy
                color,
                800, // 短い寿命
                {
                    size: 1 + Math.random() * 2,
                    friction: 0.98,
                    gravity: 0
                }
            );
        }
    }
    
    /**
     * 角度正規化ヘルパー
     * @param {number} angle - 角度（ラジアン）
     * @returns {number} -π から π の範囲に正規化された角度
     * @private
     */
    static _normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    /**
     * Luna専用描画データ取得
     * @param {Object} player - プレイヤーインスタンス
     * @returns {Object} 描画用データ
     */
    static getRenderData(player) {
        const baseData = {
            x: player.x,
            y: player.y + (player._floatOffset || 0), // 浮遊オフセット適用
            characterType: 'luna',
            angle: player.angle,
            health: player.health,
            maxHealth: player.maxHealth,
            barrierActive: player.barrierActive,
            barrierTimeLeft: player.barrierTimeLeft
        };
        
        // Luna専用エフェクトデータ
        const lunaEffects = {
            heartPulse: Math.sin(player._heartPulse || 0) * 0.3 + 1, // 0.7-1.3の範囲
            floatOffset: player._floatOffset || 0,
            autoTarget: player.autoTarget ? {
                x: player.autoTarget.x,
                y: player.autoTarget.y
            } : null
        };
        
        return {
            ...baseData,
            lunaEffects
        };
    }
    
    /**
     * Luna専用入力処理
     * @param {Object} player - プレイヤーインスタンス
     * @param {Object} inputState - 入力状態
     * @returns {Object} 移動入力
     */
    static processInput(player, inputState) {
        let moveX = 0;
        let moveY = 0;
        
        // マウス/タッチによる移動のみ
        if (!player.game.inputSystem.isMobile) {
            // PC: WASDキー移動
            if (inputState.keys['KeyW'] || inputState.keys['ArrowUp']) moveY -= 1;
            if (inputState.keys['KeyS'] || inputState.keys['ArrowDown']) moveY += 1;
            if (inputState.keys['KeyA'] || inputState.keys['ArrowLeft']) moveX -= 1;
            if (inputState.keys['KeyD'] || inputState.keys['ArrowRight']) moveX += 1;
        } else {
            // モバイル: 左スティック移動
            const movementInput = player.game.inputSystem.getMovementInput();
            moveX = movementInput.x;
            moveY = movementInput.y;
        }
        
        return { moveX, moveY };
    }
    
    /**
     * Luna専用リセット処理
     * @param {Object} player - プレイヤーインスタンス
     */
    static resetLuna(player) {
        player.autoTarget = null;
        player._floatTimer = 0;
        player._floatOffset = 0;
        player._heartPulse = 0;
        player._sparkleTimer = 0;
        
        console.log('CharacterLuna: Luna専用データをリセットしました');
    }
    
    /**
     * Luna専用状態情報取得
     * @param {Object} player - プレイヤーインスタンス
     * @returns {Object} Luna状態情報
     */
    static getLunaStatus(player) {
        return {
            autoTarget: player.autoTarget ? {
                x: player.autoTarget.x,
                y: player.autoTarget.y,
                type: player.autoTarget.type
            } : null,
            autoAimActive: player.autoAim,
            inputMode: player.inputMode,
            floatOffset: player._floatOffset || 0,
            heartPulse: player._heartPulse || 0
        };
    }
}