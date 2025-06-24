/**
 * MarioIntroSystem - マリオミニゲーム イントロアニメーションシステム
 * 制限時間強調 → コイン光演出 → 旗羽ばたき → ゲーム開始の4段階演出
 */
export class MarioIntroSystem {
    constructor(game, renderer, audio) {
        this.game = game;
        this.renderer = renderer;
        this.audio = audio;
        
        // アニメーション状態
        this.isPlaying = false;
        this.currentPhase = 0;
        this.startTime = 0;
        this.skipRequested = false;
        
        // フェーズ設定
        this.phases = [
            { name: 'timer', duration: 1000 },      // 制限時間強調 (1.0秒)
            { name: 'coins', duration: 1500 },      // コイン光演出 (1.5秒)
            { name: 'flag', duration: 1000 },       // 旗羽ばたき (1.0秒)
            { name: 'start', duration: 500 }        // ゲーム開始 (0.5秒)
        ];
        
        // アニメーション状態データ
        this.animationData = {
            timer: {
                size: 72,
                targetSize: 24,
                x: 0, y: 0,
                targetX: 0, targetY: 0,
                color: { r: 255, g: 68, b: 68 },
                targetColor: { r: 255, g: 255, b: 255 },
                pulse: 0
            },
            coins: {
                currentIndex: 0,
                animatingCoins: [],
                sparkles: []
            },
            flag: {
                flutterIntensity: 3.0,
                colorShift: 0,
                sparkles: []
            }
        };
        
        // 設定
        this.totalDuration = this.phases.reduce((sum, phase) => sum + phase.duration, 0);
        this.skipEnabled = true;
        
        console.log('🎬 MarioIntroSystem: Intro system initialized');
    }
    
    /**
     * イントロアニメーション開始
     * @param {number} difficulty - 難易度レベル
     * @param {number} revivalCount - 復活回数
     * @returns {Promise} アニメーション完了Promise
     */
    async playIntro(difficulty, revivalCount = 0) {
        console.log('🎬 MarioIntroSystem: Starting intro animation', { difficulty, revivalCount });
        
        if (this.isPlaying) {
            console.warn('🎬 MarioIntroSystem: Intro already playing');
            return;
        }
        
        this.isPlaying = true;
        this.skipRequested = false;
        this.currentPhase = 0;
        this.startTime = Date.now();
        
        // 復活回数に応じた調整
        const adjustments = this.getRevivalAdjustments(revivalCount);
        this.adjustDurations(adjustments);
        
        // 初期データ設定
        this.setupInitialData(difficulty);
        
        // スキップ入力監視開始
        this.setupSkipListeners();
        
        return new Promise((resolve) => {
            this.animationCompleteCallback = resolve;
            this.animationLoop();
        });
    }
    
    /**
     * 復活回数に応じた調整取得
     * @param {number} revivalCount - 復活回数
     * @returns {Object} 調整設定
     */
    getRevivalAdjustments(revivalCount) {
        const adjustments = {
            0: { durationMultiplier: 1.0, autoSkipTime: 0 },        // 初回: フル演出
            1: { durationMultiplier: 0.8, autoSkipTime: 0 },        // 1回目: 少し短縮
            2: { durationMultiplier: 0.6, autoSkipTime: 0 },        // 2回目: 更に短縮
            3: { durationMultiplier: 0.4, autoSkipTime: 2000 }      // 3回目以降: 最短 + 自動スキップ
        };
        
        const key = Math.min(revivalCount, 3);
        return adjustments[key];
    }
    
    /**
     * アニメーション時間調整
     * @param {Object} adjustments - 調整設定
     */
    adjustDurations(adjustments) {
        this.phases.forEach(phase => {
            phase.duration *= adjustments.durationMultiplier;
        });
        
        this.totalDuration = this.phases.reduce((sum, phase) => sum + phase.duration, 0);
        
        // 自動スキップ設定
        if (adjustments.autoSkipTime > 0) {
            setTimeout(() => {
                if (this.isPlaying) {
                    this.skip();
                }
            }, adjustments.autoSkipTime);
        }
    }
    
