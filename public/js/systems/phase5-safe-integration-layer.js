/**
 * Phase 5.2 - Safe Integration Layer
 * 
 * 安全統合レイヤー：既存システムを保護しながら新機能を段階的に統合
 * - エラー封じ込め
 * - パフォーマンス監視
 * - ロールバック機能
 * - フィーチャーフラグ制御
 */

export class Phase5SafeIntegrationLayer {
    constructor(game) {
        this.game = game;
        this.initialized = false;
        
        // 統合状態管理
        this.integrationState = {
            phase: '5.2',
            status: 'initializing',
            startTime: Date.now(),
            errors: [],
            warnings: [],
            metrics: {
                audioCallsCount: 0,
                errorCount: 0,
                recoveryCount: 0,
                performanceWarnings: 0
            }
        };
        
        // フィーチャーフラグ（段階的有効化）
        this.features = {
            // 基本統合
            pickupSounds: false,      // アイテム取得音
            levelUpSounds: false,     // レベルアップ音
            comboSounds: false,       // コンボ音響
            environmentSounds: false, // 環境音
            marioGameSounds: false,   // マリオミニゲーム音響
            
            // 高度な機能
            adaptivePerformance: false, // 適応的パフォーマンス調整
            memoryManagement: false,    // メモリ管理最適化
            edgeCaseHandling: false,    // エッジケース対応
            advancedDiagnostics: false  // 高度な診断機能
        };
        
        // パフォーマンス監視
        this.performanceMonitor = {
            frameTimeHistory: [],
            audioLatencyHistory: [],
            memoryUsageHistory: [],
            lastCheck: Date.now(),
            thresholds: {
                frameTime: 33,        // 30fps threshold
                audioLatency: 50,     // 50ms threshold
                memoryUsage: 0.8      // 80% threshold
            }
        };
        
        // セーフティネット設定
        this.safetyConfig = {
            maxErrorsPerMinute: 10,
            maxRecoveryAttempts: 3,
            rollbackThreshold: 5,
            performanceCheckInterval: 1000 // 1秒ごと
        };
        
        // ロールバック用のバックアップ
        this.systemBackup = null;
        
        console.log('🛡️ Phase5SafeIntegrationLayer: 安全統合レイヤー作成');
    }
    
    /**
     * 安全統合レイヤー初期化
     */
    async initialize() {
        try {
            console.log('🚀 Phase5SafeIntegrationLayer: 初期化開始');
            
            // システムバックアップ作成
            this.createSystemBackup();
            
            // パフォーマンス監視開始
            this.startPerformanceMonitoring();
            
            // 基本的な検証
            const validation = this.validateEnvironment();
            if (!validation.success) {
                throw new Error(`環境検証失敗: ${validation.message}`);
            }
            
            this.initialized = true;
            this.integrationState.status = 'ready';
            
            console.log('✅ Phase5SafeIntegrationLayer: 初期化完了');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Phase5SafeIntegrationLayer: 初期化失敗', error);
            this.integrationState.errors.push({
                timestamp: Date.now(),
                error: error.message,
                stack: error.stack
            });
            return { success: false, error };
        }
    }
    
    /**
     * システムバックアップ作成
     */
    createSystemBackup() {
        this.systemBackup = {
            audioSystem: this.game.audioSystem,
            phase3Manager: this.game.phase3Manager,
            timestamp: Date.now()
        };
        console.log('💾 システムバックアップ作成完了');
    }
    
    /**
     * 環境検証
     */
    validateEnvironment() {
        const checks = {
            audioSystemExists: !!this.game.audioSystem,
            phase3ManagerExists: !!this.game.phase3Manager,
            requiredMethodsExist: this.checkRequiredMethods(),
            memoryAvailable: this.checkMemoryAvailability()
        };
        
        const allPassed = Object.values(checks).every(check => check === true);
        
        return {
            success: allPassed,
            checks,
            message: allPassed ? '環境検証成功' : '環境検証失敗'
        };
    }
    
    /**
     * 必須メソッドの存在確認
     */
    checkRequiredMethods() {
        const requiredMethods = [
            'audioSystem.playSound',
            'audioSystem.update',
            'phase3Manager.updateAllSystems'
        ];
        
        return requiredMethods.every(path => {
            const parts = path.split('.');
            let obj = this.game;
            
            for (const part of parts) {
                if (!obj || typeof obj[part] === 'undefined') {
                    return false;
                }
                obj = obj[part];
            }
            
            return typeof obj === 'function';
        });
    }
    
    /**
     * メモリ使用可能性チェック
     */
    checkMemoryAvailability() {
        if (performance.memory) {
            const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            return usage < this.safetyConfig.performanceCheckInterval;
        }
        return true; // メモリAPIが利用できない場合は通過
    }
    
    /**
     * パフォーマンス監視開始
     */
    startPerformanceMonitoring() {
        // 定期的なパフォーマンスチェック
        setInterval(() => {
            this.checkPerformance();
        }, this.safetyConfig.performanceCheckInterval);
    }
    
    /**
     * パフォーマンスチェック
     */
    checkPerformance() {
        const now = Date.now();
        const deltaTime = now - this.performanceMonitor.lastCheck;
        
        // フレームタイム記録
        this.performanceMonitor.frameTimeHistory.push(deltaTime);
        if (this.performanceMonitor.frameTimeHistory.length > 60) {
            this.performanceMonitor.frameTimeHistory.shift();
        }
        
        // メモリ使用率記録
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            this.performanceMonitor.memoryUsageHistory.push(memoryUsage);
            if (this.performanceMonitor.memoryUsageHistory.length > 60) {
                this.performanceMonitor.memoryUsageHistory.shift();
            }
            
            // メモリ警告
            if (memoryUsage > this.performanceMonitor.thresholds.memoryUsage) {
                this.handlePerformanceWarning('memory', memoryUsage);
            }
        }
        
