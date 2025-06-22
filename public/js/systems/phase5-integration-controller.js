/**
 * Phase 5.3 - Integration Controller
 * 
 * Phase 5全体の統合管理・game.jsへの段階的統合
 * - 安全統合レイヤーの管理
 * - 未統合システムの音響追加
 * - パフォーマンス最適化
 * - エッジケース対応
 */

import { Phase5SafeIntegrationLayer } from './phase5-safe-integration-layer.js';
import { Phase4AudioFacade } from './phase4-audio-facade.js';
import { Phase5PerformanceOptimizer } from './phase5-performance-optimizer.js';
import { Phase5EdgeCaseHandler } from './phase5-edge-case-handler.js';

export class Phase5IntegrationController {
    constructor(game) {
        this.game = game;
        this.initialized = false;
        
        // Phase 5コンポーネント
        this.safeIntegrationLayer = null;
        this.audioFacade = null;
        this.performanceOptimizer = null;
        this.edgeCaseHandler = null;
        
        // 統合状態
        this.integrationStatus = {
            phase: '5.3',
            startTime: Date.now(),
            integratedSystems: [],
            pendingSystems: [
                'pickupSystem',
                'levelSystem', 
                'comboSystem',
                'marioMiniGame',
                'backgroundSystem'
            ]
        };
        
        // 音響設定
        this.audioConfig = {
            // アイテム取得音
            pickup: {
                health: { type: 'synth', pitch: 'C5', duration: 0.2 },
                speed: { type: 'synth', pitch: 'E5', duration: 0.2 },
                dash: { type: 'synth', pitch: 'G5', duration: 0.2 },
                experience: { type: 'synth', pitch: 'A4', duration: 0.1 }
            },
            
            // レベルアップ音
            levelUp: {
                standard: { type: 'chord', notes: ['C4', 'E4', 'G4'], duration: 0.5 },
                milestone: { type: 'chord', notes: ['C4', 'E4', 'G4', 'C5'], duration: 0.8 }
            },
            
            // コンボ音
            combo: {
                start: { type: 'synth', pitch: 'C4', duration: 0.1 },
                increment: { type: 'synth', pitch: 'E4', duration: 0.1 },
                max: { type: 'chord', notes: ['C4', 'E4', 'G4'], duration: 0.3 }
            },
            
            // マリオミニゲーム音
            marioGame: {
                jump: { type: 'synth', pitch: 'G4', duration: 0.2 },
                coin: { type: 'synth', pitch: 'B5', duration: 0.1 },
                death: { type: 'noise', duration: 0.3 },
                success: { type: 'chord', notes: ['C5', 'E5', 'G5'], duration: 0.5 }
            },
            
            // 環境音
            environment: {
                ambience: { type: 'ambient', volume: 0.3 },
                tension: { type: 'drone', volume: 0.2 }
            }
        };
        
        console.log('🎮 Phase5IntegrationController: 統合コントローラー作成');
    }
    
    /**
     * Phase 5統合初期化
     */
    async initialize() {
        try {
            console.log('🚀 Phase5Integration: 初期化開始');
            
            // Phase 4 Facade取得または作成
            await this.initializeAudioFacade();
            
            // 安全統合レイヤー初期化
            this.safeIntegrationLayer = new Phase5SafeIntegrationLayer(this.game);
            const safetyResult = await this.safeIntegrationLayer.initialize();
            
            if (!safetyResult.success) {
                throw new Error('安全統合レイヤー初期化失敗');
            }
            
            // パフォーマンス最適化システム初期化
            this.performanceOptimizer = new Phase5PerformanceOptimizer(this.game);
            const perfResult = await this.performanceOptimizer.initialize();
            
            if (!perfResult.success) {
                console.warn('⚠️ パフォーマンス最適化システム初期化失敗（続行）');
            }
            
            // エッジケース対応システム初期化
            this.edgeCaseHandler = new Phase5EdgeCaseHandler(this.game);
            const edgeResult = await this.edgeCaseHandler.initialize();
            
            if (!edgeResult.success) {
                console.warn('⚠️ エッジケース対応システム初期化失敗（続行）');
            }
            
            // 基本統合開始
            await this.startBasicIntegration();
            
            this.initialized = true;
            
            console.log('✅ Phase5Integration: 初期化完了');
            return { 
                success: true, 
                phase: '5.3',
                integratedSystems: this.integrationStatus.integratedSystems 
            };
            
        } catch (error) {
            console.error('❌ Phase5Integration: 初期化失敗', error);
            return { success: false, error };
        }
    }
    
