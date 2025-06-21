/**
 * Phase4AudioService - Phase 4.1 Service API設計・基本構造
 * Phase 1-3システムの統一Service APIレイヤー
 * 95%成功確率・低リスク設計
 */

import { IntegratedAudioManager } from './integrated-audio-manager.js';
import { Phase3ManagerIntegration } from './phase3-manager-integration.js';

export class Phase4AudioService {
    constructor(game) {
        this.game = game;
        
        // Phase 4状態管理
        this.serviceState = {
            isInitialized: false,
            isReady: false,
            version: '4.1.0',
            initializationTime: 0,
            totalAPICalls: 0,
            errors: []
        };
        
        // Phase 1-3システムインスタンス
        this.coreManagers = {
            integratedAudioManager: null,    // Phase 1-2統合音響管理
            phase3ManagerIntegration: null   // Phase 3 Manager層統合
        };
        
        // Service API カテゴリ別組織化
        this.serviceCategories = {
            // 🎵 基本音響制御サービス
            basic: {
                name: 'BasicAudioService',
                ready: false,
                apis: ['play', 'stop', 'pause', 'volume', 'mute']
            },
            
            // 🎮 ゲーム統合サービス
            game: {
                name: 'GameIntegrationService', 
                ready: false,
                apis: ['scene', 'wave', 'combat', 'ui', 'feedback']
            },
            
            // 🔧 管理・監視サービス
            management: {
                name: 'ManagementService',
                ready: false,
                apis: ['health', 'performance', 'diagnostics', 'settings']
            }
        };
        
        // 統一エラーハンドリング
        this.errorHandling = {
            enabled: true,
            logLevel: 'info', // 'debug', 'info', 'warn', 'error'
            fallbackBehavior: 'graceful', // 'graceful', 'strict'
            retryAttempts: 2,
            retryDelay: 100
        };
        
        // パフォーマンス監視
        this.performance = {
            apiResponseTimes: new Map(),
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0
        };
        
        console.log('🚀 Phase4AudioService: Service API層初期化');
    }
    
