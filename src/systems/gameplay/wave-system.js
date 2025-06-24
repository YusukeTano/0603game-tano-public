/**
 * WaveSystem - 999ウェーブシステム
 * 時間ベースを廃止し、全敵撃破による次ウェーブ移行システム
 * 3段階成長カーブによる大量敵戦闘対応
 */
export class WaveSystem {
    constructor(game) {
        this.game = game;
        
        // ウェーブ状態
        this.currentWave = 1;
        this.maxWave = 999;
        this.isWaveClearing = false;
        this.waveCompleteEffectDuration = 3000; // 3秒間の演出
        this.waveCompleteTimer = 0;
        
        // 敵管理
        this.currentWaveEnemies = [];
        this.totalEnemiesInWave = 0;
        this.remainingEnemies = 0;
        this.waveStarted = false;
        
        // リザーブシステム管理
        this.waveComposition = null; // 現在ウェーブの構成情報
        this.reserveQueue = []; // 待機中の敵リスト
        this.killedEnemies = 0; // 撃破した敵数
        this.activeEnemies = 0; // 現在アクティブな敵数
        this.maxActiveEnemies = 200; // 同時表示上限
        
        // システム設定
        this.enabled = false; // デフォルトは無効（移行フラグで制御）
        this.legacyMode = true; // 既存システムとの互換性
        this.isReady = false;
        
        // 敵構成パターン設定
        this.enemyPatterns = {
            normal: 0.5,    // 通常敵の基本比率
            fast: 0.25,     // 高速敵の比率
            tank: 0.15,     // タンク敵の比率
            shooter: 0.1    // 射撃敵の比率
        };
        
        console.log('WaveSystem: 999ウェーブシステム初期化完了');
        this.isReady = true;
    }
    
    /**
     * 湧き出し方式: ウェーブ番号 = 総撃破敵数
     * @param {number} wave - ウェーブ番号 (1-999)
     * @returns {Object} ウェーブ構成情報
     */
    calculateEnemyCount(wave) {
        // Wave番号 = 総撃破敵数
        const totalEnemies = wave;
        
        // 画面表示上限: 200体
        const maxActiveEnemies = 200;
        
        // 初期表示敵数（200体まで）
        const initialEnemies = Math.min(totalEnemies, maxActiveEnemies);
        
        // リザーブ敵数（200体を超える分）
        const reserveEnemies = Math.max(0, totalEnemies - maxActiveEnemies);
        
        return {
            total: totalEnemies,        // 総撃破目標数
            initial: initialEnemies,    // 初期表示敵数
            reserve: reserveEnemies,    // リザーブ敵数
            maxActive: maxActiveEnemies // 同時表示上限
        };
    }
    
    /**
     * 従来互換用: 敵数のみ返却
     * @param {number} wave - ウェーブ番号
     * @returns {number} 初期敵数
     */
    getInitialEnemyCount(wave) {
        const composition = this.calculateEnemyCount(wave);
        return composition.initial;
    }
    
    /**
     * ウェーブ別敵構成パターン取得
     * @param {number} wave - ウェーブ番号
     * @returns {Object} 敵種別の比率
     */
    getEnemyComposition(wave) {
        // 10ウェーブごとのボス出現チェック
        const isBossWave = this.isBossWave(wave);
        const bossCount = this.calculateBossCount(wave);
        
        let baseComposition;
        
        if (wave <= 10) {
            // 初級者ゾーン: シンプルな構成
            baseComposition = {
                normal: 0.7,
                fast: 0.2,
                tank: 0.1,
                shooter: 0.0
            };
        } else if (wave <= 50) {
            // 成長期: Shooter追加
            baseComposition = {
                normal: 0.5,
                fast: 0.25,
                tank: 0.15,
                shooter: 0.1
            };
        } else if (wave <= 100) {
            // 加速期: バランス型
            baseComposition = {
                normal: 0.4,
                fast: 0.25,
                tank: 0.2,
                shooter: 0.15
            };
        } else if (wave <= 300) {
            // 本格期: 複雑な構成
            baseComposition = {
                normal: 0.3,
                fast: 0.25,
                tank: 0.25,
                shooter: 0.2
            };
        } else {
            // 究極期: ボス混合（通常ボス＋10ウェーブボス）
            baseComposition = {
                normal: 0.25,
                fast: 0.25,
                tank: 0.25,
                shooter: 0.2,
                boss: 0.05
            };
        }
        
        // ボスウェーブの場合は構成を調整
        if (isBossWave) {
            return this.adjustCompositionForBoss(baseComposition, bossCount, wave);
        }
        
        return baseComposition;
    }
    