    /**
     * Audio Facade初期化
     */
    async initializeAudioFacade() {
        try {
            // Phase 4 Facadeを作成
            this.audioFacade = new Phase4AudioFacade(
                this.game.audioSystem,
                this.game.phase3Manager
            );
            
            // 初期化は既に完了しているはず
            console.log('✅ Phase4AudioFacade 準備完了');
            
        } catch (error) {
            console.error('❌ AudioFacade初期化エラー:', error);
            throw error;
        }
    }
    
    /**
     * 基本統合開始
     */
    async startBasicIntegration() {
        console.log('🔧 基本システム統合開始');
        
        // PickupSystemの音響統合
        if (this.game.pickupSystem) {
            this.integratePickupSystem();
        }
        
        // LevelSystemの音響統合
        if (this.game.levelSystem) {
            this.integrateLevelSystem();
        }
        
        // ComboSystemの音響統合
        this.integrateComboSystem();
        
        // 統合完了システムの記録
        console.log('📊 統合状況:', this.integrationStatus);
    }
    
    /**
     * PickupSystem音響統合
     */
    integratePickupSystem() {
        console.log('🎵 PickupSystem音響統合開始');
        
        try {
            // 元のpickItem関数を保存
            const originalPickItem = this.game.pickupSystem.pickItem;
            
            // 音響付きバージョンに置き換え
            this.game.pickupSystem.pickItem = (pickup) => {
                // 元の処理を実行
                const result = originalPickItem.call(this.game.pickupSystem, pickup);
                
                // 音響再生（安全レイヤー経由）
                if (result && this.safeIntegrationLayer.features.pickupSounds) {
                    this.playPickupSound(pickup.type);
                }
                
                return result;
            };
            
            // フィーチャーを有効化
            this.safeIntegrationLayer.enableFeature('pickupSounds');
            
            this.integrationStatus.integratedSystems.push('pickupSystem');
            console.log('✅ PickupSystem音響統合完了');
            
        } catch (error) {
            console.error('❌ PickupSystem統合エラー:', error);
        }
    }
    
    /**
     * アイテム取得音再生
     */
    playPickupSound(pickupType) {
        const config = this.audioConfig.pickup[pickupType];
        if (!config) return;
        
        try {
            // Phase 4 Facade経由で再生
            if (this.audioFacade) {
                this.audioFacade.playSoundEffect(pickupType + 'Pickup', {
                    volume: 0.5,
                    ...config
                });
            }
        } catch (error) {
            console.error('アイテム取得音再生エラー:', error);
        }
    }
    
    /**
     * LevelSystem音響統合
     */
    integrateLevelSystem() {
        console.log('🎵 LevelSystem音響統合開始');
        
        try {
            // 元のaddExperience関数を保存
            const originalAddExp = this.game.levelSystem.addExperience;
            
            // 音響付きバージョンに置き換え
            this.game.levelSystem.addExperience = (amount) => {
                const previousLevel = this.game.levelSystem.level;
                
                // 元の処理を実行
                const result = originalAddExp.call(this.game.levelSystem, amount);
                
                const currentLevel = this.game.levelSystem.level;
                
                // レベルアップ検出
                if (currentLevel > previousLevel && this.safeIntegrationLayer.features.levelUpSounds) {
                    const isMilestone = currentLevel % 10 === 0;
                    this.playLevelUpSound(isMilestone);
                }
                
                return result;
            };
            
            // フィーチャーを有効化
            this.safeIntegrationLayer.enableFeature('levelUpSounds');
            
            this.integrationStatus.integratedSystems.push('levelSystem');
            console.log('✅ LevelSystem音響統合完了');
            
        } catch (error) {
            console.error('❌ LevelSystem統合エラー:', error);
        }
    }
    
