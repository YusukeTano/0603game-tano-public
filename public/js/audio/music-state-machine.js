/**
 * MusicStateMachine - 音楽状態管理システム
 * 明確な状態遷移と楽器オーケストレーション
 */
export class MusicStateMachine {
    constructor(bgmController) {
        this.bgmController = bgmController;
        this.currentState = 'SILENCE';
        this.previousState = null;
        this.transitionProgress = 0;
        this.isTransitioning = false;
        
        // 音楽状態定義
        this.states = {
            SILENCE: {
                name: '静寂',
                instruments: [],
                tempo: 0,
                intensity: 0.0,
                volume: 0.0
            },
            FOREST_SILENCE: {
                name: '静寂の森',
                instruments: ['acoustic_guitar', 'ambient_pad'],
                tempo: 30,
                intensity: 0.2,
                volume: 0.4,
                key: 'Am',
                mood: 'peaceful'
            },
            DANGER_APPROACH: {
                name: '危険の予感',
                instruments: ['acoustic_guitar', 'dark_strings', 'subtle_percussion'],
                tempo: 90,
                intensity: 0.5,
                volume: 0.6,
                key: 'Fm',
                mood: 'tense'
            },
            COMBAT_START: {
                name: '戦闘開始',
                instruments: ['electric_guitar', 'heavy_drums', 'synth_bass'],
                tempo: 180,
                intensity: 0.9,
                volume: 0.8,
                key: 'Dm',
                mood: 'aggressive'
            },
            VICTORY_PATH: {
                name: '勝利への道',
                instruments: ['orchestral_strings', 'epic_brass', 'triumphant_percussion'],
                tempo: 150,
                intensity: 0.7,
                volume: 0.7,
                key: 'G',
                mood: 'triumphant'
            }
        };
        
        // 許可される状態遷移
        this.allowedTransitions = {
            SILENCE: ['FOREST_SILENCE'],
            FOREST_SILENCE: ['DANGER_APPROACH', 'SILENCE'],
            DANGER_APPROACH: ['COMBAT_START', 'FOREST_SILENCE'],
            COMBAT_START: ['VICTORY_PATH', 'DANGER_APPROACH'],
            VICTORY_PATH: ['FOREST_SILENCE', 'DANGER_APPROACH']
        };
        
        // 遷移タイミング制御
        this.transitionDuration = 3000; // 3秒
        this.transitionStartTime = 0;
        
        console.log('🎼 MusicStateMachine: Initialized');
    }
    
    /**
     * 初期化
     */
    initialize() {
        this.currentState = 'SILENCE';
        console.log('🎼 MusicStateMachine: Ready');
    }
    
    /**
     * 状態遷移
     * @param {string} newState - 新しい状態
     * @param {Object} options - 遷移オプション
     */
    async transitionTo(newState, options = {}) {
        // 状態存在チェック
        if (!this.states[newState]) {
            console.warn(`🎼 MusicStateMachine: Unknown state: ${newState}`);
            return false;
        }
        
        // 遷移許可チェック
        if (!this.isTransitionAllowed(this.currentState, newState)) {
            console.warn(`🎼 MusicStateMachine: Transition not allowed: ${this.currentState} → ${newState}`);
            return false;
        }
        
        // 既に同じ状態の場合
        if (this.currentState === newState && !this.isTransitioning) {
            console.log(`🎼 MusicStateMachine: Already in state: ${newState}`);
            return true;
        }
        
        console.log(`🎼 MusicStateMachine: Transitioning ${this.currentState} → ${newState}`);
        
        // 遷移開始
        this.previousState = this.currentState;
        this.currentState = newState;
        this.isTransitioning = true;
        this.transitionProgress = 0;
        this.transitionStartTime = performance.now();
        
        // オプション適用
        const stateConfig = { ...this.states[newState], ...options };
        
        // 楽器遷移実行
        await this.executeInstrumentTransition(stateConfig);
        
        // パフォーマンス記録
        this.bgmController.performanceMetrics.stateTransitions++;
        
        return true;
    }
    
