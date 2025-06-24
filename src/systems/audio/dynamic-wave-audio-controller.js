/**
 * DynamicWaveAudioController - Phase 3.2 動的Wave音響制御
 * Wave進行に応じたテンポ・キー・音響強度の動的変化システム
 */

export class DynamicWaveAudioController {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        
        // Wave音響進行設定
        this.waveProgressionConfig = {
            // テンポ進行 (BPM)
            tempo: {
                enabled: true,
                baselineBPM: 120,
                stages: {
                    waves_1_10: { bpm: 120, multiplier: 1.0 },      // 序盤: 標準テンポ
                    waves_11_30: { bpm: 130, multiplier: 1.08 },    // 初期加速
                    waves_31_60: { bpm: 140, multiplier: 1.17 },    // 中盤加速
                    waves_61_100: { bpm: 150, multiplier: 1.25 },   // 後半加速
                    waves_101_200: { bpm: 160, multiplier: 1.33 },  // 高速化
                    waves_201_400: { bpm: 170, multiplier: 1.42 },  // 超高速
                    waves_401_700: { bpm: 180, multiplier: 1.5 },   // 極限速度
                    waves_701_999: { bpm: 190, multiplier: 1.58 }   // 最高速度
                }
            },
            
            // キー（音程）進行
            key: {
                enabled: true,
                baseKey: 'C',
                progression: [
                    { waves: [1, 50], key: 'C', mood: 'calm' },
                    { waves: [51, 100], key: 'D', mood: 'rising' },
                    { waves: [101, 200], key: 'E', mood: 'energetic' },
                    { waves: [201, 300], key: 'F', mood: 'intense' },
                    { waves: [301, 500], key: 'G', mood: 'dramatic' },
                    { waves: [501, 700], key: 'A', mood: 'heroic' },
                    { waves: [701, 999], key: 'B', mood: 'climactic' }
                ]
            },
            
            // 音響強度進行
            intensity: {
                enabled: true,
                baseIntensity: 0.7,
                stages: {
                    early: { waves: [1, 50], intensity: 0.7, reverb: 0.2, compression: 0.3 },
                    buildup: { waves: [51, 150], intensity: 0.8, reverb: 0.3, compression: 0.4 },
                    climax: { waves: [151, 300], intensity: 0.9, reverb: 0.4, compression: 0.6 },
                    epic: { waves: [301, 600], intensity: 0.95, reverb: 0.5, compression: 0.7 },
                    legendary: { waves: [601, 999], intensity: 1.0, reverb: 0.6, compression: 0.8 }
                }
            }
        };
        
        // 現在の音響状態
        this.currentWaveAudioState = {
            currentWave: 1,
            currentTempo: 120,
            currentKey: 'C',
            currentIntensity: 0.7,
            currentStage: 'early',
            lastUpdate: 0,
            transitionProgress: 0
        };
        
        // 遷移制御
        this.transitionController = {
            enabled: true,
            tempoTransitionSpeed: 0.02,      // テンポ変化速度
            keyTransitionTime: 2.0,          // キー変化時間(秒)
            intensityTransitionSpeed: 0.01,  // 強度変化速度
            updateInterval: 100              // 更新間隔(ms)
        };
        
        // 遷移タイマー
        this.transitionTimer = null;
        
        // パフォーマンス監視
        this.performance = {
            totalTransitions: 0,
            tempoTransitions: 0,
            keyTransitions: 0,
            intensityTransitions: 0,
            averageTransitionTime: 0,
            errors: []
        };
        
