/**
 * InstrumentSynthesizer - 楽器音色シミュレーションシステム
 * Web Audio APIを使用してリアルな楽器音を生成
 */
export class InstrumentSynthesizer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.activeOscillators = [];
        this.masterGain = null;
        
        if (this.audioContext) {
            this.masterGain = this.audioContext.createGain();
            this.masterGain.connect(this.audioContext.destination);
            this.masterGain.gain.setValueAtTime(1.0, this.audioContext.currentTime);
        }
        
        console.log('InstrumentSynthesizer: Initialized');
    }
    
    /**
     * アコースティックギター音色
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playAcousticGuitar(frequency, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        // アコースティックギターの倍音構造 (1, 2, 3, 4倍音)
        const harmonics = [
            { freq: frequency, amp: 1.0 },
            { freq: frequency * 2, amp: 0.6 },
            { freq: frequency * 3, amp: 0.3 },
            { freq: frequency * 4, amp: 0.15 }
        ];
        
        harmonics.forEach((harmonic, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // ギター特有の波形 (三角波ベース)
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(harmonic.freq, this.audioContext.currentTime);
            
            // ローパスフィルターでアコースティック感
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
            filter.Q.setValueAtTime(1, this.audioContext.currentTime);
            
            // ADSR エンベロープ (Attack-Decay-Sustain-Release)
            const attack = 0.05;
            const decay = 0.2;
            const sustain = 0.4;
            const release = 0.8;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume * harmonic.amp * 0.3, this.audioContext.currentTime + attack);
            gain.gain.linearRampToValueAtTime(volume * harmonic.amp * sustain * 0.3, this.audioContext.currentTime + attack + decay);
            gain.gain.setValueAtTime(volume * harmonic.amp * sustain * 0.3, this.audioContext.currentTime + duration - release);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            this.activeOscillators.push(osc);
        });
    }
    
    /**
     * ダークストリングス音色
     * @param {Array} chord - コード配列 [freq1, freq2, freq3...]
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playDarkStrings(chord, duration, volume = 0.4) {
        if (!this.audioContext) return;
        
        chord.forEach((frequency, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // ストリングス特有の鋸波
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            // ダークな音色のためのローパスフィルター
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800 + index * 100, this.audioContext.currentTime);
            filter.Q.setValueAtTime(3, this.audioContext.currentTime);
            
            // スロー・アタックでストリングス感
            const attack = 0.3;
            const release = 1.0;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume / chord.length, this.audioContext.currentTime + attack);
            gain.gain.setValueAtTime(volume / chord.length, this.audioContext.currentTime + duration - release);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            this.activeOscillators.push(osc);
        });
    }
    
    /**
     * サブトルドラムス（控えめなドラム）
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playSubtleDrums(volume = 0.3) {
        if (!this.audioContext) return;
        
        // キック（低音）
        this.playKickDrum(60, 0.1, volume * 0.8);
        
        // ハイハット（高音）
        setTimeout(() => {
            this.playHiHat(0.05, volume * 0.5);
        }, 500);
    }
    
    /**
     * キックドラム音色
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playKickDrum(frequency, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.3, this.audioContext.currentTime + duration);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
        this.activeOscillators.push(osc);
    }
    
    /**
     * ハイハット音色
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playHiHat(duration, volume = 0.3) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // ホワイトノイズ生成
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * volume;
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(8000, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
        source.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * エレキギター（パワーコード）
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playElectricGuitar(frequency, duration, volume = 0.6) {
        if (!this.audioContext) return;
        
        // パワーコード (ルート + 5度)
        const powerChord = [frequency, frequency * 1.5];
        
        powerChord.forEach((freq, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const distortion = this.audioContext.createWaveShaper();
            const filter = this.audioContext.createBiquadFilter();
            
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
            
            // ディストーション効果
            distortion.curve = this.createDistortionCurve(50);
            
            // ミッドレンジブースト
            filter.type = 'peaking';
            filter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            filter.Q.setValueAtTime(2, this.audioContext.currentTime);
            filter.gain.setValueAtTime(6, this.audioContext.currentTime);
            
            const attack = 0.01;
            const release = 0.2;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume / powerChord.length, this.audioContext.currentTime + attack);
            gain.gain.setValueAtTime(volume / powerChord.length, this.audioContext.currentTime + duration - release);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            osc.connect(distortion);
            distortion.connect(filter);
            filter.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            this.activeOscillators.push(osc);
        });
    }
    
    /**
     * オーケストラルストリングス
     * @param {Array} chord - コード配列
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playOrchestralStrings(chord, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        chord.forEach((frequency, index) => {
            // 各音に対して複数の倍音を生成
            const harmonics = [1, 2, 3, 4, 5];
            
            harmonics.forEach((harmonic, hIndex) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(frequency * harmonic, this.audioContext.currentTime);
                
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(2000 + harmonic * 500, this.audioContext.currentTime);
                filter.Q.setValueAtTime(1, this.audioContext.currentTime);
                
                const harmonicVolume = volume / (chord.length * harmonics.length) / (hIndex + 1);
                const attack = 0.5;
                const release = 1.5;
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(harmonicVolume, this.audioContext.currentTime + attack);
                gain.gain.setValueAtTime(harmonicVolume, this.audioContext.currentTime + duration - release);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + duration);
                this.activeOscillators.push(osc);
            });
        });
    }
    
    /**
     * ディストーション曲線作成
     * @param {number} amount - ディストーション量
     * @returns {Float32Array} ディストーション曲線
     */
    createDistortionCurve(amount) {
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        return curve;
    }
    
    /**
     * 全ての再生中音源を停止
     */
    stopAll() {
        this.activeOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {
                // 既に停止済みの場合は無視
            }
        });
        this.activeOscillators = [];
    }
    
    /**
     * マスター音量設定
     * @param {number} volume - 音量 (0.0-1.0)
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setTargetAtTime(volume, this.audioContext.currentTime, 0.1);
        }
    }
}