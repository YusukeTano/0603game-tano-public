/**
 * Phase 5.5 - Edge Case Handler
 * 
 * エッジケース対応と安定性向上システム
 * - ネットワーク切断対応
 * - メモリ不足時のgraceful degradation
 * - ブラウザタブ切り替え対応
 * - 異常終了からの復旧
 * - WebAudioContext制限対応
 */

export class Phase5EdgeCaseHandler {
    constructor(game) {
        this.game = game;
        this.initialized = false;
        
        // エッジケース監視状態
        this.edgeCases = {
            // ネットワーク関連
            network: {
                isOnline: navigator.onLine,
                connectionType: null,
                lastDisconnect: null,
                reconnectAttempts: 0
            },
            
            // メモリ関連
            memory: {
                isLow: false,
                lastLowMemoryEvent: null,
                degradationLevel: 0,
                gcForced: 0
            },
            
            // ページ可視性
            visibility: {
                isVisible: !document.hidden,
                lastHidden: null,
                totalHiddenTime: 0,
                audioContextSuspended: false
            },
            
            // WebAudioContext
            audioContext: {
                state: null,
                suspendCount: 0,
                resumeAttempts: 0,
                lastError: null
            },
            
            // 異常終了検出
            crash: {
                detectionEnabled: true,
                lastHeartbeat: Date.now(),
                missedHeartbeats: 0,
                crashRecoveryData: null
            }
        };
        
        // 復旧戦略
        this.recoveryStrategies = {
            // ネットワーク復旧
            network: {
                retryAttempts: 3,
                retryDelay: 5000,
                fallbackMode: 'offline'
            },
            
            // メモリ不足対応
            memory: {
                degradationSteps: [
                    'disableNonEssentialSounds',
                    'reduceAudioQuality',
                    'limitConcurrentAudio',
                    'minimumAudioOnly'
                ],
                gcTriggerThreshold: 0.9
            },
            
            // AudioContext復旧
            audioContext: {
                resumeRetryLimit: 5,
                resumeRetryDelay: 1000,
                recreateThreshold: 3
            }
        };
        
        // イベントリスナー
        this.eventListeners = [];
        
        console.log('🛡️ Phase5EdgeCaseHandler: エッジケース対応システム作成');
    }
    
    /**
     * エッジケース対応システム初期化
     */
    async initialize() {
        try {
            console.log('🚀 Phase5EdgeCaseHandler: 初期化開始');
            
            // イベントリスナー設定
            this.setupEventListeners();
            
            // クラッシュ検出開始
            this.startCrashDetection();
            
            // 初期状態チェック
            this.performInitialChecks();
            
            this.initialized = true;
            
            console.log('✅ Phase5EdgeCaseHandler: 初期化完了');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Phase5EdgeCaseHandler: 初期化失敗', error);
            return { success: false, error };
        }
    }
    
    /**
     * イベントリスナー設定
     */
    setupEventListeners() {
        // ネットワーク状態監視
        const onlineHandler = () => this.handleNetworkChange(true);
        const offlineHandler = () => this.handleNetworkChange(false);
        window.addEventListener('online', onlineHandler);
        window.addEventListener('offline', offlineHandler);
        this.eventListeners.push(['online', onlineHandler]);
        this.eventListeners.push(['offline', offlineHandler]);
        
        // ページ可視性監視
        const visibilityHandler = () => this.handleVisibilityChange();
        document.addEventListener('visibilitychange', visibilityHandler);
        this.eventListeners.push(['visibilitychange', visibilityHandler]);
        
        // メモリ不足警告
        if ('memory' in performance) {
            // メモリ監視は定期実行で行う
        }
        
        // ページアンロード時の処理
        const beforeUnloadHandler = (e) => this.handleBeforeUnload(e);
        window.addEventListener('beforeunload', beforeUnloadHandler);
        this.eventListeners.push(['beforeunload', beforeUnloadHandler]);
        
        // エラーハンドリング
        const errorHandler = (e) => this.handleGlobalError(e);
        window.addEventListener('error', errorHandler);
        this.eventListeners.push(['error', errorHandler]);
        
        const unhandledRejectionHandler = (e) => this.handleUnhandledRejection(e);
        window.addEventListener('unhandledrejection', unhandledRejectionHandler);
        this.eventListeners.push(['unhandledrejection', unhandledRejectionHandler]);
    }
    
