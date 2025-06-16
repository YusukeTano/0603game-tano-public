/**
 * BGMController - 新世代BGMシステムの中央制御
 * 2024年最新アーキテクチャ: State Machine + Event-Driven + Component-Based
 */
import { MusicStateMachine } from './music-state-machine.js';
import { InstrumentBank } from './instrument-bank.js';
import { TransitionEngine } from './transition-engine.js';

export class BGMController {
    constructor(game) {
        this.game = game;
        
        // Core Components
        this.stateMachine = new MusicStateMachine(this);
        this.instrumentBank = new InstrumentBank(this);
        this.transitionEngine = new TransitionEngine(this);
        
        // Audio Core
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.isPlaying = false;
        
        // Game State Tracking
        this.currentStage = 1;
        this.currentIntensity = 0.0;
        this.gameEvents = new Set();
        
        // Performance Monitoring
        this.performanceMetrics = {
            startTime: 0,
            audioContextResumeCount: 0,
            stateTransitions: 0,
            instrumentChanges: 0
        };
        
        // Volume Management
        this.volumeSettings = {
            master: 0.8,
            music: 0.9,  // BGM専用音量（高音量設定）
            sfx: 0.3     // 効果音は低音量
        };
        
        console.log('🎵 BGMController: Initialized with new architecture');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            // AudioContext セットアップ
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // 初期音量設定
            this.updateMasterVolume();
            
            // コンポーネント初期化
            await this.instrumentBank.initialize(this.audioContext);
            this.transitionEngine.initialize();
            this.stateMachine.initialize();
            
            // 自動復帰システム
            this.setupAutoResume();
            
            this.isInitialized = true;
            this.performanceMetrics.startTime = performance.now();
            
            console.log('🎵 BGMController: Initialization completed successfully');
            return true;
            
        } catch (error) {
            console.error('🎵 BGMController: Initialization failed', error);
            return false;
        }
    }
    
    /**
     * AudioContext自動復帰システム
     */
    setupAutoResume() {
        // ユーザーインタラクション検出
        const resumeAudioContext = async () => {
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    this.performanceMetrics.audioContextResumeCount++;
                    console.log('🎵 BGMController: AudioContext resumed automatically');
                } catch (error) {
                    console.warn('🎵 BGMController: Failed to resume AudioContext', error);
                }
            }
        };
        
        // 複数のユーザーインタラクションイベントをリスン
        const interactionEvents = ['click', 'touchstart', 'keydown', 'gamepadconnected'];
        interactionEvents.forEach(event => {
            document.addEventListener(event, resumeAudioContext, { once: false, passive: true });
        });
        
        // 定期的な状態チェック（フォールバック）
        setInterval(() => {
            if (this.isPlaying && this.audioContext.state === 'suspended') {
                resumeAudioContext();
            }
        }, 2000);
    }
    
    /**
     * ステージ音楽開始（メインAPI）
     * @param {number} stageNumber - ステージ番号
     */
    async playStage(stageNumber) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        this.currentStage = stageNumber;
        this.isPlaying = true;
        
        console.log(`🎵 BGMController: Starting Stage ${stageNumber} music`);
        
        // ステージ別音楽設定
        const stageConfig = this.getStageConfiguration(stageNumber);
        
        // 状態遷移開始
        await this.stateMachine.transitionTo(stageConfig.initialState);
        
        // 30秒進化システム開始（ステージ1専用）
        if (stageNumber === 1) {
            this.startStage1Evolution();
        }
        
        return true;
    }
    
    /**
     * ステージ1の30秒音楽進化システム
     */
    startStage1Evolution() {
        const evolutionPhases = [
            { state: 'FOREST_SILENCE', duration: 30000, tempo: 30 },
            { state: 'DANGER_APPROACH', duration: 30000, tempo: 90 },
            { state: 'COMBAT_START', duration: 30000, tempo: 180 },
            { state: 'VICTORY_PATH', duration: 30000, tempo: 150 }
        ];
        
        let currentPhaseIndex = 0;
        
        const evolveMusic = () => {
            if (!this.isPlaying || this.currentStage !== 1) return;
            
            const phase = evolutionPhases[currentPhaseIndex];
            if (phase) {
                console.log(`🎵 BGMController: Evolving to ${phase.state} (${phase.tempo} BPM)`);
                this.stateMachine.transitionTo(phase.state, { tempo: phase.tempo });
                
                currentPhaseIndex = (currentPhaseIndex + 1) % evolutionPhases.length;
                setTimeout(evolveMusic, phase.duration);
            }
        };
        
        // 即座に最初のフェーズ開始
        evolveMusic();
    }
    
    /**
     * 音楽停止
     */
    stop() {
        this.isPlaying = false;
        this.instrumentBank.stopAll();
        this.stateMachine.transitionTo('SILENCE');
        console.log('🎵 BGMController: Music stopped');
    }
    
    /**
     * 動的インテンシティ設定
     * @param {number} intensity - インテンシティ (0.0-1.0)
     */
    setIntensity(intensity) {
        this.currentIntensity = Math.max(0, Math.min(1, intensity));
        this.instrumentBank.setGlobalIntensity(this.currentIntensity);
        
        // 高インテンシティ時の自動状態遷移
        if (this.currentIntensity > 0.8 && this.stateMachine.currentState !== 'COMBAT_START') {
            this.stateMachine.transitionTo('COMBAT_START');
        } else if (this.currentIntensity < 0.3 && this.stateMachine.currentState === 'COMBAT_START') {
            this.stateMachine.transitionTo('DANGER_APPROACH');
        }
    }
    
    /**
     * ゲームイベント通知
     * @param {string} eventType - イベント種別
     * @param {Object} data - イベントデータ
     */
    onGameEvent(eventType, data = {}) {
        this.gameEvents.add(eventType);
        
        switch (eventType) {
            case 'ENEMY_SPAWN':
                this.setIntensity(Math.min(1.0, this.currentIntensity + 0.1));
                break;
            case 'ENEMY_DEFEAT':
                this.setIntensity(Math.max(0.0, this.currentIntensity - 0.05));
                break;
            case 'PLAYER_DAMAGE':
                this.setIntensity(Math.min(1.0, this.currentIntensity + 0.2));
                break;
            case 'LEVEL_UP':
                this.transitionEngine.playStinger('LEVEL_UP', 2000);
                break;
            case 'STAGE_COMPLETE':
                this.stateMachine.transitionTo('VICTORY_PATH');
                break;
        }
        
        // イベント履歴クリーンアップ（メモリリーク防止）
        if (this.gameEvents.size > 100) {
            this.gameEvents.clear();
        }
    }
    
    /**
     * 音量設定
     * @param {string} type - 音量タイプ ('master', 'music', 'sfx')
     * @param {number} volume - 音量 (0.0-1.0)
     */
    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        
        if (type === 'master' || type === 'music') {
            this.updateMasterVolume();
        }
        
        console.log(`🎵 BGMController: Volume updated - ${type}: ${this.volumeSettings[type]}`);
    }
    
    /**
     * マスター音量更新
     */
    updateMasterVolume() {
        if (this.masterGain) {
            const finalVolume = this.volumeSettings.master * this.volumeSettings.music;
            this.masterGain.gain.setTargetAtTime(finalVolume, this.audioContext.currentTime, 0.1);
        }
    }
    
    /**
     * ステージ設定取得
     * @param {number} stageNumber - ステージ番号
     * @returns {Object} ステージ設定
     */
    getStageConfiguration(stageNumber) {
        const configurations = {
            1: {
                name: 'Forest Survival',
                initialState: 'FOREST_SILENCE',
                instruments: ['acoustic_guitar', 'ambient_pad', 'nature_sounds'],
                tempo: { min: 30, max: 180 },
                key: 'Am'
            },
            2: {
                name: 'Urban Combat',
                initialState: 'DANGER_APPROACH',
                instruments: ['electric_guitar', 'synth_bass', 'electronic_drums'],
                tempo: { min: 80, max: 200 },
                key: 'Dm'
            }
        };
        
        return configurations[stageNumber] || configurations[1];
    }
    
    /**
     * システム更新（ゲームループから呼び出し）
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isPlaying) return;
        
        // コンポーネント更新
        this.stateMachine.update(deltaTime);
        this.instrumentBank.update(deltaTime);
        this.transitionEngine.update(deltaTime);
        
        // パフォーマンス監視（5秒ごと）
        if (performance.now() - this.performanceMetrics.startTime > 5000) {
            this.logPerformanceMetrics();
            this.performanceMetrics.startTime = performance.now();
        }
    }
    
    /**
     * パフォーマンス指標ログ出力
     */
    logPerformanceMetrics() {
        console.log('🎵 BGMController: Performance Metrics', {
            isPlaying: this.isPlaying,
            currentState: this.stateMachine.currentState,
            currentStage: this.currentStage,
            intensity: this.currentIntensity.toFixed(2),
            audioContextState: this.audioContext?.state,
            resumeCount: this.performanceMetrics.audioContextResumeCount,
            stateTransitions: this.performanceMetrics.stateTransitions,
            instrumentChanges: this.performanceMetrics.instrumentChanges,
            activeInstruments: this.instrumentBank.getActiveInstruments().length
        });
    }
    
    /**
     * システム破棄
     */
    dispose() {
        this.stop();
        if (this.audioContext) {
            this.audioContext.close();
        }
        console.log('🎵 BGMController: Disposed');
    }
}