    /**
     * 初期データ設定
     * @param {number} difficulty - 難易度レベル
     */
    setupInitialData(difficulty) {
        const config = this.game.difficultyConfig[difficulty];
        
        // タイマー演出初期設定
        this.animationData.timer.targetX = this.game.canvas.width - 100;
        this.animationData.timer.targetY = 40;
        this.animationData.timer.timeLimit = Math.ceil(config.timeLimit / 1000);
        
        // コイン演出初期設定
        this.animationData.coins.coinEntities = this.game.entities.filter(e => e.type === 'coin');
        this.animationData.coins.currentIndex = 0;
        this.animationData.coins.animatingCoins = [];
        
        // 旗演出初期設定
        this.animationData.flag.goalEntity = this.game.entities.find(e => e.type === 'goal');
    }
    
    /**
     * スキップ入力監視設定
     */
    setupSkipListeners() {
        this.keyDownHandler = (e) => {
            if (this.isPlaying && this.skipEnabled) {
                this.skip();
            }
        };
        
        this.clickHandler = (e) => {
            if (this.isPlaying && this.skipEnabled) {
                this.skip();
            }
        };
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('click', this.clickHandler);
    }
    
    /**
     * スキップ実行
     */
    skip() {
        if (!this.isPlaying) return;
        
        console.log('⏭️ MarioIntroSystem: Intro skipped');
        this.skipRequested = true;
        this.completeIntro();
    }
    
    /**
     * メインアニメーションループ
     */
    animationLoop() {
        if (!this.isPlaying || this.skipRequested) {
            return;
        }
        
        const currentTime = Date.now();
        const elapsed = currentTime - this.startTime;
        
        // 現在のフェーズ決定
        let phaseElapsed = 0;
        let phaseIndex = 0;
        
        for (let i = 0; i < this.phases.length; i++) {
            if (elapsed < phaseElapsed + this.phases[i].duration) {
                phaseIndex = i;
                break;
            }
            phaseElapsed += this.phases[i].duration;
        }
        
        // アニメーション完了チェック
        if (elapsed >= this.totalDuration) {
            this.completeIntro();
            return;
        }
        
        // フェーズ更新
        this.currentPhase = phaseIndex;
        const phaseProgress = (elapsed - phaseElapsed) / this.phases[phaseIndex].duration;
        
        // フェーズ別アニメーション実行
        this.updatePhaseAnimation(phaseIndex, phaseProgress);
        
        // 次フレーム
        requestAnimationFrame(() => this.animationLoop());
    }
    
    /**
     * フェーズ別アニメーション更新
     * @param {number} phaseIndex - フェーズインデックス
     * @param {number} progress - フェーズ進行度 (0-1)
     */
    updatePhaseAnimation(phaseIndex, progress) {
        switch (phaseIndex) {
            case 0: // タイマー強調
                this.updateTimerAnimation(progress);
                break;
            case 1: // コイン光演出
                this.updateCoinAnimation(progress);
                break;
            case 2: // 旗羽ばたき
                this.updateFlagAnimation(progress);
                break;
            case 3: // ゲーム開始
                this.updateStartAnimation(progress);
                break;
        }
    }
    
    /**
     * タイマー強調アニメーション更新
     * @param {number} progress - 進行度 (0-1)
     */
    updateTimerAnimation(progress) {
        const data = this.animationData.timer;
        const eased = this.easeOutQuart(progress);
        
        // サイズ変化
        data.size = data.targetSize + (72 - data.targetSize) * (1 - eased);
        
        // 位置変化
        const centerX = this.game.canvas.width / 2;
        const centerY = this.game.canvas.height / 2;
        data.x = centerX + (data.targetX - centerX) * eased;
        data.y = centerY + (data.targetY - centerY) * eased;
        
        // 色変化
        data.color.r = data.targetColor.r + (255 - data.targetColor.r) * (1 - eased);
        data.color.g = data.targetColor.g + (68 - data.targetColor.g) * (1 - eased);
        data.color.b = data.targetColor.b + (68 - data.targetColor.b) * (1 - eased);
        
        // パルス効果
        data.pulse = Math.sin(Date.now() * 0.01) * 0.1 + 1.0;
    }
    
