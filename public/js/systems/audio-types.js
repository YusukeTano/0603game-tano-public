/**
 * AudioTypes - 新音響アーキテクチャ 基本型定義・インターフェース
 * 5層アーキテクチャ共通型システム
 * 
 * 🏗️ 設計原則:
 * - 型安全性の確保（JSDoc + 実行時検証）
 * - 契約駆動設計の支援
 * - エラーハンドリングの統一
 * - 性能監視の組み込み
 */

// ==================== 基本型定義 ====================

/**
 * @typedef {Object} AudioContextResult
 * @property {boolean} success - 初期化成功フラグ
 * @property {AudioContext|null} context - AudioContextインスタンス
 * @property {string} [error] - エラーメッセージ（失敗時）
 * @property {number} timestamp - 初期化実行時刻
 */

/**
 * @typedef {Object} AudioContextState
 * @property {'suspended'|'running'|'closed'} state - コンテキスト状態
 * @property {number} sampleRate - サンプルレート
 * @property {number} currentTime - 現在時刻
 * @property {number} baseLatency - 基本レイテンシー
 */

/**
 * @typedef {'basic'|'plasma'|'nuke'|'superHoming'|'superShotgun'|'enemyHit'|'enemyDeath'|'ui'} SynthType
 */

/**
 * @typedef {Object} SynthConfig
 * @property {number} [volume=0.7] - 音量 (0-1)
 * @property {string} [envelope='default'] - エンベロープ設定
 * @property {Object} [effects] - エフェクト設定
 * @property {number} [maxVoices=1] - 最大同時発音数
 */

/**
 * @typedef {Object} ResourceStats
 * @property {number} synthCount - 現在のSynth数
 * @property {number} maxSynths - 最大Synth数
 * @property {number} activeSounds - アクティブ音響数
 * @property {number} memoryUsage - メモリ使用量(MB)
 * @property {number} cpuUsage - CPU使用率
 */

/**
 * @typedef {Object} HealthMetrics
 * @property {number} uptime - 稼働時間(ms)
 * @property {number} errorCount - エラー総数
 * @property {number} averageLatency - 平均レイテンシー(ms)
 * @property {number} performanceScore - 性能スコア(0-100)
 * @property {string} overallStatus - 全体状態
 */

/**
 * @typedef {Object} CleanupResult
 * @property {number} cleaned - クリーンアップした項目数
 * @property {number} memoryFreed - 解放したメモリ量(MB)
 * @property {number} duration - クリーンアップ時間(ms)
 */

// ==================== インターフェース定義 ====================

/**
 * IAudioFoundation - 基盤レイヤーインターフェース
 * Layer 1の契約定義
 */
export class IAudioFoundation {
    /**
     * AudioContext初期化
     * @returns {Promise<AudioContextResult>}
     */
    async initializeContext() {
        throw new Error('initializeContext must be implemented');
    }
    
    /**
     * コンテキスト状態取得
     * @returns {AudioContextState}
     */
    getContextState() {
        throw new Error('getContextState must be implemented');
    }
    
    /**
     * コンテキスト再開
     * @returns {Promise<void>}
     */
    async resumeContext() {
        throw new Error('resumeContext must be implemented');
    }
    
    /**
     * コンテキスト停止
     * @returns {Promise<void>}
     */
    async suspendContext() {
        throw new Error('suspendContext must be implemented');
    }
    
    /**
     * Synth作成
     * @param {SynthType} type - Synthタイプ
     * @param {SynthConfig} config - 設定
     * @returns {Promise<Object>} - Synthインスタンス
     */
    async createSynth(type, config) {
        throw new Error('createSynth must be implemented');
    }
    
    /**
     * Synth破棄
     * @param {Object} synth - Synthインスタンス
     * @returns {void}
     */
    disposeSynth(synth) {
        throw new Error('disposeSynth must be implemented');
    }
    
    /**
     * リソース統計取得
     * @returns {ResourceStats}
     */
    getResourceStats() {
        throw new Error('getResourceStats must be implemented');
    }
    
