/**
 * AudioSceneController - Phase 3.1 シーン別音響状態制御
 * シーン遷移時のBGM制御・音響エフェクト・音量調整
 */

export class AudioSceneController {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        
        // シーン別音響設定
        this.sceneAudioConfigs = {
            menu: {
                bgm: 'menu',
                bgmVolume: 0.3,
                sfxVolume: 0.7,
                effects: ['reverb'],
                ambientSounds: [],
                musicEngine: 'piano'  // 改善ピアノBGM
            },
            characterSelect: {
                bgm: 'character',
                bgmVolume: 0.3,
                sfxVolume: 0.7,
                effects: ['reverb'],
                ambientSounds: [],
                musicEngine: 'piano'  // 改善ピアノBGM
            },
            playing: {
                bgm: 'battle',
                bgmVolume: 0.1,  // 戦闘中は小さめ
                sfxVolume: 0.8,  // 効果音は大きめ
                effects: ['compressor', 'limiter'],
                ambientSounds: ['battle-ambient'],
                musicEngine: 'chiptune'  // チップチューンBGM
            },
            paused: {
                bgm: null,  // BGM継続（音量下げる）
                bgmVolume: 0.1,
                sfxVolume: 0.5,
                effects: ['lowpass'],
                ambientSounds: [],
                musicEngine: null
            },
            gameOver: {
                bgm: null,
                bgmVolume: 0,
                sfxVolume: 0.6,
                effects: [],
                ambientSounds: [],
                musicEngine: null
            },
            marioMiniGame: {
                bgm: 'mario',
                bgmVolume: 0.4,
                sfxVolume: 0.8,
                effects: ['reverb'],
                ambientSounds: [],
                musicEngine: 'mario'
            }
        };
        
        // 現在のオーディオ状態
        this.currentAudioState = {
            scene: 'loading',
            bgmTrack: null,
            bgmVolume: 0,
            sfxVolume: 0.7,
            activeEffects: [],
            ambientSounds: [],
            lastTransitionTime: 0
        };
        
        // フェード制御
        this.fadeController = {
            activeFades: new Map(),
            defaultFadeTime: 0.5,
            crossfadeTime: 1.0
        };
        
        // パフォーマンス監視
        this.performance = {
            transitionCount: 0,
            totalTransitionTime: 0,
            averageTransitionTime: 0,
            errors: [],
            lastUpdate: Date.now()
        };
        
