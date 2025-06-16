/**
 * ModernBGMEngine - 9ステージ対応モダンBGMシステム
 * Future Synthwave・Cyberpop・Electronic Danceミュージック
 */
export class ModernBGMEngine {
    constructor(game) {
        this.game = game;
        
        // Audio Core
        this.audioContext = null;
        this.masterGain = null;
        this.isInitialized = false;
        this.isPlaying = false;
        
        // Stage Management
        this.currentStage = 1;
        this.currentTheme = null;
        this.activeInstruments = new Map();
        
        // Volume Settings
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.6,  // モダンBGMは控えめ音量
            intensity: 0.5
        };
        
        // Performance Control
        this.maxPolyphony = 16; // CPU負荷制御
        this.updateInterval = 100; // 100ms更新間隔
        this.lastUpdate = 0;
        
        console.log('🎵 ModernBGMEngine: Initialized for 9-stage modern music system');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            // AudioContext作成
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // 初期音量設定
            this.updateMasterVolume();
            
            // 自動復帰システム
            this.setupAutoResume();
            
            this.isInitialized = true;
            console.log('🎵 ModernBGMEngine: Initialization completed');
            return true;
            
        } catch (error) {
            console.error('🎵 ModernBGMEngine: Initialization failed', error);
            return false;
        }
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
     * ステージ音楽開始
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
        
        // 新しいステージ音楽を開始
        this.currentStage = stage;
        this.currentTheme = this.getStageTheme(stage);
        
        console.log(`🎵 ModernBGMEngine: Starting ${this.currentTheme.name} for stage ${stage}`);
        
        // 音楽開始
        await this.startThemeMusic();
        
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
     * ステージテーマ取得
     * @param {number} stage - ステージ番号
     * @returns {Object} テーマ設定
     */
    getStageTheme(stage) {
        const themes = {
            1: {
                name: 'Neon Genesis',
                genre: 'Future Pop',
                bpm: 120,
                key: 'C',
                instruments: ['leadSynth', 'subBass', 'softDrums', 'neonPad'],
                progression: ['C', 'Am', 'F', 'G']
            },
            2: {
                name: 'Cyber Highway',
                genre: 'Synthwave',
                bpm: 130,
                key: 'Dm',
                instruments: ['arpSynth', 'reeseBass', 'synthDrums', 'retroPad'],
                progression: ['Dm', 'Bb', 'F', 'C']
            },
            3: {
                name: 'Digital Storm',
                genre: 'Electro House',
                bpm: 140,
                key: 'Em',
                instruments: ['pluckLead', 'bigBass', 'bigRoomKick', 'whiteNoise'],
                progression: ['Em', 'C', 'G', 'D']
            },
            4: {
                name: 'Chrome City',
                genre: 'Tech House',
                bpm: 150,
                key: 'F#m',
                instruments: ['techLead', 'subBass', 'industrialDrums', 'metallicPerc'],
                progression: ['F#m', 'D', 'A', 'E']
            },
            5: {
                name: 'Quantum Dance',
                genre: 'Future Bass',
                bpm: 160,
                key: 'G',
                instruments: ['wobbleLead', 'futureBass', 'trapDrums', 'vocalChops'],
                progression: ['G', 'Em', 'C', 'D']
            },
            6: {
                name: 'Laser Pulse',
                genre: 'Hardstyle',
                bpm: 170,
                key: 'Am',
                instruments: ['supersawLead', 'kickBass', 'hardcoreKick', 'riser'],
                progression: ['Am', 'F', 'C', 'G']
            },
            7: {
                name: 'Binary Dreams',
                genre: 'Ambient Techno',
                bpm: 140,
                key: 'Bb',
                instruments: ['ambientLead', 'deepBass', 'minimaDrums', 'spacePad'],
                progression: ['Bb', 'Gm', 'Eb', 'F']
            },
            8: {
                name: 'Final Protocol',
                genre: 'Epic Synthwave',
                bpm: 180,
                key: 'C#m',
                instruments: ['epicLead', 'orchestralBass', 'hybridDrums', 'cinematic'],
                progression: ['C#m', 'A', 'E', 'B']
            },
            9: {
                name: 'Victory Code',
                genre: 'Uplifting Trance',
                bpm: 175,
                key: 'D',
                instruments: ['tranceLead', 'pumpingBass', 'upliftDrums', 'euphoria'],
                progression: ['D', 'Bm', 'G', 'A']
            }
        };
        
        return themes[stage] || themes[1];
    }
    
    /**
     * テーマ音楽開始
     */
    async startThemeMusic() {
        if (!this.currentTheme) return;
        
        console.log(`🎵 Starting ${this.currentTheme.name} (${this.currentTheme.genre}) at ${this.currentTheme.bpm} BPM`);
        
        // 楽器を段階的に開始
        const instruments = this.currentTheme.instruments;
        
        for (let i = 0; i < instruments.length; i++) {
            const instrument = instruments[i];
            const delay = i * 2000; // 2秒間隔で楽器追加
            
            setTimeout(() => {
                this.startInstrument(instrument);
            }, delay);
        }
    }
    
    /**
     * 楽器開始
     * @param {string} instrumentName - 楽器名
     */
    startInstrument(instrumentName) {
        if (!this.currentTheme) return;
        
        try {
            const instrument = this.createInstrument(instrumentName);
            this.activeInstruments.set(instrumentName, instrument);
            
            console.log(`🎵 Started instrument: ${instrumentName}`);
            
        } catch (error) {
            console.error(`🎵 Failed to start instrument ${instrumentName}:`, error);
        }
    }
    
    /**
     * 楽器作成（基本実装）
     * @param {string} instrumentName - 楽器名
     * @returns {Object} 楽器インスタンス
     */
    createInstrument(instrumentName) {
        const now = this.audioContext.currentTime;
        const theme = this.currentTheme;
        const beatDuration = 60 / theme.bpm; // 1拍の時間
        
        // 基本オシレーター作成
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // 楽器別設定
        switch (instrumentName) {
            case 'leadSynth':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(440, now); // A4
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2000, now);
                filter.Q.setValueAtTime(2, now);
                break;
                
            case 'subBass':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(55, now); // A1
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(200, now);
                break;
                
            case 'softDrums':
                osc.type = 'square';
                osc.frequency.setValueAtTime(80, now); // キック風
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(100, now);
                break;
                
            case 'neonPad':
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now); // A3
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(800, now);
                break;
                
            default:
                // デフォルト設定
                osc.type = 'sine';
                osc.frequency.setValueAtTime(440, now);
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(1000, now);
        }
        
        // 音量設定
        const volume = this.calculateInstrumentVolume(instrumentName);
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(volume, now + 2); // 2秒フェードイン
        
        // 接続
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        // 開始
        osc.start();
        
        return {
            oscillator: osc,
            gainNode: gain,
            filterNode: filter,
            startTime: now
        };
    }
    
    /**
     * 楽器音量計算
     * @param {string} instrumentName - 楽器名
     * @returns {number} 音量値
     */
    calculateInstrumentVolume(instrumentName) {
        const baseVolume = this.volumeSettings.master * this.volumeSettings.bgm;
        
        // 楽器別音量調整
        const instrumentVolumes = {
            'leadSynth': 0.3,
            'subBass': 0.4,
            'softDrums': 0.2,
            'neonPad': 0.1,
            'arpSynth': 0.25,
            'reeseBass': 0.35,
            'synthDrums': 0.3
        };
        
        const instrumentVolume = instrumentVolumes[instrumentName] || 0.2;
        return baseVolume * instrumentVolume;
    }
    
    /**
     * 現在の音楽停止
     */
    stopCurrentMusic() {
        this.activeInstruments.forEach((instrument, name) => {
            try {
                const now = this.audioContext.currentTime;
                
                // フェードアウト
                instrument.gainNode.gain.setTargetAtTime(0, now, 0.5);
                
                // 1秒後に停止
                setTimeout(() => {
                    instrument.oscillator.stop();
                }, 1000);
                
            } catch (error) {
                console.warn(`🎵 Error stopping instrument ${name}:`, error);
            }
        });
        
        this.activeInstruments.clear();
        this.isPlaying = false;
        
        console.log('🎵 ModernBGMEngine: Current music stopped');
    }
    
    /**
     * 音楽停止
     */
    stop() {
        this.stopCurrentMusic();
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