    /**
     * クラッシュ検出開始
     */
    startCrashDetection() {
        // ハートビート送信
        setInterval(() => {
            this.sendHeartbeat();
        }, 5000); // 5秒ごと
        
        // 復旧データ定期保存
        setInterval(() => {
            this.saveRecoveryData();
        }, 30000); // 30秒ごと
    }
    
    /**
     * 初期状態チェック
     */
    performInitialChecks() {
        // ネットワーク状態
        this.edgeCases.network.isOnline = navigator.onLine;
        if (navigator.connection) {
            this.edgeCases.network.connectionType = navigator.connection.effectiveType;
        }
        
        // ページ可視性
        this.edgeCases.visibility.isVisible = !document.hidden;
        
        // AudioContext状態
        if (this.game.audioSystem && this.game.audioSystem.audioContext) {
            this.edgeCases.audioContext.state = this.game.audioSystem.audioContext.state;
        }
        
        // 前回のクラッシュデータチェック
        this.checkForCrashRecovery();
    }
    
    /**
     * ネットワーク変更処理
     */
    handleNetworkChange(isOnline) {
        console.log(`🌐 ネットワーク状態変更: ${isOnline ? 'オンライン' : 'オフライン'}`);
        
        this.edgeCases.network.isOnline = isOnline;
        
        if (!isOnline) {
            this.edgeCases.network.lastDisconnect = Date.now();
            this.handleNetworkDisconnection();
        } else {
            this.handleNetworkReconnection();
        }
    }
    
    /**
     * ネットワーク切断処理
     */
    handleNetworkDisconnection() {
        console.warn('⚠️ ネットワーク切断検出');
        
        // オフラインモードに切り替え
        this.enableOfflineMode();
        
        // 不要な通信を停止
        this.pauseNetworkOperations();
    }
    
    /**
     * ネットワーク再接続処理
     */
    handleNetworkReconnection() {
        console.log('✅ ネットワーク再接続検出');
        
        this.edgeCases.network.reconnectAttempts++;
        
        // オンラインモードに復帰
        this.enableOnlineMode();
        
        // 通信再開
        this.resumeNetworkOperations();
    }
    
    /**
     * ページ可視性変更処理
     */
    handleVisibilityChange() {
        const isVisible = !document.hidden;
        const wasVisible = this.edgeCases.visibility.isVisible;
        
        this.edgeCases.visibility.isVisible = isVisible;
        
        if (!isVisible && wasVisible) {
            // ページが非表示になった
            this.handlePageHidden();
        } else if (isVisible && !wasVisible) {
            // ページが表示された
            this.handlePageVisible();
        }
    }
    
    /**
     * ページ非表示処理
     */
    handlePageHidden() {
        console.log('👁️ ページ非表示');
        
        this.edgeCases.visibility.lastHidden = Date.now();
        
        // AudioContextをサスペンド
        if (this.game.audioSystem && this.game.audioSystem.audioContext) {
            try {
                this.game.audioSystem.audioContext.suspend();
                this.edgeCases.visibility.audioContextSuspended = true;
            } catch (error) {
                console.warn('AudioContext suspend失敗:', error);
            }
        }
        
        // ゲームの一時停止
        if (this.game.gameState === 'playing' && !this.game.isPaused) {
            this.game.togglePause();
        }
    }
    
    /**
     * ページ表示処理
     */
    handlePageVisible() {
        console.log('👁️ ページ表示');
        
        if (this.edgeCases.visibility.lastHidden) {
            const hiddenTime = Date.now() - this.edgeCases.visibility.lastHidden;
            this.edgeCases.visibility.totalHiddenTime += hiddenTime;
        }
        
        // AudioContextを再開
        if (this.edgeCases.visibility.audioContextSuspended) {
            this.resumeAudioContext();
        }
    }
    
