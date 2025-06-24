/**
 * BulletSystem - 弾丸管理システム
 * 全弾丸の生成・更新・削除を一元管理
 */
import { Bullet } from '../entities/bullet.js';

export class BulletSystem {
    constructor(game) {
        this.game = game;
        this.bullets = []; // 弾丸配列をシステム内で管理
        
        console.log('BulletSystem: 弾丸管理システム初期化完了');
    }
    
    /**
     * 🛡️ 弾丸システム更新処理（デバッグログ強化版）
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        const initialBulletCount = this.bullets.length;
        let bulletsRemoved = 0;
        let inactiveBullets = 0;
        
        // 🛡️ フレーム開始時の統計情報
        const frameStats = this.getFrameDebugStats();
        if (frameStats.totalBullets > 0) {
            console.log('📊 BulletSystem: Frame start stats', frameStats);
        }
        
        // 逆順で更新（削除時のインデックス問題回避）
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 🛡️ 非アクティブ弾丸の統計
            if (!bullet.isActiveBullet()) {
                inactiveBullets++;
            }
            
            // 弾丸の更新処理
            const shouldRemove = bullet.update(deltaTime, this.game);
            
            if (shouldRemove) {
                console.log('🗑️ BulletSystem: Bullet removed via update()', {
                    weaponType: bullet.weaponType,
                    reason: 'bullet.update() returned true',
                    age: bullet.age?.toFixed(2) || 'unknown',
                    position: { x: bullet.x.toFixed(1), y: bullet.y.toFixed(1) }
                });
                this.bullets.splice(i, 1);
                bulletsRemoved++;
                continue;
            }
            
            // 画面外チェック
            if (bullet.isOutOfBounds(this.game.baseWidth, this.game.baseHeight)) {
                console.log('🗺️ BulletSystem: Bullet removed (out of bounds)', {
                    weaponType: bullet.weaponType,
                    position: { x: bullet.x.toFixed(1), y: bullet.y.toFixed(1) },
                    bounds: { width: this.game.baseWidth, height: this.game.baseHeight }
                });
                this.bullets.splice(i, 1);
                bulletsRemoved++;
                continue;
            }
        }
        
        // 🛡️ フレーム終了時の統計情報
        if (bulletsRemoved > 0 || inactiveBullets > 0) {
            console.log('📊 BulletSystem: Frame end stats', {
                initial: initialBulletCount,
                final: this.bullets.length,
                removed: bulletsRemoved,
                inactive: inactiveBullets,
                performance: {
                    removalRate: ((bulletsRemoved / Math.max(initialBulletCount, 1)) * 100).toFixed(1) + '%'
                }
            });
        }
    }
    
    /**
     * プレイヤー弾丸を追加
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {Object} weaponConfig - 武器設定
     */
    addPlayerBullet(x, y, vx, vy, weaponConfig) {
        const bullet = Bullet.createPlayerBullet(x, y, vx, vy, weaponConfig);
        this.bullets.push(bullet);
        return bullet;
    }
    
    /**
     * 敵弾丸を追加
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {Object} enemyConfig - 敵設定
     */
    addEnemyBullet(x, y, vx, vy, enemyConfig) {
        const bullet = Bullet.createEnemyBullet(x, y, vx, vy, enemyConfig);
        this.bullets.push(bullet);
        return bullet;
    }
    
    /**
     * ボス弾丸を追加
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X速度
     * @param {number} vy - Y速度
     * @param {Object} bossConfig - ボス設定
     */
    addBossBullet(x, y, vx, vy, bossConfig) {
        const bullet = Bullet.createBossBullet(x, y, vx, vy, bossConfig);
        this.bullets.push(bullet);
        return bullet;
    }
    
    /**
     * 弾丸を直接追加（レガシー互換性用）
     * @param {Object} bulletData - 弾丸データ
     */
    addBullet(bulletData) {
        const bullet = new Bullet(
            bulletData.x,
            bulletData.y,
            bulletData.vx,
            bulletData.vy,
            bulletData
        );
        
        
        this.bullets.push(bullet);
        return bullet;
    }
    
    /**
     * 特定の弾丸を削除
     * @param {Bullet} bulletToRemove - 削除する弾丸
     */
    removeBullet(bulletToRemove) {
        const index = this.bullets.indexOf(bulletToRemove);
        if (index !== -1) {
            this.bullets.splice(index, 1);
        }
    }
    
    /**
     * 弾丸配列を取得
     * @returns {Array} 弾丸配列
     */
    getBullets() {
        return this.bullets;
    }
    
    /**
     * プレイヤー弾丸のみを取得
     * @returns {Array} プレイヤー弾丸配列
     */
    getPlayerBullets() {
        return this.bullets.filter(bullet => !bullet.enemyBullet);
    }
    
    /**
     * 敵弾丸のみを取得
     * @returns {Array} 敵弾丸配列
     */
    getEnemyBullets() {
        return this.bullets.filter(bullet => bullet.enemyBullet);
    }
    
    /**
     * 全弾丸をクリア
     */
    clearAllBullets() {
        this.bullets = [];
    }
    
