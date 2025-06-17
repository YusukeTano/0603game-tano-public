/**
 * EnemyPool - 敵オブジェクトプールシステム
 * 大量敵戦闘時のパフォーマンス最適化
 * オブジェクト生成・削除コストを削減
 */
import { Enemy } from '../entities/enemy.js';

export class EnemyPool {
    constructor() {
        // プール管理
        this.pools = {
            normal: [],
            fast: [],
            tank: [],
            shooter: [],
            boss: []
        };
        
        // プール設定
        this.poolSizes = {
            normal: 100,    // 通常敵は最も多い
            fast: 60,       // 高速敵
            tank: 40,       // タンク敵
            shooter: 40,    // 射撃敵
            boss: 10        // ボス敵
        };
        
        // 統計情報
        this.stats = {
            created: 0,
            reused: 0,
            poolHits: 0,
            poolMisses: 0
        };
        
        console.log('EnemyPool: Object pool system initialized');
        this.initializePools();
    }
    
    /**
     * プール初期化
     * @private
     */
    initializePools() {
        Object.keys(this.poolSizes).forEach(enemyType => {
            const poolSize = this.poolSizes[enemyType];
            
            for (let i = 0; i < poolSize; i++) {
                const enemy = this.createFreshEnemy(enemyType, 0, 0, 1);
                if (enemy) {
                    enemy.isActive = false; // プール内では非アクティブ
                    this.pools[enemyType].push(enemy);
                }
            }
            
            console.log(`EnemyPool: ${enemyType} pool initialized with ${this.pools[enemyType].length} objects`);
        });
    }
    
    /**
     * プールから敵を取得
     * @param {string} enemyType - 敵の種別
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {number} wave - ウェーブ番号
     * @returns {Enemy|null} 敵オブジェクト
     */
    getEnemy(enemyType, x, y, wave) {
        const pool = this.pools[enemyType];
        
        if (!pool) {
            console.warn(`EnemyPool: Unknown enemy type: ${enemyType}`);
            return null;
        }
        
        // プールから非アクティブな敵を探す
        let enemy = pool.find(e => !e.isActive);
        
        if (enemy) {
            // プールヒット - 既存オブジェクトを再利用
            this.stats.reused++;
            this.stats.poolHits++;
            this.reinitializeEnemy(enemy, x, y, wave);
        } else {
            // プールミス - 新しいオブジェクトを作成
            this.stats.created++;
            this.stats.poolMisses++;
            enemy = this.createFreshEnemy(enemyType, x, y, wave);
            
            if (enemy) {
                pool.push(enemy); // プールに追加
            }
        }
        
        if (enemy) {
            enemy.isActive = true;
        }
        
        return enemy;
    }
    
    /**
     * 敵をプールに返却
     * @param {Enemy} enemy - 返却する敵
     */
    returnEnemy(enemy) {
        if (!enemy || !enemy.isActive) {
            return;
        }
        
        // 敵を非アクティブ化（プールに返却）
        enemy.isActive = false;
        
        // 状態リセット（メモリリーク防止）
        this.resetEnemyState(enemy);
    }
    
    /**
     * 新しい敵オブジェクト作成
     * @param {string} enemyType - 敵の種別
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ番号
     * @returns {Enemy|null} 敵オブジェクト
     * @private
     */
    createFreshEnemy(enemyType, x, y, wave) {
        switch (enemyType) {
            case 'normal':
                return Enemy.createNormalEnemy(x, y, wave);
            case 'fast':
                return Enemy.createFastEnemy(x, y, wave);
            case 'tank':
                return Enemy.createTankEnemy(x, y, wave);
            case 'shooter':
                return Enemy.createShooterEnemy(x, y, wave);
            case 'boss':
                return Enemy.createBossEnemy(x, y, wave);
            default:
                console.warn(`EnemyPool: Cannot create enemy type: ${enemyType}`);
                return null;
        }
    }
    