    /**
     * AudioContext再開
     */
    async resumeAudioContext() {
        if (!this.game.audioSystem || !this.game.audioSystem.audioContext) return;
        
        try {
            await this.game.audioSystem.audioContext.resume();
            this.edgeCases.visibility.audioContextSuspended = false;
            this.edgeCases.audioContext.resumeAttempts++;
            console.log('✅ AudioContext再開成功');
            
        } catch (error) {
            console.error('❌ AudioContext再開失敗:', error);
            this.edgeCases.audioContext.lastError = error;
            
            // 再試行または再作成
            this.retryAudioContextResume();
        }
    }
    
    /**
     * AudioContext再開再試行
     */
    async retryAudioContextResume() {
        if (this.edgeCases.audioContext.resumeAttempts >= this.recoveryStrategies.audioContext.resumeRetryLimit) {
            console.warn('⚠️ AudioContext再作成を試行');
            await this.recreateAudioContext();
            return;
        }
        
        setTimeout(() => {
            this.resumeAudioContext();
        }, this.recoveryStrategies.audioContext.resumeRetryDelay);
    }
    
    /**
     * AudioContext再作成
     */
    async recreateAudioContext() {
        try {
            if (this.game.audioSystem && this.game.audioSystem.recreateAudioContext) {
                await this.game.audioSystem.recreateAudioContext();
                console.log('✅ AudioContext再作成成功');
            }
        } catch (error) {
            console.error('❌ AudioContext再作成失敗:', error);
        }
    }
    
    /**
     * メモリ不足検出・対応
     */
    checkMemoryPressure() {
        if (!performance.memory) return false;
        
        const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
        
        if (usage > this.recoveryStrategies.memory.gcTriggerThreshold) {
            this.handleLowMemory(usage);
            return true;
        }
        
        return false;
    }
    
    /**
     * メモリ不足処理
     */
    handleLowMemory(usage) {
        console.warn(`🧠 メモリ不足検出: ${(usage * 100).toFixed(1)}%`);
        
        this.edgeCases.memory.isLow = true;
        this.edgeCases.memory.lastLowMemoryEvent = Date.now();
        
        // 段階的に機能を削減
        const step = this.edgeCases.memory.degradationLevel;
        const strategies = this.recoveryStrategies.memory.degradationSteps;
        
        if (step < strategies.length) {
            this.applyMemoryDegradationStep(strategies[step]);
            this.edgeCases.memory.degradationLevel++;
        }
        
        // 強制ガベージコレクション
        this.forceGarbageCollection();
    }
    
    /**
     * メモリ使用量削減ステップ適用
     */
    applyMemoryDegradationStep(strategy) {
        console.log(`📉 メモリ削減ステップ適用: ${strategy}`);
        
        switch (strategy) {
            case 'disableNonEssentialSounds':
                this.disableNonEssentialSounds();
                break;
            case 'reduceAudioQuality':
                this.reduceAudioQuality();
                break;
            case 'limitConcurrentAudio':
                this.limitConcurrentAudio();
                break;
            case 'minimumAudioOnly':
                this.enableMinimumAudioOnly();
                break;
        }
    }
    
    /**
     * 非必須音響無効化
     */
    disableNonEssentialSounds() {
        if (this.game.phase5Integration) {
            this.game.phase5Integration.toggleFeature('environmentSounds', false);
            this.game.phase5Integration.toggleFeature('comboSounds', false);
        }
    }
    
    /**
     * 音響品質削減
     */
    reduceAudioQuality() {
        if (this.game.audioSystem && this.game.audioSystem.setQuality) {
            this.game.audioSystem.setQuality('low');
        }
    }
    
    /**
     * 同時音響制限
     */
    limitConcurrentAudio() {
        if (this.game.audioSystem && this.game.audioSystem.setMaxConcurrentSounds) {
            this.game.audioSystem.setMaxConcurrentSounds(8);
        }
    }
    
