/**
 * Phase3ManagerIntegration - Phase 3.3 Manager層統合・連携システム
 * Phase 3.1-3.2の全システム統合とゲーム本体連携
 */

import { SceneManager } from './scene-manager.js';
import { AudioSceneController } from './audio-scene-controller.js';
import { TransitionController } from './transition-controller.js';
import { AudioStateManager } from './audio-state-manager.js';
import { DynamicWaveAudioController } from './dynamic-wave-audio-controller.js';
import { RealtimeAudioFeedback } from './realtime-audio-feedback.js';

export class Phase3ManagerIntegration {
    constructor(game, audioManager = null) {
        this.game = game;
        this.audioManager = audioManager;
        
        // Phase 3システム群
        this.systems = {
            // Phase 3.1: シーン管理システム
            sceneManager: null,
            audioSceneController: null,
            transitionController: null,
            
            // Phase 3.2: 音響状態制御システム
            audioStateManager: null,
            dynamicWaveController: null,
            realtimeFeedback: null
        };
        
        // 統合状態
        this.integrationState = {
            isInitialized: false,
            isRunning: false,
            phase31Ready: false,
            phase32Ready: false,
            gameIntegrated: false,
            errors: []
        };
        
        // システム間連携設定
        this.interconnections = {
            enabled: true,
            syncInterval: 100,          // システム間同期間隔(ms)
            eventBroadcasting: true,    // イベント配信
            stateSharing: true,         // 状態共有
            performanceOptimization: true
        };
        
        // 統合パフォーマンス監視
        this.performance = {
            initializationTime: 0,
            totalSystemCalls: 0,
            averageSystemResponseTime: 0,
            systemErrors: 0,
            lastHealthCheck: 0
        };
        
        // イベントバス
        this.eventBus = {
            listeners: new Map(),
            eventQueue: [],
            isProcessing: false
        };
        
        console.log('🔗 Phase3ManagerIntegration: Manager層統合システム初期化');
    }
    
