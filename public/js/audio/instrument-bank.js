/**
 * InstrumentBank - 楽器管理システム
 * 高品質楽器音源とリアルタイム制御
 */
export class InstrumentBank {
    constructor(bgmController) {
        this.bgmController = bgmController;
        this.audioContext = null;
        this.masterGain = null;
        
        // 楽器インスタンス管理
        this.instruments = new Map();
        this.activeInstruments = new Set();
        
        // グローバルパラメータ
        this.globalTempo = 60;
        this.globalIntensity = 0.5;
        this.globalVolume = 0.8;
        this.globalKey = 'C';
        
        // パフォーマンス管理
        this.maxPolyphony = 32; // 最大同時発音数
        this.currentPolyphony = 0;
        
        console.log('🎹 InstrumentBank: Initialized');
    }
    
    /**
     * 初期化
     * @param {AudioContext} audioContext - オーディオコンテキスト
     */
    async initialize(audioContext) {
        this.audioContext = audioContext;
        this.masterGain = audioContext.createGain();
        this.masterGain.connect(this.bgmController.masterGain);
        
        // 楽器定義を登録
        this.registerInstrumentDefinitions();
        
        console.log('🎹 InstrumentBank: Initialization completed');
    }
    
    /**
     * 楽器定義登録
     */
    registerInstrumentDefinitions() {
        const definitions = {
            // === 静寂の森 楽器 ===
            acoustic_guitar: {
                type: 'harmonic',
                polyphony: 4,
                attack: 0.05,
                decay: 0.3,
                sustain: 0.6,
                release: 0.8,
                harmonics: [
                    { ratio: 1.0, amplitude: 1.0 },
                    { ratio: 2.0, amplitude: 0.7 },
                    { ratio: 3.0, amplitude: 0.4 },
                    { ratio: 4.0, amplitude: 0.2 },
                    { ratio: 5.0, amplitude: 0.1 }
                ],
                filter: { type: 'lowpass', frequency: 2000, Q: 0.8 },
                waveform: 'triangle'
            },
            
            ambient_pad: {
                type: 'pad',
                polyphony: 8,
                attack: 3.0,
                decay: 1.0,
                sustain: 0.8,
                release: 4.0,
                harmonics: [
                    { ratio: 1.0, amplitude: 1.0 },
                    { ratio: 1.5, amplitude: 0.6 },
                    { ratio: 2.0, amplitude: 0.4 }
                ],
                filter: { type: 'lowpass', frequency: 800, Q: 0.5 },
                waveform: 'sine',
                modulation: { rate: 0.1, depth: 3 }
            },
            
            // === 危険の予感 楽器 ===
            dark_strings: {
                type: 'strings',
                polyphony: 6,
                attack: 0.5,
                decay: 0.3,
                sustain: 0.7,
                release: 1.2,
                harmonics: [
                    { ratio: 1.0, amplitude: 1.0 },
                    { ratio: 2.0, amplitude: 0.8 },
                    { ratio: 3.0, amplitude: 0.5 },
                    { ratio: 4.0, amplitude: 0.3 }
                ],
                filter: { type: 'lowpass', frequency: 600, Q: 4.0 },
                waveform: 'sawtooth',
                detuning: [-7, 0, 7, 12] // セクション別デチューン
            },
            
            subtle_percussion: {
                type: 'percussion',
                polyphony: 2,
                sounds: {
                    kick: { frequency: 60, decay: 0.1, volume: 0.8 },
                    snare: { frequency: 200, decay: 0.05, volume: 0.6, noise: true },
                    hihat: { frequency: 8000, decay: 0.03, volume: 0.4, noise: true }
                }
            },
            
            // === 戦闘開始 楽器 ===
            electric_guitar: {
                type: 'electric',
                polyphony: 4,
                attack: 0.01,
                decay: 0.1,
                sustain: 0.8,
                release: 0.3,
                harmonics: [
                    { ratio: 1.0, amplitude: 1.0 },
                    { ratio: 1.5, amplitude: 0.8 }, // パワーコード5度
                    { ratio: 2.0, amplitude: 0.6 }
                ],
                filter: { type: 'peaking', frequency: 1000, Q: 3.0, gain: 8 },
                waveform: 'sawtooth',
                distortion: { amount: 70, oversample: '4x' }
            },
            
            heavy_drums: {
                type: 'drums',
                polyphony: 4,
                sounds: {
                    kick: { frequency: 80, decay: 0.8, volume: 0.9 },
                    snare: { frequency: 200, decay: 0.2, volume: 0.8, noise: true },
                    hihat: { frequency: 10000, decay: 0.05, volume: 0.5, noise: true },
                    crash: { frequency: 6000, decay: 0.6, volume: 0.7, noise: true }
                }
            },
            
            synth_bass: {
                type: 'bass',
                polyphony: 2,
                attack: 0.05,
                decay: 0.2,
                sustain: 0.8,
                release: 0.4,
                harmonics: [
                    { ratio: 1.0, amplitude: 1.0 },
                    { ratio: 2.0, amplitude: 0.3 }
                ],
                filter: { type: 'lowpass', frequency: 300, Q: 2.0 },
                waveform: 'square'
            },
            
            // === 勝利への道 楽器 ===
            orchestral_strings: {
                type: 'orchestra',
                polyphony: 12,
                attack: 0.8,
                decay: 0.5,
                sustain: 0.9,
                release: 2.0,
                sections: [
                    { name: 'violin1', harmonics: [1, 2, 3, 4, 5], detune: 0, filter: 4000 },
                    { name: 'violin2', harmonics: [1, 2, 3], detune: -3, filter: 3000 },
                    { name: 'viola', harmonics: [1, 1.5], detune: -12, filter: 2000 },
                    { name: 'cello', harmonics: [1], detune: -24, filter: 1200 }
                ],
                waveform: 'sawtooth'
            },
            
            epic_brass: {
                type: 'brass',
                polyphony: 8,
                attack: 0.2,
                decay: 0.3,
                sustain: 0.9,
                release: 1.0,
                harmonics: [
                    { ratio: 1.0, amplitude: 1.0 },
                    { ratio: 2.0, amplitude: 0.8 },
                    { ratio: 3.0, amplitude: 0.6 },
                    { ratio: 4.0, amplitude: 0.4 }
                ],
                filter: { type: 'peaking', frequency: 800, Q: 2.0, gain: 4 },
                waveform: 'sawtooth'
            }
        };
        
        // 楽器定義を保存
        this.instrumentDefinitions = definitions;
        console.log(`🎹 InstrumentBank: ${Object.keys(definitions).length} instrument definitions registered`);
    }
    
