/**
 * MarioMiniGame - マリオ風復活ミニゲーム メインクラス
 * ゲームループ・状態管理・難易度システム・復活機能
 */
import { MarioPhysics } from './mario-physics.js';
import { MarioPlayer } from './mario-player.js';
import { MarioRenderer } from './mario-renderer.js';
import { EntityFactory } from './mario-entities.js';
import { MarioAudio } from './mario-audio.js';
import { MarioIntroSystem } from './mario-intro-system.js';

export class MarioMiniGame {
    constructor(canvas, ctx, parentGame) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.parentGame = parentGame; // メインゲームへの参照
        
        // サブシステム初期化
        this.physics = new MarioPhysics();
        this.renderer = new MarioRenderer(canvas, ctx);
        this.audio = new MarioAudio(parentGame ? parentGame.audioSystem : null);
        this.introSystem = new MarioIntroSystem(this, this.renderer, this.audio);
        
        // ゲーム状態
        this.gameState = 'loading'; // loading, playing, paused, completed, failed
        this.isPaused = false;
        this.isRunning = false;
        
        // プレイヤー
        this.player = new MarioPlayer(50, 600);
        this.setupPlayerAudio();
        
        // エンティティ
        this.entities = [];
        this.platforms = [];
        
        // ゲームロジック
        this.timeLimit = 60000;        // 60秒制限時間
        this.timeLeft = this.timeLimit;
        this.startTime = 0;
        this.requiredCoins = 3;
        this.collectedCoins = 0;
        this.goalReached = false;
        
        // 難易度設定
        this.difficulty = 0;
        this.difficultyConfig = {
            0: { enemies: 1, timeLimit: 90000, coins: 3, layout: 'tutorial' },
            1: { enemies: 2, timeLimit: 75000, coins: 3, layout: 'standard' },
            2: { enemies: 2, timeLimit: 60000, coins: 4, layout: 'platforms' },
            3: { enemies: 3, timeLimit: 60000, coins: 4, layout: 'maze' },
            4: { enemies: 3, timeLimit: 45000, coins: 5, layout: 'speed' },
            5: { enemies: 4, timeLimit: 45000, coins: 5, layout: 'hell' }
        };
        
        // 入力管理
        this.input = {
            left: false,
            right: false,
            jump: false,
            jumpPressed: false
        };
        
        // デバッグ設定
        this.debug = false;
        
        // 復活回数（親ゲームから取得）
        this.revivalCount = 0;
        
        // パフォーマンス管理
        this.lastTime = 0;
        this.deltaTime = 0;
        this.frameCount = 0;
        
