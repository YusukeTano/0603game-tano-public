/**
 * ModernBGMEngine - 9ステージ対応モダンBGMシステム
 * Future Synthwave・Cyberpop・Electronic Danceミュージック
 * 完全統合版: SynthFactory + RhythmEngine + StageThemes + ProgressionGenerator
 */
import { SynthFactory } from './synth-factory.js';
import { RhythmEngine } from './rhythm-engine.js';
import { StageThemes } from './stage-themes.js';
import { ProgressionGenerator } from './progression-generator.js';

export class ModernBGMEngine {
    constructor(game) {
        this.game = game;
        
        // Audio Core
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.isPlaying = false;
        
        // Integrated Music Systems (これが不足していた！)
        this.synthFactory = null;        // 高品質楽器システム
        this.rhythmEngine = null;        // ドラム・リズムシステム
        this.stageThemes = null;         // 9ステージテーマシステム
        this.progressionGen = null;      // 音楽理論・コード進行システム
        
        // Music State
        this.currentStage = 1;
        this.currentTheme = null;
        this.activeInstruments = new Map();
        this.sequencer = null;           // 時間ベースシーケンサー
        
        // Pause/Resume System
        this.isPaused = false;
        this.pausedState = null;         // 一時停止時の状態保存
        
        // Music Timing
        this.bpm = 120;
        this.currentBeat = 0;
        this.nextBeatTime = 0;
        this.lookAhead = 25.0;           // 25ms先読みスケジューリング
        this.scheduleInterval = null;
        
        // Volume Settings
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.3,      // BGM音量を下げる (0.6 → 0.3)
            intensity: 0.5
        };
        
        // Performance Control
        this.maxPolyphony = 32;          // 増加: リッチなサウンド用
        this.updateInterval = 50;        // 50ms更新（より精密）
        this.lastUpdate = 0;
        
