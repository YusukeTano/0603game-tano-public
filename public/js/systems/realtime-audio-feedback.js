/**
 * RealtimeAudioFeedback - Phase 3.2 リアルタイム音響フィードバックシステム
 * プレイヤーアクション・ゲームイベントによる瞬間的音響反応システム
 */

export class RealtimeAudioFeedback {
    constructor(audioManager = null) {
        this.audioManager = audioManager;
        
        // アクション別音響フィードバック設定
        this.feedbackConfig = {
            // 射撃アクション
            shooting: {
                enabled: true,
                volume: {
                    single: 0.7,
                    rapid: 0.8,
                    combo: 0.9
                },
                effects: {
                    echo: { enabled: true, delay: 0.1, feedback: 0.3 },
                    reverb: { enabled: true, roomSize: 0.4 },
                    filter: { enabled: true, frequency: 8000, Q: 2.0 }
                },
                rateLimit: 50  // 最小間隔(ms)
            },
            
            // スキル使用
            skillActivation: {
                enabled: true,
                volume: 0.9,
                effects: {
                    whoosh: { enabled: true, duration: 0.5 },
                    reverb: { enabled: true, roomSize: 0.8 },
                    filter: { enabled: true, frequency: 12000, Q: 1.5 }
                }
            },
            
            // ダメージ受け
            takingDamage: {
                enabled: true,
                volume: {
                    light: 0.6,
                    medium: 0.7,
                    heavy: 0.9
                },
                effects: {
                    lowpass: { enabled: true, frequency: 800, duration: 0.3 },
                    distortion: { enabled: true, amount: 0.2, duration: 0.2 },
                    volume: { enabled: true, reduction: 0.3, duration: 0.5 }
                }
            },
            
            // レベルアップ
            levelUp: {
                enabled: true,
                volume: 1.0,
                effects: {
                    crescendo: { enabled: true, duration: 1.0 },
                    sparkle: { enabled: true, frequency: 15000 },
                    reverb: { enabled: true, roomSize: 1.0 }
                }
            },
            
            // 敵撃破
            enemyDefeat: {
                enabled: true,
                volume: {
                    small: 0.5,
                    medium: 0.7,
                    large: 0.8,
                    boss: 1.0
                },
                effects: {
                    impact: { enabled: true, frequency: 200 },
                    fade: { enabled: true, duration: 0.3 }
                },
                comboMultiplier: 1.2
            },
            
            // 緊急状態
            emergency: {
                enabled: true,
                volume: 0.9,
                effects: {
                    heartbeat: { enabled: true, bpm: 120 },
                    lowpass: { enabled: true, frequency: 600 },
                    compression: { enabled: true, ratio: 4.0 }
                }
            }
        };
        
        // リアルタイム状態
        this.realtimeState = {
            isActive: false,
            actionQueue: [],
            effectsActive: new Map(),
            lastActionTime: 0,
            currentCombo: 0,
            comboStartTime: 0,
            emergencyMode: false
        };
        
        // パフォーマンス制御
        this.performanceSettings = {
            maxConcurrentEffects: 8,      // 最大同時エフェクト数
            effectPoolSize: 20,           // エフェクトプールサイズ
            processingInterval: 16,       // 処理間隔(ms) ≈ 60fps
            actionRateLimit: 10,          // アクション制限(per 100ms)
            enableOptimization: true      // 最適化有効
        };
        
        // エフェクトプール
        this.effectPool = {
            available: [],
            active: new Map(),
            reused: 0
        };
        
        // 統計情報
        this.statistics = {
            totalActions: 0,
            effectsTriggered: 0,
            averageResponseTime: 0,
            peakConcurrentEffects: 0,
            errors: []
        };
        
        // 処理タイマー
        this.processingTimer = null;
        
        console.log('🎛️ RealtimeAudioFeedback: リアルタイム音響フィードバックシステム初期化');
        
        // エフェクトプール初期化
        this.initializeEffectPool();
    }
    
    /**
     * システム開始
     */
    start() {
        console.log('🎛️ RealtimeAudioFeedback: リアルタイムフィードバック開始');
        
        this.realtimeState.isActive = true;
        
        // リアルタイム処理開始
        this.processingTimer = setInterval(() => {
            this.processRealtimeFeedback();
        }, this.performanceSettings.processingInterval);
        
        console.log('✅ RealtimeAudioFeedback: システム開始完了');
    }
    
