
import { CharacterLuna } from './character-luna.js';
import { CharacterAurum } from './character-aurum.js';

export class Player {
    constructor(x = 640, y = 360, characterType = 'ray') {
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
        
        // キャラクター設定
        this.characterType = characterType;
        this.characterConfig = null; // CharacterFactoryから設定される
        
        // バリア効果
        this.barrierActive = false;
        this.barrierTimeLeft = 0;
        
        // 射程統計
        this.rangeBoosts = 0;
        this.currentRangeMultiplier = 1.0;
        
        // ホーミング性能
        this.homingStrengthBonus = 0;
        this.homingRangeBonus = 0;
        
        // アイテム吸引性能
        this.itemAttractionBonus = 0;  // 吸引範囲拡大ボーナス (0.0-1.25の範囲)
        
        // 反射性能（追加）
        this.bounceChance = 0;          // 弾丸反射確率（％）
        
        // 貫通性能（追加）
        this.piercingChance = 0;        // 弾丸貫通確率（％）
        
        // スキル取得レベル（効果量ベース累積）
        this.skillLevels = {
            damage: 0,           // 攻撃力強化の累積レベル
            fireRate: 0,         // 連射速度向上の累積レベル
            bulletSize: 0,       // 弾の大きさ増加の累積レベル
            piercing: 0,         // 貫通性能の累積レベル
            multiShot: 0,        // マルチショットの累積レベル
            bounce: 0,           // 反射性能の累積レベル
            homing: 0,           // ホーミング精度向上の累積レベル
            range: 0,            // 射程距離延長の累積レベル
            itemAttraction: 0,   // アイテム吸引の累積レベル
            luck: 0              // 運の累積レベル
        };
        
        // キャラクター別特殊能力
        this.autoAim = false;           // オートエイム機能
        this.autoTarget = null;         // 現在の自動ターゲット
        this.inputMode = 'standard';    // 入力モード
        
        // ゲーム参照（システム通信用）
        this.game = null;
    }
    
    /**
     * 運ボーナス計算（2段階成長システム）
     * Lv.1-15: +15%/レベル、Lv.16+: +20%/レベル
     * @returns {number} 運ボーナス (%)
     */
    calculateLuckBonus() {
        const luckLevel = this.skillLevels.luck || 0;
        if (luckLevel <= 15) {
            return luckLevel * 15;  // 基本成長: +15%/レベル
        } else {
            return 15 * 15 + (luckLevel - 15) * 20;  // 加速成長: +20%/レベル
        }
    }
    
    /**
     * 運ボーナスのゲッター
     * @returns {number} 現在の運ボーナス (%)
     */
    get luckBonus() {
        return this.calculateLuckBonus();
    }
    
    // ゲーム参照を設定
    setGame(game) {
        this.game = game;
    }
    
    /**
     * キャラクター設定を適用
     * @param {Object} characterConfig - CharacterFactoryからの設定
     */
    applyCharacterConfig(characterConfig) {
        this.characterConfig = characterConfig;
        
        // ビジュアル設定
        if (characterConfig.visualConfig) {
            const visual = characterConfig.visualConfig;
            this.width = visual.size || 20;
            this.height = visual.size || 20;
        }
        
        // スキルレベル設定（Aurumの運レベル10等）
        if (characterConfig.skillLevels) {
            Object.assign(this.skillLevels, characterConfig.skillLevels);
        }
        
        // 操作設定
        if (characterConfig.controlConfig) {
            const control = characterConfig.controlConfig;
            this.autoAim = control.autoAim || false;
            this.inputMode = control.inputMode || 'standard';
        }
        
        // 特殊能力設定
        if (characterConfig.specialAbilities) {
            this.specialAbilities = characterConfig.specialAbilities;
        }
        
        console.log(`Player: キャラクター設定適用完了 - ${characterConfig.name}`, {
            characterType: this.characterType,
            autoAim: this.autoAim,
            inputMode: this.inputMode,
            luckLevel: this.skillLevels.luck
        });
    }
    