    /**
     * Phase 4.1サービス初期化
     */
    async initialize() {
        const initStart = Date.now();
        
        try {
            console.log('🚀 Phase4AudioService: 初期化開始');
            
            // Phase 1-3システム初期化
            await this.initializeCoreManagers();
            
            // Service API初期化
            await this.initializeServiceAPIs();
            
            // パフォーマンス監視開始
            this.startPerformanceMonitoring();
            
            // 状態更新
            this.serviceState.isInitialized = true;
            this.serviceState.isReady = true;
            this.serviceState.initializationTime = Date.now() - initStart;
            
            console.log(`✅ Phase4AudioService: 初期化完了 (${this.serviceState.initializationTime}ms)`);
            return { success: true, service: this };
            
        } catch (error) {
            console.error('❌ Phase4AudioService: 初期化失敗:', error);
            this.serviceState.errors.push(error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Phase 1-3コアマネージャ初期化
     */
    async initializeCoreManagers() {
        console.log('🔧 コアマネージャ初期化開始');
        
        // IntegratedAudioManager初期化
        this.coreManagers.integratedAudioManager = new IntegratedAudioManager(this.game);
        await this.coreManagers.integratedAudioManager.initialize();
        
        // Phase3ManagerIntegration初期化
        this.coreManagers.phase3ManagerIntegration = new Phase3ManagerIntegration(
            this.game, 
            this.coreManagers.integratedAudioManager
        );
        await this.coreManagers.phase3ManagerIntegration.initialize();
        
        console.log('✅ コアマネージャ初期化完了');
    }
    
    /**
     * Service API初期化
     */
    async initializeServiceAPIs() {
        console.log('📡 Service API初期化開始');
        
        // 基本音響制御サービス初期化
        await this.initializeBasicAudioService();
        
        // ゲーム統合サービス初期化
        await this.initializeGameIntegrationService();
        
        // 管理・監視サービス初期化
        await this.initializeManagementService();
        
        console.log('✅ Service API初期化完了');
    }
    
    /**
     * 基本音響制御サービス初期化
     */
    async initializeBasicAudioService() {
        try {
            // 基本音響API設定
            this.basicAudio = {
                // 音響再生制御
                play: async (soundId, options = {}) => {
                    return await this.executeWithErrorHandling('play', async () => {
                        return await this.coreManagers.integratedAudioManager.playSound(soundId, options);
                    });
                },
                
                // 音響停止制御
                stop: async (soundId) => {
                    return await this.executeWithErrorHandling('stop', async () => {
                        return await this.coreManagers.integratedAudioManager.stopSound(soundId);
                    });
                },
                
                // 音量制御
                setVolume: async (category, volume) => {
                    return await this.executeWithErrorHandling('setVolume', async () => {
                        return await this.coreManagers.integratedAudioManager.setVolume(category, volume);
                    });
                },
                
                // ミュート制御
                setMute: async (enabled) => {
                    return await this.executeWithErrorHandling('setMute', async () => {
                        return await this.coreManagers.integratedAudioManager.setMasterMute(enabled);
                    });
                }
            };
            
            this.serviceCategories.basic.ready = true;
            console.log('✅ 基本音響制御サービス初期化完了');
            
        } catch (error) {
            console.error('❌ 基本音響制御サービス初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * ゲーム統合サービス初期化
     */
    async initializeGameIntegrationService() {
        try {
            // ゲーム統合API設定
            this.gameIntegration = {
                // シーン制御
                changeScene: async (sceneName) => {
                    return await this.executeWithErrorHandling('changeScene', async () => {
                        return await this.coreManagers.phase3ManagerIntegration.systems.sceneManager.transitionTo(sceneName);
                    });
                },
                
                // ウェーブ音響制御
                updateWave: async (waveData) => {
                    return await this.executeWithErrorHandling('updateWave', async () => {
                        return await this.coreManagers.phase3ManagerIntegration.systems.dynamicWaveController.updateWave(waveData);
                    });
                },
                
                // 戦闘音響制御
                playCombatSound: async (soundType, options = {}) => {
                    return await this.executeWithErrorHandling('playCombatSound', async () => {
                        return await this.coreManagers.integratedAudioManager.subsystems.starWarsAudio.playCombatSound(soundType, options);
                    });
                },
                
                // UI音響制御
                playUISound: async (soundType) => {
                    return await this.executeWithErrorHandling('playUISound', async () => {
                        return await this.coreManagers.integratedAudioManager.subsystems.ffUIAudio.playUISound(soundType);
                    });
                }
            };
            
            this.serviceCategories.game.ready = true;
            console.log('✅ ゲーム統合サービス初期化完了');
            
        } catch (error) {
            console.error('❌ ゲーム統合サービス初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * 管理・監視サービス初期化
     */
    async initializeManagementService() {
        try {
            // 管理・監視API設定
            this.management = {
                // ヘルスチェック
                getHealthStatus: () => {
                    return this.executeWithErrorHandling('getHealthStatus', () => {
                        return {
                            phase4Service: this.serviceState.isReady,
                            integratedAudioManager: this.coreManagers.integratedAudioManager?.isInitialized || false,
                            phase3Integration: this.coreManagers.phase3ManagerIntegration?.integrationState.isInitialized || false,
                            overallHealth: this.calculateOverallHealth()
                        };
                    });
                },
                
                // パフォーマンス取得
                getPerformanceMetrics: () => {
                    return this.executeWithErrorHandling('getPerformanceMetrics', () => {
                        return {
                            ...this.performance,
                            coreManagerPerformance: {
                                integratedAudioManager: this.coreManagers.integratedAudioManager?.performance || {},
                                phase3Integration: this.coreManagers.phase3ManagerIntegration?.performance || {}
                            }
                        };
                    });
                },
                
                // 診断情報取得
                getDiagnostics: () => {
                    return this.executeWithErrorHandling('getDiagnostics', () => {
                        return {
                            serviceState: this.serviceState,
                            serviceCategories: this.serviceCategories,
                            errorHistory: this.serviceState.errors,
                            systemDiagnostics: this.generateSystemDiagnostics()
                        };
                    });
                }
            };
            
            this.serviceCategories.management.ready = true;
            console.log('✅ 管理・監視サービス初期化完了');
            
        } catch (error) {
            console.error('❌ 管理・監視サービス初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * エラーハンドリング付きAPI実行
     */
    async executeWithErrorHandling(apiName, apiFunction) {
        const startTime = Date.now();
        this.performance.totalRequests++;
        this.serviceState.totalAPICalls++;
        
        try {
            const result = await apiFunction();
            
            // 成功時のパフォーマンス記録
            const responseTime = Date.now() - startTime;
            this.recordAPIPerformance(apiName, responseTime, true);
            
            return { success: true, data: result };
            
        } catch (error) {
            // エラー時の処理
            const responseTime = Date.now() - startTime;
            this.recordAPIPerformance(apiName, responseTime, false);
            
            console.error(`❌ Phase4AudioService API Error [${apiName}]:`, error);
            this.serviceState.errors.push(`${apiName}: ${error.message}`);
            
            if (this.errorHandling.fallbackBehavior === 'graceful') {
                return { success: false, error: error.message, gracefulFallback: true };
            } else {
                throw error;
            }
        }
    }
    
    /**
     * APIパフォーマンス記録
     */
    recordAPIPerformance(apiName, responseTime, success) {
        // API別レスポンス時間記録
        if (!this.performance.apiResponseTimes.has(apiName)) {
            this.performance.apiResponseTimes.set(apiName, []);
        }
        this.performance.apiResponseTimes.get(apiName).push(responseTime);
        
        // 成功/失敗カウント
        if (success) {
            this.performance.successfulRequests++;
        } else {
            this.performance.failedRequests++;
        }
        
        // 平均レスポンス時間更新
        this.updateAverageResponseTime();
    }
    
    /**
     * 平均レスポンス時間更新
     */
    updateAverageResponseTime() {
        let totalTime = 0;
        let totalCalls = 0;
        
        for (const [apiName, times] of this.performance.apiResponseTimes) {
            totalTime += times.reduce((sum, time) => sum + time, 0);
            totalCalls += times.length;
        }
        
        this.performance.averageResponseTime = totalCalls > 0 ? totalTime / totalCalls : 0;
    }
    
    /**
     * 全体ヘルス計算
     */
    calculateOverallHealth() {
        const healthChecks = [
            this.serviceState.isReady,
            this.coreManagers.integratedAudioManager?.isInitialized || false,
            this.coreManagers.phase3ManagerIntegration?.integrationState.isInitialized || false
        ];
        
        const healthyCount = healthChecks.filter(Boolean).length;
        return (healthyCount / healthChecks.length) * 100;
    }
    
    /**
     * システム診断情報生成
     */
    generateSystemDiagnostics() {
        return {
            timestamp: Date.now(),
            uptime: Date.now() - (this.serviceState.initializationTime || Date.now()),
            memoryUsage: this.estimateMemoryUsage(),
            serviceAPIsStatus: Object.keys(this.serviceCategories).map(category => ({
                category: this.serviceCategories[category].name,
                ready: this.serviceCategories[category].ready,
                apiCount: this.serviceCategories[category].apis.length
            }))
        };
    }
    
    /**
     * メモリ使用量推定
     */
    estimateMemoryUsage() {
        return {
            serviceObjects: Object.keys(this).length,
            coreManagers: Object.keys(this.coreManagers).length,
            performanceData: this.performance.apiResponseTimes.size,
            errorCount: this.serviceState.errors.length
        };
    }
    
    /**
     * パフォーマンス監視開始
     */
    startPerformanceMonitoring() {
        // 定期的なパフォーマンス監視
        setInterval(() => {
            if (this.serviceState.isReady) {
                this.updateAverageResponseTime();
            }
        }, 5000); // 5秒間隔
        
        console.log('📊 パフォーマンス監視開始');
    }
    
    /**
     * サービス終了処理
     */
    async shutdown() {
        console.log('🔚 Phase4AudioService: シャットダウン開始');
        
        try {
            // コアマネージャ終了処理
            if (this.coreManagers.phase3ManagerIntegration) {
                await this.coreManagers.phase3ManagerIntegration.shutdown?.();
            }
            
            if (this.coreManagers.integratedAudioManager) {
                await this.coreManagers.integratedAudioManager.shutdown?.();
            }
            
            // 状態リセット
            this.serviceState.isReady = false;
            this.serviceState.isInitialized = false;
            
            console.log('✅ Phase4AudioService: シャットダウン完了');
            
        } catch (error) {
            console.error('❌ Phase4AudioService: シャットダウンエラー:', error);
        }
    }
}