    /**
     * システム停止
     */
    stop() {
        console.log('🛑 RealtimeAudioFeedback: リアルタイムフィードバック停止');
        
        this.realtimeState.isActive = false;
        
        if (this.processingTimer) {
            clearInterval(this.processingTimer);
            this.processingTimer = null;
        }
        
        // アクティブエフェクト停止
        this.stopAllActiveEffects();
        
        console.log('✅ RealtimeAudioFeedback: システム停止完了');
    }
    
    /**
     * エフェクトプール初期化
     */
    initializeEffectPool() {
        for (let i = 0; i < this.performanceSettings.effectPoolSize; i++) {
            this.effectPool.available.push(this.createPooledEffect());
        }
        
        console.log(`🔄 RealtimeAudioFeedback: エフェクトプール初期化完了 (${this.performanceSettings.effectPoolSize}個)`);
    }
    
    /**
     * プールエフェクト作成
     */
    createPooledEffect() {
        return {
            id: Date.now() + Math.random(),
            type: null,
            isActive: false,
            startTime: 0,
            duration: 0,
            parameters: {},
            cleanup: null
        };
    }
    
    // === パブリックAPI - アクショントリガー ===
    
    /**
     * 射撃音響フィードバック
     */
    triggerShootingFeedback(weaponType, comboCount = 0, intensity = 1.0) {
        this.addActionToQueue({
            type: 'shooting',
            data: { weaponType, comboCount, intensity },
            timestamp: Date.now(),
            priority: 'high'
        });
    }
    
    /**
     * スキルアクティベーション音響フィードバック
     */
    triggerSkillActivationFeedback(skillType, power = 1.0) {
        this.addActionToQueue({
            type: 'skillActivation',
            data: { skillType, power },
            timestamp: Date.now(),
            priority: 'high'
        });
    }
    
    /**
     * ダメージ受信音響フィードバック
     */
    triggerDamageFeedback(damageType, severity = 'medium', healthRatio = 1.0) {
        this.addActionToQueue({
            type: 'takingDamage',
            data: { damageType, severity, healthRatio },
            timestamp: Date.now(),
            priority: 'immediate'
        });
    }
    
    /**
     * レベルアップ音響フィードバック
     */
    triggerLevelUpFeedback(newLevel, skillName = null) {
        this.addActionToQueue({
            type: 'levelUp',
            data: { newLevel, skillName },
            timestamp: Date.now(),
            priority: 'medium'
        });
    }
    
    /**
     * 敵撃破音響フィードバック
     */
    triggerEnemyDefeatFeedback(enemyType, isCombo = false, comboCount = 0) {
        this.addActionToQueue({
            type: 'enemyDefeat',
            data: { enemyType, isCombo, comboCount },
            timestamp: Date.now(),
            priority: 'medium'
        });
    }
    
    /**
     * 緊急状態音響フィードバック
     */
    triggerEmergencyFeedback(emergencyType, intensity = 1.0) {
        this.addActionToQueue({
            type: 'emergency',
            data: { emergencyType, intensity },
            timestamp: Date.now(),
            priority: 'immediate'
        });
    }
    
    // === 内部処理システム ===
    
    /**
     * アクションキューに追加
     */
    addActionToQueue(action) {
        if (!this.realtimeState.isActive) return;
        
        // レート制限チェック
        if (!this.checkRateLimit(action)) {
            return;
        }
        
        // 優先度別挿入
        this.insertActionByPriority(action);
        
        this.statistics.totalActions++;
    }
    
    /**
     * 優先度別アクション挿入
     */
    insertActionByPriority(action) {
        const priorities = { immediate: 0, high: 1, medium: 2, low: 3 };
        const actionPriority = priorities[action.priority] || 2;
        
        let insertIndex = this.realtimeState.actionQueue.length;
        for (let i = 0; i < this.realtimeState.actionQueue.length; i++) {
            const queuedPriority = priorities[this.realtimeState.actionQueue[i].priority] || 2;
            if (actionPriority < queuedPriority) {
                insertIndex = i;
                break;
            }
        }
        
        this.realtimeState.actionQueue.splice(insertIndex, 0, action);
    }
    
    /**
     * レート制限チェック
     */
    checkRateLimit(action) {
        const now = Date.now();
        const config = this.feedbackConfig[action.type];
        
        if (config && config.rateLimit) {
            if (now - this.realtimeState.lastActionTime < config.rateLimit) {
                return false;
            }
        }
        
        this.realtimeState.lastActionTime = now;
        return true;
    }
    
