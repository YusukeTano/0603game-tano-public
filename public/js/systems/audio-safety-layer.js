/**
 * AudioSafetyLayer - Phase 1.2.3 安全性レイヤー
 * 
 * 🎯 目的: エラーハンドリング・フォールバック・システム保護
 * 📐 設計: Circuit Breaker・Graceful Degradation・監視機能
 * 🛡️ Phase 1: Foundation層安全性確保
 */

export class AudioSafetyLayer {
    constructor() {
        // 安全性設定
        this.config = {
            circuitBreakerThreshold: 5,      // 5回エラーでサーキットブレーカー開放
            circuitBreakerTimeout: 30000,    // 30秒後にリセット試行
            maxRetryAttempts: 3,             // 最大再試行回数
            gracefulDegradationLevel: 0,     // 0: 通常, 1: 軽減, 2: 最小, 3: 無音
            healthCheckInterval: 10000       // 10秒間隔でヘルスチェック
        };
        
        // Circuit Breaker状態
        this.circuitBreaker = {
            isOpen: false,
            failureCount: 0,
            lastFailureTime: null,
            nextRetryTime: null
        };
        
        // フォールバック階層
        this.fallbackLevels = {
            0: { name: 'normal', description: '通常動作' },
            1: { name: 'reduced', description: '軽減動作（エフェクト削減）' },
            2: { name: 'minimal', description: '最小動作（基本音響のみ）' },
            3: { name: 'silent', description: '無音モード（ゲーム継続）' }
        };
        
        // エラー追跡
        this.errorHistory = [];
        this.maxErrorHistory = 50;
        
        // パフォーマンス監視
        this.performanceMetrics = {
            operationLatency: [],
            memoryUsage: [],
            errorRate: 0,
            lastHealthCheck: null,
            systemHealth: 'healthy' // healthy, degraded, critical, failed
        };
        
        // ヘルスチェックタイマー
        this.healthCheckTimer = null;
        
        // フォールバック実装
        this.fallbackImplementations = {
            playSound: this.createFallbackPlaySound(),
            stopSound: this.createFallbackStopSound(),
            setVolume: this.createFallbackSetVolume()
        };
        
        console.log('🛡️ AudioSafetyLayer: Phase 1.2.3 安全性レイヤー初期化');
        this.startHealthMonitoring();
    }
    
    /**
     * 安全な操作実行（Circuit Breaker付き）
     */
    async safeExecute(operation, fallbackOperation = null, ...args) {
        // Circuit Breaker チェック
        if (this.circuitBreaker.isOpen) {
            if (Date.now() > this.circuitBreaker.nextRetryTime) {
                // 半開状態に移行
                console.log('🔄 SafetyLayer: Circuit Breaker 半開状態でリトライ');
                this.circuitBreaker.isOpen = false;
            } else {
                // フォールバック実行
                console.warn('⚠️ SafetyLayer: Circuit Breaker開放中、フォールバック実行');
                return this.executeFallback(fallbackOperation, ...args);
            }
        }
        
        const startTime = performance.now();
        let attempt = 0;
        
        while (attempt < this.config.maxRetryAttempts) {
            try {
                // 操作実行
                const result = await operation(...args);
                
                // 成功時の処理
                this.recordSuccess(performance.now() - startTime);
                return result;
                
            } catch (error) {
                attempt++;
                this.recordError(error, operation.name, attempt);
                
                if (attempt >= this.config.maxRetryAttempts) {
                    // 最大再試行回数到達
                    this.handleOperationFailure(error);
                    return this.executeFallback(fallbackOperation, ...args);
                }
                
                // 再試行前の短い待機
                await this.waitForRetry(attempt);
            }
        }
    }
    
    /**
     * フォールバック実行
     */
    async executeFallback(fallbackOperation, ...args) {
        try {
            if (typeof fallbackOperation === 'function') {
                return await fallbackOperation(...args);
            } else if (typeof fallbackOperation === 'string' && this.fallbackImplementations[fallbackOperation]) {
                return await this.fallbackImplementations[fallbackOperation](...args);
            } else {
                // デフォルトフォールバック
                return this.createDefaultFallback()(...args);
            }
        } catch (fallbackError) {
            console.error('❌ SafetyLayer: フォールバック実行失敗:', fallbackError);
            this.degradeSystem();
            return { success: false, fallback: true, error: fallbackError.message };
        }
    }
    
    /**
     * システム劣化（Graceful Degradation）
     */
    degradeSystem() {
        if (this.config.gracefulDegradationLevel < 3) {
            this.config.gracefulDegradationLevel++;
            const level = this.fallbackLevels[this.config.gracefulDegradationLevel];
            
            console.warn(`⬇️ SafetyLayer: システム劣化 → Level ${this.config.gracefulDegradationLevel} (${level.description})`);
            
            // システム状態更新
            this.updateSystemHealth();
            
            // 劣化通知
            this.notifyDegradation(level);
        }
    }
    
