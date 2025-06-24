/**
 * DynamicWaveAudioSystem - 999ウェーブ対応動的音響システム
 * README.md完全対応: 「999ウェーブ進行での段階的テンション上昇」
 * 
 * 🌊 設計理念：
 * - ウェーブ進行に応じた音楽・効果音の動的変化
 * - Wave 1→999への段階的テンション構築
 * - プレイヤーの感情を高める音響演出
 * - ゲーム状況に応じたリアルタイム音響調整
 */

export class DynamicWaveAudioSystem {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.game = audioSystem.game;
        
        // システム状態
        this.isInitialized = false;
        this.currentWave = 1;
        this.maxWave = 999;
        
        // 動的音響制御
        this.dynamicParams = {
            // テンション段階 (5段階)
            tensionLevel: 1,        // 1=calm, 2=building, 3=intense, 4=climax, 5=ultimate
            
            // 音楽パラメータ
            baseTempo: 120,
            currentTempo: 120,
            tempoMultiplier: 1.0,
            
            // 音響強度
            intensity: 1.0,         // 音響全体の強度
            reverbLevel: 0.2,       // リバーブの深さ
            compressionLevel: 1.0,  // 圧縮レベル
            
            // 周波数特性
            bassBoost: 1.0,         // 低音強化
            trebleBoost: 1.0,       // 高音強化
            
            // エフェクト制御
            chorusDepth: 0.2,
            distortionLevel: 0.1
        };
        
        // ウェーブ段階定義
        this.waveStages = this.createWaveStages();
        
        // 音響イベント管理
        this.audioEvents = {
            waveStart: [],
            waveClear: [],
            milestone: [],
            boss: [],
            final: []
        };
        
        // パフォーマンス監視
        this.performance = {
            updateCount: 0,
            avgUpdateTime: 0,
            maxUpdateTime: 0,
            lastUpdateTime: 0
        };
        
        console.log('🌊 DynamicWaveAudioSystem: 999ウェーブ動的音響システム初期化中...');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🌊 DynamicWaveAudioSystem: 動的音響システム初期化開始...');
            
            // ウェーブ段階マッピング作成
            this.createWaveStageMapping();
            
            // 動的パラメータ初期化
            this.resetDynamicParams();
            
            this.isInitialized = true;
            console.log('✅ DynamicWaveAudioSystem: 999ウェーブ動的音響システム準備完了');
            