        console.log('🍄 MarioMiniGame: Mario mini-game initialized');
    }
    
    /**
     * プレイヤー音響設定
     */
    setupPlayerAudio() {
        this.player.onJumpSound = () => this.audio.playSFX('jump');
        this.player.onLandSound = () => this.audio.playSFX('land');
        this.player.onCoinSound = () => this.audio.playSFX('coin');
        this.player.onDeathSound = () => this.audio.playSFX('death');
        this.player.onGoalSound = () => this.audio.playSFX('victory');
    }
    
    /**
     * ゲーム開始
     * @param {number} difficulty - 難易度レベル (0-5)
     */
    async start(difficulty = 0) {
        console.log('🚀 MarioMiniGame: Starting Mario game with difficulty', difficulty);
        
        try {
            this.difficulty = Math.min(difficulty, 5);
            this.gameState = 'loading';
            this.isRunning = true;
            this.isPaused = false;
            
            // 復活回数取得
            if (this.parentGame && this.parentGame.revivalSystem) {
                this.revivalCount = this.parentGame.revivalSystem.reviveCount;
            }
            
            // 難易度設定適用
            const config = this.difficultyConfig[this.difficulty];
            this.timeLimit = config.timeLimit;
            this.timeLeft = this.timeLimit;
            this.requiredCoins = config.coins;
            
            console.log('🎯 MarioMiniGame: Applied difficulty config:', config);
            
            // レベル生成
            console.log('🏗️ MarioMiniGame: Generating level...');
            this.generateLevel();
            console.log('✅ MarioMiniGame: Level generated with', this.entities.length, 'entities and', this.platforms.length, 'platforms');
            
            // プレイヤーリセット
            console.log('👤 MarioMiniGame: Resetting player...');
            this.player.reset(50, 600);
            this.collectedCoins = 0;
            this.goalReached = false;
            
            // 入力イベント設定
            console.log('🎮 MarioMiniGame: Setting up input...');
            this.setupInput();
            
            // 音響システム初期化
            console.log('🎵 MarioMiniGame: Initializing audio...');
            await this.initializeAudio();
            
            // イントロアニメーション再生
            console.log('🎬 MarioMiniGame: Playing intro animation...');
            await this.introSystem.playIntro(this.difficulty, this.revivalCount);
            
            // ゲーム状態を'playing'に変更
            this.gameState = 'playing';
            
            // タイマー開始
            this.startTime = Date.now();
            
            // ミニゲーム開始音
            // BGM機能削除により音楽なし
            
            // ゲームループ開始
            console.log('🔄 MarioMiniGame: Starting game loop...');
            this.gameLoop();
            
            console.log('✅ MarioMiniGame: Mario mini-game started successfully');
            
        } catch (error) {
            console.error('❌ MarioMiniGame: Failed to start game:', error);
            console.error('Stack trace:', error.stack);
            
            // エラー時はparentGameに失敗を通知
            if (this.parentGame) {
                this.parentGame.handleMarioGameFailure();
            }
        }
    }
    
    /**
     * レベル生成
     */
    generateLevel() {
        // エンティティリセット
        this.entities = [];
        this.platforms = [];
        
        // 基本レベル生成
        const levelEntities = EntityFactory.createBasicLevel(this.difficulty);
        
        // エンティティ分類
        levelEntities.forEach(entity => {
            if (entity.type === 'platform') {
                this.platforms.push(entity);
            } else {
                this.entities.push(entity);
            }
        });
        
        // コイン数確認・調整
        const coins = this.entities.filter(e => e.type === 'coin');
        this.requiredCoins = Math.min(this.requiredCoins, coins.length);
        
        // ゴール要求コイン数更新
        const goal = this.entities.find(e => e.type === 'goal');
        if (goal) {
            goal.requiredCoins = this.requiredCoins;
        }
        
        console.log('🏗️ MarioMiniGame: Level generated -', {
            difficulty: this.difficulty,
            entities: this.entities.length,
            platforms: this.platforms.length,
            requiredCoins: this.requiredCoins,
            timeLimit: this.timeLimit / 1000 + 's'
        });
    }
    
    /**
     * 入力設定
     */
    setupInput() {
        // キーボード入力
        this.keyDownHandler = (e) => this.handleKeyDown(e);
        this.keyUpHandler = (e) => this.handleKeyUp(e);
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        
        // モバイル入力（メインゲームのバーチャルスティック活用）
        if (this.parentGame.isMobile) {
            this.setupMobileInput();
        }
    }
    
    /**
     * キー押下処理
     */
    handleKeyDown(e) {
        switch (e.code) {
            case 'KeyA':
            case 'ArrowLeft':
                this.input.left = true;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.input.right = true;
                break;
            case 'KeyW':
            case 'ArrowUp':
            case 'Space':
                this.input.jump = true;
                e.preventDefault();
                break;
            case 'Escape':
                this.togglePause();
                break;
            case 'KeyR':
                if (this.gameState === 'failed') {
                    this.restart();
                }
                break;
        }
    }
    
    /**
     * キー離し処理
     */
    handleKeyUp(e) {
        switch (e.code) {
            case 'KeyA':
            case 'ArrowLeft':
                this.input.left = false;
                break;
            case 'KeyD':
            case 'ArrowRight':
                this.input.right = false;
                break;
            case 'KeyW':
            case 'ArrowUp':
            case 'Space':
                this.input.jump = false;
                break;
        }
    }
    
    /**
     * モバイル入力設定
     */
    setupMobileInput() {
        // メインゲームのバーチャルスティックを利用
        this.mobileInputTimer = setInterval(() => {
            if (!this.isRunning) return;
            
            const moveStick = this.parentGame.inputSystem.state.virtualSticks.move;
            const aimStick = this.parentGame.inputSystem.state.virtualSticks.aim;
            
            // 移動スティック
            this.input.left = moveStick.active && moveStick.x < -0.3;
            this.input.right = moveStick.active && moveStick.x > 0.3;
            
            // 照準スティック（ジャンプ）
            this.input.jump = aimStick.active && aimStick.y < -0.5;
        }, 16); // 60FPS
    }
    
    /**
     * ゲームループ
     */
    gameLoop() {
        // 🛡️ 重要: 複数条件でゲームループ停止を確実にする
        if (!this.isRunning || this.gameState === 'completed' || this.gameState === 'failed') {
            console.log('🚫 MarioMiniGame: Game loop stopped', {
                isRunning: this.isRunning,
                gameState: this.gameState,
                reason: !this.isRunning ? 'isRunning=false' : 'gameState=' + this.gameState
            });
            return;
        }
        
        const currentTime = Date.now();
        this.deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.016); // 16msキャップ
        this.lastTime = currentTime;
        
        // 更新処理
        if (!this.isPaused && this.gameState === 'playing') {
            this.update(this.deltaTime);
        }
        
        // 描画処理
        this.render();
        
        // 次フレーム
        if (this.isRunning) {
            requestAnimationFrame(() => this.gameLoop());
        }
    }
    
    /**
     * ゲーム更新
     */
    update(deltaTime) {
        // タイマー更新
        this.timeLeft -= deltaTime * 1000;
        
        // プレイヤー物理更新
        this.physics.updatePlayer(this.player, deltaTime, this.platforms, this.input);
        
        // プレイヤー更新
        this.player.update(deltaTime, this.input, this.entities);
        
        // エンティティ更新
        this.updateEntities(deltaTime);
        
        // ゲーム状態チェック
        this.checkGameConditions();
        
        this.frameCount++;
    }
    
    /**
     * エンティティ更新
     */
    updateEntities(deltaTime) {
        // エンティティ更新・削除
        this.entities = this.entities.filter(entity => {
            const shouldKeep = entity.update(deltaTime);
            
            // コイン収集チェック
            if (entity.type === 'coin' && entity.collected && !entity.countedForScore) {
                this.collectedCoins++;
                entity.countedForScore = true;
                console.log('🪙 MarioMiniGame: Coin collected!', this.collectedCoins, '/', this.requiredCoins);
            }
            
            // ゴール到達チェック
            if (entity.type === 'goal' && entity.reached) {
                this.goalReached = true;
            }
            
            return shouldKeep;
        });
        
        // 敵の物理更新
        this.entities.forEach(entity => {
            if (entity.type === 'enemy') {
                this.physics.updateEnemy(entity, deltaTime, this.platforms);
            }
        });
    }
    
    /**
     * ゲーム条件チェック
     */
    checkGameConditions() {
        // 勝利条件
        if (this.goalReached && this.collectedCoins >= this.requiredCoins) {
            this.gameCompleted();
            return;
        }
        
        // 敗北条件
        if (this.player.isDead || this.timeLeft <= 0) {
            this.gameFailed();
            return;
        }
    }
    
    /**
     * ゲームクリア
     */
    gameCompleted() {
        if (this.gameState !== 'playing') return;
        
        console.log('🎯 DEBUG: Mario game completing...');
        this.gameState = 'completed';
        this.isRunning = false;
        
        this.audio.playSFX('victory');
        this.audio.stopBGM();
        
        console.log('🏆 MarioMiniGame: Game completed!', {
            coins: this.collectedCoins,
            timeLeft: Math.ceil(this.timeLeft / 1000),
            difficulty: this.difficulty,
            parentGame: !!this.parentGame,
            gameState: this.gameState,
            isRunning: this.isRunning
        });
        
        // 少し遅延してからメインゲームに復帰
        console.log('⏰ DEBUG: Setting 2-second timeout for return to main game...');
        setTimeout(() => {
            console.log('⏰ DEBUG: Timeout triggered, calling returnToMainGame(true)...');
            try {
                this.returnToMainGame(true);
            } catch (error) {
                console.error('❌ DEBUG: Error in returnToMainGame:', error);
                console.error('❌ DEBUG: Error stack:', error.stack);
            }
        }, 2000);
    }
    
    /**
     * ゲーム失敗
     */
    gameFailed() {
        if (this.gameState !== 'playing') return;
        
        this.gameState = 'failed';
        this.isRunning = false;
        
        this.audio.playSFX('gameOver');
        this.audio.stopBGM();
        
        console.log('💀 MarioMiniGame: Game failed!', {
            reason: this.player.isDead ? 'Player died' : 'Time up',
            coins: this.collectedCoins,
            requiredCoins: this.requiredCoins
        });
        
        // 少し遅延してからメインゲームに復帰
        setTimeout(() => {
            this.returnToMainGame(false);
        }, 3000);
    }
    
    /**
     * メインゲームに復帰
     */
    returnToMainGame(success) {
        console.log('🔄 DEBUG: returnToMainGame called with success:', success);
        console.log('🔄 DEBUG: parentGame exists:', !!this.parentGame);
        console.log('🔄 DEBUG: Before cleanup - isRunning:', this.isRunning, 'gameState:', this.gameState);
        
        try {
            this.cleanup();
            console.log('✅ DEBUG: Mario cleanup completed');
        } catch (error) {
            console.error('❌ DEBUG: Error during cleanup:', error);
        }
        
        if (this.parentGame) {
            console.log('🎮 DEBUG: Calling parent game handler...');
            try {
                if (success) {
                    // 復活成功
                    console.log('🏆 DEBUG: Calling handleMarioGameSuccess()');
                    this.parentGame.handleMarioGameSuccess();
                } else {
                    // 復活失敗
                    console.log('💀 DEBUG: Calling handleMarioGameFailure()');
                    this.parentGame.handleMarioGameFailure();
                }
                console.log('✅ DEBUG: Parent game handler completed');
            } catch (error) {
                console.error('❌ DEBUG: Error in parent game handler:', error);
                console.error('❌ DEBUG: Error stack:', error.stack);
            }
        } else {
            console.error('❌ DEBUG: No parentGame reference found!');
        }
    }
    
    /**
     * 描画処理
     */
    render() {
        // 🛡️ 重要: ゲーム停止時は描画を完全に停止
        if (!this.isRunning || this.gameState === 'completed' || this.gameState === 'failed') {
            console.log('🚫 MarioMiniGame: Render blocked - game stopped', {
                isRunning: this.isRunning,
                gameState: this.gameState,
                frameCount: this.frameCount
            });
            return; // 描画処理を完全に停止
        }
        
        if (this.frameCount % 60 === 0) { // 1秒に1回ログ出力
            console.log('🎨 MarioMiniGame: Rendering frame', this.frameCount, 'state:', this.gameState);
        }
        
        try {
            // 画面クリア
            this.renderer.clear();
            
            // イントロアニメーション中の場合
            if (this.gameState === 'loading' && this.introSystem.isPlaying) {
                // 背景描画
                this.renderer.renderBackground();
                
                // プラットフォーム描画
                this.platforms.forEach(platform => {
                    this.renderer.renderPlatform(platform);
                });
                
                // エンティティ描画
                this.entities.forEach(entity => {
                    switch (entity.type) {
                        case 'coin':
                            this.renderer.renderCoin(entity);
                            break;
                        case 'enemy':
                            this.renderer.renderEnemy(entity);
                            break;
                        case 'goal':
                            this.renderer.renderGoal(entity);
                            break;
                        case 'key':
                            this.renderer.renderKey(entity);
                            break;
                        case 'hazard':
                            this.renderer.renderHazard(entity);
                            break;
                    }
                });
                
                // プレイヤー描画
                this.renderer.renderPlayer(this.player);
                
                // イントロアニメーション描画
                this.introSystem.render(this.ctx);
                
                return; // 通常のUI描画をスキップ
            }
            
            // 通常のゲーム描画
            // 背景描画
            this.renderer.renderBackground();
            
            // プラットフォーム描画
            this.platforms.forEach(platform => {
                this.renderer.renderPlatform(platform);
            });
            
            // エンティティ描画
            this.entities.forEach(entity => {
                switch (entity.type) {
                    case 'coin':
                        this.renderer.renderCoin(entity);
                        break;
                    case 'enemy':
                        this.renderer.renderEnemy(entity);
                        break;
                    case 'goal':
                        this.renderer.renderGoal(entity);
                        break;
                    case 'key':
                        this.renderer.renderKey(entity);
                        break;
                    case 'hazard':
                        this.renderer.renderHazard(entity);
                        break;
                }
            });
            
            // プレイヤー描画
            this.renderer.renderPlayer(this.player);
            
            // UI描画
            this.renderUI();
            
            // ゲーム状態別描画
            this.renderGameState();
            
            // デバッグ情報
            if (this.debug) {
                this.renderer.renderDebug(this.getGameState());
            }
            
        } catch (error) {
            console.error('❌ MarioMiniGame: Rendering error:', error);
        }
    }
    
    /**
     * UI描画
     */
    renderUI() {
        const gameState = this.getGameState();
        this.renderer.renderUI(gameState);
        
        // 追加UI
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 14px monospace';
        this.ctx.textAlign = 'right';
        
        // 難易度表示
        this.ctx.fillText(`Difficulty: ${this.difficulty + 1}`, this.canvas.width - 10, 30);
        
        // 復活回数（メインゲームから取得）
        if (this.parentGame && this.parentGame.revivalSystem) {
            const reviveCount = this.parentGame.revivalSystem.reviveCount;
            this.ctx.fillText(`Revival: ${reviveCount}`, this.canvas.width - 10, 50);
        }
    }
    
    /**
     * ゲーム状態別描画
     */
    renderGameState() {
        switch (this.gameState) {
            case 'completed':
                this.renderer.renderFade(0.5, '#00FF00');
                this.renderCenterText('STAGE CLEAR!', '#FFFFFF', 48);
                this.renderCenterText('Returning to main game...', '#FFFFFF', 24, 80);
                break;
                
            case 'failed':
                this.renderer.renderFade(0.7, '#FF0000');
                this.renderCenterText('GAME OVER', '#FFFFFF', 48);
                this.renderCenterText('Complete game over...', '#FFFFFF', 24, 80);
                break;
                
            case 'paused':
                this.renderer.renderFade(0.5, '#000000');
                this.renderCenterText('PAUSED', '#FFFFFF', 48);
                this.renderCenterText('Press ESC to resume', '#FFFFFF', 24, 80);
                break;
        }
    }
    
    /**
     * 中央テキスト描画
     */
    renderCenterText(text, color, size, offsetY = 0) {
        this.ctx.fillStyle = color;
        this.ctx.font = `bold ${size}px monospace`;
        this.ctx.textAlign = 'center';
        this.ctx.fillText(text, this.canvas.width / 2, this.canvas.height / 2 + offsetY);
    }
    
    /**
     * ポーズ切替
     */
    togglePause() {
        if (this.gameState !== 'playing' && this.gameState !== 'paused') return;
        
        this.isPaused = !this.isPaused;
        this.gameState = this.isPaused ? 'paused' : 'playing';
        
        console.log('⏸️ MarioMiniGame: Pause toggled -', this.isPaused);
    }
    
    /**
     * リスタート
     */
    restart() {
        console.log('🔄 MarioMiniGame: Restarting...');
        this.start(this.difficulty);
    }
    
    /**
     * ゲーム状態取得
     */
    getGameState() {
        return {
            player: this.player,
            entities: this.entities,
            platforms: this.platforms,
            coins: this.collectedCoins,
            requiredCoins: this.requiredCoins,
            timeLeft: this.timeLeft,
            health: this.player.health,
            debug: this.debug
        };
    }
    
    /**
     * 音響システム初期化
     */
    async initializeAudio() {
        try {
            await this.audio.initialize();
            
            // 親システムの音量設定と同期
            this.audio.syncWithParentVolume();
            
            // オーディオ初期化完了
            // BGM機能削除により音楽なし
            
            console.log('🎵 MarioMiniGame: Audio system initialized (BGM removed)');
            
        } catch (error) {
            console.error('❌ MarioMiniGame: Failed to initialize audio:', error);
        }
    }
    
    /**
     * クリーンアップ
     */
    cleanup() {
        console.log('🧹 MarioMiniGame: Starting comprehensive cleanup...');
        
        // 🛡️ 重要: ゲーム状態を確実に停止
        this.isRunning = false;
        this.gameState = 'failed'; // 明示的に終了状態に設定
        this.isPaused = true;      // 一時停止も設定
        
        // イベントリスナー削除
        if (this.keyDownHandler) {
            document.removeEventListener('keydown', this.keyDownHandler);
            document.removeEventListener('keyup', this.keyUpHandler);
            this.keyDownHandler = null;
            this.keyUpHandler = null;
        }
        
        // モバイル入力タイマークリア
        if (this.mobileInputTimer) {
            clearInterval(this.mobileInputTimer);
            this.mobileInputTimer = null;
        }
        
        // 音響システムクリーンアップ
        if (this.audio) {
            this.audio.cleanup();
        }
        
        // イントロシステムクリーンアップ
        if (this.introSystem) {
            this.introSystem.dispose();
        }
        
        // エンティティ配列をクリア
        this.entities = [];
        this.platforms = [];
        
        // プレイヤー状態をリセット
        if (this.player) {
            this.player.isDead = true;
        }
        
        console.log('✅ MarioMiniGame: Comprehensive cleanup completed', {
            isRunning: this.isRunning,
            gameState: this.gameState,
            entitiesCleared: true,
            listenersRemoved: true
        });
    }
    
    /**
     * デバッグモード切替
     */
    toggleDebug() {
        this.debug = !this.debug;
        console.log('🐛 MarioMiniGame: Debug mode -', this.debug);
    }
    
    /**
     * パフォーマンス情報取得
     */
    getPerformanceInfo() {
        return {
            frameCount: this.frameCount,
            deltaTime: this.deltaTime,
            entityCount: this.entities.length,
            platformCount: this.platforms.length,
            gameState: this.gameState,
            difficulty: this.difficulty
        };
    }
}