    /**
     * オートエイム処理（Luna専用）
     * @private
     */
    _updateAutoAim() {
        if (!this.autoAim || !this.game || !this.game.enemies) return;
        
        const enemies = this.game.enemies;
        if (enemies.length === 0) {
            this.autoTarget = null;
            return;
        }
        
        // 最も近い敵を検索
        let nearestEnemy = null;
        let nearestDistance = Infinity;
        const maxRange = this.specialAbilities?.autoTargeting?.range || 300;
        
        enemies.forEach(enemy => {
            const dx = enemy.x - this.x;
            const dy = enemy.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < nearestDistance && distance <= maxRange) {
                nearestDistance = distance;
                nearestEnemy = enemy;
            }
        });
        
        // ターゲット更新と角度設定
        if (nearestEnemy) {
            this.autoTarget = nearestEnemy;
            const dx = nearestEnemy.x - this.x;
            const dy = nearestEnemy.y - this.y;
            this.angle = Math.atan2(dy, dx);
        } else {
            this.autoTarget = null;
        }
    }
    
    // プレイヤーの更新処理
    update(deltaTime) {
        if (!this.game) return;
        
        // キャラクター別移動入力取得
        const movementInput = this.game.inputSystem.getMovementInput(this.characterType);
        let moveX = movementInput.x;
        let moveY = movementInput.y;
        
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
        
        // オートエイム処理（キャラクター別）
        this._updateAutoAim();
        
        // エイム角度の計算
        this.updateAiming();
        
        // バリア効果の更新
        this.updateBarrier(deltaTime);
        
        // キャラクター別専用更新処理
        this._updateCharacterSpecific(deltaTime);
        
    }
    
    /**
     * キャラクター別専用更新処理
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    _updateCharacterSpecific(deltaTime) {
        switch (this.characterType) {
            case 'luna':
                CharacterLuna.updateLuna(this, deltaTime);
                break;
            case 'aurum':
                CharacterAurum.updateAurum(this, deltaTime);
                break;
            case 'ray':
            default:
                // レイは標準処理のみ、専用更新なし
                break;
        }
    }
    
    // エイム角度の更新
    updateAiming() {
        if (!this.game) return;
        
        // オートエイム有効時は処理をスキップ
        if (this.autoAim && this.autoTarget) {
            return; // オートエイムで既に角度設定済み
        }
        
        const inputState = this.game.inputSystem.getInputState();
        
        // キャラクター別入力処理
        if (this.inputMode === 'mouse') {
            // Luna: マウス/タッチ移動のみ、エイムは自動
            return; // エイムは自動処理のため何もしない
        }
        
        // 標準操作（Ray, Aurum）
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
        
        // 統合音響システム: プレイヤーダメージ音（FF UI Audio）
        if (this.game.audioSystem?.playDamageSound) {
            this.game.audioSystem.playDamageSound();
        }
        
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
    
    // 射程増加
    increaseRange(multiplier = 1.2) {
        this.rangeBoosts++;
        this.currentRangeMultiplier *= multiplier;
        
        console.log('Player: Range increased', {
            boosts: this.rangeBoosts,
            currentMultiplier: this.currentRangeMultiplier,
            multiplierApplied: multiplier
        });
        
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
        
        // ホーミング性能リセット
        this.homingStrengthBonus = 0;
        this.homingRangeBonus = 0;
        
        // 反射・貫通性能リセット
        this.bounceChance = 0;
        this.piercingChance = 0;
        
        // スキル取得レベルリセット（基本値）
        this.skillLevels = {
            damage: 0,
            fireRate: 0,
            bulletSize: 0,
            piercing: 0,
            multiShot: 0,
            bounce: 0,
            homing: 0,
            range: 0,
            itemAttraction: 0,
            luck: 0
        };
        
        // キャラクター設定を再適用
        if (this.characterConfig) {
            this.applyCharacterConfig(this.characterConfig);
        }
        
        // キャラクター別特殊能力リセット
        this.autoTarget = null;
        this._resetCharacterSpecific();
    }
    
    /**
     * キャラクター別専用リセット処理
     * @private
     */
    _resetCharacterSpecific() {
        switch (this.characterType) {
            case 'luna':
                CharacterLuna.resetLuna(this);
                break;
            case 'aurum':
                CharacterAurum.resetAurum(this);
                break;
            case 'ray':
            default:
                // レイは標準処理のみ、専用リセットなし
                break;
        }
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