    /**
     * 楽器フェードイン
     * @param {Array} instrumentNames - 楽器名リスト
     * @param {Object} config - 設定
     * @param {number} duration - フェード時間
     */
    async fadeInInstruments(instrumentNames, config, duration = 2000) {
        const promises = instrumentNames.map(async (name, index) => {
            // 段階的な開始（楽器ごとに少しずつずらす）
            const delay = index * 300;
            
            setTimeout(() => {
                this.startInstrument(name, config);
            }, delay);
        });
        
        await Promise.all(promises);
        console.log(`🎹 InstrumentBank: Faded in instruments:`, instrumentNames);
    }
    
    /**
     * 楽器フェードアウト
     * @param {Array} instrumentNames - 楽器名リスト
     * @param {number} duration - フェード時間
     */
    fadeOutInstruments(instrumentNames, duration = 1000) {
        instrumentNames.forEach(name => {
            this.stopInstrument(name, duration);
        });
        
        console.log(`🎹 InstrumentBank: Faded out instruments:`, instrumentNames);
    }
    
    /**
     * 楽器開始
     * @param {string} instrumentName - 楽器名
     * @param {Object} config - 設定
     */
    startInstrument(instrumentName, config) {
        const definition = this.instrumentDefinitions[instrumentName];
        if (!definition) {
            console.warn(`🎹 InstrumentBank: Unknown instrument: ${instrumentName}`);
            return;
        }
        
        // 既存の楽器を停止
        this.stopInstrument(instrumentName, 500);
        
        // 新しい楽器インスタンス作成
        const instrument = this.createInstrumentInstance(instrumentName, definition, config);
        
        if (instrument) {
            this.instruments.set(instrumentName, instrument);
            this.activeInstruments.add(instrumentName);
            
            // 演奏開始
            this.startInstrumentPlayback(instrumentName, instrument, config);
            
            console.log(`🎹 InstrumentBank: Started ${instrumentName}`);
        }
    }
    
