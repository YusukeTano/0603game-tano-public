/**
 * CharacterAurum - オーラムキャラクター専用拡張メソッド
 * 運レベル10スタート・金色→レインボーエフェクト・ドロップ率向上に特化
 */
export class CharacterAurum {
    
    /**
     * Aurum専用更新処理
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     */
    static updateAurum(player, deltaTime) {
        // 運レベルによる視覚効果切り替え
        this._updateLuckVisualEffects(player, deltaTime);
        
        // オーラ回転・パルス効果
        this._updateAuraEffects(player, deltaTime);
        
        // 金色パーティクル軌道
        this._updateGoldenParticles(player, deltaTime);
        
        // レインボーモード管理
        this._updateRainbowMode(player, deltaTime);
    }
    
    /**
     * 運レベルによる視覚効果切り替え
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    static _updateLuckVisualEffects(player, deltaTime) {
        const luckLevel = player.skillLevels.luck || 0;
        const rainbowThreshold = player.specialAbilities?.luckBoost?.rainbowThreshold || 20;
        
        // レインボーモード判定
        const shouldBeRainbow = luckLevel >= rainbowThreshold;
        
        if (shouldBeRainbow !== player._isRainbowMode) {
            player._isRainbowMode = shouldBeRainbow;
            
            if (shouldBeRainbow) {
                console.log(`CharacterAurum: レインボーモード開始！ (運レベル: ${luckLevel})`);
                this._triggerRainbowTransition(player);
            } else {
                console.log(`CharacterAurum: 通常モードに戻る (運レベル: ${luckLevel})`);
            }
        }
    }
    
    /**
     * オーラ効果の更新
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    static _updateAuraEffects(player, deltaTime) {
        // オーラ回転タイマー
        if (!player._auraRotation) {
            player._auraRotation = 0;
        }
        player._auraRotation += deltaTime * 0.5; // 0.5rad/s でゆっくり回転
        
        // パルス効果タイマー
        if (!player._auraPulse) {
            player._auraPulse = 0;
        }
        player._auraPulse += deltaTime * 2; // 2rad/s でパルス
        
        // 運レベルに応じた強度調整
        const luckLevel = player.skillLevels.luck || 0;
        const intensity = Math.min(1.0 + (luckLevel * 0.05), 2.0); // 最大200%
        player._auraIntensity = intensity;
    }
    
    /**
     * 金色パーティクル軌道更新
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    static _updateGoldenParticles(player, deltaTime) {
        if (!player._particleTimer) {
            player._particleTimer = 0;
        }
        player._particleTimer += deltaTime;
        
        // パーティクル生成間隔（運レベルに応じて頻度アップ）
        const luckLevel = player.skillLevels.luck || 0;
        const spawnInterval = Math.max(0.1, 0.3 - (luckLevel * 0.01)); // 最短0.1秒間隔
        
        if (player._particleTimer > spawnInterval) {
            player._particleTimer = 0;
            
            if (player.game && player.game.particleSystem) {
                this._createGoldenDustParticle(player);
            }
        }
    }
    
    /**
     * レインボーモード更新
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    static _updateRainbowMode(player, deltaTime) {
        if (!player._isRainbowMode) return;
        
        // レインボー色相変化
        if (!player._rainbowHue) {
            player._rainbowHue = 0;
        }
        player._rainbowHue += deltaTime * 60; // 60度/秒で色相変化
        if (player._rainbowHue >= 360) {
            player._rainbowHue -= 360;
        }
        
        // レインボーパーティクル生成頻度アップ
        if (!player._rainbowParticleTimer) {
            player._rainbowParticleTimer = 0;
        }
        player._rainbowParticleTimer += deltaTime;
        
        if (player._rainbowParticleTimer > 0.05) { // 0.05秒間隔（高頻度）
            player._rainbowParticleTimer = 0;
            
            if (player.game && player.game.particleSystem) {
                this._createRainbowParticle(player);
            }
        }
    }
    
    /**
     * 金色パーティクル生成
     * @param {Object} player - プレイヤーインスタンス
     * @private
     */
    static _createGoldenDustParticle(player) {
        const particleCount = player._isRainbowMode ? 3 : 1;
        
        for (let i = 0; i < particleCount; i++) {
            // 軌道計算（8個のパーティクルが円形軌道）
            const orbitIndex = (player._particleOrbitIndex || 0) + i;
            const angle = (orbitIndex * Math.PI * 2 / 8) + (player._auraRotation || 0);
            const orbitRadius = 25 + Math.sin((player._auraPulse || 0)) * 5;
            
            const particleX = player.x + Math.cos(angle) * orbitRadius;
            const particleY = player.y + Math.sin(angle) * orbitRadius;
            
            // 色の決定
            let color = '#FFD700'; // 基本の金色
            if (player._isRainbowMode) {
                const hue = ((player._rainbowHue || 0) + (i * 120)) % 360;
                color = `hsl(${hue}, 100%, 60%)`;
            }
            
            player.game.particleSystem.createParticle(
                particleX,
                particleY,
                (Math.random() - 0.5) * 20, // 軽い散らばり
                (Math.random() - 0.5) * 20,
                color,
                1500, // 1.5秒寿命
                {
                    size: 1.5 + Math.random() * 1,
                    friction: 0.99,
                    gravity: 0,
                    alpha: 0.8,
                    sparkle: true
                }
            );
        }
        
        // 軌道インデックス更新
        player._particleOrbitIndex = ((player._particleOrbitIndex || 0) + 1) % 8;
    }
    
