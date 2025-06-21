/**
 * AudioEffectsManager - Phase 2.2 音響エフェクトシステム
 * 
 * 🎯 目的: 高品質な音響エフェクト管理
 * 📐 設計: モジュラー・エフェクトチェーン・動的制御
 * 🛡️ Phase 2.2: エフェクトシステム（90%成功確率）
 */

export class AudioEffectsManager {
    constructor() {
        // エフェクト管理状態
        this.isInitialized = false;
        this.effectsEnabled = true;
        
        // エフェクトオブジェクト
        this.effects = {
            // 基本エフェクト
            reverb: null,
            filter: null,
            distortion: null,
            compressor: null,
            
            // アドバンスエフェクト
            chorus: null,
            delay: null,
            equalizer: null,
            limiter: null
        };
        
        // エフェクトチェーン
        this.effectChains = {
            master: [],      // マスターチェーン
            music: [],       // 音楽専用チェーン
            sfx: []         // 効果音専用チェーン
        };
        
        // エフェクト設定
        this.settings = {
            reverb: {
                roomSize: 0.8,
                dampening: 3000,
                wet: 0.3,
                dry: 0.7
            },
            filter: {
                frequency: 5000,
                type: 'lowpass',
                Q: 1,
                gain: 0
            },
            distortion: {
                amount: 0.4,
                oversample: '4x'
            },
            compressor: {
                threshold: -24,
                ratio: 12,
                attack: 0.003,
                release: 0.25,
                knee: 30
            }
        };
        
        // パフォーマンス監視
        this.stats = {
            activeEffects: 0,
            processingLoad: 0,
            memoryUsage: 0,
            effectCalls: 0
        };
        
        console.log('🎛️ AudioEffectsManager: Phase 2.2 初期化');
    }
    
