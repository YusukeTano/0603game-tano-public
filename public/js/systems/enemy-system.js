/**
 * EnemySystem - 敵管理システム
 * 敵スポーン・AI・行動パターン・ボス管理の一元管理
 */
export class EnemySystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // 敵スポーン管理
        this.enemySpawnTimer = 0;
        this.bossActive = false;
        
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
        // 通常敵スポーン
        this.enemySpawnTimer += deltaTime * 1000;
        const spawnRate = Math.max(500 - this.game.stats.wave * 50, 100);
        
        if (this.enemySpawnTimer > spawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // ボススポーン（30秒ごとの新ウェーブ開始時）
        if (this.game.waveTimer > 29000 && !this.bossActive) {
            this.spawnBoss();
            this.bossActive = true;
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
     * 死亡した敵の削除処理
     * @private
     */
    cleanupDeadEnemies() {
        for (let i = this.game.enemies.length - 1; i >= 0; i--) {
            const enemy = this.game.enemies[i];
            if (enemy.health <= 0) {
                this.killEnemy(i);
            }
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
    }
    
    /**
     * ランダム敵タイプ選択
     * @returns {string} 敵タイプ
     */
    getRandomEnemyType() {
        const rand = Math.random();
        const waveMultiplier = Math.min(this.game.stats.wave, 10);
        
        if (rand < 0.6) {
            return 'normal';
        } else if (rand < 0.8 && waveMultiplier >= 2) {
            return 'fast';
        } else if (rand < 0.95 && waveMultiplier >= 3) {
            return 'tank';
        } else if (waveMultiplier >= 5) {
            return 'shooter';
        } else {
            return 'normal';
        }
    }
    
    /**
     * タイプ別敵作成
     * @param {string} type - 敵タイプ
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @returns {Object} 敵オブジェクト
     */
    createEnemyByType(type, x, y) {
        const baseHealth = 50 + this.game.stats.wave * 10;
        const baseSpeed = 60 + this.game.stats.wave * 5;
        const baseDamage = 10 + this.game.stats.wave * 2;
        
        switch (type) {
            case 'fast':
                return {
                    x, y, type: 'fast',
                    width: 12, height: 12,
                    health: baseHealth * 0.6,
                    maxHealth: baseHealth * 0.6,
                    speed: baseSpeed * 1.8,
                    damage: baseDamage * 0.7,
                    lastAttack: 0,
                    attackRate: 800,
                    color: '#ff9ff3'
                };
                
            case 'tank':
                return {
                    x, y, type: 'tank',
                    width: 25, height: 25,
                    health: baseHealth * 2.5,
                    maxHealth: baseHealth * 2.5,
                    speed: baseSpeed * 0.4,
                    damage: baseDamage * 1.8,
                    lastAttack: 0,
                    attackRate: 1500,
                    color: '#2f3542'
                };
                
            case 'shooter':
                return {
                    x, y, type: 'shooter',
                    width: 18, height: 18,
                    health: baseHealth * 1.2,
                    maxHealth: baseHealth * 1.2,
                    speed: baseSpeed * 0.7,
                    damage: baseDamage * 0.8,
                    lastAttack: 0,
                    attackRate: 1200,
                    shootRate: 2000,
                    lastShot: 0,
                    color: '#3742fa'
                };
                
            default: // normal
                return {
                    x, y, type: 'normal',
                    width: 15, height: 15,
                    health: baseHealth,
                    maxHealth: baseHealth,
                    speed: baseSpeed,
                    damage: baseDamage,
                    lastAttack: 0,
                    attackRate: 1000,
                    color: '#ff4757'
                };
        }
    }
    
    /**
     * ボススポーン
     */
    spawnBoss() {
        // ボスを画面中央上部からスポーン
        const x = this.game.baseWidth / 2;
        const y = -100;
        
        const boss = {
            x, y, type: 'boss',
            width: 60, height: 60,
            health: 800 + this.game.stats.wave * 200,
            maxHealth: 800 + this.game.stats.wave * 200,
            speed: 40 + this.game.stats.wave * 3,
            damage: 25 + this.game.stats.wave * 5,
            lastAttack: 0,
            attackRate: 1000,
            shootRate: 1500,
            lastShot: 0,
            specialAttackTimer: 0,
            specialAttackRate: 8000,
            phase: 1,
            color: '#8B0000'
        };
        
        this.game.enemies.push(boss);
    }
    
    /**
     * 敵の行動パターン更新
     * @param {Object} enemy - 敵オブジェクト
     * @param {number} deltaTime - フレーム時間
     */
    updateEnemyBehavior(enemy, deltaTime) {
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
            const bullet = {
                x: enemy.x,
                y: enemy.y,
                vx: (dx / distance) * 300,
                vy: (dy / distance) * 300,
                damage: enemy.damage * 0.6,
                range: 400,
                distance: 0,
                enemyBullet: true,
                size: 6
            };
            
            this.game.bullets.push(bullet);
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
            const bullet = {
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 250,
                vy: Math.sin(angle) * 250,
                damage: boss.damage * 0.8,
                range: 500,
                distance: 0,
                enemyBullet: true,
                size: 8
            };
            
            this.game.bullets.push(bullet);
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
            const bullet = {
                x: boss.x,
                y: boss.y,
                vx: (dx / distance) * 500,
                vy: (dy / distance) * 500,
                damage: boss.damage * 1.5,
                range: 600,
                distance: 0,
                enemyBullet: true,
                size: 12
            };
            
            this.game.bullets.push(bullet);
        }
    }
    
    /**
     * 敵を削除
     * @param {number} index - 敵のインデックス
     */
    killEnemy(index) {
        const enemy = this.game.enemies[index];
        
        // 敵撃破音再生
        if (this.game.audioSystem.sounds.enemyKill) {
            this.game.audioSystem.sounds.enemyKill();
        }
        
        if (enemy.type === 'boss') {
            this.bossActive = false; // ボス撃破でフラグリセット
            
            // ボス撃破報酬
            this.game.stats.score += 500;
            this.game.levelSystem.addExperience(100);
            
            // ボス撃破爆発エフェクト
            this.game.particleSystem.createExplosion(enemy.x, enemy.y, 15, '#ff6b6b', 400, 1000);
        } else {
            // 通常敵撃破処理
            this.game.stats.score += enemy.type === 'tank' ? 30 : enemy.type === 'fast' ? 20 : 10;
            const expGain = this.game.levelSystem.getExperienceForEnemy(enemy.type);
            this.game.levelSystem.addExperience(expGain);
            
            // 撃破エフェクト
            this.game.particleSystem.createHitEffect(enemy.x, enemy.y, '#ff6b6b');
        }
        
        // アイテムドロップ判定
        this.handleItemDrop(enemy);
        
        // コンボ処理
        this.game.combo.count++;
        this.game.combo.lastKillTime = Date.now();
        
        // 敵を配列から削除
        this.game.enemies.splice(index, 1);
        
        // 撃破数更新
        this.game.stats.enemiesKilled++;
    }
    
    /**
     * アイテムドロップ処理
     * @param {Object} enemy - 撃破された敵
     * @private
     */
    handleItemDrop(enemy) {
        const dropChance = Math.random();
        
        if (dropChance < 0.15) { // 15%の確率でアイテムドロップ
            let itemType = 'health';
            
            if (dropChance < 0.05) {
                itemType = 'nuke';
            } else if (dropChance < 0.10) {
                itemType = 'speed';
            }
            
            const pickup = {
                x: enemy.x,
                y: enemy.y,
                type: itemType,
                life: 30000 // 30秒で消失
            };
            
            this.game.pickups.push(pickup);
        }
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