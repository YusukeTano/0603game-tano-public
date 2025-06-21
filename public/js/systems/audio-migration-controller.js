/**
 * AudioMigrationController - 音響システム移行制御
 * 新旧システム間の安全な切り替え・段階的移行・フォールバック管理
 */

import { UnifiedAudioManager } from './unified-audio-manager.js';
import { IntegratedAudioManager } from './integrated-audio-manager.js';
import { AudioFeatureFlags } from './audio-feature-flags.js';

export class AudioMigrationController {
    constructor(game = null) {
        this.game = game;
        
        // フィーチャーフラグシステム
        this.featureFlags = new AudioFeatureFlags();
        
        // 音響システム管理
        this.systems = {
            new: null,                          // 新システム (UnifiedAudioManager)
            old: null,                          // 旧システム (IntegratedAudioManager)
            active: null,                       // 現在アクティブなシステム
            fallback: null                      // フォールバック用システム
        };
        
        // 移行状態
        this.migrationState = {
            phase: 'initialization',           // initialization, migration, completed, rollback
            progress: 0,                       // 0-100%
            errors: [],
            startTime: null,
            lastHealthCheck: null
        };
        
        // パフォーマンス監視
        this.performance = {
            initializationTime: 0,
            switchingTime: 0,
            errorRate: 0,
            lastSwitchTime: 0,
            totalSwitches: 0
        };
        
        // ヘルスチェック設定
        this.healthCheck = {
            enabled: true,
            interval: 5000,                    // 5秒間隔
            timeoutThreshold: 1000,            // 1秒タイムアウト
            errorThreshold: 5,                 // 5回エラーでフォールバック
            currentErrors: 0,
            timer: null
        };
        
        console.log('🔄 AudioMigrationController: 移行制御システム初期化');
    }
    