        this.performanceMonitor.lastCheck = now;
    }
    
    /**
     * パフォーマンス警告処理
     */
    handlePerformanceWarning(type, value) {
        this.integrationState.metrics.performanceWarnings++;
        this.integrationState.warnings.push({
            timestamp: Date.now(),
            type,
            value,
            message: `Performance warning: ${type} = ${value}`
        });
        
        // 適応的パフォーマンス調整が有効な場合
        if (this.features.adaptivePerformance) {
            this.adjustPerformanceSettings(type);
        }
    }
    
    /**
     * パフォーマンス設定調整
     */
    adjustPerformanceSettings(warningType) {
        console.warn(`⚡ パフォーマンス調整: ${warningType}`);
        
        // 音響品質を下げるなどの調整
        if (warningType === 'memory') {
            // メモリ警告時の対応
            this.reduceSoundQuality();
        }
    }
    
    /**
     * 音響品質削減
     */
    reduceSoundQuality() {
        // 実装予定：音響品質の動的調整
        console.log('📉 音響品質を一時的に削減');
    }
    
    /**
     * 安全な音響呼び出し（エラー封じ込め付き）
     */
    safeAudioCall(method, ...args) {
        try {
            this.integrationState.metrics.audioCallsCount++;
            
            // 音響システムの存在確認
            if (!this.game.audioSystem) {
                throw new Error('AudioSystem not available');
            }
            
            // メソッドの存在確認
            if (typeof this.game.audioSystem[method] !== 'function') {
                throw new Error(`Method ${method} not found in AudioSystem`);
            }
            
            // 実行
            const result = this.game.audioSystem[method](...args);
            
            return result;
            
        } catch (error) {
            this.handleAudioError(error, method, args);
            return null;
        }
    }
    
    /**
     * 音響エラー処理
     */
    handleAudioError(error, method, args) {
        this.integrationState.metrics.errorCount++;
        this.integrationState.errors.push({
            timestamp: Date.now(),
            method,
            args,
            error: error.message,
            stack: error.stack
        });
        
        console.error(`🔊 音響エラー [${method}]:`, error);
        
        // エラー率チェック
        if (this.shouldTriggerRollback()) {
            this.performRollback();
        }
    }
    
    /**
     * ロールバック判定
     */
    shouldTriggerRollback() {
        const recentErrors = this.integrationState.errors.filter(
            e => Date.now() - e.timestamp < 60000 // 1分以内
        );
        
        return recentErrors.length >= this.safetyConfig.rollbackThreshold;
    }
    
    /**
     * システムロールバック
     */
    performRollback() {
        console.warn('⚠️ Phase5: システムロールバック実行');
        
        if (this.systemBackup) {
            this.game.audioSystem = this.systemBackup.audioSystem;
            this.game.phase3Manager = this.systemBackup.phase3Manager;
            
            // 全機能を無効化
            Object.keys(this.features).forEach(feature => {
                this.features[feature] = false;
            });
            
            this.integrationState.status = 'rolledback';
            
            console.log('✅ ロールバック完了');
        }
    }
    
    /**
     * フィーチャー有効化
     */
    enableFeature(featureName) {
        if (this.features.hasOwnProperty(featureName)) {
            console.log(`🎯 Phase5: フィーチャー有効化 - ${featureName}`);
            this.features[featureName] = true;
            return true;
        }
        return false;
    }
    
    /**
     * フィーチャー無効化
     */
    disableFeature(featureName) {
        if (this.features.hasOwnProperty(featureName)) {
            console.log(`🚫 Phase5: フィーチャー無効化 - ${featureName}`);
            this.features[featureName] = false;
            return true;
        }
        return false;
    }
    
    /**
     * 統合状態レポート取得
     */
    getIntegrationReport() {
        const uptime = Date.now() - this.integrationState.startTime;
        const errorRate = this.integrationState.metrics.errorCount / 
                         Math.max(1, this.integrationState.metrics.audioCallsCount);
        
        return {
            phase: this.integrationState.phase,
            status: this.integrationState.status,
            uptime: Math.floor(uptime / 1000) + 's',
            features: this.features,
            metrics: {
                ...this.integrationState.metrics,
                errorRate: (errorRate * 100).toFixed(2) + '%'
            },
            recentErrors: this.integrationState.errors.slice(-5),
            recentWarnings: this.integrationState.warnings.slice(-5),
            performance: {
                avgFrameTime: this.calculateAverage(this.performanceMonitor.frameTimeHistory),
                avgMemoryUsage: this.calculateAverage(this.performanceMonitor.memoryUsageHistory)
            }
        };
    }
    
    /**
     * 平均値計算
     */
    calculateAverage(array) {
        if (array.length === 0) return 0;
        const sum = array.reduce((a, b) => a + b, 0);
        return (sum / array.length).toFixed(2);
    }
    
    /**
     * 統合レイヤー更新
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        // パフォーマンス監視は自動実行
        
        // フィーチャー別の更新処理
        // （将来的に各フィーチャーの更新ロジックを追加）
    }
    
    /**
     * リソースクリーンアップ
     */
    dispose() {
        console.log('🧹 Phase5SafeIntegrationLayer: クリーンアップ');
        
        // タイマーのクリア等
        
        this.initialized = false;
        this.integrationState.status = 'disposed';
    }
}