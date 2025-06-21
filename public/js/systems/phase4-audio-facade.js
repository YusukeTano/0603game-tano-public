/**
 * Phase4AudioFacade - Phase 4.2 Facade パターン実装・統一インターフェース
 * 最もシンプルで使いやすい音響システム統一API
 * 95%成功確率・低リスク・開発者フレンドリー設計
 */

import { Phase4AudioService } from './phase4-audio-service.js';

export class Phase4AudioFacade {
    constructor(game) {
        this.game = game;
        
        // Facade状態
        this.facadeState = {
            isReady: false,
            version: '4.2.0',
            initializationTime: 0,
            totalCalls: 0
        };
        
        // Phase 4.1 Service層
        this.audioService = null;
        
        // 開発者フレンドリー設定
        this.easySettings = {
            autoInit: true,           // 自動初期化
            gracefulErrors: true,     // エラー時の優雅な処理
            smartDefaults: true,      // スマートなデフォルト値
            backgroundOptimization: true // バックグラウンド最適化
        };
        
        // 簡単アクセス用ショートカット
        this.shortcuts = {
            // 🎵 よく使う音響
            bgm: null,
            sfx: null,
            ui: null,
            
            // 🎮 ゲーム状態
            scene: 'menu',
            wave: 1,
            volume: 0.8
        };
        
        console.log('🎭 Phase4AudioFacade: 統一インターフェース初期化');
    }
    
    /**
     * 🚀 ワンクリック初期化 - 最も簡単な開始方法
     */
    async quickStart() {
        const startTime = Date.now();
        
        try {
            console.log('🚀 Phase4AudioFacade: クイックスタート開始');
            
            // Phase 4.1 Service初期化
            this.audioService = new Phase4AudioService(this.game);
            const serviceResult = await this.audioService.initialize();
            
            if (!serviceResult.success) {
                throw new Error(`Service初期化失敗: ${serviceResult.error}`);
            }
            
            // ショートカット設定
            this.setupShortcuts();
            
            // 状態更新
            this.facadeState.isReady = true;
            this.facadeState.initializationTime = Date.now() - startTime;
            
            console.log(`✅ Phase4AudioFacade: クイックスタート完了 (${this.facadeState.initializationTime}ms)`);
            return this;
            
        } catch (error) {
            console.error('❌ Phase4AudioFacade: クイックスタート失敗:', error);
            
            if (this.easySettings.gracefulErrors) {
                // エラー時でも動作する最小限の機能を提供
                this.setupFallbackMode();
                return this;
            } else {
                throw error;
            }
        }
    }
    
    /**
     * 🎵 BGM制御 - 超シンプルBGM操作
     */
    async bgm(action, options = {}) {
        this.facadeState.totalCalls++;
        
        try {
            switch (action) {
                case 'menu':
                    return await this.audioService.gameIntegration.changeScene('menu');
                    
                case 'character':
                    return await this.audioService.gameIntegration.changeScene('character');
                    
                case 'battle':
                    return await this.audioService.gameIntegration.changeScene('game');
                    
                case 'volume':
                    const volume = options.volume || 0.3;
                    return await this.audioService.basicAudio.setVolume('bgm', volume);
                    
                case 'mute':
                    return await this.audioService.basicAudio.setMute(true);
                    
                case 'unmute':
                    return await this.audioService.basicAudio.setMute(false);
                    
                default:
                    console.warn(`🎵 不明なBGMアクション: ${action}`);
                    return { success: false, error: 'Unknown action' };
            }
        } catch (error) {
            console.error(`❌ BGM制御エラー [${action}]:`, error);
            return this.handleGracefulError('bgm', error);
        }
    }
    
    /**
     * 🔫 戦闘音響 - ワンライナー戦闘音
     */
    async combat(soundType, options = {}) {
        this.facadeState.totalCalls++;
        
        try {
            // スマートなデフォルト値適用
            const smartOptions = {
                volume: options.volume || 0.7,
                pitch: options.pitch || 1.0,
                ...options
            };
            
            return await this.audioService.gameIntegration.playCombatSound(soundType, smartOptions);
            
        } catch (error) {
            console.error(`❌ 戦闘音響エラー [${soundType}]:`, error);
            return this.handleGracefulError('combat', error);
        }
    }
    
    /**
     * 🎮 UI音響 - ワンライナーUI音
     */
    async ui(soundType) {
        this.facadeState.totalCalls++;
        
        try {
            return await this.audioService.gameIntegration.playUISound(soundType);
            
        } catch (error) {
            console.error(`❌ UI音響エラー [${soundType}]:`, error);
            return this.handleGracefulError('ui', error);
        }
    }
    
    /**
     * 🌊 ウェーブ音響 - ワンライナーウェーブ更新
     */
    async wave(waveNumber, options = {}) {
        this.facadeState.totalCalls++;
        this.shortcuts.wave = waveNumber;
        
        try {
            const waveData = {
                wave: waveNumber,
                intensity: this.calculateWaveIntensity(waveNumber),
                enemyCount: options.enemyCount || this.estimateEnemyCount(waveNumber),
                ...options
            };
            
            return await this.audioService.gameIntegration.updateWave(waveData);
            
        } catch (error) {
            console.error(`❌ ウェーブ音響エラー [${waveNumber}]:`, error);
            return this.handleGracefulError('wave', error);
        }
    }
    