    /**
     * 楽器インスタンス作成
     * @param {string} name - 楽器名
     * @param {Object} definition - 楽器定義
     * @param {Object} config - 設定
     * @returns {Object} 楽器インスタンス
     */
    createInstrumentInstance(name, definition, config) {
        try {
            const instrument = {
                name,
                definition,
                config,
                oscillators: [],
                gainNodes: [],
                filters: [],
                isPlaying: false,
                startTime: this.audioContext.currentTime
            };
            
            return instrument;
            
        } catch (error) {
            console.error(`🎹 InstrumentBank: Failed to create ${name}:`, error);
            return null;
        }
    }
    
    /**
     * 楽器演奏開始
     * @param {string} name - 楽器名
     * @param {Object} instrument - 楽器インスタンス
     * @param {Object} config - 設定
     */
    startInstrumentPlayback(name, instrument, config) {
        instrument.isPlaying = true;
        
        // 楽器タイプ別演奏
        switch (instrument.definition.type) {
            case 'harmonic':
                this.playHarmonicInstrument(instrument, config);
                break;
            case 'pad':
                this.playPadInstrument(instrument, config);
                break;
            case 'strings':
                this.playStringsInstrument(instrument, config);
                break;
            case 'percussion':
                this.playPercussionInstrument(instrument, config);
                break;
            case 'electric':
                this.playElectricInstrument(instrument, config);
                break;
            case 'drums':
                this.playDrumsInstrument(instrument, config);
                break;
            case 'bass':
                this.playBassInstrument(instrument, config);
                break;
            case 'orchestra':
                this.playOrchestraInstrument(instrument, config);
                break;
            case 'brass':
                this.playBrassInstrument(instrument, config);
                break;
            default:
                console.warn(`🎹 InstrumentBank: Unknown instrument type: ${instrument.definition.type}`);
        }
    }
    
    /**
     * ハーモニック楽器演奏（アコースティックギター）
     */
    playHarmonicInstrument(instrument, config) {
        const chordProgression = this.getChordProgression(config.key || 'Am');
        let chordIndex = 0;
        
        const playChord = () => {
            if (!instrument.isPlaying) return;
            
            const chord = chordProgression[chordIndex];
            const duration = (60 / this.globalTempo) * 4; // 4拍
            
            // 既存の音符を停止
            this.stopInstrumentNotes(instrument);
            
            // 新しいコードを演奏
            chord.forEach((frequency, noteIndex) => {
                this.playHarmonicNote(instrument, frequency, duration, noteIndex);
            });
            
            chordIndex = (chordIndex + 1) % chordProgression.length;
            setTimeout(playChord, duration * 1000);
        };
        
        playChord();
    }
    
