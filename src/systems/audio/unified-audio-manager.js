/**
 * UnifiedAudioManager - 統合管理層
 * 全体制御・統一API・外部システム連携・設定管理
 * 新3層アーキテクチャの最上位層
 */

import { AudioCore } from './audio-core.js';
import { AudioEngine } from './audio-engine.js';

export class UnifiedAudioManager {
    constructor(game = null) {
        this.game = game;
        
        // 3層アーキテクチャ
        this.audioCore = new AudioCore();
        this.audioEngine = new AudioEngine(this.audioCore);
        
        // システム状態
        this.isInitialized = false;
        this.isRunning = false;
        this.currentScene = 'menu';
        
        // 音量設定
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.3,
            sfx: 0.7
        };
        
        // BGM制御
        this.bgmState = {
            currentTrack: null,
            isPlaying: false,
            isPaused: false,
            fadeTarget: null
        };
        
        // 後方互換性レイヤー
        this.sounds = this.createCompatibilityLayer();
        
        // パフォーマンス監視
        this.systemPerformance = {
            totalSoundsPlayed: 0,
            averageLatency: 0,
            systemLoad: 0,
            lastUpdateTime: Date.now()
        };
        
        // 設定管理
        this.settings = {
            enableAdvancedEffects: true,
            enableBGM: true,
            enableSFX: true,
            maxConcurrentSounds: 6,
            quality: 'high' // high, medium, low
        };
        
        console.log('🎭 UnifiedAudioManager: 統合音響管理システム初期化');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🎭 UnifiedAudioManager: 初期化開始...');
            
            // 設定読み込み
            this.loadSettings();
            
            // AudioEngine初期化
            const engineResult = await this.audioEngine.initialize();
            if (!engineResult.success) {
                throw new Error(`AudioEngine initialization failed: ${engineResult.error}`);
            }
            
