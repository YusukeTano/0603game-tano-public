/**
 * ProSFXEngine - プロレベル効果音エンジン
 * 物理音響シミュレーション・心理音響最適化・空間音響処理
 */
export class ProSFXEngine {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.masterGain = null;
        
        // 音響物理定数
        this.SOUND_SPEED = 343; // 音速 m/s
        this.AIR_DENSITY = 1.225; // 空気密度 kg/m³
        
        // 心理音響パラメータ
        this.PSYCHOACOUSTIC = {
            punchFreq: 2500,      // パンチ感周波数
            warmthFreq: 250,      // 温かみ周波数
            clarityFreq: 5000,    // 明瞭感周波数
            impactThreshold: 0.8, // インパクト閾値
            satisfactionCurve: 'exponential' // 満足感カーブ
        };
        
        // 環境音響パラメータ
        this.ENVIRONMENT = {
            roomSize: 50,         // 仮想空間サイズ (m)
            absorption: 0.3,      // 吸音率
            reflection: 0.7,      // 反射率
            airLoss: 0.02        // 空気減衰率
        };
        
        console.log('🎵 ProSFXEngine: Professional audio engine initialized');
    }
    
    /**
     * エンジン初期化
     */
    async initialize() {
        this.masterGain = this.audioContext.createGain();
        this.masterGain.connect(this.audioContext.destination);
        this.masterGain.gain.value = 1.0;
        
        console.log('🎵 ProSFXEngine: Engine ready for professional audio synthesis', {
            sampleRate: this.audioContext.sampleRate,
            state: this.audioContext.state
        });
    }
    
    /**
     * マルチバンド周波数分析器作成
     */
    createMultibandAnalyzer() {
        const bands = {
            sub: this.createBandpassFilter(20, 60),      // サブ低域
            low: this.createBandpassFilter(60, 200),     // 低域
            lowMid: this.createBandpassFilter(200, 800), // 低中域
            mid: this.createBandpassFilter(800, 2000),   // 中域
            highMid: this.createBandpassFilter(2000, 5000), // 高中域
            high: this.createBandpassFilter(5000, 12000),   // 高域
            presence: this.createBandpassFilter(12000, 20000) // プレゼンス
        };
        
        return bands;
    }
    
    /**
     * バンドパスフィルター作成
     */
    createBandpassFilter(lowFreq, highFreq) {
        const lowpass = this.audioContext.createBiquadFilter();
        const highpass = this.audioContext.createBiquadFilter();
        
        lowpass.type = 'lowpass';
        lowpass.frequency.value = highFreq;
        lowpass.Q.value = 0.7;
        
        highpass.type = 'highpass';
        highpass.frequency.value = lowFreq;
        highpass.Q.value = 0.7;
        
        highpass.connect(lowpass);
        
        return {
            input: highpass,
            output: lowpass,
            lowFreq,
            highFreq
        };
    }
    
    /**
     * 物理的ノイズジェネレーター
     */
    createPhysicalNoise(duration, spectrum = 'white') {
        const bufferLength = Math.floor(this.audioContext.sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, bufferLength, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (spectrum) {
            case 'white':
                // ホワイトノイズ (全周波数均等)
                for (let i = 0; i < bufferLength; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                break;
                
            case 'pink':
                // ピンクノイズ (1/f特性)
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    data[i] *= 0.11;
                    b6 = white * 0.115926;
                }
                break;
                
            case 'brown':
                // ブラウンノイズ (1/f²特性)
                let lastOut = 0;
                for (let i = 0; i < bufferLength; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5;
                }
                break;
        }
        
        return buffer;
    }
    
    /**
     * ADSR エンベロープジェネレーター (高精度)
     */
    createADSREnvelope(gainNode, attack, decay, sustain, release, peakGain = 1.0) {
        const now = this.audioContext.currentTime;
        
        // Web Audio API安全値定数
        const MIN_GAIN = 1e-6; // 1.40130e-45より十分大きい安全値
        const MAX_GAIN = 100;   // 異常値保護
        
        // 入力値の正規化と安全化
        const safePeakGain = Math.max(MIN_GAIN, Math.min(MAX_GAIN, peakGain));
        const safeSustain = Math.max(0.001, Math.min(1.0, sustain));
        const sustainLevel = Math.max(MIN_GAIN, safeSustain * safePeakGain);
        
        try {
            // Attack phase - エクスポネンシャル上昇
            gainNode.gain.setValueAtTime(MIN_GAIN, now);
            gainNode.gain.exponentialRampToValueAtTime(safePeakGain, now + attack);
            
            // Decay phase - サスティンレベルまで減衰
            gainNode.gain.exponentialRampToValueAtTime(sustainLevel, now + attack + decay);
            
            // Release phase - 安全な最小値まで減衰
            const releaseStart = now + attack + decay;
            gainNode.gain.setValueAtTime(sustainLevel, releaseStart);
            gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, releaseStart + release);
            
            return releaseStart + release; // 終了時刻を返す
        } catch (error) {
            console.error('🎵 ADSR Envelope failed, using linear fallback:', error);
            // フォールバック: リニア減衰
            gainNode.gain.setValueAtTime(safePeakGain, now);
            gainNode.gain.linearRampToValueAtTime(MIN_GAIN, now + attack + decay + release);
            return now + attack + decay + release;
        }
    }
    
    /**
     * 物理的衝撃波シミュレーター
     */
    createShockwave(frequency, intensity, duration) {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // 衝撃波の物理特性
        oscillator.type = 'sawtooth'; // 鋭いトランジェント
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        // 急激な周波数変化 (ドップラー効果シミュレーション)
        oscillator.frequency.exponentialRampToValueAtTime(
            frequency * 0.3, 
            this.audioContext.currentTime + duration
        );
        
        // 高周波強調フィルター
        filter.type = 'highpass';
        filter.frequency.value = frequency * 0.5;
        filter.Q.value = 8; // 鋭いレゾナンス
        
        // 超短時間エンベロープ
        this.createADSREnvelope(gainNode, 0.001, 0.005, 0.0, duration * 0.95, intensity);
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        return {
            oscillator,
            gainNode,
            filter
        };
    }
    
    /**
     * 金属共鳴シミュレーター
     */
    createMetalResonance(fundamentalFreq, resonanceCount = 5, decay = 0.8) {
        const resonators = [];
        
        for (let i = 0; i < resonanceCount; i++) {
            const harmonic = fundamentalFreq * (i + 1) * (1 + Math.random() * 0.1); // 微妙な非整数倍
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            oscillator.type = 'sine';
            oscillator.frequency.value = harmonic;
            
            // 金属特有の鋭いQ値
            filter.type = 'bandpass';
            filter.frequency.value = harmonic;
            filter.Q.value = 20 + i * 5; // 高次倍音ほど鋭く
            
            // 倍音ごとの減衰特性
            const amplitude = Math.pow(0.6, i) * (1 + Math.random() * 0.2);
            this.createADSREnvelope(gainNode, 0.001, 0.1, 0.3, decay + i * 0.1, amplitude);
            
            oscillator.connect(filter);
            filter.connect(gainNode);
            
            resonators.push({
                oscillator,
                gainNode,
                filter,
                frequency: harmonic
            });
        }
        
        return resonators;
    }
    
    /**
     * 3D空間音響プロセッサー
     */
    create3DSpatialProcessor(distance = 10, angle = 0) {
        const panner = this.audioContext.createPanner();
        const gainNode = this.audioContext.createGain();
        
        // 3D位置設定
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = 1000;
        panner.rolloffFactor = 1;
        
        // 音源位置計算
        const x = distance * Math.cos(angle);
        const y = 0;
        const z = distance * Math.sin(angle);
        
        panner.setPosition(x, y, z);
        panner.setOrientation(0, 0, 1);
        
        // 距離減衰シミュレーション
        const distanceAttenuation = 1 / (1 + distance * this.ENVIRONMENT.airLoss);
        gainNode.gain.value = distanceAttenuation;
        
        panner.connect(gainNode);
        
        return {
            input: panner,
            output: gainNode,
            distance,
            angle
        };
    }
    
    /**
     * リバーブ（残響）プロセッサー
     */
    createConvolutionReverb(roomSize = 'medium') {
        const convolver = this.audioContext.createConvolver();
        const wetGain = this.audioContext.createGain();
        const dryGain = this.audioContext.createGain();
        const output = this.audioContext.createGain();
        
        // ルームサイズ別インパルス応答
        const impulseLength = {
            'small': 1.0,
            'medium': 2.5,
            'large': 4.0,
            'hall': 6.0
        }[roomSize] || 2.5;
        
        const impulse = this.createImpulseResponse(impulseLength);
        convolver.buffer = impulse;
        
        // ウェット/ドライバランス
        wetGain.gain.value = 0.3;
        dryGain.gain.value = 0.7;
        
        return {
            input: convolver,
            wetGain,
            dryGain,
            output,
            convolver
        };
    }
    
    /**
     * インパルス応答生成
     */
    createImpulseResponse(duration) {
        const length = this.audioContext.sampleRate * duration;
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay;
            }
        }
        
        return impulse;
    }
    
    /**
     * 心理音響満足感エンハンサー
     */
    createSatisfactionEnhancer() {
        const enhancer = this.audioContext.createGain();
        const exciter = this.audioContext.createBiquadFilter();
        const compressor = this.audioContext.createDynamicsCompressor();
        
        // エキサイター (高域倍音付加)
        exciter.type = 'highshelf';
        exciter.frequency.value = this.PSYCHOACOUSTIC.clarityFreq;
        exciter.gain.value = 3; // 3dB boost
        
        // コンプレッサー (パンチ感向上)
        compressor.threshold.value = -24;
        compressor.knee.value = 30;
        compressor.ratio.value = 4;
        compressor.attack.value = 0.001;
        compressor.release.value = 0.1;
        
        enhancer.connect(exciter);
        exciter.connect(compressor);
        
        return {
            input: enhancer,
            output: compressor,
            exciter,
            compressor
        };
    }
    
    /**
     * 音響パワー測定
     */
    measureAcousticPower(gainNode) {
        const analyser = this.audioContext.createAnalyser();
        analyser.fftSize = 2048;
        
        gainNode.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        
        return {
            analyser,
            getSpectrum: () => {
                analyser.getByteFrequencyData(dataArray);
                return Array.from(dataArray);
            },
            getRMS: () => {
                analyser.getByteTimeDomainData(dataArray);
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    const sample = (dataArray[i] - 128) / 128;
                    sum += sample * sample;
                }
                return Math.sqrt(sum / dataArray.length);
            }
        };
    }
    
    /**
     * マスターボリューム設定
     */
    setMasterVolume(volume) {
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
    }
    
    /**
     * エンジン破棄
     */
    dispose() {
        if (this.masterGain) {
            this.masterGain.disconnect();
        }
        console.log('🎵 ProSFXEngine: Engine disposed');
    }
}