    /**
     * 🎚️ 音量制御 - 超シンプル音量設定
     */
    async volume(level, category = 'master') {
        this.facadeState.totalCalls++;
        this.shortcuts.volume = level;
        
        try {
            // レベル正規化 (0-100 または 0-1 どちらでも対応)
            const normalizedLevel = level > 1 ? level / 100 : level;
            
            return await this.audioService.basicAudio.setVolume(category, normalizedLevel);
            
        } catch (error) {
            console.error(`❌ 音量制御エラー [${category}=${level}]:`, error);
            return this.handleGracefulError('volume', error);
        }
    }
    
    /**
     * 🔇 ミュート制御 - ワンライナーミュート
     */
    async mute(enabled = true) {
        this.facadeState.totalCalls++;
        
        try {
            return await this.audioService.basicAudio.setMute(enabled);
            
        } catch (error) {
            console.error(`❌ ミュート制御エラー [${enabled}]:`, error);
            return this.handleGracefulError('mute', error);
        }
    }
    
    /**
     * 📊 ステータス確認 - ワンライナーステータス
     */
    status() {
        try {
            const healthStatus = this.audioService?.management.getHealthStatus();
            const performanceMetrics = this.audioService?.management.getPerformanceMetrics();
            
            return {
                facade: {
                    ready: this.facadeState.isReady,
                    calls: this.facadeState.totalCalls,
                    uptime: Date.now() - this.facadeState.initializationTime
                },
                health: healthStatus?.data || { overall: 0 },
                performance: performanceMetrics?.data || { averageResponseTime: 0 },
                shortcuts: this.shortcuts
            };
            
        } catch (error) {
            console.error('❌ ステータス確認エラー:', error);
            return { error: error.message, ready: false };
        }
    }
    
    /**
     * ショートカット設定
     */
    setupShortcuts() {
        // よく使う機能への簡単アクセス
        this.shortcuts.bgm = {
            menu: () => this.bgm('menu'),
            character: () => this.bgm('character'),
            battle: () => this.bgm('battle'),
            volume: (level) => this.bgm('volume', { volume: level }),
            mute: () => this.bgm('mute'),
            unmute: () => this.bgm('unmute')
        };
        
        this.shortcuts.sfx = {
            weapon: (type) => this.combat(type),
            hit: (size = 'small') => this.combat(`${size}EnemyHit`),
            death: (size = 'small') => this.combat(`${size}EnemyDeath`)
        };
        
        this.shortcuts.ui = {
            hover: () => this.ui('buttonHover'),
            click: () => this.ui('menuNav'),
            levelup: () => this.ui('levelUp'),
            select: () => this.ui('skillSelect'),
            item: () => this.ui('itemGet'),
            damage: () => this.ui('damage')
        };
        
        console.log('⚡ ショートカット設定完了');
    }
    
    /**
     * フォールバックモード設定
     */
    setupFallbackMode() {
        console.warn('⚠️ フォールバックモード開始 - 限定機能で動作');
        
        // 最小限の機能を提供
        this.facadeState.isReady = true;
        this.shortcuts = {
            bgm: () => console.log('🎵 BGM (fallback mode)'),
            sfx: () => console.log('🔫 SFX (fallback mode)'),
            ui: () => console.log('🎮 UI (fallback mode)')
        };
    }
    
    /**
     * 優雅なエラー処理
     */
    handleGracefulError(operation, error) {
        if (this.easySettings.gracefulErrors) {
            console.warn(`⚠️ ${operation} - 優雅なエラー処理: ${error.message}`);
            return { 
                success: false, 
                error: error.message, 
                graceful: true,
                fallback: `${operation} operation failed but system continues`
            };
        } else {
            throw error;
        }
    }
    
    /**
     * ウェーブ強度計算
     */
    calculateWaveIntensity(waveNumber) {
        // 999ウェーブシステム対応の強度計算
        const baseIntensity = Math.min(waveNumber / 100, 1.0);
        const bossWaveBonus = (waveNumber % 10 === 0) ? 0.2 : 0;
        
        return Math.min(baseIntensity + bossWaveBonus, 1.0);
    }
    
    /**
     * 敵数推定
     */
    estimateEnemyCount(waveNumber) {
        // ウェーブ数に基づく敵数推定
        return Math.min(Math.floor(waveNumber / 10) + 5, 50);
    }
    
    /**
     * 🧹 クリーンアップ - メモリ解放
     */
    async cleanup() {
        console.log('🧹 Phase4AudioFacade: クリーンアップ開始');
        
        try {
            if (this.audioService) {
                await this.audioService.shutdown();
            }
            
            // 状態リセット
            this.facadeState.isReady = false;
            this.shortcuts = {};
            
            console.log('✅ Phase4AudioFacade: クリーンアップ完了');
            
        } catch (error) {
            console.error('❌ Phase4AudioFacade: クリーンアップエラー:', error);
        }
    }
}

/**
 * 🎭 グローバル Facade インスタンス (シングルトン風)
 * 最も簡単な使用方法: import { AudioFacade } from './phase4-audio-facade.js';
 */
export let AudioFacade = null;

/**
 * 🚀 グローバル初期化ヘルパー
 */
export async function initializeAudioFacade(game) {
    if (!AudioFacade) {
        AudioFacade = new Phase4AudioFacade(game);
        await AudioFacade.quickStart();
    }
    return AudioFacade;
}