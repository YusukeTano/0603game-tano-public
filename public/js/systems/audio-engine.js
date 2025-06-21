/**
 * AudioEngine - 処理エンジン層
 * 音響処理・エフェクト・楽器管理・音響ロジック
 * AudioCoreを使用した高レベル音響制御
 */

import { AudioCore } from './audio-core.js';

export class AudioEngine {
    constructor(audioCore = null) {
        // Core依存性
        this.audioCore = audioCore || new AudioCore();
        
        // エンジン状態
        this.isInitialized = false;
        this.isRunning = false;
        
        // 楽器管理
        this.instruments = new Map();           // アクティブ楽器
        this.instrumentTemplates = new Map();   // 楽器テンプレート
        this.effectChains = new Map();          // エフェクトチェーン
        
        // 音響処理設定
        this.processingConfig = {
            maxVoices: 8,                      // 最大同時ボイス数
            voiceStealingEnabled: true,         // ボイススティーリング
            effectProcessingEnabled: true,      // エフェクト処理
            realtimeProcessing: true           // リアルタイム処理
        };
        
        // パフォーマンス監視
        this.performance = {
            activeSounds: 0,
            voiceUsage: 0,
            processingLoad: 0,
            dropouts: 0
        };
        
        // 楽器テンプレート初期化
        this.initializeInstrumentTemplates();
        
        console.log('🎛️ AudioEngine: 処理エンジン層初期化');
    }
    
