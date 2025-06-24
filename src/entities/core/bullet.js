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
        
        // 🛡️ 重要: 弾丸ライフサイクル管理フラグ（重複ヒット防止）
        this.isActive = true;           // 弾丸がアクティブ状態か
        this.hasHitThisFrame = false;   // このフレームでヒット済みか
        this.isMarkedForRemoval = false; // 削除マーク（次フレーム削除予約）
        
        // 弾丸タイプ
        this.enemyBullet = options.enemyBullet || false;
        this.weaponType = options.weaponType || 'plasma';
        this.color = options.color || '#00ccff';
        
        // 特殊効果
        this.explosive = options.explosive || false;
        this.explosionRadius = options.explosionRadius || 50;
        this.homing = options.homing || false;
        this.homingStrength = options.homingStrength || 0.1;
        this.homingRange = options.homingRange || 200;
        
        // スーパーホーミング特殊設定
        this.superHoming = options.superHoming || false;
        this.penetration = options.penetration || 0; // 貫通回数
        this.penetrateCount = options.penetrateCount || 0; // 貫通済み回数
        
        // スーパーショットガン特殊設定
        this.superShotgun = options.superShotgun || false;
        
        // 壁反射システム
        this.wallReflection = options.wallReflection || false;
        this.removeOnEnemyHit = options.removeOnEnemyHit || false;
        this.reflectionCount = 0; // 反射回数カウンタ
        
        
        // スーパーホーミング弾エフェクト用データ
        this.trail = []; // トレイル軌跡用の座標履歴
        this.maxTrailLength = 8; // 軌跡の最大長
        this.rotation = 0; // 弾丸の回転角度
        this.pulsePhase = 0; // パルス効果用の位相
        this.targetEnemy = null; // 現在の追尾対象
        this.lastTrailUpdate = 0; // トレイル更新タイミング制御
        
        // ホーミング寿命管理
        this.age = 0;                    // 弾丸の生存時間
        this.originX = this.x;           // 発射位置X
        this.originY = this.y;           // 発射位置Y
        this.homingFailedTime = 0;       // 敵を見失った時間
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
        
        // コンボ色システム関連
        this.comboColor = options.comboColor || null;
        this.comboGlowIntensity = options.comboGlowIntensity || 0;
        this.comboHasSpecialEffect = options.comboHasSpecialEffect || false;
        this.comboIsRainbow = options.comboIsRainbow || false;
        this.comboRainbowHue = options.comboRainbowHue || 0;
        
        // デバッグログ
        if (!this.enemyBullet && this.comboColor) {
            console.log(`[Bullet] コンボ弾丸作成: color=${this.comboColor}, rainbow=${this.comboIsRainbow}`);
        }
    }
    
    /**
     * 弾丸の更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス（ホーミング用）
     * @returns {boolean} 弾丸が削除されるべきかどうか
     */
    update(deltaTime, game) {
        // 🛡️ フレーム開始時の状態リセット（重複ヒット防止）
        this.hasHitThisFrame = false;
        
        // 🛡️ 削除マーク確認（次フレーム削除予約システム）
        if (this.isMarkedForRemoval) {
            console.log('🗑️ Bullet: Removing bullet marked for deletion', {
                id: this.id || 'unknown',
                weaponType: this.weaponType,
                x: this.x.toFixed(1),
                y: this.y.toFixed(1)
            });
            return true; // 削除実行
        }
        
        // 🛡️ 非アクティブ弾丸は更新しない
        if (!this.isActive) {
            console.log('⚠️ Bullet: Skipping update for inactive bullet');
            return false;
        }
        
        // 弾丸年齢の更新
        this.age += deltaTime;
        
        // レインボー効果の更新
        if (this.comboIsRainbow) {
            this.comboRainbowHue = (this.comboRainbowHue + deltaTime * 360) % 360; // 1秒で360度回転
        }
        
        // ハイブリッド削除条件チェック
        if (this.shouldRemoveForLifetime()) {
            return true; // 削除フラグ
        }
        
        // 特殊弾丸の更新処理
        this.updateSpecialEffects(deltaTime, game);
        
        // スーパーホーミング弾のエフェクト更新
        if (this.superHoming) {
            this.updateSuperHomingEffects(deltaTime);
        }
        
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
        
        // 壁反射処理（スーパーショットガン専用）
        if (this.wallReflection) {
            this.handleWallReflection(game);
        }
        
        // 多段階反射処理（従来システム）
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
        else if (this.bonusBounceChance > 0 && Math.random() * 100 < this.bonusBounceChance) {
            // ボーナス確率反射（毎回判定）
            shouldBounce = true;
            console.log('Bullet: Bonus bounce success', {
                chance: this.bonusBounceChance
            });
        }
        
        if (shouldBounce) {
            let bounced = false;
            if (this.x < 0 || this.x > game.baseWidth) {
                this.vx = -this.vx;
                if (this.bouncesLeft > 0) this.bouncesLeft--;
                bounced = true;
                console.log('Bullet: Horizontal bounce', { x: this.x, vx: this.vx });
            }
            if (this.y < 0 || this.y > game.baseHeight) {
                this.vy = -this.vy;
                if (this.bouncesLeft > 0) this.bouncesLeft--;
                bounced = true;
                console.log('Bullet: Vertical bounce', { y: this.y, vy: this.vy });
            }
            
            if (bounced) {
                // 反射エフェクト生成
                if (game.particleSystem && game.particleSystem.createWallBounceEffect) {
                    game.particleSystem.createWallBounceEffect(this.x, this.y);
                }
                
                // 反射音再生（25%の確率で音を出す - 音の重複を避ける）
                if (Math.random() < 0.25 && game.audioSystem && game.audioSystem.sounds.wallBounce) {
                    game.audioSystem.sounds.wallBounce();
                }
                
                console.log('Bullet: Bounce effect triggered', {
                    x: this.x,
                    y: this.y,
                    remainingBounces: this.bouncesRemaining,
                    bonusChance: this.bonusBounceChance
                });
            }
        }
        
        // 射程チェック（スーパーホーミング・壁反射弾は距離制限なし）
        if (!this.superHoming && !this.wallReflection && this.distance > this.range) {
            if (this.explosive) {
                game.explode(this.x, this.y, this.explosionRadius, this.damage);
            }
            return true; // 削除フラグ
        }
        
        return false; // 継続
    }
    
    /**
     * 🛡️ 弾丸ヒット処理（重複防止機能付き）
     * @param {Object} target - ヒット対象（敵またはプレイヤー）
     * @param {string} hitType - ヒットタイプ（'enemy' | 'player'）
     * @returns {boolean} ヒット処理が実行されたかどうか
     */
    processHit(target, hitType = 'enemy') {
        // 🛡️ 重複ヒットチェック
        if (this.hasHitThisFrame) {
            console.log('🚫 Bullet: Duplicate hit prevented', {
                weaponType: this.weaponType,
                hitType: hitType,
                targetType: target.type || 'unknown'
            });
            return false; // 重複ヒットを拒否
        }
        
        // 🛡️ 非アクティブ弾丸はヒット処理しない
        if (!this.isActive) {
            console.log('⚠️ Bullet: Hit ignored for inactive bullet');
            return false;
        }
        
        // 🛡️ ヒットフラグを設定（このフレーム内での重複を防止）
        this.hasHitThisFrame = true;
        
        console.log('✅ Bullet: Valid hit processed', {
            weaponType: this.weaponType,
            hitType: hitType,
            targetType: target.type || 'unknown',
            bulletPos: { x: this.x.toFixed(1), y: this.y.toFixed(1) }
        });
        
        return true; // ヒット処理を許可
    }
    
    /**
     * 🛡️ 弾丸を削除マーク（次フレーム削除）
     * @param {string} reason - 削除理由
     */
    markForRemoval(reason = 'unknown') {
        this.isMarkedForRemoval = true;
        this.isActive = false; // 即座に非アクティブ化
        
        console.log('🏷️ Bullet: Marked for removal', {
            reason: reason,
            weaponType: this.weaponType,
            id: this.id || 'unknown',
            pos: { x: this.x.toFixed(1), y: this.y.toFixed(1) }
        });
    }
    
    /**
     * 🛡️ 弾丸のアクティブ状態チェック
     * @returns {boolean} 弾丸がアクティブかどうか
     */
    isActiveBullet() {
        return this.isActive && !this.isMarkedForRemoval && !this.hasHitThisFrame;
    }
    
    /**
     * 特殊効果の更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} game - ゲームインスタンス
     * @private
     */
    updateSpecialEffects(deltaTime, game) {
        // ホーミング処理（通常 + スーパーホーミング）
        if (this.homing && !this.enemyBullet) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            // スーパーホーミングの場合は拡張範囲とより強力な追尾
            const effectiveHomingRange = this.superHoming ? 
                (this.homingRange || 800) : (this.homingRange || 200);
            const effectiveHomingStrength = this.superHoming ? 
                (this.homingStrength || 0.3) : (this.homingStrength || 0.1);
            
            game.enemies.forEach(enemy => {
                const dx = enemy.x - this.x;
                const dy = enemy.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance && distance < effectiveHomingRange) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            if (nearestEnemy) {
                // 敵を発見したのでリセット
                this.homingFailedTime = 0;
                
                const dx = nearestEnemy.x - this.x;
                const dy = nearestEnemy.y - this.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const currentSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                    const dirX = dx / length;
                    const dirY = dy / length;
                    
                    // スーパーホーミング専用の加速度ベース制御
                    if (this.superHoming) {
                        const targetSpeed = 1500; // 目標速度
                        
                        if (currentSpeed < targetSpeed * 0.8) {
                            // 速度が目標の80%以下なら急加速
                            const acceleration = 4000 * deltaTime; // 1秒で4000px/s加速
                            this.vx += dirX * acceleration;
                            this.vy += dirY * acceleration;
                            console.log(`SuperHoming: Accelerating - current speed: ${currentSpeed.toFixed(0)}, acceleration: ${acceleration.toFixed(1)}`);
                        } else {
                            // 目標速度付近では精密なホーミング
                            const targetVx = dirX * targetSpeed;
                            const targetVy = dirY * targetSpeed;
                            this.vx += (targetVx - this.vx) * effectiveHomingStrength;
                            this.vy += (targetVy - this.vy) * effectiveHomingStrength;
                        }
                        
                        // 速度上限チェック（最大1800 = 目標の120%）
                        const newSpeed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
                        if (newSpeed > targetSpeed * 1.2) {
                            const scale = (targetSpeed * 1.2) / newSpeed;
                            this.vx *= scale;
                            this.vy *= scale;
                            console.log(`SuperHoming: Speed capped at ${(targetSpeed * 1.2).toFixed(0)}`);
                        }
                        
                        this.targetEnemy = nearestEnemy; // 追尾対象を記録
                    } else {
                        // 通常のホーミング処理（最小速度保証付き）
                        const minSpeed = 400; // 通常弾の最小速度
                        const effectiveSpeed = Math.max(currentSpeed, minSpeed);
                        const targetVx = dirX * effectiveSpeed;
                        const targetVy = dirY * effectiveSpeed;
                        this.vx += (targetVx - this.vx) * effectiveHomingStrength;
                        this.vy += (targetVy - this.vy) * effectiveHomingStrength;
                        
                        // デバッグ用（速度が低下した場合のみログ出力）
                        if (currentSpeed < minSpeed * 0.8) {
                            console.log(`Normal homing: Speed recovered from ${currentSpeed.toFixed(0)} to ${minSpeed}`);
                        }
                    }
                }
            } else {
                // 敵を見失った時間を蓄積
                this.homingFailedTime += deltaTime;
                
                // スーパーホーミング: 追尾対象をクリア
                if (this.superHoming) {
                    this.targetEnemy = null;
                }
                
                // 1秒間敵がいなければホーミング無効化
                if (this.homingFailedTime > 1.0) {
                    this.homing = false;
                }
            }
        }
    }
    
    /**
     * ハイブリッド削除条件チェック
     * @returns {boolean} 削除すべきかどうか
     */
    shouldRemoveForLifetime() {
        // 壁反射弾は敵にヒットするまで永続
        if (this.wallReflection) {
            return false; // 永続的に生存
        }
        
        // スーパーホーミング専用の削除条件
        if (this.superHoming) {
            // 条件1: 最大生存時間（10秒に延長）
            if (this.age > 10.0) {
                return true;
            }
            
            // 条件2: 3体ヒット完了チェック
            if (this.maxHits && this.penetrateCount >= this.maxHits) {
                return true;
            }
            
            // 条件3: 敵を見失った時間（3秒に延長）
            if (this.homingFailedTime > 3.0) {
                return true;
            }
            
            // 条件4: 画面外大幅超過チェック
            if (this.isOffScreenFar()) {
                return true;
            }
            
            return false;
        }
        
        // 通常弾の削除条件
        // 条件1: 最大生存時間（5秒）
        if (this.age > 5.0) {
            return true;
        }
        
        // 条件2: 発射位置からの距離制限（1000px）
        const distanceFromOrigin = Math.sqrt(
            (this.x - this.originX) * (this.x - this.originX) + 
            (this.y - this.originY) * (this.y - this.originY)
        );
        if (distanceFromOrigin > 1000) {
            return true;
        }
        
        // 条件3: ホーミング失敗時間（1秒超過）
        if (this.homing && this.homingFailedTime > 1.0) {
            return true;
        }
        
        // 条件4: 画面外大幅超過チェック
        if (this.isOffScreenFar()) {
            return true;
        }
        
        return false;
    }
    
    /**
     * スーパーホーミング弾の特殊エフェクト更新
     * @param {number} deltaTime - フレーム時間
     */
    updateSuperHomingEffects(deltaTime) {
        // 回転エフェクト更新
        this.rotation += deltaTime * 8; // 1秒で約8ラジアン回転
        
        // パルス効果更新
        this.pulsePhase += deltaTime * 12; // 高速パルス
        
        // トレイル軌跡更新（60FPS基準で3フレームに1回）
        this.lastTrailUpdate += deltaTime;
        if (this.lastTrailUpdate >= 0.05) { // 20FPS相当
            this.updateTrail();
            this.lastTrailUpdate = 0;
        }
    }
    
    /**
     * トレイル軌跡の更新処理
     */
    updateTrail() {
        // 現在位置を軌跡に追加
        this.trail.push({
            x: this.x,
            y: this.y,
            alpha: 1.0,
            age: 0
        });
        
        // 軌跡の長さ制限
        if (this.trail.length > this.maxTrailLength) {
            this.trail.shift(); // 古い軌跡を削除
        }
        
        // 軌跡の透明度を更新（古いほど薄く）
        this.trail.forEach((point, index) => {
            point.alpha = (index + 1) / this.trail.length;
            point.age += 0.05;
        });
    }
    
    /**
     * スーパーホーミング弾の描画データ取得
     * @returns {Object} 描画用の特殊データ
     */
    getSuperHomingRenderData() {
        if (!this.superHoming) return null;
        
        const pulseScale = 1.0 + 0.3 * Math.sin(this.pulsePhase); // 30%のパルス
        const glowIntensity = 0.7 + 0.3 * Math.sin(this.pulsePhase * 1.5);
        
        return {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            pulseScale: pulseScale,
            glowIntensity: glowIntensity,
            trail: this.trail,
            targetEnemy: this.targetEnemy,
            isTracking: this.targetEnemy !== null,
            color: this.color,
            size: this.size
        };
    }
    
    /**
     * 壁反射処理（スーパーショットガン専用）
     * @param {Object} game - ゲームインスタンス
     */
    handleWallReflection(game) {
        const margin = 5; // 境界の余裕
        let reflected = false;
        
        // 左右の壁
        if (this.x <= margin) {
            this.vx = Math.abs(this.vx); // 右向きに反射
            this.x = margin; // 境界内に戻す
            reflected = true;
        } else if (this.x >= game.baseWidth - margin) {
            this.vx = -Math.abs(this.vx); // 左向きに反射
            this.x = game.baseWidth - margin;
            reflected = true;
        }
        
        // 上下の壁
        if (this.y <= margin) {
            this.vy = Math.abs(this.vy); // 下向きに反射
            this.y = margin; // 境界内に戻す
            reflected = true;
        } else if (this.y >= game.baseHeight - margin) {
            this.vy = -Math.abs(this.vy); // 上向きに反射
            this.y = game.baseHeight - margin;
            reflected = true;
        }
        
        if (reflected) {
            this.reflectionCount++;
            
            // 反射エフェクト生成
            if (game.particleSystem && game.particleSystem.createWallBounceEffect) {
                game.particleSystem.createWallBounceEffect(this.x, this.y);
            }
            
            // 反射音再生（3回に1回程度に制限）
            if (this.reflectionCount % 3 === 1 && 
                game.audioSystem && game.audioSystem.sounds.wallBounce) {
                game.audioSystem.sounds.wallBounce();
            }
            
            console.log(`SuperShotgun: Wall reflection #${this.reflectionCount} at (${this.x.toFixed(0)}, ${this.y.toFixed(0)})`);
        }
    }

    /**
     * 画面外大幅超過チェック
     * @returns {boolean} 画面外に大幅に出ているかどうか
     */
    isOffScreenFar() {
        // 壁反射弾は画面外に出ても削除しない
        if (this.wallReflection) {
            return false;
        }
        
        const margin = 500; // 大きなマージン
        return this.x < -margin || this.x > 1280 + margin || 
               this.y < -margin || this.y > 720 + margin;
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