    /**
     * エラー記録
     */
    recordError(error, operationName, attempt) {
        const errorRecord = {
            timestamp: Date.now(),
            operation: operationName,
            attempt,
            message: error.message,
            stack: error.stack,
            degradationLevel: this.config.gracefulDegradationLevel
        };
        
        this.errorHistory.push(errorRecord);
        
        // 履歴サイズ制限
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory.shift();
        }
        
        // Circuit Breaker更新
        this.circuitBreaker.failureCount++;
        this.circuitBreaker.lastFailureTime = Date.now();
        
        if (this.circuitBreaker.failureCount >= this.config.circuitBreakerThreshold) {
            this.openCircuitBreaker();
        }
        
        this.updateErrorRate();
    }
    
    /**
     * 成功記録
     */
    recordSuccess(latency) {
        // Circuit Breaker リセット
        this.circuitBreaker.failureCount = 0;
        
        // レイテンシ記録
        this.performanceMetrics.operationLatency.push(latency);
        if (this.performanceMetrics.operationLatency.length > 100) {
            this.performanceMetrics.operationLatency.shift();
        }
        
        this.updateErrorRate();
    }
    
    /**
     * Circuit Breaker開放
     */
    openCircuitBreaker() {
        this.circuitBreaker.isOpen = true;
        this.circuitBreaker.nextRetryTime = Date.now() + this.config.circuitBreakerTimeout;
        
        console.warn('🚨 SafetyLayer: Circuit Breaker開放');
        this.degradeSystem();
    }
    
    /**
     * 操作失敗処理
     */
    handleOperationFailure(error) {
        console.error('❌ SafetyLayer: 操作最終失敗:', error);
        
        // クリティカルエラーチェック
        if (this.isCriticalError(error)) {
            this.handleCriticalError(error);
        }
    }
    
    /**
     * クリティカルエラー判定
     */
    isCriticalError(error) {
        const criticalPatterns = [
            /out of memory/i,
            /audiocontext/i,
            /tone.*not.*defined/i,
            /webaudio.*not.*supported/i
        ];
        
        return criticalPatterns.some(pattern => pattern.test(error.message));
    }
    
    /**
     * クリティカルエラー処理
     */
    handleCriticalError(error) {
        console.error('🚨 SafetyLayer: クリティカルエラー検出:', error);
        
        // 最大劣化レベルに設定
        this.config.gracefulDegradationLevel = 3;
        this.performanceMetrics.systemHealth = 'failed';
        
        // 緊急停止処理
        this.emergencyShutdown();
    }
    
    /**
     * 緊急停止
     */
    emergencyShutdown() {
        console.warn('🚨 SafetyLayer: 緊急停止実行');
        
        try {
            // 全音響処理を無音モードに
            this.config.gracefulDegradationLevel = 3;
            
            // Circuit Breaker強制開放
            this.circuitBreaker.isOpen = true;
            this.circuitBreaker.nextRetryTime = Date.now() + (this.config.circuitBreakerTimeout * 5);
            
            // ヘルスチェック停止
            if (this.healthCheckTimer) {
                clearInterval(this.healthCheckTimer);
            }
            
        } catch (shutdownError) {
            console.error('❌ SafetyLayer: 緊急停止処理エラー:', shutdownError);
        }
    }
    
    /**
     * ヘルスモニタリング開始
     */
    startHealthMonitoring() {
        this.healthCheckTimer = setInterval(() => {
            this.performHealthCheck();
        }, this.config.healthCheckInterval);
    }
    
    /**
     * ヘルスチェック実行
     */
    performHealthCheck() {
        try {
            const metrics = this.calculateHealthMetrics();
            this.performanceMetrics.lastHealthCheck = Date.now();
            
            // システム健康状態判定
            const previousHealth = this.performanceMetrics.systemHealth;
            this.performanceMetrics.systemHealth = this.determineSystemHealth(metrics);
            
            // 状態変化時のログ
            if (previousHealth !== this.performanceMetrics.systemHealth) {
                console.log(`💊 SafetyLayer: システム健康状態変化: ${previousHealth} → ${this.performanceMetrics.systemHealth}`);
            }
            
            // 自動回復チェック
            this.checkAutoRecovery(metrics);
            
        } catch (error) {
            console.error('❌ SafetyLayer: ヘルスチェックエラー:', error);
        }
    }
    
    /**
     * 健康指標計算
     */
    calculateHealthMetrics() {
        const recentErrors = this.errorHistory.filter(e => 
            Date.now() - e.timestamp < 60000 // 過去1分間
        );
        
        const avgLatency = this.performanceMetrics.operationLatency.length > 0 ?
            this.performanceMetrics.operationLatency.reduce((a, b) => a + b, 0) / this.performanceMetrics.operationLatency.length : 0;
        
        return {
            errorRate: this.performanceMetrics.errorRate,
            recentErrorCount: recentErrors.length,
            averageLatency: avgLatency,
            circuitBreakerStatus: this.circuitBreaker.isOpen ? 'open' : 'closed',
            degradationLevel: this.config.gracefulDegradationLevel
        };
    }
    
    /**
     * システム健康状態判定
     */
    determineSystemHealth(metrics) {
        if (metrics.degradationLevel >= 3 || metrics.recentErrorCount > 10) {
            return 'failed';
        } else if (metrics.degradationLevel >= 2 || metrics.errorRate > 20 || metrics.circuitBreakerStatus === 'open') {
            return 'critical';
        } else if (metrics.degradationLevel >= 1 || metrics.errorRate > 5 || metrics.averageLatency > 100) {
            return 'degraded';
        } else {
            return 'healthy';
        }
    }
    
    /**
     * 自動回復チェック
     */
    checkAutoRecovery(metrics) {
        if (this.config.gracefulDegradationLevel > 0 && 
            metrics.errorRate < 2 && 
            metrics.recentErrorCount === 0 &&
            !this.circuitBreaker.isOpen) {
            
            // 段階的回復
            this.config.gracefulDegradationLevel--;
            const level = this.fallbackLevels[this.config.gracefulDegradationLevel];
            
            console.log(`⬆️ SafetyLayer: システム回復 → Level ${this.config.gracefulDegradationLevel} (${level.description})`);
        }
    }
    
    /**
     * エラー率更新
     */
    updateErrorRate() {
        const recentOperations = this.errorHistory.filter(e => 
            Date.now() - e.timestamp < 60000
        );
        
        const totalOperations = this.performanceMetrics.operationLatency.length + recentOperations.length;
        this.performanceMetrics.errorRate = totalOperations > 0 ? 
            (recentOperations.length / totalOperations * 100) : 0;
    }
    
    /**
     * システム状態更新
     */
    updateSystemHealth() {
        const metrics = this.calculateHealthMetrics();
        this.performanceMetrics.systemHealth = this.determineSystemHealth(metrics);
    }
    
    /**
     * 劣化通知
     */
    notifyDegradation(level) {
        // 将来的にはUI通知やイベント発生に使用
        console.log(`📢 SafetyLayer: システム劣化通知 - ${level.description}`);
    }
    
    /**
     * 再試行待機
     */
    async waitForRetry(attempt) {
        const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000); // 指数バックオフ（最大1秒）
        await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    /**
     * フォールバック実装作成
     */
    createFallbackPlaySound() {
        return (...args) => {
            console.log('🔇 SafetyLayer: 音響再生フォールバック（無音）');
            return { success: true, fallback: true, silent: true };
        };
    }
    
    createFallbackStopSound() {
        return (...args) => {
            console.log('🔇 SafetyLayer: 音響停止フォールバック（無音）');
            return { success: true, fallback: true, silent: true };
        };
    }
    
    createFallbackSetVolume() {
        return (...args) => {
            console.log('🔇 SafetyLayer: 音量設定フォールバック（無音）');
            return { success: true, fallback: true, silent: true };
        };
    }
    
    createDefaultFallback() {
        return (...args) => {
            console.log('🔇 SafetyLayer: デフォルトフォールバック（無音）');
            return { success: true, fallback: true, silent: true };
        };
    }
    
    /**
     * システム状態取得（テスト・デバッグ用）
     */
    getSystemStatus() {
        return {
            circuitBreaker: { ...this.circuitBreaker },
            degradationLevel: this.config.gracefulDegradationLevel,
            fallbackLevel: this.fallbackLevels[this.config.gracefulDegradationLevel],
            systemHealth: this.performanceMetrics.systemHealth,
            errorRate: this.performanceMetrics.errorRate,
            metrics: {
                averageLatency: this.performanceMetrics.operationLatency.length > 0 ?
                    this.performanceMetrics.operationLatency.reduce((a, b) => a + b, 0) / this.performanceMetrics.operationLatency.length : 0,
                recentErrors: this.errorHistory.filter(e => Date.now() - e.timestamp < 60000).length,
                totalErrors: this.errorHistory.length
            }
        };
    }
    
    /**
     * 安全性レイヤー破棄
     */
    dispose() {
        console.log('🛡️ SafetyLayer: 破棄開始');
        
        if (this.healthCheckTimer) {
            clearInterval(this.healthCheckTimer);
            this.healthCheckTimer = null;
        }
        
        this.errorHistory = [];
        this.performanceMetrics.operationLatency = [];
        
        console.log('✅ SafetyLayer: 破棄完了');
    }
}

// グローバル対応
if (typeof window !== 'undefined') {
    window.AudioSafetyLayer = AudioSafetyLayer;
}