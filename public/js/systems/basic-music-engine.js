/**
 * BasicMusicEngine - Phase 2.1 基本音楽再生エンジン
 * 
 * 🎯 目的: シンプルで確実な音楽再生システム
 * 📐 設計: 最小限・高安定性・Phase 1 基盤活用
 * 🛡️ Phase 2.1: 基本音楽再生（95%成功確率）
 */

import { FoundationAudioAPI } from './foundation-audio-api.js';

export class BasicMusicEngine extends FoundationAudioAPI {
    constructor() {
        super();
        
        // 音楽エンジン状態
        this.isPlaying = false;
        this.isPaused = false;
        this.currentTempo = 120; // BPM
        this.currentKey = 'C'; // 音楽キー
        
        // 楽器システム
        this.instruments = {
            leadSynth: null,
            bassSynth: null,
            padSynth: null
        };
        
        // 音楽パターン
        this.patterns = {
            melody: [],
            bass: [],
            currentPattern: 'simple'
        };
        
        // 再生制御
        this.sequencer = null;
        this.transport = null;
        
        // パフォーマンス監視
        this.performanceStats = {
            latency: 0,
            cpuUsage: 0,
            memoryUsage: 0,
            droppedNotes: 0
        };
        
        console.log('🎼 BasicMusicEngine: Phase 2.1 初期化');
    }
    
