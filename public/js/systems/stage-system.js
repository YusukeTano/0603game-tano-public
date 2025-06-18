/**
 * StageSystem - ステージ進行管理システム
 * 既存のWave/BGM Phase/Boss進行を統合し、プレイヤーにとって分かりやすい進行表示を提供
 */
export class StageSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // ステージ進行状態
        this.currentStage = 1;
        this.waveInStage = 1; // 1-4（各ステージ内のウェーブ）
        this.stageProgress = 0; // 0-1（ステージ内進行度）
        this.stageTimer = 0;
        this.waveTimer = 0;
        
        // 安全性確保のための設定
        this.legacyMode = true; // 既存システムとの互換性維持
        this.enabled = true; // 緊急時の無効化フラグ
        this.isReady = false; // 初期化完了フラグ
        
        // ステージ設定
        this.waveDuration = 30000; // 30秒/ウェーブ
        this.stageWaveCount = 4; // 4ウェーブ/ステージ
        this.stageDuration = this.waveDuration * this.stageWaveCount; // 120秒/ステージ
        
        // ステージ完了エフェクト管理
        this.stageCompleteEffectShown = false;
        this.lastStageCompleted = 0;
        
        console.log('StageSystem: ステージシステム初期化完了');
        this.isReady = true;
    }
    
    /**
     * システム更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        if (!this.enabled) {
            return; // 無効化されている場合はスキップ
        }
        
        if (this.legacyMode) {
            // 既存のwaveシステムに追従（破壊的変更なし）
            this.syncWithLegacyWave();
        } else {
            // 独自のステージ進行（将来的な拡張用）
            this.updateStageProgress(deltaTime);
        }
        
        // ステージ完了エフェクトの管理
        this.checkStageCompletion();
    }
    
    /**
     * 既存のwaveシステムとの同期
     * @private
     */
    syncWithLegacyWave() {
        const legacyWave = this.game.stats.wave;
        const newStage = Math.floor((legacyWave - 1) / this.stageWaveCount) + 1;
        const newWaveInStage = ((legacyWave - 1) % this.stageWaveCount) + 1;
        
        // ステージ変化を検出
        if (newStage > this.currentStage) {
            this.onStageAdvance(newStage);
        }
        
        this.currentStage = newStage;
        this.waveInStage = newWaveInStage;
        
        // 修正：ステージ進行度を正確に計算
        // 現在のウェーブ内での進行度（0.0-1.0）
        const currentWaveProgress = Math.min(this.game.waveTimer / this.waveDuration, 1);
        
        // ステージ全体での進行度（0.0-1.0）
        // (完了したウェーブ数 + 現在ウェーブの進行度) / ステージ内総ウェーブ数
        const completedWavesInStage = this.waveInStage - 1; // 完了したウェーブ数（0-3）
        this.stageProgress = (completedWavesInStage + currentWaveProgress) / this.stageWaveCount;
        
        // 進行度が1.0を超えないように制限
        this.stageProgress = Math.min(this.stageProgress, 1.0);
        
        // デバッグログ追加
        if (Math.random() < 0.01) { // 1%の確率でログ出力（スパム防止）
            console.log('StageSystem: Progress calculation', {
                wave: legacyWave,
                stage: this.currentStage,
                waveInStage: this.waveInStage,
                waveTimer: this.game.waveTimer,
                waveDuration: this.waveDuration,
                currentWaveProgress: currentWaveProgress.toFixed(3),
                completedWavesInStage,
                stageProgress: this.stageProgress.toFixed(3)
            });
        }
    }
    
    /**
     * 独自ステージ進行処理（将来用）
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    updateStageProgress(deltaTime) {
        this.waveTimer += deltaTime * 1000;
        this.stageTimer += deltaTime * 1000;
        
        // ウェーブ進行
        if (this.waveTimer >= this.waveDuration) {
            this.nextWave();
        }
        
        // ステージ進行度計算
        this.stageProgress = (this.stageTimer % this.stageDuration) / this.stageDuration;
    }
    
    /**
     * 次ウェーブへの進行
     * @private
     */
    nextWave() {
        this.waveInStage++;
        this.waveTimer = 0;
        
        if (this.waveInStage > this.stageWaveCount) {
            this.nextStage();
        }
        
        console.log(`StageSystem: Wave advanced to ${this.currentStage}-${this.waveInStage}`);
    }
    
    /**
     * 次ステージへの進行
     * @private
     */
    nextStage() {
        this.currentStage++;
        this.waveInStage = 1;
        this.stageTimer = 0;
        this.waveTimer = 0;
        
        this.onStageAdvance(this.currentStage);
    }
    
    /**
     * ステージ進行時の処理
     * @param {number} newStage - 新しいステージ番号
     * @private
     */
    onStageAdvance(newStage) {
        console.log(`StageSystem: Advanced to Stage ${newStage}`);
        
        // ステージ完了エフェクト（前ステージ完了時）
        if (newStage > 1) {
            this.triggerStageCompleteEffect(newStage - 1);
        }
    }
    
    /**
     * ステージ完了チェック
     * @private
     */
    checkStageCompletion() {
        // ステージ完了の瞬間（4ウェーブ目の終了）を検出
        if (this.waveInStage === this.stageWaveCount && this.stageProgress > 0.95) {
            if (!this.stageCompleteEffectShown || this.lastStageCompleted !== this.currentStage) {
                this.triggerStageCompleteEffect(this.currentStage);
                this.stageCompleteEffectShown = true;
                this.lastStageCompleted = this.currentStage;
            }
        } else {
            this.stageCompleteEffectShown = false;
        }
    }
    
    /**
     * ステージ完了エフェクト発動
     * @param {number} completedStage - 完了したステージ番号
     * @private
     */
    triggerStageCompleteEffect(completedStage) {
        console.log(`StageSystem: Stage ${completedStage} completed!`);
        
        // パーティクルエフェクト
        if (this.game.particleSystem && this.game.particleSystem.createStageCompleteEffect) {
            this.game.particleSystem.createStageCompleteEffect(
                this.game.baseWidth / 2,
                this.game.baseHeight / 2
            );
        }
        
        // 経験値ボーナス
        if (this.game.levelSystem) {
            const bonusExp = completedStage * 50; // ステージ数 × 50 EXP
            this.game.levelSystem.addExperience(bonusExp);
            console.log(`StageSystem: Stage completion bonus: ${bonusExp} EXP`);
        }
    }
    
    /**
     * ステージ表示用テキスト取得
     * @returns {string} ステージ表示文字列
     */
    getDisplayText() {
        if (!this.enabled) {
            return `ウェーブ ${this.game.stats.wave}`; // フォールバック
        }
        return `ステージ ${this.currentStage}-${this.waveInStage}`;
    }
    
    /**
     * ステージ情報取得
     * @returns {Object} ステージ詳細情報
     */
    getStageInfo() {
        if (!this.enabled) {
            return this.getLegacyInfo();
        }
        
        return {
            stage: this.currentStage,
            wave: this.waveInStage,
            progress: this.stageProgress,
            musicPhase: this.getMusicPhase(),
            difficultyMultiplier: this.getDifficultyMultiplier(),
            shouldSpawnBoss: this.shouldSpawnBoss(),
            isStageEnd: this.isStageEnd()
        };
    }
    
    /**
     * 既存システム互換情報取得
     * @returns {Object} 既存システム形式の情報
     * @private
     */
    getLegacyInfo() {
        return {
            stage: Math.floor((this.game.stats.wave - 1) / 4) + 1,
            wave: ((this.game.stats.wave - 1) % 4) + 1,
            progress: 0,
            musicPhase: Math.min(Math.floor(this.game.stats.wave / 3), 13),
            difficultyMultiplier: 1 + this.game.stats.wave * 0.2,
            shouldSpawnBoss: false,
            isStageEnd: false
        };
    }
    
    
    /**
     * 難易度倍率取得
     * @returns {number} 難易度倍率
     */
    getDifficultyMultiplier() {
        // ステージ + ウェーブベースの難易度計算
        return 1 + (this.currentStage - 1) * 0.3 + (this.waveInStage - 1) * 0.1;
    }
    
    /**
     * ボススポーン判定
     * @returns {boolean} ボスをスポーンすべきかどうか
     */
    shouldSpawnBoss() {
        // 各ステージの最終ウェーブ（4ウェーブ目）でボススポーン
        return this.waveInStage === this.stageWaveCount;
    }
    
    /**
     * ステージ終了判定
     * @returns {boolean} ステージが終了に近いかどうか
     */
    isStageEnd() {
        return this.waveInStage === this.stageWaveCount && this.stageProgress > 0.8;
    }
    
    /**
     * システム準備状態確認
     * @returns {boolean} システムが準備完了かどうか
     */
    isSystemReady() {
        return this.isReady && this.enabled;
    }
    
    /**
     * 緊急時システム無効化
     */
    disable() {
        this.enabled = false;
        console.warn('StageSystem: システムが無効化されました（緊急時モード）');
    }
    
    /**
     * システム再有効化
     */
    enable() {
        this.enabled = true;
        console.log('StageSystem: システムが再有効化されました');
    }
    
    /**
     * レガシーモード切り替え
     * @param {boolean} useLegacy - レガシーモード使用フラグ
     */
    setLegacyMode(useLegacy) {
        this.legacyMode = useLegacy;
        console.log(`StageSystem: Legacy mode ${useLegacy ? 'enabled' : 'disabled'}`);
    }
    
    /**
     * 🎵 音楽フェーズ取得（互換性維持用）
     * 注意：BGMシステム廃止により実用的意味はないが、既存システムとの互換性維持のため実装
     * @returns {number} 音楽フェーズ（0-13の範囲）
     */
    getMusicPhase() {
        // StageSystemモード時：現在のステージとウェーブを基準とした計算
        if (this.enabled && this.isReady) {
            // ステージベースの音楽フェーズ計算
            const totalWaveEquivalent = (this.currentStage - 1) * 4 + this.waveInStage;
            return Math.min(Math.floor(totalWaveEquivalent / 3), 13);
        }
        
        // レガシーモード時：従来のウェーブベース計算（getLegacyInfo()と同じ）
        return Math.min(Math.floor(this.game.stats.wave / 3), 13);
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ用システム情報
     */
    getDebugInfo() {
        return {
            currentStage: this.currentStage,
            waveInStage: this.waveInStage,
            stageProgress: this.stageProgress.toFixed(3),
            enabled: this.enabled,
            legacyMode: this.legacyMode,
            isReady: this.isReady,
            legacyWave: this.game.stats.wave,
            musicPhase: this.getMusicPhase(),
            difficultyMultiplier: this.getDifficultyMultiplier().toFixed(2)
        };
    }
}