    /**
     * リアルタイムフィードバック処理
     */
    processRealtimeFeedback() {
        try {
            const processingStart = Date.now();
            
            // アクションキュー処理
            this.processActionQueue();
            
            // アクティブエフェクト更新
            this.updateActiveEffects();
            
            // パフォーマンス監視
            this.monitorPerformance();
            
            // コンボ状態更新
            this.updateComboState();
            
            const processingTime = Date.now() - processingStart;
            this.recordProcessingTime(processingTime);
            
        } catch (error) {
            console.error('❌ RealtimeAudioFeedback: 処理エラー:', error);
            this.statistics.errors.push({
                error: error.message,
                timestamp: Date.now()
            });
        }
    }
    
    /**
     * アクションキュー処理
     */
    processActionQueue() {
        while (this.realtimeState.actionQueue.length > 0) {
            const action = this.realtimeState.actionQueue.shift();
            this.executeAction(action);
        }
    }
    
    /**
     * アクション実行
     */
    async executeAction(action) {
        try {
            const config = this.feedbackConfig[action.type];
            if (!config || !config.enabled) return;
            
            const effect = this.acquireEffect();
            if (!effect) {
                console.warn('⚠️ RealtimeAudioFeedback: エフェクトプール枯渇');
                return;
            }
            
            // エフェクト設定
            effect.type = action.type;
            effect.isActive = true;
            effect.startTime = Date.now();
            effect.parameters = this.calculateEffectParameters(action, config);
            
            // 音響システムにエフェクト適用
            await this.applyEffectToAudioSystem(effect);
            
            // アクティブエフェクトに追加
            this.realtimeState.effectsActive.set(effect.id, effect);
            
            this.statistics.effectsTriggered++;
            
        } catch (error) {
            console.error('❌ RealtimeAudioFeedback: アクション実行エラー:', error);
        }
    }
    
    /**
     * エフェクトパラメータ計算
     */
    calculateEffectParameters(action, config) {
        const parameters = { ...config };
        
        // アクション種別別パラメータ調整
        switch (action.type) {
            case 'shooting':
                parameters.volume = this.calculateShootingVolume(action.data, config);
                break;
            case 'takingDamage':
                parameters.volume = config.volume[action.data.severity] || config.volume.medium;
                break;
            case 'enemyDefeat':
                parameters.volume = this.calculateDefeatVolume(action.data, config);
                break;
        }
        
        return parameters;
    }
    
    /**
     * 射撃音量計算
     */
    calculateShootingVolume(data, config) {
        let baseVolume = config.volume.single;
        
        if (data.comboCount > 10) {
            baseVolume = config.volume.combo;
        } else if (data.comboCount > 3) {
            baseVolume = config.volume.rapid;
        }
        
        return baseVolume * data.intensity;
    }
    
    /**
     * 撃破音量計算
     */
    calculateDefeatVolume(data, config) {
        let baseVolume = config.volume[data.enemyType] || config.volume.medium;
        
        if (data.isCombo && data.comboCount > 0) {
            baseVolume *= Math.min(config.comboMultiplier * data.comboCount, 2.0);
        }
        
        return baseVolume;
    }
    
    /**
     * 音響システムへのエフェクト適用
     */
    async applyEffectToAudioSystem(effect) {
        try {
            if (!this.audioManager) return;
            
            const params = effect.parameters;
            
            switch (effect.type) {
                case 'shooting':
                    await this.applyShootingEffect(params);
                    break;
                case 'takingDamage':
                    await this.applyDamageEffect(params);
                    break;
                case 'levelUp':
                    await this.applyLevelUpEffect(params);
                    break;
                // 他のエフェクトタイプも同様に実装
            }
            
        } catch (error) {
            console.error('❌ エフェクト適用エラー:', error);
        }
    }
    
    async applyShootingEffect(params) {
        if (this.audioManager.addReverbEffect) {
            await this.audioManager.addReverbEffect(params.effects.reverb);
        }
        if (this.audioManager.addEchoEffect) {
            await this.audioManager.addEchoEffect(params.effects.echo);
        }
    }
    
