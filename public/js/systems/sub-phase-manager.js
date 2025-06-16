/**
 * SubPhaseManager - 30秒間隔の音楽サブフェーズ管理システム
 * ステージ内での劇的かつ自然な音楽変化を制御
 */
export class SubPhaseManager {
    constructor(audioSystem, stageSystem) {
        this.audioSystem = audioSystem;
        this.stageSystem = stageSystem;
        
        // サブフェーズ管理
        this.currentSubPhase = 0; // 0-3
        this.subPhaseTimer = 0;
        this.subPhaseDuration = 30000; // 30秒 = 30000ms
        this.isTransitioning = false;
        this.transitionDuration = 5000; // 5秒クロスフェード
        
        // ステージ1専用音楽定義 (Forest Survival)
        this.stage1Config = {
            name: "Forest Survival",
            subPhases: {
                0: {
                    name: "静寂の森",
                    description: "Peaceful forest ambience with subtle acoustic elements",
                    emotions: {
                        tension: 0.2,    // 緊張度 20%
                        energy: 0.1,     // エネルギー 10%
                        mystery: 0.6,    // 神秘性 60%
                        warmth: 0.8      // 温かみ 80%
                    },
                    musical: {
                        key: "Am",       // Aマイナー
                        tempo: 30,       // 30 BPM (超スロー・瞑想的)
                        intensity: 0.25, // 音量 25%
                        complexity: 0.3  // 複雑さ 30%
                    },
                    instruments: [
                        { type: "acoustic_guitar", volume: 0.4, delay: 0 },
                        { type: "ambient_pad", volume: 0.6, delay: 2000 },
                        { type: "forest_sounds", volume: 0.3, delay: 0 }
                    ]
                },
                1: {
                    name: "危険の予感", 
                    description: "Rising tension with darker harmonies and subtle percussion",
                    emotions: {
                        tension: 0.5,    // 緊張度 50%
                        energy: 0.3,     // エネルギー 30%
                        mystery: 0.8,    // 神秘性 80%
                        warmth: 0.4      // 温かみ 40%
                    },
                    musical: {
                        key: "Fm",       // Fマイナー (暗い感じ)
                        tempo: 90,       // 90 BPM (3倍速アップ)
                        intensity: 0.4,  // 音量 40%
                        complexity: 0.5  // 複雑さ 50%
                    },
                    instruments: [
                        { type: "acoustic_guitar", volume: 0.3, delay: 0 },
                        { type: "dark_strings", volume: 0.5, delay: 1000 },
                        { type: "subtle_drums", volume: 0.3, delay: 3000 },
                        { type: "bass_drone", volume: 0.4, delay: 5000 }
                    ]
                },
                2: {
                    name: "戦闘開始",
                    description: "Full combat mode with electric guitars and driving percussion",
                    emotions: {
                        tension: 0.9,    // 緊張度 90%
                        energy: 0.8,     // エネルギー 80%
                        mystery: 0.3,    // 神秘性 30%
                        warmth: 0.1      // 温かみ 10%
                    },
                    musical: {
                        key: "Dm",       // Dマイナー (戦闘的)
                        tempo: 180,      // 180 BPM (6倍速・激烈)
                        intensity: 0.7,  // 音量 70%
                        complexity: 0.8  // 複雑さ 80%
                    },
                    instruments: [
                        { type: "electric_guitar", volume: 0.6, delay: 0 },
                        { type: "full_drums", volume: 0.7, delay: 500 },
                        { type: "bass_guitar", volume: 0.5, delay: 1000 },
                        { type: "power_chords", volume: 0.4, delay: 2000 }
                    ]
                },
                3: {
                    name: "勝利への道",
                    description: "Triumphant orchestral finale building to next stage",
                    emotions: {
                        tension: 0.6,    // 緊張度 60% (解放感)
                        energy: 0.9,     // エネルギー 90%
                        mystery: 0.2,    // 神秘性 20%
                        warmth: 0.7      // 温かみ 70% (達成感)
                    },
                    musical: {
                        key: "G",        // Gメジャー (勝利感)
                        tempo: 150,      // 150 BPM (5倍速・勝利の行進)
                        intensity: 0.6,  // 音量 60% (抑制された勝利)
                        complexity: 0.9  // 複雑さ 90%
                    },
                    instruments: [
                        { type: "orchestral_strings", volume: 0.6, delay: 0 },
                        { type: "epic_drums", volume: 0.5, delay: 1000 },
                        { type: "brass_section", volume: 0.4, delay: 2000 },
                        { type: "choir_pad", volume: 0.3, delay: 4000 }
                    ]
                }
            }
        };
        
        console.log('SubPhaseManager: Initialized for Stage 1 music evolution');
    }
    