        console.log('🎵 ModernBGMEngine: Advanced integrated music system initialized');
    }
    
    /**
     * システム初期化 - 全サブシステム統合
     */
    async initialize() {
        try {
            // AudioContext作成
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // 音楽システム初期化 (これが重要！)
            this.synthFactory = new SynthFactory(this.audioContext);
            this.rhythmEngine = new RhythmEngine(this.audioContext);
            this.stageThemes = new StageThemes();
            this.progressionGen = new ProgressionGenerator();
            
            // シーケンサー初期化
            this.initializeSequencer();
            
            // 初期音量設定
            this.updateMasterVolume();
            
            // 自動復帰システム
            this.setupAutoResume();
            
            this.isInitialized = true;
            console.log('🎵 ModernBGMEngine: Complete music system initialized');
            console.log('🎹 Synthesizers:', Object.keys(this.synthFactory.presets));
            console.log('🥁 Rhythm patterns ready for 9 genres');
            console.log('🎶 Stage themes loaded:', this.stageThemes.getAllThemes().length);
            
            return true;
            
        } catch (error) {
            console.error('🎵 ModernBGMEngine: Initialization failed', error);
            return false;
        }
    }
    
    /**
     * シーケンサー初期化
     */
    initializeSequencer() {
        this.sequencer = {
            isRunning: false,
            currentBar: 0,
            currentBeat: 0,
            nextNoteTime: 0,
            tempo: 120,
            timeSignature: 4, // 4/4拍子
            scheduleAheadTime: 25.0, // 25ms先読み
            noteResolution: 0.25 // 16分音符解像度
        };
        
        console.log('🎵 Sequencer initialized for real-time music scheduling');
    }
    
    /**
     * AudioContext自動復帰
     */
    setupAutoResume() {
        const resumeAudioContext = async () => {
            if (this.audioContext.state === 'suspended') {
                try {
                    await this.audioContext.resume();
                    console.log('🎵 ModernBGMEngine: AudioContext resumed');
                } catch (error) {
                    console.warn('🎵 ModernBGMEngine: Failed to resume AudioContext', error);
                }
            }
        };
        
        // ユーザーインタラクション検出
        const events = ['click', 'touchstart', 'keydown'];
        events.forEach(event => {
            document.addEventListener(event, resumeAudioContext, { once: false, passive: true });
        });
    }
    
    /**
     * ステージ音楽開始 - 完全統合版
     * @param {number} stageNumber - ステージ番号 (1-9)
     */
    async playStage(stageNumber) {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        // AudioContext確認・再開
        await this.resumeAudioContext();
        
        // ステージ範囲チェック
        const stage = Math.max(1, Math.min(9, stageNumber));
        
        if (this.currentStage === stage && this.isPlaying) {
            console.log(`🎵 ModernBGMEngine: Already playing stage ${stage}`);
            return true;
        }
        
        // 前の音楽を停止
        this.stopCurrentMusic();
        
        // StageThemesから完全なテーマ設定を取得
        this.currentStage = stage;
        this.currentTheme = this.stageThemes.getTheme(stage);
        this.bpm = this.currentTheme.bpm;
        
        console.log(`🎵 ModernBGMEngine: Starting ${this.currentTheme.name} (${this.currentTheme.genre}) at ${this.bpm} BPM`);
        console.log(`🎶 Key: ${this.currentTheme.key}, Progression: ${this.currentTheme.progression.join(' → ')}`);
        
        // 音楽開始 - リアルタイムシーケンサー使用
        await this.startAdvancedMusic();
        
        this.isPlaying = true;
        return true;
    }
    
    /**
     * AudioContext再開
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
            } catch (error) {
                console.error('🎵 ModernBGMEngine: Failed to resume AudioContext:', error);
            }
        }
    }
    
    /**
     * 高度音楽システム開始
     */
    async startAdvancedMusic() {
        if (!this.currentTheme) return;
        
        // RhythmEngineでドラムパターン開始
        const drumPattern = this.getDrumPatternForGenre(this.currentTheme.genre);
        this.rhythmEngine.startPattern(this.currentTheme.genre, drumPattern, this.bpm);
        
        // シーケンサー開始
        this.startSequencer();
        
        // 楽器を段階的に追加
        this.scheduleInstrumentIntroduction();
        
        console.log(`🎵 Advanced music started: ${this.currentTheme.name}`);
        console.log(`🥁 Drums: ${drumPattern}, 🎹 Instruments: ${Object.keys(this.currentTheme.instruments).length}`);
    }
    
    /**
     * ジャンル別ドラムパターン取得
     */
    getDrumPatternForGenre(genre) {
        const patternMap = {
            'Future Pop': 'soft_four_on_floor',
            'Synthwave': 'retro_beat',
            'Electro House': 'four_on_floor_hard',
            'Tech House': 'tech_groove',
            'Future Bass': 'future_trap',
            'Hardstyle': 'hardstyle_kick',
            'Ambient Techno': 'minimal_techno',
            'Epic Synthwave': 'epic_drums',
            'Uplifting Trance': 'trance_beat'
        };
        
        return patternMap[genre] || 'soft_four_on_floor';
    }
    
    /**
     * シーケンサー開始
     */
    startSequencer() {
        this.sequencer.isRunning = true;
        this.sequencer.tempo = this.bpm;
        this.sequencer.nextNoteTime = this.audioContext.currentTime;
        this.sequencer.currentBeat = 0;
        this.sequencer.currentBar = 0;
        
        this.scheduleNotes();
    }
    
    /**
     * 音符スケジューリング (25ms先読み)
     */
    scheduleNotes() {
        if (!this.sequencer.isRunning) return;
        
        const secondsPerBeat = 60.0 / this.sequencer.tempo;
        const secondsPerNote = secondsPerBeat * this.sequencer.noteResolution;
        
        while (this.sequencer.nextNoteTime < this.audioContext.currentTime + this.sequencer.scheduleAheadTime / 1000) {
            this.playScheduledNote(this.sequencer.nextNoteTime);
            
            this.sequencer.nextNoteTime += secondsPerNote;
            this.sequencer.currentBeat += this.sequencer.noteResolution;
            
            if (this.sequencer.currentBeat >= this.sequencer.timeSignature) {
                this.sequencer.currentBeat = 0;
                this.sequencer.currentBar++;
            }
        }
        
        requestAnimationFrame(() => this.scheduleNotes());
    }
    
    /**
     * スケジュールされた音符再生
     */
    playScheduledNote(when) {
        if (!this.currentTheme) return;
        
        const beatInBar = this.sequencer.currentBeat;
        const bar = this.sequencer.currentBar;
        const chordIndex = Math.floor(bar / 4) % this.currentTheme.progression.length;
        const currentChord = this.currentTheme.progression[chordIndex];
        
        // 拍の強弱に応じて楽器を演奏
        if (beatInBar % 1 === 0) { // 強拍でベース
            this.playBassNote(currentChord, when);
        }
        
        if (beatInBar % 0.5 === 0) { // 8分音符でパッド
            this.playPadChord(currentChord, when);
        }
        
        if (beatInBar % 0.25 === 0) { // 16分音符でアルペジオ/リード
            this.playMelodyNote(currentChord, when, beatInBar);
        }
    }
    
    /**
     * ベース音符演奏
     */
    playBassNote(chord, when) {
        const instrument = this.getInstrumentForTheme('bass');
        
        // コード名から周波数を取得
        const bassNote = chord + '2'; // ベース音域
        const frequency = this.synthFactory.getFrequency(bassNote);
        const duration = 60 / this.bpm; // 1拍分
        
        this.synthFactory.createInstrument(instrument, frequency, duration, 0.7);
    }
    
    /**
     * パッドコード演奏
     */
    playPadChord(chord, when) {
        const instrument = this.getInstrumentForTheme('pad');
        const frequencies = this.synthFactory.getChordFrequencies(chord, 4);
        const duration = (60 / this.bpm) * 2; // 2拍分のサスティン
        
        this.synthFactory.playChord(instrument, frequencies, duration, 0.4);
    }
    
    /**
     * メロディ音符演奏
     */
    playMelodyNote(chord, when, beat) {
        const instrument = this.getInstrumentForTheme('lead');
        
        // ProgressionGeneratorを使用してスケール取得
        const scale = this.progressionGen.getScale(this.currentTheme.key, 'major', 5);
        const noteIndex = Math.floor(beat * 4) % scale.length;
        const frequency = scale[noteIndex];
        const duration = 60 / this.bpm * 0.25; // 16分音符
        
        this.synthFactory.createInstrument(instrument, frequency, duration, 0.5);
    }
    
    /**
     * テーマ用楽器取得
     */
    getInstrumentForTheme(type) {
        const themeInstruments = this.currentTheme.instruments;
        
        switch (type) {
            case 'lead':
                return themeInstruments.lead?.type || 'leadSynth';
            case 'bass':
                return themeInstruments.bass?.type || 'subBass';
            case 'pad':
                return themeInstruments.pad?.type || 'neonPad';
            default:
                return 'leadSynth';
        }
    }
    
    /**
     * 楽器段階的導入
     */
    scheduleInstrumentIntroduction() {
        const instruments = Object.keys(this.currentTheme.instruments);
        
        instruments.forEach((instrument, index) => {
            const delay = index * 8000; // 8秒間隔で楽器追加
            setTimeout(() => {
                console.log(`🎹 Adding instrument: ${instrument}`);
                // 楽器固有の演奏パターンを追加可能
            }, delay);
        });
    }
    
    /**
     * 現在の音楽停止
     */
    stopCurrentMusic() {
        // シーケンサー停止
        if (this.sequencer) {
            this.sequencer.isRunning = false;
        }
        
        // RhythmEngine停止
        if (this.rhythmEngine) {
            this.rhythmEngine.stop();
        }
        
        // アクティブ楽器停止
        this.activeInstruments.forEach((instrument, name) => {
            try {
                const now = this.audioContext.currentTime;
                
                // フェードアウト
                if (instrument.gainNode) {
                    instrument.gainNode.gain.setTargetAtTime(0, now, 0.5);
                }
                
                // 1秒後に停止
                setTimeout(() => {
                    if (instrument.oscillator && instrument.oscillator.stop) {
                        instrument.oscillator.stop();
                    }
                }, 1000);
                
            } catch (error) {
                console.warn(`🎵 Error stopping instrument ${name}:`, error);
            }
        });
        
        this.activeInstruments.clear();
        this.isPlaying = false;
        
        console.log('🎵 ModernBGMEngine: Advanced music stopped');
    }
    
    /**
     * 楽器音量計算
     * @param {string} instrumentName - 楽器名
     * @returns {number} 音量値
     */
    calculateInstrumentVolume(instrumentName) {
        const baseVolume = this.volumeSettings.master * this.volumeSettings.bgm;
        
        // テーマからの音量情報を使用
        if (this.currentTheme && this.currentTheme.instruments) {
            const instrumentConfig = Object.values(this.currentTheme.instruments)
                .find(inst => inst.type === instrumentName);
            
            if (instrumentConfig && instrumentConfig.volume) {
                return baseVolume * instrumentConfig.volume;
            }
        }
        
        // フォールバック: 楽器別デフォルト音量
        const instrumentVolumes = {
            'leadSynth': 0.3,
            'subBass': 0.4,
            'softDrums': 0.2,
            'neonPad': 0.15,
            'arpSynth': 0.25,
            'reeseBass': 0.35,
            'synthDrums': 0.3,
            'pluckLead': 0.4,
            'bigBass': 0.5,
            'wobbleLead': 0.4,
            'supersawLead': 0.5,
            'ambientLead': 0.25,
            'epicLead': 0.5,
            'tranceLead': 0.5
        };
        
        const instrumentVolume = instrumentVolumes[instrumentName] || 0.2;
        return baseVolume * instrumentVolume;
    }
    
    /**
     * BGM一時停止
     */
    pause() {
        if (!this.isPlaying || this.isPaused) {
            console.log('🎵 ModernBGMEngine: Already paused or not playing');
            return false;
        }
        
        console.log('⏸️ ModernBGMEngine: Pausing BGM...');
        
        // 現在の状態を保存
        this.pausedState = {
            currentStage: this.currentStage,
            currentTheme: this.currentTheme,
            bpm: this.bpm,
            sequencerState: {
                currentBeat: this.sequencer?.currentBeat || 0,
                currentBar: this.sequencer?.currentBar || 0,
                tempo: this.sequencer?.tempo || 120
            },
            activeInstruments: new Map(this.activeInstruments),
            volumeSettings: { ...this.volumeSettings }
        };
        
        // 音量を段階的に下げる
        this.fadeOutMusic();
        
        // シーケンサー停止
        if (this.sequencer) {
            this.sequencer.isRunning = false;
        }
        
        // RhythmEngine一時停止
        if (this.rhythmEngine) {
            this.rhythmEngine.stop();
        }
        
        this.isPaused = true;
        console.log('⏸️ ModernBGMEngine: BGM paused successfully');
        return true;
    }
    
    /**
     * BGM再開
     */
    resume() {
        if (!this.isPaused || !this.pausedState) {
            console.log('🎵 ModernBGMEngine: Not paused or no saved state');
            return false;
        }
        
        console.log('▶️ ModernBGMEngine: Resuming BGM...');
        
        // AudioContext再開
        this.resumeAudioContext();
        
        // 保存された状態を復元
        this.currentStage = this.pausedState.currentStage;
        this.currentTheme = this.pausedState.currentTheme;
        this.bpm = this.pausedState.bpm;
        this.volumeSettings = { ...this.pausedState.volumeSettings };
        
        // シーケンサー状態復元
        if (this.sequencer && this.pausedState.sequencerState) {
            this.sequencer.currentBeat = this.pausedState.sequencerState.currentBeat;
            this.sequencer.currentBar = this.pausedState.sequencerState.currentBar;
            this.sequencer.tempo = this.pausedState.sequencerState.tempo;
            this.sequencer.nextNoteTime = this.audioContext.currentTime;
        }
        
        // 音楽システム再開
        setTimeout(() => {
            this.restartMusicSystems();
        }, 100); // 100ms後に開始
        
        this.isPaused = false;
        this.pausedState = null;
        
        console.log('▶️ ModernBGMEngine: BGM resumed successfully');
        return true;
    }
    
    /**
     * 音楽フェードアウト
     */
    fadeOutMusic() {
        if (!this.masterGain) return;
        
        const now = this.audioContext.currentTime;
        const fadeTime = 0.5; // 0.5秒でフェードアウト
        
        this.masterGain.gain.setTargetAtTime(0, now, fadeTime / 3);
        
        // フェードアウト完了後に楽器停止
        setTimeout(() => {
            this.stopActiveInstruments();
        }, fadeTime * 1000);
    }
    
    /**
     * 音楽システム再開
     */
    restartMusicSystems() {
        if (!this.currentTheme) return;
        
        console.log(`🎵 Restarting: ${this.currentTheme.name}`);
        
        // 音量復元
        this.updateMasterVolume();
        
        // RhythmEngine再開
        const drumPattern = this.getDrumPatternForGenre(this.currentTheme.genre);
        this.rhythmEngine.startPattern(this.currentTheme.genre, drumPattern, this.bpm);
        
        // シーケンサー再開
        this.startSequencer();
        
        // 楽器段階的導入（短縮版）
        this.scheduleQuickInstrumentIntroduction();
    }
    
    /**
     * アクティブ楽器停止
     */
    stopActiveInstruments() {
        this.activeInstruments.forEach((instrument, name) => {
            try {
                if (instrument.oscillator && instrument.oscillator.stop) {
                    instrument.oscillator.stop();
                }
            } catch (error) {
                console.warn(`🎵 Error stopping instrument ${name}:`, error);
            }
        });
        
        this.activeInstruments.clear();
    }
    
    /**
     * 楽器クイック導入（再開時用）
     */
    scheduleQuickInstrumentIntroduction() {
        const instruments = Object.keys(this.currentTheme.instruments);
        
        instruments.forEach((instrument, index) => {
            const delay = index * 1000; // 1秒間隔（通常の8秒から短縮）
            setTimeout(() => {
                console.log(`🎹 Re-adding instrument: ${instrument}`);
            }, delay);
        });
    }
    
    /**
     * 音楽停止
     */
    stop() {
        this.stopCurrentMusic();
        
        // 一時停止状態もクリア
        this.isPaused = false;
        this.pausedState = null;
        
        console.log('🎵 ModernBGMEngine: Music stopped');
    }
    
    /**
     * 音量設定
     * @param {string} type - 音量タイプ
     * @param {number} volume - 音量値 (0.0-1.0)
     */
    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        
        if (type === 'master' || type === 'bgm') {
            this.updateMasterVolume();
        }
        
        console.log(`🎵 ModernBGMEngine: Volume set - ${type}: ${volume}`);
    }
    
    /**
     * マスター音量更新
     */
    updateMasterVolume() {
        if (this.masterGain) {
            const finalVolume = this.volumeSettings.master * this.volumeSettings.bgm;
            this.masterGain.gain.setTargetAtTime(finalVolume, this.audioContext.currentTime, 0.1);
        }
    }
    
    /**
     * ゲームイベント通知
     * @param {string} eventType - イベント種別
     * @param {Object} data - イベントデータ
     */
    onGameEvent(eventType, data = {}) {
        // 将来の動的音楽変化用
        console.log(`🎵 ModernBGMEngine: Game event received - ${eventType}`);
    }
    
    /**
     * インテンシティ設定
     * @param {number} intensity - インテンシティ (0.0-1.0)
     */
    setIntensity(intensity) {
        this.volumeSettings.intensity = Math.max(0, Math.min(1, intensity));
        // 将来の動的音楽変化用
    }
    
    /**
     * システム更新
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isPlaying) return;
        
        const now = performance.now();
        if (now - this.lastUpdate < this.updateInterval) return;
        
        this.lastUpdate = now;
        
        // 楽器の状態チェック・更新
        this.updateInstruments();
    }
    
    /**
     * 楽器状態更新
     */
    updateInstruments() {
        // 将来の動的音楽変化・リズムパターン更新用
        // 現在は基本状態維持
    }
    
    /**
     * システム破棄
     */
    dispose() {
        this.stop();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('🎵 ModernBGMEngine: Disposed');
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            currentStage: this.currentStage,
            currentTheme: this.currentTheme?.name || 'None',
            activeInstruments: Array.from(this.activeInstruments.keys()),
            volumeSettings: this.volumeSettings,
            audioContextState: this.audioContext?.state
        };
    }
}