            // 音量設定適用
            this.applyVolumeSettings();
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('✅ UnifiedAudioManager: システム初期化完了');
            return { success: true, message: 'UnifiedAudioManager initialized' };
            
        } catch (error) {
            console.error('❌ UnifiedAudioManager: 初期化失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 後方互換性レイヤー作成
     */
    createCompatibilityLayer() {
        return {
            // 武器射撃音
            shoot: (weaponType = 'plasma', comboCount = 0, skillLevel = 0) => {
                return this.playShootSound(weaponType, this.calculateIntensity(comboCount, skillLevel));
            },
            
            // 敵関連音響
            enemyKill: () => this.playEnemySound('death', 'medium'),
            enemyHit: () => this.playEnemySound('hit', 'small'),
            
            // 武器ピックアップ音響
            pickupNuke: () => this.playUISound('pickup'),
            pickupSuperHoming: () => this.playUISound('pickup'),
            pickupSuperShotgun: () => this.playUISound('pickup'),
            pickupHealth: () => this.playUISound('pickup'),
            pickupSpeed: () => this.playUISound('pickup'),
            
            // UI・システム音響
            upgrade: () => this.playUISound('levelup'),
            levelUp: () => this.playUISound('levelup'),
            pickup: () => this.playUISound('pickup'),
            reload: () => this.playUISound('reload'),
            damage: () => this.playUISound('damage'),
            
            // BGM制御
            playBGM: (scene) => this.playBGM(scene),
            stopBGM: () => this.stopBGM(),
            pauseBGM: () => this.pauseBGM(),
            resumeBGM: () => this.resumeBGM()
        };
    }
    
    /**
     * 統一射撃音再生API
     */
    async playShootSound(weaponType, intensity = 1.0) {
        if (!this.settings.enableSFX) return { success: false, reason: 'sfx_disabled' };
        
        try {
            // 武器タイプマッピング
            const weaponMap = {
                'plasma': 'plasma',
                'nuke': 'nuke', 
                'nukeLauncher': 'nuke',
                'superHoming': 'superHoming',
                'superHomingGun': 'superHoming',
                'superShotgun': 'superShotgun',
                'shotgun': 'superShotgun'
            };
            
            const instrumentName = weaponMap[weaponType] || 'plasma';
            const adjustedIntensity = intensity * this.volumeSettings.sfx * this.volumeSettings.master;
            
            // 武器に応じた音響パラメータ
            let note = 'C4';
            let duration = 0.3;
            
            switch (instrumentName) {
                case 'plasma':
                    note = 'C5';
                    duration = 0.15;
                    break;
                case 'nuke':
                    note = 'C2';
                    duration = 0.8;
                    break;
                case 'superHoming':
                    note = 'G4';
                    duration = 0.25;
                    break;
                case 'superShotgun':
                    note = 'C3';
                    duration = 0.4;
                    break;
            }
            
            const result = await this.audioEngine.playSound(instrumentName, note, duration, adjustedIntensity);
            
            if (result.success) {
                this.systemPerformance.totalSoundsPlayed++;
                console.log(`🔫 UnifiedAudioManager: ${weaponType} 射撃音再生 (強度: ${(intensity*100).toFixed(1)}%)`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ UnifiedAudioManager: ${weaponType} 射撃音再生失敗:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 敵音響再生API
     */
    async playEnemySound(action, enemyType = 'medium') {
        if (!this.settings.enableSFX) return { success: false, reason: 'sfx_disabled' };
        
        try {
            const instrumentName = action === 'hit' ? 'enemyHit' : 'enemyDeath';
            const adjustedIntensity = this.volumeSettings.sfx * this.volumeSettings.master;
            
            // 敵タイプに応じた音響調整
            let note = 'C4';
            let duration = 0.3;
            
            switch (enemyType) {
                case 'small':
                    note = 'C5';
                    duration = action === 'hit' ? 0.1 : 0.2;
                    break;
                case 'medium':
                    note = 'C4';
                    duration = action === 'hit' ? 0.15 : 0.3;
                    break;
                case 'large':
                    note = 'C3';
                    duration = action === 'hit' ? 0.2 : 0.5;
                    break;
                case 'boss':
                    note = 'C2';
                    duration = action === 'hit' ? 0.3 : 0.8;
                    break;
            }
            
            const result = await this.audioEngine.playSound(instrumentName, note, duration, adjustedIntensity);
            
            if (result.success) {
                console.log(`👾 UnifiedAudioManager: 敵${action}音再生 (${enemyType})`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ UnifiedAudioManager: 敵${action}音再生失敗:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * UI音響再生API
     */
    async playUISound(soundType) {
        if (!this.settings.enableSFX) return { success: false, reason: 'sfx_disabled' };
        
        try {
            const instrumentName = 'ui';
            const adjustedIntensity = this.volumeSettings.sfx * this.volumeSettings.master;
            
            // UI音タイプに応じた設定
            let note = 'C4';
            let duration = 0.3;
            
            switch (soundType) {
                case 'levelup':
                    note = 'C5';
                    duration = 0.8;
                    break;
                case 'pickup':
                    note = 'E5';
                    duration = 0.2;
                    break;
                case 'reload':
                    note = 'G4';
                    duration = 0.4;
                    break;
                case 'damage':
                    note = 'C3';
                    duration = 0.5;
                    break;
                case 'button':
                    note = 'A4';
                    duration = 0.1;
                    break;
                default:
                    note = 'C4';
                    duration = 0.3;
            }
            
            const result = await this.audioEngine.playSound(instrumentName, note, duration, adjustedIntensity);
            
            if (result.success) {
                console.log(`🎵 UnifiedAudioManager: UI音再生 (${soundType})`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ UnifiedAudioManager: UI音再生失敗:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM再生API
     */
    async playBGM(scene) {
        if (!this.settings.enableBGM) return { success: false, reason: 'bgm_disabled' };
        
        try {
            // 既存BGM停止
            if (this.bgmState.isPlaying) {
                await this.stopBGM();
            }
            
            this.currentScene = scene;
            this.bgmState.currentTrack = scene;
            this.bgmState.isPlaying = true;
            this.bgmState.isPaused = false;
            
            console.log(`🎼 UnifiedAudioManager: BGM再生開始 (${scene})`);
            
            // 実際のBGM再生は将来実装予定
            // 現在は状態管理のみ
            
            return { success: true, scene, message: 'BGM playback started' };
            
        } catch (error) {
            console.error(`❌ UnifiedAudioManager: BGM再生失敗:`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM停止
     */
    async stopBGM() {
        try {
            this.bgmState.isPlaying = false;
            this.bgmState.isPaused = false;
            this.bgmState.currentTrack = null;
            
            console.log('🔇 UnifiedAudioManager: BGM停止');
            return { success: true, message: 'BGM stopped' };
            
        } catch (error) {
            console.error('❌ UnifiedAudioManager: BGM停止失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM一時停止
     */
    async pauseBGM() {
        if (this.bgmState.isPlaying && !this.bgmState.isPaused) {
            this.bgmState.isPaused = true;
            console.log('⏸️ UnifiedAudioManager: BGM一時停止');
            return { success: true, message: 'BGM paused' };
        }
        return { success: false, reason: 'bgm_not_playing' };
    }
    
    /**
     * BGM再開
     */
    async resumeBGM() {
        if (this.bgmState.isPlaying && this.bgmState.isPaused) {
            this.bgmState.isPaused = false;
            console.log('▶️ UnifiedAudioManager: BGM再開');
            return { success: true, message: 'BGM resumed' };
        }
        return { success: false, reason: 'bgm_not_paused' };
    }
    
    /**
     * 音量設定
     */
    setVolume(type, volume) {
        const validTypes = ['master', 'bgm', 'sfx'];
        if (!validTypes.includes(type)) {
            console.warn(`⚠️ UnifiedAudioManager: 無効な音量タイプ: ${type}`);
            return;
        }
        
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        this.applyVolumeSettings();
        this.saveSettings();
        
        console.log(`🎚️ UnifiedAudioManager: ${type}音量設定 ${(volume*100).toFixed(1)}%`);
    }
    
    /**
     * 音量設定適用
     */
    applyVolumeSettings() {
        if (this.audioCore && this.audioCore.isInitialized) {
            this.audioCore.setMasterVolume(this.volumeSettings.master);
        }
    }
    
    /**
     * 強度計算（コンボ・スキルベース）
     */
    calculateIntensity(comboCount = 0, skillLevel = 0) {
        const baseIntensity = 1.0;
        const comboBonus = Math.min(0.5, comboCount * 0.02);  // 最大50%増
        const skillBonus = Math.min(0.3, skillLevel * 0.05);  // 最大30%増
        
        return Math.min(2.0, baseIntensity + comboBonus + skillBonus);
    }
    
    /**
     * 設定保存
     */
    saveSettings() {
        try {
            const settingsData = {
                volume: this.volumeSettings,
                settings: this.settings
            };
            localStorage.setItem('unifiedAudioSettings', JSON.stringify(settingsData));
        } catch (error) {
            console.warn('⚠️ UnifiedAudioManager: 設定保存失敗:', error);
        }
    }
    
    /**
     * 設定読み込み
     */
    loadSettings() {
        try {
            const settingsData = localStorage.getItem('unifiedAudioSettings');
            if (settingsData) {
                const parsed = JSON.parse(settingsData);
                if (parsed.volume) {
                    this.volumeSettings = { ...this.volumeSettings, ...parsed.volume };
                }
                if (parsed.settings) {
                    this.settings = { ...this.settings, ...parsed.settings };
                }
                console.log('✅ UnifiedAudioManager: 設定読み込み完了');
            }
        } catch (error) {
            console.warn('⚠️ UnifiedAudioManager: 設定読み込み失敗:', error);
        }
    }
    
    /**
     * システム診断
     */
    diagnose() {
        return {
            system: {
                initialized: this.isInitialized,
                running: this.isRunning,
                scene: this.currentScene
            },
            volume: this.volumeSettings,
            bgm: this.bgmState,
            settings: this.settings,
            performance: {
                ...this.systemPerformance,
                uptime: Date.now() - this.systemPerformance.lastUpdateTime
            },
            audioEngine: this.audioEngine.getEngineStats(),
            audioCore: this.audioCore.diagnose()
        };
    }
    
    /**
     * システム更新（ゲームループ統合）
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isRunning) return;
        
        try {
            // AudioEngine更新
            if (this.audioEngine && typeof this.audioEngine.update === 'function') {
                this.audioEngine.update(deltaTime);
            }
            
            // パフォーマンス監視更新
            this.updatePerformanceMetrics();
            
        } catch (error) {
            console.error('❌ UnifiedAudioManager: 更新エラー:', error);
        }
    }
    
    /**
     * パフォーマンス指標更新
     */
    updatePerformanceMetrics() {
        const now = Date.now();
        const deltaTime = now - this.systemPerformance.lastUpdateTime;
        
        // システム負荷計算
        const coreState = this.audioCore.getContextState();
        const engineStats = this.audioEngine.getEngineStats();
        
        this.systemPerformance.systemLoad = (
            (coreState.objectCount / coreState.maxObjects) * 0.5 +
            (engineStats.performance.activeSounds / this.settings.maxConcurrentSounds) * 0.5
        );
        
        this.systemPerformance.lastUpdateTime = now;
    }
    
    /**
     * システム停止
     */
    stop() {
        this.isRunning = false;
        
        if (this.audioEngine) {
            this.audioEngine.stop();
        }
        
        console.log('⏹️ UnifiedAudioManager: システム停止');
    }
    
    /**
     * システム再開
     */
    start() {
        if (this.isInitialized) {
            this.isRunning = true;
            
            if (this.audioEngine) {
                this.audioEngine.start();
            }
            
            console.log('▶️ UnifiedAudioManager: システム再開');
        }
    }
    
    /**
     * システムクリーンアップ
     */
    dispose() {
        console.log('🧹 UnifiedAudioManager: システム完全クリーンアップ開始');
        
        try {
            this.stop();
            
            // BGM停止
            this.stopBGM();
            
            // AudioEngine破棄
            if (this.audioEngine) {
                this.audioEngine.dispose();
                this.audioEngine = null;
            }
            
            // AudioCore破棄
            if (this.audioCore) {
                this.audioCore.dispose();
                this.audioCore = null;
            }
            
            // 設定保存
            this.saveSettings();
            
            this.isInitialized = false;
            this.isRunning = false;
            
            console.log('✅ UnifiedAudioManager: システム完全クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ UnifiedAudioManager: クリーンアップエラー:', error);
        }
    }
}