    /**
     * 統合システム初期化
     */
    async initialize() {
        try {
            console.log('🔗 Phase3ManagerIntegration: 統合初期化開始');
            const initStart = Date.now();
            
            // Phase 3.1システム初期化
            await this.initializePhase31Systems();
            
            // Phase 3.2システム初期化
            await this.initializePhase32Systems();
            
            // システム間連携設定
            await this.setupSystemInterconnections();
            
            // ゲーム本体統合
            await this.integrateWithGameSystem();
            
            // イベントバス開始
            this.startEventBus();
            
            // 状態更新
            this.integrationState.isInitialized = true;
            this.integrationState.isRunning = true;
            
            const initTime = Date.now() - initStart;
            this.performance.initializationTime = initTime;
            
            console.log(`✅ Phase3ManagerIntegration: 統合初期化完了 (${initTime}ms)`);
            return { success: true, initializationTime: initTime };
            
        } catch (error) {
            console.error('❌ Phase3ManagerIntegration: 統合初期化失敗:', error);
            this.integrationState.errors.push(error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Phase 3.1システム初期化
     */
    async initializePhase31Systems() {
        console.log('🎬 Phase3.1システム初期化開始');
        
        try {
            // TransitionController (SceneManager + AudioSceneController統合)
            this.systems.transitionController = new TransitionController(this.game, this.audioManager);
            await this.systems.transitionController.initialize();
            
            // 個別システム参照取得
            this.systems.sceneManager = this.systems.transitionController.sceneManager;
            this.systems.audioSceneController = this.systems.transitionController.audioSceneController;
            
            this.integrationState.phase31Ready = true;
            console.log('✅ Phase3.1システム初期化完了');
            
        } catch (error) {
            console.error('❌ Phase3.1システム初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * Phase 3.2システム初期化
     */
    async initializePhase32Systems() {
        console.log('🎵 Phase3.2システム初期化開始');
        
        try {
            // AudioStateManager
            this.systems.audioStateManager = new AudioStateManager(this.audioManager, this.game);
            await this.systems.audioStateManager.start();
            
            // DynamicWaveAudioController
            this.systems.dynamicWaveController = new DynamicWaveAudioController(this.audioManager);
            this.systems.dynamicWaveController.start();
            
            // RealtimeAudioFeedback
            this.systems.realtimeFeedback = new RealtimeAudioFeedback(this.audioManager);
            this.systems.realtimeFeedback.start();
            
            this.integrationState.phase32Ready = true;
            console.log('✅ Phase3.2システム初期化完了');
            
        } catch (error) {
            console.error('❌ Phase3.2システム初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * システム間連携設定
     */
    async setupSystemInterconnections() {
        console.log('🔗 システム間連携設定開始');
        
        try {
            // イベントリスナー設定
            this.setupEventListeners();
            
            // システム間同期開始
            this.startSystemSync();
            
            // 状態共有設定
            this.setupStateSharing();
            
            console.log('✅ システム間連携設定完了');
            
        } catch (error) {
            console.error('❌ システム間連携設定失敗:', error);
            throw error;
        }
    }
    
    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // シーン遷移イベント
        this.addEventListener('sceneTransition', (event) => {
            this.handleSceneTransition(event);
        });
        
        // Wave変更イベント
        this.addEventListener('waveChange', (event) => {
            this.handleWaveChange(event);
        });
        
        // プレイヤーアクションイベント
        this.addEventListener('playerAction', (event) => {
            this.handlePlayerAction(event);
        });
        
        // ゲーム状態変更イベント
        this.addEventListener('gameStateChange', (event) => {
            this.handleGameStateChange(event);
        });
    }
    
    /**
     * システム間同期開始
     */
    startSystemSync() {
        setInterval(() => {
            if (this.interconnections.enabled) {
                this.syncAllSystems();
            }
        }, this.interconnections.syncInterval);
        
        console.log('🔄 システム間同期開始');
    }
    
    /**
     * 全システム同期
     */
    syncAllSystems() {
        try {
            // ゲーム状態取得
            const gameState = this.extractCurrentGameState();
            
            // 各システムに状態配信
            this.broadcastGameState(gameState);
            
        } catch (error) {
            console.error('❌ システム同期エラー:', error);
        }
    }
    
    /**
     * ゲーム本体統合
     */
    async integrateWithGameSystem() {
        console.log('🎮 ゲーム本体統合開始');
        
        try {
            if (!this.game) {
                throw new Error('Game instance not available');
            }
            
            // ゲームイベントフック設定
            this.setupGameEventHooks();
            
            // Phase3システムをゲームに公開
            this.exposeSystemsToGame();
            
            // ゲームループ統合
            this.integrateWithGameLoop();
            
            this.integrationState.gameIntegrated = true;
            console.log('✅ ゲーム本体統合完了');
            
        } catch (error) {
            console.error('❌ ゲーム本体統合失敗:', error);
            throw error;
        }
    }
    
    /**
     * ゲームイベントフック設定
     */
    setupGameEventHooks() {
        if (!this.game) return;
        
        // 元のメソッドをバックアップしてフック
        const originalMethods = {
            showMainMenu: this.game.showMainMenu?.bind(this.game),
            showCharacterSelect: this.game.showCharacterSelect?.bind(this.game),
            startGame: this.game.startGame?.bind(this.game),
            gameOver: this.game.gameOver?.bind(this.game),
            nextWave: this.game.nextWave?.bind(this.game)
        };
        
        // シーン遷移メソッドをフック
        if (originalMethods.showMainMenu) {
            this.game.showMainMenu = async (...args) => {
                await this.handleGameEvent('showMainMenu', args);
                return originalMethods.showMainMenu(...args);
            };
        }
        
        if (originalMethods.showCharacterSelect) {
            this.game.showCharacterSelect = async (...args) => {
                await this.handleGameEvent('showCharacterSelect', args);
                return originalMethods.showCharacterSelect(...args);
            };
        }
        
        if (originalMethods.startGame) {
            this.game.startGame = async (...args) => {
                await this.handleGameEvent('startGame', args);
                return originalMethods.startGame(...args);
            };
        }
        
        if (originalMethods.gameOver) {
            this.game.gameOver = async (...args) => {
                await this.handleGameEvent('gameOver', args);
                return originalMethods.gameOver(...args);
            };
        }
        
        if (originalMethods.nextWave) {
            this.game.nextWave = async (...args) => {
                await this.handleGameEvent('nextWave', args);
                return originalMethods.nextWave(...args);
            };
        }
        
        console.log('🪝 ゲームイベントフック設定完了');
    }
    
    /**
     * Phase3システムをゲームに公開
     */
    exposeSystemsToGame() {
        if (!this.game) return;
        
        // Phase3Manager統合システムを公開
        this.game.phase3Manager = {
            // シーン管理
            transitionToScene: (scene, options) => this.transitionToScene(scene, options),
            getCurrentScene: () => this.getCurrentScene(),
            
            // 音響フィードバック
            triggerShootingFeedback: (weaponType, combo, intensity) => 
                this.triggerAudioFeedback('shooting', { weaponType, combo, intensity }),
            triggerDamageFeedback: (type, severity, healthRatio) => 
                this.triggerAudioFeedback('damage', { type, severity, healthRatio }),
            triggerLevelUpFeedback: (level, skill) => 
                this.triggerAudioFeedback('levelUp', { level, skill }),
            
            // Wave音響制御
            updateWaveAudio: (waveNumber) => this.updateWaveAudio(waveNumber),
            
            // デバッグ・監視
            getDebugInfo: () => this.getIntegratedDebugInfo(),
            getPerformanceInfo: () => this.getIntegratedPerformanceInfo()
        };
        
        console.log('📤 Phase3システムをゲームに公開完了');
    }
    
    /**
     * ゲームループ統合
     */
    integrateWithGameLoop() {
        if (!this.game || !this.game.update) return;
        
        const originalUpdate = this.game.update.bind(this.game);
        
        this.game.update = (deltaTime) => {
            // Phase3システム更新
            this.updateAllSystems(deltaTime);
            
            // 元のゲーム更新実行
            return originalUpdate(deltaTime);
        };
        
        console.log('🔄 ゲームループ統合完了');
    }
    
    // === パブリックAPI ===
    
    /**
     * シーン遷移
     */
    async transitionToScene(targetScene, options = {}) {
        try {
            if (!this.systems.transitionController) {
                throw new Error('TransitionController not initialized');
            }
            
            const result = await this.systems.transitionController.transitionTo(targetScene, options);
            
            // Wave音響も更新
            if (targetScene === 'playing' && this.game.currentWave) {
                await this.updateWaveAudio(this.game.currentWave);
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ シーン遷移エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 音響フィードバックトリガー
     */
    triggerAudioFeedback(type, data) {
        try {
            if (!this.systems.realtimeFeedback) return;
            
            switch (type) {
                case 'shooting':
                    this.systems.realtimeFeedback.triggerShootingFeedback(
                        data.weaponType, data.combo, data.intensity
                    );
                    break;
                case 'damage':
                    this.systems.realtimeFeedback.triggerDamageFeedback(
                        data.type, data.severity, data.healthRatio
                    );
                    break;
                case 'levelUp':
                    this.systems.realtimeFeedback.triggerLevelUpFeedback(
                        data.level, data.skill
                    );
                    break;
            }
            
        } catch (error) {
            console.error('❌ 音響フィードバックエラー:', error);
        }
    }
    
    /**
     * Wave音響更新
     */
    async updateWaveAudio(waveNumber) {
        try {
            if (this.systems.dynamicWaveController) {
                await this.systems.dynamicWaveController.updateForWave(waveNumber);
            }
            
            // イベント配信
            this.emitEvent('waveChange', { waveNumber });
            
        } catch (error) {
            console.error('❌ Wave音響更新エラー:', error);
        }
    }
    
    /**
     * 現在のシーン取得
     */
    getCurrentScene() {
        return this.systems.sceneManager?.currentScene || 'unknown';
    }
    
    // === 内部イベント処理 ===
    
    async handleGameEvent(eventType, args) {
        console.log(`🎮 ゲームイベント処理: ${eventType}`, args);
        
        try {
            switch (eventType) {
                case 'showMainMenu':
                    await this.transitionToScene('menu');
                    break;
                case 'showCharacterSelect':
                    await this.transitionToScene('characterSelect');
                    break;
                case 'startGame':
                    await this.transitionToScene('playing', { character: args[0] });
                    break;
                case 'gameOver':
                    await this.transitionToScene('gameOver');
                    break;
                case 'nextWave':
                    if (this.game.currentWave) {
                        await this.updateWaveAudio(this.game.currentWave);
                    }
                    break;
            }
        } catch (error) {
            console.error(`❌ ゲームイベント処理エラー (${eventType}):`, error);
        }
    }
    
    handleSceneTransition(event) {
        console.log('🎬 シーン遷移イベント処理:', event);
        // システム間でシーン遷移情報を共有
    }
    
    handleWaveChange(event) {
        console.log('🌊 Wave変更イベント処理:', event);
        // 全音響システムにWave変更を通知
    }
    
    handlePlayerAction(event) {
        console.log('🎮 プレイヤーアクションイベント処理:', event);
        // リアルタイム音響フィードバックに転送
    }
    
    handleGameStateChange(event) {
        console.log('🎯 ゲーム状態変更イベント処理:', event);
        // 全システムにゲーム状態変更を通知
    }
    
    // === イベントバスシステム ===
    
    startEventBus() {
        setInterval(() => {
            this.processEventQueue();
        }, 50);
        console.log('📡 イベントバス開始');
    }
    
    addEventListener(eventType, callback) {
        if (!this.eventBus.listeners.has(eventType)) {
            this.eventBus.listeners.set(eventType, []);
        }
        this.eventBus.listeners.get(eventType).push(callback);
    }
    
    emitEvent(eventType, data) {
        this.eventBus.eventQueue.push({ type: eventType, data, timestamp: Date.now() });
    }
    
    processEventQueue() {
        if (this.eventBus.isProcessing) return;
        
        this.eventBus.isProcessing = true;
        
        while (this.eventBus.eventQueue.length > 0) {
            const event = this.eventBus.eventQueue.shift();
            this.dispatchEvent(event);
        }
        
        this.eventBus.isProcessing = false;
    }
    
    dispatchEvent(event) {
        const listeners = this.eventBus.listeners.get(event.type) || [];
        for (const callback of listeners) {
            try {
                callback(event);
            } catch (error) {
                console.error('❌ イベントリスナーエラー:', error);
            }
        }
    }
    
    // === 状態・情報取得 ===
    
    extractCurrentGameState() {
        if (!this.game) return null;
        
        return {
            gameState: this.game.gameState,
            currentWave: this.game.currentWave,
            playerHealth: this.game.player?.health,
            enemyCount: this.game.enemies?.length,
            isPlaying: this.game.gameState === 'playing',
            timestamp: Date.now()
        };
    }
    
    broadcastGameState(gameState) {
        this.emitEvent('gameStateUpdate', gameState);
    }
    
    updateAllSystems(deltaTime) {
        // システム更新（必要に応じて）
        this.performance.lastHealthCheck = Date.now();
    }
    
    setupStateSharing() {
        // システム間状態共有の設定
    }
    
    getIntegratedDebugInfo() {
        return {
            integrationState: this.integrationState,
            systems: {
                phase31: {
                    sceneManager: this.systems.sceneManager?.getDebugInfo(),
                    audioSceneController: this.systems.audioSceneController?.getDebugInfo(),
                    transitionController: this.systems.transitionController?.getDebugInfo()
                },
                phase32: {
                    audioStateManager: this.systems.audioStateManager?.getDebugInfo(),
                    dynamicWaveController: this.systems.dynamicWaveController?.getDebugInfo(),
                    realtimeFeedback: this.systems.realtimeFeedback?.getDebugInfo()
                }
            },
            performance: this.performance,
            eventBus: {
                queueSize: this.eventBus.eventQueue.length,
                listenerCount: this.eventBus.listeners.size
            }
        };
    }
    
    getIntegratedPerformanceInfo() {
        return {
            integration: this.performance,
            systems: {
                transitionController: this.systems.transitionController?.getPerformanceInfo(),
                audioStateManager: this.systems.audioStateManager?.getPerformanceInfo(),
                dynamicWaveController: this.systems.dynamicWaveController?.getPerformanceInfo(),
                realtimeFeedback: this.systems.realtimeFeedback?.getStatistics()
            }
        };
    }
}