        console.log('🌊 DynamicWaveAudioController: 動的Wave音響制御システム初期化');
    }
    
    /**
     * システム開始
     */
    start() {
        console.log('🌊 DynamicWaveAudioController: 動的音響制御開始');
        
        this.transitionTimer = setInterval(() => {
            this.updateTransitions();
        }, this.transitionController.updateInterval);
        
        console.log('✅ DynamicWaveAudioController: システム開始完了');
    }
    
    /**
     * システム停止
     */
    stop() {
        console.log('🛑 DynamicWaveAudioController: 動的音響制御停止');
        
        if (this.transitionTimer) {
            clearInterval(this.transitionTimer);
            this.transitionTimer = null;
        }
        
        console.log('✅ DynamicWaveAudioController: システム停止完了');
    }
    
    /**
     * Wave変更時の音響更新
     */
    async updateForWave(waveNumber) {
        try {
            console.log(`🌊 DynamicWaveAudioController: Wave ${waveNumber} 音響更新開始`);
            
            const transitionStart = Date.now();
            this.currentWaveAudioState.currentWave = waveNumber;
            
            // テンポ更新
            await this.updateTempo(waveNumber);
            
            // キー更新
            await this.updateKey(waveNumber);
            
            // 強度更新
            await this.updateIntensity(waveNumber);
            
            // 遷移完了
            const transitionTime = Date.now() - transitionStart;
            this.recordTransition(transitionTime);
            
            console.log(`✅ DynamicWaveAudioController: Wave ${waveNumber} 音響更新完了 (${transitionTime}ms)`);
            
            return { success: true, wave: waveNumber, duration: transitionTime };
            
        } catch (error) {
            console.error('❌ DynamicWaveAudioController: Wave音響更新エラー:', error);
            this.performance.errors.push({
                wave: waveNumber,
                error: error.message,
                timestamp: Date.now()
            });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * テンポ更新
     */
    async updateTempo(waveNumber) {
        const config = this.waveProgressionConfig.tempo;
        if (!config.enabled) return;
        
        // 現在のWaveに対応するテンポ段階を特定
        let targetTempo = config.baselineBPM;
        let targetMultiplier = 1.0;
        
        for (const [stage, data] of Object.entries(config.stages)) {
            const [minWave, maxWave] = this.parseWaveRange(stage);
            if (waveNumber >= minWave && waveNumber <= maxWave) {
                targetTempo = data.bpm;
                targetMultiplier = data.multiplier;
                break;
            }
        }
        
        // テンポ変化が必要かチェック
        if (Math.abs(this.currentWaveAudioState.currentTempo - targetTempo) > 1) {
            console.log(`🎵 テンポ変更: ${this.currentWaveAudioState.currentTempo} → ${targetTempo} BPM`);
            
            await this.smoothTempoTransition(targetTempo, targetMultiplier);
            this.performance.tempoTransitions++;
        }
    }
    
    /**
     * キー更新
     */
    async updateKey(waveNumber) {
        const config = this.waveProgressionConfig.key;
        if (!config.enabled) return;
        
        // 現在のWaveに対応するキーを特定
        let targetKey = config.baseKey;
        let targetMood = 'calm';
        
        for (const progression of config.progression) {
            if (waveNumber >= progression.waves[0] && waveNumber <= progression.waves[1]) {
                targetKey = progression.key;
                targetMood = progression.mood;
                break;
            }
        }
        
        // キー変化が必要かチェック
        if (this.currentWaveAudioState.currentKey !== targetKey) {
            console.log(`🎼 キー変更: ${this.currentWaveAudioState.currentKey} → ${targetKey} (${targetMood})`);
            
            await this.smoothKeyTransition(targetKey, targetMood);
            this.performance.keyTransitions++;
        }
    }
    
    /**
     * 強度更新
     */
    async updateIntensity(waveNumber) {
        const config = this.waveProgressionConfig.intensity;
        if (!config.enabled) return;
        
        // 現在のWaveに対応する強度段階を特定
        let targetIntensity = config.baseIntensity;
        let targetStage = 'early';
        let stageConfig = null;
        
        for (const [stage, data] of Object.entries(config.stages)) {
            if (waveNumber >= data.waves[0] && waveNumber <= data.waves[1]) {
                targetIntensity = data.intensity;
                targetStage = stage;
                stageConfig = data;
                break;
            }
        }
        
        // 強度変化が必要かチェック
        if (Math.abs(this.currentWaveAudioState.currentIntensity - targetIntensity) > 0.05 ||
            this.currentWaveAudioState.currentStage !== targetStage) {
            
            console.log(`🔊 強度変更: ${this.currentWaveAudioState.currentStage} → ${targetStage} (${targetIntensity})`);
            
            await this.smoothIntensityTransition(targetIntensity, targetStage, stageConfig);
            this.performance.intensityTransitions++;
        }
    }
    
    /**
     * 滑らかなテンポ遷移
     */
    async smoothTempoTransition(targetTempo, targetMultiplier) {
        const currentTempo = this.currentWaveAudioState.currentTempo;
        const tempoDiff = targetTempo - currentTempo;
        const steps = Math.abs(tempoDiff) / this.transitionController.tempoTransitionSpeed;
        
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            const currentStepTempo = currentTempo + (tempoDiff * progress);
            
            // 音響システムにテンポ適用
            await this.applyTempoToAudioSystem(currentStepTempo, targetMultiplier);
            
            // 少し待機
            await this.delay(50);
        }
        
        // 最終テンポ設定
        this.currentWaveAudioState.currentTempo = targetTempo;
        await this.applyTempoToAudioSystem(targetTempo, targetMultiplier);
    }
    
    /**
     * 滑らかなキー遷移
     */
    async smoothKeyTransition(targetKey, targetMood) {
        try {
            // クロスフェードでキー変更
            await this.applyKeyToAudioSystem(targetKey, targetMood);
            
            // フェード時間待機
            await this.delay(this.transitionController.keyTransitionTime * 1000);
            
            this.currentWaveAudioState.currentKey = targetKey;
            
        } catch (error) {
            console.error('❌ キー遷移エラー:', error);
        }
    }
    
    /**
     * 滑らかな強度遷移
     */
    async smoothIntensityTransition(targetIntensity, targetStage, stageConfig) {
        const currentIntensity = this.currentWaveAudioState.currentIntensity;
        const intensityDiff = targetIntensity - currentIntensity;
        const steps = Math.abs(intensityDiff) / this.transitionController.intensityTransitionSpeed;
        
        for (let i = 0; i < steps; i++) {
            const progress = i / steps;
            const currentStepIntensity = currentIntensity + (intensityDiff * progress);
            
            // 音響システムに強度適用
            await this.applyIntensityToAudioSystem(currentStepIntensity, stageConfig);
            
            // 少し待機
            await this.delay(30);
        }
        
        // 最終強度設定
        this.currentWaveAudioState.currentIntensity = targetIntensity;
        this.currentWaveAudioState.currentStage = targetStage;
        await this.applyIntensityToAudioSystem(targetIntensity, stageConfig);
    }
    
    /**
     * 音響システムへのテンポ適用
     */
    async applyTempoToAudioSystem(tempo, multiplier) {
        try {
            if (this.audioManager) {
                if (typeof this.audioManager.setBGMTempo === 'function') {
                    await this.audioManager.setBGMTempo(tempo);
                }
                if (typeof this.audioManager.setPlaybackRate === 'function') {
                    await this.audioManager.setPlaybackRate(multiplier);
                }
            }
        } catch (error) {
            console.error('❌ テンポ適用エラー:', error);
        }
    }
    
    /**
     * 音響システムへのキー適用
     */
    async applyKeyToAudioSystem(key, mood) {
        try {
            if (this.audioManager) {
                if (typeof this.audioManager.setBGMKey === 'function') {
                    await this.audioManager.setBGMKey(key);
                }
                if (typeof this.audioManager.setBGMMood === 'function') {
                    await this.audioManager.setBGMMood(mood);
                }
            }
        } catch (error) {
            console.error('❌ キー適用エラー:', error);
        }
    }
    
    /**
     * 音響システムへの強度適用
     */
    async applyIntensityToAudioSystem(intensity, stageConfig) {
        try {
            if (this.audioManager && stageConfig) {
                if (typeof this.audioManager.setMasterIntensity === 'function') {
                    await this.audioManager.setMasterIntensity(intensity);
                }
                if (typeof this.audioManager.setReverb === 'function') {
                    await this.audioManager.setReverb(stageConfig.reverb);
                }
                if (typeof this.audioManager.setCompression === 'function') {
                    await this.audioManager.setCompression(stageConfig.compression);
                }
            }
        } catch (error) {
            console.error('❌ 強度適用エラー:', error);
        }
    }
    
    /**
     * 遷移更新処理
     */
    updateTransitions() {
        try {
            this.currentWaveAudioState.lastUpdate = Date.now();
            
            // 遷移進行度更新
            if (this.currentWaveAudioState.transitionProgress < 1.0) {
                this.currentWaveAudioState.transitionProgress += 0.1;
            }
        } catch (error) {
            console.error('❌ 遷移更新エラー:', error);
        }
    }
    
    /**
     * Wave範囲解析
     */
    parseWaveRange(stageString) {
        const match = stageString.match(/waves_(\d+)_(\d+)/);
        if (match) {
            return [parseInt(match[1]), parseInt(match[2])];
        }
        return [1, 999];
    }
    
    /**
     * 遷移記録
     */
    recordTransition(transitionTime) {
        this.performance.totalTransitions++;
        this.performance.averageTransitionTime = 
            (this.performance.averageTransitionTime * (this.performance.totalTransitions - 1) + transitionTime) /
            this.performance.totalTransitions;
    }
    
    /**
     * 現在のWave音響状態取得
     */
    getCurrentWaveAudioState() {
        return { ...this.currentWaveAudioState };
    }
    
    /**
     * パフォーマンス情報取得
     */
    getPerformanceInfo() {
        return { ...this.performance };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            currentState: this.currentWaveAudioState,
            config: this.waveProgressionConfig,
            performance: this.performance,
            transitionController: this.transitionController
        };
    }
    
    /**
     * 遅延ヘルパー
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}