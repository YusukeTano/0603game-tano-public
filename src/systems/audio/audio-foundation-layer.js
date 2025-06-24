/**
 * AudioFoundationLayer - 新音響アーキテクチャ Layer 1 (基盤レイヤー)
 * 低レベル音響技術の安全な管理・抽象化
 * 
 * 🏗️ 責任範囲:
 * - AudioContext安全管理
 * - Synthリソース管理・プール
 * - エラーハンドリング・ログ
 * - 性能監視・リソース制限
 * 
 * 🛡️ 設計原則:
 * - 絶対に失敗しない初期化
 * - 自動リソース管理・クリーンアップ
 * - 詳細な性能・健全性監視
 * - 段階的graceful degradation
 */

import { 
    IAudioFoundation,
    AudioError, 
    AudioContextError, 
    ResourceError, 
    SynthError,
    AudioTypeValidator,
    AudioPerformanceTracker,
    AudioDebugLogger,
    AudioFoundationConfig
} from './audio-types.js';

export class AudioFoundationLayer extends IAudioFoundation {
    constructor() {
        super();
        
        // 🔧 システム状態
        this.isInitialized = false;
        this.isDisposed = false;
        this.initializationTime = null;
        
        // 🎵 AudioContext管理
        this.context = null;
        this.contextState = {
            state: 'suspended',
            sampleRate: 0,
            currentTime: 0,
            baseLatency: 0
        };
        
        // 🎛️ Synthリソース管理
        this.synthPool = new Map(); // type -> Synth[]
        this.activeSynths = new Map(); // synthId -> Synth
        this.synthIdCounter = 0;
        this.resourceLimits = {
            maxSynths: AudioFoundationConfig.maxSynths,
            maxConcurrentSounds: AudioFoundationConfig.maxConcurrentSounds,
            cleanupInterval: AudioFoundationConfig.cleanupInterval
        };
        
        // 📊 監視・統計
        this.performanceTracker = new AudioPerformanceTracker();
        this.debugLogger = new AudioDebugLogger(AudioFoundationConfig.debugLogging);
        this.statistics = {
            contextInitializations: 0,
            synthsCreated: 0,
            synthsDisposed: 0,
            errorsEncountered: 0,
            cleanupOperations: 0,
            totalUptime: 0
        };
        
        // ⏰ タイマー・リソース管理
        this.cleanupTimer = null;
        this.resourceMonitorTimer = null;
        this.startTime = Date.now();
        
        // 🚨 エラー管理
        this.errorHistory = [];
        this.errorThreshold = AudioFoundationConfig.errorThreshold;
        this.retryAttempts = AudioFoundationConfig.retryAttempts;
        
        // 📊 リソース制限制御 (Phase 1.3.3)
        this.resourceMonitoring = {
            currentUsage: {
                synthCount: 0,
                memoryMB: 0,
                cpuPercent: 0,
                poolSize: 0
            },
            usageHistory: [],
            lastCheckTime: Date.now(),
            checkInterval: 1000 // 1秒間隔
        };
        
        this.prioritySettings = {
            synthTypePriorities: {
                'basic': 1,
                'plasma': 9,
                'nuke': 10,
                'superHoming': 8,
                'superShotgun': 10,
                'enemyHit': 6,
                'enemyDeath': 5,
                'ui': 3
            },
            priorityWeights: {
                frequency: 0.1,    // 使用頻度
                importance: 0.8,   // タイプ重要度
                recency: 0.1       // 最近の使用
            }
        };
        
        this.adaptiveSettings = {
            enabled: true,
            learningRate: 0.1,
            adjustmentThreshold: 0.8,
            maxAdjustmentPercent: 50,
            monitoringWindow: 60000 // 1分間
        };
        
        this.performanceThresholds = {
            memory: {
                warning: 80,    // MB
                critical: 120,  // MB
                emergency: 150  // MB
            },
            cpu: {
                warning: 70,    // %
                critical: 85,   // %
                emergency: 95   // %
            },
            synthCount: {
                warning: 0.7,   // max比率
                critical: 0.85, // max比率
                emergency: 0.95 // max比率
            }
        };
        
        this.debugLogger.log('info', 'AudioFoundationLayer constructor completed', {
            resourceLimits: this.resourceLimits,
            config: AudioFoundationConfig
        });
    }
    
    // ==================== AudioContext管理 ====================
    
    /**
     * AudioContext初期化 - 絶対に失敗しない安全初期化
     * @returns {Promise<AudioContextResult>}
     */
    async initializeContext() {
        this.performanceTracker.startTimer('contextInitialization');
        this.debugLogger.log('info', 'Starting AudioContext initialization...');
        
        try {
            // Step 1: Tone.js利用可能性チェック
            if (typeof Tone === 'undefined') {
                throw new AudioContextError('Tone.js not loaded', {
                    suggestion: 'Please include Tone.js before AudioFoundationLayer',
                    helpUrl: 'https://tonejs.github.io/'
                });
            }
            
            this.debugLogger.log('success', 'Tone.js availability confirmed');
            
            // Step 2: AudioContextの取得・作成
            if (!this.context) {
                // Tone.jsのAudioContextを使用
                this.context = Tone.context.rawContext;
                
                if (!this.context) {
                    throw new AudioContextError('Failed to get AudioContext from Tone.js');
                }
                
                this.debugLogger.log('success', 'AudioContext acquired from Tone.js', {
                    sampleRate: this.context.sampleRate,
                    state: this.context.state
                });
            }
            
            // Step 3: Tone.jsコンテキスト初期化
            let startResult = null;
            if (Tone.context.state !== 'running') {
                this.debugLogger.log('info', 'Starting Tone.js context...');
                
                try {
                    startResult = await this._safeStartTone();
                    this.debugLogger.log('success', 'Tone.js context started successfully');
                } catch (error) {
                    // Tone.start()失敗は非致命的 - ユーザー操作待ちの可能性
                    this.debugLogger.log('warning', 'Tone.js context start failed (user interaction may be required)', {
                        error: error.message,
                        contextState: Tone.context.state
                    });
                }
            }
            
            // Step 4: コンテキスト状態更新
            this._updateContextState();
            
            // Step 5: リソース監視開始
            this._startResourceMonitoring();
            
            // Step 6: 統計更新
            this._updateStatistics('contextInitialized');
            this.isInitialized = true;
            this.initializationTime = Date.now();
            
            const result = {
                success: true,
                context: this.context,
                timestamp: this.initializationTime,
                contextState: { ...this.contextState },
                toneStarted: startResult?.success || false
            };
            
            this.debugLogger.log('success', 'AudioContext initialization completed', result);
            return result;
            
        } catch (error) {
            this.debugLogger.log('error', 'AudioContext initialization failed', { error: error.message });
            
            // エラー統計更新
            this.logError(error);
            
            // graceful degradation - 部分的成功状態を作成
            const fallbackResult = await this._createFallbackContext(error);
            
            if (fallbackResult.success) {
                this.debugLogger.log('warning', 'Fallback context created', fallbackResult);
                return fallbackResult;
            }
            
            // 完全失敗時
            throw new AudioContextError(`Context initialization failed: ${error.message}`, {
                originalError: error,
                timestamp: Date.now(),
                contextState: this.contextState,
                fallbackAttempted: true
            });
        } finally {
            this.performanceTracker.endTimer('contextInitialization');
        }
    }
    