    async applyDamageEffect(params) {
        if (this.audioManager.addLowpassFilter) {
            await this.audioManager.addLowpassFilter(params.effects.lowpass);
        }
        if (this.audioManager.addDistortion) {
            await this.audioManager.addDistortion(params.effects.distortion);
        }
    }
    
    async applyLevelUpEffect(params) {
        if (this.audioManager.addCrescendoEffect) {
            await this.audioManager.addCrescendoEffect(params.effects.crescendo);
        }
    }
    
    /**
     * アクティブエフェクト更新
     */
    updateActiveEffects() {
        const now = Date.now();
        const expiredEffects = [];
        
        for (const [id, effect] of this.realtimeState.effectsActive) {
            const elapsed = now - effect.startTime;
            
            if (effect.duration && elapsed >= effect.duration) {
                expiredEffects.push(id);
            }
        }
        
        // 期限切れエフェクト削除
        for (const id of expiredEffects) {
            this.removeActiveEffect(id);
        }
    }
    
    /**
     * アクティブエフェクト削除
     */
    removeActiveEffect(effectId) {
        const effect = this.realtimeState.effectsActive.get(effectId);
        if (effect) {
            // クリーンアップ実行
            if (effect.cleanup) {
                effect.cleanup();
            }
            
            // エフェクトプールに戻す
            this.releaseEffect(effect);
            
            // アクティブリストから削除
            this.realtimeState.effectsActive.delete(effectId);
        }
    }
    
    /**
     * エフェクト取得
     */
    acquireEffect() {
        if (this.effectPool.available.length > 0) {
            return this.effectPool.available.pop();
        }
        
        // プール枯渇時は新規作成（パフォーマンス注意）
        return this.createPooledEffect();
    }
    
    /**
     * エフェクト解放
     */
    releaseEffect(effect) {
        // エフェクトリセット
        effect.type = null;
        effect.isActive = false;
        effect.startTime = 0;
        effect.duration = 0;
        effect.parameters = {};
        effect.cleanup = null;
        
        // プールに戻す
        this.effectPool.available.push(effect);
        this.effectPool.reused++;
    }
    
    /**
     * 全アクティブエフェクト停止
     */
    stopAllActiveEffects() {
        for (const [id, effect] of this.realtimeState.effectsActive) {
            this.removeActiveEffect(id);
        }
    }
    
    /**
     * コンボ状態更新
     */
    updateComboState() {
        const now = Date.now();
        const comboTimeout = 2000; // 2秒
        
        if (now - this.realtimeState.comboStartTime > comboTimeout) {
            this.realtimeState.currentCombo = 0;
        }
    }
    
    /**
     * パフォーマンス監視
     */
    monitorPerformance() {
        const currentConcurrentEffects = this.realtimeState.effectsActive.size;
        
        if (currentConcurrentEffects > this.statistics.peakConcurrentEffects) {
            this.statistics.peakConcurrentEffects = currentConcurrentEffects;
        }
        
        // パフォーマンス制限チェック
        if (currentConcurrentEffects > this.performanceSettings.maxConcurrentEffects) {
            console.warn('⚠️ RealtimeAudioFeedback: 同時エフェクト数が制限を超過');
            this.optimizePerformance();
        }
    }
    
    /**
     * パフォーマンス最適化
     */
    optimizePerformance() {
        // 優先度低いエフェクトを停止
        const effectsToRemove = [];
        
        for (const [id, effect] of this.realtimeState.effectsActive) {
            if (effect.type === 'shooting' || effect.type === 'enemyDefeat') {
                effectsToRemove.push(id);
            }
            
            if (effectsToRemove.length >= 3) break;
        }
        
        for (const id of effectsToRemove) {
            this.removeActiveEffect(id);
        }
    }
    
    /**
     * 処理時間記録
     */
    recordProcessingTime(processingTime) {
        this.statistics.averageResponseTime = 
            (this.statistics.averageResponseTime * 0.9) + (processingTime * 0.1);
    }
    
    /**
     * 統計情報取得
     */
    getStatistics() {
        return {
            ...this.statistics,
            currentActiveEffects: this.realtimeState.effectsActive.size,
            queueSize: this.realtimeState.actionQueue.length,
            poolReused: this.effectPool.reused,
            poolAvailable: this.effectPool.available.length
        };
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            realtimeState: this.realtimeState,
            statistics: this.getStatistics(),
            config: this.feedbackConfig,
            performance: this.performanceSettings
        };
    }
}