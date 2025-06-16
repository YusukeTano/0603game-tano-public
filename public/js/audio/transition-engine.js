/**
 * TransitionEngine - 音楽遷移エンジン
 * スムーズな状態変化とスティンガー再生
 */
export class TransitionEngine {
    constructor(bgmController) {
        this.bgmController = bgmController;
        this.audioContext = null;
        this.masterGain = null;
        
        // 遷移管理
        this.activeTransitions = new Map();
        this.transitionQueue = [];
        
        // スティンガー管理
        this.stingers = new Map();
        this.activeStingers = new Set();
        
        console.log('🎭 TransitionEngine: Initialized');
    }
    
    /**
     * 初期化
     */
    initialize() {
        this.audioContext = this.bgmController.audioContext;
        this.masterGain = this.bgmController.masterGain;
        
        // スティンガー定義を登録
        this.registerStingerDefinitions();
        
        console.log('🎭 TransitionEngine: Ready');
    }
    
    /**
     * スティンガー定義登録
     */
    registerStingerDefinitions() {
        const definitions = {
            LEVEL_UP: {
                name: 'レベルアップ',
                duration: 2000,
                notes: [
                    { frequency: 261.63, time: 0, duration: 500 },    // C4
                    { frequency: 329.63, time: 200, duration: 500 },  // E4
                    { frequency: 392.00, time: 400, duration: 800 },  // G4
                    { frequency: 523.25, time: 600, duration: 1000 }  // C5
                ],
                volume: 0.6,
                waveform: 'triangle',
                filter: { type: 'lowpass', frequency: 2000, Q: 1 },
                reverb: true
            },
            
            ENEMY_DEFEAT: {
                name: '敵撃破',
                duration: 800,
                notes: [
                    { frequency: 220, time: 0, duration: 300 },    // A3
                    { frequency: 277.18, time: 100, duration: 400 } // C#4
                ],
                volume: 0.4,
                waveform: 'sawtooth',
                filter: { type: 'highpass', frequency: 300, Q: 2 }
            },
            
            STAGE_COMPLETE: {
                name: 'ステージクリア',
                duration: 4000,
                notes: [
                    { frequency: 261.63, time: 0, duration: 800 },
                    { frequency: 329.63, time: 200, duration: 800 },
                    { frequency: 392.00, time: 400, duration: 800 },
                    { frequency: 523.25, time: 600, duration: 1200 },
                    { frequency: 659.25, time: 1000, duration: 1500 },
                    { frequency: 783.99, time: 1400, duration: 2000 }
                ],
                volume: 0.8,
                waveform: 'sine',
                filter: { type: 'peaking', frequency: 1000, Q: 2, gain: 6 },
                reverb: true,
                echo: true
            },
            
            BOSS_APPEAR: {
                name: 'ボス出現',
                duration: 3000,
                notes: [
                    { frequency: 55, time: 0, duration: 1000 },     // A1 (低音)
                    { frequency: 73.42, time: 500, duration: 1500 },  // D2
                    { frequency: 82.41, time: 1000, duration: 2000 }  // E2
                ],
                volume: 0.9,
                waveform: 'square',
                filter: { type: 'lowpass', frequency: 400, Q: 4 },
                distortion: { amount: 30 }
            },
            
            DANGER_WARNING: {
                name: '危険警告',
                duration: 1500,
                notes: [
                    { frequency: 146.83, time: 0, duration: 300 },    // D3
                    { frequency: 146.83, time: 400, duration: 300 },  // D3
                    { frequency: 146.83, time: 800, duration: 300 }   // D3
                ],
                volume: 0.7,
                waveform: 'square',
                filter: { type: 'bandpass', frequency: 500, Q: 8 },
                tremolo: { rate: 8, depth: 0.8 }
            }
        };
        
        this.stingerDefinitions = definitions;
        console.log(`🎭 TransitionEngine: ${Object.keys(definitions).length} stinger definitions registered`);
    }
    
    /**
     * スティンガー再生
     * @param {string} stingerName - スティンガー名
     * @param {number} priority - 優先度 (高いほど優先)
     * @param {Object} options - オプション
     */
    async playStinger(stingerName, priority = 1000, options = {}) {
        const definition = this.stingerDefinitions[stingerName];
        if (!definition) {
            console.warn(`🎭 TransitionEngine: Unknown stinger: ${stingerName}`);
            return;
        }
        
        // 既存の低優先度スティンガーを停止
        this.stopLowerPriorityStingers(priority);
        
        console.log(`🎭 TransitionEngine: Playing stinger: ${stingerName}`);
        
        const stingerInstance = {
            name: stingerName,
            definition: { ...definition, ...options },
            priority,
            startTime: this.audioContext.currentTime,
            oscillators: [],
            gainNodes: [],
            effects: []
        };
        
        // スティンガー演奏
        await this.performStinger(stingerInstance);
        
        // 管理に追加
        this.stingers.set(stingerName, stingerInstance);
        this.activeStingers.add(stingerName);
        
        // 自動削除
        setTimeout(() => {
            this.stopStinger(stingerName);
        }, definition.duration + 500);
    }
    