    /**
     * 最小限音響のみ
     */
    enableMinimumAudioOnly() {
        if (this.game.phase5Integration) {
            // 全フィーチャーを無効化
            Object.keys(this.game.phase5Integration.safeIntegrationLayer.features).forEach(feature => {
                this.game.phase5Integration.toggleFeature(feature, false);
            });
        }
    }
    
    /**
     * 強制ガベージコレクション
     */
    forceGarbageCollection() {
        if (window.gc) {
            window.gc();
            this.edgeCases.memory.gcForced++;
            console.log('🗑️ 強制ガベージコレクション実行');
        }
    }
    
    /**
     * オフラインモード有効化
     */
    enableOfflineMode() {
        console.log('📱 オフラインモード有効化');
        // 実装：ネットワーク不要な機能のみ動作
    }
    
    /**
     * オンラインモード有効化
     */
    enableOnlineMode() {
        console.log('🌐 オンラインモード有効化');
        // 実装：全機能復帰
    }
    
    /**
     * ネットワーク操作一時停止
     */
    pauseNetworkOperations() {
        // 実装：ネットワーク通信の停止
    }
    
    /**
     * ネットワーク操作再開
     */
    resumeNetworkOperations() {
        // 実装：ネットワーク通信の再開
    }
    
    /**
     * グローバルエラー処理
     */
    handleGlobalError(event) {
        console.error('🚨 グローバルエラー:', event.error);
        
        // エラーログ記録
        this.logError(event.error);
        
        // 音響システム関連のエラーの場合
        if (this.isAudioRelatedError(event.error)) {
            this.handleAudioError(event.error);
        }
    }
    
    /**
     * 未処理Promise拒否処理
     */
    handleUnhandledRejection(event) {
        console.error('🚨 未処理Promise拒否:', event.reason);
        
        // エラーログ記録
        this.logError(event.reason);
        
        // AudioContext関連の場合
        if (this.isAudioContextError(event.reason)) {
            this.handleAudioContextError(event.reason);
        }
    }
    
    /**
     * 音響関連エラー判定
     */
    isAudioRelatedError(error) {
        const audioKeywords = ['audio', 'sound', 'tone', 'webaudio', 'audiocontext'];
        const errorString = error.toString().toLowerCase();
        return audioKeywords.some(keyword => errorString.includes(keyword));
    }
    
    /**
     * AudioContextエラー判定
     */
    isAudioContextError(error) {
        return error && error.toString().toLowerCase().includes('audiocontext');
    }
    
    /**
     * 音響エラー処理
     */
    handleAudioError(error) {
        console.warn('🔊 音響エラー処理:', error);
        
        // 音響システムの緊急再初期化
        if (this.game.emergencyReinitializeAudio) {
            this.game.emergencyReinitializeAudio();
        }
    }
    
    /**
     * AudioContextエラー処理
     */
    handleAudioContextError(error) {
        console.warn('🎵 AudioContextエラー処理:', error);
        
        this.edgeCases.audioContext.lastError = error;
        this.recreateAudioContext();
    }
    
    /**
     * ハートビート送信
     */
    sendHeartbeat() {
        this.edgeCases.crash.lastHeartbeat = Date.now();
        
        // ローカルストレージにハートビートを記録
        try {
            localStorage.setItem('gameHeartbeat', this.edgeCases.crash.lastHeartbeat.toString());
        } catch (error) {
            // ローカルストレージ利用不可の場合は無視
        }
    }
    
    /**
     * 復旧データ保存
     */
    saveRecoveryData() {
        const recoveryData = {
            timestamp: Date.now(),
            gameState: this.game.gameState,
            stats: this.game.stats,
            player: {
                x: this.game.player.x,
                y: this.game.player.y,
                health: this.game.player.health
            },
            audioState: this.getAudioSystemState()
        };
        
        try {
            localStorage.setItem('gameRecoveryData', JSON.stringify(recoveryData));
            this.edgeCases.crash.crashRecoveryData = recoveryData;
        } catch (error) {
            // ストレージ容量不足等の場合は無視
        }
    }
    