            return { success: true, message: 'Dynamic wave audio system ready' };
            
        } catch (error) {
            console.error('❌ DynamicWaveAudioSystem: 初期化失敗:', error);
            this.isInitialized = false;
            return { success: false, message: `Dynamic wave audio init failed: ${error.message}` };
        }
    }
    
    /**
     * ウェーブ段階定義作成
     */
    createWaveStages() {
        return {
            // Stage 1: 導入部 (Wave 1-50)
            introduction: {
                waveRange: [1, 50],
                tensionLevel: 1,
                tempoRange: [120, 130],
                intensity: [1.0, 1.2],
                characteristics: '穏やかな導入、基本的な音響'
            },
            
            // Stage 2: 発展部 (Wave 51-150)
            development: {
                waveRange: [51, 150],
                tensionLevel: 2,
                tempoRange: [130, 140],
                intensity: [1.2, 1.5],
                characteristics: 'テンションの構築、音響の多様化'
            },
            
            // Stage 3: 展開部 (Wave 151-300)
            expansion: {
                waveRange: [151, 300],
                tensionLevel: 2,
                tempoRange: [140, 150],
                intensity: [1.5, 1.8],
                characteristics: '複雑な音響パターン、戦略的深化'
            },
            
            // Stage 4: 緊張部 (Wave 301-500)
            tension: {
                waveRange: [301, 500],
                tensionLevel: 3,
                tempoRange: [150, 160],
                intensity: [1.8, 2.2],
                characteristics: '高いテンション、激しい戦闘'
            },
            
            // Stage 5: 高潮部 (Wave 501-700)
            climax: {
                waveRange: [501, 700],
                tensionLevel: 4,
                tempoRange: [160, 170],
                intensity: [2.2, 2.6],
                characteristics: 'クライマックス、最高の盛り上がり'
            },
            
            // Stage 6: 極限部 (Wave 701-900)
            extreme: {
                waveRange: [701, 900],
                tensionLevel: 4,
                tempoRange: [170, 180],
                intensity: [2.6, 3.0],
                characteristics: '極限状態、圧倒的な音響'
            },
            
            // Stage 7: 終章部 (Wave 901-999)
            finale: {
                waveRange: [901, 999],
                tensionLevel: 5,
                tempoRange: [180, 200],
                intensity: [3.0, 4.0],
                characteristics: '最終決戦、究極の音響体験'
            }
        };
    }
    
    /**
     * ウェーブ段階マッピング作成
     */
    createWaveStageMapping() {
        this.waveStageMap = new Map();
        
        Object.entries(this.waveStages).forEach(([stageName, stageData]) => {
            const [start, end] = stageData.waveRange;
            for (let wave = start; wave <= end; wave++) {
                this.waveStageMap.set(wave, {
                    stageName,
                    stageData,
                    progress: (wave - start) / (end - start)
                });
            }
        });
        
        console.log('🌊 ウェーブ段階マッピング作成完了 (999ウェーブ対応)');
    }
    
    /**
     * ウェーブ変更時の音響更新
     */
    updateWaveAudio(newWave) {
        if (!this.isInitialized) return;
        
        const startTime = performance.now();
        
        try {
            this.currentWave = newWave;
            const stageInfo = this.waveStageMap.get(newWave);
            
            if (!stageInfo) {
                console.warn(`Wave ${newWave} stage info not found`);
                return;
            }
            
            const { stageName, stageData, progress } = stageInfo;
            
            // 動的パラメータ更新
            this.updateDynamicParams(stageData, progress);
            
            // 音響システムに反映
            this.applyDynamicChanges();
            
            // 特別なウェーブイベント処理
            this.handleSpecialWaveEvents(newWave);
            
            console.log(`🌊 Wave ${newWave} (${stageName}): Tension=${this.dynamicParams.tensionLevel}, Tempo=${this.dynamicParams.currentTempo.toFixed(1)}, Intensity=${this.dynamicParams.intensity.toFixed(2)}`);
            
        } catch (error) {
            console.warn('🌊 Wave audio update failed:', error);
        }
        
        // パフォーマンス監視
        const updateTime = performance.now() - startTime;
        this.updatePerformanceStats(updateTime);
    }
    
    /**
     * 動的パラメータ更新
     */
    updateDynamicParams(stageData, progress) {
        // テンション設定
        this.dynamicParams.tensionLevel = stageData.tensionLevel;
        
        // テンポ計算
        const [minTempo, maxTempo] = stageData.tempoRange;
        this.dynamicParams.currentTempo = minTempo + (maxTempo - minTempo) * progress;
        this.dynamicParams.tempoMultiplier = this.dynamicParams.currentTempo / this.dynamicParams.baseTempo;
        
        // 強度計算
        const [minIntensity, maxIntensity] = stageData.intensity;
        this.dynamicParams.intensity = minIntensity + (maxIntensity - minIntensity) * progress;
        
        // 音響特性調整
        this.dynamicParams.reverbLevel = Math.min(0.2 + (this.dynamicParams.tensionLevel - 1) * 0.1, 0.8);
        this.dynamicParams.compressionLevel = 1.0 + (this.dynamicParams.tensionLevel - 1) * 0.2;
        
        // 周波数特性調整
        this.dynamicParams.bassBoost = 1.0 + (this.dynamicParams.tensionLevel - 1) * 0.3;
        this.dynamicParams.trebleBoost = 1.0 + (this.dynamicParams.tensionLevel - 1) * 0.2;
        
        // エフェクト調整
        this.dynamicParams.chorusDepth = Math.min(0.2 + (this.dynamicParams.tensionLevel - 1) * 0.1, 0.6);
        this.dynamicParams.distortionLevel = Math.min(0.1 + (this.dynamicParams.tensionLevel - 1) * 0.15, 0.5);
    }
    
    /**
     * 動的変更の適用
     */
    applyDynamicChanges() {
        try {
            // チップチューンBGMシステムへの適用
            if (this.audioSystem.chiptuneEngine) {
                this.audioSystem.chiptuneEngine.updateDynamicParams({
                    tempo: this.dynamicParams.currentTempo,
                    intensity: this.dynamicParams.intensity,
                    tensionLevel: this.dynamicParams.tensionLevel
                });
            }
            
            // スターウォーズ戦闘音響への適用
            if (this.audioSystem.starWarsAudio) {
                this.audioSystem.starWarsAudio.updateVolume();
            }
            
            // FF UI音響への適用
            if (this.audioSystem.ffUIAudio) {
                this.audioSystem.ffUIAudio.updateVolume();
            }
            
            // Tone.js Transport BPM更新
            if (typeof Tone !== 'undefined' && Tone.Transport) {
                Tone.Transport.bpm.setValueAtTime(this.dynamicParams.currentTempo, Tone.now());
            }
            
        } catch (error) {
            console.warn('🌊 Dynamic changes application failed:', error);
        }
    }
    
    /**
     * 特別なウェーブイベント処理
     */
    handleSpecialWaveEvents(wave) {
        // マイルストーンウェーブ (50, 100, 150, ...)
        if (wave % 50 === 0) {
            this.triggerMilestoneEvent(wave);
        }
        
        // ボスウェーブ (100, 200, 300, ...)
        if (wave % 100 === 0) {
            this.triggerBossEvent(wave);
        }
        
        // 最終ウェーブ (999)
        if (wave === 999) {
            this.triggerFinalEvent();
        }
        
        // 段階変更ウェーブ
        const stageTransitions = [50, 150, 300, 500, 700, 900];
        if (stageTransitions.includes(wave)) {
            this.triggerStageTransitionEvent(wave);
        }
    }
    
    /**
     * マイルストーンイベント
     */
    triggerMilestoneEvent(wave) {
        try {
            // 特別なファンファーレ
            if (this.audioSystem.ffUIAudio) {
                this.audioSystem.ffUIAudio.playFFLevelUpSound();
            }
            
            console.log(`🎯 Milestone Wave ${wave} reached! Special fanfare played!`);
            
        } catch (error) {
            console.warn('Milestone event failed:', error);
        }
    }
    
    /**
     * ボスイベント
     */
    triggerBossEvent(wave) {
        try {
            // ボス音響強化
            this.dynamicParams.intensity *= 1.2;
            this.dynamicParams.bassBoost *= 1.3;
            
            console.log(`👹 Boss Wave ${wave}! Audio intensity boosted!`);
            
        } catch (error) {
            console.warn('Boss event failed:', error);
        }
    }
    
    /**
     * 最終イベント
     */
    triggerFinalEvent() {
        try {
            // 究極の音響設定
            this.dynamicParams.intensity = 5.0;
            this.dynamicParams.currentTempo = 220;
            this.dynamicParams.tensionLevel = 5;
            this.dynamicParams.bassBoost = 2.0;
            this.dynamicParams.trebleBoost = 1.8;
            
            console.log('🏆 FINAL WAVE 999! Ultimate audio experience activated!');
            
        } catch (error) {
            console.warn('Final event failed:', error);
        }
    }
    
    /**
     * 段階変更イベント
     */
    triggerStageTransitionEvent(wave) {
        try {
            const stageInfo = this.waveStageMap.get(wave);
            if (stageInfo) {
                console.log(`🎭 Stage Transition at Wave ${wave}: Entering ${stageInfo.stageName} phase`);
                
                // 段階変更音響効果
                if (this.audioSystem.ffUIAudio) {
                    this.audioSystem.ffUIAudio.playFFConfirmSound();
                }
            }
            
        } catch (error) {
            console.warn('Stage transition event failed:', error);
        }
    }
    
    /**
     * 動的パラメータリセット
     */
    resetDynamicParams() {
        this.dynamicParams = {
            tensionLevel: 1,
            baseTempo: 120,
            currentTempo: 120,
            tempoMultiplier: 1.0,
            intensity: 1.0,
            reverbLevel: 0.2,
            compressionLevel: 1.0,
            bassBoost: 1.0,
            trebleBoost: 1.0,
            chorusDepth: 0.2,
            distortionLevel: 0.1
        };
        
        console.log('🌊 Dynamic parameters reset to initial values');
    }
    
    /**
     * パフォーマンス統計更新
     */
    updatePerformanceStats(updateTime) {
        this.performance.updateCount++;
        this.performance.maxUpdateTime = Math.max(this.performance.maxUpdateTime, updateTime);
        
        // 移動平均計算
        const alpha = 0.1;
        this.performance.avgUpdateTime = this.performance.avgUpdateTime * (1 - alpha) + updateTime * alpha;
        this.performance.lastUpdateTime = updateTime;
    }
    
    /**
     * 現在の音響状態取得
     */
    getCurrentAudioState() {
        const stageInfo = this.waveStageMap.get(this.currentWave);
        
        return {
            wave: this.currentWave,
            stage: stageInfo ? stageInfo.stageName : 'unknown',
            progress: stageInfo ? stageInfo.progress : 0,
            dynamicParams: { ...this.dynamicParams },
            performance: { ...this.performance }
        };
    }
    
    /**
     * 統計取得
     */
    getStats() {
        return {
            currentWave: this.currentWave,
            maxWave: this.maxWave,
            ...this.getCurrentAudioState(),
            systemReady: this.isInitialized
        };
    }
    
    /**
     * システム破棄
     */
    destroy() {
        // イベントリスナー削除
        this.audioEvents = {
            waveStart: [],
            waveClear: [],
            milestone: [],
            boss: [],
            final: []
        };
        
        console.log('🌊 DynamicWaveAudioSystem: 999ウェーブ動的音響システム破棄完了');
    }
}