    /**
     * リソースクリーンアップ
     * @returns {CleanupResult}
     */
    cleanupResources() {
        throw new Error('cleanupResources must be implemented');
    }
    
    /**
     * エラーログ記録
     * @param {AudioError} error - エラー情報
     * @returns {void}
     */
    logError(error) {
        throw new Error('logError must be implemented');
    }
    
    /**
     * ヘルスメトリクス取得
     * @returns {HealthMetrics}
     */
    getHealthMetrics() {
        throw new Error('getHealthMetrics must be implemented');
    }
}

// ==================== エラークラス定義 ====================

/**
 * AudioError - 音響システム専用エラークラス
 */
export class AudioError extends Error {
    /**
     * @param {string} message - エラーメッセージ
     * @param {string} [code] - エラーコード
     * @param {Object} [details] - 詳細情報
     */
    constructor(message, code = 'AUDIO_ERROR', details = {}) {
        super(message);
        this.name = 'AudioError';
        this.code = code;
        this.details = details;
        this.timestamp = Date.now();
        
        // スタックトレース保持
        if (Error.captureStackTrace) {
            Error.captureStackTrace(this, AudioError);
        }
    }
    
    /**
     * エラー情報をJSONで取得
     * @returns {Object}
     */
    toJSON() {
        return {
            name: this.name,
            message: this.message,
            code: this.code,
            details: this.details,
            timestamp: this.timestamp,
            stack: this.stack
        };
    }
}

/**
 * AudioContextError - AudioContext関連エラー
 */
export class AudioContextError extends AudioError {
    constructor(message, details = {}) {
        super(message, 'AUDIO_CONTEXT_ERROR', details);
        this.name = 'AudioContextError';
    }
}

/**
 * ResourceError - リソース管理関連エラー
 */
export class ResourceError extends AudioError {
    constructor(message, details = {}) {
        super(message, 'RESOURCE_ERROR', details);
        this.name = 'ResourceError';
    }
}

/**
 * SynthError - Synth作成・操作関連エラー
 */
export class SynthError extends AudioError {
    constructor(message, details = {}) {
        super(message, 'SYNTH_ERROR', details);
        this.name = 'SynthError';
    }
}

// ==================== ユーティリティ関数 ====================

/**
 * 型検証ユーティリティ
 */
export class AudioTypeValidator {
    /**
     * SynthType検証
     * @param {*} value - 検証対象
     * @returns {boolean}
     */
    static isValidSynthType(value) {
        const validTypes = ['basic', 'plasma', 'nuke', 'superHoming', 'superShotgun', 'enemyHit', 'enemyDeath', 'ui'];
        return validTypes.includes(value);
    }
    
