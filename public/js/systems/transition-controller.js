/**
 * TransitionController - Phase 3.1 シーン遷移統合制御
 * SceneManager + AudioSceneController の統合管理
 */

import { SceneManager } from './scene-manager.js';
import { AudioSceneController } from './audio-scene-controller.js';

export class TransitionController {
    constructor(game, audioManager = null) {
        this.game = game;
        this.audioManager = audioManager;
        
        // 統合システム初期化
        this.sceneManager = new SceneManager(game);
        this.audioSceneController = new AudioSceneController(audioManager);
        
        // 相互連携設定
        this.sceneManager.setAudioController(this.audioSceneController);
        this.audioSceneController.setAudioManager(audioManager);
        
        // 統合制御状態
        this.isInitialized = false;
        this.transitionQueue = [];
        this.isProcessingQueue = false;
        
        // 遷移制御設定
        this.transitionSettings = {
            enableParallelTransitions: true,  // 並列遷移許可
            enableTransitionQueue: true,      // 遷移キュー使用
            maxQueueSize: 5,                  // 最大キューサイズ
            transitionTimeout: 5000,          // 遷移タイムアウト(ms)
            enableRollback: true              // ロールバック機能
        };
        
        // パフォーマンス監視
        this.performance = {
            totalTransitions: 0,
            successfulTransitions: 0,
            failedTransitions: 0,
            averageTransitionTime: 0,
            lastTransitionTime: 0,
            errors: []
        };
        
        console.log('🔄 TransitionController: シーン遷移統合制御システム初期化');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🔄 TransitionController: システム初期化開始');
            
            // オーディオマネージャー連携確認
            if (this.audioManager) {
                this.audioSceneController.setAudioManager(this.audioManager);
                console.log('✅ TransitionController: オーディオマネージャー連携完了');
            } else {
                console.warn('⚠️ TransitionController: オーディオマネージャーが設定されていません');
            }
            
            this.isInitialized = true;
            console.log('✅ TransitionController: システム初期化完了');
            
            return { success: true };
            
        } catch (error) {
            console.error('❌ TransitionController: 初期化失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 統合シーン遷移実行
     */
    async transitionTo(targetScene, options = {}) {
        try {
            console.log(`🔄 TransitionController: 統合遷移開始 → ${targetScene}`);
            
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            const transitionStart = Date.now();
            const currentScene = this.sceneManager.currentScene;
            
            // 遷移キュー処理
            if (this.transitionSettings.enableTransitionQueue && this.sceneManager.isTransitioning) {
                return await this.queueTransition(targetScene, options);
            }
            
            // 並列遷移実行
            const results = await this.executeParallelTransition(targetScene, options);
            
            // 結果検証
            const success = this.validateTransitionResults(results);
            
            if (success) {
                const transitionTime = Date.now() - transitionStart;
                this.recordSuccessfulTransition(currentScene, targetScene, transitionTime);
                console.log(`✅ TransitionController: 統合遷移完了 ${currentScene} → ${targetScene} (${transitionTime}ms)`);
                
                return {
                    success: true,
                    fromScene: currentScene,
                    toScene: targetScene,
                    duration: transitionTime,
                    results
                };
            } else {
                throw new Error('Transition validation failed');
            }
            
        } catch (error) {
            console.error('❌ TransitionController: 統合遷移失敗:', error);
            this.recordFailedTransition(targetScene, error);
            
            // ロールバック機能
            if (this.transitionSettings.enableRollback) {
                await this.rollbackTransition();
            }
            
            return { success: false, error: error.message };
        }
    }
    
    /**
     * 並列遷移実行
     */
    async executeParallelTransition(targetScene, options) {
        const promises = [];
        
        // Scene Manager遷移
        promises.push(
            this.sceneManager.transitionToScene(targetScene, options)
                .then(result => ({ type: 'scene', ...result }))
                .catch(error => ({ type: 'scene', success: false, error: error.message }))
        );
        
        // Audio Scene Controller遷移  
        promises.push(
            this.audioSceneController.transitionToScene(targetScene, options)
                .then(result => ({ type: 'audio', ...result }))
                .catch(error => ({ type: 'audio', success: false, error: error.message }))
        );
        
        try {
            const results = await Promise.all(promises);
            console.log('🔄 TransitionController: 並列遷移結果:', results);
            return results;
        } catch (error) {
            console.error('❌ TransitionController: 並列遷移エラー:', error);
            throw error;
        }
    }
    
    /**
     * 遷移結果検証
     */
    validateTransitionResults(results) {
        if (!Array.isArray(results) || results.length === 0) {
            console.error('❌ TransitionController: 無効な遷移結果');
            return false;
        }
        
        let sceneSuccess = false;
        let audioSuccess = false;
        
        for (const result of results) {
            if (result.type === 'scene' && result.success) {
                sceneSuccess = true;
            }
            if (result.type === 'audio' && result.success) {
                audioSuccess = true;
            }
        }
        
        // シーン遷移は必須、オーディオは任意
        const isValid = sceneSuccess;
        
        if (!audioSuccess) {
            console.warn('⚠️ TransitionController: オーディオ遷移失敗（シーン遷移は継続）');
        }
        
        return isValid;
    }
    
    /**
     * 遷移キュー処理
     */
    async queueTransition(targetScene, options) {
        if (this.transitionQueue.length >= this.transitionSettings.maxQueueSize) {
            throw new Error('Transition queue is full');
        }
        
        const queuedTransition = {
            targetScene,
            options,
            timestamp: Date.now(),
            promise: null
        };
        
        queuedTransition.promise = new Promise((resolve, reject) => {
            queuedTransition.resolve = resolve;
            queuedTransition.reject = reject;
        });
        
        this.transitionQueue.push(queuedTransition);
        console.log(`📥 TransitionController: 遷移をキューに追加 → ${targetScene} (queue size: ${this.transitionQueue.length})`);
        
        // キュー処理開始
        if (!this.isProcessingQueue) {
            this.processTransitionQueue();
        }
        
        return queuedTransition.promise;
    }
    
    /**
     * 遷移キュー処理実行
     */
    async processTransitionQueue() {
        this.isProcessingQueue = true;
        
        while (this.transitionQueue.length > 0) {
            const transition = this.transitionQueue.shift();
            
            try {
                const result = await this.transitionTo(transition.targetScene, transition.options);
                transition.resolve(result);
            } catch (error) {
                transition.reject(error);
            }
        }
        
        this.isProcessingQueue = false;
        console.log('📤 TransitionController: 遷移キュー処理完了');
    }
    
    /**
     * ロールバック実行
     */
    async rollbackTransition() {
        try {
            console.log('🔙 TransitionController: 遷移ロールバック実行');
            
            const previousScene = this.sceneManager.previousScene;
            if (previousScene) {
                await this.sceneManager.transitionToScene(previousScene);
                await this.audioSceneController.transitionToScene(previousScene);
                console.log(`✅ TransitionController: ロールバック完了 → ${previousScene}`);
            }
        } catch (error) {
            console.error('❌ TransitionController: ロールバック失敗:', error);
        }
    }
    
    /**
     * 成功遷移記録
     */
    recordSuccessfulTransition(fromScene, toScene, duration) {
        this.performance.totalTransitions++;
        this.performance.successfulTransitions++;
        this.performance.lastTransitionTime = duration;
        
        // 平均時間更新
        const totalTime = this.performance.averageTransitionTime * (this.performance.successfulTransitions - 1) + duration;
        this.performance.averageTransitionTime = totalTime / this.performance.successfulTransitions;
    }
    
    /**
     * 失敗遷移記録
     */
    recordFailedTransition(targetScene, error) {
        this.performance.totalTransitions++;
        this.performance.failedTransitions++;
        this.performance.errors.push({
            targetScene,
            error: error.message,
            timestamp: Date.now()
        });
        
        // エラー履歴サイズ制限
        if (this.performance.errors.length > 10) {
            this.performance.errors.shift();
        }
    }
    
    /**
     * 現在の状態情報取得
     */
    getCurrentState() {
        return {
            currentScene: this.sceneManager.currentScene,
            previousScene: this.sceneManager.previousScene,
            isTransitioning: this.sceneManager.isTransitioning,
            audioState: this.audioSceneController.getCurrentAudioState(),
            queueSize: this.transitionQueue.length,
            isProcessingQueue: this.isProcessingQueue
        };
    }
    
    /**
     * パフォーマンス情報取得
     */
    getPerformanceInfo() {
        return {
            ...this.performance,
            sceneManagerPerf: this.sceneManager.getDebugInfo(),
            audioControllerPerf: this.audioSceneController.getPerformanceInfo()
        };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            currentState: this.getCurrentState(),
            performance: this.getPerformanceInfo(),
            settings: this.transitionSettings,
            sceneManager: this.sceneManager.getDebugInfo(),
            audioController: this.audioSceneController.getDebugInfo()
        };
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        console.log('🧹 TransitionController: クリーンアップ実行');
        
        // キューをクリア
        this.transitionQueue = [];
        this.isProcessingQueue = false;
        
        // エラー履歴クリア
        this.performance.errors = [];
        
        console.log('✅ TransitionController: クリーンアップ完了');
    }
}