    /**
     * ハーモニック音符演奏
     */
    playHarmonicNote(instrument, frequency, duration, noteIndex) {
        const def = instrument.definition;
        
        def.harmonics.forEach((harmonic, harmonicIndex) => {
            try {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                // オシレーター設定
                osc.type = def.waveform || 'triangle';
                osc.frequency.setValueAtTime(frequency * harmonic.ratio, this.audioContext.currentTime);
                
                // フィルター設定
                filter.type = def.filter.type;
                filter.frequency.setValueAtTime(def.filter.frequency + noteIndex * 200, this.audioContext.currentTime);
                filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
                
                // ADSR エンベロープ
                const volume = this.globalVolume * harmonic.amplitude * 0.3;
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + def.attack);
                gain.gain.linearRampToValueAtTime(volume * def.sustain, this.audioContext.currentTime + def.attack + def.decay);
                gain.gain.setValueAtTime(volume * def.sustain, this.audioContext.currentTime + duration - def.release);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                
                // 接続
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                
                // 開始・停止
                osc.start();
                osc.stop(this.audioContext.currentTime + duration);
                
                // インスタンスに追加
                instrument.oscillators.push(osc);
                instrument.gainNodes.push(gain);
                instrument.filters.push(filter);
                
            } catch (error) {
                console.error('🎹 InstrumentBank: Failed to play harmonic note:', error);
            }
        });
    }
    
    /**
     * パッド楽器演奏
     */
    playPadInstrument(instrument, config) {
        const chord = this.getChordProgression(config.key || 'Am')[0]; // 単一コード
        const duration = 30; // 30秒持続
        
        chord.forEach((frequency, index) => {
            const layers = [
                { detune: 0, amplitude: 1.0 },
                { detune: 12, amplitude: 0.6 },
                { detune: -12, amplitude: 0.5 }
            ];
            
            layers.forEach((layer, layerIndex) => {
                setTimeout(() => {
                    this.playPadLayer(instrument, frequency, duration, layer, index);
                }, layerIndex * 2000);
            });
        });
    }
    
    /**
     * パッドレイヤー演奏
     */
    playPadLayer(instrument, frequency, duration, layer, noteIndex) {
        try {
            const def = instrument.definition;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const lfo = this.audioContext.createOscillator();
            const lfoGain = this.audioContext.createGain();
            
            // メインオシレーター
            osc.type = def.waveform || 'sine';
            osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            osc.detune.setValueAtTime(layer.detune, this.audioContext.currentTime);
            
            // LFO（揺らぎ）
            if (def.modulation) {
                lfo.type = 'sine';
                lfo.frequency.setValueAtTime(def.modulation.rate, this.audioContext.currentTime);
                lfoGain.gain.setValueAtTime(def.modulation.depth, this.audioContext.currentTime);
                lfo.connect(lfoGain);
                lfoGain.connect(osc.detune);
                lfo.start();
            }
            
            // フィルター
            filter.type = def.filter.type;
            filter.frequency.setValueAtTime(def.filter.frequency + noteIndex * 100, this.audioContext.currentTime);
            filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
            
            // ゆっくりとしたアタック
            const volume = this.globalVolume * layer.amplitude * 0.8;
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + def.attack);
            gain.gain.setValueAtTime(volume, this.audioContext.currentTime + duration - def.release);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            // 接続
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            // 開始
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            if (lfo) lfo.stop(this.audioContext.currentTime + duration);
            
            // インスタンスに追加
            instrument.oscillators.push(osc);
            instrument.gainNodes.push(gain);
            instrument.filters.push(filter);
            
        } catch (error) {
            console.error('🎹 InstrumentBank: Failed to play pad layer:', error);
        }
    }
    
    /**
     * コード進行取得
     */
    getChordProgression(key) {
        const progressions = {
            'Am': [
                [110, 146.83, 174.61],      // Am
                [87.31, 116.54, 138.59],    // F
                [130.81, 174.61, 207.65],   // C
                [98, 130.81, 155.56]        // G
            ],
            'Fm': [
                [87.31, 116.54, 138.59],    // Fm
                [82.41, 110, 130.81],       // Db
                [92.5, 123.47, 146.83],     // Ab
                [98, 130.81, 155.56]        // G
            ],
            'Dm': [
                [146.83, 196, 233.08],      // Dm
                [110, 146.83, 174.61],      // Am
                [103.83, 138.59, 164.81],   // Bb
                [87.31, 116.54, 138.59]     // F
            ],
            'G': [
                [196, 246.94, 293.66],      // G
                [130.81, 174.61, 207.65],   // C
                [146.83, 196, 233.08],      // Dm
                [110, 146.83, 174.61]       // Am
            ]
        };
        
        return progressions[key] || progressions['Am'];
    }
    
    /**
     * パーカッション楽器演奏（シンバル、タムなど）
     */
    playPercussionInstrument(instrument, config) {
        const pattern = this.getPercussionPattern(this.globalTempo);
        let beatCount = 0;
        
        const playBeat = () => {
            if (!instrument.isPlaying) return;
            
            const currentBeat = pattern[beatCount % pattern.length];
            if (currentBeat.hit) {
                this.playPercussionHit(instrument, currentBeat.type, currentBeat.velocity);
            }
            
            beatCount++;
            setTimeout(playBeat, (60 / this.globalTempo) * 1000 / 4); // 16分音符
        };
        
        playBeat();
    }
    
    /**
     * パーカッションヒット演奏
     */
    playPercussionHit(instrument, type, velocity) {
        const def = instrument.definition;
        
        try {
            const noise = this.audioContext.createBufferSource();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // ノイズバッファ作成
            const buffer = this.audioContext.createBuffer(1, 4410, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < data.length; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            noise.buffer = buffer;
            
            // フィルター設定（タイプ別）
            const filterSettings = {
                'cymbal': { frequency: 8000, Q: 0.5 },
                'snare': { frequency: 2000, Q: 4.0 },
                'tom': { frequency: 400, Q: 2.0 },
                'hihat': { frequency: 10000, Q: 8.0 }
            };
            
            const setting = filterSettings[type] || filterSettings['snare'];
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(setting.frequency, this.audioContext.currentTime);
            filter.Q.setValueAtTime(setting.Q, this.audioContext.currentTime);
            
            // エンベロープ
            const volume = this.globalVolume * velocity * 0.6;
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.001);
            gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            
            // 接続
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            // 再生
            noise.start();
            noise.stop(this.audioContext.currentTime + 0.15);
            
            // インスタンスに追加
            instrument.oscillators.push(noise);
            instrument.gainNodes.push(gain);
            instrument.filters.push(filter);
            
        } catch (error) {
            console.error('🎹 InstrumentBank: Failed to play percussion hit:', error);
        }
    }
    
    /**
     * パーカッションパターン取得
     */
    getPercussionPattern(tempo) {
        const patterns = {
            slow: [
                { hit: true, type: 'cymbal', velocity: 0.8 },
                { hit: false }, { hit: false }, { hit: false },
                { hit: true, type: 'snare', velocity: 0.6 },
                { hit: false }, { hit: false }, { hit: false }
            ],
            medium: [
                { hit: true, type: 'hihat', velocity: 0.4 },
                { hit: false },
                { hit: true, type: 'snare', velocity: 0.7 },
                { hit: true, type: 'hihat', velocity: 0.3 }
            ],
            fast: [
                { hit: true, type: 'hihat', velocity: 0.5 },
                { hit: true, type: 'hihat', velocity: 0.3 },
                { hit: true, type: 'snare', velocity: 0.8 },
                { hit: true, type: 'hihat', velocity: 0.4 }
            ]
        };
        
        if (tempo < 60) return patterns.slow;
        if (tempo < 120) return patterns.medium;
        return patterns.fast;
    }
    
    /**
     * ドラム楽器演奏
     */
    playDrumsInstrument(instrument, config) {
        const pattern = this.getDrumPattern(this.globalTempo);
        let beatCount = 0;
        
        const playBeat = () => {
            if (!instrument.isPlaying) return;
            
            const beat = pattern[beatCount % pattern.length];
            const beatDuration = (60 / this.globalTempo) * 0.25; // 16分音符
            
            if (beat.kick) this.playDrumSound(instrument, 'kick');
            if (beat.snare) this.playDrumSound(instrument, 'snare');
            if (beat.hihat) this.playDrumSound(instrument, 'hihat');
            if (beat.crash) this.playDrumSound(instrument, 'crash');
            
            beatCount++;
            setTimeout(playBeat, beatDuration * 1000);
        };
        
        playBeat();
    }
    
    /**
     * ドラムパターン取得
     */
    getDrumPattern(tempo) {
        if (tempo >= 160) {
            // 高速テンポ（戦闘）
            return [
                { kick: true, hihat: true },
                { hihat: true },
                { snare: true, hihat: true },
                { hihat: true },
                { kick: true, hihat: true },
                { hihat: true },
                { snare: true, hihat: true, crash: true },
                { hihat: true }
            ];
        } else if (tempo >= 80) {
            // 中テンポ（緊張）
            return [
                { kick: true },
                {},
                { snare: true },
                {},
                { kick: true },
                {},
                { snare: true },
                { hihat: true }
            ];
        } else {
            // 低テンポ（静寂）
            return [
                { kick: true },
                {},
                {},
                {},
                { snare: true },
                {},
                {},
                {}
            ];
        }
    }
    
    /**
     * ドラム音演奏
     */
    playDrumSound(instrument, soundType) {
        const def = instrument.definition;
        const soundDef = def.sounds[soundType];
        if (!soundDef) return;
        
        try {
            if (soundDef.noise) {
                // ノイズベース（スネア、ハイハット）
                this.playNoiseSound(instrument, soundDef);
            } else {
                // 音程ベース（キック）
                this.playTonalSound(instrument, soundDef);
            }
        } catch (error) {
            console.error(`🎹 InstrumentBank: Failed to play drum sound ${soundType}:`, error);
        }
    }
    
    /**
     * ノイズサウンド再生
     */
    playNoiseSound(instrument, soundDef) {
        const bufferSize = this.audioContext.sampleRate * soundDef.decay;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // ノイズ生成
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * soundDef.volume;
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        // 周波数に応じたフィルタリング
        if (soundDef.frequency > 5000) {
            filter.type = 'highpass';
            filter.frequency.setValueAtTime(soundDef.frequency, this.audioContext.currentTime);
        } else {
            filter.type = 'bandpass';
            filter.frequency.setValueAtTime(soundDef.frequency, this.audioContext.currentTime);
            filter.Q.setValueAtTime(3, this.audioContext.currentTime);
        }
        
        const volume = this.globalVolume * soundDef.volume;
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + soundDef.decay);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
        source.stop(this.audioContext.currentTime + soundDef.decay);
    }
    
    /**
     * トーナルサウンド再生
     */
    playTonalSound(instrument, soundDef) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(soundDef.frequency, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(soundDef.frequency * 0.5, this.audioContext.currentTime + soundDef.decay);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(400, this.audioContext.currentTime);
        filter.Q.setValueAtTime(1, this.audioContext.currentTime);
        
        const volume = this.globalVolume * soundDef.volume;
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + soundDef.decay);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + soundDef.decay);
        
        instrument.oscillators.push(osc);
        instrument.gainNodes.push(gain);
        instrument.filters.push(filter);
    }
    
    /**
     * 楽器停止
     */
    stopInstrument(instrumentName, fadeTime = 1000) {
        const instrument = this.instruments.get(instrumentName);
        if (!instrument) return;
        
        instrument.isPlaying = false;
        
        // フェードアウト
        instrument.gainNodes.forEach(gain => {
            if (gain && gain.gain) {
                gain.gain.setTargetAtTime(0, this.audioContext.currentTime, fadeTime / 1000);
            }
        });
        
        // 少し後に完全削除
        setTimeout(() => {
            this.stopInstrumentNotes(instrument);
            this.instruments.delete(instrumentName);
            this.activeInstruments.delete(instrumentName);
        }, fadeTime + 100);
        
        console.log(`🎹 InstrumentBank: Stopped ${instrumentName}`);
    }
    
    /**
     * 楽器の音符停止
     */
    stopInstrumentNotes(instrument) {
        instrument.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        
        instrument.oscillators = [];
        instrument.gainNodes = [];
        instrument.filters = [];
    }
    
    /**
     * 全楽器停止
     */
    stopAll() {
        this.activeInstruments.forEach(name => {
            this.stopInstrument(name, 500);
        });
        console.log('🎹 InstrumentBank: All instruments stopped');
    }
    
    /**
     * グローバルパラメータ設定
     */
    setTempo(tempo) {
        this.globalTempo = Math.max(20, Math.min(300, tempo));
        console.log(`🎹 InstrumentBank: Tempo set to ${this.globalTempo} BPM`);
    }
    
    setIntensity(intensity) {
        this.globalIntensity = Math.max(0, Math.min(1, intensity));
    }
    
    setVolume(volume) {
        this.globalVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(this.globalVolume, this.audioContext.currentTime, 0.1);
        }
    }
    
    setGlobalIntensity(intensity) {
        this.setIntensity(intensity);
    }
    
    /**
     * アクティブ楽器取得
     */
    getActiveInstruments() {
        return Array.from(this.activeInstruments);
    }
    
    /**
     * ストリングス楽器演奏
     */
    playStringsInstrument(instrument, config) {
        const chord = this.getChordProgression(config.key || 'Fm')[0];
        const duration = 6; // 6秒持続
        
        this.playDarkStringsChord(instrument, chord, duration);
    }
    
    /**
     * ダークストリングスコード演奏
     */
    playDarkStringsChord(instrument, chord, duration) {
        const def = instrument.definition;
        
        chord.forEach((frequency, noteIndex) => {
            def.detuning.forEach((detune, detuneIndex) => {
                try {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const filter2 = this.audioContext.createBiquadFilter();
                    
                    osc.type = def.waveform;
                    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    osc.detune.setValueAtTime(detune, this.audioContext.currentTime);
                    
                    // ダブルローパスフィルター
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(def.filter.frequency + noteIndex * 80 - detuneIndex * 50, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
                    
                    filter2.type = 'lowpass';
                    filter2.frequency.setValueAtTime(400, this.audioContext.currentTime);
                    filter2.Q.setValueAtTime(2, this.audioContext.currentTime);
                    
                    const volume = (this.globalVolume / chord.length) * 0.6 / def.detuning.length;
                    
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + def.attack);
                    gain.gain.setValueAtTime(volume, this.audioContext.currentTime + duration - def.release);
                    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                    
                    osc.connect(filter);
                    filter.connect(filter2);
                    filter2.connect(gain);
                    gain.connect(this.masterGain);
                    
                    osc.start();
                    osc.stop(this.audioContext.currentTime + duration);
                    
                    instrument.oscillators.push(osc);
                    instrument.gainNodes.push(gain);
                    instrument.filters.push(filter);
                    
                } catch (error) {
                    console.error('🎹 InstrumentBank: Failed to play dark strings note:', error);
                }
            });
        });
    }
    
    /**
     * エレキギター楽器演奏
     */
    playElectricInstrument(instrument, config) {
        const chordProgression = this.getChordProgression(config.key || 'Dm');
        let chordIndex = 0;
        
        const playPowerChord = () => {
            if (!instrument.isPlaying) return;
            
            const rootFreq = chordProgression[chordIndex][0];
            const duration = (60 / this.globalTempo) * 2; // 2拍
            
            this.stopInstrumentNotes(instrument);
            this.playElectricPowerChord(instrument, rootFreq, duration);
            
            chordIndex = (chordIndex + 1) % chordProgression.length;
            setTimeout(playPowerChord, duration * 1000);
        };
        
        playPowerChord();
    }
    
    /**
     * エレキギターパワーコード演奏
     */
    playElectricPowerChord(instrument, frequency, duration) {
        const def = instrument.definition;
        const powerChord = [frequency, frequency * 1.5, frequency * 2]; // ルート + 5度 + オクターブ
        
        powerChord.forEach((freq, index) => {
            def.harmonics.forEach(harmonic => {
                try {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    const distortion = this.createDistortion(def.distortion.amount);
                    const filter = this.audioContext.createBiquadFilter();
                    
                    osc.type = def.waveform;
                    osc.frequency.setValueAtTime(freq * harmonic.ratio, this.audioContext.currentTime);
                    
                    filter.type = def.filter.type;
                    filter.frequency.setValueAtTime(def.filter.frequency + index * 200, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
                    filter.gain.setValueAtTime(def.filter.gain, this.audioContext.currentTime);
                    
                    const volume = (this.globalVolume / powerChord.length) * harmonic.amplitude * 0.8;
                    
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + def.attack);
                    gain.gain.setValueAtTime(volume, this.audioContext.currentTime + duration - def.release);
                    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                    
                    osc.connect(distortion);
                    distortion.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.masterGain);
                    
                    osc.start();
                    osc.stop(this.audioContext.currentTime + duration);
                    
                    instrument.oscillators.push(osc);
                    instrument.gainNodes.push(gain);
                    instrument.filters.push(filter);
                    
                } catch (error) {
                    console.error('🎹 InstrumentBank: Failed to play electric guitar harmonic:', error);
                }
            });
        });
    }
    
    /**
     * ベース楽器演奏
     */
    playBassInstrument(instrument, config) {
        const bassLine = this.getBassLine(config.key || 'Dm');
        let noteIndex = 0;
        
        const playBassNote = () => {
            if (!instrument.isPlaying) return;
            
            const frequency = bassLine[noteIndex];
            const duration = (60 / this.globalTempo) * 1; // 1拍
            
            this.stopInstrumentNotes(instrument);
            this.playBassNote(instrument, frequency, duration);
            
            noteIndex = (noteIndex + 1) % bassLine.length;
            setTimeout(playBassNote, duration * 1000);
        };
        
        playBassNote();
    }
    
    /**
     * ベースライン取得
     */
    getBassLine(key) {
        const bassLines = {
            'Dm': [146.83, 110, 103.83, 87.31], // Dm, Am, Bb, F
            'Am': [110, 87.31, 130.81, 98],     // Am, F, C, G
            'Fm': [87.31, 82.41, 92.5, 98],     // Fm, Db, Ab, G
            'G': [98, 65.41, 73.42, 55]         // G, C, D, A
        };
        
        return bassLines[key] || bassLines['Dm'];
    }
    
    /**
     * ベース音符演奏
     */
    playBassNote(instrument, frequency, duration) {
        const def = instrument.definition;
        
        try {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = def.waveform;
            osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            filter.type = def.filter.type;
            filter.frequency.setValueAtTime(def.filter.frequency, this.audioContext.currentTime);
            filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
            
            const volume = this.globalVolume * 0.8;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + def.attack);
            gain.gain.setValueAtTime(volume * def.sustain, this.audioContext.currentTime + def.attack + def.decay);
            gain.gain.setValueAtTime(volume * def.sustain, this.audioContext.currentTime + duration - def.release);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            
            instrument.oscillators.push(osc);
            instrument.gainNodes.push(gain);
            instrument.filters.push(filter);
            
        } catch (error) {
            console.error('🎹 InstrumentBank: Failed to play bass note:', error);
        }
    }
    
    /**
     * オーケストラ楽器演奏
     */
    playOrchestraInstrument(instrument, config) {
        const chord = this.getChordProgression(config.key || 'G')[0];
        const duration = 8; // 8秒持続
        
        this.playOrchestralChord(instrument, chord, duration);
    }
    
    /**
     * オーケストラルコード演奏
     */
    playOrchestralChord(instrument, chord, duration) {
        const def = instrument.definition;
        
        chord.forEach((frequency, noteIndex) => {
            def.sections.forEach((section, sectionIndex) => {
                section.harmonics.forEach((harmonic, harmonicIndex) => {
                    try {
                        const osc = this.audioContext.createOscillator();
                        const gain = this.audioContext.createGain();
                        const filter = this.audioContext.createBiquadFilter();
                        
                        osc.type = def.waveform;
                        osc.frequency.setValueAtTime(frequency * harmonic, this.audioContext.currentTime);
                        osc.detune.setValueAtTime(section.detune, this.audioContext.currentTime);
                        
                        filter.type = 'lowpass';
                        filter.frequency.setValueAtTime(section.filter + harmonic * 300, this.audioContext.currentTime);
                        filter.Q.setValueAtTime(0.8, this.audioContext.currentTime);
                        
                        const volume = (this.globalVolume / (chord.length * def.sections.length * section.harmonics.length)) * 0.7;
                        const attack = def.attack + sectionIndex * 0.1;
                        
                        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                        gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + attack);
                        gain.gain.setValueAtTime(volume, this.audioContext.currentTime + duration - def.release);
                        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                        
                        osc.connect(filter);
                        filter.connect(gain);
                        gain.connect(this.masterGain);
                        
                        osc.start();
                        osc.stop(this.audioContext.currentTime + duration);
                        
                        instrument.oscillators.push(osc);
                        instrument.gainNodes.push(gain);
                        instrument.filters.push(filter);
                        
                    } catch (error) {
                        console.error('🎹 InstrumentBank: Failed to play orchestral note:', error);
                    }
                });
            });
        });
    }
    
    /**
     * ブラス楽器演奏
     */
    playBrassInstrument(instrument, config) {
        const chord = this.getChordProgression(config.key || 'G')[0];
        const duration = 4; // 4秒持続
        
        this.playBrassChord(instrument, chord, duration);
    }
    
    /**
     * ブラスコード演奏
     */
    playBrassChord(instrument, chord, duration) {
        const def = instrument.definition;
        
        chord.forEach((frequency, noteIndex) => {
            def.harmonics.forEach((harmonic, harmonicIndex) => {
                try {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    
                    osc.type = def.waveform;
                    osc.frequency.setValueAtTime(frequency * harmonic.ratio, this.audioContext.currentTime);
                    
                    filter.type = def.filter.type;
                    filter.frequency.setValueAtTime(def.filter.frequency, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
                    filter.gain.setValueAtTime(def.filter.gain, this.audioContext.currentTime);
                    
                    const volume = (this.globalVolume / (chord.length * def.harmonics.length)) * harmonic.amplitude * 0.8;
                    
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + def.attack);
                    gain.gain.setValueAtTime(volume * def.sustain, this.audioContext.currentTime + def.attack + def.decay);
                    gain.gain.setValueAtTime(volume * def.sustain, this.audioContext.currentTime + duration - def.release);
                    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.masterGain);
                    
                    osc.start();
                    osc.stop(this.audioContext.currentTime + duration);
                    
                    instrument.oscillators.push(osc);
                    instrument.gainNodes.push(gain);
                    instrument.filters.push(filter);
                    
                } catch (error) {
                    console.error('🎹 InstrumentBank: Failed to play brass note:', error);
                }
            });
        });
    }
    
    /**
     * ディストーション作成
     */
    createDistortion(amount) {
        const waveshaper = this.audioContext.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        return waveshaper;
    }
    
    /**
     * システム更新
     */
    update(deltaTime) {
        // ポリフォニー管理
        this.currentPolyphony = 0;
        this.instruments.forEach(instrument => {
            this.currentPolyphony += instrument.oscillators.length;
        });
        
        // 最大ポリフォニー超過時の対処
        if (this.currentPolyphony > this.maxPolyphony) {
            console.warn(`🎹 InstrumentBank: Polyphony limit exceeded: ${this.currentPolyphony}/${this.maxPolyphony}`);
        }
    }
}