    /**
     * 音響システム状態取得
     */
    getAudioSystemState() {
        if (!this.game.audioSystem) return null;
        
        return {
            initialized: !!this.game.audioSystem,
            contextState: this.game.audioSystem.audioContext?.state,
            volume: this.game.audioSystem.masterVolume || 1.0
        };
    }
    
    /**
     * クラッシュ復旧チェック
     */
    checkForCrashRecovery() {
        try {
            const lastHeartbeat = localStorage.getItem('gameHeartbeat');
            const recoveryData = localStorage.getItem('gameRecoveryData');
            
            if (lastHeartbeat && recoveryData) {
                const timeSinceHeartbeat = Date.now() - parseInt(lastHeartbeat);
                
                // 最後のハートビートから5分以上経過している場合はクラッシュと判定
                if (timeSinceHeartbeat > 300000) {
                    console.warn('🚨 前回セッションのクラッシュを検出');
                    this.offerCrashRecovery(JSON.parse(recoveryData));
                }
            }
        } catch (error) {
            // 復旧データが破損している場合は無視
        }
    }
    
    /**
     * クラッシュ復旧提案
     */
    offerCrashRecovery(recoveryData) {
        // ユーザーに復旧を提案（実装は要UI）
        console.log('🔄 クラッシュ復旧データ利用可能:', recoveryData);
    }
    
    /**
     * ページアンロード前処理
     */
    handleBeforeUnload(event) {
        // 最終状態保存
        this.saveRecoveryData();
        
        // 音響システムのクリーンアップ
        if (this.game.audioSystem && this.game.audioSystem.dispose) {
            this.game.audioSystem.dispose();
        }
    }
    
    /**
     * エラーログ記録
     */
    logError(error) {
        const errorLog = {
            timestamp: Date.now(),
            message: error.message || error.toString(),
            stack: error.stack,
            userAgent: navigator.userAgent,
            gameState: this.game.gameState
        };
        
        // エラーログをローカルストレージに保存
        try {
            const existingLogs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            existingLogs.push(errorLog);
            
            // 最新100件のみ保持
            if (existingLogs.length > 100) {
                existingLogs.splice(0, existingLogs.length - 100);
            }
            
            localStorage.setItem('errorLogs', JSON.stringify(existingLogs));
        } catch (e) {
            // ストレージエラーは無視
        }
    }
    
    /**
     * エッジケースレポート取得
     */
    getEdgeCaseReport() {
        return {
            edgeCases: this.edgeCases,
            recoveryStrategies: this.recoveryStrategies,
            systemHealth: {
                memoryPressure: this.checkMemoryPressure(),
                networkStatus: this.edgeCases.network.isOnline ? 'online' : 'offline',
                pageVisibility: this.edgeCases.visibility.isVisible ? 'visible' : 'hidden',
                audioContextState: this.edgeCases.audioContext.state
            }
        };
    }
    
    /**
     * 更新処理
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        // 定期的なヘルスチェック
        this.performHealthCheck();
    }
    
    /**
     * ヘルスチェック実行
     */
    performHealthCheck() {
        // メモリ圧迫チェック
        this.checkMemoryPressure();
        
        // AudioContext状態チェック
        if (this.game.audioSystem && this.game.audioSystem.audioContext) {
            const currentState = this.game.audioSystem.audioContext.state;
            if (currentState !== this.edgeCases.audioContext.state) {
                this.edgeCases.audioContext.state = currentState;
                console.log(`🎵 AudioContext状態変更: ${currentState}`);
            }
        }
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        console.log('🧹 Phase5EdgeCaseHandler: クリーンアップ');
        
        // イベントリスナー削除
        this.eventListeners.forEach(([event, handler]) => {
            if (event === 'visibilitychange') {
                document.removeEventListener(event, handler);
            } else {
                window.removeEventListener(event, handler);
            }
        });
        
        this.initialized = false;
    }
}