/**
 * EnemySystem - 敵管理システム
 * 敵スポーン・AI・行動パターン・ボス管理の一元管理
 */
import { Enemy } from '../entities/enemy.js';
import { TutorialConfig } from '../config/tutorial.js';

export class EnemySystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // 敵スポーン管理
        this.enemySpawnTimer = 0;
        this.bossActive = false;
        
        // デバッグ用統計
        this.stats = {
            enemiesSpawned: 0,
            enemiesKilled: 0,
            pickupCalls: 0
        };
        
        console.log('EnemySystem: 敵システム初期化完了');
    }
    
    /**
     * 敵システム更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        this.handleEnemySpawning(deltaTime);
        this.updateAllEnemies(deltaTime);
        this.cleanupDeadEnemies();
    }
    
    /**
     * 敵スポーン処理
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    handleEnemySpawning(deltaTime) {
        // 通常敵スポーン（StageSystem統合）
        this.enemySpawnTimer += deltaTime * 1000;
        
        // 🔄 段階的移行: フォールバック機能付きスポーン率計算
        let spawnRate;
        
        if (this.game.stageSystem && this.game.stageSystem.isSystemReady()) {
            const stageInfo = this.game.stageSystem.getStageInfo();
            // ステージベースのスポーン率: より細かい調整
            spawnRate = Math.max(500 - stageInfo.stage * 30 - stageInfo.wave * 15, 50);
            
            console.log('EnemySystem: Stage-based spawn rate', {
                stage: stageInfo.stage,
                wave: stageInfo.wave,
                spawnRate: spawnRate,
                legacyRate: Math.max(500 - this.game.stats.wave * 50, 100)
            });
        } else {
            // フォールバック: 既存ロジック
            spawnRate = Math.max(500 - this.game.stats.wave * 50, 100);
        }
        
        if (this.enemySpawnTimer > spawnRate) {
            // チュートリアル: 敵スポーン上限チェック
            const currentStage = this.game.stageSystem ? this.game.stageSystem.getStageInfo().stage : 1;
            const spawnLimit = TutorialConfig.getEnemySpawnLimit(currentStage);
            
            if (spawnLimit > 0 && this.game.enemies.length >= spawnLimit) {
                // スポーン上限に達している場合はスポーン停止
                console.log('EnemySystem: Spawn limit reached', {
                    currentEnemies: this.game.enemies.length,
                    limit: spawnLimit,
                    stage: currentStage
                });
                return;
            }
            
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // ボススポーン（StageSystem統合）
        let shouldSpawnBoss = false;
        
        if (this.game.stageSystem && this.game.stageSystem.isSystemReady()) {
            const stageInfo = this.game.stageSystem.getStageInfo();
            shouldSpawnBoss = stageInfo.shouldSpawnBoss && stageInfo.isStageEnd;
        } else {
            // フォールバック: 既存タイミング
            shouldSpawnBoss = this.game.waveTimer > 29000;
        }
        
        if (shouldSpawnBoss && !this.bossActive) {
            this.spawnBoss();
            this.bossActive = true;
            
            if (this.game.stageSystem) {
                console.log('EnemySystem: Boss spawned at stage end', this.game.stageSystem.getStageInfo());
            }
        }
    }
    
    /**
     * 全敵の更新処理
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    updateAllEnemies(deltaTime) {
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            
            // 敵タイプ別の行動パターン
            this.updateEnemyBehavior(enemy, deltaTime);
        }
    }
    
    /**
     * 死亡した敵の削除処理（Enemyクラス対応）
     * @private
     */
    cleanupDeadEnemies() {
        let deadEnemiesFound = 0;
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            const isDead = enemy.isDead ? enemy.isDead() : (enemy.health <= 0);
            
            if (isDead) {
                deadEnemiesFound++;
                console.log('EnemySystem: dead enemy found', {
                    index: i,
                    enemyType: enemy.type,
                    health: enemy.health,
                    hasIsDeadMethod: !!enemy.isDead
                });
                this.killEnemy(i);
            }
        }
        
        if (deadEnemiesFound > 0) {
            console.log(`EnemySystem: cleaned up ${deadEnemiesFound} dead enemies`);
        }
    }
    
    /**
     * 敵をスポーン
     */
    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // 上
                x = Math.random() * this.game.baseWidth;
                y = -50;
                break;
            case 1: // 右
                x = this.game.baseWidth + 50;
                y = Math.random() * this.game.baseHeight;
                break;
            case 2: // 下
                x = Math.random() * this.game.baseWidth;
                y = this.game.baseHeight + 50;
                break;
            case 3: // 左
                x = -50;
                y = Math.random() * this.game.baseHeight;
                break;
        }
        
        // 敵タイプを決定（確率に基づく）
        const enemyType = this.getRandomEnemyType();
        const enemy = this.createEnemyByType(enemyType, x, y);
        
        this.game.enemies.push(enemy);
        this.stats.enemiesSpawned++;
        console.log(`EnemySystem: enemy spawned (total: ${this.stats.enemiesSpawned})`);
    }
    
    /**
     * ランダム敵タイプ選択
     * @returns {string} 敵タイプ
     */
    getRandomEnemyType() {
        const currentStage = this.game.stageSystem ? this.game.stageSystem.getStageInfo().stage : 1;
        const currentWave = this.game.stats.wave;
        
        // チュートリアル: 許可される敵タイプ制限
        const allowedTypes = TutorialConfig.getAllowedEnemyTypes(currentStage, currentWave);
        
        if (allowedTypes) {
            // チュートリアルステージ: 制限された敵タイプから選択
            const rand = Math.random();
            const selectedType = allowedTypes[Math.floor(rand * allowedTypes.length)];
            
            console.log(`EnemySystem: Tutorial enemy type '${selectedType}' from allowed types`, {
                allowedTypes,
                stage: currentStage,
                wave: currentWave
            });
            
            return selectedType;
        }
        
        // 通常ステージ: 既存ロジック
        const rand = Math.random();
        const waveMultiplier = Math.min(this.game.stats.wave, 10);
        
        let selectedType;
        if (rand < 0.6) {
            selectedType = 'normal';
        } else if (rand < 0.8 && waveMultiplier >= 2) {
            selectedType = 'fast';
        } else if (rand < 0.95 && waveMultiplier >= 3) {
            selectedType = 'tank';
        } else if (waveMultiplier >= 5) {
            selectedType = 'shooter';
        } else {
            selectedType = 'normal';
        }
        
        console.log(`EnemySystem: Standard enemy type '${selectedType}' (rand: ${rand}, wave: ${waveMultiplier})`);
        return selectedType;
    }
    
    /**
     * タイプ別敵作成（Enemyクラス使用）
     * @param {string} type - 敵タイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Enemy} 敵インスタンス
     */
    createEnemyByType(type, x, y) {
        const wave = this.game.stats.wave;
        console.log(`EnemySystem: creating enemy type ${type} at (${x}, ${y}) for wave ${wave}`);
        
        let enemy;
        switch (type) {
            case 'fast':
                enemy = Enemy.createFastEnemy(x, y, wave);
                break;
            case 'tank':
                enemy = Enemy.createTankEnemy(x, y, wave);
                break;
            case 'shooter':
                enemy = Enemy.createShooterEnemy(x, y, wave);
                break;
            case 'boss':
                enemy = Enemy.createBossEnemy(x, y, wave);
                break;
            default: // normal
                enemy = Enemy.createNormalEnemy(x, y, wave);
                break;
        }
        
        console.log(`EnemySystem: created enemy`, {
            type: enemy.type,
            hasIsDeadMethod: !!enemy.isDead,
            hasUpdateMethod: !!enemy.update,
            x: enemy.x,
            y: enemy.y
        });
        
        return enemy;
    }
    
    /**
     * ボススポーン（Enemyクラス使用）
     */
    spawnBoss() {
        // ボスを画面中央上部からスポーン
        const x = this.game.baseWidth / 2;
        const y = -100;
        
        const boss = Enemy.createBossEnemy(x, y, this.game.stats.wave);
        this.game.enemies.push(boss);
    }
    
    /**
     * 敵の行動パターン更新（Enemyクラス統合）
     * @param {Enemy} enemy - 敵インスタンス
     * @param {number} deltaTime - フレーム時間
     */
    updateEnemyBehavior(enemy, deltaTime) {
        if (enemy.update) {
            // 新しいEnemyクラスの場合
            enemy.update(deltaTime, this.game);
        } else {
            // レガシー敵オブジェクトの場合（後方互換性）
            const dx = this.game.player.x - enemy.x;
            const dy = this.game.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            switch (enemy.type) {
                case 'fast':
                    this._updateFastEnemyBehavior(enemy, deltaTime, dx, dy, distance);
                    break;
                    
                case 'tank':
                    this._updateTankEnemyBehavior(enemy, deltaTime, dx, dy, distance);
                    break;
                    
                case 'shooter':
                    this._updateShooterEnemyBehavior(enemy, deltaTime, dx, dy, distance);
                    break;
                    
                case 'boss':
                    this._updateBossBehavior(enemy, deltaTime, distance, dx, dy);
                    break;
                    
                default: // normal
                    this._updateNormalEnemyBehavior(enemy, deltaTime, dx, dy, distance);
                    break;
            }
        }
    }
    
    /**
     * 高速敵の行動パターン
     * @private
     */
    _updateFastEnemyBehavior(enemy, deltaTime, dx, dy, distance) {
        // 高速で直進
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * deltaTime;
            enemy.y += (dy / distance) * enemy.speed * deltaTime;
        }
    }
    
    /**
     * タンク敵の行動パターン
     * @private
     */
    _updateTankEnemyBehavior(enemy, deltaTime, dx, dy, distance) {
        // ゆっくりと確実に追跡
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * deltaTime;
            enemy.y += (dy / distance) * enemy.speed * deltaTime;
        }
    }
    
    /**
     * シューター敵の行動パターン
     * @private
     */
    _updateShooterEnemyBehavior(enemy, deltaTime, dx, dy, distance) {
        // 中距離を保ちながら射撃
        if (distance > 200) {
            enemy.x += (dx / distance) * enemy.speed * deltaTime;
            enemy.y += (dy / distance) * enemy.speed * deltaTime;
        } else if (distance < 150) {
            enemy.x -= (dx / distance) * enemy.speed * deltaTime * 0.5;
            enemy.y -= (dy / distance) * enemy.speed * deltaTime * 0.5;
        }
        
        // 射撃
        if (Date.now() - enemy.lastShot > enemy.shootRate && distance < 300) {
            this.enemyShoot(enemy);
            enemy.lastShot = Date.now();
        }
    }
    
    /**
     * 通常敵の行動パターン
     * @private
     */
    _updateNormalEnemyBehavior(enemy, deltaTime, dx, dy, distance) {
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed * deltaTime;
            enemy.y += (dy / distance) * enemy.speed * deltaTime;
        }
    }
    
    /**
     * ボスの行動パターン
     * @private
     */
    _updateBossBehavior(boss, deltaTime, distance, dx, dy) {
        // フェーズ管理
        const healthPercentage = boss.health / boss.maxHealth;
        if (healthPercentage < 0.5 && boss.phase === 1) {
            boss.phase = 2;
            boss.speed *= 1.5;
            boss.shootRate *= 0.7;
        }
        
        // 移動パターン
        if (distance > 100) {
            boss.x += (dx / distance) * boss.speed * deltaTime;
            boss.y += (dy / distance) * boss.speed * deltaTime;
        } else {
            // 円運動
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            boss.x += Math.cos(angle) * boss.speed * deltaTime;
            boss.y += Math.sin(angle) * boss.speed * deltaTime;
        }
        
        // 通常射撃
        if (Date.now() - boss.lastShot > boss.shootRate) {
            this.bossShoot(boss);
            boss.lastShot = Date.now();
        }
        
        // 特殊攻撃
        boss.specialAttackTimer += deltaTime * 1000;
        if (boss.specialAttackTimer > boss.specialAttackRate) {
            this.bossSpecialAttack(boss);
            boss.specialAttackTimer = 0;
        }
    }
    
    /**
     * 敵の射撃
     * @param {Object} enemy - 射撃する敵
     */
    enemyShoot(enemy) {
        const dx = this.game.player.x - enemy.x;
        const dy = this.game.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.game.bulletSystem.addEnemyBullet(
                enemy.x,
                enemy.y,
                (dx / distance) * 300,
                (dy / distance) * 300,
                {
                    damage: enemy.damage * 0.6,
                    range: 400,
                    size: 6
                }
            );
        }
    }
    
    /**
     * ボスの射撃
     * @param {Object} boss - ボス
     */
    bossShoot(boss) {
        const angles = boss.phase === 1 ? [0, Math.PI * 0.5, Math.PI, Math.PI * 1.5] : 
                       [0, Math.PI * 0.25, Math.PI * 0.5, Math.PI * 0.75, Math.PI, Math.PI * 1.25, Math.PI * 1.5, Math.PI * 1.75];
        
        angles.forEach(angle => {
            this.game.bulletSystem.addBossBullet(
                boss.x,
                boss.y,
                Math.cos(angle) * 250,
                Math.sin(angle) * 250,
                {
                    damage: boss.damage * 0.8,
                    range: 500,
                    size: 8
                }
            );
        });
    }
    
    /**
     * ボスの特殊攻撃
     * @param {Object} boss - ボス
     */
    bossSpecialAttack(boss) {
        // プレイヤーに向けた高速弾
        const dx = this.game.player.x - boss.x;
        const dy = this.game.player.y - boss.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.game.bulletSystem.addBossBullet(
                boss.x,
                boss.y,
                (dx / distance) * 500,
                (dy / distance) * 500,
                {
                    damage: boss.damage * 1.5,
                    range: 600,
                    size: 12
                }
            );
        }
    }
    
    /**
     * 敵を削除
     * @param {number} index - 敵のインデックス
     */
    killEnemy(index) {
        const enemy = this.game.enemies[index];
        console.log('EnemySystem: killEnemy called', {
            index,
            enemyType: enemy.type,
            enemyX: enemy.x,
            enemyY: enemy.y,
            totalEnemies: this.game.enemies.length
        });
        
        // 敵撃破音再生
        if (this.game.audioSystem.sounds.enemyKill) {
            this.game.audioSystem.sounds.enemyKill();
        }
        
        if (enemy.type === 'boss') {
            this.bossActive = false; // ボス撃破でフラグリセット
            
            // ボス撃破報酬
            this.game.stats.score += 500;
            // ボス撃破ボーナス経験値（従来の50%）
            const bossKillBonus = Math.floor(100 * 0.5);
            this.game.levelSystem.addExperience(bossKillBonus);
            console.log('EnemySystem: boss kill bonus experience', bossKillBonus);
            
            // ボス撃破爆発エフェクト
            this.game.particleSystem.createExplosion(enemy.x, enemy.y, 15, '#ff6b6b', 400, 1000);
        } else {
            // 通常敵撃破処理
            this.game.stats.score += enemy.type === 'tank' ? 30 : enemy.type === 'fast' ? 20 : 10;
            
            // 撃破ボーナス経験値（従来の50%に調整）
            const baseExpGain = this.game.levelSystem.getExperienceForEnemy(enemy.type);
            const killBonus = Math.floor(baseExpGain * 0.5);
            this.game.levelSystem.addExperience(killBonus);
            console.log('EnemySystem: kill bonus experience', {
                enemyType: enemy.type,
                baseExp: baseExpGain,
                killBonus: killBonus
            });
            
            // 撃破エフェクト
            this.game.particleSystem.createHitEffect(enemy.x, enemy.y, '#ff6b6b');
        }
        
        // アイテムドロップ判定（PickupSystemで統一処理）
        console.log('EnemySystem: calling createPickupsFromEnemy');
        this.stats.pickupCalls++;
        this.game.pickupSystem.createPickupsFromEnemy(enemy);
        
        // コンボ処理
        this.game.combo.count++;
        this.game.combo.lastKillTime = Date.now();
        
        // 敵を配列から削除
        this.game.enemies.splice(index, 1);
        
        // 撃破数更新
        this.game.stats.enemiesKilled++;
        this.stats.enemiesKilled++;
        
        console.log('EnemySystem: enemy killed, remaining enemies:', this.game.enemies.length);
        console.log(`EnemySystem stats - spawned: ${this.stats.enemiesSpawned}, killed: ${this.stats.enemiesKilled}, pickupCalls: ${this.stats.pickupCalls}`);
    }
    
    
    /**
     * ボス状態リセット（新ウェーブ時）
     */
    resetBossState() {
        this.bossActive = false;
    }
    
    /**
     * 敵システムの状態取得（デバッグ用）
     * @returns {Object} 敵システムの状態
     */
    getEnemySystemState() {
        return {
            enemySpawnTimer: this.enemySpawnTimer,
            bossActive: this.bossActive,
            enemyCount: this.game.enemies.length,
            enemies: this.game.enemies
        };
    }
}