    /**
     * スティンガー演奏実行
     * @param {Object} stingerInstance - スティンガーインスタンス
     */
    async performStinger(stingerInstance) {
        const def = stingerInstance.definition;
        
        def.notes.forEach(note => {
            setTimeout(() => {
                this.playStingerNote(stingerInstance, note);
            }, note.time);
        });
    }
    
    /**
     * スティンガー音符演奏
     * @param {Object} stingerInstance - スティンガーインスタンス
     * @param {Object} note - 音符定義
     */
    playStingerNote(stingerInstance, note) {
        try {
            const def = stingerInstance.definition;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            let effectChain = filter;
            
            // オシレーター設定
            osc.type = def.waveform || 'sine';
            osc.frequency.setValueAtTime(note.frequency, this.audioContext.currentTime);
            
            // フィルター設定
            if (def.filter) {
                filter.type = def.filter.type;
                filter.frequency.setValueAtTime(def.filter.frequency, this.audioContext.currentTime);
                filter.Q.setValueAtTime(def.filter.Q, this.audioContext.currentTime);
                if (def.filter.gain) {
                    filter.gain.setValueAtTime(def.filter.gain, this.audioContext.currentTime);
                }
            }
            
            // エフェクト追加
            if (def.distortion) {
                const distortion = this.createDistortion(def.distortion.amount);
                effectChain.connect(distortion);
                effectChain = distortion;
                stingerInstance.effects.push(distortion);
            }
            
            if (def.tremolo) {
                const tremolo = this.createTremolo(def.tremolo.rate, def.tremolo.depth);
                effectChain.connect(tremolo.input);
                effectChain = tremolo.output;
                stingerInstance.effects.push(tremolo);
            }
            
            if (def.reverb) {
                const reverb = this.createReverb();
                effectChain.connect(reverb);
                effectChain = reverb;
                stingerInstance.effects.push(reverb);
            }
            
            // エンベロープ設定
            const duration = note.duration / 1000; // ms → s
            const volume = def.volume * this.bgmController.volumeSettings.music;
            
            gain.gain.setValueAtTime(0, this.audioContext.currentTime);
            gain.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.05);
            gain.gain.setValueAtTime(volume, this.audioContext.currentTime + duration - 0.1);
            gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + duration);
            
            // 接続
            osc.connect(filter);
            effectChain.connect(gain);
            gain.connect(this.masterGain);
            
            // 開始・停止
            osc.start();
            osc.stop(this.audioContext.currentTime + duration);
            
