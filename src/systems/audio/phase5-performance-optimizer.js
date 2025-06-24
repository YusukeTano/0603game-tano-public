/**
 * Phase 5.4 - Performance Optimizer
 * 
 * パフォーマンス最適化と監視システム
 * - メモリ管理最適化
 * - CPU使用率監視
 * - 音響品質の動的調整
 * - リソース管理
 */

export class Phase5PerformanceOptimizer {
    constructor(game) {
        this.game = game;
        this.initialized = false;
        
        // パフォーマンス監視データ
        this.metrics = {
            // フレーム関連
            frameTime: {
                current: 0,
                average: 0,
                history: [],
                historySize: 60
            },
            
            // メモリ関連
            memory: {
                used: 0,
                limit: 0,
                percentage: 0,
                history: [],
                historySize: 30
            },
            
            // 音響関連
            audio: {
                activeChannels: 0,
                totalSounds: 0,
                averageLatency: 0,
                droppedSounds: 0
            },
            
            // システム関連
            system: {
                cpuUsage: 0,
                batteryLevel: 100,
                thermalState: 'normal',
                networkLatency: 0
            }
        };
        
        // パフォーマンス設定
        this.settings = {
            // しきい値
            thresholds: {
                frameTime: 33,      // 30fps以下で警告
                memoryUsage: 0.85,  // 85%以上で警告
                audioLatency: 50,   // 50ms以上で警告
                cpuUsage: 0.8       // 80%以上で警告
            },
            
            // 最適化レベル
            optimizationLevel: 'normal', // low, normal, high, extreme
            
            // 自動調整設定
            autoAdjust: {
                enabled: true,
                audioQuality: true,
                effectsCount: true,
                renderQuality: false // 音響以外は無効
            }
        };
        
        // 最適化アクション
        this.optimizations = {
            applied: [],
            available: [
                'reduceAudioChannels',
                'lowerAudioQuality',
                'limitConcurrentSounds',
                'reduceBGMQuality',
                'disableReverbEffects',
                'reducePolyphony'
            ]
        };
        
        // 監視タイマー
        this.monitoringInterval = null;
        this.monitoringFrequency = 1000; // 1秒ごと
        
        console.log('⚡ Phase5PerformanceOptimizer: パフォーマンス監視システム作成');
    }
    
    /**
     * パフォーマンス最適化システム初期化
     */
    async initialize() {
        try {
            console.log('🚀 Phase5PerformanceOptimizer: 初期化開始');
            
            // 基本パフォーマンス情報取得
            this.detectDeviceCapabilities();
            
            // 監視開始
            this.startMonitoring();
            
            // 初期最適化設定
            this.applyInitialOptimizations();
            
            this.initialized = true;
            
            console.log('✅ Phase5PerformanceOptimizer: 初期化完了');
            return { success: true };
            
        } catch (error) {
            console.error('❌ Phase5PerformanceOptimizer: 初期化失敗', error);
            return { success: false, error };
        }
    }
    
    /**
     * デバイス性能検出
     */
    detectDeviceCapabilities() {
        // メモリ情報
        if (performance.memory) {
            this.metrics.memory.limit = performance.memory.jsHeapSizeLimit;
            this.metrics.memory.used = performance.memory.usedJSHeapSize;
            this.metrics.memory.percentage = this.metrics.memory.used / this.metrics.memory.limit;
        }
        
        // CPU コア数
        const cpuCores = navigator.hardwareConcurrency || 4;
        
        // デバイスタイプ推定
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const isLowEnd = cpuCores <= 2 || (performance.memory && performance.memory.jsHeapSizeLimit < 1073741824); // 1GB以下
        
        // 最適化レベル自動設定
        if (isLowEnd) {
            this.settings.optimizationLevel = 'high';
            this.settings.autoAdjust.audioQuality = true;
            this.settings.autoAdjust.effectsCount = true;
        } else if (isMobile) {
            this.settings.optimizationLevel = 'normal';
        } else {
            this.settings.optimizationLevel = 'low';
        }
        
        console.log('📱 デバイス検出:', {
            isMobile,
            isLowEnd,
            cpuCores,
            memoryLimit: Math.round((this.metrics.memory.limit || 0) / 1024 / 1024) + 'MB',
            optimizationLevel: this.settings.optimizationLevel
        });
    }
    
