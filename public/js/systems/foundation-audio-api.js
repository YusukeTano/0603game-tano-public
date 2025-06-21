/**
 * FoundationAudioAPI - Phase 1.2 基盤音響API
 * 
 * 🎯 目的: 音響システムの統一インターフェース提供
 * 📐 設計: 最小限・高安全性・テスト可能
 * 🛡️ Phase 1: Foundation層（95%成功確率）
 */

export class FoundationAudioAPI {
    constructor() {
        // システム状態
        this.isInitialized = false;
        this.isReady = false;
        this.audioContext = null;
        
        // 統一設定
        this.config = {
            maxConcurrentSounds: 6,          // モバイル最適化
            audioTimeout: 1000,              // 1秒タイムアウト
            retryAttempts: 3,                // 再試行回数
            fallbackMode: true               // フォールバック有効
        };
        
        // API統計（Phase 1.3のテスト用）
        this.stats = {
            totalCalls: 0,
            successfulCalls: 0,
            failedCalls: 0,
            averageLatency: 0,
            initializationTime: 0
        };
        
        // エラーハンドリング
        this.errorHistory = [];
        this.maxErrorHistory = 10;
        
        console.log('🔧 FoundationAudioAPI: Phase 1.2 基盤API初期化');
    }
    
    /**
     * 統一初期化メソッド
     * Phase 1: 最小限の初期化で95%成功確率を確保
     */
    async initialize() {
        const startTime = performance.now();
        
        try {
            console.log('🚀 FoundationAudioAPI: 基盤初期化開始');
            
            // Web Audio Context 安全初期化
            await this.initializeAudioContext();
            
            // Tone.js 安全初期化
            await this.initializeToneJS();
            
            this.isInitialized = true;
            this.isReady = true;
            
            this.stats.initializationTime = performance.now() - startTime;
            console.log(`✅ FoundationAudioAPI: 初期化完了 (${this.stats.initializationTime.toFixed(2)}ms)`);
            
            return { success: true, latency: this.stats.initializationTime };
            
        } catch (error) {
            this.recordError('initialization', error);
            console.error('❌ FoundationAudioAPI: 初期化失敗:', error);
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Web Audio Context 安全初期化
     */
    async initializeAudioContext() {
        try {
            // ブラウザ互換性チェック
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (!AudioContextClass) {
                throw new Error('Web Audio API not supported');
            }
            
            // AudioContext作成（冗長性チェック）
            if (!this.audioContext) {
                this.audioContext = new AudioContextClass();
                console.log('🔊 AudioContext created:', this.audioContext.state);
            }
            
            // Context状態確認
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('🔊 AudioContext resumed');
            }
            
        } catch (error) {
            throw new Error(`AudioContext initialization failed: ${error.message}`);
        }
    }
    
    /**
     * Tone.js 安全初期化
     */
    async initializeToneJS() {
        try {
            // Tone.js存在チェック
            if (typeof window.Tone === 'undefined') {
                throw new Error('Tone.js not loaded');
            }
            
            // Tone.js設定
            if (this.audioContext) {
                window.Tone.setContext(this.audioContext);
                console.log('🎵 Tone.js context set');
            }
            
            // Tone.js開始（重複回避）
            if (window.Tone.context.state !== 'running') {
                await window.Tone.start();
                console.log('🎵 Tone.js started');
            }
            
        } catch (error) {
            throw new Error(`Tone.js initialization failed: ${error.message}`);
        }
    }
    
    /**
     * 統一音響再生メソッド
     * Phase 1: 基本的な再生機能のみ
     */
    async playSound(soundType, options = {}) {
        const callStart = performance.now();
        this.stats.totalCalls++;
        
        try {
            // 初期化チェック
            if (!this.isReady) {
                throw new Error('FoundationAudioAPI not ready');
            }
            
            // 基本的な音響再生（Phase 1では最小実装）
            const result = await this.basicSoundPlayback(soundType, options);
            
            // 成功統計更新
            this.stats.successfulCalls++;
            this.updateLatencyStats(performance.now() - callStart);
            
            return result;
            
        } catch (error) {
            this.stats.failedCalls++;
            this.recordError('playSound', error);
            
            // Phase 1: エラー時は静かに失敗（ゲーム継続優先）
            console.warn(`⚠️ FoundationAudioAPI: Sound playback failed for ${soundType}:`, error.message);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 基本的な音響再生実装
     * Phase 1: 最小限の機能で安全性重視
     */
    async basicSoundPlayback(soundType, options) {
        // Phase 1では簡単なトーン生成のみ
        try {
            const synth = new window.Tone.Synth().toDestination();
            
            // 基本的なサウンドマッピング
            const soundMap = {
                'test': 'C4',
                'click': 'G4',
                'success': 'C5',
                'error': 'A2'
            };
            
            const note = soundMap[soundType] || 'C4';
            synth.triggerAttackRelease(note, '8n');
            
            // リソース解放
            setTimeout(() => {
                synth.dispose();
            }, 1000);
            
            return { success: true, soundType, note };
            
        } catch (error) {
            throw new Error(`Basic sound playback failed: ${error.message}`);
        }
    }
    
    /**
     * 統計更新
     */
    updateLatencyStats(latency) {
        const alpha = 0.1; // 指数移動平均
        this.stats.averageLatency = this.stats.averageLatency * (1 - alpha) + latency * alpha;
    }
    
    /**
     * エラー記録
     */
    recordError(operation, error) {
        const errorRecord = {
            timestamp: Date.now(),
            operation,
            error: error.message,
            stack: error.stack
        };
        
        this.errorHistory.push(errorRecord);
        
        // 履歴サイズ制限
        if (this.errorHistory.length > this.maxErrorHistory) {
            this.errorHistory.shift();
        }
    }
    
    /**
     * システム状態取得（Phase 1.3テスト用）
     */
    getSystemStatus() {
        return {
            isInitialized: this.isInitialized,
            isReady: this.isReady,
            audioContextState: this.audioContext?.state,
            toneContextState: window.Tone?.context?.state,
            stats: { ...this.stats },
            config: { ...this.config },
            errorCount: this.errorHistory.length
        };
    }
    
    /**
     * 安全なシャットダウン
     */
    dispose() {
        try {
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
            this.isInitialized = false;
            this.isReady = false;
            console.log('🔇 FoundationAudioAPI: Disposed');
        } catch (error) {
            console.warn('⚠️ FoundationAudioAPI: Dispose error:', error);
        }
    }
    
    /**
     * Phase 1.3: 単体テスト用メソッド
     */
    async runBasicTests() {
        const tests = [];
        
        // 初期化テスト
        tests.push({
            name: 'initialization',
            result: this.isInitialized && this.isReady
        });
        
        // 音響再生テスト
        try {
            const playResult = await this.playSound('test');
            tests.push({
                name: 'basic_playback',
                result: playResult.success
            });
        } catch (error) {
            tests.push({
                name: 'basic_playback',
                result: false,
                error: error.message
            });
        }
        
        return {
            passed: tests.filter(t => t.result).length,
            total: tests.length,
            tests,
            systemStatus: this.getSystemStatus()
        };
    }
}

// グローバル対応
if (typeof window !== 'undefined') {
    window.FoundationAudioAPI = FoundationAudioAPI;
}