    /**
     * サブフェーズシステム更新
     * @param {number} deltaTime - フレーム時間 (ms)
     */
    update(deltaTime) {
        // ステージ1以外では動作しない
        if (!this.stageSystem || !this.stageSystem.getStageInfo) {
            if (Math.random() < 0.01) { // 1%の確率でログ
                console.log('🎼 SubPhaseManager: No stageSystem or getStageInfo method');
            }
            return;
        }
        
        const stageInfo = this.stageSystem.getStageInfo();
        if (stageInfo.stage !== 1) {
            if (Math.random() < 0.01) { // 1%の確率でログ
                console.log('🎼 SubPhaseManager: Not stage 1, current stage:', stageInfo.stage);
            }
            return;
        }
        
        // 30秒タイマー更新
        this.subPhaseTimer += deltaTime * 1000; // deltaTimeは秒単位なのでmsに変換
        
        // デバッグログ（10秒ごと）
        if (!this.lastDebugTime) this.lastDebugTime = Date.now();
        if (Date.now() - this.lastDebugTime > 10000) {
            console.log('🎼 SubPhaseManager Active:', {
                currentSubPhase: this.currentSubPhase,
                subPhaseTimer: Math.floor(this.subPhaseTimer / 1000),
                nextTransition: Math.floor((this.subPhaseDuration - this.subPhaseTimer) / 1000),
                isTransitioning: this.isTransitioning,
                deltaTime,
                stageInfo
            });
            this.lastDebugTime = Date.now();
        }
        
        // 30秒経過チェック
        if (this.subPhaseTimer >= this.subPhaseDuration) {
            this.triggerSubPhaseTransition();
            this.subPhaseTimer = 0;
        }
        
        // クロスフェード中の処理
        if (this.isTransitioning) {
            this.updateCrossfade(deltaTime);
        }
    }
    
    /**
     * サブフェーズ切り替えトリガー
     */
    triggerSubPhaseTransition() {
        const nextSubPhase = (this.currentSubPhase + 1) % 4;
        const currentConfig = this.stage1Config.subPhases[this.currentSubPhase];
        const nextConfig = this.stage1Config.subPhases[nextSubPhase];
        
        console.log(`🎼 SubPhase Transition: ${currentConfig.name} → ${nextConfig.name}`);
        console.log(`🎵 Musical Change: ${currentConfig.musical.key} ${currentConfig.musical.tempo}BPM → ${nextConfig.musical.key} ${nextConfig.musical.tempo}BPM`);
        
        // 感情曲線変化ログ
        console.log(`💭 Emotion Curve:`, {
            tension: `${(currentConfig.emotions.tension * 100).toFixed(0)}% → ${(nextConfig.emotions.tension * 100).toFixed(0)}%`,
            energy: `${(currentConfig.emotions.energy * 100).toFixed(0)}% → ${(nextConfig.emotions.energy * 100).toFixed(0)}%`
        });
        
        // クロスフェード開始
        this.startCrossfade(this.currentSubPhase, nextSubPhase);
        this.currentSubPhase = nextSubPhase;
    }
    
    /**
     * クロスフェード開始
     * @param {number} fromPhase - 開始サブフェーズ
     * @param {number} toPhase - 終了サブフェーズ
     */
    startCrossfade(fromPhase, toPhase) {
        this.isTransitioning = true;
        this.transitionStartTime = Date.now();
        this.transitionFrom = fromPhase;
        this.transitionTo = toPhase;
        
        // AudioSystemに新しいサブフェーズ情報を通知
        if (this.audioSystem && this.audioSystem.onSubPhaseChange) {
            this.audioSystem.onSubPhaseChange(toPhase, this.getSubPhaseConfig(toPhase));
        }
    }
    
    /**
     * クロスフェード更新
     * @param {number} deltaTime - フレーム時間
     */
    updateCrossfade(deltaTime) {
        const elapsed = Date.now() - this.transitionStartTime;
        const progress = Math.min(elapsed / this.transitionDuration, 1.0);
        
        if (progress >= 1.0) {
            // クロスフェード完了
            this.isTransitioning = false;
            console.log(`✅ Crossfade completed to SubPhase ${this.currentSubPhase}`);
        }
        
        // AudioSystemにクロスフェード進行度を通知
        if (this.audioSystem && this.audioSystem.updateCrossfade) {
            this.audioSystem.updateCrossfade(progress, this.transitionFrom, this.transitionTo);
        }
    }
    
    /**
     * 現在のサブフェーズ設定取得
     * @returns {Object} サブフェーズ設定
     */
    getCurrentSubPhaseConfig() {
        return this.getSubPhaseConfig(this.currentSubPhase);
    }
    
    /**
     * 指定サブフェーズ設定取得
     * @param {number} subPhase - サブフェーズ番号 (0-3)
     * @returns {Object} サブフェーズ設定
     */
    getSubPhaseConfig(subPhase) {
        return this.stage1Config.subPhases[subPhase] || this.stage1Config.subPhases[0];
    }
    
    /**
     * ステージ変更時のリセット
     */
    resetForStage(stageNumber) {
        if (stageNumber === 1) {
            this.currentSubPhase = 0;
            this.subPhaseTimer = 0;
            this.isTransitioning = false;
            console.log('🎼 SubPhaseManager: Reset for Stage 1');
        }
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        const config = this.getCurrentSubPhaseConfig();
        return {
            currentSubPhase: this.currentSubPhase,
            subPhaseName: config.name,
            timer: Math.floor(this.subPhaseTimer / 1000),
            nextTransition: Math.floor((this.subPhaseDuration - this.subPhaseTimer) / 1000),
            isTransitioning: this.isTransitioning,
            emotions: config.emotions,
            musical: config.musical
        };
    }
}