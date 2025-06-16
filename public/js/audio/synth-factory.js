/**
 * SynthFactory - モダンシンセサイザー楽器ファクトリー
 * Future Synthwave用の高品質楽器音源生成
 */
export class SynthFactory {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.presets = this.initializePresets();
        
        console.log('🎹 SynthFactory: Modern synthesizer instruments initialized');
    }
    
    /**
     * プリセット初期化
     */
    initializePresets() {
        return {
            // === Lead Synthesizers ===
            leadSynth: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, amplitude: 1.0 },
                    { type: 'square', detune: -7, amplitude: 0.6 }
                ],
                filter: { type: 'lowpass', frequency: 2000, Q: 2, envelope: true },
                envelope: { attack: 0.05, decay: 0.3, sustain: 0.6, release: 0.8 },
                effects: ['chorus', 'delay']
            },
            
            arpSynth: {
                oscillators: [
                    { type: 'square', detune: 0, amplitude: 1.0 },
                    { type: 'sawtooth', detune: 12, amplitude: 0.4 }
                ],
                filter: { type: 'lowpass', frequency: 1500, Q: 3, envelope: true },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.2 },
                effects: ['chorus'],
                pattern: 'arpeggiator'
            },
            
            pluckLead: {
                oscillators: [
                    { type: 'triangle', detune: 0, amplitude: 1.0 }
                ],
                filter: { type: 'lowpass', frequency: 3000, Q: 1, envelope: true },
                envelope: { attack: 0.01, decay: 0.4, sustain: 0.2, release: 0.3 },
                effects: ['reverb']
            },
            
            // === Bass Synthesizers ===
            subBass: {
                oscillators: [
                    { type: 'sine', detune: 0, amplitude: 1.0 },
                    { type: 'square', detune: 0, amplitude: 0.3 }
                ],
                filter: { type: 'lowpass', frequency: 150, Q: 1 },
                envelope: { attack: 0.02, decay: 0.1, sustain: 0.8, release: 0.5 },
                effects: ['compression']
            },
            
            reeseBass: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, amplitude: 1.0 },
                    { type: 'sawtooth', detune: -5, amplitude: 0.8 },
                    { type: 'sawtooth', detune: 5, amplitude: 0.8 }
                ],
                filter: { type: 'lowpass', frequency: 300, Q: 8, envelope: true },
                envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.4 },
                effects: ['distortion', 'compression']
            },
            
            wobbleLead: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, amplitude: 1.0 }
                ],
                filter: { type: 'lowpass', frequency: 200, Q: 10, lfo: true },
                envelope: { attack: 0.01, decay: 0.1, sustain: 0.8, release: 0.3 },
                lfo: { rate: 6, depth: 800, target: 'filter' },
                effects: ['distortion']
            },
            
            // === Pad Synthesizers ===
            neonPad: {
                oscillators: [
                    { type: 'sine', detune: 0, amplitude: 1.0 },
                    { type: 'triangle', detune: 12, amplitude: 0.6 },
                    { type: 'sine', detune: -12, amplitude: 0.5 }
                ],
                filter: { type: 'lowpass', frequency: 800, Q: 0.5 },
                envelope: { attack: 3.0, decay: 1.0, sustain: 0.8, release: 4.0 },
                effects: ['chorus', 'reverb', 'delay']
            },
            
            retroPad: {
                oscillators: [
                    { type: 'sawtooth', detune: 0, amplitude: 1.0 },
                    { type: 'square', detune: -7, amplitude: 0.4 }
                ],
                filter: { type: 'lowpass', frequency: 1200, Q: 1.5 },
                envelope: { attack: 2.0, decay: 1.5, sustain: 0.7, release: 3.0 },
                effects: ['chorus', 'reverb']
            }
        };
    }
    
    /**
     * 楽器作成
     * @param {string} instrumentType - 楽器タイプ
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間
     * @param {number} velocity - ベロシティ (0.0-1.0)
     * @returns {Object} 楽器インスタンス
     */
    createInstrument(instrumentType, frequency, duration, velocity = 0.8) {
        const preset = this.presets[instrumentType];
        if (!preset) {
            console.warn(`🎹 SynthFactory: Unknown instrument type: ${instrumentType}`);
            return this.createSimpleSynth(frequency, duration, velocity);
        }
        
        const now = this.audioContext.currentTime;
        const instrument = {
            oscillators: [],
            gainNodes: [],
            filterNodes: [],
            startTime: now,
            duration: duration
        };
        
        // オシレーター作成
        preset.oscillators.forEach((oscConfig, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            
            osc.type = oscConfig.type;
            osc.frequency.setValueAtTime(frequency, now);
            osc.detune.setValueAtTime(oscConfig.detune, now);
            
            // エンベロープ適用
            this.applyEnvelope(gain, preset.envelope, duration, velocity * oscConfig.amplitude);
            
            instrument.oscillators.push(osc);
            instrument.gainNodes.push(gain);
        });
        
        // フィルター作成
        if (preset.filter) {
            const filter = this.createFilter(preset.filter, now, duration);
            instrument.filterNodes.push(filter);
        }
        
        // LFO作成
        if (preset.lfo) {
            const lfo = this.createLFO(preset.lfo, instrument, now, duration);
            instrument.lfo = lfo;
        }
        
        // 接続
        this.connectInstrument(instrument);
        
        // 開始
        instrument.oscillators.forEach(osc => osc.start(now));
        
        // 停止予約
        setTimeout(() => {
            this.stopInstrument(instrument);
        }, duration * 1000);
        
        return instrument;
    }
    
    /**
     * シンプルシンセ作成（フォールバック）
     */
    createSimpleSynth(frequency, duration, velocity) {
        const now = this.audioContext.currentTime;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(frequency, now);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.Q.setValueAtTime(1, now);
        
        // シンプルエンベロープ
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(velocity * 0.3, now + 0.1);
        gain.gain.setValueAtTime(velocity * 0.3, now + duration - 0.2);
        gain.gain.linearRampToValueAtTime(0, now + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.start(now);
        osc.stop(now + duration);
        
        return {
            oscillators: [osc],
            gainNodes: [gain],
            filterNodes: [filter]
        };
    }
    
    /**
     * エンベロープ適用
     */
    applyEnvelope(gainNode, envelope, duration, amplitude) {
        const now = this.audioContext.currentTime;
        const { attack, decay, sustain, release } = envelope;
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(amplitude, now + attack);
        gainNode.gain.linearRampToValueAtTime(amplitude * sustain, now + attack + decay);
        gainNode.gain.setValueAtTime(amplitude * sustain, now + duration - release);
        gainNode.gain.linearRampToValueAtTime(0, now + duration);
    }
    
    /**
     * フィルター作成
     */
    createFilter(filterConfig, startTime, duration) {
        const filter = this.audioContext.createBiquadFilter();
        
        filter.type = filterConfig.type;
        filter.frequency.setValueAtTime(filterConfig.frequency, startTime);
        filter.Q.setValueAtTime(filterConfig.Q, startTime);
        
        // フィルターエンベロープ
        if (filterConfig.envelope) {
            const cutoffSweep = filterConfig.frequency * 2;
            filter.frequency.setValueAtTime(filterConfig.frequency, startTime);
            filter.frequency.linearRampToValueAtTime(cutoffSweep, startTime + 0.1);
            filter.frequency.setValueAtTime(cutoffSweep * 0.7, startTime + duration - 0.2);
            filter.frequency.linearRampToValueAtTime(filterConfig.frequency, startTime + duration);
        }
        
        return filter;
    }
    
    /**
     * LFO作成
     */
    createLFO(lfoConfig, instrument, startTime, duration) {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(lfoConfig.rate, startTime);
        lfoGain.gain.setValueAtTime(lfoConfig.depth, startTime);
        
        lfo.connect(lfoGain);
        
        // LFOターゲット接続
        if (lfoConfig.target === 'filter' && instrument.filterNodes.length > 0) {
            lfoGain.connect(instrument.filterNodes[0].frequency);
        }
        
        lfo.start(startTime);
        lfo.stop(startTime + duration);
        
        return { oscillator: lfo, gain: lfoGain };
    }
    
    /**
     * 楽器接続
     */
    connectInstrument(instrument) {
        const destination = this.audioContext.destination;
        
        instrument.oscillators.forEach((osc, index) => {
            const gain = instrument.gainNodes[index];
            let currentNode = osc;
            
            // フィルター接続
            if (instrument.filterNodes.length > 0) {
                currentNode.connect(instrument.filterNodes[0]);
                currentNode = instrument.filterNodes[0];
            }
            
            // ゲイン接続
            currentNode.connect(gain);
            gain.connect(destination);
        });
    }
    
    /**
     * 楽器停止
     */
    stopInstrument(instrument) {
        try {
            instrument.oscillators.forEach(osc => {
                if (osc.stop) osc.stop();
            });
            
            if (instrument.lfo) {
                instrument.lfo.oscillator.stop();
            }
        } catch (error) {
            console.warn('🎹 SynthFactory: Error stopping instrument:', error);
        }
    }
    
    /**
     * コード演奏
     * @param {string} instrumentType - 楽器タイプ
     * @param {Array} frequencies - 周波数配列
     * @param {number} duration - 持続時間
     * @param {number} velocity - ベロシティ
     * @returns {Array} 楽器インスタンス配列
     */
    playChord(instrumentType, frequencies, duration, velocity = 0.8) {
        return frequencies.map((freq, index) => {
            const delay = index * 0.01; // わずかにストラム
            setTimeout(() => {
                this.createInstrument(instrumentType, freq, duration, velocity);
            }, delay * 1000);
        });
    }
    
    /**
     * アルペジオ演奏
     * @param {string} instrumentType - 楽器タイプ
     * @param {Array} frequencies - 周波数配列
     * @param {number} noteDuration - 音符持続時間
     * @param {number} velocity - ベロシティ
     */
    playArpeggio(instrumentType, frequencies, noteDuration, velocity = 0.8) {
        frequencies.forEach((freq, index) => {
            const delay = index * noteDuration;
            setTimeout(() => {
                this.createInstrument(instrumentType, freq, noteDuration, velocity);
            }, delay * 1000);
        });
    }
    
    /**
     * 周波数取得
     * @param {string} note - ノート名 (例: 'C4', 'A#3')
     * @returns {number} 周波数
     */
    getFrequency(note) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        
        const noteName = note.slice(0, -1);
        const octave = parseInt(note.slice(-1));
        
        const noteNumber = noteMap[noteName];
        if (noteNumber === undefined) {
            console.warn(`🎹 SynthFactory: Unknown note: ${note}`);
            return 440; // A4
        }
        
        // A4 = 440Hz を基準とした計算
        const a4 = 69; // MIDI note number for A4
        const midiNumber = (octave + 1) * 12 + noteNumber;
        
        return 440 * Math.pow(2, (midiNumber - a4) / 12);
    }
    
    /**
     * コード周波数取得
     * @param {string} chordName - コード名 (例: 'Cmaj', 'Am', 'F')
     * @param {number} octave - オクターブ
     * @returns {Array} 周波数配列
     */
    getChordFrequencies(chordName, octave = 4) {
        const chordMap = {
            'C': ['C', 'E', 'G'],
            'Cmaj': ['C', 'E', 'G'],
            'Dm': ['D', 'F', 'A'],
            'Em': ['E', 'G', 'B'],
            'F': ['F', 'A', 'C'],
            'G': ['G', 'B', 'D'],
            'Am': ['A', 'C', 'E'],
            'Bb': ['Bb', 'D', 'F']
        };
        
        const notes = chordMap[chordName];
        if (!notes) {
            console.warn(`🎹 SynthFactory: Unknown chord: ${chordName}`);
            return [this.getFrequency('C4')];
        }
        
        return notes.map(note => this.getFrequency(note + octave));
    }
}