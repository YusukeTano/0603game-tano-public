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
     * アコースティックギター音色（静寂の森用）
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playAcousticGuitar(frequency, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        // より豊かな倍音構造でアコースティック感を強化
        const harmonics = [
            { freq: frequency, amp: 1.0, detune: 0 },
            { freq: frequency * 2, amp: 0.7, detune: -5 },
            { freq: frequency * 3, amp: 0.4, detune: 3 },
            { freq: frequency * 4, amp: 0.2, detune: -2 },
            { freq: frequency * 5, amp: 0.1, detune: 1 }
        ];
        
        harmonics.forEach((harmonic, index) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            const compressor = this.audioContext.createDynamicsCompressor();
            
            // より自然な波形の組み合わせ
            osc.type = index < 2 ? 'triangle' : 'sine';
            osc.frequency.setValueAtTime(harmonic.freq, this.audioContext.currentTime);
            osc.detune.setValueAtTime(harmonic.detune, this.audioContext.currentTime);
            
            // より豊かなフィルタリング
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1800 + index * 200, this.audioContext.currentTime);
            filter.Q.setValueAtTime(0.8, this.audioContext.currentTime);
            
            // コンプレッサーで自然な響き
            compressor.threshold.setValueAtTime(-24, this.audioContext.currentTime);
            compressor.knee.setValueAtTime(30, this.audioContext.currentTime);
            compressor.ratio.setValueAtTime(3, this.audioContext.currentTime);
            compressor.attack.setValueAtTime(0.003, this.audioContext.currentTime);
            compressor.release.setValueAtTime(0.25, this.audioContext.currentTime);
            
            // より自然なADSRエンベロープ
            const attack = 0.03 + index * 0.01;
            const decay = 0.15;
            const sustain = 0.6;
            const release = 0.6;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume * harmonic.amp * 0.4, this.audioContext.currentTime + attack);
            gain.gain.linearRampToValueAtTime(volume * harmonic.amp * sustain * 0.4, this.audioContext.currentTime + attack + decay);
            gain.gain.setValueAtTime(volume * harmonic.amp * sustain * 0.4, this.audioContext.currentTime + duration - release);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            osc.connect(filter);
            filter.connect(compressor);
            compressor.connect(gain);
            gain.connect(this.masterGain);
            
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            this.activeOscillators.push(osc);
        });
    }
    
    /**
     * ダークストリングス音色（危険の予感用）
     * @param {Array} chord - コード配列 [freq1, freq2, freq3...]
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playDarkStrings(chord, duration, volume = 0.4) {
        if (!this.audioContext) return;
        
        chord.forEach((frequency, index) => {
            // 複数レイヤーで厚みのあるダークストリングス
            const layers = [
                { type: 'sawtooth', detune: 0, amp: 1.0 },
                { type: 'sawtooth', detune: -7, amp: 0.6 },
                { type: 'square', detune: 12, amp: 0.3 },
                { type: 'triangle', detune: -12, amp: 0.4 }
            ];
            
            layers.forEach((layer, layerIndex) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                const filter2 = this.audioContext.createBiquadFilter();
                
                osc.type = layer.type;
                osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                osc.detune.setValueAtTime(layer.detune, this.audioContext.currentTime);
                
                // ダブルローパスフィルターで暗く重い音色
                filter.type = 'lowpass';
                filter.frequency.setValueAtTime(600 + index * 80 - layerIndex * 50, this.audioContext.currentTime);
                filter.Q.setValueAtTime(4, this.audioContext.currentTime);
                
                filter2.type = 'lowpass';
                filter2.frequency.setValueAtTime(400, this.audioContext.currentTime);
                filter2.Q.setValueAtTime(2, this.audioContext.currentTime);
                
                // 不安感を醸成するスローアタック
                const attack = 0.5 + layerIndex * 0.1;
                const release = 1.2;
                
                const layerVolume = (volume / chord.length) * layer.amp * 0.6;
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(layerVolume, this.audioContext.currentTime + attack);
                gain.gain.setValueAtTime(layerVolume, this.audioContext.currentTime + duration - release);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                
                osc.connect(filter);
                filter.connect(filter2);
                filter2.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + duration);
                this.activeOscillators.push(osc);
            });
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
     * エレキギター（戦闘開始用パワーコード）
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playElectricGuitar(frequency, duration, volume = 0.6) {
        if (!this.audioContext) return;
        
        // 厚みのあるパワーコード (ルート + 5度 + オクターブ)
        const powerChord = [frequency, frequency * 1.5, frequency * 2];
        
        powerChord.forEach((freq, index) => {
            // デュアルレイヤーで迫力アップ
            const layers = [
                { detune: 0, amp: 1.0, distortion: 70 },
                { detune: -5, amp: 0.7, distortion: 40 }
            ];
            
            layers.forEach((layer, layerIndex) => {
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const distortion = this.audioContext.createWaveShaper();
                const filter = this.audioContext.createBiquadFilter();
                const compressor = this.audioContext.createDynamicsCompressor();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                osc.detune.setValueAtTime(layer.detune, this.audioContext.currentTime);
                
                // 強烈なディストーション
                distortion.curve = this.createDistortionCurve(layer.distortion);
                distortion.oversample = '4x';
                
                // 戦闘的なEQ設定
                filter.type = 'peaking';
                filter.frequency.setValueAtTime(800 + index * 200, this.audioContext.currentTime);
                filter.Q.setValueAtTime(3, this.audioContext.currentTime);
                filter.gain.setValueAtTime(8, this.audioContext.currentTime);
                
                // コンプレッサーで音圧アップ
                compressor.threshold.setValueAtTime(-18, this.audioContext.currentTime);
                compressor.knee.setValueAtTime(40, this.audioContext.currentTime);
                compressor.ratio.setValueAtTime(6, this.audioContext.currentTime);
                compressor.attack.setValueAtTime(0.002, this.audioContext.currentTime);
                compressor.release.setValueAtTime(0.15, this.audioContext.currentTime);
                
                const attack = 0.005;
                const release = 0.3;
                const layerVolume = (volume / powerChord.length) * layer.amp * 0.8;
                
                gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                gain.gain.linearRampToValueAtTime(layerVolume, this.audioContext.currentTime + attack);
                gain.gain.setValueAtTime(layerVolume, this.audioContext.currentTime + duration - release);
                gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                
                osc.connect(distortion);
                distortion.connect(filter);
                filter.connect(compressor);
                compressor.connect(gain);
                gain.connect(this.masterGain);
                
                osc.start();
                osc.stop(this.audioContext.currentTime + duration);
                this.activeOscillators.push(osc);
            });
        });
    }
    
    /**
     * オーケストラルストリングス（勝利への道用）
     * @param {Array} chord - コード配列
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playOrchestralStrings(chord, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        chord.forEach((frequency, index) => {
            // リッチな倍音構造で壮大感を演出
            const sections = [
                { harmonics: [1, 2, 3], type: 'sawtooth', detune: 0, amp: 1.0 },      // 第1バイオリン
                { harmonics: [1, 2], type: 'triangle', detune: -3, amp: 0.8 },        // 第2バイオリン
                { harmonics: [1, 1.5], type: 'sawtooth', detune: -12, amp: 0.6 },     // ビオラ
                { harmonics: [1], type: 'square', detune: -24, amp: 0.7 }             // チェロ
            ];
            
            sections.forEach((section, sectionIndex) => {
                section.harmonics.forEach((harmonic, hIndex) => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const reverb = this.audioContext.createConvolver();
                    
                    osc.type = section.type;
                    osc.frequency.setValueAtTime(frequency * harmonic, this.audioContext.currentTime);
                    osc.detune.setValueAtTime(section.detune, this.audioContext.currentTime);
                    
                    // セクション別のフィルタリング
                    filter.type = 'lowpass';
                    const cutoff = sectionIndex === 0 ? 4000 : // バイオリン（明るい）
                                  sectionIndex === 1 ? 3000 : // セカンドバイオリン（中程度）
                                  sectionIndex === 2 ? 2000 : // ビオラ（暖かい）
                                  1200;                        // チェロ（深い）
                    filter.frequency.setValueAtTime(cutoff + harmonic * 300, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.8, this.audioContext.currentTime);
                    
                    // 雄大なアタック
                    const attack = 0.8 + sectionIndex * 0.1;
                    const release = 2.0;
                    const harmonicVolume = (volume / (chord.length * section.harmonics.length)) * 
                                         section.amp / (hIndex + 1) * 0.7;
                    
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
        });
    }
    
    /**
     * 新楽器: アンビエントパッド（静寂の森用）
     * @param {Array} chord - コード配列
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playAmbientPad(chord, duration, volume = 0.3) {
        if (!this.audioContext) return;
        
        chord.forEach((frequency, index) => {
            const layers = [
                { type: 'sine', detune: 0, amp: 1.0, delay: 0 },
                { type: 'triangle', detune: 12, amp: 0.6, delay: 2000 },
                { type: 'sine', detune: -12, amp: 0.5, delay: 4000 }
            ];
            
            layers.forEach((layer, layerIndex) => {
                setTimeout(() => {
                    const osc = this.audioContext.createOscillator();
                    const gain = this.audioContext.createGain();
                    const filter = this.audioContext.createBiquadFilter();
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    
                    osc.type = layer.type;
                    osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    osc.detune.setValueAtTime(layer.detune, this.audioContext.currentTime);
                    
                    // LFOでわずかな揺らぎ
                    lfo.type = 'sine';
                    lfo.frequency.setValueAtTime(0.1 + layerIndex * 0.05, this.audioContext.currentTime);
                    lfoGain.gain.setValueAtTime(3, this.audioContext.currentTime);
                    lfo.connect(lfoGain);
                    lfoGain.connect(osc.detune);
                    
                    filter.type = 'lowpass';
                    filter.frequency.setValueAtTime(800 + index * 100, this.audioContext.currentTime);
                    filter.Q.setValueAtTime(0.5, this.audioContext.currentTime);
                    
                    const layerVolume = (volume / chord.length) * layer.amp * 0.8;
                    const attack = 3.0;
                    const release = 3.0;
                    
                    gain.gain.setValueAtTime(0, this.audioContext.currentTime);
                    gain.gain.linearRampToValueAtTime(layerVolume, this.audioContext.currentTime + attack);
                    gain.gain.setValueAtTime(layerVolume, this.audioContext.currentTime + duration - release);
                    gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
                    
                    osc.connect(filter);
                    filter.connect(gain);
                    gain.connect(this.masterGain);
                    
                    lfo.start();
                    osc.start();
                    osc.stop(this.audioContext.currentTime + duration);
                    lfo.stop(this.audioContext.currentTime + duration);
                    this.activeOscillators.push(osc);
                }, layer.delay);
            });
        });
    }
    
    /**
     * 新楽器: エピックドラムス（勝利への道用）
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playEpicDrums(volume = 0.5) {
        if (!this.audioContext) return;
        
        // ティンパニ風キック
        this.playTimpani(80, 0.8, volume * 0.9);
        
        // シンバルクラッシュ
        setTimeout(() => {
            this.playCymbalCrash(0.6, volume * 0.7);
        }, 200);
        
        // スネアロール
        setTimeout(() => {
            this.playSnareRoll(0.4, volume * 0.6);
        }, 1000);
    }
    
    /**
     * ティンパニ音色
     * @param {number} frequency - 基本周波数
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playTimpani(frequency, duration, volume = 0.5) {
        if (!this.audioContext) return;
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(frequency * 0.4, this.audioContext.currentTime + duration);
        
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, this.audioContext.currentTime);
        filter.Q.setValueAtTime(10, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
        this.activeOscillators.push(osc);
    }
    
    /**
     * シンバルクラッシュ音色
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playCymbalCrash(duration, volume = 0.3) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // メタリックなノイズ生成
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.sin(i * 0.01) * volume;
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        filter.type = 'highpass';
        filter.frequency.setValueAtTime(6000, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
        source.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * スネアロール音色
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playSnareRoll(duration, volume = 0.4) {
        if (!this.audioContext) return;
        
        const hits = 16; // ロール内のヒット数
        const interval = duration / hits;
        
        for (let i = 0; i < hits; i++) {
            setTimeout(() => {
                this.playSnareHit(0.03, volume * (0.7 + Math.random() * 0.3));
            }, i * interval * 1000);
        }
    }
    
    /**
     * スネアヒット音色
     * @param {number} duration - 持続時間(秒)
     * @param {number} volume - 音量 (0.0-1.0)
     */
    playSnareHit(duration, volume = 0.3) {
        if (!this.audioContext) return;
        
        const bufferSize = this.audioContext.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // ノイズ + トーン
        for (let i = 0; i < bufferSize; i++) {
            const noise = (Math.random() * 2 - 1) * 0.8;
            const tone = Math.sin(i * 0.02) * 0.2;
            data[i] = (noise + tone) * volume;
        }
        
        const source = this.audioContext.createBufferSource();
        const gain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        source.buffer = buffer;
        
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(2000, this.audioContext.currentTime);
        filter.Q.setValueAtTime(3, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        source.connect(filter);
        filter.connect(gain);
        gain.connect(this.masterGain);
        
        source.start();
        source.stop(this.audioContext.currentTime + duration);
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