    /**
     * エンジン初期化
     */
    async initialize() {
        try {
            // AudioCore初期化
            if (!this.audioCore.isInitialized) {
                const coreResult = await this.audioCore.initialize();
                if (!coreResult.success) {
                    throw new Error(`AudioCore initialization failed: ${coreResult.error}`);
                }
            }
            
            // マスターエフェクトチェーン作成
            await this.createMasterEffectChain();
            
            // デフォルト楽器作成
            await this.createDefaultInstruments();
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('✅ AudioEngine: エンジン初期化完了');
            return { success: true, message: 'AudioEngine initialized' };
            
        } catch (error) {
            console.error('❌ AudioEngine: 初期化失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 楽器テンプレート初期化
     */
    initializeInstrumentTemplates() {
        // プラズマ射撃音 - シャープ・高周波
        this.instrumentTemplates.set('plasma', {
            type: 'NoiseSynth',
            options: {
                noise: { type: 'white' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.0, release: 0.05 },
                filter: { frequency: 800, Q: 2, type: 'highpass' },
                volume: -12
            },
            effects: ['distortion', 'highpass']
        });
        
        // ニューク射撃音 - 重厚・低周波
        this.instrumentTemplates.set('nuke', {
            type: 'FMSynth',
            options: {
                harmonicity: 2.5,
                modulationIndex: 8,
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.1, release: 0.4 },
                modulation: { type: 'square' },
                carrier: { oscillator: { type: 'sine' } },
                volume: -6
            },
            effects: ['lowpass', 'reverb']
        });
        
        // スーパーホーミング - 電子的・中周波
        this.instrumentTemplates.set('superHoming', {
            type: 'Synth',
            options: {
                oscillator: { type: 'sawtooth' },
                envelope: { attack: 0.02, decay: 0.2, sustain: 0.2, release: 0.1 },
                filter: { frequency: 600, Q: 1.5, type: 'bandpass' },
                volume: -10
            },
            effects: ['filter', 'delay']
        });
        
        // スーパーショットガン - 爆発的・広帯域
        this.instrumentTemplates.set('superShotgun', {
            type: 'NoiseSynth',
            options: {
                noise: { type: 'brown' },
                envelope: { attack: 0.005, decay: 0.15, sustain: 0.0, release: 0.08 },
                filter: { frequency: 400, Q: 0.8, type: 'lowpass' },
                volume: -8
            },
            effects: ['compressor', 'reverb']
        });
        
        // 敵ヒット音 - インパクト
        this.instrumentTemplates.set('enemyHit', {
            type: 'NoiseSynth',
            options: {
                noise: { type: 'pink' },
                envelope: { attack: 0.01, decay: 0.08, sustain: 0.0, release: 0.02 },
                filter: { frequency: 1200, Q: 3, type: 'highpass' },
                volume: -15
            },
            effects: ['highpass']
        });
        
        // 敵死亡音 - 劇的
        this.instrumentTemplates.set('enemyDeath', {
            type: 'FMSynth',
            options: {
                harmonicity: 1.5,
                modulationIndex: 12,
                envelope: { attack: 0.02, decay: 0.4, sustain: 0.0, release: 0.3 },
                volume: -12
            },
            effects: ['reverb', 'lowpass']
        });
        
        // UI音 - クリア・ブライト
        this.instrumentTemplates.set('ui', {
            type: 'Synth',
            options: {
                oscillator: { type: 'sine' },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
                volume: -18
            },
            effects: ['filter']
        });
        
        console.log(`🎼 AudioEngine: ${this.instrumentTemplates.size}個の楽器テンプレート登録完了`);
    }
    
    /**
     * マスターエフェクトチェーン作成
     */
    async createMasterEffectChain() {
        try {
            // マスターコンプレッサー
            const compressorResult = this.audioCore.createToneObject('Compressor', {
                threshold: -24,
                ratio: 4,
                attack: 0.003,
                release: 0.1
            }, 'master_compressor');
            
            if (!compressorResult.success) {
                throw new Error('Master compressor creation failed');
            }
            
            // マスターリミッター（コンプレッサーとして設定）
            const limiterResult = this.audioCore.createToneObject('Compressor', {
                threshold: -6,
                ratio: 20,
                attack: 0.001,
                release: 0.05
            }, 'master_limiter');
            
            if (!limiterResult.success) {
                throw new Error('Master limiter creation failed');
            }
            
            // エフェクトチェーン接続
            compressorResult.object.connect(limiterResult.object);
            limiterResult.object.connect(this.audioCore.masterGain);
            
            this.effectChains.set('master', {
                compressor: compressorResult.object,
                limiter: limiterResult.object
            });
            
            console.log('✅ AudioEngine: マスターエフェクトチェーン作成完了');
            
        } catch (error) {
            console.error('❌ AudioEngine: マスターエフェクトチェーン作成失敗:', error);
            throw error;
        }
    }
    
    /**
     * デフォルト楽器作成
     */
    async createDefaultInstruments() {
        const defaultInstruments = ['plasma', 'nuke', 'superHoming', 'superShotgun', 'enemyHit', 'ui'];
        
        for (const instrumentName of defaultInstruments) {
            try {
                await this.createInstrument(instrumentName);
            } catch (error) {
                console.warn(`⚠️ AudioEngine: ${instrumentName}楽器作成失敗:`, error);
            }
        }
    }
    
    /**
     * 楽器作成
     */
    async createInstrument(instrumentName, customTemplate = null) {
        try {
            const template = customTemplate || this.instrumentTemplates.get(instrumentName);
            if (!template) {
                throw new Error(`Unknown instrument template: ${instrumentName}`);
            }
            
            // 楽器オブジェクト作成
            const instrumentResult = this.audioCore.createToneObject(
                template.type, 
                template.options, 
                `instrument_${instrumentName}`
            );
            
            if (!instrumentResult.success) {
                throw new Error(`Instrument creation failed: ${instrumentResult.error}`);
            }
            
            const instrument = instrumentResult.object;
            
            // エフェクト作成・チェーン接続
            const effectChain = [];
            let currentNode = instrument;
            
            if (template.effects && template.effects.length > 0) {
                for (const effectType of template.effects) {
                    const effect = await this.createEffect(effectType, instrumentName);
                    if (effect) {
                        currentNode.connect(effect);
                        effectChain.push(effect);
                        currentNode = effect;
                    }
                }
            }
            
            // マスターチェーンに接続
            const masterChain = this.effectChains.get('master');
            if (masterChain) {
                currentNode.connect(masterChain.compressor);
            } else {
                currentNode.connect(this.audioCore.masterGain);
            }
            
            // 楽器情報登録
            this.instruments.set(instrumentName, {
                instrument,
                effectChain,
                template,
                created: Date.now(),
                lastUsed: Date.now(),
                playCount: 0
            });
            
            console.log(`🎺 AudioEngine: ${instrumentName}楽器作成完了`);
            return instrument;
            
        } catch (error) {
            console.error(`❌ AudioEngine: ${instrumentName}楽器作成失敗:`, error);
            throw error;
        }
    }
    
    /**
     * エフェクト作成
     */
    async createEffect(effectType, parentName = 'unknown') {
        try {
            let effectOptions = {};
            let toneType = '';
            
            switch (effectType) {
                case 'reverb':
                    toneType = 'Reverb';
                    effectOptions = { roomSize: 0.3, wet: 0.2 };
                    break;
                case 'filter':
                case 'lowpass':
                    toneType = 'Filter';
                    effectOptions = { frequency: 800, type: 'lowpass', Q: 1 };
                    break;
                case 'highpass':
                    toneType = 'Filter';
                    effectOptions = { frequency: 200, type: 'highpass', Q: 1 };
                    break;
                case 'bandpass':
                    toneType = 'Filter';
                    effectOptions = { frequency: 600, type: 'bandpass', Q: 2 };
                    break;
                case 'compressor':
                    toneType = 'Compressor';
                    effectOptions = { threshold: -18, ratio: 6, attack: 0.01, release: 0.1 };
                    break;
                default:
                    console.warn(`⚠️ AudioEngine: 未知のエフェクトタイプ: ${effectType}`);
                    return null;
            }
            
            const effectResult = this.audioCore.createToneObject(
                toneType, 
                effectOptions, 
                `effect_${effectType}_${parentName}`
            );
            
            if (effectResult.success) {
                return effectResult.object;
            } else {
                throw new Error(effectResult.error);
            }
            
        } catch (error) {
            console.error(`❌ AudioEngine: ${effectType}エフェクト作成失敗:`, error);
            return null;
        }
    }
    
    /**
     * 音響再生（統一API）
     */
    async playSound(instrumentName, note = 'C4', duration = 0.5, intensity = 1.0) {
        try {
            if (!this.isInitialized || !this.isRunning) {
                throw new Error('AudioEngine not ready');
            }
            
            // リソース制限チェック
            if (this.performance.activeSounds >= this.processingConfig.maxVoices) {
                if (this.processingConfig.voiceStealingEnabled) {
                    this.stealOldestVoice();
                } else {
                    console.warn('🚨 AudioEngine: 最大ボイス数に達しました');
                    return { success: false, reason: 'voice_limit_reached' };
                }
            }
            
            // 楽器取得
            let instrumentInfo = this.instruments.get(instrumentName);
            if (!instrumentInfo) {
                // 楽器が存在しない場合は作成
                await this.createInstrument(instrumentName);
                instrumentInfo = this.instruments.get(instrumentName);
            }
            
            if (!instrumentInfo) {
                throw new Error(`Failed to create instrument: ${instrumentName}`);
            }
            
            const instrument = instrumentInfo.instrument;
            
            // 音量調整
            const adjustedVolume = Math.max(0, Math.min(1, intensity));
            
            // 音響再生
            const soundId = `${instrumentName}_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
            
            // パフォーマンス追跡
            this.performance.activeSounds++;
            instrumentInfo.lastUsed = Date.now();
            instrumentInfo.playCount++;
            
            // 楽器タイプに応じた再生
            if (instrument.triggerAttackRelease) {
                // シンセ系楽器
                instrument.triggerAttackRelease(note, duration, '+0', adjustedVolume);
            } else if (instrument.start) {
                // ノイズシンセ・プレイヤー系
                instrument.start();
                instrument.stop(`+${duration}`);
            }
            
            // 自動クリーンアップスケジュール
            setTimeout(() => {
                this.performance.activeSounds = Math.max(0, this.performance.activeSounds - 1);
            }, duration * 1000 + 100);
            
            console.log(`🎵 AudioEngine: ${instrumentName} 再生 (${note}, ${duration}s, ${(adjustedVolume*100).toFixed(1)}%)`);
            
            return { 
                success: true, 
                soundId, 
                instrument: instrumentName,
                note,
                duration,
                intensity: adjustedVolume
            };
            
        } catch (error) {
            console.error(`❌ AudioEngine: ${instrumentName} 再生失敗:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 古いボイスのスティール
     */
    stealOldestVoice() {
        // 最も古い楽器の強制停止
        let oldestInstrument = null;
        let oldestTime = Infinity;
        
        for (const [name, info] of this.instruments.entries()) {
            if (info.lastUsed < oldestTime) {
                oldestTime = info.lastUsed;
                oldestInstrument = info;
            }
        }
        
        if (oldestInstrument && oldestInstrument.instrument.releaseAll) {
            oldestInstrument.instrument.releaseAll();
            this.performance.activeSounds = Math.max(0, this.performance.activeSounds - 1);
            console.log('🔄 AudioEngine: ボイススティーリング実行');
        }
    }
    
    /**
     * 楽器音量調整
     */
    setInstrumentVolume(instrumentName, volume) {
        const instrumentInfo = this.instruments.get(instrumentName);
        if (instrumentInfo && instrumentInfo.instrument.volume) {
            const dbVolume = 20 * Math.log10(Math.max(0.001, volume));
            instrumentInfo.instrument.volume.setValueAtTime(
                dbVolume, 
                this.audioCore.audioContext.currentTime
            );
            console.log(`🎚️ AudioEngine: ${instrumentName} 音量設定 ${(volume*100).toFixed(1)}%`);
        }
    }
    
    /**
     * エンジン統計取得
     */
    getEngineStats() {
        const instrumentStats = {};
        for (const [name, info] of this.instruments.entries()) {
            instrumentStats[name] = {
                playCount: info.playCount,
                lastUsed: Date.now() - info.lastUsed,
                effectChainLength: info.effectChain.length
            };
        }
        
        return {
            status: this.isRunning ? 'Running' : 'Stopped',
            performance: this.performance,
            instruments: {
                count: this.instruments.size,
                templates: this.instrumentTemplates.size,
                stats: instrumentStats
            },
            effects: {
                masterChain: this.effectChains.has('master'),
                totalEffects: Array.from(this.instruments.values())
                    .reduce((sum, info) => sum + info.effectChain.length, 0)
            },
            audioCore: this.audioCore.getContextState()
        };
    }
    
    /**
     * エンジン停止
     */
    stop() {
        this.isRunning = false;
        
        // 全楽器の音を停止
        for (const instrumentInfo of this.instruments.values()) {
            try {
                if (instrumentInfo.instrument.releaseAll) {
                    instrumentInfo.instrument.releaseAll();
                }
            } catch (error) {
                console.warn('⚠️ AudioEngine: 楽器停止エラー:', error);
            }
        }
        
        this.performance.activeSounds = 0;
        console.log('⏸️ AudioEngine: エンジン停止');
    }
    
    /**
     * エンジン再開
     */
    start() {
        if (this.isInitialized) {
            this.isRunning = true;
            console.log('▶️ AudioEngine: エンジン再開');
        }
    }
    
    /**
     * システムクリーンアップ
     */
    dispose() {
        console.log('🧹 AudioEngine: システムクリーンアップ開始');
        
        this.stop();
        
        try {
            // 全楽器破棄
            for (const instrumentInfo of this.instruments.values()) {
                try {
                    instrumentInfo.instrument.dispose();
                    instrumentInfo.effectChain.forEach(effect => effect.dispose());
                } catch (error) {
                    console.warn('⚠️ AudioEngine: 楽器破棄エラー:', error);
                }
            }
            this.instruments.clear();
            
            // エフェクトチェーン破棄
            for (const effectChain of this.effectChains.values()) {
                for (const effect of Object.values(effectChain)) {
                    try {
                        effect.dispose();
                    } catch (error) {
                        console.warn('⚠️ AudioEngine: エフェクト破棄エラー:', error);
                    }
                }
            }
            this.effectChains.clear();
            
            this.isInitialized = false;
            this.isRunning = false;
            
            console.log('✅ AudioEngine: システムクリーンアップ完了');
            
        } catch (error) {
            console.error('❌ AudioEngine: クリーンアップエラー:', error);
        }
    }
}