    /**
     * 遷移許可チェック
     * @param {string} fromState - 現在の状態
     * @param {string} toState - 遷移先状態
     * @returns {boolean} 遷移可能かどうか
     */
    isTransitionAllowed(fromState, toState) {
        // SILENCE状態からは任意の状態に遷移可能（初期化用）
        if (fromState === 'SILENCE') return true;
        
        // 同じ状態への遷移は常に許可（パラメータ更新用）
        if (fromState === toState) return true;
        
        // 定義された遷移ルールをチェック
        const allowedTargets = this.allowedTransitions[fromState] || [];
        return allowedTargets.includes(toState);
    }
    
    /**
     * 楽器遷移実行
     * @param {Object} stateConfig - 状態設定
     */
    async executeInstrumentTransition(stateConfig) {
        const instrumentBank = this.bgmController.instrumentBank;
        
        // 前の状態の楽器をフェードアウト
        if (this.previousState && this.previousState !== 'SILENCE') {
            const prevConfig = this.states[this.previousState];
            instrumentBank.fadeOutInstruments(prevConfig.instruments, 1000);
        }
        
        // 新しい楽器をフェードイン
        if (stateConfig.instruments.length > 0) {
            await instrumentBank.fadeInInstruments(stateConfig.instruments, stateConfig, 2000);
        }
        
        // グローバルパラメータ設定
        instrumentBank.setTempo(stateConfig.tempo);
        instrumentBank.setIntensity(stateConfig.intensity);
        instrumentBank.setVolume(stateConfig.volume);
        
        console.log(`🎼 MusicStateMachine: State transition completed - ${this.currentState}`, {
            instruments: stateConfig.instruments,
            tempo: stateConfig.tempo,
            intensity: stateConfig.intensity,
            key: stateConfig.key
        });
    }
    
    /**
     * 現在の状態情報取得
     * @returns {Object} 状態情報
     */
    getCurrentStateInfo() {
        const state = this.states[this.currentState];
        return {
            name: state.name,
            state: this.currentState,
            instruments: state.instruments,
            tempo: state.tempo,
            intensity: state.intensity,
            volume: state.volume,
            key: state.key,
            mood: state.mood,
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress
        };
    }
    
    /**
     * 利用可能な遷移先取得
     * @returns {Array} 遷移可能な状態リスト
     */
    getAvailableTransitions() {
        return this.allowedTransitions[this.currentState] || [];
    }
    
    /**
     * 緊急状態遷移（ゲームイベント用）
     * @param {string} eventType - イベント種別
     */
    handleEmergencyTransition(eventType) {
        const emergencyMappings = {
            'BOSS_APPEAR': 'COMBAT_START',
            'PLAYER_LOW_HEALTH': 'DANGER_APPROACH',
            'WAVE_COMPLETE': 'VICTORY_PATH',
            'GAME_OVER': 'SILENCE'
        };
        
        const targetState = emergencyMappings[eventType];
        if (targetState) {
            console.log(`🎼 MusicStateMachine: Emergency transition triggered by ${eventType}`);
            this.transitionTo(targetState);
        }
    }
    
    /**
     * システム更新
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        // 遷移進行度更新
        if (this.isTransitioning) {
            const elapsed = performance.now() - this.transitionStartTime;
            this.transitionProgress = Math.min(elapsed / this.transitionDuration, 1.0);
            
            // 遷移完了チェック
            if (this.transitionProgress >= 1.0) {
                this.isTransitioning = false;
                this.transitionProgress = 1.0;
                console.log(`🎼 MusicStateMachine: Transition to ${this.currentState} completed`);
            }
        }
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            currentState: this.currentState,
            previousState: this.previousState,
            isTransitioning: this.isTransitioning,
            transitionProgress: this.transitionProgress.toFixed(2),
            availableTransitions: this.getAvailableTransitions(),
            stateInfo: this.getCurrentStateInfo()
        };
    }
}