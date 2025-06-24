/**
 * MarioAudio - マリオ風ミニゲーム音響システム
 * 8bit風BGM・効果音・音楽切り替え機能
 * Tone.js対応版
 */
export class MarioAudio {
    constructor(parentAudioSystem) {
        this.parentAudioSystem = parentAudioSystem;
        this.audioContext = null;
        
        // Tone.js統合
        this.isToneReady = false;
        this.toneSynths = {};
        
        // 音響設定
        this.volume = {
            bgm: 0.3,
            sfx: 0.4
        };
        
        // 現在の音響状態
        this.currentBGM = null;
        this.bgmGainNode = null;
        this.sfxGainNode = null;
        
        // 8bit風音階定義
        this.notes = {
            'C4': 261.63, 'C#4': 277.18, 'D4': 293.66, 'D#4': 311.13,
            'E4': 329.63, 'F4': 349.23, 'F#4': 369.99, 'G4': 392.00,
            'G#4': 415.30, 'A4': 440.00, 'A#4': 466.16, 'B4': 493.88,
            'C5': 523.25, 'C#5': 554.37, 'D5': 587.33, 'D#5': 622.25,
            'E5': 659.25, 'F5': 698.46, 'F#5': 739.99, 'G5': 783.99,
            'G#5': 830.61, 'A5': 880.00, 'A#5': 932.33, 'B5': 987.77,
            'C6': 1046.50
        };
        
        // マリオBGMメロディ定義
        this.marioBGMSequence = [
            // 有名なマリオテーマの一部
            { note: 'E5', duration: 0.2 }, { note: 'E5', duration: 0.2 },
            { note: null, duration: 0.2 }, { note: 'E5', duration: 0.2 },
            { note: null, duration: 0.2 }, { note: 'C5', duration: 0.2 },
            { note: 'E5', duration: 0.2 }, { note: null, duration: 0.2 },
            { note: 'G5', duration: 0.4 }, { note: null, duration: 0.4 },
            { note: 'G4', duration: 0.4 }, { note: null, duration: 0.4 },
            
            { note: 'C5', duration: 0.3 }, { note: null, duration: 0.2 },
            { note: 'G4', duration: 0.3 }, { note: null, duration: 0.2 },
            { note: 'E4', duration: 0.3 }, { note: null, duration: 0.2 },
            { note: 'A4', duration: 0.2 }, { note: 'B4', duration: 0.2 },
            { note: 'A#4', duration: 0.2 }, { note: 'A4', duration: 0.2 },
            
            { note: 'G4', duration: 0.2 }, { note: 'E5', duration: 0.2 },
            { note: 'G5', duration: 0.2 }, { note: 'A5', duration: 0.3 },
            { note: 'F5', duration: 0.2 }, { note: 'G5', duration: 0.2 },
            { note: null, duration: 0.2 }, { note: 'E5', duration: 0.2 },
            { note: 'C5', duration: 0.2 }, { note: 'D5', duration: 0.2 },
            { note: 'B4', duration: 0.3 }
        ];
        
        // 効果音定義
        this.sfxDefinitions = {
            jump: {
                frequencies: [329.63, 392.00, 523.25], // E4 -> G4 -> C5
                durations: [0.1, 0.1, 0.2],
                type: 'square'
            },
            coin: {
                frequencies: [659.25, 830.61, 1046.50, 1318.51], // E5 -> G#5 -> C6 -> E6
                durations: [0.1, 0.1, 0.1, 0.2],
                type: 'square'
            },
            death: {
                frequencies: [523.25, 493.88, 466.16, 440.00, 415.30, 392.00, 349.23], // C5 down
                durations: [0.2, 0.2, 0.2, 0.2, 0.2, 0.2, 0.4],
                type: 'triangle'
            },
            victory: {
                frequencies: [523.25, 659.25, 783.99, 1046.50, 783.99, 1046.50, 1318.51], // Fanfare
                durations: [0.3, 0.3, 0.3, 0.6, 0.3, 0.3, 0.8],
                type: 'triangle'
            },
            gameOver: {
                frequencies: [523.25, 466.16, 415.30, 349.23, 293.66, 261.63], // Descending
                durations: [0.4, 0.4, 0.4, 0.4, 0.4, 0.8],
                type: 'sawtooth'
            }
        };
        
        console.log('🎵 MarioAudio: Mario audio system initialized');
    }
    
