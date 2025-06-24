/**
 * AudioFeatureFlags - 音響システムフィーチャーフラグ制御
 * 新旧システム切り替え・段階的移行・A/Bテスト対応
 */

export class AudioFeatureFlags {
    constructor() {
        // フィーチャーフラグ設定
        this.flags = {
            // メインシステム切り替え（🚨 緊急安定化設定）
            useNewAudioSystem: false,           // 新3層アーキテクチャ使用（強制無効）
            fallbackToOldSystem: true,          // 旧システムフォールバック（強制有効）
            enableGradualMigration: false,      // 段階的移行（緊急時無効）
            
            // 機能別フラグ（🚨 最小機能モード）
            enableAdvancedEffects: false,       // 高度エフェクト（強制無効）
            enableResourcePooling: false,       // リソースプール（不安定のため無効）
            enablePerformanceMonitoring: false, // パフォーマンス監視（オーバーヘッド削減）
            enableDebugLogging: false,          // デバッグログ（緊急時無効）
            
            // BGMシステム（🚨 基本機能のみ）
            enableNewBGMEngine: false,          // 新BGMエンジン（強制無効）
            enableChiptuneEngine: true,         // チップチューンエンジン（基本BGM）
            enablePianoBGM: true,               // ピアノBGM（基本BGM）
            
            // 互換性・テスト（🚨 安全第一）
            enableCompatibilityLayer: true,     // 後方互換性（強制有効）
            enableABTesting: false,             // A/Bテスト（緊急時無効）
            enableSafeMode: true                // セーフモード（強制有効）
        };
        
        // 環境別設定（🚨 全環境で緊急安定化モード）
        this.environments = {
            development: {
                useNewAudioSystem: false,      // 開発環境でも緊急時は無効
                enableDebugLogging: false,     // ログ負荷削減
                enablePerformanceMonitoring: false, // 監視オーバーヘッド削減
                enableSafeMode: true           // 強制セーフモード
            },
            staging: {
                useNewAudioSystem: false,      // ステージングでも緊急時は無効
                enableAdvancedEffects: false, // 高度機能無効
                enableDebugLogging: false,     // ログ無効
                enableSafeMode: true           // 強制セーフモード
            },
            production: {
                useNewAudioSystem: false,      // 本番では旧システム（変更なし）
                enableDebugLogging: false,     // ログ無効（変更なし）
                enableSafeMode: true,          // セーフモード（変更なし）
                enableAdvancedEffects: false  // 高度機能無効
            }
        };
        
        // ユーザーグループ設定（🚨 全ユーザーで緊急安定化モード）
        this.userGroups = {
            beta: {
                useNewAudioSystem: false,      // ベータユーザーでも緊急時は無効
                enableAdvancedEffects: false, // 高度機能無効
                enableSafeMode: true           // 強制セーフモード
            },
            stable: {
                useNewAudioSystem: false,      // 安定ユーザー（変更なし）
                enableSafeMode: true,          // セーフモード（変更なし）
                enableAdvancedEffects: false  // 高度機能無効
            }
        };
        
        // 実行時状態
        this.currentEnvironment = this.detectEnvironment();
        this.userGroup = this.detectUserGroup();
        this.effectiveFlags = this.calculateEffectiveFlags();
        
        console.log('🎛️ AudioFeatureFlags: フィーチャーフラグシステム初期化');
        console.log('🎛️ 環境:', this.currentEnvironment, '| ユーザーグループ:', this.userGroup);
    }
    
    /**
     * 環境検出
     */
    detectEnvironment() {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            
            if (hostname === 'localhost' || hostname === '127.0.0.1') {
                return 'development';
            } else if (hostname.includes('staging') || hostname.includes('test')) {
                return 'staging';
            } else {
                return 'production';
            }
        }
        