    /**
     * エフェクトシステム初期化
     * Phase 2.2: 安全で確実なエフェクト作成
     */
    async initialize() {
        const startTime = performance.now();
        
        try {
            console.log('🚀 AudioEffectsManager: エフェクト初期化開始');
            
            // 基本エフェクト作成
            await this.createBasicEffects();
            
            // エフェクトチェーン構築
            this.buildEffectChains();
            
            // 初期設定適用
            this.applyDefaultSettings();
            
            this.isInitialized = true;
            
            const initTime = performance.now() - startTime;
            console.log(`✅ AudioEffectsManager: 初期化完了 (${initTime.toFixed(2)}ms)`);
            
            return { success: true, latency: initTime };
            
        } catch (error) {
            console.error('❌ AudioEffectsManager: 初期化失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 基本エフェクト作成
     * Phase 2.2: Tone.js安全エフェクト作成
     */
    async createBasicEffects() {
        try {
            // 1. Reverb エフェクト
            if (typeof Tone !== 'undefined' && Tone.Reverb) {
                this.effects.reverb = new Tone.Reverb({
                    roomSize: this.settings.reverb.roomSize,
                    dampening: this.settings.reverb.dampening
                });
                this.effects.reverb.wet.value = this.settings.reverb.wet;
                console.log('🏛️ Reverb effect created');
            }
            
            // 2. Filter エフェクト
            if (typeof Tone !== 'undefined' && Tone.Filter) {
                this.effects.filter = new Tone.Filter({
                    frequency: this.settings.filter.frequency,
                    type: this.settings.filter.type,
                    Q: this.settings.filter.Q
                });
                console.log('🔊 Filter effect created');
            }
            
            // 3. Distortion エフェクト
            if (typeof Tone !== 'undefined' && Tone.Distortion) {
                this.effects.distortion = new Tone.Distortion({
                    distortion: this.settings.distortion.amount,
                    oversample: this.settings.distortion.oversample
                });
                console.log('⚡ Distortion effect created');
            }
            
            // 4. Compressor エフェクト
            if (typeof Tone !== 'undefined' && Tone.Compressor) {
                this.effects.compressor = new Tone.Compressor({
                    threshold: this.settings.compressor.threshold,
                    ratio: this.settings.compressor.ratio,
                    attack: this.settings.compressor.attack,
                    release: this.settings.compressor.release,
                    knee: this.settings.compressor.knee
                });
                console.log('🎚️ Compressor effect created');
            }
            
            // 5. アドバンスエフェクト
            await this.createAdvancedEffects();
            
            // エフェクト数カウント
            this.stats.activeEffects = Object.values(this.effects).filter(Boolean).length;
            
            console.log(`🎛️ エフェクト作成完了: ${this.stats.activeEffects}個のエフェクト`);
            
        } catch (error) {
            throw new Error(`Basic effects creation failed: ${error.message}`);
        }
    }
    
    /**
     * アドバンスエフェクト作成
     */
    async createAdvancedEffects() {
        try {
            // Chorus エフェクト
            if (typeof Tone !== 'undefined' && Tone.Chorus) {
                this.effects.chorus = new Tone.Chorus({
                    frequency: 4,
                    delayTime: 2.5,
                    depth: 0.5,
                    spread: 180
                });
                console.log('🌊 Chorus effect created');
            }
            
            // Delay エフェクト
            if (typeof Tone !== 'undefined' && Tone.PingPongDelay) {
                this.effects.delay = new Tone.PingPongDelay({
                    delayTime: '8n',
                    feedback: 0.3,
                    wet: 0.2
                });
                console.log('🔄 Delay effect created');
            }
            
            // EQ エフェクト
            if (typeof Tone !== 'undefined' && Tone.EQ3) {
                this.effects.equalizer = new Tone.EQ3({
                    low: 0,
                    mid: 0,
                    high: 0,
                    lowFrequency: 400,
                    highFrequency: 2500
                });
                console.log('🎚️ Equalizer effect created');
            }
            
            // Limiter エフェクト
            if (typeof Tone !== 'undefined' && Tone.Limiter) {
                this.effects.limiter = new Tone.Limiter(-1);
                console.log('🚧 Limiter effect created');
            }
            
        } catch (error) {
            console.warn('⚠️ Some advanced effects failed to create:', error);
            // アドバンスエフェクトは失敗しても続行
        }
    }
    
    /**
     * エフェクトチェーン構築
     * Phase 2.2: 柔軟なルーティングシステム
     */
    buildEffectChains() {
        try {
            // マスターチェーン: 全音響に適用
            this.effectChains.master = [
                this.effects.compressor,
                this.effects.equalizer,
                this.effects.limiter
            ].filter(Boolean);
            
            // 音楽チェーン: BGM専用
            this.effectChains.music = [
                this.effects.reverb,
                this.effects.chorus,
                this.effects.filter
            ].filter(Boolean);
            
            // 効果音チェーン: SFX専用
            this.effectChains.sfx = [
                this.effects.compressor,
                this.effects.distortion
            ].filter(Boolean);
            
            console.log('🔗 エフェクトチェーン構築完了:', {
                master: this.effectChains.master.length,
                music: this.effectChains.music.length,
                sfx: this.effectChains.sfx.length
            });
            
        } catch (error) {
            console.warn('⚠️ エフェクトチェーン構築警告:', error);
        }
    }
    
    /**
     * デフォルト設定適用
     */
    applyDefaultSettings() {
        try {
            // リバーブ設定
            if (this.effects.reverb) {
                this.effects.reverb.wet.value = this.settings.reverb.wet;
            }
            
            // フィルター設定
            if (this.effects.filter) {
                this.effects.filter.frequency.value = this.settings.filter.frequency;
            }
            
            // ディストーション設定
            if (this.effects.distortion) {
                this.effects.distortion.wet.value = 0.2; // 控えめなディストーション
            }
            
            console.log('⚙️ デフォルト設定適用完了');
            
        } catch (error) {
            console.warn('⚠️ デフォルト設定適用警告:', error);
        }
    }
    
    /**
     * 楽器にエフェクトチェーン適用
     * @param {Object} instrument - Tone.js楽器オブジェクト
     * @param {string} chainType - チェーンタイプ ('master', 'music', 'sfx')
     */
    applyEffectChain(instrument, chainType = 'master') {
        try {
            if (!instrument || !this.isInitialized) {
                return { success: false, error: 'instrument_or_effects_not_ready' };
            }
            
            const chain = this.effectChains[chainType];
            if (!chain || chain.length === 0) {
                return { success: false, error: 'chain_not_available' };
            }
            
            // 既存の接続を切断
            instrument.disconnect();
            
            // エフェクトチェーン適用
            let currentNode = instrument;
            
            chain.forEach((effect, index) => {
                if (effect) {
                    currentNode.connect(effect);
                    currentNode = effect;
                }
            });
            
            // 最終出力に接続
            currentNode.toDestination();
            
            console.log(`🔗 エフェクトチェーン適用: ${chainType} (${chain.length}エフェクト)`);
            
            return { success: true, appliedEffects: chain.length };
            
        } catch (error) {
            console.error('❌ エフェクトチェーン適用エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * リバーブ動的調整
     * @param {number} intensity - 強度 (0.0 - 1.0)
     */
    adjustReverb(intensity = 0.5) {
        try {
            if (!this.effects.reverb) return { success: false, error: 'reverb_not_available' };
            
            const wetValue = Math.max(0, Math.min(1, intensity));
            this.effects.reverb.wet.value = wetValue;
            
            console.log(`🏛️ リバーブ調整: ${(wetValue * 100).toFixed(1)}%`);
            
            return { success: true, value: wetValue };
            
        } catch (error) {
            console.error('❌ リバーブ調整エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * フィルター動的調整
     * @param {number} frequency - 周波数 (Hz)
     * @param {string} type - フィルタータイプ
     */
    adjustFilter(frequency = 5000, type = 'lowpass') {
        try {
            if (!this.effects.filter) return { success: false, error: 'filter_not_available' };
            
            this.effects.filter.frequency.value = Math.max(20, Math.min(20000, frequency));
            if (['lowpass', 'highpass', 'bandpass', 'notch'].includes(type)) {
                this.effects.filter.type = type;
            }
            
            console.log(`🔊 フィルター調整: ${frequency}Hz (${type})`);
            
            return { success: true, frequency: frequency, type: type };
            
        } catch (error) {
            console.error('❌ フィルター調整エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * ディストーション動的調整
     * @param {number} amount - ディストーション量 (0.0 - 1.0)
     */
    adjustDistortion(amount = 0.4) {
        try {
            if (!this.effects.distortion) return { success: false, error: 'distortion_not_available' };
            
            const distortionValue = Math.max(0, Math.min(1, amount));
            this.effects.distortion.distortion = distortionValue;
            this.effects.distortion.wet.value = distortionValue * 0.5; // ウェット量も調整
            
            console.log(`⚡ ディストーション調整: ${(distortionValue * 100).toFixed(1)}%`);
            
            return { success: true, value: distortionValue };
            
        } catch (error) {
            console.error('❌ ディストーション調整エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 動的エフェクト変更（ゲーム状態連動）
     * @param {Object} gameState - ゲーム状態オブジェクト
     */
    updateEffectsFromGameState(gameState) {
        try {
            if (!gameState) return { success: false, error: 'no_game_state' };
            
            const { combo = 0, intensity = 1.0, scene = 'normal' } = gameState;
            
            // コンボ数に応じたリバーブ強化
            const reverbIntensity = Math.min(0.8, 0.2 + (combo * 0.02));
            this.adjustReverb(reverbIntensity);
            
            // 強度に応じたフィルター調整
            const filterFreq = 2000 + (intensity * 6000);
            this.adjustFilter(filterFreq);
            
            // シーン別エフェクト
            switch (scene) {
                case 'battle':
                    this.adjustDistortion(0.3);
                    break;
                case 'menu':
                    this.adjustDistortion(0.1);
                    break;
                default:
                    this.adjustDistortion(0.2);
            }
            
            console.log(`🎮 ゲーム状態連動エフェクト更新: combo=${combo}, intensity=${intensity}, scene=${scene}`);
            
            return { success: true, appliedChanges: 3 };
            
        } catch (error) {
            console.error('❌ ゲーム状態連動エフェクト更新エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * エフェクトシステム状態取得
     */
    getEffectsStatus() {
        return {
            initialized: this.isInitialized,
            enabled: this.effectsEnabled,
            effects: {
                reverb: !!this.effects.reverb,
                filter: !!this.effects.filter,
                distortion: !!this.effects.distortion,
                compressor: !!this.effects.compressor,
                chorus: !!this.effects.chorus,
                delay: !!this.effects.delay,
                equalizer: !!this.effects.equalizer,
                limiter: !!this.effects.limiter
            },
            chains: {
                master: this.effectChains.master.length,
                music: this.effectChains.music.length,
                sfx: this.effectChains.sfx.length
            },
            settings: this.settings,
            stats: this.stats
        };
    }
    
    /**
     * エフェクトシステムクリーンアップ
     */
    dispose() {
        try {
            // 全エフェクトの解放
            Object.keys(this.effects).forEach(key => {
                if (this.effects[key] && typeof this.effects[key].dispose === 'function') {
                    this.effects[key].dispose();
                    this.effects[key] = null;
                }
            });
            
            // チェーンクリア
            this.effectChains.master = [];
            this.effectChains.music = [];
            this.effectChains.sfx = [];
            
            this.isInitialized = false;
            
            console.log('🧹 AudioEffectsManager: リソース解放完了');
            
        } catch (error) {
            console.error('❌ AudioEffectsManager dispose error:', error);
        }
    }
}