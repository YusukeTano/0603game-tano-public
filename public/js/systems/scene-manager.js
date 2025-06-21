/**
 * SceneManager - Phase 3.1 統一シーン管理システム
 * シーン遷移制御・音響状態管理・クロスフェード対応
 */

export class SceneManager {
    constructor(game) {
        this.game = game;
        
        // シーン定義
        this.scenes = {
            loading: { name: 'loading', bgm: null, fadeInTime: 0, fadeOutTime: 0.3 },
            menu: { name: 'menu', bgm: 'menu', fadeInTime: 0.5, fadeOutTime: 0.3 },
            characterSelect: { name: 'characterSelect', bgm: 'character', fadeInTime: 0.5, fadeOutTime: 0.3 },
            playing: { name: 'playing', bgm: 'battle', fadeInTime: 0.8, fadeOutTime: 0.5 },
            paused: { name: 'paused', bgm: null, fadeInTime: 0, fadeOutTime: 0 },
            gameOver: { name: 'gameOver', bgm: null, fadeInTime: 0.3, fadeOutTime: 0 },
            marioMiniGame: { name: 'marioMiniGame', bgm: 'mario', fadeInTime: 0.5, fadeOutTime: 0.3 }
        };
        
        // 現在のシーン状態
        this.currentScene = 'loading';
        this.previousScene = null;
        this.isTransitioning = false;
        
        // トランジション設定
        this.transitionSettings = {
            defaultDuration: 0.5,
            crossfadeDuration: 1.0,
            enableCrossfade: true,
            maxTransitionTime: 3.0
        };
        
        // シーン遷移履歴
        this.sceneHistory = [];
        this.maxHistorySize = 10;
        
        // 音響制御連携
        this.audioController = null;
        
        console.log('🎬 SceneManager: Phase 3.1 統一シーン管理システム初期化');
    }
    
    /**
     * 音響コントローラー連携設定
     */
    setAudioController(audioController) {
        this.audioController = audioController;
        console.log('🎵 SceneManager: 音響コントローラー連携設定完了');
    }
    
