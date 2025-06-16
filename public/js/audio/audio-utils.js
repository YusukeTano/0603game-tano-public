/**
 * AudioUtils - オーディオ共通ユーティリティ
 * Web Audio API用のヘルパー関数とエフェクト処理
 */
export class AudioUtils {
    /**
     * ディストーション曲線作成
     * @param {number} amount - ディストーション量 (0-100)
     * @returns {Float32Array} ディストーション曲線
     */
    static createDistortionCurve(amount) {
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
     * ノイズバッファ作成
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @param {number} duration - 持続時間（秒）
     * @param {string} type - ノイズタイプ ('white', 'pink', 'brown')
     * @returns {AudioBuffer} ノイズバッファ
     */
    static createNoiseBuffer(audioContext, duration, type = 'white') {
        const sampleRate = audioContext.sampleRate;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        switch (type) {
            case 'white':
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                break;
                
            case 'pink':
                let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    b0 = 0.99886 * b0 + white * 0.0555179;
                    b1 = 0.99332 * b1 + white * 0.0750759;
                    b2 = 0.96900 * b2 + white * 0.1538520;
                    b3 = 0.86650 * b3 + white * 0.3104856;
                    b4 = 0.55000 * b4 + white * 0.5329522;
                    b5 = -0.7616 * b5 - white * 0.0168980;
                    data[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
                    data[i] *= 0.11; // 音量調整
                    b6 = white * 0.115926;
                }
                break;
                
            case 'brown':
                let lastOut = 0;
                for (let i = 0; i < bufferSize; i++) {
                    const white = Math.random() * 2 - 1;
                    data[i] = (lastOut + (0.02 * white)) / 1.02;
                    lastOut = data[i];
                    data[i] *= 3.5; // 音量調整
                }
                break;
        }
        
        return buffer;
    }
    
    /**
     * リバーブインパルス作成
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @param {number} duration - リバーブ時間（秒）
     * @param {number} decay - 減衰率
     * @returns {AudioBuffer} インパルスレスポンス
     */
    static createReverbImpulse(audioContext, duration, decay) {
        const sampleRate = audioContext.sampleRate;
        const length = sampleRate * duration;
        const impulse = audioContext.createBuffer(2, length, sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const n = length - i;
                channelData[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
            }
        }
        
        return impulse;
    }
    
    /**
     * コンプレッサー作成
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @param {Object} settings - コンプレッサー設定
     * @returns {DynamicsCompressorNode} コンプレッサーノード
     */
    static createCompressor(audioContext, settings = {}) {
        const compressor = audioContext.createDynamicsCompressor();
        
        compressor.threshold.setValueAtTime(settings.threshold || -24, audioContext.currentTime);
        compressor.knee.setValueAtTime(settings.knee || 30, audioContext.currentTime);
        compressor.ratio.setValueAtTime(settings.ratio || 6, audioContext.currentTime);
        compressor.attack.setValueAtTime(settings.attack || 0.003, audioContext.currentTime);
        compressor.release.setValueAtTime(settings.release || 0.25, audioContext.currentTime);
        
        return compressor;
    }
    
    /**
     * ディレイエフェクト作成
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @param {number} delayTime - ディレイ時間（秒）
     * @param {number} feedback - フィードバック量 (0.0-1.0)
     * @param {number} mix - ドライ/ウェットミックス (0.0-1.0)
     * @returns {Object} ディレイエフェクトノード
     */
    static createDelay(audioContext, delayTime = 0.3, feedback = 0.3, mix = 0.3) {
        const delayNode = audioContext.createDelay();
        const feedbackGain = audioContext.createGain();
        const mixGain = audioContext.createGain();
        const dryGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        
        delayNode.delayTime.setValueAtTime(delayTime, audioContext.currentTime);
        feedbackGain.gain.setValueAtTime(feedback, audioContext.currentTime);
        dryGain.gain.setValueAtTime(1 - mix, audioContext.currentTime);
        wetGain.gain.setValueAtTime(mix, audioContext.currentTime);
        
        // 接続
        delayNode.connect(feedbackGain);
        feedbackGain.connect(delayNode);
        delayNode.connect(wetGain);
        wetGain.connect(outputGain);
        dryGain.connect(outputGain);
        
        return {
            input: delayNode,
            dryInput: dryGain,
            output: outputGain,
            delayNode,
            feedbackGain,
            mixGain
        };
    }
    
    /**
     * コーラスエフェクト作成
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @param {Object} settings - コーラス設定
     * @returns {Object} コーラスエフェクトノード
     */
    static createChorus(audioContext, settings = {}) {
        const delayNode = audioContext.createDelay();
        const lfo = audioContext.createOscillator();
        const lfoGain = audioContext.createGain();
        const dryGain = audioContext.createGain();
        const wetGain = audioContext.createGain();
        const outputGain = audioContext.createGain();
        
        const rate = settings.rate || 1.5;
        const depth = settings.depth || 0.005;
        const mix = settings.mix || 0.5;
        
        delayNode.delayTime.setValueAtTime(0.02, audioContext.currentTime);
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(rate, audioContext.currentTime);
        lfoGain.gain.setValueAtTime(depth, audioContext.currentTime);
        
        dryGain.gain.setValueAtTime(1 - mix, audioContext.currentTime);
        wetGain.gain.setValueAtTime(mix, audioContext.currentTime);
        
        // 接続
        lfo.connect(lfoGain);
        lfoGain.connect(delayNode.delayTime);
        delayNode.connect(wetGain);
        wetGain.connect(outputGain);
        dryGain.connect(outputGain);
        
        lfo.start();
        
        return {
            input: delayNode,
            dryInput: dryGain,
            output: outputGain,
            lfo
        };
    }
    
    /**
     * 周波数からMIDIノート番号に変換
     * @param {number} frequency - 周波数（Hz）
     * @returns {number} MIDIノート番号
     */
    static frequencyToMidi(frequency) {
        return Math.round(69 + 12 * Math.log2(frequency / 440));
    }
    
    /**
     * MIDIノート番号から周波数に変換
     * @param {number} midiNote - MIDIノート番号
     * @returns {number} 周波数（Hz）
     */
    static midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    /**
     * dBから線形値に変換
     * @param {number} db - dB値
     * @returns {number} 線形値
     */
    static dbToLinear(db) {
        return Math.pow(10, db / 20);
    }
    
    /**
     * 線形値からdBに変換
     * @param {number} linear - 線形値
     * @returns {number} dB値
     */
    static linearToDb(linear) {
        return 20 * Math.log10(Math.abs(linear));
    }
    
    /**
     * パンニング値計算
     * @param {number} pan - パン値 (-1.0 to 1.0)
     * @returns {Object} 左右ゲイン値
     */
    static calculatePanning(pan) {
        const panRad = (pan + 1) * Math.PI / 4;
        return {
            left: Math.cos(panRad),
            right: Math.sin(panRad)
        };
    }
    
    /**
     * BPMからフレーム時間に変換
     * @param {number} bpm - BPM値
     * @param {number} noteValue - 音価 (1=全音符, 0.25=4分音符)
     * @returns {number} 時間（秒）
     */
    static bpmToTime(bpm, noteValue = 0.25) {
        return (60 / bpm) * (noteValue * 4);
    }
    
    /**
     * AudioContextの状態チェック
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @returns {Promise<boolean>} 使用可能かどうか
     */
    static async ensureAudioContextRunning(audioContext) {
        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
                console.log('🎵 AudioUtils: AudioContext resumed successfully');
                return true;
            } catch (error) {
                console.error('🎵 AudioUtils: Failed to resume AudioContext:', error);
                return false;
            }
        }
        return audioContext.state === 'running';
    }
    
    /**
     * 音量フェード
     * @param {GainNode} gainNode - ゲインノード
     * @param {number} targetVolume - 目標音量
     * @param {number} duration - フェード時間（秒）
     * @param {number} startTime - 開始時間
     */
    static fadeVolume(gainNode, targetVolume, duration, startTime = null) {
        const audioContext = gainNode.context;
        const when = startTime || audioContext.currentTime;
        
        gainNode.gain.setTargetAtTime(targetVolume, when, duration / 3);
    }
    
    /**
     * エフェクトチェーン作成
     * @param {AudioContext} audioContext - オーディオコンテキスト
     * @param {Array} effects - エフェクト配列
     * @returns {Object} エフェクトチェーン
     */
    static createEffectChain(audioContext, effects) {
        const chain = {
            input: null,
            output: null,
            nodes: []
        };
        
        effects.forEach((effectType, index) => {
            let effectNode;
            
            switch (effectType) {
                case 'chorus':
                    effectNode = this.createChorus(audioContext);
                    break;
                case 'delay':
                    effectNode = this.createDelay(audioContext);
                    break;
                case 'reverb':
                    // リバーブ実装（簡略版）
                    effectNode = audioContext.createConvolver();
                    effectNode.buffer = this.createReverbImpulse(audioContext, 2, 2);
                    break;
                case 'compressor':
                    effectNode = this.createCompressor(audioContext);
                    break;
                default:
                    console.warn(`🎵 AudioUtils: Unknown effect type: ${effectType}`);
                    return;
            }
            
            chain.nodes.push(effectNode);
            
            if (index === 0) {
                chain.input = effectNode.input || effectNode;
            }
            
            if (index === effects.length - 1) {
                chain.output = effectNode.output || effectNode;
            }
            
            // チェーン接続
            if (index > 0) {
                const prevNode = chain.nodes[index - 1];
                const prevOutput = prevNode.output || prevNode;
                const currentInput = effectNode.input || effectNode;
                prevOutput.connect(currentInput);
            }
        });
        
        return chain;
    }
}