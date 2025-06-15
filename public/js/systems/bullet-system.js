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
     * 弾丸システム更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        // 逆順で更新（削除時のインデックス問題回避）
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 弾丸の更新処理
            const shouldRemove = bullet.update(deltaTime, this.game);
            
            if (shouldRemove) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 画面外チェック
            if (bullet.isOutOfBounds(this.game.baseWidth, this.game.baseHeight)) {
                this.bullets.splice(i, 1);
                continue;
            }
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
     * 弾丸システムの状態を取得
     * @returns {Object} システム状態
     */
    getSystemState() {
        return {
            bulletCount: this.bullets.length,
            stats: this.getBulletStats(),
            memoryUsage: this.bullets.length * 200 // 概算メモリ使用量（バイト）
        };
    }
}