    /**
     * ボスウェーブ判定
     * @param {number} wave - ウェーブ番号
     * @returns {boolean} ボスウェーブかどうか
     */
    isBossWave(wave) {
        return wave % 10 === 0;
    }
    
    /**
     * ウェーブごとのボス数計算
     * @param {number} wave - ウェーブ番号
     * @returns {number} ボス数
     */
    calculateBossCount(wave) {
        if (!this.isBossWave(wave)) {
            return 0;
        }
        
        // 段階的ボス数増加システム
        if (wave <= 50) {
            return 1; // Wave 10, 20, 30, 40, 50: 1体
        } else if (wave <= 100) {
            return 2; // Wave 60, 70, 80, 90, 100: 2体
        } else if (wave <= 200) {
            return 3; // Wave 110, 120, ..., 200: 3体
        } else if (wave <= 500) {
            return Math.min(5, Math.floor(wave / 50)); // Wave 250+: 最大5体
        } else {
            return Math.min(10, Math.floor(wave / 100)); // Wave 500+: 最大10体
        }
    }
    
    /**
     * ボス用構成調整
     * @param {Object} baseComposition - 基本構成
     * @param {number} bossCount - ボス数
     * @param {number} wave - ウェーブ番号
     * @returns {Object} 調整後構成
     */
    adjustCompositionForBoss(baseComposition, bossCount, wave) {
        // ボス数から比率を計算
        const totalEnemies = wave;
        const bossRatio = Math.min(0.3, bossCount / totalEnemies); // ボス比率上限30%
        
        // 他の敵の比率を調整（ボス分を差し引く）
        const remainingRatio = 1 - bossRatio;
        const adjustedComposition = {};
        
        // 基本構成の比率を調整
        Object.keys(baseComposition).forEach(enemyType => {
            if (enemyType !== 'boss') {
                adjustedComposition[enemyType] = baseComposition[enemyType] * remainingRatio;
            }
        });
        
        // ボス比率を追加
        adjustedComposition.boss = bossRatio;
        
        console.log(`WaveSystem: Boss wave ${wave} composition`, {
            bossCount: bossCount,
            bossRatio: bossRatio,
            totalEnemies: totalEnemies,
            composition: adjustedComposition
        });
        
        return adjustedComposition;
    }
    
    /**
     * システム更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        if (!this.enabled || this.legacyMode) {
            return; // 無効化時または互換モード時はスキップ
        }
        
        // ウェーブクリア演出中の処理
        if (this.isWaveClearing) {
            this.updateWaveClearEffect(deltaTime);
            return;
        }
        
        // ウェーブ開始処理
        if (!this.waveStarted) {
            this.startWave();
            return;
        }
        
        // 敵残数チェック
        this.checkWaveCompletion();
    }
    
    /**
     * ウェーブ開始処理
     */
    startWave() {
        console.log(`WaveSystem: Starting Wave ${this.currentWave}`);
        
        // 敵構成計算（新リザーブ方式）
        this.waveComposition = this.calculateEnemyCount(this.currentWave);
        this.totalEnemiesInWave = this.waveComposition.total;
        this.remainingEnemies = this.totalEnemiesInWave;
        
        // 統計更新
        this.game.stats.enemiesThisWave = this.totalEnemiesInWave;
        
        // リザーブシステム初期化
        this.initializeReserveSystem();
        
        // 敵構成取得
        const composition = this.getEnemyComposition(this.currentWave);
        
        // 初期敵スポーン（リザーブ方式）
        this.spawnInitialEnemies(composition);
        
        this.waveStarted = true;
        
        // UI更新通知
        if (this.game.uiSystem) {
            this.game.uiSystem.onWaveStart(this.currentWave, this.totalEnemiesInWave);
        }
        
        console.log(`WaveSystem: Wave ${this.currentWave} started`, {
            total: this.waveComposition.total,
            initial: this.waveComposition.initial,
            reserve: this.waveComposition.reserve,
            maxActive: this.waveComposition.maxActive
        });
    }
    
    /**
     * リザーブシステム初期化
     */
    initializeReserveSystem() {
        // リザーブ管理状態をリセット
        this.reserveQueue = [];
        this.killedEnemies = 0;
        this.activeEnemies = 0;
        
        console.log('WaveSystem: Reserve system initialized');
    }
    