    /**
     * パフォーマンス監視開始
     */
    startMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.analyzePerformance();
            this.applyAutoOptimization();
        }, this.monitoringFrequency);
        
        console.log('📊 パフォーマンス監視開始');
    }
    
    /**
     * メトリクス収集
     */
    collectMetrics() {
        const now = performance.now();
        
        // フレームタイム計算
        if (this.lastFrameTime) {
            const frameTime = now - this.lastFrameTime;
            this.updateMetricHistory(this.metrics.frameTime, frameTime);
        }
        this.lastFrameTime = now;
        
        // メモリ使用量
        if (performance.memory) {
            const memoryUsage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
            this.updateMetricHistory(this.metrics.memory, memoryUsage);
        }
        
        // 音響システムメトリクス
        this.collectAudioMetrics();
        
        // システムメトリクス
        this.collectSystemMetrics();
    }
    
    /**
     * メトリクス履歴更新
     */
    updateMetricHistory(metric, value) {
        metric.current = value;
        metric.history.push(value);
        
        if (metric.history.length > metric.historySize) {
            metric.history.shift();
        }
        
        // 平均値計算
        metric.average = metric.history.reduce((a, b) => a + b, 0) / metric.history.length;
    }
    
    /**
     * 音響メトリクス収集
     */
    collectAudioMetrics() {
        try {
            if (this.game.audioSystem && this.game.audioSystem.getMetrics) {
                const audioMetrics = this.game.audioSystem.getMetrics();
                this.metrics.audio = {
                    ...this.metrics.audio,
                    ...audioMetrics
                };
            }
            
            // Phase 5統合システムからのメトリクス
            if (this.game.phase5Integration) {
                const integrationReport = this.game.phase5Integration.getIntegrationReport();
                if (integrationReport.metrics) {
                    this.metrics.audio.totalSounds = integrationReport.metrics.audioCallsCount || 0;
                }
            }
            
        } catch (error) {
            console.warn('音響メトリクス収集エラー:', error);
        }
    }
    
    /**
     * システムメトリクス収集
     */
    collectSystemMetrics() {
        try {
            // バッテリー情報（サポートされている場合）
            if (navigator.getBattery) {
                navigator.getBattery().then(battery => {
                    this.metrics.system.batteryLevel = battery.level * 100;
                }).catch(() => {});
            }
            
            // 接続情報
            if (navigator.connection) {
                this.metrics.system.networkLatency = navigator.connection.rtt || 0;
            }
            
        } catch (error) {
            // システムメトリクスはオプション
        }
    }
    
    /**
     * パフォーマンス分析
     */
    analyzePerformance() {
        const issues = [];
        
        // フレームレート問題
        if (this.metrics.frameTime.average > this.settings.thresholds.frameTime) {
            issues.push({
                type: 'framerate',
                severity: 'high',
                value: this.metrics.frameTime.average,
                threshold: this.settings.thresholds.frameTime
            });
        }
        
        // メモリ問題
        if (this.metrics.memory.percentage > this.settings.thresholds.memoryUsage) {
            issues.push({
                type: 'memory',
                severity: 'medium',
                value: this.metrics.memory.percentage,
                threshold: this.settings.thresholds.memoryUsage
            });
        }
        
        // 音響レイテンシ問題
        if (this.metrics.audio.averageLatency > this.settings.thresholds.audioLatency) {
            issues.push({
                type: 'audioLatency',
                severity: 'medium',
                value: this.metrics.audio.averageLatency,
                threshold: this.settings.thresholds.audioLatency
            });
        }
        
        // 問題があれば警告
        if (issues.length > 0) {
            console.warn('⚠️ パフォーマンス問題検出:', issues);
            this.handlePerformanceIssues(issues);
        }
    }
    
    /**
     * パフォーマンス問題対応
     */
    handlePerformanceIssues(issues) {
        issues.forEach(issue => {
            switch (issue.type) {
                case 'framerate':
                    this.optimizeFramerate();
                    break;
                case 'memory':
                    this.optimizeMemory();
                    break;
                case 'audioLatency':
                    this.optimizeAudioLatency();
                    break;
            }
        });
    }
    
    /**
     * フレームレート最適化
     */
    optimizeFramerate() {
        if (!this.optimizations.applied.includes('reduceAudioChannels')) {
            this.applyOptimization('reduceAudioChannels');
        }
    }
    
    /**
     * メモリ最適化
     */
    optimizeMemory() {
        if (!this.optimizations.applied.includes('limitConcurrentSounds')) {
            this.applyOptimization('limitConcurrentSounds');
        }
        
        // 強制ガベージコレクション（可能な場合）
        if (window.gc) {
            window.gc();
        }
    }
    
    /**
     * 音響レイテンシ最適化
     */
    optimizeAudioLatency() {
        if (!this.optimizations.applied.includes('lowerAudioQuality')) {
            this.applyOptimization('lowerAudioQuality');
        }
    }
    
    /**
     * 初期最適化設定適用
     */
    applyInitialOptimizations() {
        switch (this.settings.optimizationLevel) {
            case 'extreme':
                this.applyOptimization('reducePolyphony');
                this.applyOptimization('disableReverbEffects');
                // fallthrough
            case 'high':
                this.applyOptimization('reduceBGMQuality');
                this.applyOptimization('limitConcurrentSounds');
                // fallthrough
            case 'normal':
                this.applyOptimization('lowerAudioQuality');
                break;
            case 'low':
            default:
                // 最適化なし
                break;
        }
    }
    
    /**
     * 自動最適化適用
     */
    applyAutoOptimization() {
        if (!this.settings.autoAdjust.enabled) return;
        
        // 音響品質の自動調整
        if (this.settings.autoAdjust.audioQuality) {
            this.adjustAudioQualityDynamically();
        }
        
        // エフェクト数の自動調整
        if (this.settings.autoAdjust.effectsCount) {
            this.adjustEffectsCountDynamically();
        }
    }
    
    /**
     * 音響品質の動的調整
     */
    adjustAudioQualityDynamically() {
        const performanceScore = this.calculatePerformanceScore();
        
        if (performanceScore < 0.5) {
            // パフォーマンスが悪い場合は品質を下げる
            if (!this.optimizations.applied.includes('lowerAudioQuality')) {
                this.applyOptimization('lowerAudioQuality');
            }
        } else if (performanceScore > 0.8) {
            // パフォーマンスが良い場合は品質を戻す
            if (this.optimizations.applied.includes('lowerAudioQuality')) {
                this.removeOptimization('lowerAudioQuality');
            }
        }
    }
    
    /**
     * エフェクト数の動的調整
     */
    adjustEffectsCountDynamically() {
        const memoryPressure = this.metrics.memory.percentage;
        
        if (memoryPressure > 0.8) {
            if (!this.optimizations.applied.includes('limitConcurrentSounds')) {
                this.applyOptimization('limitConcurrentSounds');
            }
        } else if (memoryPressure < 0.6) {
            if (this.optimizations.applied.includes('limitConcurrentSounds')) {
                this.removeOptimization('limitConcurrentSounds');
            }
        }
    }
    
    /**
     * パフォーマンススコア計算
     */
    calculatePerformanceScore() {
        let score = 1.0;
        
        // フレームレートスコア
        if (this.metrics.frameTime.average > this.settings.thresholds.frameTime) {
            score *= 0.5;
        }
        
        // メモリスコア
        if (this.metrics.memory.percentage > this.settings.thresholds.memoryUsage) {
            score *= 0.7;
        }
        
        // 音響レイテンシスコア
        if (this.metrics.audio.averageLatency > this.settings.thresholds.audioLatency) {
            score *= 0.8;
        }
        
        return Math.max(0, Math.min(1, score));
    }
    
    /**
     * 最適化適用
     */
    applyOptimization(optimization) {
        if (this.optimizations.applied.includes(optimization)) return;
        
        console.log(`⚡ 最適化適用: ${optimization}`);
        
        try {
            switch (optimization) {
                case 'reduceAudioChannels':
                    this.setMaxAudioChannels(8);
                    break;
                case 'lowerAudioQuality':
                    this.setAudioQuality('low');
                    break;
                case 'limitConcurrentSounds':
                    this.setMaxConcurrentSounds(16);
                    break;
                case 'reduceBGMQuality':
                    this.setBGMQuality('low');
                    break;
                case 'disableReverbEffects':
                    this.setReverbEnabled(false);
                    break;
                case 'reducePolyphony':
                    this.setPolyphonyLimit(4);
                    break;
            }
            
            this.optimizations.applied.push(optimization);
            
        } catch (error) {
            console.error(`最適化適用エラー [${optimization}]:`, error);
        }
    }
    
    /**
     * 最適化解除
     */
    removeOptimization(optimization) {
        const index = this.optimizations.applied.indexOf(optimization);
        if (index === -1) return;
        
        console.log(`⚡ 最適化解除: ${optimization}`);
        
        try {
            // 最適化解除の実装
            // （各最適化の逆操作）
            
            this.optimizations.applied.splice(index, 1);
            
        } catch (error) {
            console.error(`最適化解除エラー [${optimization}]:`, error);
        }
    }
    
    /**
     * 音響設定変更メソッド群
     */
    setMaxAudioChannels(channels) {
        if (this.game.audioSystem && this.game.audioSystem.setMaxChannels) {
            this.game.audioSystem.setMaxChannels(channels);
        }
    }
    
    setAudioQuality(quality) {
        if (this.game.audioSystem && this.game.audioSystem.setQuality) {
            this.game.audioSystem.setQuality(quality);
        }
    }
    
    setMaxConcurrentSounds(limit) {
        if (this.game.audioSystem && this.game.audioSystem.setMaxConcurrentSounds) {
            this.game.audioSystem.setMaxConcurrentSounds(limit);
        }
    }
    
    setBGMQuality(quality) {
        if (this.game.audioSystem && this.game.audioSystem.setBGMQuality) {
            this.game.audioSystem.setBGMQuality(quality);
        }
    }
    
    setReverbEnabled(enabled) {
        if (this.game.audioSystem && this.game.audioSystem.setReverbEnabled) {
            this.game.audioSystem.setReverbEnabled(enabled);
        }
    }
    
    setPolyphonyLimit(limit) {
        if (this.game.audioSystem && this.game.audioSystem.setPolyphonyLimit) {
            this.game.audioSystem.setPolyphonyLimit(limit);
        }
    }
    
    /**
     * パフォーマンスレポート取得
     */
    getPerformanceReport() {
        return {
            metrics: this.metrics,
            settings: this.settings,
            optimizations: this.optimizations,
            performanceScore: this.calculatePerformanceScore(),
            deviceInfo: {
                cores: navigator.hardwareConcurrency || 'unknown',
                memory: this.metrics.memory.limit ? Math.round(this.metrics.memory.limit / 1024 / 1024) + 'MB' : 'unknown',
                userAgent: navigator.userAgent
            }
        };
    }
    
    /**
     * 更新処理
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        // メトリクス収集は定期実行で行うため、ここでは軽量な処理のみ
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        console.log('🧹 Phase5PerformanceOptimizer: クリーンアップ');
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        
        this.initialized = false;
    }
}