    /**
     * レベルアップ音再生
     */
    playLevelUpSound(isMilestone) {
        const config = isMilestone ? 
            this.audioConfig.levelUp.milestone : 
            this.audioConfig.levelUp.standard;
        
        try {
            if (this.audioFacade) {
                this.audioFacade.playSoundEffect('levelUp', {
                    volume: 0.7,
                    ...config
                });
            }
        } catch (error) {
            console.error('レベルアップ音再生エラー:', error);
        }
    }
    
    /**
     * ComboSystem音響統合
     */
    integrateComboSystem() {
        console.log('🎵 ComboSystem音響統合開始');
        
        try {
            // コンボ更新の監視
            let lastComboCount = 0;
            
            // 元のupdateCombo関数があれば保存
            if (this.game.updateCombo) {
                const originalUpdateCombo = this.game.updateCombo;
                
                this.game.updateCombo = (...args) => {
                    const previousCombo = this.game.combo.count;
                    
                    // 元の処理を実行
                    const result = originalUpdateCombo.call(this.game, ...args);
                    
                    // コンボ音響処理
                    if (this.safeIntegrationLayer.features.comboSounds) {
                        this.handleComboSound(previousCombo, this.game.combo.count);
                    }
                    
                    return result;
                };
            }
            
            // フィーチャーを有効化
            this.safeIntegrationLayer.enableFeature('comboSounds');
            
            this.integrationStatus.integratedSystems.push('comboSystem');
            console.log('✅ ComboSystem音響統合完了');
            
        } catch (error) {
            console.error('❌ ComboSystem統合エラー:', error);
        }
    }
    
    /**
     * コンボ音響処理
     */
    handleComboSound(previousCombo, currentCombo) {
        if (currentCombo === 0) return;
        
        try {
            let soundType = 'increment';
            
            if (previousCombo === 0 && currentCombo > 0) {
                soundType = 'start';
            } else if (currentCombo >= 100) {
                soundType = 'max';
            }
            
            const config = this.audioConfig.combo[soundType];
            
            if (this.audioFacade && config) {
                this.audioFacade.playSoundEffect('combo' + soundType, {
                    volume: 0.4,
                    ...config
                });
            }
        } catch (error) {
            console.error('コンボ音再生エラー:', error);
        }
    }
    
    /**
     * マリオミニゲーム音響統合
     */
    integrateMarioMiniGame() {
        if (!this.game.marioGame) return;
        
        console.log('🎵 MarioMiniGame音響統合開始');
        
        try {
            // マリオゲームの各アクションに音響を追加
            const marioGame = this.game.marioGame;
            
            // ジャンプ音
            if (marioGame.jump) {
                const originalJump = marioGame.jump;
                marioGame.jump = (...args) => {
                    const result = originalJump.call(marioGame, ...args);
                    if (this.safeIntegrationLayer.features.marioGameSounds) {
                        this.playMarioSound('jump');
                    }
                    return result;
                };
            }
            
            // フィーチャーを有効化
            this.safeIntegrationLayer.enableFeature('marioGameSounds');
            
            this.integrationStatus.integratedSystems.push('marioMiniGame');
            console.log('✅ MarioMiniGame音響統合完了');
            
        } catch (error) {
            console.error('❌ MarioMiniGame統合エラー:', error);
        }
    }
    
    /**
     * マリオゲーム音再生
     */
    playMarioSound(soundType) {
        const config = this.audioConfig.marioGame[soundType];
        if (!config) return;
        
        try {
            if (this.audioFacade) {
                this.audioFacade.playSoundEffect('mario' + soundType, {
                    volume: 0.6,
                    ...config
                });
            }
        } catch (error) {
            console.error('マリオゲーム音再生エラー:', error);
        }
    }
    
