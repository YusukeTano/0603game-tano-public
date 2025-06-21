/**
 * AudioStateManager - Phase 3.2 音響状態制御システム
 * ゲーム状態に連動した動的音響制御・リアルタイム音響調整
 */

export class AudioStateManager {
    constructor(audioManager = null, game = null) {
        this.audioManager = audioManager;
        this.game = game;
        
        // ゲーム状態監視
        this.gameStateWatcher = {
            enabled: true,
            watchInterval: 100,  // 100ms間隔で監視
            watchTimer: null,
            lastState: null,
            stateHistory: []
        };
        
        // 動的音響制御設定
        this.dynamicAudioConfig = {
            // Wave進行による音響変化
            waveProgression: {
                enabled: true,
                stages: {
                    early: { waves: [1, 10], tempo: 1.0, intensity: 0.7 },
                    mid: { waves: [11, 50], tempo: 1.1, intensity: 0.8 },
                    late: { waves: [51, 200], tempo: 1.2, intensity: 0.9 },
                    endgame: { waves: [201, 999], tempo: 1.3, intensity: 1.0 }
                }
            },
            
            // プレイヤー状態による音響変化
            playerState: {
                enabled: true,
                healthThresholds: {
                    critical: { health: 0.2, filter: 'lowpass', intensity: 0.6 },
                    low: { health: 0.4, filter: 'highpass', intensity: 0.8 },
                    normal: { health: 0.6, filter: null, intensity: 1.0 }
                }
            },
            
            // 敵密度による音響変化
            enemyDensity: {
                enabled: true,
                thresholds: {
                    sparse: { count: [0, 10], reverb: 0.2, compression: 0.3 },
                    moderate: { count: [11, 30], reverb: 0.4, compression: 0.5 },
                    dense: { count: [31, 60], reverb: 0.6, compression: 0.7 },
                    overwhelming: { count: [61, 999], reverb: 0.8, compression: 0.9 }
                }
            }
        };
        
        // 現在の音響状態
        this.currentAudioState = {
            waveStage: 'early',
            playerHealthRatio: 1.0,
            enemyCount: 0,
            tempo: 1.0,
            intensity: 0.7,
            activeEffects: [],
            lastUpdate: 0
        };
        
        // リアルタイム調整システム
        this.realtimeAdjustments = {
            tempoSmoothingFactor: 0.1,     // テンポ変化の滑らかさ
            volumeSmoothingFactor: 0.05,   // 音量変化の滑らかさ
            effectTransitionTime: 0.3,     // エフェクト切り替え時間
            updateFrequency: 50            // 更新頻度(ms)
        };
        
        // パフォーマンス監視
        this.performance = {
            updateCount: 0,
            averageUpdateTime: 0,
            maxUpdateTime: 0,
            errors: [],
            lastPerformanceCheck: Date.now()
        };
        
        console.log('🎵 AudioStateManager: 音響状態制御システム初期化');
    }
    
