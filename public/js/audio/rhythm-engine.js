/**
 * RhythmEngine - ドラム・リズムセクション管理
 * 各ジャンル別のリズムパターンとドラム音源
 */
export class RhythmEngine {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.drumSounds = new Map();
        this.activePatterns = new Map();
        this.isPlaying = false;
        
        // タイミング制御
        this.nextNoteTime = 0;
        this.currentStep = 0;
        this.tempo = 120;
        this.scheduleAheadTime = 25.0; // 25ms先読み
        this.noteResolution = 0.25; // 16分音符
        
        this.initializeDrumSounds();
        console.log('🥁 RhythmEngine: Drum patterns and sounds initialized');
    }
    
    /**
     * ドラム音源初期化
     */
    initializeDrumSounds() {
        this.drumSounds.set('kick', this.createKickDrum());
        this.drumSounds.set('snare', this.createSnareDrum());
        this.drumSounds.set('hihat', this.createHiHat());
        this.drumSounds.set('openhat', this.createOpenHat());
        this.drumSounds.set('crash', this.createCrash());
        this.drumSounds.set('ride', this.createRide());
        this.drumSounds.set('perc', this.createPercussion());
        this.drumSounds.set('clap', this.createClap());
    }
    
    /**
     * キックドラム音源作成
     */
    createKickDrum() {
        return {
            type: 'synth',
            create: (when, velocity = 0.8) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.type = 'sine';
                osc.frequency.setValueAtTime(60, when);
                osc.frequency.exponentialRampToValueAtTime(20, when + 0.1);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(200, when);
                filter.Q.setValueAtTime(1, when);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 0.3);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start(when);
                osc.stop(when + 0.3);
                
                return { oscillator: osc, gainNode: gain };
            }
        };
    }
    
    /**
     * スネアドラム音源作成
     */
    createSnareDrum() {
        return {
            type: 'noise',
            create: (when, velocity = 0.8) => {
                const bufferSize = this.audioContext.sampleRate * 0.1;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                // ノイズ + トーン
                for (let i = 0; i < bufferSize; i++) {
                    const noise = Math.random() * 2 - 1;
                    const tone = Math.sin(i * 0.02) * 0.3;
                    data[i] = (noise * 0.7 + tone) * velocity;
                }
                
                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                source.buffer = buffer;
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(2000, when);
                filter.Q.setValueAtTime(3, when);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 0.1);
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                source.start(when);
                
                return { source, gainNode: gain };
            }
        };
    }
    
    /**
     * ハイハット音源作成
     */
    createHiHat() {
        return {
            type: 'noise',
            create: (when, velocity = 0.6) => {
                const bufferSize = this.audioContext.sampleRate * 0.05;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * velocity;
                }
                
                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                source.buffer = buffer;
                
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(8000, when);
                filter.Q.setValueAtTime(1, when);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 0.05);
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                source.start(when);
                
                return { source, gainNode: gain };
            }
        };
    }
    
    /**
     * オープンハット音源作成
     */
    createOpenHat() {
        return {
            type: 'noise',
            create: (when, velocity = 0.7) => {
                const bufferSize = this.audioContext.sampleRate * 0.2;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * velocity;
                }
                
                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                source.buffer = buffer;
                
                filter.type = 'highpass';
                filter.frequency.setValueAtTime(6000, when);
                filter.Q.setValueAtTime(0.5, when);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 0.2);
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                source.start(when);
                
                return { source, gainNode: gain };
            }
        };
    }
    
    /**
     * クラッシュシンバル音源作成
     */
    createCrash() {
        return {
            type: 'noise',
            create: (when, velocity = 0.8) => {
                const bufferSize = this.audioContext.sampleRate * 1.0;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    const metallic = Math.sin(i * 0.01) * Math.random();
                    data[i] = metallic * velocity;
                }
                
                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                source.buffer = buffer;
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(4000, when);
                filter.Q.setValueAtTime(0.5, when);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 1.0);
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                source.start(when);
                
                return { source, gainNode: gain };
            }
        };
    }
    
    /**
     * ライドシンバル音源作成
     */
    createRide() {
        return {
            type: 'noise',
            create: (when, velocity = 0.6) => {
                const bufferSize = this.audioContext.sampleRate * 0.3;
                const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < bufferSize; i++) {
                    const ping = Math.sin(i * 0.005) * 0.3;
                    const noise = Math.random() * 0.2;
                    data[i] = (ping + noise) * velocity;
                }
                
                const source = this.audioContext.createBufferSource();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                source.buffer = buffer;
                
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(3000, when);
                filter.Q.setValueAtTime(2, when);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 0.3);
                
                source.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                source.start(when);
                
                return { source, gainNode: gain };
            }
        };
    }
    
    /**
     * パーカッション音源作成
     */
    createPercussion() {
        return {
            type: 'synth',
            create: (when, velocity = 0.7) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(800, when);
                osc.frequency.exponentialRampToValueAtTime(200, when + 0.1);
                
                gain.gain.setValueAtTime(velocity, when);
                gain.gain.exponentialRampToValueAtTime(0.01, when + 0.1);
                
                osc.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start(when);
                osc.stop(when + 0.1);
                
                return { oscillator: osc, gainNode: gain };
            }
        };
    }
    
    /**
     * クラップ音源作成
     */
    createClap() {
        return {
            type: 'multi_noise',
            create: (when, velocity = 0.8) => {
                const instances = [];
                const delays = [0, 0.01, 0.02]; // マルチ打撃でクラップ感
                
                delays.forEach((delay, index) => {
                    const bufferSize = this.audioContext.sampleRate * 0.05;
                    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
                    const data = buffer.getChannelData(0);
                    
                    for (let i = 0; i < bufferSize; i++) {
                        data[i] = (Math.random() * 2 - 1) * velocity * (1 - index * 0.2);
                    }
                    
                    const source = this.audioContext.createBufferSource();
                    const gain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    source.buffer = buffer;
                    
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(1500, when + delay);
                    filter.Q.setValueAtTime(4, when + delay);
                    
                    gain.gain.setValueAtTime(velocity * (1 - index * 0.2), when + delay);
                    gain.gain.exponentialRampToValueAtTime(0.01, when + delay + 0.05);
                    
                    source.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.audioContext.destination);
                    
                    source.start(when + delay);
                    instances.push({ source, gainNode: gain });
                });
                
                return instances;
            }
        };
    }
    
    /**
     * リズムパターン取得
     * @param {string} genre - ジャンル
     * @param {string} pattern - パターン名
     * @returns {Object} リズムパターン
     */
    getPattern(genre, pattern) {
        const patterns = {
            'Future Pop': {
                'soft_four_on_floor': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                    openhat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]
                }
            },
            
            'Synthwave': {
                'retro_beat': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                    perc: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0]
                }
            },
            
            'Electro House': {
                'four_on_floor_hard': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                    crash: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0]
                }
            },
            
            'Tech House': {
                'tech_groove': {
                    steps: 16,
                    kick: [1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
                    perc: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
                }
            },
            
            'Future Bass': {
                'future_trap': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1],
                    perc: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1]
                }
            },
            
            'Hardstyle': {
                'hardstyle_kick': {
                    steps: 16,
                    kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                    crash: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
                }
            },
            
            'Ambient Techno': {
                'minimal_techno': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                    snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
                    perc: [0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0]
                }
            },
            
            'Epic Synthwave': {
                'epic_drums': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    crash: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0],
                    ride: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0]
                }
            },
            
            'Uplifting Trance': {
                'trance_beat': {
                    steps: 16,
                    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
                    snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
                    hihat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
                    openhat: [0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1]
                }
            }
        };
        
        return patterns[genre]?.[pattern] || patterns['Future Pop']['soft_four_on_floor'];
    }
    
    /**
     * パターン再生開始
     * @param {string} genre - ジャンル
     * @param {string} pattern - パターン名
     * @param {number} bpm - BPM
     */
    startPattern(genre, pattern, bpm) {
        this.stop();
        
        this.tempo = bpm;
        this.currentStep = 0;
        this.nextNoteTime = this.audioContext.currentTime;
        this.isPlaying = true;
        
        const patternData = this.getPattern(genre, pattern);
        this.activePatterns.set('main', patternData);
        
        this.schedulePattern();
        console.log(`🥁 RhythmEngine: Started ${genre} - ${pattern} at ${bpm} BPM`);
    }
    
    /**
     * パターンスケジューリング
     */
    schedulePattern() {
        if (!this.isPlaying) return;
        
        const pattern = this.activePatterns.get('main');
        if (!pattern) return;
        
        const secondsPerBeat = 60.0 / this.tempo;
        const secondsPerNote = secondsPerBeat * this.noteResolution;
        
        while (this.nextNoteTime < this.audioContext.currentTime + this.scheduleAheadTime) {
            this.playStep(pattern, this.currentStep, this.nextNoteTime);
            
            this.nextNoteTime += secondsPerNote;
            this.currentStep = (this.currentStep + 1) % pattern.steps;
        }
        
        requestAnimationFrame(() => this.schedulePattern());
    }
    
    /**
     * ステップ再生
     * @param {Object} pattern - パターンデータ
     * @param {number} step - ステップ番号
     * @param {number} when - 再生時刻
     */
    playStep(pattern, step, when) {
        Object.keys(pattern).forEach(drum => {
            if (drum === 'steps') return;
            
            const velocity = pattern[drum][step];
            if (velocity > 0) {
                this.playDrumSound(drum, when, velocity);
            }
        });
    }
    
    /**
     * ドラム音再生
     * @param {string} drum - ドラム名
     * @param {number} when - 再生時刻
     * @param {number} velocity - ベロシティ
     */
    playDrumSound(drum, when, velocity) {
        const drumSound = this.drumSounds.get(drum);
        if (!drumSound) {
            console.warn(`🥁 RhythmEngine: Unknown drum sound: ${drum}`);
            return;
        }
        
        try {
            drumSound.create(when, velocity);
        } catch (error) {
            console.error(`🥁 RhythmEngine: Error playing ${drum}:`, error);
        }
    }
    
    /**
     * 再生停止
     */
    stop() {
        this.isPlaying = false;
        this.activePatterns.clear();
        console.log('🥁 RhythmEngine: Stopped');
    }
    
    /**
     * テンポ変更
     * @param {number} bpm - 新しいBPM
     */
    setTempo(bpm) {
        this.tempo = Math.max(60, Math.min(200, bpm));
        console.log(`🥁 RhythmEngine: Tempo changed to ${this.tempo} BPM`);
    }
    
    /**
     * ボリューム設定
     * @param {number} volume - 音量 (0.0-1.0)
     */
    setVolume(volume) {
        // 将来の実装用
        this.volume = Math.max(0, Math.min(1, volume));
    }
}