    /**
     * 特定タイプの弾丸をクリア
     * @param {boolean} enemyOnly - 敵弾丸のみクリアするか
     */
    clearBullets(enemyOnly = false) {
        if (enemyOnly) {
            this.bullets = this.bullets.filter(bullet => !bullet.enemyBullet);
        } else {
            this.clearAllBullets();
        }
    }
    
    /**
     * 弾丸統計を取得
     * @returns {Object} 弾丸統計情報
     */
    getBulletStats() {
        const playerBullets = this.getPlayerBullets();
        const enemyBullets = this.getEnemyBullets();
        
        return {
            total: this.bullets.length,
            player: playerBullets.length,
            enemy: enemyBullets.length,
            weaponTypes: this.getWeaponTypeBreakdown(playerBullets)
        };
    }
    
    /**
     * 武器タイプ別の弾丸数を取得
     * @param {Array} bullets - 弾丸配列
     * @returns {Object} 武器タイプ別統計
     * @private
     */
    getWeaponTypeBreakdown(bullets) {
        const breakdown = {};
        bullets.forEach(bullet => {
            const type = bullet.weaponType || 'unknown';
            breakdown[type] = (breakdown[type] || 0) + 1;
        });
        return breakdown;
    }
    
    /**
     * 範囲内の弾丸を取得
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} radius - 範囲半径
     * @returns {Array} 範囲内の弾丸配列
     */
    getBulletsInRange(x, y, radius) {
        return this.bullets.filter(bullet => {
            const dx = bullet.x - x;
            const dy = bullet.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= radius;
        });
    }
    
    /**
     * 🛡️ 弾丸システムの状態を取得（デバッグ強化版）
     * @returns {Object} システム状態
     */
    getSystemState() {
        const stats = this.getBulletStats();
        const debugStats = this.getFrameDebugStats();
        
        return {
            bulletCount: this.bullets.length,
            stats: stats,
            debugStats: debugStats,
            memoryUsage: this.bullets.length * 200, // 概算メモリ使用量（バイト）
            performance: {
                activeRatio: debugStats.totalBullets > 0 ? 
                    ((debugStats.activeBullets / debugStats.totalBullets) * 100).toFixed(1) + '%' : '0%',
                averageAge: this.calculateAverageBulletAge(),
                oldestBullet: this.getOldestBulletAge()
            }
        };
    }
    
    /**
     * 🛡️ フレームデバッグ統計取得
     * @returns {Object} フレーム統計情報
     */
    getFrameDebugStats() {
        const activeBullets = this.bullets.filter(b => b.isActiveBullet());
        const markedForRemoval = this.bullets.filter(b => b.isMarkedForRemoval);
        const hitThisFrame = this.bullets.filter(b => b.hasHitThisFrame);
        
        return {
            totalBullets: this.bullets.length,
            activeBullets: activeBullets.length,
            markedForRemoval: markedForRemoval.length,
            hitThisFrame: hitThisFrame.length,
            inactiveBullets: this.bullets.length - activeBullets.length,
            weaponBreakdown: this.getActiveWeaponBreakdown(activeBullets)
        };
    }
    
    /**
     * 🛡️ アクティブ武器種別統計
     * @param {Array} activeBullets - アクティブ弾丸配列
     * @returns {Object} 武器種別統計
     */
    getActiveWeaponBreakdown(activeBullets) {
        const breakdown = {};
        activeBullets.forEach(bullet => {
            const type = bullet.weaponType || 'unknown';
            breakdown[type] = (breakdown[type] || 0) + 1;
        });
        return breakdown;
    }
    
    /**
     * 🛡️ 弾丸の平均年齢計算
     * @returns {number} 平均年齢（秒）
     */
    calculateAverageBulletAge() {
        if (this.bullets.length === 0) return 0;
        
        const totalAge = this.bullets.reduce((sum, bullet) => {
            return sum + (bullet.age || 0);
        }, 0);
        
        return (totalAge / this.bullets.length).toFixed(2);
    }
    
    /**
     * 🛡️ 最古弾丸の年齢取得
     * @returns {number} 最古弾丸の年齢（秒）
     */
    getOldestBulletAge() {
        if (this.bullets.length === 0) return 0;
        
        return Math.max(...this.bullets.map(bullet => bullet.age || 0)).toFixed(2);
    }
    
    /**
     * 🛡️ システムデバッグ情報出力
     */
    debugPrint() {
        const systemState = this.getSystemState();
        
        console.log('=== 🛡️ BulletSystem Debug Info ===');
        console.log('Total Bullets:', systemState.bulletCount);
        console.log('Active Bullets:', systemState.debugStats.activeBullets);
        console.log('Marked for Removal:', systemState.debugStats.markedForRemoval);
        console.log('Hit This Frame:', systemState.debugStats.hitThisFrame);
        console.log('Active Ratio:', systemState.performance.activeRatio);
        console.log('Average Age:', systemState.performance.averageAge + 's');
        console.log('Oldest Bullet:', systemState.performance.oldestBullet + 's');
        console.log('Weapon Breakdown:', systemState.debugStats.weaponBreakdown);
        console.log('Memory Usage:', (systemState.memoryUsage / 1024).toFixed(1) + 'KB');
        console.log('================================');
    }
}