    /**
     * 音楽エンジン初期化
     * Phase 2.1: シンプルで確実な楽器セットアップ
     */
    async initializeMusicEngine() {
        const startTime = performance.now();
        
        try {
            console.log('🚀 BasicMusicEngine: 楽器システム初期化開始');
            
            // Phase 1 基盤初期化
            const foundationResult = await this.initialize();
            if (!foundationResult.success) {
                throw new Error(`Foundation initialization failed: ${foundationResult.error}`);
            }
            
            // Tone.js Transport セットアップ
            await this.setupTransport();
            
            // 基本楽器作成
            await this.createBasicInstruments();
            
            // 音楽パターン初期化
            this.initializeBasicPatterns();
            
            const initTime = performance.now() - startTime;
            console.log(`✅ BasicMusicEngine: 初期化完了 (${initTime.toFixed(2)}ms)`);
            
            return { success: true, latency: initTime };
            
        } catch (error) {
            this.recordError('music_engine_init', error);
            console.error('❌ BasicMusicEngine: 初期化失敗:', error);
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Tone.js Transport 安全セットアップ
     */
    async setupTransport() {
        try {
            // Transport 基本設定
            if (typeof Tone !== 'undefined' && Tone.Transport) {
                this.transport = Tone.Transport;
                this.transport.bpm.value = this.currentTempo;
                this.transport.timeSignature = 4; // 4/4拍子
                
                console.log('🎵 Transport configured:', {
                    bpm: this.transport.bpm.value,
                    timeSignature: this.transport.timeSignature,
                    state: this.transport.state
                });
            } else {
                throw new Error('Tone.Transport not available');
            }
        } catch (error) {
            throw new Error(`Transport setup failed: ${error.message}`);
        }
    }
    
    /**
     * 基本楽器作成
     * Phase 2.1: シンプルで確実な楽器（エラー許容設計）
     */
    async createBasicInstruments() {
        try {
            // Lead Synth - メロディー用
            this.instruments.leadSynth = new Tone.Synth({
                oscillator: {
                    type: 'triangle'
                },
                envelope: {
                    attack: 0.1,
                    decay: 0.2,
                    sustain: 0.3,
                    release: 1
                }
            }).toDestination();
            
            // Bass Synth - ベース用
            this.instruments.bassSynth = new Tone.Synth({
                oscillator: {
                    type: 'sawtooth'
                },
                envelope: {
                    attack: 0.1,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 1.2
                },
                filter: {
                    frequency: 400,
                    type: 'lowpass'
                }
            }).toDestination();
            
            // Pad Synth - 背景和音用
            this.instruments.padSynth = new Tone.PolySynth(Tone.Synth, {
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.5,
                    decay: 0.1,
                    sustain: 0.8,
                    release: 2
                }
            }).toDestination();
            
            // 音量調整（安全レベル）
            this.instruments.leadSynth.volume.value = -10; // 控えめ音量
            this.instruments.bassSynth.volume.value = -12; // さらに控えめ
            this.instruments.padSynth.volume.value = -15;  // 背景レベル
            
            console.log('🎹 Basic instruments created:', {
                leadSynth: !!this.instruments.leadSynth,
                bassSynth: !!this.instruments.bassSynth,
                padSynth: !!this.instruments.padSynth,
                volumes: {
                    lead: this.instruments.leadSynth.volume.value,
                    bass: this.instruments.bassSynth.volume.value,
                    pad: this.instruments.padSynth.volume.value
                }
            });
            
        } catch (error) {
            throw new Error(`Instrument creation failed: ${error.message}`);
        }
    }
    
    /**
     * 基本音楽パターン初期化
     * Phase 2.1: シンプルなテストパターン
     */
    initializeBasicPatterns() {
        try {
            // シンプルなメロディーパターン（Cメジャー）
            this.patterns.melody = [
                { note: 'C4', time: '0:0:0', duration: '4n' },
                { note: 'E4', time: '0:1:0', duration: '4n' },
                { note: 'G4', time: '0:2:0', duration: '4n' },
                { note: 'C5', time: '0:3:0', duration: '4n' },
                { note: 'G4', time: '1:0:0', duration: '4n' },
                { note: 'E4', time: '1:1:0', duration: '4n' },
                { note: 'C4', time: '1:2:0', duration: '2n' }
            ];
            
            // シンプルなベースパターン
            this.patterns.bass = [
                { note: 'C2', time: '0:0:0', duration: '2n' },
                { note: 'F2', time: '0:2:0', duration: '2n' },
                { note: 'G2', time: '1:0:0', duration: '2n' },
                { note: 'C2', time: '1:2:0', duration: '2n' }
            ];
            
            console.log('🎼 Basic patterns initialized:', {
                melodyNotes: this.patterns.melody.length,
                bassNotes: this.patterns.bass.length,
                patternLength: '2 measures'
            });
            
        } catch (error) {
            console.warn('⚠️ Pattern initialization failed:', error);
            // フォールバック: 空パターン
            this.patterns.melody = [];
            this.patterns.bass = [];
        }
    }
    
    /**
     * 基本BGM再生開始
     * Phase 2.1: シンプルで確実な再生
     */
    async playSimpleBGM() {
        try {
            if (this.isPlaying) {
                console.log('🎵 BGM already playing');
                return { success: true, message: 'already_playing' };
            }
            
            console.log('🚀 BasicMusicEngine: BGM再生開始');
            
            // 楽器チェック
            if (!this.instruments.leadSynth || !this.instruments.bassSynth) {
                throw new Error('Instruments not initialized');
            }
            
            // Transport開始前チェック
            if (this.transport.state === 'stopped') {
                this.transport.start();
            }
            
            // メロディーシーケンス
            this.schedulePattern(this.instruments.leadSynth, this.patterns.melody);
            
            // ベースシーケンス
            this.schedulePattern(this.instruments.bassSynth, this.patterns.bass);
            
            this.isPlaying = true;
            this.isPaused = false;
            
            console.log('✅ BGM playback started');
            return { success: true, message: 'bgm_started' };
            
        } catch (error) {
            this.recordError('bgm_play', error);
            console.error('❌ BGM playback failed:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * パターン自動スケジューリング
     */
    schedulePattern(instrument, pattern) {
        try {
            pattern.forEach(note => {
                this.transport.schedule(() => {
                    instrument.triggerAttackRelease(note.note, note.duration);
                }, note.time);
            });
            
            // 2小節後にループ
            this.transport.schedule(() => {
                this.transport.stop();
                this.transport.start();
                this.schedulePattern(instrument, pattern);
            }, '2:0:0');
            
        } catch (error) {
            console.warn('⚠️ Pattern scheduling failed:', error);
        }
    }
    
    /**
     * BGM一時停止
     */
    pauseBGM() {
        try {
            if (this.transport && this.isPlaying) {
                this.transport.pause();
                this.isPaused = true;
                console.log('⏸️ BGM paused');
                return { success: true };
            }
            return { success: false, error: 'not_playing' };
        } catch (error) {
            this.recordError('bgm_pause', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM再開
     */
    resumeBGM() {
        try {
            if (this.transport && this.isPaused) {
                this.transport.start();
                this.isPaused = false;
                console.log('▶️ BGM resumed');
                return { success: true };
            }
            return { success: false, error: 'not_paused' };
        } catch (error) {
            this.recordError('bgm_resume', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM停止
     */
    stopBGM() {
        try {
            if (this.transport) {
                this.transport.stop();
                this.transport.cancel(); // 全スケジュールクリア
                this.isPlaying = false;
                this.isPaused = false;
                console.log('⏹️ BGM stopped');
                return { success: true };
            }
            return { success: false, error: 'transport_not_available' };
        } catch (error) {
            this.recordError('bgm_stop', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * システム状態取得
     */
    getEngineStatus() {
        return {
            initialized: this.isInitialized,
            ready: this.isReady,
            playing: this.isPlaying,
            paused: this.isPaused,
            tempo: this.currentTempo,
            key: this.currentKey,
            instruments: {
                leadSynth: !!this.instruments.leadSynth,
                bassSynth: !!this.instruments.bassSynth,
                padSynth: !!this.instruments.padSynth
            },
            transport: this.transport ? this.transport.state : 'not_available',
            performance: this.performanceStats
        };
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        try {
            this.stopBGM();
            
            // 楽器リソース解放
            Object.keys(this.instruments).forEach(key => {
                if (this.instruments[key] && typeof this.instruments[key].dispose === 'function') {
                    this.instruments[key].dispose();
                    this.instruments[key] = null;
                }
            });
            
            console.log('🧹 BasicMusicEngine: リソース解放完了');
        } catch (error) {
            console.error('❌ BasicMusicEngine dispose error:', error);
        }
    }
}