    /**
     * レインボーパーティクル生成
     * @param {Object} player - プレイヤーインスタンス
     * @private
     */
    static _createRainbowParticle(player) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 15;
        const particleX = player.x + Math.cos(angle) * distance;
        const particleY = player.y + Math.sin(angle) * distance;
        
        const hue = Math.random() * 360;
        const color = `hsl(${hue}, 100%, 70%)`;
        
        player.game.particleSystem.createParticle(
            particleX,
            particleY,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            color,
            1200,
            {
                size: 2 + Math.random() * 2,
                friction: 0.97,
                gravity: 0,
                alpha: 0.9,
                sparkle: true,
                rainbow: true
            }
        );
    }
    
    /**
     * レインボー遷移エフェクト
     * @param {Object} player - プレイヤーインスタンス
     * @private
     */
    static _triggerRainbowTransition(player) {
        if (!player.game || !player.game.particleSystem) return;
        
        // 爆発的なレインボーパーティクル生成
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const speed = 100 + Math.random() * 50;
            const hue = (i / 20) * 360;
            
            player.game.particleSystem.createParticle(
                player.x,
                player.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                `hsl(${hue}, 100%, 60%)`,
                2000,
                {
                    size: 3 + Math.random() * 3,
                    friction: 0.95,
                    gravity: 0,
                    alpha: 1.0,
                    sparkle: true,
                    rainbow: true
                }
            );
        }
        
        // 効果音再生（レベルアップ音を流用）
        if (player.game.audioSystem && player.game.audioSystem.sounds.upgrade) {
            player.game.audioSystem.sounds.upgrade();
        }
    }
    
    /**
     * Aurum専用描画データ取得
     * @param {Object} player - プレイヤーインスタンス
     * @returns {Object} 描画用データ
     */
    static getRenderData(player) {
        const baseData = {
            x: player.x,
            y: player.y,
            characterType: 'aurum',
            angle: player.angle,
            health: player.health,
            maxHealth: player.maxHealth,
            barrierActive: player.barrierActive,
            barrierTimeLeft: player.barrierTimeLeft
        };
        
        // Aurum専用エフェクトデータ
        const aurumEffects = {
            isRainbowMode: player._isRainbowMode || false,
            rainbowHue: player._rainbowHue || 0,
            auraRotation: player._auraRotation || 0,
            auraPulse: Math.sin(player._auraPulse || 0) * 0.3 + 1, // 0.7-1.3の範囲
            auraIntensity: player._auraIntensity || 1,
            luckLevel: player.skillLevels.luck || 0
        };
        
        return {
            ...baseData,
            aurumEffects
        };
    }
    
    /**
     * 運レベルによるドロップ率計算
     * @param {Object} player - プレイヤーインスタンス
     * @param {number} baseRate - 基本ドロップ率
     * @returns {number} 調整後ドロップ率
     */
    static calculateLuckDropRate(player, baseRate) {
        const luckLevel = player.skillLevels.luck || 0;
        const luckBonus = player.luckBonus || 0; // Player.jsの運ボーナス計算を使用
        
        // 基本ドロップ率に運ボーナスを適用
        const enhancedRate = baseRate * (1 + luckBonus / 100);
        
        console.log(`CharacterAurum: ドロップ率計算`, {
            luckLevel,
            luckBonus,
            baseRate,
            enhancedRate
        });
        
        return enhancedRate;
    }
    
    /**
     * Aurum専用リセット処理
     * @param {Object} player - プレイヤーインスタンス
     */
    static resetAurum(player) {
        player._isRainbowMode = false;
        player._rainbowHue = 0;
        player._auraRotation = 0;
        player._auraPulse = 0;
        player._auraIntensity = 1;
        player._particleTimer = 0;
        player._particleOrbitIndex = 0;
        player._rainbowParticleTimer = 0;
        
        // 運レベル10でスタートの再適用
        player.skillLevels.luck = 10;
        
        console.log('CharacterAurum: Aurum専用データをリセットしました（運レベル10でスタート）');
    }
    
    /**
     * Aurum専用状態情報取得
     * @param {Object} player - プレイヤーインスタンス
     * @returns {Object} Aurum状態情報
     */
    static getAurumStatus(player) {
        return {
            luckLevel: player.skillLevels.luck || 0,
            luckBonus: player.luckBonus || 0,
            isRainbowMode: player._isRainbowMode || false,
            rainbowHue: player._rainbowHue || 0,
            auraIntensity: player._auraIntensity || 1,
            dropRateMultiplier: this.calculateLuckDropRate(player, 1) // 基本率1での倍率
        };
    }
    
    /**
     * Aurum専用レベルアップ後処理
     * @param {Object} player - プレイヤーインスタンス
     */
    static onLevelUp(player) {
        const luckLevel = player.skillLevels.luck || 0;
        const rainbowThreshold = player.specialAbilities?.luckBoost?.rainbowThreshold || 20;
        
        // レインボーモード突入時の特別演出
        if (luckLevel === rainbowThreshold && !player._isRainbowMode) {
            this._triggerRainbowTransition(player);
            
            // 画面エフェクト
            if (player.game) {
                player.game.damageEffects = player.game.damageEffects || {};
                player.game.damageEffects.screenFlash = 0.5; // 軽いフラッシュ
            }
        }
        
        console.log(`CharacterAurum: レベルアップ処理完了 (運レベル: ${luckLevel})`);
    }
}