    /**
     * システム開始
     */
    async start() {
        try {
            console.log('🎵 AudioStateManager: 音響状態監視開始');
            
            // ゲーム状態監視開始
            this.startGameStateWatcher();
            
            // リアルタイム音響調整開始
            this.startRealtimeAdjustments();
            
            console.log('✅ AudioStateManager: システム開始完了');
            return { success: true };
            
        } catch (error) {
            console.error('❌ AudioStateManager: システム開始失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * システム停止
     */
    stop() {
        console.log('🛑 AudioStateManager: 音響状態監視停止');
        
        if (this.gameStateWatcher.watchTimer) {
            clearInterval(this.gameStateWatcher.watchTimer);
            this.gameStateWatcher.watchTimer = null;
        }
        
        this.gameStateWatcher.enabled = false;
        console.log('✅ AudioStateManager: システム停止完了');
    }
    
    /**
     * ゲーム状態監視開始
     */
    startGameStateWatcher() {
        this.gameStateWatcher.watchTimer = setInterval(() => {
            if (this.gameStateWatcher.enabled && this.game) {
                this.updateFromGameState();
            }
        }, this.gameStateWatcher.watchInterval);
        
        console.log('👁️ AudioStateManager: ゲーム状態監視開始');
    }
    
    /**
     * リアルタイム音響調整開始
     */
    startRealtimeAdjustments() {
        setInterval(() => {
            this.performRealtimeAdjustments();
        }, this.realtimeAdjustments.updateFrequency);
        
        console.log('🎛️ AudioStateManager: リアルタイム音響調整開始');
    }
    
    /**
     * ゲーム状態から音響状態更新
     */
    updateFromGameState() {
        try {
            const updateStart = Date.now();
            
            // ゲーム状態取得
            const gameState = this.extractGameState();
            
            // 状態変化検出
            if (this.hasStateChanged(gameState)) {
                this.processStateChange(gameState);
            }
            
            // パフォーマンス記録
            const updateTime = Date.now() - updateStart;
            this.recordPerformance(updateTime);
            
        } catch (error) {
            console.error('❌ AudioStateManager: 状態更新エラー:', error);
            this.performance.errors.push({
                error: error.message,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * ゲーム状態抽出
     */
    extractGameState() {
        if (!this.game) return null;
        
        return {
            currentWave: this.game.currentWave || 1,
            playerHealth: this.game.player?.health || 100,
            maxPlayerHealth: this.game.player?.maxHealth || 100,
            enemyCount: this.game.enemies?.length || 0,
            gameState: this.game.gameState || 'menu',
            isPlaying: this.game.gameState === 'playing',
            isPaused: this.game.gameState === 'paused',
            timestamp: Date.now()
        };
    }
    
    /**
     * 状態変化検出
     */
    hasStateChanged(newState) {
        if (!this.gameStateWatcher.lastState || !newState) {
            return true;
        }
        
        const lastState = this.gameStateWatcher.lastState;
        
        return (
            newState.currentWave !== lastState.currentWave ||
            Math.abs(newState.playerHealth - lastState.playerHealth) > 5 ||
            Math.abs(newState.enemyCount - lastState.enemyCount) > 3 ||
            newState.gameState !== lastState.gameState
        );
    }
    
    /**
     * 状態変化処理
     */
    async processStateChange(gameState) {
        try {
            console.log('🔄 AudioStateManager: ゲーム状態変化検出:', gameState);
            
            // Wave進行による音響変化
            await this.updateWaveProgression(gameState.currentWave);
            
            // プレイヤー状態による音響変化
            await this.updatePlayerStateAudio(gameState);
            
            // 敵密度による音響変化
            await this.updateEnemyDensityAudio(gameState.enemyCount);
            
            // 状態履歴更新
            this.updateStateHistory(gameState);
            this.gameStateWatcher.lastState = gameState;
            
        } catch (error) {
            console.error('❌ AudioStateManager: 状態変化処理エラー:', error);
        }
    }
    
    /**
     * Wave進行による音響更新
     */
    async updateWaveProgression(currentWave) {
        const config = this.dynamicAudioConfig.waveProgression;
        if (!config.enabled) return;
        
        let newStage = 'early';
        for (const [stage, data] of Object.entries(config.stages)) {
            if (currentWave >= data.waves[0] && currentWave <= data.waves[1]) {
                newStage = stage;
                break;
            }
        }
        
        if (newStage !== this.currentAudioState.waveStage) {
            console.log(`🌊 AudioStateManager: Wave段階変更 ${this.currentAudioState.waveStage} → ${newStage}`);
            
            const stageConfig = config.stages[newStage];
            this.currentAudioState.waveStage = newStage;
            this.currentAudioState.tempo = stageConfig.tempo;
            this.currentAudioState.intensity = stageConfig.intensity;
            
            // BGMテンポ調整
            await this.adjustBGMTempo(stageConfig.tempo);
            
            // マスター音量調整
            await this.adjustMasterIntensity(stageConfig.intensity);
        }
    }
    
    /**
     * プレイヤー状態による音響更新
     */
    async updatePlayerStateAudio(gameState) {
        const config = this.dynamicAudioConfig.playerState;
        if (!config.enabled) return;
        
        const healthRatio = gameState.playerHealth / gameState.maxPlayerHealth;
        this.currentAudioState.playerHealthRatio = healthRatio;
        
        // 体力閾値による音響エフェクト
        for (const [state, thresholdData] of Object.entries(config.healthThresholds)) {
            if (healthRatio <= thresholdData.health) {
                console.log(`💗 AudioStateManager: プレイヤー状態音響調整 → ${state}`);
                
                if (thresholdData.filter) {
                    await this.applyHealthFilter(thresholdData.filter);
                }
                
                await this.adjustIntensity(thresholdData.intensity);
                break;
            }
        }
    }
    
    /**
     * 敵密度による音響更新
     */
    async updateEnemyDensityAudio(enemyCount) {
        const config = this.dynamicAudioConfig.enemyDensity;
        if (!config.enabled) return;
        
        this.currentAudioState.enemyCount = enemyCount;
        
        // 敵密度による音響調整
        for (const [density, data] of Object.entries(config.thresholds)) {
            if (enemyCount >= data.count[0] && enemyCount <= data.count[1]) {
                console.log(`👾 AudioStateManager: 敵密度音響調整 → ${density} (${enemyCount}体)`);
                
                await this.adjustReverb(data.reverb);
                await this.adjustCompression(data.compression);
                break;
            }
        }
    }
    
    /**
     * リアルタイム音響調整実行
     */
    performRealtimeAdjustments() {
        try {
            // 滑らかなパラメータ変化処理
            this.smoothParameterTransitions();
            
            // 音響システム同期
            this.syncWithAudioSystem();
            
            this.currentAudioState.lastUpdate = Date.now();
            
        } catch (error) {
            console.error('❌ AudioStateManager: リアルタイム調整エラー:', error);
        }
    }
    
    /**
     * 滑らかなパラメータ変化
     */
    smoothParameterTransitions() {
        // テンポの滑らかな変化
        // 音量の滑らかな変化
        // エフェクトの滑らかな遷移
    }
    
    /**
     * 音響システム同期
     */
    syncWithAudioSystem() {
        if (!this.audioManager) return;
        
        // 現在の設定を音響システムに同期
    }
    
    // 音響調整メソッド群
    async adjustBGMTempo(tempo) {
        try {
            if (this.audioManager && typeof this.audioManager.setBGMTempo === 'function') {
                await this.audioManager.setBGMTempo(tempo);
                console.log(`🎵 BGMテンポ調整: ${tempo}`);
            }
        } catch (error) {
            console.error('❌ BGMテンポ調整エラー:', error);
        }
    }
    
    async adjustMasterIntensity(intensity) {
        try {
            if (this.audioManager && typeof this.audioManager.setMasterIntensity === 'function') {
                await this.audioManager.setMasterIntensity(intensity);
                console.log(`🔊 マスター強度調整: ${intensity}`);
            }
        } catch (error) {
            console.error('❌ マスター強度調整エラー:', error);
        }
    }
    
    async applyHealthFilter(filterType) {
        try {
            if (this.audioManager && typeof this.audioManager.applyHealthFilter === 'function') {
                await this.audioManager.applyHealthFilter(filterType);
                console.log(`🎛️ 体力フィルター適用: ${filterType}`);
            }
        } catch (error) {
            console.error('❌ 体力フィルターエラー:', error);
        }
    }
    
    async adjustIntensity(intensity) {
        try {
            if (this.audioManager && typeof this.audioManager.setIntensity === 'function') {
                await this.audioManager.setIntensity(intensity);
                console.log(`🎚️ 強度調整: ${intensity}`);
            }
        } catch (error) {
            console.error('❌ 強度調整エラー:', error);
        }
    }
    
    async adjustReverb(reverbLevel) {
        try {
            if (this.audioManager && typeof this.audioManager.setReverb === 'function') {
                await this.audioManager.setReverb(reverbLevel);
                console.log(`🏛️ リバーブ調整: ${reverbLevel}`);
            }
        } catch (error) {
            console.error('❌ リバーブ調整エラー:', error);
        }
    }
    
    async adjustCompression(compressionLevel) {
        try {
            if (this.audioManager && typeof this.audioManager.setCompression === 'function') {
                await this.audioManager.setCompression(compressionLevel);
                console.log(`🗜️ コンプレッション調整: ${compressionLevel}`);
            }
        } catch (error) {
            console.error('❌ コンプレッション調整エラー:', error);
        }
    }
    
    /**
     * 状態履歴更新
     */
    updateStateHistory(gameState) {
        this.gameStateWatcher.stateHistory.push({
            ...gameState,
            audioState: { ...this.currentAudioState }
        });
        
        // 履歴サイズ制限
        if (this.gameStateWatcher.stateHistory.length > 100) {
            this.gameStateWatcher.stateHistory.shift();
        }
    }
    
    /**
     * パフォーマンス記録
     */
    recordPerformance(updateTime) {
        this.performance.updateCount++;
        this.performance.averageUpdateTime = 
            (this.performance.averageUpdateTime * (this.performance.updateCount - 1) + updateTime) / 
            this.performance.updateCount;
        
        if (updateTime > this.performance.maxUpdateTime) {
            this.performance.maxUpdateTime = updateTime;
        }
    }
    
    /**
     * 現在の音響状態取得
     */
    getCurrentAudioState() {
        return { ...this.currentAudioState };
    }
    
    /**
     * パフォーマンス情報取得
     */
    getPerformanceInfo() {
        return { ...this.performance };
    }
    
    /**
     * 状態履歴取得
     */
    getStateHistory() {
        return [...this.gameStateWatcher.stateHistory];
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            currentState: this.currentAudioState,
            watcherEnabled: this.gameStateWatcher.enabled,
            performance: this.performance,
            config: this.dynamicAudioConfig,
            historyCount: this.gameStateWatcher.stateHistory.length
        };
    }
}