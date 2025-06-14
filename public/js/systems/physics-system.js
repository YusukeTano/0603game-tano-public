/**
 * PhysicsSystem - 物理演算管理システム
 * 衝突検出・物理計算の一元管理
 */
export class PhysicsSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        console.log('PhysicsSystem: 物理システム初期化完了');
    }
    
    /**
     * 2つの円形オブジェクト間の距離を計算
     * @param {Object} obj1 - 最初のオブジェクト (x, y プロパティ必須)
     * @param {Object} obj2 - 2番目のオブジェクト (x, y プロパティ必須)
     * @returns {number} 距離
     */
    calculateDistance(obj1, obj2) {
        const dx = obj1.x - obj2.x;
        const dy = obj1.y - obj2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    /**
     * 2つの円形オブジェクト間の衝突判定
     * @param {Object} obj1 - 最初のオブジェクト (x, y プロパティ必須)
     * @param {Object} obj2 - 2番目のオブジェクト (x, y プロパティ必須)
     * @param {number} radius1 - 最初のオブジェクトの半径
     * @param {number} radius2 - 2番目のオブジェクトの半径
     * @returns {boolean} 衝突しているかどうか
     */
    isColliding(obj1, obj2, radius1, radius2) {
        const distance = this.calculateDistance(obj1, obj2);
        return distance < (radius1 + radius2);
    }
    
    /**
     * 円形衝突判定（半径自動計算版）
     * @param {Object} obj1 - 最初のオブジェクト
     * @param {Object} obj2 - 2番目のオブジェクト
     * @param {number} threshold - 衝突判定閾値
     * @returns {boolean} 衝突しているかどうか
     */
    isCollidingSimple(obj1, obj2, threshold) {
        const distance = this.calculateDistance(obj1, obj2);
        return distance < threshold;
    }
    
    /**
     * プレイヤーと敵の衝突判定（Enemyクラス対応）
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Enemy|Object} enemy - 敵インスタンスまたはオブジェクト
     * @returns {boolean} 衝突しているかどうか
     */
    checkPlayerEnemyCollision(player, enemy) {
        // Enemyクラスの場合は衝突データを使用
        if (enemy.getCollisionData) {
            const collisionData = enemy.getCollisionData();
            return this.isCollidingSimple(player, collisionData, collisionData.radius + 15);
        } else {
            // レガシー敵オブジェクトの場合
            return this.isCollidingSimple(player, enemy, 30);
        }
    }
    
    /**
     * 弾丸とプレイヤーの衝突判定
     * @param {Object} bullet - 弾丸オブジェクト
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {boolean} 衝突しているかどうか
     */
    checkBulletPlayerCollision(bullet, player) {
        return this.isCollidingSimple(bullet, player, 20);
    }
    
    /**
     * 弾丸と敵の衝突判定（Enemyクラス対応）
     * @param {Object} bullet - 弾丸オブジェクト
     * @param {Enemy|Object} enemy - 敵インスタンスまたはオブジェクト
     * @returns {boolean} 衝突しているかどうか
     */
    checkBulletEnemyCollision(bullet, enemy) {
        const bulletRadius = (bullet.size || 4) / 2;
        
        // Enemyクラスの場合は衝突データを使用
        if (enemy.getCollisionData) {
            const collisionData = enemy.getCollisionData();
            return this.isCollidingSimple(bullet, collisionData, collisionData.radius + bulletRadius);
        } else {
            // レガシー敵オブジェクトの場合
            return this.isCollidingSimple(bullet, enemy, 15 + bulletRadius);
        }
    }
    
    /**
     * プレイヤーとアイテムの衝突判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} pickup - アイテムオブジェクト
     * @returns {boolean} 衝突しているかどうか
     */
    checkPlayerPickupCollision(player, pickup) {
        return this.isCollidingSimple(player, pickup, 35);
    }
    
    /**
     * アイテムの引力範囲判定
     * @param {Object} player - プレイヤーオブジェクト
     * @param {Object} pickup - アイテムオブジェクト
     * @returns {Object} 引力情報 {inRange: boolean, distance: number, stage: string}
     */
    checkPickupAttraction(player, pickup) {
        const distance = this.calculateDistance(player, pickup);
        
        if (distance < 70) {
            return { inRange: true, distance, stage: 'collect' };
        } else if (distance <= 70 && distance > 50) {
            return { inRange: true, distance, stage: 'instant' };
        } else if (distance < 160 && distance > 70) {
            return { inRange: true, distance, stage: 'attract' };
        }
        
        return { inRange: false, distance, stage: 'none' };
    }
    
    /**
     * アイテム引力計算
     * @param {Object} pickup - アイテムオブジェクト
     * @param {Object} player - プレイヤーオブジェクト
     * @param {number} deltaTime - フレーム時間
     * @param {string} stage - 引力段階 ('attract' | 'instant')
     */
    applyPickupAttraction(pickup, player, deltaTime, stage) {
        if (stage === 'attract') {
            // 中距離での段階的吸い寄せ
            const distance = this.calculateDistance(player, pickup);
            const attractSpeed = 300;
            const attractForce = Math.pow(1 - (distance / 80), 2);
            pickup.x += (player.x - pickup.x) * attractForce * attractSpeed * deltaTime;
            pickup.y += (player.y - pickup.y) * attractForce * attractSpeed * deltaTime;
        } else if (stage === 'instant') {
            // 近距離での瞬間吸引
            const instantAttractSpeed = 800;
            pickup.x += (player.x - pickup.x) * instantAttractSpeed * deltaTime;
            pickup.y += (player.y - pickup.y) * instantAttractSpeed * deltaTime;
        }
    }
    
    /**
     * 爆発半径内の衝突判定
     * @param {Object} center - 爆発中心点 (x, y プロパティ必須)
     * @param {Object} target - 対象オブジェクト (x, y プロパティ必須)
     * @param {number} explosionRadius - 爆発半径
     * @returns {boolean} 爆発範囲内かどうか
     */
    checkExplosionCollision(center, target, explosionRadius) {
        return this.isCollidingSimple(center, target, explosionRadius);
    }
    
    /**
     * 正規化されたベクトルを計算
     * @param {Object} from - 開始点 (x, y プロパティ必須)
     * @param {Object} to - 終了点 (x, y プロパティ必須)
     * @returns {Object} 正規化されたベクトル {x: number, y: number, magnitude: number}
     */
    getNormalizedVector(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const magnitude = Math.sqrt(dx * dx + dy * dy);
        
        if (magnitude === 0) {
            return { x: 0, y: 0, magnitude: 0 };
        }
        
        return {
            x: dx / magnitude,
            y: dy / magnitude,
            magnitude: magnitude
        };
    }
    
    /**
     * 全体的な衝突処理の更新
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        this.updatePlayerEnemyCollisions();
        this.updateBulletCollisions();
        this.updatePickupPhysics(deltaTime);
    }
    
    /**
     * プレイヤーと敵の衝突処理
     * @private
     */
    updatePlayerEnemyCollisions() {
        this.game.enemies.forEach(enemy => {
            if (this.checkPlayerEnemyCollision(this.game.player, enemy)) {
                if (Date.now() - enemy.lastAttack > enemy.attackRate) {
                    this.game.player.takeDamage(enemy.damage);
                    enemy.lastAttack = Date.now();
                }
            }
        });
    }
    
    /**
     * 弾丸の衝突処理
     * @private
     */
    updateBulletCollisions() {
        const bullets = this.game.bulletSystem.getBullets();
        for (let i = bullets.length - 1; i >= 0; i--) {
            const bullet = bullets[i];
            
            if (bullet.enemyBullet) {
                // 敵の弾がプレイヤーに当たった場合
                if (this.checkBulletPlayerCollision(bullet, this.game.player)) {
                    this.game.player.takeDamage(bullet.damage);
                    this.game.bulletSystem.removeBullet(bullet);
                    continue;
                }
            } else {
                // プレイヤーの弾が敵に当たった場合
                let hit = false;
                for (let j = this.game.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.game.enemies[j];
                    
                    if (this.checkBulletEnemyCollision(bullet, enemy)) {
                        console.log('PhysicsSystem: bullet hit enemy', {
                            enemyType: enemy.type,
                            hasEnemyClass: enemy.constructor.name === 'Enemy',
                            hasTakeDamage: !!enemy.takeDamage,
                            hasIsDead: !!enemy.isDead,
                            currentHealth: enemy.health
                        });
                        
                        // 特殊効果処理
                        if (bullet.explosive) {
                            this.game.explode(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                        } else {
                            // ダメージ適用前に実際のダメージ量を計算
                            const actualDamage = Math.min(bullet.damage, enemy.health);
                            
                            // Enemyクラスの場合はtakeDamageメソッドを使用
                            if (enemy.takeDamage) {
                                enemy.takeDamage(bullet.damage);
                                console.log('PhysicsSystem: used Enemy.takeDamage, new health:', enemy.health);
                            } else {
                                enemy.health -= bullet.damage;
                                console.log('PhysicsSystem: used legacy damage, new health:', enemy.health);
                            }
                            
                            // ダメージベース経験値を付与
                            const damageExp = this._calculateDamageExperience(actualDamage, enemy.type);
                            if (damageExp > 0) {
                                this.game.levelSystem.addExperience(damageExp);
                                console.log('PhysicsSystem: damage-based experience granted', {
                                    damage: actualDamage,
                                    enemyType: enemy.type,
                                    experience: damageExp
                                });
                            }
                            
                            // ヒットエフェクト
                            this.game.particleSystem.createHitEffect(bullet.x, bullet.y, '#ff6b6b');
                        }
                        
                        // 多段階貫通処理
                        let shouldPierce = false;
                        
                        // 従来の確実貫通（最優先）
                        if (bullet.piercing && bullet.piercingLeft > 0) {
                            bullet.piercingLeft--;
                            shouldPierce = true;
                            console.log('PhysicsSystem: Legacy piercing', {
                                remaining: bullet.piercingLeft
                            });
                        }
                        // 新多段階貫通システム
                        else if (bullet.piercesRemaining > 0) {
                            // 確定貫通
                            bullet.piercesRemaining--;
                            shouldPierce = true;
                            console.log('PhysicsSystem: Guaranteed piercing', {
                                remaining: bullet.piercesRemaining
                            });
                        }
                        else if (bullet.bonusPierceChance > 0 && Math.random() * 100 < bullet.bonusPierceChance) {
                            // ボーナス確率貫通（1回のみ）
                            shouldPierce = true;
                            bullet.bonusPierceChance = 0; // 1回限りの確率判定
                            console.log('PhysicsSystem: Bonus pierce success', {
                                chance: bullet.bonusPierceChance
                            });
                        }
                        
                        if (shouldPierce) {
                            hit = false; // 弾丸は削除しない
                        } else {
                            this.game.bulletSystem.removeBullet(bullet);
                            hit = true;
                        }
                        break;
                    }
                }
                if (hit) continue;
            }
        }
    }
    
    /**
     * アイテム物理処理（PickupSystemに移行）
     * @private
     */
    updatePickupPhysics(deltaTime) {
        // アイテム物理処理はPickupSystem.update()で処理
        // レガシーサポートのため空メソッドを保持
    }
    
    /**
     * ダメージベース経験値計算
     * @param {number} damage - 実際に与えたダメージ量
     * @param {string} enemyType - 敵のタイプ
     * @returns {number} 付与する経験値
     * @private
     */
    _calculateDamageExperience(damage, enemyType = 'normal') {
        // 基本経験値レート（ダメージ1あたりの経験値）
        const baseRate = 0.3;
        
        // 敵タイプ別の経験値倍率
        const typeMultiplier = {
            normal: 1.0,
            fast: 1.2,      // 素早い敵は高経験値
            shooter: 1.5,   // 射撃敵は高経験値
            tank: 0.8,      // タンク敵は低経験値（大量HP）
            boss: 2.0       // ボスは最高経験値
        };
        
        const multiplier = typeMultiplier[enemyType] || 1.0;
        const experience = Math.floor(damage * baseRate * multiplier);
        
        return Math.max(1, experience); // 最低1経験値は保証
    }
}