    /**
     * SynthConfig検証
     * @param {*} config - 検証対象
     * @returns {boolean}
     */
    static isValidSynthConfig(config) {
        if (typeof config !== 'object' || config === null) return false;
        
        // volume検証
        if (config.volume !== undefined) {
            if (typeof config.volume !== 'number' || config.volume < 0 || config.volume > 1) {
                return false;
            }
        }
        
        // maxVoices検証
        if (config.maxVoices !== undefined) {
            if (typeof config.maxVoices !== 'number' || config.maxVoices < 1) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * 音量値検証
     * @param {*} volume - 検証対象
     * @returns {boolean}
     */
    static isValidVolume(volume) {
        return typeof volume === 'number' && volume >= 0 && volume <= 1;
    }
}

/**
 * 性能測定ユーティリティ
 */
export class AudioPerformanceTracker {
    constructor() {
        this.metrics = new Map();
        this.startTimes = new Map();
    }
    
    /**
     * 測定開始
     * @param {string} operation - 操作名
     */
    startTimer(operation) {
        this.startTimes.set(operation, performance.now());
    }
    
    /**
     * 測定終了・記録
     * @param {string} operation - 操作名
     * @returns {number} - 経過時間(ms)
     */
    endTimer(operation) {
        const startTime = this.startTimes.get(operation);
        if (!startTime) return 0;
        
        const duration = performance.now() - startTime;
        this.recordMetric(operation, duration);
        this.startTimes.delete(operation);
        
        return duration;
    }
    
    /**
     * メトリクス記録
     * @param {string} operation - 操作名
     * @param {number} value - 測定値
     */
    recordMetric(operation, value) {
        if (!this.metrics.has(operation)) {
            this.metrics.set(operation, []);
        }
        
        const values = this.metrics.get(operation);
        values.push(value);
        
        // 最新100件のみ保持
        if (values.length > 100) {
            values.shift();
        }
    }
    
    /**
     * 平均値取得
     * @param {string} operation - 操作名
     * @returns {number}
     */
    getAverageMetric(operation) {
        const values = this.metrics.get(operation);
        if (!values || values.length === 0) return 0;
        
        return values.reduce((a, b) => a + b, 0) / values.length;
    }
    
    /**
     * 全メトリクス取得
     * @returns {Object}
     */
    getAllMetrics() {
        const result = {};
        for (const [operation, values] of this.metrics) {
            result[operation] = {
                count: values.length,
                average: this.getAverageMetric(operation),
                min: Math.min(...values),
                max: Math.max(...values),
                recent: values.slice(-10) // 最新10件
            };
        }
        return result;
    }
}

// ==================== デバッグユーティリティ ====================

/**
 * デバッグログユーティリティ
 */
export class AudioDebugLogger {
    constructor(enabled = true) {
        this.enabled = enabled;
        this.logHistory = [];
        this.maxHistorySize = 1000;
    }
    
    /**
     * デバッグログ出力
     * @param {string} level - ログレベル
     * @param {string} message - メッセージ
     * @param {Object} [details] - 詳細情報
     */
    log(level, message, details = {}) {
        if (!this.enabled) return;
        
        const logEntry = {
            timestamp: Date.now(),
            level,
            message,
            details
        };
        
        // 履歴保存
        this.logHistory.push(logEntry);
        if (this.logHistory.length > this.maxHistorySize) {
            this.logHistory.shift();
        }
        
        // コンソール出力
        const emoji = this.getLevelEmoji(level);
        const timestamp = new Date().toLocaleTimeString();
        
        console.log(`${emoji} [${timestamp}] AudioFoundation: ${message}`, details);
    }
    
    /**
     * レベル別絵文字取得
     * @param {string} level - ログレベル
     * @returns {string}
     */
    getLevelEmoji(level) {
        const emojis = {
            'info': '🔧',
            'warn': '⚠️',
            'error': '❌',
            'success': '✅',
            'debug': '🔍',
            'performance': '⚡'
        };
        return emojis[level] || '📝';
    }
    
    /**
     * ログ履歴取得
     * @param {number} [limit] - 取得件数
     * @returns {Array}
     */
    getHistory(limit = 50) {
        return this.logHistory.slice(-limit);
    }
    
    /**
     * ログクリア
     */
    clearHistory() {
        this.logHistory = [];
    }
}

// ==================== グローバル設定 ====================

/**
 * AudioFoundation設定
 */
export const AudioFoundationConfig = {
    // リソース制限
    maxSynths: 20,
    maxConcurrentSounds: 8,
    cleanupInterval: 5000,
    
    // パフォーマンス設定
    performanceMonitoring: true,
    debugLogging: true,
    
    // エラーハンドリング
    errorThreshold: 5,
    retryAttempts: 3,
    
    // タイムアウト設定
    contextInitTimeout: 5000,
    synthCreateTimeout: 1000,
    operationTimeout: 2000
};

// デバッグ用グローバルエクスポート
if (typeof window !== 'undefined') {
    window.AudioFoundationDebug = {
        AudioError,
        AudioContextError,
        ResourceError,
        SynthError,
        AudioTypeValidator,
        AudioPerformanceTracker,
        AudioDebugLogger,
        AudioFoundationConfig
    };
}

console.log('🔧 AudioTypes: 新音響アーキテクチャ基本型定義読み込み完了');