        return 'development';
    }
    
    /**
     * ユーザーグループ検出
     */
    detectUserGroup() {
        try {
            // localStorage設定確認
            const userPreference = localStorage.getItem('audioSystemPreference');
            if (userPreference === 'beta') return 'beta';
            if (userPreference === 'stable') return 'stable';
            
            // URLパラメータ確認
            if (typeof window !== 'undefined') {
                const urlParams = new URLSearchParams(window.location.search);
                const audioMode = urlParams.get('audioMode');
                if (audioMode === 'beta') return 'beta';
                if (audioMode === 'new') return 'beta';
            }
            
            // デフォルト: 環境に応じて設定
            return this.currentEnvironment === 'development' ? 'beta' : 'stable';
            
        } catch (error) {
            console.warn('⚠️ AudioFeatureFlags: ユーザーグループ検出エラー:', error);
            return 'stable';
        }
    }
    
    /**
     * 有効フラグ計算
     */
    calculateEffectiveFlags() {
        let effective = { ...this.flags };
        
        // 環境設定適用
        const envSettings = this.environments[this.currentEnvironment];
        if (envSettings) {
            effective = { ...effective, ...envSettings };
        }
        
        // ユーザーグループ設定適用
        const groupSettings = this.userGroups[this.userGroup];
        if (groupSettings) {
            effective = { ...effective, ...groupSettings };
        }
        
        // 依存関係チェック
        effective = this.resolveDependencies(effective);
        
        return effective;
    }
    
    /**
     * フラグ依存関係解決
     */
    resolveDependencies(flags) {
        const resolved = { ...flags };
        
        // 新システム使用時の依存関係
        if (resolved.useNewAudioSystem) {
            resolved.enableResourcePooling = true;
            resolved.enablePerformanceMonitoring = true;
        }
        
        // セーフモード時の制限
        if (resolved.enableSafeMode) {
            resolved.enableAdvancedEffects = false;
            resolved.enableABTesting = false;
        }
        
        // フォールバック設定
        if (!resolved.useNewAudioSystem) {
            resolved.fallbackToOldSystem = true;
        }
        
        return resolved;
    }
    
    /**
     * フラグ状態取得
     */
    isEnabled(flagName) {
        return this.effectiveFlags[flagName] === true;
    }
    
    /**
     * フラグ状態一括取得
     */
    getFlags() {
        return { ...this.effectiveFlags };
    }
    
    /**
     * 実行時フラグ変更
     */
    setFlag(flagName, value) {
        if (flagName in this.flags) {
            this.flags[flagName] = value;
            this.effectiveFlags = this.calculateEffectiveFlags();
            console.log(`🎛️ AudioFeatureFlags: ${flagName} = ${value}`);
            
            // 設定保存
            this.saveUserPreferences();
        } else {
            console.warn(`⚠️ AudioFeatureFlags: 未知のフラグ: ${flagName}`);
        }
    }
    
    /**
     * ユーザー設定保存
     */
    saveUserPreferences() {
        try {
            const preferences = {
                userGroup: this.userGroup,
                customFlags: this.getCustomFlags()
            };
            localStorage.setItem('audioFeatureFlags', JSON.stringify(preferences));
        } catch (error) {
            console.warn('⚠️ AudioFeatureFlags: 設定保存失敗:', error);
        }
    }
    
    /**
     * カスタムフラグ取得
     */
    getCustomFlags() {
        const custom = {};
        const baseFlags = this.flags;
        const effectiveFlags = this.effectiveFlags;
        
        for (const [key, value] of Object.entries(effectiveFlags)) {
            if (baseFlags[key] !== value) {
                custom[key] = value;
            }
        }
        
        return custom;
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            environment: this.currentEnvironment,
            userGroup: this.userGroup,
            baseFlags: this.flags,
            environmentOverrides: this.environments[this.currentEnvironment],
            userGroupOverrides: this.userGroups[this.userGroup],
            effectiveFlags: this.effectiveFlags,
            customFlags: this.getCustomFlags()
        };
    }
    
    /**
     * コンソールデバッグ出力
     */
    debugToConsole() {
        const debug = this.getDebugInfo();
        
        console.group('🎛️ AudioFeatureFlags Debug Information');
        console.log('Environment:', debug.environment);
        console.log('User Group:', debug.userGroup);
        console.log('Effective Flags:', debug.effectiveFlags);
        
        if (Object.keys(debug.customFlags).length > 0) {
            console.log('Custom Overrides:', debug.customFlags);
        }
        
        console.groupEnd();
    }
    
    /**
     * A/Bテスト用ランダムフラグ設定
     */
    enableABTest(flagName, percentage = 50) {
        if (this.isEnabled('enableABTesting')) {
            const random = Math.random() * 100;
            const enabled = random < percentage;
            
            this.setFlag(flagName, enabled);
            console.log(`🧪 AudioFeatureFlags: A/Bテスト ${flagName} = ${enabled} (${percentage}%, roll: ${random.toFixed(1)})`);
            
            return enabled;
        }
        
        return this.isEnabled(flagName);
    }
    
    /**
     * 緊急無効化（プロダクション用）
     */
    emergencyDisable(flagName) {
        console.warn(`🚨 AudioFeatureFlags: 緊急無効化 ${flagName}`);
        this.setFlag(flagName, false);
        
        // 緊急モード時の追加制限
        if (flagName === 'useNewAudioSystem') {
            this.setFlag('enableAdvancedEffects', false);
            this.setFlag('fallbackToOldSystem', true);
            this.setFlag('enableSafeMode', true);
        }
    }
    
    /**
     * システム推奨設定の計算
     */
    getRecommendedSettings() {
        const recommendations = {};
        
        // パフォーマンス推定
        const deviceCapabilities = this.estimateDeviceCapabilities();
        
        if (deviceCapabilities.powerLevel === 'high') {
            recommendations.useNewAudioSystem = true;
            recommendations.enableAdvancedEffects = true;
        } else if (deviceCapabilities.powerLevel === 'medium') {
            recommendations.useNewAudioSystem = true;
            recommendations.enableAdvancedEffects = false;
        } else {
            recommendations.useNewAudioSystem = false;
            recommendations.enableSafeMode = true;
        }
        
        return recommendations;
    }
    
    /**
     * デバイス性能推定
     */
    estimateDeviceCapabilities() {
        if (typeof navigator === 'undefined') {
            return { powerLevel: 'medium' };
        }
        
        const memory = navigator.deviceMemory || 4;
        const cores = navigator.hardwareConcurrency || 4;
        const isMobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
        
        let powerLevel = 'medium';
        
        if (!isMobile && memory >= 8 && cores >= 8) {
            powerLevel = 'high';
        } else if (isMobile || memory < 4 || cores < 4) {
            powerLevel = 'low';
        }
        
        return {
            powerLevel,
            memory,
            cores,
            isMobile
        };
    }
}

// グローバル対応
if (typeof window !== 'undefined') {
    window.AudioFeatureFlags = AudioFeatureFlags;
}