    /**
     * シーン遷移実行
     */
    async transitionToScene(targetScene, options = {}) {
        try {
            console.log(`🎬 SceneManager: ${this.currentScene} → ${targetScene} 遷移開始`);
            
            if (this.isTransitioning) {
                console.warn('⚠️ SceneManager: 既に遷移中です');
                return { success: false, error: 'Already transitioning' };
            }
            
            if (!this.scenes[targetScene]) {
                throw new Error(`Unknown scene: ${targetScene}`);
            }
            
            this.isTransitioning = true;
            const transitionStart = Date.now();
            
            // 遷移前処理
            await this.onSceneExit(this.currentScene);
            
            // BGMクロスフェード（オプション）
            if (this.transitionSettings.enableCrossfade && this.audioController) {
                await this.handleBGMTransition(this.currentScene, targetScene);
            }
            
            // UI遷移
            await this.handleUITransition(this.currentScene, targetScene, options);
            
            // シーン状態更新
            this.previousScene = this.currentScene;
            this.currentScene = targetScene;
            
            // 履歴記録
            this.addToHistory(targetScene, transitionStart);
            
            // 遷移後処理
            await this.onSceneEnter(targetScene);
            
            this.isTransitioning = false;
            
            const transitionTime = Date.now() - transitionStart;
            console.log(`✅ SceneManager: ${targetScene} 遷移完了 (${transitionTime}ms)`);
            
            return { success: true, fromScene: this.previousScene, toScene: targetScene, duration: transitionTime };
            
        } catch (error) {
            this.isTransitioning = false;
            console.error('❌ SceneManager: シーン遷移失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM遷移処理
     */
    async handleBGMTransition(fromScene, toScene) {
        const fromBGM = this.scenes[fromScene]?.bgm;
        const toBGM = this.scenes[toScene]?.bgm;
        
        if (fromBGM === toBGM) {
            return; // 同じBGMなら遷移不要
        }
        
        try {
            if (this.audioController) {
                if (fromBGM && toBGM) {
                    // クロスフェード
                    await this.audioController.crossfadeBGM(fromBGM, toBGM, this.transitionSettings.crossfadeDuration);
                } else if (fromBGM && !toBGM) {
                    // フェードアウトのみ
                    await this.audioController.fadeOutBGM(this.scenes[fromScene].fadeOutTime);
                } else if (!fromBGM && toBGM) {
                    // フェードインのみ
                    await this.audioController.fadeInBGM(toBGM, this.scenes[toScene].fadeInTime);
                }
                
                console.log(`🎵 SceneManager: BGM遷移完了 ${fromBGM || 'none'} → ${toBGM || 'none'}`);
            }
        } catch (error) {
            console.error('❌ SceneManager: BGM遷移失敗:', error);
        }
    }
    
    /**
     * UI遷移処理
     */
    async handleUITransition(fromScene, toScene, options) {
        try {
            // 既存UISystemとの連携
            if (this.game && this.game.uiSystem) {
                switch (toScene) {
                    case 'menu':
                        await this.game.showMainMenu();
                        break;
                    case 'characterSelect':
                        await this.game.showCharacterSelect();
                        break;
                    case 'playing':
                        await this.game.startGame(options.character);
                        break;
                    case 'gameOver':
                        await this.game.gameOver();
                        break;
                    default:
                        console.warn(`⚠️ SceneManager: 未対応のUI遷移: ${toScene}`);
                }
            }
        } catch (error) {
            console.error('❌ SceneManager: UI遷移失敗:', error);
            throw error;
        }
    }
    
    /**
     * シーン退出時処理
     */
    async onSceneExit(scene) {
        console.log(`🚪 SceneManager: ${scene} 退出処理`);
        
        // シーン別退出処理
        switch (scene) {
            case 'playing':
                // ゲーム状態保存など
                this.saveGameState();
                break;
            case 'paused':
                // ポーズ解除など
                this.clearPauseState();
                break;
        }
    }
    
    /**
     * シーン入場時処理
     */
    async onSceneEnter(scene) {
        console.log(`🎯 SceneManager: ${scene} 入場処理`);
        
        // ゲーム状態更新
        if (this.game) {
            this.game.gameState = scene;
        }
        
        // シーン別入場処理
        switch (scene) {
            case 'menu':
                this.initializeMenuState();
                break;
            case 'playing':
                this.initializeGameState();
                break;
            case 'gameOver':
                this.processGameOverState();
                break;
        }
    }
    
    /**
     * 履歴管理
     */
    addToHistory(scene, timestamp) {
        this.sceneHistory.push({
            scene,
            timestamp,
            fromScene: this.previousScene
        });
        
        // 履歴サイズ制限
        if (this.sceneHistory.length > this.maxHistorySize) {
            this.sceneHistory.shift();
        }
    }
    
    /**
     * 現在のシーン情報取得
     */
    getCurrentSceneInfo() {
        return {
            currentScene: this.currentScene,
            previousScene: this.previousScene,
            isTransitioning: this.isTransitioning,
            sceneConfig: this.scenes[this.currentScene]
        };
    }
    
    /**
     * シーン履歴取得
     */
    getSceneHistory() {
        return [...this.sceneHistory];
    }
    
    // ヘルパーメソッド
    saveGameState() {
        console.log('💾 SceneManager: ゲーム状態保存');
    }
    
    clearPauseState() {
        console.log('⏸️ SceneManager: ポーズ状態クリア');
    }
    
    initializeMenuState() {
        console.log('🏠 SceneManager: メニュー状態初期化');
    }
    
    initializeGameState() {
        console.log('🎮 SceneManager: ゲーム状態初期化');
    }
    
    processGameOverState() {
        console.log('💀 SceneManager: ゲームオーバー状態処理');
    }
    
    /**
     * デバッグ情報出力
     */
    getDebugInfo() {
        return {
            currentScene: this.currentScene,
            previousScene: this.previousScene,
            isTransitioning: this.isTransitioning,
            historyCount: this.sceneHistory.length,
            scenes: Object.keys(this.scenes),
            audioController: !!this.audioController
        };
    }
}