        console.log('🎵 AudioSceneController: シーン別音響制御システム初期化');
    }
    
    /**
     * オーディオマネージャー設定
     */
    setAudioManager(audioManager) {
        this.audioManager = audioManager;
        console.log('🔗 AudioSceneController: オーディオマネージャー連携設定完了');
    }
    
    /**
     * シーン遷移時の音響制御
     */
    async transitionToScene(targetScene, options = {}) {
        try {
            console.log(`🎵 AudioSceneController: ${this.currentAudioState.scene} → ${targetScene} 音響遷移開始`);
            
            const transitionStart = Date.now();
            const fromScene = this.currentAudioState.scene;
            const toConfig = this.sceneAudioConfigs[targetScene];
            
            if (!toConfig) {
                throw new Error(`Unknown audio scene: ${targetScene}`);
            }
            
            // BGM遷移処理
            await this.handleBGMTransition(fromScene, targetScene, toConfig, options);
            
            // 音量調整
            await this.adjustVolumeForScene(targetScene, toConfig);
            
            // エフェクト調整
            await this.adjustEffectsForScene(targetScene, toConfig);
            
            // 環境音調整
            await this.adjustAmbientSoundsForScene(targetScene, toConfig);
            
            // 状態更新
            this.updateAudioState(targetScene, toConfig);
            
            // パフォーマンス記録
            const transitionTime = Date.now() - transitionStart;
            this.recordTransitionPerformance(transitionTime);
            
            console.log(`✅ AudioSceneController: ${targetScene} 音響遷移完了 (${transitionTime}ms)`);
            
            return { success: true, scene: targetScene, duration: transitionTime };
            
        } catch (error) {
            console.error('❌ AudioSceneController: 音響遷移失敗:', error);
            this.performance.errors.push({ scene: targetScene, error: error.message, timestamp: Date.now() });
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM遷移処理
     */
    async handleBGMTransition(fromScene, toScene, toConfig, options) {
        const fromConfig = this.sceneAudioConfigs[fromScene];
        const fromBGM = fromConfig?.bgm;
        const toBGM = toConfig.bgm;
        
        try {
            if (!this.audioManager) {
                console.warn('⚠️ AudioSceneController: オーディオマネージャーが設定されていません');
                return;
            }
            
            if (fromBGM === toBGM && toBGM) {
                // 同じBGMの場合は音量調整のみ
                await this.adjustBGMVolume(toBGM, toConfig.bgmVolume);
                return;
            }
            
            if (fromBGM && toBGM) {
                // クロスフェード
                await this.crossfadeBGM(fromBGM, toBGM, toConfig);
            } else if (fromBGM && !toBGM) {
                // フェードアウト
                await this.fadeOutBGM(fromBGM);
            } else if (!fromBGM && toBGM) {
                // フェードイン
                await this.fadeInBGM(toBGM, toConfig);
            }
            
            console.log(`🎶 AudioSceneController: BGM遷移完了 ${fromBGM || 'none'} → ${toBGM || 'none'}`);
            
        } catch (error) {
            console.error('❌ AudioSceneController: BGM遷移エラー:', error);
            throw error;
        }
    }
    
    /**
     * クロスフェード実行
     */
    async crossfadeBGM(fromBGM, toBGM, toConfig) {
        const fadeTime = this.fadeController.crossfadeTime;
        
        try {
            // 音楽エンジン別処理
            if (toConfig.musicEngine === 'piano') {
                await this.audioManager.startBGM(toBGM);
            } else if (toConfig.musicEngine === 'chiptune') {
                await this.audioManager.startBGM(toBGM);
            } else {
                await this.audioManager.startBGM(toBGM);
            }
            
            // 音量調整
            setTimeout(() => {
                this.adjustBGMVolume(toBGM, toConfig.bgmVolume);
            }, fadeTime * 500); // フェード中間で音量調整
            
        } catch (error) {
            console.error('❌ AudioSceneController: クロスフェードエラー:', error);
            // フォールバック: 通常の停止→開始
            await this.audioManager.stopBGM();
            setTimeout(() => {
                this.audioManager.startBGM(toBGM);
            }, 100);
        }
    }
    
    /**
     * BGMフェードイン
     */
    async fadeInBGM(bgm, config) {
        try {
            await this.audioManager.startBGM(bgm);
            await this.adjustBGMVolume(bgm, config.bgmVolume);
        } catch (error) {
            console.error('❌ AudioSceneController: BGMフェードインエラー:', error);
        }
    }
    
    /**
     * BGMフェードアウト
     */
    async fadeOutBGM(bgm) {
        try {
            await this.audioManager.stopBGM();
        } catch (error) {
            console.error('❌ AudioSceneController: BGMフェードアウトエラー:', error);
        }
    }
    
    /**
     * BGM音量調整
     */
    async adjustBGMVolume(bgm, volume) {
        try {
            if (this.audioManager && typeof this.audioManager.setBGMVolume === 'function') {
                await this.audioManager.setBGMVolume(volume);
            }
        } catch (error) {
            console.error('❌ AudioSceneController: BGM音量調整エラー:', error);
        }
    }
    
    /**
     * シーン別音量調整
     */
    async adjustVolumeForScene(scene, config) {
        try {
            if (this.audioManager) {
                // マスター音量調整
                if (typeof this.audioManager.setMasterVolume === 'function') {
                    const masterVolume = config.bgmVolume * 1.2; // BGMベース
                    await this.audioManager.setMasterVolume(masterVolume);
                }
                
                // SFX音量調整
                if (typeof this.audioManager.setSFXVolume === 'function') {
                    await this.audioManager.setSFXVolume(config.sfxVolume);
                }
            }
        } catch (error) {
            console.error('❌ AudioSceneController: 音量調整エラー:', error);
        }
    }
    
    /**
     * シーン別エフェクト調整
     */
    async adjustEffectsForScene(scene, config) {
        try {
            if (this.audioManager && config.effects) {
                for (const effect of config.effects) {
                    await this.applyEffect(effect, scene);
                }
            }
        } catch (error) {
            console.error('❌ AudioSceneController: エフェクト調整エラー:', error);
        }
    }
    
    /**
     * エフェクト適用
     */
    async applyEffect(effectName, scene) {
        try {
            switch (effectName) {
                case 'reverb':
                    // リバーブ適用
                    if (this.audioManager.applyReverb) {
                        await this.audioManager.applyReverb(0.3);
                    }
                    break;
                case 'lowpass':
                    // ローパスフィルター適用（ポーズ時など）
                    if (this.audioManager.applyLowpass) {
                        await this.audioManager.applyLowpass(800);
                    }
                    break;
                case 'compressor':
                    // コンプレッサー適用
                    if (this.audioManager.applyCompressor) {
                        await this.audioManager.applyCompressor();
                    }
                    break;
            }
        } catch (error) {
            console.error(`❌ AudioSceneController: エフェクト${effectName}適用エラー:`, error);
        }
    }
    
    /**
     * 環境音調整
     */
    async adjustAmbientSoundsForScene(scene, config) {
        try {
            // 既存環境音停止
            await this.stopAllAmbientSounds();
            
            // 新しい環境音開始
            for (const ambientSound of config.ambientSounds) {
                await this.startAmbientSound(ambientSound);
            }
        } catch (error) {
            console.error('❌ AudioSceneController: 環境音調整エラー:', error);
        }
    }
    
    async stopAllAmbientSounds() {
        // 環境音停止処理
    }
    
    async startAmbientSound(soundName) {
        // 環境音開始処理
    }
    
    /**
     * オーディオ状態更新
     */
    updateAudioState(scene, config) {
        this.currentAudioState = {
            scene,
            bgmTrack: config.bgm,
            bgmVolume: config.bgmVolume,
            sfxVolume: config.sfxVolume,
            activeEffects: [...config.effects],
            ambientSounds: [...config.ambientSounds],
            lastTransitionTime: Date.now()
        };
    }
    
    /**
     * パフォーマンス記録
     */
    recordTransitionPerformance(transitionTime) {
        this.performance.transitionCount++;
        this.performance.totalTransitionTime += transitionTime;
        this.performance.averageTransitionTime = this.performance.totalTransitionTime / this.performance.transitionCount;
        this.performance.lastUpdate = Date.now();
    }
    
    /**
     * 現在の音響状態取得
     */
    getCurrentAudioState() {
        return { ...this.currentAudioState };
    }
    
    /**
     * シーン音響設定取得
     */
    getSceneAudioConfig(scene) {
        return this.sceneAudioConfigs[scene] || null;
    }
    
    /**
     * パフォーマンス情報取得
     */
    getPerformanceInfo() {
        return { ...this.performance };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            currentState: this.currentAudioState,
            availableScenes: Object.keys(this.sceneAudioConfigs),
            performance: this.performance,
            audioManagerConnected: !!this.audioManager
        };
    }
}