    /**
     * 音響システム初期化
     */
    async initialize() {
        try {
            // 親システムのAudioContextを使用
            if (this.parentAudioSystem && this.parentAudioSystem.audioContext) {
                this.audioContext = this.parentAudioSystem.audioContext;
            } else {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
            
            // マスターゲインノード設定
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            
            // BGM・SFX用ゲインノード
            this.bgmGainNode = this.audioContext.createGain();
            this.bgmGainNode.connect(this.masterGain);
            this.bgmGainNode.gain.value = this.volume.bgm;
            
            this.sfxGainNode = this.audioContext.createGain();
            this.sfxGainNode.connect(this.masterGain);
            this.sfxGainNode.gain.value = this.volume.sfx;
            
            console.log('✅ MarioAudio: Audio context initialized');
            
        } catch (error) {
            console.error('❌ MarioAudio: Failed to initialize audio context:', error);
        }
    }
    
    /**
     * マリオBGM開始
     */
    startBGM() {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.warn('⚠️ MarioAudio: AudioContext not running, attempting to resume...');
            if (this.audioContext) {
                this.audioContext.resume().then(() => {
                    this.startBGM();
                });
            }
            return;
        }
        
        this.stopBGM(); // 既存BGM停止
        
        console.log('🎵 MarioAudio: Starting Mario BGM');
        this.playMelodyLoop();
    }
    
    /**
     * マリオBGM停止
     */
    stopBGM() {
        if (this.currentBGM) {
            clearTimeout(this.currentBGM);
            this.currentBGM = null;
            console.log('🔇 MarioAudio: Mario BGM stopped');
        }
    }
    
    /**
     * メロディループ再生
     */
    playMelodyLoop() {
        let noteIndex = 0;
        const totalDuration = this.marioBGMSequence.reduce((sum, note) => sum + note.duration, 0);
        
        const playNextNote = () => {
            if (!this.currentBGM) return; // BGM停止時は終了
            
            const noteData = this.marioBGMSequence[noteIndex];
            
            if (noteData.note) {
                this.playTone(noteData.note, noteData.duration, 'square', this.bgmGainNode);
            }
            
            // 次のノートへ
            noteIndex = (noteIndex + 1) % this.marioBGMSequence.length;
            
            // ループ継続
            this.currentBGM = setTimeout(playNextNote, noteData.duration * 1000);
        };
        
        this.currentBGM = setTimeout(playNextNote, 0);
    }
    
    /**
     * 効果音再生
     */
    playSFX(soundName) {
        if (!this.audioContext || this.audioContext.state !== 'running') {
            console.warn('⚠️ MarioAudio: Cannot play SFX, AudioContext not running');
            return;
        }
        
        const sfxData = this.sfxDefinitions[soundName];
        if (!sfxData) {
            console.warn('⚠️ MarioAudio: Unknown sound effect:', soundName);
            return;
        }
        
        console.log('🔊 MarioAudio: Playing SFX -', soundName);
        
        let currentTime = this.audioContext.currentTime;
        
        sfxData.frequencies.forEach((frequency, index) => {
            const duration = sfxData.durations[index] || 0.1;
            this.playTone(frequency, duration, sfxData.type, this.sfxGainNode, currentTime);
            currentTime += duration;
        });
    }
    