    /**
     * 環境音響統合
     */
    integrateEnvironmentSounds() {
        console.log('🎵 環境音響統合開始');
        
        try {
            // Wave進行に応じた環境音の調整
            if (this.safeIntegrationLayer.features.environmentSounds && this.audioFacade) {
                // アンビエント音開始
                this.audioFacade.startAmbientSound('gameAmbience', {
                    volume: this.audioConfig.environment.ambience.volume
                });
            }
            
            // フィーチャーを有効化
            this.safeIntegrationLayer.enableFeature('environmentSounds');
            
            this.integrationStatus.integratedSystems.push('backgroundSystem');
            console.log('✅ 環境音響統合完了');
            
        } catch (error) {
            console.error('❌ 環境音響統合エラー:', error);
        }
    }
    
    /**
     * 統合システム更新
     */
    update(deltaTime) {
        if (!this.initialized) return;
        
        // 安全統合レイヤー更新
        if (this.safeIntegrationLayer) {
            this.safeIntegrationLayer.update(deltaTime);
        }
        
        // パフォーマンス最適化更新
        if (this.performanceOptimizer) {
            this.performanceOptimizer.update(deltaTime);
        }
        
        // エッジケース対応更新
        if (this.edgeCaseHandler) {
            this.edgeCaseHandler.update(deltaTime);
        }
        
        // Wave進行による環境音調整
        this.updateEnvironmentSounds();
    }
    
    /**
     * 環境音更新
     */
    updateEnvironmentSounds() {
        if (!this.safeIntegrationLayer.features.environmentSounds) return;
        
        // Wave数に応じた緊張感の演出
        const wave = this.game.stats.wave;
        const tensionLevel = Math.min(1, wave / 100);
        
        // 環境音のボリューム調整
        if (this.audioFacade) {
            try {
                this.audioFacade.setAmbientVolume(
                    this.audioConfig.environment.ambience.volume * (1 - tensionLevel * 0.5)
                );
            } catch (error) {
                // エラーは安全レイヤーで処理
            }
        }
    }
    
    /**
     * 統合レポート取得
     */
    getIntegrationReport() {
        const baseReport = this.safeIntegrationLayer ? 
            this.safeIntegrationLayer.getIntegrationReport() : {};
        
        // パフォーマンスレポート
        const performanceReport = this.performanceOptimizer ? 
            this.performanceOptimizer.getPerformanceReport() : null;
        
        // エッジケースレポート
        const edgeCaseReport = this.edgeCaseHandler ? 
            this.edgeCaseHandler.getEdgeCaseReport() : null;
        
        return {
            ...baseReport,
            phase5Status: {
                phase: this.integrationStatus.phase,
                uptime: Math.floor((Date.now() - this.integrationStatus.startTime) / 1000) + 's',
                integratedSystems: this.integrationStatus.integratedSystems,
                pendingSystems: this.integrationStatus.pendingSystems.filter(
                    sys => !this.integrationStatus.integratedSystems.includes(sys)
                )
            },
            performance: performanceReport,
            edgeCases: edgeCaseReport
        };
    }
    
    /**
     * Phase 5フィーチャー切り替え
     */
    toggleFeature(featureName, enabled) {
        if (this.safeIntegrationLayer) {
            if (enabled) {
                return this.safeIntegrationLayer.enableFeature(featureName);
            } else {
                return this.safeIntegrationLayer.disableFeature(featureName);
            }
        }
        return false;
    }
    
    /**
     * クリーンアップ
     */
    dispose() {
        console.log('🧹 Phase5Integration: クリーンアップ');
        
        if (this.safeIntegrationLayer) {
            this.safeIntegrationLayer.dispose();
        }
        
        if (this.performanceOptimizer) {
            this.performanceOptimizer.dispose();
        }
        
        if (this.edgeCaseHandler) {
            this.edgeCaseHandler.dispose();
        }
        
        this.initialized = false;
    }
}