    /**
     * コイン光演出アニメーション更新
     * @param {number} progress - 進行度 (0-1)
     */
    updateCoinAnimation(progress) {
        const data = this.animationData.coins;
        const coinCount = data.coinEntities.length;
        
        if (coinCount === 0) return;
        
        // 順次光らせるコインのインデックス計算
        const targetIndex = Math.floor(progress * coinCount);
        
        // 新しいコインのアニメーション開始
        if (targetIndex > data.currentIndex && targetIndex < coinCount) {
            data.currentIndex = targetIndex;
            const coin = data.coinEntities[targetIndex];
            
            data.animatingCoins.push({
                entity: coin,
                startTime: Date.now(),
                duration: 300
            });
            
            // スパークルエフェクト追加
            this.addCoinSparkles(coin);
        }
        
        // アニメーション中のコイン更新
        data.animatingCoins = data.animatingCoins.filter(animCoin => {
            const elapsed = Date.now() - animCoin.startTime;
            const coinProgress = Math.min(elapsed / animCoin.duration, 1.0);
            
            // コインのスケールアニメーション
            animCoin.scale = 1.0 + Math.sin(coinProgress * Math.PI) * 0.5;
            
            return coinProgress < 1.0;
        });
    }
    
    /**
     * 旗羽ばたきアニメーション更新
     * @param {number} progress - 進行度 (0-1)
     */
    updateFlagAnimation(progress) {
        const data = this.animationData.flag;
        
        if (!data.goalEntity) return;
        
        // 強いはためき効果
        data.flutterIntensity = 3.0 + Math.sin(progress * Math.PI) * 2.0;
        
        // 色変化 (通常 → ゴールド → 通常)
        data.colorShift = Math.sin(progress * Math.PI) * 0.8;
        
        // スパークルエフェクト
        if (Math.random() < 0.3) {
            this.addFlagSparkles(data.goalEntity);
        }
    }
    
    /**
     * ゲーム開始アニメーション更新
     * @param {number} progress - 進行度 (0-1)
     */
    updateStartAnimation(progress) {
        // フェードイン効果
        this.fadeAlpha = progress;
    }
    