    /**
     * 音色再生（基本メソッド）
     */
    playTone(frequency, duration, waveType = 'square', gainNode = null, startTime = null) {
        if (!this.audioContext) return;
        
        const now = startTime || this.audioContext.currentTime;
        const oscillator = this.audioContext.createOscillator();
        const gainNodeLocal = this.audioContext.createGain();
        
        // 周波数設定（音名の場合は変換）
        const freq = typeof frequency === 'string' ? this.notes[frequency] : frequency;
        if (!freq) {
            console.warn('⚠️ MarioAudio: Invalid frequency:', frequency);
            return;
        }
        
        oscillator.frequency.setValueAtTime(freq, now);
        oscillator.type = waveType;
        
        // ゲイン設定（エンベロープ）
        gainNodeLocal.gain.setValueAtTime(0, now);
        gainNodeLocal.gain.linearRampToValueAtTime(0.3, now + 0.01); // Attack
        gainNodeLocal.gain.exponentialRampToValueAtTime(0.1, now + duration * 0.3); // Decay
        gainNodeLocal.gain.setValueAtTime(0.1, now + duration * 0.7); // Sustain
        gainNodeLocal.gain.exponentialRampToValueAtTime(0.001, now + duration); // Release
        
        // 接続
        oscillator.connect(gainNodeLocal);
        gainNodeLocal.connect(gainNode || this.masterGain);
        
        // 再生
        oscillator.start(now);
        oscillator.stop(now + duration);
    }
    
    /**
     * 音量設定更新
     */
    updateVolume(bgmVolume, sfxVolume) {
        this.volume.bgm = Math.max(0, Math.min(1, bgmVolume));
        this.volume.sfx = Math.max(0, Math.min(1, sfxVolume));
        
        if (this.bgmGainNode) {
            this.bgmGainNode.gain.setValueAtTime(this.volume.bgm, this.audioContext.currentTime);
        }
        
        if (this.sfxGainNode) {
            this.sfxGainNode.gain.setValueAtTime(this.volume.sfx, this.audioContext.currentTime);
        }
        
        console.log('🎚️ MarioAudio: Volume updated -', {
            bgm: this.volume.bgm,
            sfx: this.volume.sfx
        });
    }
    
    /**
     * 親音響システムとの音量同期
     */
    syncWithParentVolume() {
        if (this.parentAudioSystem && this.parentAudioSystem.volumeSettings) {
            const parentVolume = this.parentAudioSystem.volumeSettings;
            const masterVolume = parentVolume.master || 1;
            
            // マリオゲーム専用の音量調整
            const marioBGMVolume = (parentVolume.bgm || 0.6) * masterVolume * 0.5; // 控えめ
            const marioSFXVolume = (parentVolume.sfx || 0.7) * masterVolume * 0.7;
            
            this.updateVolume(marioBGMVolume, marioSFXVolume);
        }
    }
    
    /**
     * AudioContext状態取得
     */
    getAudioState() {
        return {
            contextState: this.audioContext ? this.audioContext.state : 'null',
            bgmPlaying: !!this.currentBGM,
            volume: this.volume
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        console.log('🧹 MarioAudio: Cleaning up audio system');
        
        this.stopBGM();
        
        // ゲインノード切断
        if (this.bgmGainNode) {
            this.bgmGainNode.disconnect();
            this.bgmGainNode = null;
        }
        
        if (this.sfxGainNode) {
            this.sfxGainNode.disconnect();
            this.sfxGainNode = null;
        }
        
        if (this.masterGain) {
            this.masterGain.disconnect();
            this.masterGain = null;
        }
        
        // AudioContextは親システムが管理するため切断しない
        this.audioContext = null;
        
        console.log('✅ MarioAudio: Audio cleanup completed');
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            audioContext: this.audioContext ? {
                state: this.audioContext.state,
                sampleRate: this.audioContext.sampleRate,
                currentTime: this.audioContext.currentTime.toFixed(2)
            } : null,
            bgmPlaying: !!this.currentBGM,
            volume: this.volume,
            sfxDefinitions: Object.keys(this.sfxDefinitions),
            melodyLength: this.marioBGMSequence.length
        };
    }
}