    /**
     * 敵オブジェクトの再初期化
     * @param {Enemy} enemy - 再初期化する敵
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} wave - ウェーブ番号
     * @private
     */
    reinitializeEnemy(enemy, x, y, wave) {
        // 位置設定
        enemy.x = x;
        enemy.y = y;
        
        // ステータス再計算（ウェーブ対応）
        const config = enemy.getEnemyConfig(enemy.type, wave);
        enemy.health = config.health;
        enemy.maxHealth = config.health;
        enemy.speed = config.speed;
        enemy.damage = config.damage;
        
        // 状態リセット
        enemy.isDead = false;
        enemy.stunDuration = 0;
        enemy.slowDuration = 0;
        enemy.lastDamageTime = 0;
        
        // 追加の状態リセット（enemyタイプに応じて）
        if (enemy.type === 'shooter') {
            enemy.shootTimer = 0;
            enemy.lastShootTime = 0;
        }
        
        if (enemy.type === 'boss') {
            enemy.phase = 1;
            enemy.specialAttackTimer = 0;
        }
    }
    
    /**
     * 敵の状態リセット
     * @param {Enemy} enemy - リセットする敵
     * @private
     */
    resetEnemyState(enemy) {
        // 参照のクリア（メモリリーク防止）
        enemy.targetX = 0;
        enemy.targetY = 0;
        
        // 効果のクリア
        enemy.stunDuration = 0;
        enemy.slowDuration = 0;
        enemy.burnDuration = 0;
        
        // タイマーリセット
        enemy.shootTimer = 0;
        enemy.lastShootTime = 0;
        enemy.specialAttackTimer = 0;
        
        // その他の状態
        enemy.isDead = false;
        enemy.lastDamageTime = 0;
    }
    
    /**
     * プール統計情報取得
     * @returns {Object} 統計情報
     */
    getStats() {
        const poolInfo = {};
        Object.keys(this.pools).forEach(type => {
            const pool = this.pools[type];
            const active = pool.filter(e => e.isActive).length;
            const inactive = pool.length - active;
            
            poolInfo[type] = {
                total: pool.length,
                active: active,
                inactive: inactive,
                utilization: ((active / pool.length) * 100).toFixed(1) + '%'
            };
        });
        
        return {
            performance: this.stats,
            pools: poolInfo,
            efficiency: {
                hitRate: ((this.stats.poolHits / (this.stats.poolHits + this.stats.poolMisses)) * 100).toFixed(1) + '%',
                reuseRate: ((this.stats.reused / (this.stats.reused + this.stats.created)) * 100).toFixed(1) + '%'
            }
        };
    }
    
    /**
     * プールサイズ動的調整
     * @param {string} enemyType - 敵の種別
     * @param {number} requestedCount - 要求される数
     */
    adjustPoolSize(enemyType, requestedCount) {
        const pool = this.pools[enemyType];
        if (!pool) return;
        
        const currentSize = pool.length;
        const newSize = Math.max(currentSize, requestedCount * 1.2); // 20%のバッファ
        
        if (newSize > currentSize) {
            const additionalObjects = newSize - currentSize;
            
            for (let i = 0; i < additionalObjects; i++) {
                const enemy = this.createFreshEnemy(enemyType, 0, 0, 1);
                if (enemy) {
                    enemy.isActive = false;
                    pool.push(enemy);
                }
            }
            
            console.log(`EnemyPool: ${enemyType} pool expanded to ${newSize} objects (+${additionalObjects})`);
        }
    }
    
    /**
     * プール全体クリーンアップ
     */
    cleanup() {
        Object.keys(this.pools).forEach(type => {
            this.pools[type].forEach(enemy => {
                if (enemy.isActive) {
                    this.returnEnemy(enemy);
                }
            });
        });
        
        console.log('EnemyPool: All enemies returned to pool');
    }
    
    /**
     * デバッグ情報表示
     */
    debugPrint() {
        const stats = this.getStats();
        console.log('=== EnemyPool Debug Info ===');
        console.log('Performance:', stats.performance);
        console.log('Efficiency:', stats.efficiency);
        console.log('Pool Status:');
        Object.keys(stats.pools).forEach(type => {
            const info = stats.pools[type];
            console.log(`  ${type}: ${info.active}/${info.total} active (${info.utilization})`);
        });
        console.log('===========================');
    }
}