    /**
     * 初期敵スポーン（リザーブ方式）
     * @param {Object} composition - 敵構成比率
     */
    spawnInitialEnemies(composition) {
        if (!this.game.enemySystem) {
            console.error('WaveSystem: EnemySystem not found');
            return;
        }
        
        // 総敵構成を計算
        const totalEnemyCounts = this.calculateEnemyComposition(composition, this.waveComposition.total);
        
        // 初期敵とリザーブ敵に分割
        const initialEnemyCounts = this.calculateEnemyComposition(composition, this.waveComposition.initial);
        
        // リザーブキューを作成
        this.createReserveQueue(totalEnemyCounts, initialEnemyCounts);
        
        // 初期敵をスポーン
        this.game.enemySystem.spawnWaveEnemies(initialEnemyCounts);
        this.activeEnemies = this.waveComposition.initial;
        
        console.log(`WaveSystem: Initial enemies spawned`, {
            initial: initialEnemyCounts,
            reserveCount: this.reserveQueue.length,
            activeEnemies: this.activeEnemies
        });
    }
    
    /**
     * 敵構成数計算ヘルパー
     * @param {Object} composition - 敵構成比率
     * @param {number} totalCount - 総数
     * @returns {Object} 敵種別ごとの数
     */
    calculateEnemyComposition(composition, totalCount) {
        const enemyCounts = {};
        let totalAssigned = 0;
        
        // 各敵種別の数を計算
        Object.keys(composition).forEach(type => {
            const count = Math.floor(totalCount * composition[type]);
            enemyCounts[type] = count;
            totalAssigned += count;
        });
        
        // 端数を通常敵に追加
        if (totalAssigned < totalCount) {
            enemyCounts.normal += (totalCount - totalAssigned);
        }
        
        return enemyCounts;
    }
    
    /**
     * リザーブキュー作成
     * @param {Object} totalCounts - 総敵数
     * @param {Object} initialCounts - 初期敵数
     */
    createReserveQueue(totalCounts, initialCounts) {
        this.reserveQueue = [];
        
        // 各敵種別のリザーブ数を計算
        Object.keys(totalCounts).forEach(enemyType => {
            const totalCount = totalCounts[enemyType] || 0;
            const initialCount = initialCounts[enemyType] || 0;
            const reserveCount = totalCount - initialCount;
            
            // リザーブキューに追加
            for (let i = 0; i < reserveCount; i++) {
                this.reserveQueue.push({
                    type: enemyType,
                    spawnDistance: this.getSpawnDistanceForType(enemyType)
                });
            }
        });
        
        // リザーブキューをシャッフル（多様性確保）
        this.shuffleReserveQueue();
        
        console.log(`WaveSystem: Reserve queue created with ${this.reserveQueue.length} enemies`);
    }
    
    /**
     * 敵種別スポーン距離取得
     * @param {string} enemyType - 敵種別
     * @returns {number} スポーン距離
     */
    getSpawnDistanceForType(enemyType) {
        switch (enemyType) {
            case 'tank':
                return 400; // タンクは近くからスポーン
            case 'boss':
                return 300; // ボスは更に近く
            case 'fast':
                return 700; // 高速敵は遠くから
            case 'shooter':
                return 650; // シューターは中距離から
            default: // normal
                return 600; // 通常敵は標準距離
        }
    }
    