            // インスタンスに追加
            stingerInstance.oscillators.push(osc);
            stingerInstance.gainNodes.push(gain);
            
        } catch (error) {
            console.error('🎭 TransitionEngine: Failed to play stinger note:', error);
        }
    }
    
    /**
     * ディストーション作成
     * @param {number} amount - ディストーション量
     * @returns {WaveShaperNode} ディストーションノード
     */
    createDistortion(amount) {
        const distortion = this.audioContext.createWaveShaper();
        const samples = 44100;
        const curve = new Float32Array(samples);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < samples; i++) {
            const x = (i * 2) / samples - 1;
            curve[i] = ((3 + amount) * x * 20 * deg) / (Math.PI + amount * Math.abs(x));
        }
        
        distortion.curve = curve;
        distortion.oversample = '4x';
        
        return distortion;
    }
    
    /**
     * トレモロ作成
     * @param {number} rate - レート (Hz)
     * @param {number} depth - 深さ (0-1)
     * @returns {Object} トレモロエフェクト
     */
    createTremolo(rate, depth) {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        const inputGain = this.audioContext.createGain();
        const outputGain = this.audioContext.createGain();
        
        lfo.type = 'sine';
        lfo.frequency.setValueAtTime(rate, this.audioContext.currentTime);
        
        lfoGain.gain.setValueAtTime(depth, this.audioContext.currentTime);
        inputGain.gain.setValueAtTime(1 - depth, this.audioContext.currentTime);
        
        lfo.connect(lfoGain);
        lfoGain.connect(outputGain.gain);
        inputGain.connect(outputGain);
        
        lfo.start();
        
        return {
            input: inputGain,
            output: outputGain,
            lfo: lfo
        };
    }
    
    /**
     * リバーブ作成
     * @returns {ConvolverNode} リバーブノード
     */
    createReverb() {
        const convolver = this.audioContext.createConvolver();
        const length = this.audioContext.sampleRate * 2; // 2秒のリバーブ
        const impulse = this.audioContext.createBuffer(2, length, this.audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.5;
            }
        }
        
        convolver.buffer = impulse;
        return convolver;
    }
    
    /**
     * 低優先度スティンガー停止
     * @param {number} priority - 基準優先度
     */
    stopLowerPriorityStingers(priority) {
        this.activeStingers.forEach(name => {
            const stinger = this.stingers.get(name);
            if (stinger && stinger.priority < priority) {
                this.stopStinger(name);
            }
        });
    }
    
    /**
     * スティンガー停止
     * @param {string} stingerName - スティンガー名
     */
    stopStinger(stingerName) {
        const stinger = this.stingers.get(stingerName);
        if (!stinger) return;
        
        // オシレーター停止
        stinger.oscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        
        // エフェクト停止
        stinger.effects.forEach(effect => {
            if (effect.lfo) {
                try {
                    effect.lfo.stop();
                } catch (e) {}
            }
        });
        
        // 管理から削除
        this.stingers.delete(stingerName);
        this.activeStingers.delete(stingerName);
        
        console.log(`🎭 TransitionEngine: Stopped stinger: ${stingerName}`);
    }
    
    /**
     * クロスフェード遷移
     * @param {string} fromInstrument - 開始楽器
     * @param {string} toInstrument - 終了楽器
     * @param {number} duration - 遷移時間
     */
    async crossfade(fromInstrument, toInstrument, duration = 2000) {
        const transitionId = `${fromInstrument}_to_${toInstrument}`;
        
        if (this.activeTransitions.has(transitionId)) {
            console.warn(`🎭 TransitionEngine: Transition ${transitionId} already active`);
            return;
        }
        
        console.log(`🎭 TransitionEngine: Crossfading ${fromInstrument} → ${toInstrument}`);
        
        const transition = {
            id: transitionId,
            from: fromInstrument,
            to: toInstrument,
            duration,
            startTime: performance.now(),
            progress: 0
        };
        
        this.activeTransitions.set(transitionId, transition);
        
        // フェードアウト
        if (fromInstrument) {
            this.bgmController.instrumentBank.fadeOutInstruments([fromInstrument], duration);
        }
        
        // フェードイン
        if (toInstrument) {
            setTimeout(() => {
                this.bgmController.instrumentBank.fadeInInstruments([toInstrument], {}, duration);
            }, duration * 0.2); // 20%オーバーラップ
        }
        
        // 遷移完了処理
        setTimeout(() => {
            this.activeTransitions.delete(transitionId);
            console.log(`🎭 TransitionEngine: Crossfade completed: ${transitionId}`);
        }, duration + 500);
    }
    
    /**
     * 緊急遷移（即座に切り替え）
     * @param {string} eventType - イベント種別
     */
    emergencyTransition(eventType) {
        console.log(`🎭 TransitionEngine: Emergency transition triggered: ${eventType}`);
        
        switch (eventType) {
            case 'BOSS_APPEAR':
                this.playStinger('BOSS_APPEAR', 9999);
                this.bgmController.stateMachine.handleEmergencyTransition('BOSS_APPEAR');
                break;
                
            case 'PLAYER_LOW_HEALTH':
                this.playStinger('DANGER_WARNING', 8000);
                break;
                
            case 'GAME_OVER':
                this.stopAllStingers();
                this.bgmController.stateMachine.handleEmergencyTransition('GAME_OVER');
                break;
        }
    }
    
    /**
     * 全スティンガー停止
     */
    stopAllStingers() {
        this.activeStingers.forEach(name => {
            this.stopStinger(name);
        });
        console.log('🎭 TransitionEngine: All stingers stopped');
    }
    
    /**
     * システム更新
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        // 遷移進行度更新
        const now = performance.now();
        
        this.activeTransitions.forEach((transition, id) => {
            const elapsed = now - transition.startTime;
            transition.progress = Math.min(elapsed / transition.duration, 1.0);
            
            if (transition.progress >= 1.0) {
                this.activeTransitions.delete(id);
            }
        });
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            activeTransitions: Array.from(this.activeTransitions.keys()),
            activeStingers: Array.from(this.activeStingers),
            availableStingers: Object.keys(this.stingerDefinitions)
        };
    }
}