    /**
     * システム初期化・自動選択
     */
    async initialize() {
        try {
            console.log('🔄 AudioMigrationController: システム初期化開始');
            this.migrationState.phase = 'initialization';
            this.migrationState.startTime = Date.now();
            
            const flags = this.featureFlags.getFlags();
            
            // システム作成・初期化
            await this.createSystems();
            
            // アクティブシステム決定
            if (flags.useNewAudioSystem) {
                await this.activateNewSystem();
            } else {
                await this.activateOldSystem();
            }
            
            // フォールバックシステム準備
            if (flags.fallbackToOldSystem) {
                await this.prepareFallbackSystem();
            }
            
            // ヘルスチェック開始
            if (this.healthCheck.enabled) {
                this.startHealthCheck();
            }
            
            this.migrationState.phase = 'completed';
            this.migrationState.progress = 100;
            this.performance.initializationTime = Date.now() - this.migrationState.startTime;
            
            console.log('✅ AudioMigrationController: システム初期化完了');
            console.log(`✅ アクティブシステム: ${this.getActiveSystemName()}`);
            
            return { success: true, activeSystem: this.getActiveSystemName() };
            
        } catch (error) {
            console.error('❌ AudioMigrationController: 初期化失敗:', error);
            this.migrationState.errors.push(error);
            
            // 緊急フォールバック
            await this.emergencyFallback();
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * システム作成
     */
    async createSystems() {
        const flags = this.featureFlags.getFlags();
        
        try {
            // 新システム作成
            if (flags.useNewAudioSystem || flags.enableGradualMigration) {
                console.log('🔄 新音響システム作成中...');
                this.systems.new = new UnifiedAudioManager(this.game);
                const newResult = await this.systems.new.initialize();
                
                if (!newResult.success) {
                    console.warn('⚠️ 新システム初期化失敗:', newResult.error);
                    this.systems.new = null;
                }
            }
            
            // 旧システム作成
            if (flags.fallbackToOldSystem || !flags.useNewAudioSystem) {
                console.log('🔄 旧音響システム作成中...');
                this.systems.old = new IntegratedAudioManager(this.game);
                
                try {
                    // 旧システム初期化（エラーが発生する可能性があるため try-catch）
                    if (typeof this.systems.old.initialize === 'function') {
                        await this.systems.old.initialize();
                    }
                } catch (error) {
                    console.warn('⚠️ 旧システム初期化エラー（継続）:', error);
                }
            }
            
            console.log('✅ システム作成完了');
            
        } catch (error) {
            console.error('❌ システム作成失敗:', error);
            throw error;
        }
    }
    
    /**
     * 新システムアクティベート
     */
    async activateNewSystem() {
        if (!this.systems.new) {
            throw new Error('New audio system not available');
        }
        
        try {
            this.systems.active = this.systems.new;
            this.systems.fallback = this.systems.old;
            
            console.log('✅ 新音響システムをアクティベート');
            return true;
            
        } catch (error) {
            console.error('❌ 新システムアクティベート失敗:', error);
            throw error;
        }
    }
    
    /**
     * 旧システムアクティベート
     */
    async activateOldSystem() {
        if (!this.systems.old) {
            throw new Error('Old audio system not available');
        }
        
        try {
            this.systems.active = this.systems.old;
            this.systems.fallback = this.systems.new;
            
            console.log('✅ 旧音響システムをアクティベート');
            return true;
            
        } catch (error) {
            console.error('❌ 旧システムアクティベート失敗:', error);
            throw error;
        }
    }
    
    /**
     * フォールバックシステム準備
     */
    async prepareFallbackSystem() {
        const fallbackSystem = this.systems.fallback;
        
        if (fallbackSystem && typeof fallbackSystem.initialize === 'function') {
            try {
                // フォールバックシステムの軽量初期化
                console.log('🔄 フォールバックシステム準備中...');
                // 必要に応じて初期化（既に初期化済みの場合はスキップ）
                if (!fallbackSystem.isInitialized) {
                    await fallbackSystem.initialize();
                }
                console.log('✅ フォールバックシステム準備完了');
            } catch (error) {
                console.warn('⚠️ フォールバックシステム準備エラー:', error);
            }
        }
    }
    
    /**
     * システム切り替え
     */
    async switchSystem(targetSystem) {
        const switchStartTime = Date.now();
        this.migrationState.phase = 'migration';
        
        try {
            const validSystems = ['new', 'old'];
            if (!validSystems.includes(targetSystem)) {
                throw new Error(`Invalid target system: ${targetSystem}`);
            }
            
            const targetSystemObj = this.systems[targetSystem];
            if (!targetSystemObj) {
                throw new Error(`Target system not available: ${targetSystem}`);
            }
            
            console.log(`🔄 システム切り替え開始: ${this.getActiveSystemName()} → ${targetSystem}`);
            
            // 現在のシステム停止
            if (this.systems.active && typeof this.systems.active.stop === 'function') {
                this.systems.active.stop();
            }
            
            // ターゲットシステムアクティベート
            this.systems.active = targetSystemObj;
            
            // ターゲットシステム開始
            if (typeof this.systems.active.start === 'function') {
                this.systems.active.start();
            }
            
            // 統計更新\n            this.performance.totalSwitches++;
            this.performance.lastSwitchTime = switchStartTime;
            this.performance.switchingTime = Date.now() - switchStartTime;
            
            this.migrationState.phase = 'completed';
            this.migrationState.progress = 100;
            
            console.log(`✅ システム切り替え完了: ${targetSystem} (${this.performance.switchingTime}ms)`);
            
            return { success: true, activeSystem: targetSystem, switchTime: this.performance.switchingTime };
            
        } catch (error) {
            console.error('❌ システム切り替え失敗:', error);
            this.migrationState.errors.push(error);
            
            // 自動フォールバック
            await this.fallbackToStableSystem();
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 安定システムへのフォールバック
     */
    async fallbackToStableSystem() {
        console.warn('🚨 安定システムへフォールバック実行');
        this.migrationState.phase = 'rollback';
        
        try {
            // フォールバックシステムがある場合はそれを使用
            if (this.systems.fallback) {
                this.systems.active = this.systems.fallback;
                
                if (typeof this.systems.active.start === 'function') {
                    this.systems.active.start();
                }
                
                console.log(`✅ フォールバック完了: ${this.getActiveSystemName()}`);
            } else {
                // フォールバックがない場合は旧システムを緊急作成
                await this.emergencyFallback();
            }
            
        } catch (error) {
            console.error('❌ フォールバック失敗:', error);
            await this.emergencyFallback();
        }
    }
    
    /**
     * 緊急フォールバック
     */
    async emergencyFallback() {
        console.warn('🚨 緊急フォールバック実行');
        
        try {
            // フィーチャーフラグを安全モードに設定
            this.featureFlags.emergencyDisable('useNewAudioSystem');
            
            // 最小限の旧システム作成
            if (!this.systems.old) {
                this.systems.old = new IntegratedAudioManager(this.game);
            }
            
            this.systems.active = this.systems.old;
            
            console.log('✅ 緊急フォールバック完了');
            
        } catch (error) {
            console.error('❌ 緊急フォールバック失敗:', error);
            // 最後の手段：音響システム無効化
            this.systems.active = null;
        }
    }
    
    /**
     * ヘルスチェック開始
     */
    startHealthCheck() {
        if (this.healthCheck.timer) {
            clearInterval(this.healthCheck.timer);
        }
        
        this.healthCheck.timer = setInterval(() => {
            this.performHealthCheck();
        }, this.healthCheck.interval);
        
        console.log('🏥 ヘルスチェック開始');
    }
    
    /**
     * ヘルスチェック実行
     */
    performHealthCheck() {
        try {
            const system = this.systems.active;
            if (!system) return;
            
            // システム応答性テスト
            const healthCheckStart = Date.now();
            
            // 診断情報取得
            let diagnostics = null;
            if (typeof system.diagnose === 'function') {
                diagnostics = system.diagnose();
            } else if (typeof system.getDebugInfo === 'function') {
                diagnostics = system.getDebugInfo();
            }
            
            const responseTime = Date.now() - healthCheckStart;
            
            // タイムアウトチェック
            if (responseTime > this.healthCheck.timeoutThreshold) {
                this.handleHealthCheckFailure(`Response timeout: ${responseTime}ms`);
                return;
            }
            
            // システム状態チェック
            if (diagnostics) {
                const isHealthy = this.evaluateSystemHealth(diagnostics);
                if (!isHealthy) {
                    this.handleHealthCheckFailure('System health check failed');
                    return;
                }
            }
            
            // 成功時はエラーカウントリセット
            this.healthCheck.currentErrors = 0;
            this.migrationState.lastHealthCheck = Date.now();
            
        } catch (error) {
            this.handleHealthCheckFailure(`Health check error: ${error.message}`);
        }
    }
    
    /**
     * システム健全性評価
     */
    evaluateSystemHealth(diagnostics) {
        try {
            // 新システムの健全性チェック
            if (diagnostics.system) {
                if (!diagnostics.system.initialized || !diagnostics.system.running) {
                    return false;
                }
            }
            
            // エラー率チェック
            if (diagnostics.performance && diagnostics.performance.systemLoad > 0.9) {
                return false;
            }
            
            // AudioCore状態チェック
            if (diagnostics.audioCore && diagnostics.audioCore.coreStatus !== 'Ready') {
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.warn('⚠️ システム健全性評価エラー:', error);
            return false;
        }
    }
    
    /**
     * ヘルスチェック失敗処理
     */
    handleHealthCheckFailure(reason) {
        this.healthCheck.currentErrors++;
        console.warn(`⚠️ ヘルスチェック失敗 (${this.healthCheck.currentErrors}/${this.healthCheck.errorThreshold}): ${reason}`);
        
        if (this.healthCheck.currentErrors >= this.healthCheck.errorThreshold) {
            console.error('🚨 ヘルスチェック失敗閾値に達しました。フォールバックを実行します。');
            this.fallbackToStableSystem();
        }
    }
    
    /**
     * ヘルスチェック停止
     */
    stopHealthCheck() {
        if (this.healthCheck.timer) {
            clearInterval(this.healthCheck.timer);
            this.healthCheck.timer = null;
            console.log('🏥 ヘルスチェック停止');
        }
    }
    
    /**
     * アクティブシステム名取得
     */
    getActiveSystemName() {
        if (this.systems.active === this.systems.new) {
            return 'UnifiedAudioManager';
        } else if (this.systems.active === this.systems.old) {
            return 'IntegratedAudioManager';
        } else {
            return 'None';
        }
    }
    
    /**
     * 統一API - アクティブシステムへの委譲
     */
    get sounds() {
        return this.systems.active ? this.systems.active.sounds : {};
    }
    
    update(deltaTime) {
        if (this.systems.active && typeof this.systems.active.update === 'function') {
            this.systems.active.update(deltaTime);
        }
    }
    
    setVolume(type, volume) {
        if (this.systems.active && typeof this.systems.active.setVolume === 'function') {
            this.systems.active.setVolume(type, volume);
        }
    }
    
    /**
     * 診断情報取得
     */
    diagnose() {
        return {
            migrationController: {
                activeSystem: this.getActiveSystemName(),
                migrationState: this.migrationState,
                performance: this.performance,
                healthCheck: {
                    enabled: this.healthCheck.enabled,
                    currentErrors: this.healthCheck.currentErrors,
                    lastCheck: this.migrationState.lastHealthCheck
                }
            },
            featureFlags: this.featureFlags.getDebugInfo(),
            activeSystemDiagnostics: this.systems.active && typeof this.systems.active.diagnose === 'function' 
                ? this.systems.active.diagnose() 
                : null
        };
    }
    
    /**
     * システムクリーンアップ
     */
    dispose() {
        console.log('🧹 AudioMigrationController: クリーンアップ開始');
        
        this.stopHealthCheck();
        
        // 全システム破棄
        for (const [name, system] of Object.entries(this.systems)) {
            if (system && typeof system.dispose === 'function') {
                try {
                    system.dispose();
                } catch (error) {
                    console.warn(`⚠️ ${name} システム破棄エラー:`, error);
                }
            }
        }
        
        console.log('✅ AudioMigrationController: クリーンアップ完了');
    }
}