    /**
     * コインスパークルエフェクト追加
     * @param {Object} coin - コインエンティティ
     */
    addCoinSparkles(coin) {
        const sparkles = this.animationData.coins.sparkles;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            sparkles.push({
                x: coin.x + coin.width / 2,
                y: coin.y + coin.height / 2,
                vx: Math.cos(angle) * 50,
                vy: Math.sin(angle) * 50,
                life: 1.0,
                maxLife: 0.8
            });
        }
    }
    
    /**
     * 旗スパークルエフェクト追加
     * @param {Object} goal - ゴールエンティティ
     */
    addFlagSparkles(goal) {
        const sparkles = this.animationData.flag.sparkles;
        
        for (let i = 0; i < 3; i++) {
            sparkles.push({
                x: goal.x + Math.random() * goal.width,
                y: goal.y - 60 + Math.random() * 40,
                vx: (Math.random() - 0.5) * 30,
                vy: (Math.random() - 0.5) * 30,
                life: 1.0,
                maxLife: 1.2
            });
        }
    }
    
    /**
     * イージング関数 - easeOutQuart
     * @param {number} t - 進行度 (0-1)
     * @returns {number} イージング適用後の値
     */
    easeOutQuart(t) {
        return 1 - Math.pow(1 - t, 4);
    }
    
    /**
     * イントロアニメーション完了
     */
    completeIntro() {
        this.isPlaying = false;
        
        // イベントリスナー削除
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('click', this.clickHandler);
        
        console.log('✅ MarioIntroSystem: Intro animation completed');
        
        if (this.animationCompleteCallback) {
            this.animationCompleteCallback();
        }
    }
    
    /**
     * イントロアニメーション描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    render(ctx) {
        if (!this.isPlaying) return;
        
        ctx.save();
        
        // フェーズ別描画
        switch (this.currentPhase) {
            case 0: // タイマー強調
                this.renderTimerPhase(ctx);
                break;
            case 1: // コイン光演出
                this.renderCoinPhase(ctx);
                break;
            case 2: // 旗羽ばたき
                this.renderFlagPhase(ctx);
                break;
            case 3: // ゲーム開始
                this.renderStartPhase(ctx);
                break;
        }
        
        // スキップ案内表示
        this.renderSkipHint(ctx);
        
        ctx.restore();
    }
    
    /**
     * タイマーフェーズ描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    renderTimerPhase(ctx) {
        const data = this.animationData.timer;
        
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // パルス効果適用
        const scale = data.pulse;
        ctx.scale(scale, scale);
        
        // 色設定
        const color = `rgb(${Math.round(data.color.r)}, ${Math.round(data.color.g)}, ${Math.round(data.color.b)})`;
        ctx.fillStyle = color;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        
        // フォント設定
        ctx.font = `bold ${data.size}px Arial`;
        
        // テキスト描画
        const text = data.timeLimit.toString();
        ctx.strokeText(text, data.x / scale, data.y / scale);
        ctx.fillText(text, data.x / scale, data.y / scale);
        
        ctx.restore();
    }
    
    /**
     * コインフェーズ描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    renderCoinPhase(ctx) {
        const data = this.animationData.coins;
        
        // アニメーション中のコイン描画
        data.animatingCoins.forEach(animCoin => {
            const coin = animCoin.entity;
            const scale = animCoin.scale || 1.0;
            
            ctx.save();
            ctx.translate(coin.x + coin.width / 2, coin.y + coin.height / 2);
            ctx.scale(scale, scale);
            
            // 明るいグロー効果
            ctx.shadowColor = '#FFFF00';
            ctx.shadowBlur = 20;
            ctx.fillStyle = '#FFFF00';
            ctx.fillRect(-coin.width / 2, -coin.height / 2, coin.width, coin.height);
            
            ctx.restore();
        });
        
        // スパークル描画
        this.renderSparkles(ctx, data.sparkles);
        
        // テキスト表示
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Collect ${this.game.requiredCoins} coins!`, this.game.canvas.width / 2, this.game.canvas.height - 100);
    }
    
    /**
     * 旗フェーズ描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    renderFlagPhase(ctx) {
        const data = this.animationData.flag;
        
        if (!data.goalEntity) return;
        
        // 旗の強調描画
        const goal = data.goalEntity;
        
        ctx.save();
        
        // ゴールド色効果
        if (data.colorShift > 0) {
            ctx.fillStyle = `rgba(255, 215, 0, ${data.colorShift})`;
            ctx.fillRect(goal.x, goal.y - 100, goal.width, 132);
        }
        
        // スパークル描画
        this.renderSparkles(ctx, data.sparkles);
        
        ctx.restore();
        
        // テキスト表示
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Reach the flag!', this.game.canvas.width / 2, this.game.canvas.height - 100);
    }
    
    /**
     * ゲーム開始フェーズ描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    renderStartPhase(ctx) {
        // フェードイン効果
        if (this.fadeAlpha < 1.0) {
            ctx.fillStyle = `rgba(0, 0, 0, ${1.0 - this.fadeAlpha})`;
            ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        }
    }
    
    /**
     * スパークル描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     * @param {Array} sparkles - スパークル配列
     */
    renderSparkles(ctx, sparkles) {
        sparkles.forEach(sparkle => {
            if (sparkle.life > 0) {
                const alpha = sparkle.life / sparkle.maxLife;
                ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
                ctx.fillRect(sparkle.x - 2, sparkle.y - 2, 4, 4);
                
                // スパークル更新
                sparkle.x += sparkle.vx * 0.016;
                sparkle.y += sparkle.vy * 0.016;
                sparkle.life -= 0.016;
            }
        });
        
        // 寿命切れスパークル削除
        sparkles.filter(sparkle => sparkle.life > 0);
    }
    
    /**
     * スキップ案内描画
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    renderSkipHint(ctx) {
        if (!this.skipEnabled) return;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '14px Arial';
        ctx.textAlign = 'right';
        ctx.fillText('Press any key to skip', this.game.canvas.width - 10, this.game.canvas.height - 10);
    }
    
    /**
     * システム破棄
     */
    dispose() {
        if (this.isPlaying) {
            this.skip();
        }
        
        console.log('🧹 MarioIntroSystem: System disposed');
    }
}