    /**
     * Tone.js安全開始
     * @returns {Promise<Object>}
     * @private
     */
    async _safeStartTone() {
        const maxRetries = this.retryAttempts;
        const retryDelay = 100; // ms
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await Tone.start();
                
                // 成功確認
                if (Tone.context.state === 'running') {
                    return { success: true, attempt };
                } else {
                    throw new Error(`Tone context state is ${Tone.context.state}, expected 'running'`);
                }
                
            } catch (error) {
                this.debugLogger.log('warning', `Tone.start attempt ${attempt}/${maxRetries} failed`, {
                    error: error.message,
                    contextState: Tone.context.state
                });
                
                if (attempt < maxRetries) {
                    await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
                } else {
                    throw error;
                }
            }
        }
        
        throw new Error(`Tone.start failed after ${maxRetries} attempts`);
    }
    
    /**
     * フォールバックコンテキスト作成
     * @param {Error} originalError - 元のエラー
     * @returns {Promise<AudioContextResult>}
     * @private
     */
    async _createFallbackContext(originalError) {
        this.debugLogger.log('info', 'Attempting fallback context creation...');
        
        try {
            // 最小限のコンテキスト状態を作成
            this.contextState = {
                state: 'suspended',
                sampleRate: 44100, // デフォルト値
                currentTime: 0,
                baseLatency: 0
            };
            
            // 部分的初期化状態
            this.isInitialized = true;
            this.initializationTime = Date.now();
            
            return {
                success: true,
                context: null, // コンテキストなし
                timestamp: this.initializationTime,
                contextState: { ...this.contextState },
                fallback: true,
                originalError: originalError.message,
                limitations: [
                    'No actual AudioContext available',
                    'Audio playback disabled',
                    'Silent mode operation'
                ]
            };
            
        } catch (fallbackError) {
            this.debugLogger.log('error', 'Fallback context creation failed', {
                originalError: originalError.message,
                fallbackError: fallbackError.message
            });
            
            return {
                success: false,
                error: `Both primary and fallback initialization failed: ${fallbackError.message}`
            };
        }
    }
    
    /**
     * コンテキスト状態取得
     * @returns {AudioContextState}
     */
    getContextState() {
        this.debugLogger.log('debug', 'Getting context state...');
        
        try {
            // リアルタイム状態更新
            this._updateContextState();
            
            // 状態のディープコピーを返す
            const state = {
                ...this.contextState,
                isInitialized: this.isInitialized,
                uptime: this.isInitialized ? Date.now() - this.initializationTime : 0,
                lastUpdated: Date.now()
            };
            
            this.debugLogger.log('debug', 'Context state retrieved', state);
            return state;
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to get context state', { error: error.message });
            
            // エラー時はキャッシュされた状態を返す
            return {
                ...this.contextState,
                error: error.message,
                lastUpdated: Date.now()
            };
        }
    }
    
    /**
     * コンテキスト再開
     * @returns {Promise<void>}
     */
    async resumeContext() {
        this.performanceTracker.startTimer('contextResume');
        this.debugLogger.log('info', 'Resuming AudioContext...');
        
        try {
            if (!this.isInitialized) {
                throw new AudioContextError('Cannot resume context - not initialized');
            }
            
            if (!this.context) {
                this.debugLogger.log('warning', 'No AudioContext available - attempting re-initialization');
                await this.initializeContext();
                return;
            }
            
            // Tone.jsコンテキスト再開
            if (Tone.context.state === 'suspended') {
                this.debugLogger.log('info', 'Starting suspended Tone context...');
                
                try {
                    await Tone.start();
                    this.debugLogger.log('success', 'Tone context resumed successfully');
                } catch (error) {
                    this.debugLogger.log('warning', 'Tone.start failed during resume - user interaction may be required', {
                        error: error.message
                    });
                }
            }
            
            // 直接AudioContext再開も試行
            if (this.context.state === 'suspended') {
                try {
                    await this.context.resume();
                    this.debugLogger.log('success', 'AudioContext resumed directly');
                } catch (error) {
                    this.debugLogger.log('warning', 'Direct AudioContext resume failed', {
                        error: error.message
                    });
                }
            }
            
            // 状態更新
            this._updateContextState();
            
            this.debugLogger.log('success', 'Context resume completed', {
                toneState: Tone.context.state,
                contextState: this.context.state,
                finalState: this.contextState.state
            });
            
        } catch (error) {
            this.debugLogger.log('error', 'Context resume failed', { error: error.message });
            this.logError(error);
            
            throw new AudioContextError(`Context resume failed: ${error.message}`, {
                originalError: error,
                contextState: this.contextState
            });
        } finally {
            this.performanceTracker.endTimer('contextResume');
        }
    }
    
    /**
     * コンテキスト停止
     * @returns {Promise<void>}
     */
    async suspendContext() {
        this.performanceTracker.startTimer('contextSuspend');
        this.debugLogger.log('info', 'Suspending AudioContext...');
        
        try {
            if (!this.isInitialized) {
                this.debugLogger.log('warning', 'Context not initialized - suspend ignored');
                return;
            }
            
            if (!this.context) {
                this.debugLogger.log('warning', 'No AudioContext to suspend');
                return;
            }
            
            // AudioContext停止
            if (this.context.state === 'running') {
                try {
                    await this.context.suspend();
                    this.debugLogger.log('success', 'AudioContext suspended successfully');
                } catch (error) {
                    this.debugLogger.log('warning', 'AudioContext suspend failed', {
                        error: error.message
                    });
                }
            }
            
            // 状態更新
            this._updateContextState();
            
            this.debugLogger.log('success', 'Context suspend completed', {
                contextState: this.context.state,
                finalState: this.contextState.state
            });
            
        } catch (error) {
            this.debugLogger.log('error', 'Context suspend failed', { error: error.message });
            this.logError(error);
            
            throw new AudioContextError(`Context suspend failed: ${error.message}`, {
                originalError: error,
                contextState: this.contextState
            });
        } finally {
            this.performanceTracker.endTimer('contextSuspend');
        }
    }
    
    // ==================== Synthリソース管理 ====================
    
    /**
     * Synth作成 - インテリジェントリソース管理
     * @param {SynthType} type - Synthタイプ
     * @param {SynthConfig} config - 設定
     * @returns {Promise<Object>} - Synthインスタンス
     */
    async createSynth(type, config = {}) {
        this.performanceTracker.startTimer('synthCreation');
        this.debugLogger.log('info', 'Creating synth', { type, config });
        
        try {
            // Phase 1.3.1: 基本Synth作成システム
            
            // 前提条件チェック
            if (!this.isInitialized) {
                throw new SynthError('Cannot create synth - AudioFoundation not initialized');
            }
            
            // 入力検証
            this._validateSynthParams(type, config);
            
            // Phase 1.3.3: 動的リソース制限チェック
            const resourceStatus = this._checkResourceUsage();
            this._enforceResourceLimits(type, resourceStatus);
            
            // Phase 1.3.2: Synthプール管理システム
            // プールからSynthインスタンス取得を試行
            const synthInstance = await this._getSynthFromPoolOrCreate(type, config);
            
            // Synthインスタンス管理
            const synthId = this._generateSynthId();
            const managedSynth = {
                id: synthId,
                type,
                config,
                instance: synthInstance,
                createdAt: Date.now(),
                lastUsed: Date.now(),
                isActive: true
            };
            
            // アクティブSynthに登録
            this.activeSynths.set(synthId, managedSynth);
            
            // 統計更新
            this._updateStatistics('synthCreated', { type, synthId });
            
            this.debugLogger.log('success', 'Synth created successfully', {
                synthId,
                type,
                totalActiveSynths: this.activeSynths.size
            });
            
            return managedSynth;
            
        } catch (error) {
            this.debugLogger.log('error', 'Synth creation failed', { type, error: error.message });
            this.logError(error);
            
            throw new SynthError(`Synth creation failed: ${error.message}`, {
                type,
                config,
                originalError: error
            });
        } finally {
            this.performanceTracker.endTimer('synthCreation');
        }
    }
    
    /**
     * Synth破棄
     * @param {Object} synth - Synthインスタンス
     * @returns {void}
     */
    disposeSynth(synth) {
        this.debugLogger.log('info', 'Disposing synth', { synthId: synth?.id });
        
        try {
            // Phase 1.3.1: 基本Synth破棄システム
            
            if (!synth || !synth.id) {
                throw new SynthError('Invalid synth object provided');
            }
            
            // アクティブSynthから検索
            const managedSynth = this.activeSynths.get(synth.id);
            if (!managedSynth) {
                this.debugLogger.log('warning', 'Synth not found in active synths', { synthId: synth.id });
                return;
            }
            
            // Phase 1.3.2: プール返却を試行、失敗時は破棄
            const poolReturned = this._returnSynthToPool(managedSynth);
            
            // プール返却できない場合は通常破棄
            if (!poolReturned) {
                this._disposeSynthInternal(managedSynth.instance);
            }
            
            // アクティブSynthから削除
            this.activeSynths.delete(synth.id);
            
            // 統計更新
            this._updateStatistics('synthDisposed', { 
                type: managedSynth.type,
                synthId: synth.id,
                lifetime: Date.now() - managedSynth.createdAt
            });
            
            this.debugLogger.log('success', 'Synth disposed successfully', {
                synthId: synth.id,
                type: managedSynth.type,
                remainingActiveSynths: this.activeSynths.size
            });
            
        } catch (error) {
            this.debugLogger.log('error', 'Synth disposal failed', { 
                synthId: synth?.id, 
                error: error.message 
            });
            this.logError(error);
            
            throw new SynthError(`Synth disposal failed: ${error.message}`, {
                synthId: synth?.id,
                originalError: error
            });
        }
    }
    
    // ==================== 統計・監視 ====================
    
    /**
     * リソース統計取得
     * @returns {ResourceStats}
     */
    getResourceStats() {
        // Phase 1.4で実装予定
        this.debugLogger.log('debug', 'getResourceStats called - implementation pending');
        
        return {
            synthCount: this.activeSynths.size,
            maxSynths: this.resourceLimits.maxSynths,
            activeSounds: 0, // Phase 1.4で実装
            memoryUsage: 0,  // Phase 1.4で実装
            cpuUsage: 0      // Phase 1.4で実装
        };
    }
    
    /**
     * リソースクリーンアップ
     * @returns {CleanupResult}
     */
    cleanupResources() {
        // Phase 1.3で実装予定
        this.debugLogger.log('info', 'cleanupResources called - implementation pending');
        
        return {
            cleaned: 0,
            memoryFreed: 0,
            duration: 0
        };
    }
    
    /**
     * エラーログ記録
     * @param {AudioError} error - エラー情報
     * @returns {void}
     */
    logError(error) {
        // Phase 1.4で実装予定
        this.debugLogger.log('error', 'Audio error logged', { error: error.message });
        this.errorHistory.push({
            error,
            timestamp: Date.now()
        });
        
        // エラー履歴サイズ制限
        if (this.errorHistory.length > 100) {
            this.errorHistory.shift();
        }
        
        this.statistics.errorsEncountered++;
    }
    
    /**
     * ヘルスメトリクス取得
     * @returns {HealthMetrics}
     */
    getHealthMetrics() {
        // Phase 1.4で実装予定
        const uptime = Date.now() - this.startTime;
        
        return {
            uptime,
            errorCount: this.statistics.errorsEncountered,
            averageLatency: this.performanceTracker.getAverageMetric('synthCreation'),
            performanceScore: this._calculatePerformanceScore(),
            overallStatus: this._calculateOverallStatus()
        };
    }
    
    // ==================== 内部ユーティリティ ====================
    
    /**
     * 性能スコア計算
     * @returns {number} - 0-100のスコア
     * @private
     */
    _calculatePerformanceScore() {
        let score = 100;
        
        // エラー率によるペナルティ
        const errorRate = this.statistics.errorsEncountered / Math.max(this.statistics.synthsCreated, 1);
        score -= Math.min(errorRate * 50, 50);
        
        // レイテンシーによるペナルティ  
        const avgLatency = this.performanceTracker.getAverageMetric('synthCreation');
        if (avgLatency > 100) score -= Math.min((avgLatency - 100) / 10, 30);
        
        // リソース使用率によるペナルティ
        const resourceUsage = this.activeSynths.size / this.resourceLimits.maxSynths;
        if (resourceUsage > 0.8) score -= (resourceUsage - 0.8) * 50;
        
        return Math.max(0, Math.round(score));
    }
    
    /**
     * 全体状態計算
     * @returns {string}
     * @private
     */
    _calculateOverallStatus() {
        if (!this.isInitialized) return 'Not Initialized';
        if (this.isDisposed) return 'Disposed';
        
        const score = this._calculatePerformanceScore();
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'Fair';
        if (score >= 20) return 'Poor';
        return 'Critical';
    }
    
    /**
     * 入力値検証
     * @param {SynthType} type - Synthタイプ
     * @param {SynthConfig} config - 設定
     * @throws {SynthError}
     * @private
     */
    _validateSynthParams(type, config) {
        if (!AudioTypeValidator.isValidSynthType(type)) {
            throw new SynthError(`Invalid synth type: ${type}`);
        }
        
        if (!AudioTypeValidator.isValidSynthConfig(config)) {
            throw new SynthError(`Invalid synth config`, { config });
        }
    }
    
    /**
     * 統計更新
     * @param {string} operation - 操作名
     * @param {Object} data - 更新データ
     * @private
     */
    _updateStatistics(operation, data = {}) {
        switch (operation) {
            case 'synthCreated':
                this.statistics.synthsCreated++;
                break;
            case 'synthDisposed':
                this.statistics.synthsDisposed++;
                break;
            case 'contextInitialized':
                this.statistics.contextInitializations++;
                break;
            case 'cleanupPerformed':
                this.statistics.cleanupOperations++;
                break;
        }
        
        this.debugLogger.log('debug', `Statistics updated: ${operation}`, { 
            operation, 
            data, 
            currentStats: this.statistics 
        });
    }
    
    // ==================== ライフサイクル管理 ====================
    
    /**
     * システム破棄
     * @returns {Promise<void>}
     */
    async dispose() {
        if (this.isDisposed) return;
        
        this.debugLogger.log('info', 'Starting AudioFoundationLayer disposal...');
        
        try {
            // タイマー停止
            if (this.cleanupTimer) {
                clearInterval(this.cleanupTimer);
                this.cleanupTimer = null;
            }
            
            if (this.resourceMonitorTimer) {
                clearInterval(this.resourceMonitorTimer);
                this.resourceMonitorTimer = null;
            }
            
            // 全Synth破棄（Phase 1.3で実装）
            // this.disposeAllSynths();
            
            // コンテキスト停止（Phase 1.2で実装）
            // await this.suspendContext();
            
            this.isDisposed = true;
            this.debugLogger.log('success', 'AudioFoundationLayer disposal completed');
            
        } catch (error) {
            this.debugLogger.log('error', 'AudioFoundationLayer disposal failed', { error: error.message });
            throw new AudioError(`Disposal failed: ${error.message}`, 'DISPOSAL_ERROR', { originalError: error });
        }
    }
    
    // ==================== デバッグ・開発支援 ====================
    
    /**
     * デバッグ情報取得
     * @returns {Object}
     */
    getDebugInfo() {
        return {
            system: {
                isInitialized: this.isInitialized,
                isDisposed: this.isDisposed,
                uptime: Date.now() - this.startTime
            },
            context: this.contextState,
            resources: {
                activeSynths: this.activeSynths.size,
                pooledSynths: Array.from(this.synthPool.entries()).map(([type, synths]) => ({
                    type,
                    count: synths.length
                }))
            },
            performance: this.performanceTracker.getAllMetrics(),
            statistics: this.statistics,
            errors: this.errorHistory.slice(-10), // 最新10件
            config: this.resourceLimits
        };
    }
    
    /**
     * デバッグ情報をコンソール出力
     */
    debugPrint() {
        const debugInfo = this.getDebugInfo();
        
        console.group('🔧 AudioFoundationLayer Debug Information');
        console.log('📊 System Status:', debugInfo.system);
        console.log('🎵 Context State:', debugInfo.context);
        console.log('🎛️ Resources:', debugInfo.resources);
        console.log('⚡ Performance:', debugInfo.performance);
        console.log('📈 Statistics:', debugInfo.statistics);
        
        if (debugInfo.errors.length > 0) {
            console.log('🚨 Recent Errors:', debugInfo.errors);
        }
        
        console.groupEnd();
    }
    
    // ==================== 内部ヘルパーメソッド (Phase 1.2, 1.3.1) ====================
    
    /**
     * SynthType別ファクトリーメソッド
     * @param {SynthType} type - Synthタイプ
     * @param {SynthConfig} config - 設定
     * @returns {Promise<Object>} - Tone.js Synthインスタンス
     * @private
     */
    async _createSynthByType(type, config) {
        this.debugLogger.log('debug', 'Creating synth by type', { type, config });
        
        try {
            // Tone.js利用可能性チェック
            if (typeof Tone === 'undefined') {
                throw new SynthError('Tone.js not available for synth creation');
            }
            
            // デフォルト設定適用
            const synthConfig = {
                volume: config.volume !== undefined ? config.volume : 0.7,
                envelope: config.envelope || 'default',
                maxVoices: config.maxVoices || 1,
                ...config
            };
            
            let synthInstance;
            
            // SynthType別作成ロジック
            switch (type) {
                case 'basic':
                    synthInstance = new Tone.Synth({
                        volume: this._volumeToDb(synthConfig.volume),
                        envelope: {
                            attack: 0.01,
                            decay: 0.1,
                            sustain: 0.3,
                            release: 0.1
                        }
                    });
                    break;
                    
                case 'plasma':
                    synthInstance = new Tone.Synth({
                        volume: this._volumeToDb(synthConfig.volume),
                        oscillator: { type: 'sawtooth' },
                        envelope: {
                            attack: 0.005,
                            decay: 0.05,
                            sustain: 0.2,
                            release: 0.05
                        }
                    });
                    break;
                    
                case 'nuke':
                    synthInstance = new Tone.Synth({
                        volume: this._volumeToDb(synthConfig.volume),
                        oscillator: { type: 'square' },
                        envelope: {
                            attack: 0.01,
                            decay: 0.2,
                            sustain: 0.5,
                            release: 0.3
                        }
                    });
                    break;
                    
                case 'superHoming':
                    synthInstance = new Tone.Synth({
                        volume: this._volumeToDb(synthConfig.volume),
                        oscillator: { type: 'triangle' },
                        envelope: {
                            attack: 0.01,
                            decay: 0.1,
                            sustain: 0.4,
                            release: 0.2
                        }
                    });
                    break;
                    
                case 'superShotgun':
                    synthInstance = new Tone.NoiseSynth({
                        volume: this._volumeToDb(synthConfig.volume),
                        noise: { type: 'brown' },
                        envelope: {
                            attack: 0.001,
                            decay: 0.05,
                            sustain: 0.1,
                            release: 0.03
                        }
                    });
                    break;
                    
                case 'enemyHit':
                    synthInstance = new Tone.Synth({
                        volume: this._volumeToDb(synthConfig.volume),
                        oscillator: { type: 'sine' },
                        envelope: {
                            attack: 0.001,
                            decay: 0.02,
                            sustain: 0.1,
                            release: 0.01
                        }
                    });
                    break;
                    
                case 'enemyDeath':
                    synthInstance = new Tone.NoiseSynth({
                        volume: this._volumeToDb(synthConfig.volume),
                        noise: { type: 'white' },
                        envelope: {
                            attack: 0.01,
                            decay: 0.1,
                            sustain: 0.2,
                            release: 0.2
                        }
                    });
                    break;
                    
                case 'ui':
                    synthInstance = new Tone.Synth({
                        volume: this._volumeToDb(synthConfig.volume),
                        oscillator: { type: 'sine' },
                        envelope: {
                            attack: 0.01,
                            decay: 0.05,
                            sustain: 0.3,
                            release: 0.1
                        }
                    });
                    break;
                    
                default:
                    throw new SynthError(`Unsupported synth type: ${type}`);
            }
            
            // 出力先接続
            synthInstance.toDestination();
            
            this.debugLogger.log('success', 'Synth instance created', { 
                type, 
                volume: synthConfig.volume,
                instanceType: synthInstance.constructor.name
            });
            
            return synthInstance;
            
        } catch (error) {
            this.debugLogger.log('error', 'Synth instance creation failed', { 
                type, 
                error: error.message 
            });
            throw new SynthError(`Failed to create ${type} synth: ${error.message}`, {
                type,
                config,
                originalError: error
            });
        }
    }
    
    /**
     * SynthID生成
     * @returns {string} - ユニークなSynthID
     * @private
     */
    _generateSynthId() {
        const id = `synth_${++this.synthIdCounter}_${Date.now()}`;
        this.debugLogger.log('debug', 'Generated synth ID', { id });
        return id;
    }
    
    /**
     * 音量値をdB値に変換
     * @param {number} volume - 0-1の音量値
     * @returns {number} - dB値
     * @private
     */
    _volumeToDb(volume) {
        if (volume <= 0) return -Infinity;
        if (volume >= 1) return 0;
        
        // 0-1を-40dB~0dBにマップ
        return Math.log10(volume) * 20;
    }
    
    // ==================== Synthプール管理メソッド (Phase 1.3.2) ====================
    
    /**
     * プールからSynth取得または新規作成
     * @param {SynthType} type - Synthタイプ
     * @param {SynthConfig} config - 設定
     * @returns {Promise<Object>} - Synthインスタンス
     * @private
     */
    async _getSynthFromPoolOrCreate(type, config) {
        this.debugLogger.log('debug', 'Getting synth from pool or creating new', { type, config });
        
        try {
            // プールから取得を試行
            const pooledSynth = this._getFromSynthPool(type, config);
            
            if (pooledSynth) {
                this.debugLogger.log('success', 'Synth retrieved from pool', { 
                    type, 
                    poolSize: this.synthPool.get(type)?.length || 0
                });
                
                // プール統計更新
                this.statistics.poolHits = (this.statistics.poolHits || 0) + 1;
                return pooledSynth;
            }
            
            // プールにない場合は新規作成
            this.debugLogger.log('info', 'No suitable synth in pool, creating new', { type });
            const newSynth = await this._createSynthByType(type, config);
            
            // プール統計更新
            this.statistics.poolMisses = (this.statistics.poolMisses || 0) + 1;
            return newSynth;
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to get synth from pool or create', { 
                type, 
                error: error.message 
            });
            throw error;
        }
    }
    
    /**
     * プールにSynth返却
     * @param {Object} managedSynth - 管理されたSynthオブジェクト
     * @returns {boolean} - 返却成功フラグ
     * @private
     */
    _returnSynthToPool(managedSynth) {
        this.debugLogger.log('debug', 'Attempting to return synth to pool', { 
            synthId: managedSynth.id,
            type: managedSynth.type
        });
        
        try {
            // プール適用判定
            if (!this._isPoolEligible(managedSynth)) {
                this.debugLogger.log('info', 'Synth not eligible for pooling', { 
                    synthId: managedSynth.id,
                    type: managedSynth.type
                });
                return false;
            }
            
            // Synth状態リセット
            this._resetSynthState(managedSynth.instance);
            
            // プールに追加
            const success = this._addToSynthPool(managedSynth.type, managedSynth.instance);
            
            if (success) {
                this.debugLogger.log('success', 'Synth returned to pool', { 
                    synthId: managedSynth.id,
                    type: managedSynth.type,
                    poolSize: this.synthPool.get(managedSynth.type)?.length || 0
                });
                
                // プール統計更新
                this.statistics.poolReturns = (this.statistics.poolReturns || 0) + 1;
                return true;
            }
            
            return false;
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to return synth to pool', { 
                synthId: managedSynth.id,
                error: error.message 
            });
            return false;
        }
    }
    
    /**
     * プールからSynthを取得
     * @param {SynthType} type - Synthタイプ
     * @param {SynthConfig} config - 設定（適合性チェック用）
     * @returns {Object|null} - Synthインスタンス
     * @private
     */
    _getFromSynthPool(type, config) {
        try {
            const pool = this.synthPool.get(type);
            if (!pool || pool.length === 0) {
                return null;
            }
            
            // 設定に適合するSynthを検索
            for (let i = pool.length - 1; i >= 0; i--) {
                const pooledSynth = pool[i];
                
                if (this._isSynthConfigCompatible(pooledSynth, config)) {
                    // プールから削除して返却
                    pool.splice(i, 1);
                    
                    this.debugLogger.log('debug', 'Found compatible synth in pool', { 
                        type,
                        remainingInPool: pool.length
                    });
                    
                    return pooledSynth;
                }
            }
            
            this.debugLogger.log('debug', 'No compatible synth found in pool', { 
                type,
                poolSize: pool.length,
                requiredConfig: config
            });
            
            return null;
            
        } catch (error) {
            this.debugLogger.log('error', 'Error getting synth from pool', { 
                type, 
                error: error.message 
            });
            return null;
        }
    }
    
    /**
     * プールにSynthを追加
     * @param {SynthType} type - Synthタイプ
     * @param {Object} synthInstance - Synthインスタンス
     * @returns {boolean} - 追加成功フラグ
     * @private
     */
    _addToSynthPool(type, synthInstance) {
        try {
            // プールサイズ制限チェック
            const maxPoolSize = this._getMaxPoolSize(type);
            
            if (!this.synthPool.has(type)) {
                this.synthPool.set(type, []);
            }
            
            const pool = this.synthPool.get(type);
            
            if (pool.length >= maxPoolSize) {
                this.debugLogger.log('info', 'Pool is full, cannot add synth', { 
                    type,
                    currentSize: pool.length,
                    maxSize: maxPoolSize
                });
                return false;
            }
            
            // プールに追加
            pool.push(synthInstance);
            
            this.debugLogger.log('debug', 'Added synth to pool', { 
                type,
                poolSize: pool.length,
                maxSize: maxPoolSize
            });
            
            return true;
            
        } catch (error) {
            this.debugLogger.log('error', 'Error adding synth to pool', { 
                type, 
                error: error.message 
            });
            return false;
        }
    }
    
    /**
     * Synth状態リセット（プール返却時）
     * @param {Object} synthInstance - Synthインスタンス
     * @private
     */
    _resetSynthState(synthInstance) {
        try {
            // Tone.js Synthの状態リセット
            if (synthInstance && typeof synthInstance.dispose !== 'function') {
                // 必要に応じて状態リセット処理
                // 例: 音量リセット、エフェクトクリア等
                this.debugLogger.log('debug', 'Synth state reset completed');
            }
        } catch (error) {
            this.debugLogger.log('warning', 'Failed to reset synth state', { 
                error: error.message 
            });
        }
    }
    
    /**
     * プール適用判定
     * @param {Object} managedSynth - 管理されたSynthオブジェクト
     * @returns {boolean} - プール適用可能フラグ
     * @private
     */
    _isPoolEligible(managedSynth) {
        try {
            // 基本的な適格性チェック
            if (!managedSynth || !managedSynth.instance || !managedSynth.type) {
                return false;
            }
            
            // Synthが破棄されていないかチェック
            if (managedSynth.instance.isDisposed) {
                return false;
            }
            
            // 特定タイプのプール適用制限
            const poolExcludeTypes = ['ui']; // UI音は通常短命でプール不要
            if (poolExcludeTypes.includes(managedSynth.type)) {
                return false;
            }
            
            // 最小使用時間チェック（非常に短時間使用のものは除外）
            const lifetime = Date.now() - managedSynth.createdAt;
            if (lifetime < 100) { // 100ms未満は除外
                return false;
            }
            
            return true;
            
        } catch (error) {
            this.debugLogger.log('error', 'Error checking pool eligibility', { 
                synthId: managedSynth?.id,
                error: error.message 
            });
            return false;
        }
    }
    
    /**
     * Synth設定適合性チェック
     * @param {Object} pooledSynth - プール内Synthインスタンス
     * @param {SynthConfig} requiredConfig - 要求設定
     * @returns {boolean} - 適合性フラグ
     * @private
     */
    _isSynthConfigCompatible(pooledSynth, requiredConfig) {
        try {
            // 基本設定のマッチングチェック
            // 音量は動的調整可能なので互換性チェックから除外
            const criticalFields = ['envelope', 'maxVoices'];
            
            for (const field of criticalFields) {
                if (requiredConfig[field] !== undefined) {
                    // プールされたSynthの設定と比較
                    // 現時点では基本的な互換性のみチェック
                    // より詳細な設定比較はPhase 1.3.3で実装
                }
            }
            
            return true; // Phase 1.3.2では基本的な互換性のみ
            
        } catch (error) {
            this.debugLogger.log('error', 'Error checking synth config compatibility', { 
                error: error.message 
            });
            return false;
        }
    }
    
    /**
     * タイプ別最大プールサイズ取得
     * @param {SynthType} type - Synthタイプ
     * @returns {number} - 最大プールサイズ
     * @private
     */
    _getMaxPoolSize(type) {
        // タイプ別プールサイズ設定
        const poolSizes = {
            'basic': 3,
            'plasma': 2,
            'nuke': 2, 
            'superHoming': 2,
            'superShotgun': 2,
            'enemyHit': 4,
            'enemyDeath': 3,
            'ui': 1
        };
        
        return poolSizes[type] || 2; // デフォルト2個
    }
    
    /**
     * プール統計取得
     * @returns {Object} - プール統計情報
     */
    getPoolStats() {
        try {
            const stats = {
                totalPooled: 0,
                byType: {},
                hitRate: 0,
                totalHits: this.statistics.poolHits || 0,
                totalMisses: this.statistics.poolMisses || 0,
                totalReturns: this.statistics.poolReturns || 0
            };
            
            // タイプ別プール統計
            for (const [type, pool] of this.synthPool) {
                stats.byType[type] = pool.length;
                stats.totalPooled += pool.length;
            }
            
            // ヒット率計算
            const totalRequests = stats.totalHits + stats.totalMisses;
            if (totalRequests > 0) {
                stats.hitRate = Math.round((stats.totalHits / totalRequests) * 100);
            }
            
            return stats;
            
        } catch (error) {
            this.debugLogger.log('error', 'Error getting pool stats', { error: error.message });
            return {
                totalPooled: 0,
                byType: {},
                hitRate: 0,
                error: error.message
            };
        }
    }
    
    // ==================== リソース制限制御メソッド (Phase 1.3.3) ====================
    
    /**
     * リソース使用量監視
     * @returns {Object} - リソース状況
     * @private
     */
    _checkResourceUsage() {
        try {
            const currentTime = Date.now();
            
            // 現在の使用量取得
            const currentUsage = {
                synthCount: this.activeSynths.size,
                memoryMB: this._getMemoryUsage(),
                cpuPercent: this._getCpuUsage(),
                poolSize: this._getTotalPoolSize(),
                timestamp: currentTime
            };
            
            // 使用率計算
            const usageRatios = {
                synthCount: currentUsage.synthCount / this.resourceLimits.maxSynths,
                memory: currentUsage.memoryMB / this.performanceThresholds.memory.critical,
                cpu: currentUsage.cpuPercent / 100
            };
            
            // 警告レベル判定
            const warningLevel = this._determineWarningLevel(usageRatios);
            
            // 使用量履歴更新
            this._updateUsageHistory(currentUsage);
            
            // 監視データ更新
            this.resourceMonitoring.currentUsage = currentUsage;
            this.resourceMonitoring.lastCheckTime = currentTime;
            
            const resourceStatus = {
                usage: currentUsage,
                ratios: usageRatios,
                warningLevel,
                recommendations: this._getResourceRecommendations(usageRatios, warningLevel)
            };
            
            this.debugLogger.log('debug', 'Resource usage checked', {
                synthCount: currentUsage.synthCount,
                memoryMB: currentUsage.memoryMB,
                warningLevel,
                recommendations: resourceStatus.recommendations.length
            });
            
            return resourceStatus;
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to check resource usage', { error: error.message });
            
            // フォールバック: 基本的な使用量情報
            return {
                usage: {
                    synthCount: this.activeSynths.size,
                    memoryMB: 0,
                    cpuPercent: 0,
                    poolSize: 0
                },
                ratios: {
                    synthCount: this.activeSynths.size / this.resourceLimits.maxSynths,
                    memory: 0,
                    cpu: 0
                },
                warningLevel: 'normal',
                recommendations: [],
                error: error.message
            };
        }
    }
    
    /**
     * リソース制限執行
     * @param {SynthType} requestedType - 要求されたSynthタイプ
     * @param {Object} resourceStatus - リソース状況
     * @throws {ResourceError}
     * @private
     */
    _enforceResourceLimits(requestedType, resourceStatus) {
        try {
            const { usage, ratios, warningLevel } = resourceStatus;
            
            // 基本制限チェック
            if (usage.synthCount >= this.resourceLimits.maxSynths) {
                throw new ResourceError(`Maximum synths reached: ${this.resourceLimits.maxSynths}`);
            }
            
            // 緊急時制限
            if (warningLevel === 'emergency') {
                // 高優先度タイプのみ許可
                const priority = this.prioritySettings.synthTypePriorities[requestedType] || 1;
                if (priority < 7) {
                    throw new ResourceError(`Emergency mode: only high-priority synths allowed (${requestedType} priority: ${priority})`);
                }
            }
            
            // 重要時制限
            if (warningLevel === 'critical') {
                // 中優先度以上のみ許可
                const priority = this.prioritySettings.synthTypePriorities[requestedType] || 1;
                if (priority < 5) {
                    throw new ResourceError(`Critical mode: only medium-priority synths allowed (${requestedType} priority: ${priority})`);
                }
                
                // リソース最適化を実行
                this._optimizeResourceAllocation();
            }
            
            // 警告時は推奨事項ログ出力
            if (warningLevel === 'warning' && resourceStatus.recommendations.length > 0) {
                this.debugLogger.log('warning', 'Resource usage warning', {
                    warningLevel,
                    recommendations: resourceStatus.recommendations,
                    requestedType
                });
            }
            
            this.debugLogger.log('debug', 'Resource limits enforced', {
                requestedType,
                warningLevel,
                synthCount: usage.synthCount,
                allowed: true
            });
            
        } catch (error) {
            this.debugLogger.log('error', 'Resource limit enforcement failed', {
                requestedType,
                error: error.message
            });
            throw error;
        }
    }
    
    /**
     * 動的リソース制限調整
     * @returns {Object} - 調整結果
     */
    adjustResourceLimits() {
        try {
            if (!this.adaptiveSettings.enabled) {
                return { adjusted: false, reason: 'Adaptive settings disabled' };
            }
            
            const resourceStatus = this._checkResourceUsage();
            const { ratios, warningLevel } = resourceStatus;
            
            let adjustments = {};
            let adjusted = false;
            
            // メモリベース調整
            if (ratios.memory > this.adaptiveSettings.adjustmentThreshold) {
                const reduction = Math.min(
                    Math.floor(this.resourceLimits.maxSynths * 0.2), // 最大20%削減
                    Math.floor(this.resourceLimits.maxSynths * this.adaptiveSettings.maxAdjustmentPercent / 100)
                );
                
                this.resourceLimits.maxSynths = Math.max(
                    this.resourceLimits.maxSynths - reduction,
                    5 // 最低5個は確保
                );
                
                adjustments.maxSynths = -reduction;
                adjusted = true;
            }
            
            // CPU ベース調整
            if (ratios.cpu > this.adaptiveSettings.adjustmentThreshold) {
                // 同時発音数制限
                const reduction = Math.min(
                    Math.floor(this.resourceLimits.maxConcurrentSounds * 0.3),
                    2
                );
                
                this.resourceLimits.maxConcurrentSounds = Math.max(
                    this.resourceLimits.maxConcurrentSounds - reduction,
                    2 // 最低2音は確保
                );
                
                adjustments.maxConcurrentSounds = -reduction;
                adjusted = true;
            }
            
            // Synthカウントベース調整（予防的）
            if (ratios.synthCount > 0.9 && warningLevel !== 'emergency') {
                // クリーンアップ間隔短縮
                this.resourceLimits.cleanupInterval = Math.max(
                    this.resourceLimits.cleanupInterval * 0.8,
                    2000 // 最低2秒
                );
                
                adjustments.cleanupInterval = 'reduced';
                adjusted = true;
            }
            
            if (adjusted) {
                this.debugLogger.log('info', 'Resource limits adjusted dynamically', {
                    adjustments,
                    warningLevel,
                    newLimits: this.resourceLimits
                });
                
                return {
                    adjusted: true,
                    adjustments,
                    newLimits: { ...this.resourceLimits },
                    trigger: warningLevel
                };
            }
            
            return { adjusted: false, reason: 'No adjustments needed' };
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to adjust resource limits', { error: error.message });
            return { adjusted: false, error: error.message };
        }
    }
    
    /**
     * 優先度スコア計算
     * @param {SynthType} type - Synthタイプ
     * @param {Object} managedSynth - 管理されたSynthオブジェクト（optional）
     * @returns {number} - 優先度スコア（0-100）
     * @private
     */
    _getPriorityScore(type, managedSynth = null) {
        try {
            const weights = this.prioritySettings.priorityWeights;
            
            // タイプ重要度スコア（0-10 → 0-100に拡張）
            const baseImportance = this.prioritySettings.synthTypePriorities[type] || 1;
            const importanceScore = baseImportance * 10; // 10倍して0-100範囲に
            
            // 使用頻度スコア（統計ベース 0-100）
            const frequencyScore = this._getFrequencyScore(type);
            
            // 最近の使用スコア（0-100）
            const recencyScore = managedSynth ? this._getRecencyScore(managedSynth) : 50;
            
            // 重み付き合計（0-100）
            const totalScore = (
                importanceScore * weights.importance +
                frequencyScore * weights.frequency +
                recencyScore * weights.recency
            );
            
            return Math.min(Math.max(totalScore, 0), 100);
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to calculate priority score', { 
                type, 
                error: error.message 
            });
            return 50; // デフォルト中間スコア
        }
    }
    
    /**
     * リソース最適化実行
     * @returns {Object} - 最適化結果
     * @private
     */
    _optimizeResourceAllocation() {
        try {
            const optimizationResults = {
                cleaned: 0,
                poolOptimized: 0,
                limitsAdjusted: false,
                memoryFreed: 0
            };
            
            // 1. 低優先度Synthの整理
            const lowPrioritySynths = [];
            for (const [synthId, managedSynth] of this.activeSynths) {
                const priorityScore = this._getPriorityScore(managedSynth.type, managedSynth);
                if (priorityScore < 30) { // 30未満は低優先度
                    lowPrioritySynths.push({ synthId, managedSynth, priorityScore });
                }
            }
            
            // 優先度順でソート（低い順）
            lowPrioritySynths.sort((a, b) => a.priorityScore - b.priorityScore);
            
            // 低優先度Synthの一部をプールに返却
            const toOptimize = lowPrioritySynths.slice(0, Math.min(3, lowPrioritySynths.length));
            for (const { synthId, managedSynth } of toOptimize) {
                try {
                    this.disposeSynth(managedSynth);
                    optimizationResults.cleaned++;
                } catch (error) {
                    this.debugLogger.log('warning', 'Failed to dispose low-priority synth during optimization', {
                        synthId,
                        error: error.message
                    });
                }
            }
            
            // 2. プールサイズ最適化
            for (const [type, pool] of this.synthPool) {
                const maxSize = this._getMaxPoolSize(type);
                if (pool.length > maxSize * 0.7) { // 70%超過時は縮小
                    const toRemove = pool.length - Math.floor(maxSize * 0.7);
                    for (let i = 0; i < toRemove; i++) {
                        const pooledSynth = pool.pop();
                        if (pooledSynth) {
                            this._disposeSynthInternal(pooledSynth);
                            optimizationResults.poolOptimized++;
                        }
                    }
                }
            }
            
            // 3. 動的制限調整
            const limitAdjustment = this.adjustResourceLimits();
            optimizationResults.limitsAdjusted = limitAdjustment.adjusted;
            
            this.debugLogger.log('info', 'Resource allocation optimized', optimizationResults);
            
            return optimizationResults;
            
        } catch (error) {
            this.debugLogger.log('error', 'Resource optimization failed', { error: error.message });
            return {
                cleaned: 0,
                poolOptimized: 0,
                limitsAdjusted: false,
                memoryFreed: 0,
                error: error.message
            };
        }
    }
    
    // ==================== リソース制限制御ヘルパーメソッド (Phase 1.3.3) ====================
    
    /**
     * メモリ使用量取得
     * @returns {number} - メモリ使用量（MB）
     * @private
     */
    _getMemoryUsage() {
        try {
            if (typeof performance !== 'undefined' && performance.memory) {
                return Math.round(performance.memory.usedJSHeapSize / (1024 * 1024));
            }
            
            // フォールバック: 推定値
            const synthCount = this.activeSynths.size;
            const poolSize = this._getTotalPoolSize();
            return Math.round((synthCount * 2 + poolSize * 1.5) * 0.5); // 推定計算
            
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * CPU使用量取得
     * @returns {number} - CPU使用量（%推定）
     * @private
     */
    _getCpuUsage() {
        try {
            // Web環境では正確なCPU使用率は取得困難
            // Synthアクティビティベースで推定
            const synthCount = this.activeSynths.size;
            const maxSynths = this.resourceLimits.maxSynths;
            
            // アクティブSynth数に基づく推定CPU使用率
            const baseCpuUsage = (synthCount / maxSynths) * 60; // 最大60%使用と仮定
            
            // 最近のパフォーマンス履歴から補正
            const recentActivity = this._getRecentActivity();
            const activityBonus = recentActivity * 20; // 20%まで追加
            
            return Math.min(baseCpuUsage + activityBonus, 100);
            
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * 総プールサイズ取得
     * @returns {number} - 総プールサイズ
     * @private
     */
    _getTotalPoolSize() {
        try {
            let totalSize = 0;
            for (const pool of this.synthPool.values()) {
                totalSize += pool.length;
            }
            return totalSize;
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * 警告レベル判定
     * @param {Object} usageRatios - 使用率オブジェクト
     * @returns {string} - 警告レベル
     * @private
     */
    _determineWarningLevel(usageRatios) {
        try {
            const thresholds = this.performanceThresholds;
            
            // 各メトリクスでの警告レベル
            const levels = {
                synthCount: this._getThresholdLevel(usageRatios.synthCount, thresholds.synthCount),
                memory: this._getThresholdLevel(usageRatios.memory, thresholds.memory),
                cpu: this._getThresholdLevel(usageRatios.cpu, { warning: 0.7, critical: 0.85, emergency: 0.95 })
            };
            
            // 最も深刻なレベルを採用
            if (Object.values(levels).includes('emergency')) return 'emergency';
            if (Object.values(levels).includes('critical')) return 'critical';
            if (Object.values(levels).includes('warning')) return 'warning';
            
            return 'normal';
            
        } catch (error) {
            return 'normal';
        }
    }
    
    /**
     * 閾値レベル判定
     * @param {number} value - 値
     * @param {Object} thresholds - 閾値オブジェクト
     * @returns {string} - レベル
     * @private
     */
    _getThresholdLevel(value, thresholds) {
        if (value >= thresholds.emergency) return 'emergency';
        if (value >= thresholds.critical) return 'critical';
        if (value >= thresholds.warning) return 'warning';
        return 'normal';
    }
    
    /**
     * 使用量履歴更新
     * @param {Object} currentUsage - 現在の使用量
     * @private
     */
    _updateUsageHistory(currentUsage) {
        try {
            this.resourceMonitoring.usageHistory.push({
                ...currentUsage,
                timestamp: Date.now()
            });
            
            // 履歴サイズ制限（直近100件）
            if (this.resourceMonitoring.usageHistory.length > 100) {
                this.resourceMonitoring.usageHistory.shift();
            }
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to update usage history', { error: error.message });
        }
    }
    
    /**
     * リソース推奨事項取得
     * @param {Object} usageRatios - 使用率
     * @param {string} warningLevel - 警告レベル
     * @returns {Array} - 推奨事項配列
     * @private
     */
    _getResourceRecommendations(usageRatios, warningLevel) {
        try {
            const recommendations = [];
            
            if (warningLevel === 'emergency') {
                recommendations.push('Immediate action required: System at emergency levels');
                recommendations.push('Consider disposing non-critical synths');
                recommendations.push('Reduce concurrent sound count');
            } else if (warningLevel === 'critical') {
                recommendations.push('High resource usage detected');
                recommendations.push('Run resource optimization');
                recommendations.push('Consider reducing synth creation rate');
            } else if (warningLevel === 'warning') {
                if (usageRatios.synthCount > 0.7) {
                    recommendations.push('High synth count - consider cleanup');
                }
                if (usageRatios.memory > 0.7) {
                    recommendations.push('High memory usage - optimize pools');
                }
                if (usageRatios.cpu > 0.7) {
                    recommendations.push('High CPU usage - reduce complexity');
                }
            }
            
            return recommendations;
            
        } catch (error) {
            return [];
        }
    }
    
    /**
     * 使用頻度スコア取得
     * @param {SynthType} type - Synthタイプ
     * @returns {number} - 頻度スコア（0-100）
     * @private
     */
    _getFrequencyScore(type) {
        try {
            const typeStats = this.statistics[`${type}Created`] || 0;
            const totalCreated = this.statistics.synthsCreated || 1;
            
            // 頻度率を0-100スケールに変換
            const frequency = (typeStats / totalCreated) * 100;
            return Math.min(frequency * 10, 100); // 10%頻度で100スコア
            
        } catch (error) {
            return 50; // デフォルト中間スコア
        }
    }
    
    /**
     * 最近の使用スコア取得
     * @param {Object} managedSynth - 管理されたSynthオブジェクト
     * @returns {number} - 最近使用スコア（0-100）
     * @private
     */
    _getRecencyScore(managedSynth) {
        try {
            const now = Date.now();
            const lastUsed = managedSynth.lastUsed || managedSynth.createdAt;
            const timeSinceUse = now - lastUsed;
            
            // 1分以内は100、10分で0に線形減少
            const maxTime = 10 * 60 * 1000; // 10分
            const score = Math.max(0, 100 - (timeSinceUse / maxTime) * 100);
            
            return score;
            
        } catch (error) {
            return 50; // デフォルト中間スコア
        }
    }
    
    /**
     * 最近のアクティビティ取得
     * @returns {number} - アクティビティスコア（0-1）
     * @private
     */
    _getRecentActivity() {
        try {
            const recent = this.resourceMonitoring.usageHistory.slice(-5); // 直近5回
            if (recent.length < 2) return 0;
            
            // 使用量の変化率を計算
            let totalChange = 0;
            for (let i = 1; i < recent.length; i++) {
                const change = Math.abs(recent[i].synthCount - recent[i-1].synthCount);
                totalChange += change;
            }
            
            // 0-1のスコアに正規化
            return Math.min(totalChange / (recent.length * 5), 1);
            
        } catch (error) {
            return 0;
        }
    }
    
    /**
     * コンテキスト状態更新
     * @private
     */
    _updateContextState() {
        try {
            if (this.context && typeof Tone !== 'undefined') {
                this.contextState = {
                    state: this.context.state,
                    sampleRate: this.context.sampleRate,
                    currentTime: this.context.currentTime,
                    baseLatency: this.context.baseLatency || 0
                };
            } else if (typeof Tone !== 'undefined' && Tone.context) {
                // Tone.jsから状態取得
                this.contextState = {
                    state: Tone.context.state,
                    sampleRate: Tone.context.sampleRate,
                    currentTime: Tone.context.currentTime,
                    baseLatency: Tone.context.baseLatency || 0
                };
            } else {
                // フォールバック状態
                this.contextState = {
                    state: 'suspended',
                    sampleRate: 44100,
                    currentTime: 0,
                    baseLatency: 0
                };
            }
            
            this.debugLogger.log('debug', 'Context state updated', this.contextState);
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to update context state', { error: error.message });
            
            // エラー時はデフォルト状態
            this.contextState = {
                state: 'suspended',
                sampleRate: 44100,
                currentTime: 0,
                baseLatency: 0,
                error: error.message
            };
        }
    }
    
    /**
     * リソース監視開始
     * @private
     */
    _startResourceMonitoring() {
        try {
            // 既存のタイマーをクリア
            if (this.resourceMonitorTimer) {
                clearInterval(this.resourceMonitorTimer);
            }
            
            // 定期的なリソース監視開始
            this.resourceMonitorTimer = setInterval(() => {
                this._performResourceCheck();
            }, this.resourceLimits.cleanupInterval);
            
            this.debugLogger.log('success', 'Resource monitoring started', {
                interval: this.resourceLimits.cleanupInterval
            });
            
        } catch (error) {
            this.debugLogger.log('error', 'Failed to start resource monitoring', { error: error.message });
        }
    }
    
    /**
     * リソースチェック実行
     * @private
     */
    _performResourceCheck() {
        try {
            const currentStats = this.getResourceStats();
            
            // リソース使用率チェック
            const synthUsageRate = currentStats.synthCount / currentStats.maxSynths;
            
            if (synthUsageRate > 0.8) {
                this.debugLogger.log('warning', 'High synth usage detected', {
                    usage: `${Math.round(synthUsageRate * 100)}%`,
                    current: currentStats.synthCount,
                    max: currentStats.maxSynths
                });
                
                // 自動クリーンアップ実行
                this._performAutoCleanup();
            }
            
            // メモリ使用量チェック（可能な場合）
            if (typeof performance !== 'undefined' && performance.memory) {
                const memoryUsage = performance.memory.usedJSHeapSize / (1024 * 1024); // MB
                
                if (memoryUsage > 100) { // 100MB超過
                    this.debugLogger.log('warning', 'High memory usage detected', {
                        usage: `${memoryUsage.toFixed(2)}MB`
                    });
                }
            }
            
            this.debugLogger.log('debug', 'Resource check completed', currentStats);
            
        } catch (error) {
            this.debugLogger.log('error', 'Resource check failed', { error: error.message });
        }
    }
    
    /**
     * 自動クリーンアップ実行
     * @private
     */
    _performAutoCleanup() {
        try {
            this.debugLogger.log('info', 'Performing automatic cleanup...');
            
            const beforeCount = this.activeSynths.size;
            
            // 非アクティブなSynthを検索・削除
            const toRemove = [];
            for (const [synthId, synth] of this.activeSynths) {
                try {
                    // Synthが実際に使用されているかチェック
                    if (this._isSynthInactive(synth)) {
                        toRemove.push(synthId);
                    }
                } catch (error) {
                    // チェックに失敗したSynthも削除対象
                    toRemove.push(synthId);
                }
            }
            
            // 削除実行
            let cleanedCount = 0;
            for (const synthId of toRemove) {
                try {
                    const synth = this.activeSynths.get(synthId);
                    if (synth) {
                        this._disposeSynthInternal(synth);
                        this.activeSynths.delete(synthId);
                        cleanedCount++;
                    }
                } catch (error) {
                    this.debugLogger.log('warning', 'Failed to dispose synth during cleanup', {
                        synthId,
                        error: error.message
                    });
                }
            }
            
            this._updateStatistics('cleanupPerformed');
            
            this.debugLogger.log('success', 'Automatic cleanup completed', {
                before: beforeCount,
                after: this.activeSynths.size,
                cleaned: cleanedCount
            });
            
        } catch (error) {
            this.debugLogger.log('error', 'Automatic cleanup failed', { error: error.message });
        }
    }
    
    /**
     * Synthが非アクティブかチェック
     * @param {Object} synth - Synthインスタンス
     * @returns {boolean}
     * @private
     */
    _isSynthInactive(synth) {
        try {
            // Tone.jsのSynthの状態チェック
            if (synth && typeof synth.dispose === 'function') {
                // 基本的なチェック - Phase 1.3で詳細実装予定
                return false; // 保守的にfalseを返す
            }
            
            return true; // 不明なSynthは非アクティブとみなす
            
        } catch (error) {
            return true; // エラーが発生したSynthは非アクティブとみなす
        }
    }
    
    /**
     * Synth内部破棄
     * @param {Object} synth - Synthインスタンス
     * @private
     */
    _disposeSynthInternal(synth) {
        try {
            if (synth && typeof synth.dispose === 'function') {
                synth.dispose();
            }
        } catch (error) {
            this.debugLogger.log('warning', 'Synth disposal failed', { error: error.message });
        }
    }
}

// デバッグ用グローバルエクスポート
if (typeof window !== 'undefined') {
    window.AudioFoundationLayerDebug = {
        AudioFoundationLayer
    };
}

console.log('🔧 AudioFoundationLayer: 基盤レイヤークラス骨格読み込み完了');