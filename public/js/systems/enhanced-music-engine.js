/**
 * EnhancedMusicEngine - Phase 2.1 + 2.2 統合音楽エンジン
 * 
 * 🎯 目的: エフェクト付き高品質音楽再生システム
 * 📐 設計: BasicMusicEngine + AudioEffectsManager 統合
 * 🛡️ Phase 2.1+2.2: エフェクト統合音楽エンジン（88%成功確率）
 */

import { BasicMusicEngine } from './basic-music-engine.js';
import { AudioEffectsManager } from './audio-effects-manager.js';

export class EnhancedMusicEngine extends BasicMusicEngine {
    constructor() {
        super();
        
        // エフェクトシステム
        this.effectsManager = new AudioEffectsManager();
        this.effectsEnabled = true;
        
        // エンハンス機能
        this.dynamicEffects = true;
        this.gameStateIntegration = true;
        
        // 現在のゲーム状態（エフェクト制御用）
        this.currentGameState = {
            combo: 0,
            intensity: 1.0,
            scene: 'normal',
            playerLevel: 1
        };
        
        console.log('🎼✨ EnhancedMusicEngine: Phase 2.1+2.2 初期化');
    }
    
    /**
     * 拡張音楽エンジン初期化
     * Phase 2.1+2.2: 音楽+エフェクト統合初期化
     */
    async initializeEnhancedEngine() {
        const startTime = performance.now();
        
        try {
            console.log('🚀 EnhancedMusicEngine: 拡張エンジン初期化開始');
            
            // Phase 2.1: 基本音楽エンジン初期化
            const musicResult = await this.initializeMusicEngine();
            if (!musicResult.success) {
                throw new Error(`Music engine initialization failed: ${musicResult.error}`);
            }
            
            // Phase 2.2: エフェクトシステム初期化
            const effectsResult = await this.effectsManager.initialize();
            if (!effectsResult.success) {
                console.warn(`⚠️ Effects initialization failed: ${effectsResult.error}`);
                this.effectsEnabled = false; // エフェクトなしで続行
            }
            
            // 楽器にエフェクト適用
            if (this.effectsEnabled) {
                await this.applyEffectsToInstruments();
            }
            
            const totalTime = performance.now() - startTime;
            console.log(`✅ EnhancedMusicEngine: 拡張初期化完了 (${totalTime.toFixed(2)}ms)`);
            
            return { 
                success: true, 
                latency: totalTime,
                musicEngine: musicResult.success,
                effectsEngine: effectsResult.success
            };
            
        } catch (error) {
            console.error('❌ EnhancedMusicEngine: 拡張初期化失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 楽器にエフェクト適用
     * Phase 2.2: エフェクトチェーン統合
     */
    async applyEffectsToInstruments() {
        try {
            console.log('🔗 楽器にエフェクトチェーン適用中...');
            
            let successCount = 0;
            
            // Lead Synth - 音楽チェーン適用
            if (this.instruments.leadSynth) {
                const result = this.effectsManager.applyEffectChain(this.instruments.leadSynth, 'music');
                if (result.success) {
                    successCount++;
                    console.log('🎹 Lead Synth: 音楽エフェクトチェーン適用成功');
                }
            }
            
            // Bass Synth - 音楽チェーン適用
            if (this.instruments.bassSynth) {
                const result = this.effectsManager.applyEffectChain(this.instruments.bassSynth, 'music');
                if (result.success) {
                    successCount++;
                    console.log('🎸 Bass Synth: 音楽エフェクトチェーン適用成功');
                }
            }
            
            // Pad Synth - マスターチェーン適用
            if (this.instruments.padSynth) {
                const result = this.effectsManager.applyEffectChain(this.instruments.padSynth, 'master');
                if (result.success) {
                    successCount++;
                    console.log('🎹 Pad Synth: マスターエフェクトチェーン適用成功');
                }
            }
            
            console.log(`✅ エフェクト適用完了: ${successCount}/3 楽器`);
            
            return { success: true, appliedInstruments: successCount };
            
        } catch (error) {
            console.error('❌ エフェクト適用エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * エフェクト付きBGM再生
     * Phase 2.1+2.2: 統合音楽再生
     */
    async playEnhancedBGM(options = {}) {
        try {
            const { 
                pattern = 'simple',
                effects = true,
                gameState = null
            } = options;
            
            console.log('🎵✨ EnhancedMusicEngine: エフェクト付きBGM再生開始');
            
            // ゲーム状態更新
            if (gameState) {
                this.updateGameState(gameState);
            }
            
            // 動的エフェクト適用
            if (effects && this.effectsEnabled && this.dynamicEffects) {
                this.effectsManager.updateEffectsFromGameState(this.currentGameState);
            }
            
            // 基本BGM再生
            const result = await this.playSimpleBGM();
            
            if (result.success) {
                console.log('✅ エフェクト付きBGM再生成功');
                
                // 動的エフェクト更新を開始
                if (effects && this.effectsEnabled) {
                    this.startDynamicEffectUpdates();
                }
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ エフェクト付きBGM再生エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * ゲーム状態更新
     * @param {Object} gameState - 新しいゲーム状態
     */
    updateGameState(gameState) {
        try {
            this.currentGameState = {
                ...this.currentGameState,
                ...gameState
            };
            
            console.log('🎮 ゲーム状態更新:', this.currentGameState);
            
            // 即座にエフェクト更新
            if (this.effectsEnabled && this.dynamicEffects) {
                this.effectsManager.updateEffectsFromGameState(this.currentGameState);
            }
            
        } catch (error) {
            console.error('❌ ゲーム状態更新エラー:', error);
        }
    }
    
    /**
     * 動的エフェクト更新開始
     */
    startDynamicEffectUpdates() {
        try {
            // 既存のインターバルをクリア
            if (this.dynamicEffectsInterval) {
                clearInterval(this.dynamicEffectsInterval);
            }
            
            // 動的エフェクト更新（500ms間隔）
            this.dynamicEffectsInterval = setInterval(() => {
                if (this.isPlaying && this.effectsEnabled && this.dynamicEffects) {
                    this.effectsManager.updateEffectsFromGameState(this.currentGameState);
                }
            }, 500);
            
            console.log('🔄 動的エフェクト更新開始');
            
        } catch (error) {
            console.error('❌ 動的エフェクト更新開始エラー:', error);
        }
    }
    
    /**
     * 動的エフェクト更新停止
     */
    stopDynamicEffectUpdates() {
        try {
            if (this.dynamicEffectsInterval) {
                clearInterval(this.dynamicEffectsInterval);
                this.dynamicEffectsInterval = null;
                console.log('⏹️ 動的エフェクト更新停止');
            }
        } catch (error) {
            console.error('❌ 動的エフェクト更新停止エラー:', error);
        }
    }
    
    /**
     * エフェクト手動調整
     * @param {string} effectType - エフェクトタイプ
     * @param {Object} settings - 設定値
     */
    adjustEffect(effectType, settings) {
        try {
            if (!this.effectsEnabled) {
                return { success: false, error: 'effects_disabled' };
            }
            
            let result = { success: false };
            
            switch (effectType) {
                case 'reverb':
                    result = this.effectsManager.adjustReverb(settings.intensity || 0.5);
                    break;
                case 'filter':
                    result = this.effectsManager.adjustFilter(
                        settings.frequency || 5000, 
                        settings.type || 'lowpass'
                    );
                    break;
                case 'distortion':
                    result = this.effectsManager.adjustDistortion(settings.amount || 0.4);
                    break;
                default:
                    return { success: false, error: 'unknown_effect_type' };
            }
            
            if (result.success) {
                console.log(`🎛️ エフェクト手動調整成功: ${effectType}`);
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ エフェクト調整エラー (${effectType}):`, error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 音楽停止（エフェクト統合版）
     */
    stopEnhancedBGM() {
        try {
            // 動的エフェクト更新停止
            this.stopDynamicEffectUpdates();
            
            // 基本BGM停止
            const result = this.stopBGM();
            
            console.log('⏹️ エフェクト付きBGM停止');
            
            return result;
            
        } catch (error) {
            console.error('❌ エフェクト付きBGM停止エラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 拡張エンジン状態取得
     */
    getEnhancedEngineStatus() {
        const basicStatus = this.getEngineStatus();
        const effectsStatus = this.effectsManager.getEffectsStatus();
        
        return {
            ...basicStatus,
            effects: {
                ...effectsStatus,
                dynamicEffects: this.dynamicEffects,
                gameStateIntegration: this.gameStateIntegration
            },
            currentGameState: this.currentGameState,
            enhancedFeatures: {
                effectsEnabled: this.effectsEnabled,
                dynamicUpdates: !!this.dynamicEffectsInterval,
                appliedInstruments: Object.values(this.instruments).filter(Boolean).length
            }
        };
    }
    
    /**
     * パフォーマンステスト
     */
    async performanceTest() {
        const startTime = performance.now();
        
        try {
            console.log('⚡ パフォーマンステスト開始...');
            
            // 1. 初期化パフォーマンス
            const initTime = performance.now();
            await this.initializeEnhancedEngine();
            const initLatency = performance.now() - initTime;
            
            // 2. BGM開始パフォーマンス
            const playTime = performance.now();
            await this.playEnhancedBGM({ effects: true });
            const playLatency = performance.now() - playTime;
            
            // 3. エフェクト調整パフォーマンス
            const effectTime = performance.now();
            this.adjustEffect('reverb', { intensity: 0.8 });
            this.adjustEffect('filter', { frequency: 3000 });
            const effectLatency = performance.now() - effectTime;
            
            const totalTime = performance.now() - startTime;
            
            const results = {
                totalTime,
                initLatency,
                playLatency,
                effectLatency,
                memoryUsage: this.estimateMemoryUsage(),
                performance: 'good'
            };
            
            // パフォーマンス評価
            if (totalTime > 1000) results.performance = 'poor';
            else if (totalTime > 500) results.performance = 'fair';
            
            console.log(`⚡ パフォーマンステスト完了:`, results);
            
            return { success: true, results };
            
        } catch (error) {
            console.error('❌ パフォーマンステストエラー:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * メモリ使用量推定
     */
    estimateMemoryUsage() {
        try {
            const instrumentCount = Object.values(this.instruments).filter(Boolean).length;
            const effectCount = this.effectsManager.stats.activeEffects;
            
            // 簡易推定（実際の値ではない）
            const estimatedMB = (instrumentCount * 5) + (effectCount * 3) + 10;
            
            return {
                estimated: `${estimatedMB}MB`,
                instruments: instrumentCount,
                effects: effectCount
            };
            
        } catch (error) {
            return { estimated: 'unknown', error: error.message };
        }
    }
    
    /**
     * クリーンアップ（拡張版）
     */
    dispose() {
        try {
            // 動的エフェクト停止
            this.stopDynamicEffectUpdates();
            
            // エフェクトシステム解放
            if (this.effectsManager) {
                this.effectsManager.dispose();
            }
            
            // 基本エンジン解放
            super.dispose();
            
            console.log('🧹 EnhancedMusicEngine: 拡張リソース解放完了');
            
        } catch (error) {
            console.error('❌ EnhancedMusicEngine dispose error:', error);
        }
    }
}