    /**
     * リザーブキューシャッフル
     */
    shuffleReserveQueue() {
        for (let i = this.reserveQueue.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.reserveQueue[i], this.reserveQueue[j]] = [this.reserveQueue[j], this.reserveQueue[i]];
        }
    }
    
    /**
     * ウェーブ敵生成処理（レガシー互換用）
     * @param {Object} composition - 敵構成比率
     */
    spawnWaveEnemies(composition) {
        if (!this.game.enemySystem) {
            console.error('WaveSystem: EnemySystem not found');
            return;
        }
        
        // 敵種別ごとの数を計算
        const enemyCounts = {};
        let totalAssigned = 0;
        
        Object.keys(composition).forEach(type => {
            const count = Math.floor(this.totalEnemiesInWave * composition[type]);
            enemyCounts[type] = count;
            totalAssigned += count;
        });
        
        // 端数を通常敵に追加
        if (totalAssigned < this.totalEnemiesInWave) {
            enemyCounts.normal += (this.totalEnemiesInWave - totalAssigned);
        }
        
        // EnemySystemに敵生成を指示
        this.game.enemySystem.spawnWaveEnemies(enemyCounts);
        
        console.log(`WaveSystem: Spawned enemies:`, enemyCounts);
    }
    
    /**
     * ウェーブ完了チェック
     */
    checkWaveCompletion() {
        if (!this.game.enemySystem) return;
        
        // 現在の敵数を取得
        const currentEnemyCount = this.game.enemySystem.getEnemyCount();
        this.remainingEnemies = currentEnemyCount;
        
        // 全敵撃破でウェーブクリア
        if (currentEnemyCount === 0 && this.waveStarted) {
            this.completeWave();
        }
    }
    
    /**
     * ウェーブクリア処理
     */
    completeWave() {
        console.log(`WaveSystem: Wave ${this.currentWave} completed!`);
        
        // ウェーブクリア演出開始
        this.isWaveClearing = true;
        this.waveCompleteTimer = 0;
        this.waveStarted = false;
        
        // 次ウェーブ準備
        if (this.currentWave < this.maxWave) {
            this.currentWave++;
        } else {
            // 999ウェーブクリア！
            this.onGameComplete();
        }
        
        // UI更新通知
        if (this.game.uiSystem) {
            this.game.uiSystem.onWaveComplete(this.currentWave - 1);
        }
        
        // 音響効果
        if (this.game.audioSystem) {
            this.game.audioSystem.playWaveCompleteSound();
        }
    }
    
    /**
     * ウェーブクリア演出更新
     * @param {number} deltaTime - フレーム時間
     */
    updateWaveClearEffect(deltaTime) {
        this.waveCompleteTimer += deltaTime * 1000;
        
        if (this.waveCompleteTimer >= this.waveCompleteEffectDuration) {
            // 演出終了、次ウェーブ開始
            this.isWaveClearing = false;
            console.log(`WaveSystem: Wave clear effect complete, starting Wave ${this.currentWave}`);
        }
    }
    
    /**
     * ゲーム完全クリア処理
     */
    onGameComplete() {
        console.log('WaveSystem: Congratulations! All 999 waves completed!');
        
        // ゲーム完了状態設定
        this.game.gameState = 'gameComplete';
        
        // UI更新
        if (this.game.uiSystem) {
            this.game.uiSystem.showGameCompleteScreen();
        }
    }
    
    /**
     * 敵撃破通知受信（リザーブシステム対応）
     */
    onEnemyKilled() {
        // リザーブシステム有効時の処理
        if (this.waveComposition && this.reserveQueue.length > 0) {
            this.killedEnemies++;
            this.activeEnemies--;
            
            // リザーブから1体スポーン
            this.spawnReserveEnemy();
            
            console.log(`WaveSystem: Enemy killed with reserve spawn`, {
                killedEnemies: this.killedEnemies,
                activeEnemies: this.activeEnemies,
                reserveRemaining: this.reserveQueue.length,
                totalKillTarget: this.waveComposition.total
            });
        } else {
            // 従来ロジック（リザーブシステム無効時）
            this.killedEnemies++;
            this.activeEnemies = this.game.enemySystem.getEnemyCount();
        }
        
        // UI更新通知
        this.updateUI();
        
        // ウェーブ完了チェック
        this.checkWaveCompletionWithReserve();
    }
    
    /**
     * リザーブ敵スポーン
     */
    spawnReserveEnemy() {
        if (this.reserveQueue.length === 0) {
            console.log('WaveSystem: No reserve enemies available');
            return;
        }
        
        // リザーブキューから次の敵を取得
        const reserveEnemy = this.reserveQueue.shift();
        
        // 敵種別のスポーン距離を使用してスポーン
        this.spawnEnemyFromReserve(reserveEnemy);
        
        this.activeEnemies++;
        
        console.log(`WaveSystem: Reserve enemy spawned`, {
            type: reserveEnemy.type,
            spawnDistance: reserveEnemy.spawnDistance,
            reserveRemaining: this.reserveQueue.length
        });
    }
    
    /**
     * リザーブからの敵スポーン実行
     * @param {Object} reserveEnemy - リザーブ敵情報
     */
    spawnEnemyFromReserve(reserveEnemy) {
        if (!this.game.enemySystem) {
            console.error('WaveSystem: EnemySystem not found for reserve spawn');
            return;
        }
        
        // プレイヤー位置を基準にスポーン位置計算
        const angle = Math.random() * Math.PI * 2;
        const spawnX = this.game.player.x + Math.cos(angle) * reserveEnemy.spawnDistance;
        const spawnY = this.game.player.y + Math.sin(angle) * reserveEnemy.spawnDistance;
        
        // 敵を個別スポーン
        const enemy = this.game.enemySystem.createEnemyByTypeOptimized(
            reserveEnemy.type, 
            spawnX, 
            spawnY
        );
        
        if (enemy) {
            this.game.enemies.push(enemy);
            this.game.enemySystem.stats.enemiesSpawned++;
        }
    }
    
    /**
     * リザーブシステム対応ウェーブ完了チェック
     */
    checkWaveCompletionWithReserve() {
        // リザーブシステム有効時
        if (this.waveComposition) {
            // 撃破目標数に達した場合
            if (this.killedEnemies >= this.waveComposition.total) {
                this.completeWave();
                return;
            }
        } else {
            // 従来のチェック
            this.checkWaveCompletion();
        }
    }
    
    /**
     * UI更新通知
     */
    updateUI() {
        if (this.game.uiSystem) {
            if (this.waveComposition) {
                // リザーブシステム用UI更新
                this.game.uiSystem.updateWaveProgress({
                    active: this.activeEnemies,
                    killed: this.killedEnemies,
                    reserve: this.reserveQueue.length,
                    total: this.waveComposition.total
                });
            } else {
                // 従来UI更新は無効化（新中間エリアシステムを使用）
                // const currentEnemyCount = this.game.enemySystem.getEnemyCount();
                // this.game.uiSystem.updateEnemyCount(currentEnemyCount, this.totalEnemiesInWave);
            }
        }
    }
    
    /**
     * システムリセット
     */
    reset() {
        this.currentWave = 1;
        this.isWaveClearing = false;
        this.waveCompleteTimer = 0;
        this.currentWaveEnemies = [];
        this.totalEnemiesInWave = 0;
        this.remainingEnemies = 0;
        this.waveStarted = false;
        
        // リザーブシステムリセット
        this.waveComposition = null;
        this.reserveQueue = [];
        this.killedEnemies = 0;
        this.activeEnemies = 0;
        
        console.log('WaveSystem: System reset to Wave 1 (including reserve system)');
    }
    
    /**
     * 既存システムとの互換性切り替え
     * @param {boolean} enabled - 新システムを有効にするか
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        this.legacyMode = !enabled;
        
        console.log(`WaveSystem: System ${enabled ? 'enabled' : 'disabled'}, legacy mode: ${this.legacyMode}`);
    }
    
    /**
     * 現在のウェーブ情報取得
     * @returns {Object} ウェーブ情報
     */
    getWaveInfo() {
        const baseInfo = {
            currentWave: this.currentWave,
            maxWave: this.maxWave,
            totalEnemies: this.totalEnemiesInWave,
            remainingEnemies: this.remainingEnemies,
            progress: (this.currentWave - 1) / this.maxWave,
            isClearing: this.isWaveClearing
        };
        
        // リザーブシステム情報追加
        if (this.waveComposition) {
            baseInfo.reserveSystem = {
                composition: this.waveComposition,
                activeEnemies: this.activeEnemies,
                killedEnemies: this.killedEnemies,
                reserveCount: this.reserveQueue.length,
                killProgress: this.killedEnemies / this.waveComposition.total
            };
        }
        
        return baseInfo;
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        const baseDebugInfo = {
            enabled: this.enabled,
            legacyMode: this.legacyMode,
            currentWave: this.currentWave,
            waveStarted: this.waveStarted,
            isClearing: this.isWaveClearing,
            totalEnemies: this.totalEnemiesInWave,
            remainingEnemies: this.remainingEnemies,
            estimatedEnemiesNextWave: this.calculateEnemyCount(this.currentWave + 1)
        };
        
        // リザーブシステムデバッグ情報追加
        if (this.waveComposition) {
            baseDebugInfo.reserveSystem = {
                composition: this.waveComposition,
                activeEnemies: this.activeEnemies,
                killedEnemies: this.killedEnemies,
                reserveQueueLength: this.reserveQueue.length,
                reserveQueueSample: this.reserveQueue.slice(0, 5), // 最初の5体をサンプル表示
                killTargetProgress: `${this.killedEnemies}/${this.waveComposition.total}`,
                systemActive: !!this.waveComposition
            };
        }
        
        return baseDebugInfo;
    }
}