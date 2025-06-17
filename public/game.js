import { ToneAudioSystem as AudioSystem } from './js/systems/audio-system.js';
import { InputSystem } from './js/systems/input-system.js';
import { RenderSystem } from './js/systems/render-system.js';
import { PhysicsSystem } from './js/systems/physics-system.js';
import { WeaponSystem } from './js/systems/weapon-system.js';
import { EnemySystem } from './js/systems/enemy-system.js';
import { ParticleSystem } from './js/systems/particle-system.js';
import { LevelSystem } from './js/systems/level-system.js';
import { PickupSystem } from './js/systems/pickup-system.js';
import { UISystem } from './js/systems/ui-system.js';
import { BulletSystem } from './js/systems/bullet-system.js';
import { StageSystem } from './js/systems/stage-system.js';
import { WaveSystem } from './js/systems/wave-system.js';
import { SettingsSystem } from './js/systems/settings-system.js';
import { BackgroundSystem } from './js/systems/background-system.js';
import { Player } from './js/entities/player.js';
import { CharacterFactory } from './js/entities/character-factory.js';
import { TutorialConfig } from './js/config/tutorial.js';
import { MarioMiniGame } from './js/mini-games/mario-mini-game.js';

export class ZombieSurvival {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // システム初期化
        this.audioSystem = new AudioSystem(this);
        this.inputSystem = new InputSystem(this); // Input State Object パターン
        this.renderSystem = new RenderSystem(this); // 描画システム
        this.physicsSystem = new PhysicsSystem(this); // 物理システム
        this.weaponSystem = new WeaponSystem(this); // 武器システム
        this.enemySystem = new EnemySystem(this); // 敵システム
        this.particleSystem = new ParticleSystem(this); // パーティクルシステム
        this.levelSystem = new LevelSystem(this); // レベルシステム
        this.pickupSystem = new PickupSystem(this); // アイテムシステム
        this.uiSystem = new UISystem(this); // UI管理システム
        this.bulletSystem = new BulletSystem(this); // 弾丸管理システム
        this.stageSystem = new StageSystem(this); // ステージ進行システム
        this.waveSystem = new WaveSystem(this); // 999ウェーブシステム
        this.settingsSystem = new SettingsSystem(this); // 設定管理システム
        // BackgroundSystemは setupCanvas() 後に初期化
        
        // ゲーム状態
        this.gameState = 'loading'; // loading, menu, characterSelect, playing, paused, gameOver, marioMiniGame
        this.isPaused = false;
        
        // キャラクター選択
        this.selectedCharacter = 'ray'; // デフォルトキャラクター
        this.characterConfig = null;
        
        // プレイヤー（Playerクラス使用）
        this.player = new Player(640, 360); // 基準解像度の中央に配置
        this.player.setGame(this); // ゲーム参照を設定（分身システム通信用）
        
        // 武器システム（複数武器対応）
        // 武器関連はWeaponSystemで管理
        
        // ゲーム統計
        this.stats = {
            score: 0,
            kills: 0,
            wave: 1,
            gameTime: 0,
            startTime: 0
        };
        
        // コンボシステム
        this.combo = {
            count: 0,
            maxCombo: 0
        };
        
        // エンティティ
        this.enemies = [];
        // 弾丸管理はBulletSystemに移行
        // pickups は PickupSystem で管理
        // particles は ParticleSystem で管理
        // bloodSplatters は削除（爆発エフェクトに変更）
        
        // 背景要素
        this.backgroundElements = [];
        this.backgroundParticles = [];
        this.initBackground();
        
        // 入力 - InputSystemに移行
        this.isMobile = this.inputSystem.isMobile;
        
        // UI表示状態
        
        // ゲーム設定
        this.camera = { x: 0, y: 0 };
        this.enemySpawnTimer = 0;
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        
        // システム切り替え設定
        this.useNewWaveSystem = true; // 999ウェーブシステム有効化フラグ（デフォルト有効）
        this.debugWaveSystem = false;  // デバッグ用フラグ
        
        // 999ウェーブシステムはデフォルト有効（モード選択UI不要）
        console.log('🎮 999ウェーブシステム: デフォルト有効化済み');
        
        // ローカルストレージ
        this.highScore = parseInt(localStorage.getItem('zombieSurvivalHighScore')) || 0;
        
        // マリオ復活システム
        this.marioGame = null;
        this.revivalSystem = {
            hasReviveData: false,
            reviveCount: 0,
            savedGameData: null,
            marioDifficulty: 0
        };
        
        // 非同期初期化を開始
        this.init().catch(error => {
            console.error('❌ Game: Initialization failed:', error);
        });
        
        // Playerクラスにゲーム参照を設定
        this.player.setGame(this);
    }
    
    // 現在の武器を取得（WeaponSystemに移行）
    getCurrentWeapon() {
        return this.weaponSystem.getCurrentWeapon();
    }
    
    // アイテム配列の取得（PickupSystemに移行）
    get pickups() {
        return this.pickupSystem.getPickups();
    }
    
    // セカンダリ武器を取得
    
    
    // 武器をアップグレードで取得した際の処理（WeaponSystemに移行）
    unlockWeapon(weaponKey) {
        const weapon = this.weaponSystem.getWeapon(weaponKey);
        if (weapon && !weapon.unlocked) {
            this.weaponSystem.unlockWeapon(weaponKey);
            
            // 制限弾薬武器の場合、自動で切り替える
            if (weapon.limitedAmmo) {
                this.weaponSystem.switchWeapon(weaponKey);
            }
        }
    }
    
    // 武器の説明を取得
    getWeaponDescription(weaponKey) {
        const descriptions = {
            plasma: '標準的なプラズマ武器、無限弾薬',
            nuke: '強力な爆発ダメージ、限定使用'
        };
        return descriptions[weaponKey] || '特殊武器';
    }
    
    
    
    // 背景要素の初期化（シンプル化 - 敵と混同する要素を削除）
    initBackground() {
        // 固定背景システムのため、動的な背景要素は不要
        this.backgroundElements = [];
        
        // 背景パーティクル（非常に薄く、小さく調整）
        for (let i = 0; i < 20; i++) { // 40個から20個に削減
            this.backgroundParticles.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                vx: (Math.random() - 0.5) * 8, // 速度を遅く
                vy: (Math.random() - 0.5) * 8,
                size: 0.5 + Math.random() * 1, // サイズを小さく
                alpha: 0.1 + Math.random() * 0.2, // より薄く
                color: `rgba(${200 + Math.random() * 55}, ${200 + Math.random() * 55}, ${220 + Math.random() * 35}, ${0.1 + Math.random() * 0.2})`, // 青白く薄く
                life: 3000 + Math.random() * 6000, // 長寿命
                maxLife: 3000 + Math.random() * 6000
            });
        }
        
        console.log('Background initialized: Simple static pattern system');
    }
    
    detectMobile() {
        // 段階的モバイル検出（PC誤判定を防止）
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 1. 確実なモバイルデバイス判定（最優先）
        const isAppleMobile = /iphone|ipad|ipod/i.test(userAgent);
        const isAndroid = /android/i.test(userAgent);
        const isMobileUA = /webos|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // 2. タッチ機能の判定
        const hasTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
        const hasTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
        
        // 3. 真のPCデバイス判定（除外条件）
        const hasHoverCapability = window.matchMedia('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        const isProbablyPC = hasHoverCapability && hasFinePointer && !hasTouchPoints;
        
        // 4. 画面サイズベースの判定（改善版）
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const maxDimension = Math.max(screenWidth, screenHeight);
        const minDimension = Math.min(screenWidth, screenHeight);
        
        // モバイル画面サイズの判定（より厳密）
        const isMobileSize = maxDimension <= 1024 && minDimension <= 768;
        const isTabletSize = maxDimension <= 1366 && minDimension <= 1024 && (isAppleMobile || isAndroid);
        
        console.log('Mobile detection (improved):', {
            userAgent: userAgent.substring(0, 50) + '...',
            isAppleMobile,
            isAndroid,
            isMobileUA,
            hasTouchPoints,
            hasTouch,
            hasHoverCapability,
            hasFinePointer,
            isProbablyPC,
            dimensions: `${screenWidth}x${screenHeight}`,
            maxDimension,
            minDimension,
            isMobileSize,
            isTabletSize
        });
        
        // 5. 最終判定（優先順位付き）
        let isMobile = false;
        let reason = '';
        
        // 確実なモバイルデバイスは常にモバイル扱い
        if (isAppleMobile || isAndroid || isMobileUA) {
            isMobile = true;
            reason = 'Definite mobile device (UA)';
        }
        // 確実なPCデバイスは常にPC扱い（条件を緩和）
        else if (isProbablyPC) {
            isMobile = false;
            reason = 'Definite PC device (hover+fine pointer)';
        }
        // 大画面デバイスは PC扱い（ホバー機能がなくても）
        else if (maxDimension > 1366 && !hasTouchPoints) {
            isMobile = false;
            reason = 'Large screen without touch';
        }
        // タブレットサイズのタッチデバイス
        else if (isTabletSize && hasTouchPoints) {
            isMobile = true;
            reason = 'Tablet with touch';
        }
        // モバイルサイズ画面
        else if (isMobileSize) {
            isMobile = true;
            reason = 'Mobile screen size';
        }
        // タッチ機能のあるデバイス（中サイズ画面）
        else if (hasTouchPoints && maxDimension <= 1366) {
            isMobile = true;
            reason = 'Touch-enabled device (medium screen)';
        }
        // その他はPC扱い
        else {
            isMobile = false;
            reason = 'Default PC classification';
        }
        
        console.log(`→ Final decision: ${isMobile ? 'MOBILE' : 'DESKTOP'} (${reason})`);
        return isMobile;
    }
    
    async init() {
        console.log('Initializing game...');
        console.log('InputSystem (State Object Pattern) initialized:', this.inputSystem ? '✅' : '❌');
        console.log('AudioSystem initialized:', this.audioSystem ? '✅' : '❌');
        
        // 初期状態ではタッチ制限を完全に解除
        document.body.style.touchAction = 'auto';
        document.body.style.overflow = 'hidden'; // スクロール防止
        document.body.style.pointerEvents = 'auto';
        
        // HTML要素の基本設定
        const htmlElement = document.documentElement;
        htmlElement.style.touchAction = 'auto';
        
        this.setupCanvas();
        
        // AudioSystem早期初期化（BGM機能復旧のため）
        try {
            console.log('🎵 Game: Initializing AudioSystem early...');
            await this.audioSystem.initAudio();
            console.log('✅ Game: AudioSystem early initialization completed');
        } catch (error) {
            console.error('❌ Game: AudioSystem early initialization failed:', error);
            console.error('Error details:', error.stack);
            // 初期化失敗時も継続（フォールバックモードで動作）
        }
        
        // Canvas設定完了後にBackgroundSystemを初期化
        this.backgroundSystem = new BackgroundSystem(this); // A+C+D統合背景システム
        
        this.setupEventListeners();
        
        // モバイル検出とUI設定の同期
        this.uiSystem.updateUIForDevice();
        
        // PC環境の強制確認（デバッグ・安全措置）
        setTimeout(() => {
            if (window.innerWidth > 1024 && window.innerHeight > 600) {
                const hasHover = window.matchMedia('(hover: hover)').matches;
                const hasPointer = window.matchMedia('(pointer: fine)').matches;
                
                if (hasHover && hasPointer && this.isMobile) {
                    console.log('🔧 Force correcting mobile detection for PC');
                    this.isMobile = false;
                    this.uiSystem.updateUIForDevice();
                }
            }
        }, 1000);
        
        if (this.isMobile) {
            console.log('Mobile device detected, setting up mobile controls');
            this.setupMobileControls();
        }
        
        // 初期化完了後の最終チェック
        setTimeout(() => {
            console.log('Final initialization check...');
            document.body.style.touchAction = 'auto';
            
            // メニューボタンの存在確認
            const startButton = document.getElementById('start-game-btn');
            if (startButton) {
                console.log('Start button found during init');
            } else {
                console.warn('Start button not found during init');
            }
        }, 500);
        this.loadGame();
    }
    
    
    
    setupCanvas() {
        // 基準解像度設定（PCでの標準的なゲーム画面サイズ）
        this.baseWidth = 1280;
        this.baseHeight = 720;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => {
            this.resizeCanvas();
            // リサイズ時にデバイス判定を更新（画面回転対応）
            setTimeout(() => this.uiSystem.updateUIForDevice(), 100);
        });
        
        // 画面回転のイベントリスナーも追加
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.resizeCanvas();
                this.uiSystem.updateUIForDevice();
            }, 200);
        });
    }
    
    resizeCanvas() {
        // Safe Area考慮した実際の表示領域を取得
        const availableWidth = window.innerWidth;
        const availableHeight = window.innerHeight;
        
        // iOS Safari対応: 100vh問題の解決
        if (this.isMobile && /iPhone|iPad|iPod/i.test(navigator.userAgent)) {
            document.documentElement.style.setProperty('--vh', `${availableHeight * 0.01}px`);
        }
        
        // iOS SafariでのSafe Area対応: 利用可能な領域を正確に計算
        let safeTop = 0;
        let safeBottom = 0;
        let safeLeft = 0;
        let safeRight = 0;
        
        // Safe Area inset値を取得（CSS環境変数から）
        if (window.CSS && CSS.supports('padding', 'env(safe-area-inset-top)')) {
            const style = getComputedStyle(document.documentElement);
            safeTop = parseFloat(style.getPropertyValue('padding-top')) || 0;
            safeBottom = parseFloat(style.getPropertyValue('padding-bottom')) || 0;
            safeLeft = parseFloat(style.getPropertyValue('padding-left')) || 0;
            safeRight = parseFloat(style.getPropertyValue('padding-right')) || 0;
        }
        
        // Safe Areaを考慮した実際の利用可能領域
        const safeWidth = availableWidth - safeLeft - safeRight;
        const safeHeight = availableHeight - safeTop - safeBottom;
        
        // アスペクト比を維持したスケーリング（Safe Area考慮）
        const scaleX = safeWidth / this.baseWidth;
        const scaleY = safeHeight / this.baseHeight;
        this.gameScale = Math.min(scaleX, scaleY);
        
        // キャンバスサイズ設定（基準解像度ベース）
        const displayWidth = this.baseWidth * this.gameScale;
        const displayHeight = this.baseHeight * this.gameScale;
        
        // CSS表示サイズ設定
        this.canvas.style.width = displayWidth + 'px';
        this.canvas.style.height = displayHeight + 'px';
        
        // Safe Areaを考慮した配置（transform使用を避ける）
        this.canvas.style.position = 'absolute';
        this.canvas.style.left = safeLeft + (safeWidth - displayWidth) / 2 + 'px';
        this.canvas.style.top = safeTop + (safeHeight - displayHeight) / 2 + 'px';
        
        // transformを削除してSafe Areaとの競合を解決
        this.canvas.style.transform = 'none';
        
        // デバイスピクセル比対応（高解像度対応）
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = this.baseWidth * dpr;
        this.canvas.height = this.baseHeight * dpr;
        this.ctx.scale(dpr, dpr);
        
        // デバッグ情報出力（開発時のみ）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('Canvas positioning:', {
                availableWidth, availableHeight,
                safeTop, safeBottom, safeLeft, safeRight,
                safeWidth, safeHeight,
                displayWidth, displayHeight,
                finalLeft: safeLeft + (safeWidth - displayWidth) / 2,
                finalTop: safeTop + (safeHeight - displayHeight) / 2,
                gameScale: this.gameScale
            });
        }
    }
    
    setupMenuButton(buttonId, callback) {
        const button = document.getElementById(buttonId);
        if (!button) {
            console.error(`Button not found: ${buttonId}`);
            return;
        }
        
        console.log(`Setting up button: ${buttonId}`);
        
        // 既存のイベントリスナーをクリア
        const newButton = button.cloneNode(true);
        button.parentNode.replaceChild(newButton, button);
        
        // ボタンの基本設定を強制
        newButton.style.zIndex = '1000';
        newButton.style.pointerEvents = 'auto';
        newButton.style.touchAction = 'manipulation';
        newButton.style.webkitTapHighlightColor = 'transparent';
        newButton.style.position = 'relative';
        
        // タッチ状態管理
        let touchStarted = false;
        let touchIdentifier = null;
        
        // クリックイベント（PC用）
        newButton.addEventListener('click', (e) => {
            console.log(`Button clicked: ${buttonId}`, e);
            e.preventDefault();
            e.stopPropagation();
            
            // 音響コンテキスト再開
            this.audioSystem.resumeAudioContext();
            
            callback();
        });
        
        // touchstart イベント（iOS Safari 対応）
        newButton.addEventListener('touchstart', (e) => {
            console.log(`Button touchstart: ${buttonId}`, e.touches.length);
            e.preventDefault();
            e.stopPropagation();
            
            // 最初のタッチのみ処理
            if (e.touches.length === 1 && !touchStarted) {
                touchStarted = true;
                touchIdentifier = e.touches[0].identifier;
                
                // ボタンの視覚的フィードバック
                newButton.style.transform = 'scale(0.95)';
                newButton.style.opacity = '0.8';
                
                console.log(`Touch started on ${buttonId}`);
            }
        }, { passive: false });
        
        // touchend イベント（iOS Safari 対応）
        newButton.addEventListener('touchend', (e) => {
            console.log(`Button touchend: ${buttonId}`, e.changedTouches.length);
            e.preventDefault();
            e.stopPropagation();
            
            // タッチが開始されていて、該当するタッチIDの場合
            if (touchStarted && e.changedTouches.length > 0) {
                let validTouch = false;
                for (let touch of e.changedTouches) {
                    if (touch.identifier === touchIdentifier) {
                        validTouch = true;
                        break;
                    }
                }
                
                if (validTouch) {
                    // ボタンの視覚的フィードバックをリセット
                    newButton.style.transform = '';
                    newButton.style.opacity = '';
                    
                    // 音響コンテキスト再開
                    this.audioSystem.resumeAudioContext();
                    
                    console.log(`Touch completed on ${buttonId} - executing callback`);
                    touchStarted = false;
                    touchIdentifier = null;
                    
                    // コールバック実行
                    callback();
                }
            }
        }, { passive: false });
        
        // touchcancel イベント（タッチ状態リセット）
        newButton.addEventListener('touchcancel', (e) => {
            console.log(`Button touchcancel: ${buttonId}`);
            touchStarted = false;
            touchIdentifier = null;
            
            // ボタンの視覚的フィードバックをリセット
            newButton.style.transform = '';
            newButton.style.opacity = '';
        }, { passive: false });
        
        // デバッグ情報を追加
        console.log(`Button ${buttonId} setup completed - styles applied`);
        
        // ボタンの状態をデバッグ出力
        setTimeout(() => {
            console.log(`Button ${buttonId} final state:`, {
                display: newButton.style.display,
                visibility: newButton.style.visibility,
                pointerEvents: newButton.style.pointerEvents,
                zIndex: newButton.style.zIndex,
                touchAction: newButton.style.touchAction
            });
        }, 100);
    }
    
    setupEventListeners() {
        // 音響コンテキスト開始用のクリックイベント
        const resumeAudio = () => {
            this.audioSystem.resumeAudioContext().then(() => {
                console.log('Audio context resumed on user interaction');
            });
        };
        
        document.addEventListener('click', resumeAudio, { once: true });
        document.addEventListener('touchend', resumeAudio, { once: true });
        
        // メニューボタン（iOS Safari対応）
        this.setupMenuButton('start-game-btn', () => this.showCharacterSelect());
        this.setupMenuButton('instructions-btn', () => this.showInstructions());
        this.setupMenuButton('back-to-menu-btn', () => this.showMainMenu());
        this.setupMenuButton('resume-btn', () => this.resumeGame());
        this.setupMenuButton('restart-btn', () => this.startGame());
        this.setupMenuButton('quit-btn', () => this.showMainMenu());
        this.setupMenuButton('play-again-btn', () => this.handlePlayAgainClick());
        this.setupMenuButton('main-menu-btn', () => this.showMainMenu());
        
        // ポーズボタン
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('mobile-pause-btn').addEventListener('click', () => this.pauseGame());
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            this.inputSystem.state.keys[e.code] = true;
            
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            }
            
            // Rキーは無限弾薬のため無効化
        });
        
        document.addEventListener('keyup', (e) => {
            this.inputSystem.state.keys[e.code] = false;
        });
        
        // マウス操作セットアップ
        this.setupMouseEvents();
    }
    
    setupMouseEvents() {
        // Canvas要素が存在することを確認
        if (!this.canvas) {
            console.error('❌ Canvas element not found! Cannot setup mouse events.');
            return;
        }
        
        // console.log('🖱️ Setting up mouse events on canvas:', this.canvas);
        // console.log('🎯 GameScale value:', this.gameScale);
        
        // マウス移動イベント
        const handleMouseMove = (e) => {
            if (!this.canvas) return;
            
            const rect = this.canvas.getBoundingClientRect();
            const displayX = e.clientX - rect.left;
            const displayY = e.clientY - rect.top;
            
            // スケーリング係数を適用してゲーム内座標に変換
            this.inputSystem.state.mouse.x = displayX / this.gameScale;
            this.inputSystem.state.mouse.y = displayY / this.gameScale;
        };
        
        // マウスダウンイベント
        const handleMouseDown = (e) => {
            // console.log('🖱️ Mouse down detected:', {
            //     button: e.button,
            //     gameState: this.gameState,
            //     target: e.target.tagName,
            //     canvasElement: !!this.canvas
            // });
            
            if (this.gameState === 'playing' && e.button === 0) {
                this.inputSystem.state.mouse.down = true;
                // console.log('✅ Mouse down set to TRUE');
            }
        };
        
        const handleMouseUp = (e) => {
            // console.log('🖱️ Mouse up detected');
            this.inputSystem.state.mouse.down = false;
        };
        
        // Canvas要素にイベントリスナーを直接追加
        this.canvas.addEventListener('mousemove', handleMouseMove);
        this.canvas.addEventListener('mousedown', handleMouseDown);
        this.canvas.addEventListener('mouseup', handleMouseUp);
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        // Canvas のマウスエンター/リーブイベント
        // this.canvas.addEventListener('mouseenter', () => {
        //     console.log('🎯 Mouse entered canvas area');
        // });
        // this.canvas.addEventListener('mouseleave', () => {
        //     console.log('🎯 Mouse left canvas area');
        // });
        
        // フォールバック: document レベルのマウス移動
        document.addEventListener('mousemove', (e) => {
            if (this.gameState === 'playing') {
                handleMouseMove(e);
            }
        });
        
        // 追加のフォールバック: document レベル
        document.addEventListener('mousedown', (e) => {
            if (this.gameState === 'playing' && e.button === 0) {
                this.inputSystem.state.mouse.down = true;
                // console.log('🖱️ Document level mouse down fallback triggered');
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.gameState === 'playing') {
                this.inputSystem.state.mouse.down = false;
            }
        });
        
        // console.log('✅ Mouse events setup completed');
        
        // タッチイベントによるスクロール防止（キャンバス）
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
        }, { passive: false });
        
        // ドキュメント全体のタッチスクロール防止（ゲーム中かつ非一時停止時のみ）
        document.addEventListener('touchmove', (e) => {
            if (this.gameState === 'playing' && !this.isPaused) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // UI表示切替ボタン
        
        // モバイルアクションボタン
        if (this.isMobile) {
            // ポーズボタンは残す（設定済み）
        }
    }
    
    setupMobileControls() {
        // 仮想スティックシステム
        this.setupVirtualSticks();
        
        // 画面左右半分タッチ操作システム（バックアップ）
        this.setupScreenControls();
    }
    
    setupVirtualSticks() {
        console.log('Setting up virtual sticks...');
        
        const moveStick = document.getElementById('move-stick');
        const aimStick = document.getElementById('aim-stick');
        const moveKnob = document.getElementById('move-knob');
        const aimKnob = document.getElementById('aim-knob');
        
        if (!moveStick || !aimStick) {
            console.log('Virtual stick elements not found');
            return;
        }
        
        console.log('Virtual stick elements found');
        
        // 仮想スティックの状態管理
        let moveTouch = null;
        let aimTouch = null;
        const stickRadius = 60; // スティックベースの半径
        const knobRadius = 25;  // ノブの半径
        
        // 矩形内の点判定ヘルパー関数
        const isPointInRect = (x, y, rect) => {
            return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
        };
        
        // 位置計算ヘルパー
        const getStickCenter = (stick) => {
            const rect = stick.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };
        
        const calculateStickInput = (touchX, touchY, centerX, centerY) => {
            const dx = touchX - centerX;
            const dy = touchY - centerY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance === 0) return { x: 0, y: 0, distance: 0 };
            
            const maxDistance = stickRadius - knobRadius;
            const normalizedDistance = Math.min(distance, maxDistance);
            const strength = normalizedDistance / maxDistance;
            
            return {
                x: (dx / distance) * strength,
                y: (dy / distance) * strength,
                distance: normalizedDistance
            };
        };
        
        // ノブの位置を更新
        const updateKnobPosition = (knob, centerX, centerY, x, y, distance) => {
            const maxDistance = stickRadius - knobRadius;
            const clampedDistance = Math.min(distance, maxDistance);
            const ratio = clampedDistance / distance || 0;
            
            const offsetX = x * ratio * maxDistance;
            const offsetY = y * ratio * maxDistance;
            
            knob.style.transform = `translate(-50%, -50%) translate(${offsetX}px, ${offsetY}px)`;
        };
        
        // 移動スティックのイベント処理
        const handleMoveStart = (e) => {
            e.preventDefault();
            
            // 既に移動スティックがアクティブな場合は無視
            if (moveTouch !== null) {
                return;
            }
            
            // 移動スティック領域内のタッチを探す
            const moveRect = moveStick.getBoundingClientRect();
            let selectedTouch = null;
            
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                if (isPointInRect(touch.clientX, touch.clientY, moveRect)) {
                    selectedTouch = touch;
                    break;
                }
            }
            
            if (!selectedTouch) {
                console.log('No touch found in move stick area');
                return;
            }
            
            moveTouch = selectedTouch.identifier;
            
            const center = getStickCenter(moveStick);
            const input = calculateStickInput(selectedTouch.clientX, selectedTouch.clientY, center.x, center.y);
            
            this.inputSystem.state.virtualSticks.move.active = true;
            this.inputSystem.state.virtualSticks.move.x = input.x;
            this.inputSystem.state.virtualSticks.move.y = input.y;
            
            updateKnobPosition(moveKnob, center.x, center.y, input.x, input.y, input.distance);
            
            console.log('Move stick start:', input.x.toFixed(2), input.y.toFixed(2), 'touchID:', moveTouch);
        };
        
        // 照準スティックのイベント処理
        const handleAimStart = (e) => {
            e.preventDefault();
            
            // 既に照準スティックがアクティブな場合は無視
            if (aimTouch !== null) {
                return;
            }
            
            // 照準スティック領域内のタッチを探す
            const aimRect = aimStick.getBoundingClientRect();
            let selectedTouch = null;
            
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                if (isPointInRect(touch.clientX, touch.clientY, aimRect)) {
                    selectedTouch = touch;
                    break;
                }
            }
            
            if (!selectedTouch) {
                console.log('No touch found in aim stick area');
                return;
            }
            
            aimTouch = selectedTouch.identifier;
            
            const center = getStickCenter(aimStick);
            const input = calculateStickInput(selectedTouch.clientX, selectedTouch.clientY, center.x, center.y);
            
            this.inputSystem.state.virtualSticks.aim.active = true;
            this.inputSystem.state.virtualSticks.aim.x = input.x;
            this.inputSystem.state.virtualSticks.aim.y = input.y;
            this.inputSystem.state.virtualSticks.aim.shooting = input.distance > 0.05; // 高感度: より小さな動きで射撃
            
            updateKnobPosition(aimKnob, center.x, center.y, input.x, input.y, input.distance);
            
            console.log('Aim stick start:', input.x.toFixed(2), input.y.toFixed(2), 'shooting:', this.inputSystem.state.virtualSticks.aim.shooting, 'touchID:', aimTouch);
        };
        
        // タッチ移動の処理（境界移動対応強化）
        const handleTouchMove = (e) => {
            e.preventDefault();
            
            for (let i = 0; i < e.touches.length; i++) {
                const touch = e.touches[i];
                
                // 移動スティックの処理
                if (touch.identifier === moveTouch) {
                    const center = getStickCenter(moveStick);
                    const input = calculateStickInput(touch.clientX, touch.clientY, center.x, center.y);
                    
                    // 境界を大きく超えた場合のリセット判定
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(touch.clientX - center.x, 2) + 
                        Math.pow(touch.clientY - center.y, 2)
                    );
                    
                    if (distanceFromCenter > stickRadius * 2.5) {
                        console.log('Move stick too far from center, resetting');
                        moveTouch = null;
                        this.inputSystem.state.virtualSticks.move.active = false;
                        this.inputSystem.state.virtualSticks.move.x = 0;
                        this.inputSystem.state.virtualSticks.move.y = 0;
                        moveKnob.style.transform = 'translate(-50%, -50%)';
                    } else {
                        this.inputSystem.state.virtualSticks.move.x = input.x;
                        this.inputSystem.state.virtualSticks.move.y = input.y;
                        updateKnobPosition(moveKnob, center.x, center.y, input.x, input.y, input.distance);
                        console.log('Move stick updated:', input.x.toFixed(2), input.y.toFixed(2));
                    }
                }
                
                // 照準スティックの処理
                if (touch.identifier === aimTouch) {
                    const center = getStickCenter(aimStick);
                    const input = calculateStickInput(touch.clientX, touch.clientY, center.x, center.y);
                    
                    // 境界を大きく超えた場合のリセット判定
                    const distanceFromCenter = Math.sqrt(
                        Math.pow(touch.clientX - center.x, 2) + 
                        Math.pow(touch.clientY - center.y, 2)
                    );
                    
                    if (distanceFromCenter > stickRadius * 2.5) {
                        console.log('Aim stick too far from center, resetting');
                        aimTouch = null;
                        this.inputSystem.state.virtualSticks.aim.active = false;
                        this.inputSystem.state.virtualSticks.aim.x = 0;
                        this.inputSystem.state.virtualSticks.aim.y = 0;
                        this.inputSystem.state.virtualSticks.aim.shooting = false;
                        aimKnob.style.transform = 'translate(-50%, -50%)';
                    } else {
                        this.inputSystem.state.virtualSticks.aim.x = input.x;
                        this.inputSystem.state.virtualSticks.aim.y = input.y;
                        this.inputSystem.state.virtualSticks.aim.shooting = input.distance > 0.05; // 高感度: より小さな動きで射撃
                        updateKnobPosition(aimKnob, center.x, center.y, input.x, input.y, input.distance);
                        console.log('Aim stick updated:', input.x.toFixed(2), input.y.toFixed(2), 'shooting:', this.inputSystem.state.virtualSticks.aim.shooting);
                    }
                }
            }
        };
        
        // タッチ終了の処理
        const handleTouchEnd = (e) => {
            e.preventDefault();
            
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                
                // 移動スティックの終了
                if (touch.identifier === moveTouch) {
                    moveTouch = null;
                    this.inputSystem.state.virtualSticks.move.active = false;
                    this.inputSystem.state.virtualSticks.move.x = 0;
                    this.inputSystem.state.virtualSticks.move.y = 0;
                    
                    moveKnob.style.transform = 'translate(-50%, -50%)';
                    console.log('Move stick reset');
                }
                
                // 照準スティックの終了
                if (touch.identifier === aimTouch) {
                    aimTouch = null;
                    this.inputSystem.state.virtualSticks.aim.active = false;
                    this.inputSystem.state.virtualSticks.aim.x = 0;
                    this.inputSystem.state.virtualSticks.aim.y = 0;
                    this.inputSystem.state.virtualSticks.aim.shooting = false;
                    
                    aimKnob.style.transform = 'translate(-50%, -50%)';
                    console.log('Aim stick reset');
                }
            }
        };
        
        // イベントリスナー登録
        moveStick.addEventListener('touchstart', handleMoveStart, { passive: false });
        aimStick.addEventListener('touchstart', handleAimStart, { passive: false });
        
        document.addEventListener('touchmove', handleTouchMove, { passive: false });
        document.addEventListener('touchend', handleTouchEnd, { passive: false });
        document.addEventListener('touchcancel', handleTouchEnd, { passive: false });
        
        // デバッグ用：タッチ状態監視
        const debugTouchState = () => {
            const activeSticks = [];
            if (moveTouch !== null) activeSticks.push(`Move:${moveTouch}`);
            if (aimTouch !== null) activeSticks.push(`Aim:${aimTouch}`);
            
            if (activeSticks.length > 0) {
                console.log('Active sticks:', activeSticks.join(', '));
            }
        };
        
        // 定期的なデバッグ出力（開発時のみ）
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('192.168')) {
            setInterval(debugTouchState, 2000);
        }
        
        console.log('仮想スティックシステムを初期化しました（マルチタッチ対応）');
    }
    
    setupScreenControls() {
        // DOM要素ベースの仮想スティックシステムを優先するため、このシステムを無効化
        console.log('Screen controls disabled - using DOM-based virtual sticks only');
        return;
        const canvas = this.canvas;
        if (!canvas) {
            console.log('Canvas not found for screen controls');
            return;
        }
        console.log('Canvas found:', canvas, 'Mobile:', this.isMobile);
        
        let leftTouch = null;
        let rightTouch = null;
        
        const getGameCoordinates = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            
            // Canvas情報の詳細チェック
            if (!rect || rect.width === 0 || rect.height === 0) {
                console.error('Canvas rect is invalid:', rect);
                // 縦画面フォールバック: より適切な値を計算
                const fallbackScale = Math.min(window.innerWidth / this.baseWidth, window.innerHeight / this.baseHeight);
                return {
                    x: clientX / fallbackScale,
                    y: clientY / fallbackScale
                };
            }
            
            const displayX = clientX - rect.left;
            const displayY = clientY - rect.top;
            
            // gameScaleの精度向上とフォールバック（縦画面対応強化）
            let actualScale = this.gameScale;
            if (!actualScale || actualScale <= 0 || actualScale > 10) {
                // 縦画面では高さベースでもスケールを計算
                const widthScale = rect.width / this.baseWidth;
                const heightScale = rect.height / this.baseHeight;
                
                // 画面の向きに応じて適切なスケールを選択
                const isPortrait = window.innerHeight > window.innerWidth;
                if (isPortrait) {
                    // 縦画面では小さい方のスケールを使用（完全に画面内に収める）
                    actualScale = Math.min(widthScale, heightScale);
                } else {
                    // 横画面では従来通り幅ベース
                    actualScale = widthScale;
                }
                
                console.warn('gameScale invalid, recalculating for orientation:', {
                    original: this.gameScale,
                    widthScale: widthScale.toFixed(3),
                    heightScale: heightScale.toFixed(3),
                    selectedScale: actualScale.toFixed(3),
                    isPortrait,
                    rectWidth: rect.width,
                    rectHeight: rect.height,
                    baseWidth: this.baseWidth,
                    baseHeight: this.baseHeight
                });
            }
            
            // 座標変換の精度向上
            const gameX = displayX / actualScale;
            const gameY = displayY / actualScale;
            
            console.log('Coordinate calculation:', {
                clientX: clientX.toFixed(1), 
                clientY: clientY.toFixed(1),
                rectLeft: rect.left.toFixed(1), 
                rectTop: rect.top.toFixed(1),
                rectWidth: rect.width.toFixed(1),
                rectHeight: rect.height.toFixed(1),
                displayX: displayX.toFixed(1), 
                displayY: displayY.toFixed(1),
                actualScale: actualScale.toFixed(3), 
                gameScale: this.gameScale ? this.gameScale.toFixed(3) : 'null',
                gameX: gameX.toFixed(1), 
                gameY: gameY.toFixed(1),
                baseWidth: this.baseWidth,
                screenCenterX: (this.baseWidth / 2).toFixed(1)
            });
            
            return { x: gameX, y: gameY };
        };
        
        const handlePointerDown = (e) => {
            e.preventDefault();
            
            console.log('PointerDown detected:', e.type, e.pointerId, e.clientX, e.clientY);
            
            const { x: gameX, y: gameY } = getGameCoordinates(e.clientX, e.clientY);
            
            // 縦画面の場合は実際の描画領域を考慮してセンター位置を調整
            const isPortrait = window.innerHeight > window.innerWidth;
            let effectiveScreenCenterX = this.baseWidth / 2;
            
            if (isPortrait) {
                // 縦画面では実際のcanvasの描画領域を基準にセンターを計算
                const rect = canvas.getBoundingClientRect();
                const displayCenterX = rect.width / 2;
                const actualScale = this.gameScale || (rect.width / this.baseWidth);
                effectiveScreenCenterX = displayCenterX / actualScale;
                
                console.log('Portrait mode center calculation:', {
                    rectWidth: rect.width,
                    displayCenterX,
                    actualScale: actualScale.toFixed(3),
                    effectiveScreenCenterX: effectiveScreenCenterX.toFixed(1),
                    originalCenterX: (this.baseWidth / 2).toFixed(1)
                });
            }
            
            const screenCenterX = effectiveScreenCenterX;
            
            console.log('PointerDown game coords:', gameX, gameY, 'centerX:', screenCenterX);
            console.log('Current virtualSticks state before:', JSON.stringify(this.inputSystem.state.virtualSticks));
            console.log('Left/Right touch states:', leftTouch, rightTouch);
            
            // デバッグ情報更新
            if (document.getElementById('debug-touch')) {
                document.getElementById('debug-touch').textContent = 
                    `PointerDown: x=${gameX.toFixed(0)}, y=${gameY.toFixed(0)}, center=${screenCenterX}`;
            }
            
            if (gameX < screenCenterX && !leftTouch) {
                console.log('LEFT TOUCH DETECTED - Setting up left touch control');
                // 左半分：移動制御
                leftTouch = {
                    id: e.pointerId,
                    startX: gameX,
                    startY: gameY
                };
                
                // 初期移動スティック状態を設定
                this.inputSystem.state.virtualSticks.move.active = true;
                this.inputSystem.state.virtualSticks.move.x = 0;
                this.inputSystem.state.virtualSticks.move.y = 0;
                
                console.log('Left touch set:', leftTouch);
                console.log('virtualSticks.move updated:', this.inputSystem.state.virtualSticks.move);
                
                try {
                    if (canvas.setPointerCapture) {
                        canvas.setPointerCapture(e.pointerId);
                    }
                } catch (err) {
                    console.log('setPointerCapture failed (left):', err);
                }
                
                // デバッグ情報更新
                const debugTouch = document.getElementById('debug-touch');
                if (debugTouch) debugTouch.textContent = `L:${gameX.toFixed(0)},${gameY.toFixed(0)}`;
                
                // デバッグ情報を即座に更新
                this.updateDebugInfo();
                
                // 強制的にUI更新
                this.forceUpdateMobileDebugDisplay();
                
            } else if (gameX >= screenCenterX && !rightTouch) {
                console.log('RIGHT TOUCH DETECTED - Setting up right touch control');
                // 右半分：エイム+射撃制御
                rightTouch = {
                    id: e.pointerId,
                    startX: gameX,
                    startY: gameY
                };
                
                this.inputSystem.state.virtualSticks.aim.shooting = true;
                this.inputSystem.state.virtualSticks.aim.active = true;
                this.inputSystem.state.virtualSticks.aim.x = 0;
                this.inputSystem.state.virtualSticks.aim.y = 0;
                
                console.log('Right touch set:', rightTouch);
                console.log('virtualSticks.aim updated:', this.inputSystem.state.virtualSticks.aim);
                
                try {
                    if (canvas.setPointerCapture) {
                        canvas.setPointerCapture(e.pointerId);
                    }
                } catch (err) {
                    console.log('setPointerCapture failed (right):', err);
                }
                
                // デバッグ情報更新
                const debugTouch = document.getElementById('debug-touch');
                if (debugTouch) debugTouch.textContent = `R:${gameX.toFixed(0)},${gameY.toFixed(0)}`;
                
                // デバッグ情報を即座に更新
                this.updateDebugInfo();
                
                // 強制的にUI更新
                this.forceUpdateMobileDebugDisplay();
            } else {
                console.log('Touch ignored - gameX:', gameX, 'centerX:', screenCenterX, 'leftTouch exists:', !!leftTouch, 'rightTouch exists:', !!rightTouch);
            }
            
            console.log('PointerDown final virtualSticks state:', JSON.stringify(this.inputSystem.state.virtualSticks));
        };
        
        const handlePointerMove = (e) => {
            e.preventDefault();
            
            const { x: gameX, y: gameY } = getGameCoordinates(e.clientX, e.clientY);
            
            if (leftTouch && e.pointerId === leftTouch.id) {
                console.log('LEFT TOUCH MOVE - gameX:', gameX, 'gameY:', gameY, 'startX:', leftTouch.startX, 'startY:', leftTouch.startY);
                
                // 移動ベクトル計算
                const dx = gameX - leftTouch.startX;
                const dy = gameY - leftTouch.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const deadZone = 1;        // 極小デッドゾーン
                const maxDistance = 20;    // 高感度設定（2倍感度）
                
                console.log('Move vector - dx:', dx, 'dy:', dy, 'distance:', distance, 'maxDistance:', maxDistance);
                
                if (distance > deadZone) { // 極小デッドゾーン
                    const newX = Math.max(-1, Math.min(1, dx / maxDistance));
                    const newY = Math.max(-1, Math.min(1, dy / maxDistance));
                    
                    this.inputSystem.state.virtualSticks.move.x = newX;
                    this.inputSystem.state.virtualSticks.move.y = newY;
                    this.inputSystem.state.virtualSticks.move.active = true;
                    
                    console.log('virtualSticks.move updated - x:', newX, 'y:', newY, 'active:', true);
                } else {
                    this.inputSystem.state.virtualSticks.move.x = 0;
                    this.inputSystem.state.virtualSticks.move.y = 0;
                    this.inputSystem.state.virtualSticks.move.active = false;
                    
                    console.log('virtualSticks.move reset - small distance');
                }
                
                // デバッグ情報を即座に更新 - 無効化
                // this.updateDebugInfo();
                // this.forceUpdateMobileDebugDisplay();
            }
            
            if (rightTouch && e.pointerId === rightTouch.id) {
                console.log('RIGHT TOUCH MOVE - gameX:', gameX, 'gameY:', gameY, 'playerX:', this.player.x, 'playerY:', this.player.y);
                
                // エイム方向計算（プレイヤー位置からタッチ位置へ）
                const dx = gameX - this.player.x;
                const dy = gameY - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                console.log('Aim vector - dx:', dx, 'dy:', dy, 'distance:', distance);
                
                if (distance > 1) { // 照準スティックも極小デッドゾーン
                    this.player.angle = Math.atan2(dy, dx);
                    this.inputSystem.state.virtualSticks.aim.active = true;
                    this.inputSystem.state.virtualSticks.aim.x = dx / distance;
                    this.inputSystem.state.virtualSticks.aim.y = dy / distance;
                    
                    console.log('virtualSticks.aim updated - x:', this.inputSystem.state.virtualSticks.aim.x, 'y:', this.inputSystem.state.virtualSticks.aim.y, 'angle:', this.player.angle);
                }
                
                // デバッグ情報を即座に更新 - 無効化
                // this.updateDebugInfo();
                // this.forceUpdateMobileDebugDisplay();
            }
        };
        
        const handlePointerEnd = (e) => {
            e.preventDefault();
            
            console.log('PointerEnd detected:', e.pointerId);
            
            if (leftTouch && e.pointerId === leftTouch.id) {
                console.log('LEFT TOUCH END - resetting move controls');
                leftTouch = null;
                this.inputSystem.state.virtualSticks.move.x = 0;
                this.inputSystem.state.virtualSticks.move.y = 0;
                this.inputSystem.state.virtualSticks.move.active = false;
                
                console.log('virtualSticks.move reset:', this.inputSystem.state.virtualSticks.move);
                
                // デバッグ情報更新
                const debugTouch = document.getElementById('debug-touch');
                if (debugTouch) debugTouch.textContent = '-';
                
                // デバッグ情報を即座に更新 - 無効化
                // this.updateDebugInfo();
                // this.forceUpdateMobileDebugDisplay();
            }
            
            if (rightTouch && e.pointerId === rightTouch.id) {
                console.log('RIGHT TOUCH END - resetting aim controls');
                rightTouch = null;
                this.inputSystem.state.virtualSticks.aim.shooting = false;
                this.inputSystem.state.virtualSticks.aim.active = false;
                this.inputSystem.state.virtualSticks.aim.x = 0;
                this.inputSystem.state.virtualSticks.aim.y = 0;
                
                console.log('virtualSticks.aim reset:', this.inputSystem.state.virtualSticks.aim);
                
                // デバッグ情報更新
                const debugTouch = document.getElementById('debug-touch');
                if (debugTouch) debugTouch.textContent = '-';
                
                // デバッグ情報を即座に更新 - 無効化
                // this.updateDebugInfo();
                // this.forceUpdateMobileDebugDisplay();
            }
        };
        
        // Pointer Events（推奨）
        console.log('Adding pointer event listeners to canvas...');
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerEnd);
        canvas.addEventListener('pointercancel', handlePointerEnd);
        console.log('Pointer event listeners added successfully');
        
        // フォールバック：タッチイベント
        canvas.addEventListener('touchstart', (e) => {
            console.log('TouchStart event detected on canvas:', e.touches.length, 'touches');
            e.preventDefault();
            for (let touch of e.changedTouches) {
                console.log('Processing touch:', touch.identifier, touch.clientX, touch.clientY);
                handlePointerDown({
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => {}
                });
            }
        });
        
        canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                handlePointerMove({
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => {}
                });
            }
        });
        
        canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                handlePointerEnd({
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => {}
                });
            }
        });
        
        canvas.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
                handlePointerEnd({
                    pointerId: touch.identifier,
                    clientX: touch.clientX,
                    clientY: touch.clientY,
                    preventDefault: () => {}
                });
            }
        });
        
        console.log('画面左右半分タッチ操作システムを初期化しました');
        
        // ダイレクトタッチテスト（一時的）
        canvas.addEventListener('click', (e) => {
            console.log('Canvas click detected:', e.clientX, e.clientY);
        });
        
        // デバッグ情報表示を初期化
        this.initDebugInfo();
        
        // デバッグ情報をスクリーンに表示（縦画面対応）
        this.showDebugInfo();
        
        // 縦画面での初期状態をログ出力
        console.log('Screen controls setup completed:', {
            isMobile: this.isMobile,
            isPortrait: window.innerHeight > window.innerWidth,
            screenSize: { w: window.innerWidth, h: window.innerHeight },
            canvasRect: canvas.getBoundingClientRect(),
            baseSize: { w: this.baseWidth, h: this.baseHeight },
            gameScale: this.gameScale
        });
    }
    
    // デバッグ情報表示
    showDebugInfo() {
        if (!this.isMobile) return;
        
        // 開発環境でのみデバッグ情報を表示
        // デバッグ表示を無効化
        return; // デバッグ表示を完全に無効化
        
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           window.location.hostname === '';
        if (!isLocalhost) return;
        
        const debugDiv = document.createElement('div');
        debugDiv.id = 'debug-info';
        debugDiv.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 12px;
            z-index: 1000;
            max-width: 200px;
            word-wrap: break-word;
        `;
        
        // 縦画面情報を追加
        const isPortrait = window.innerHeight > window.innerWidth;
        const rect = this.canvas ? this.canvas.getBoundingClientRect() : null;
        
        debugDiv.innerHTML = `
            <div>モバイル検出: ${this.isMobile ? 'はい' : 'いいえ'}</div>
            <div>向き: ${isPortrait ? '縦画面' : '横画面'}</div>
            <div>画面: ${window.innerWidth}x${window.innerHeight}</div>
            <div>Canvas: ${rect ? `${rect.width.toFixed(0)}x${rect.height.toFixed(0)}` : 'なし'}</div>
            <div>GameScale: ${this.gameScale ? this.gameScale.toFixed(3) : 'null'}</div>
            <div>BaseSize: ${this.baseWidth}x${this.baseHeight}</div>
            <div>PointerEvents: ${window.PointerEvent ? 'サポート' : 'なし'}</div>
            <div>TouchEvents: ${window.TouchEvent ? 'サポート' : 'なし'}</div>
            <div>Touch点数: ${navigator.maxTouchPoints || 0}</div>
            <div>移動: <span id="debug-move">待機中</span></div>
            <div>エイム: <span id="debug-aim">待機中</span></div>
            <div>射撃: <span id="debug-shoot">待機中</span></div>
            <div>タッチ: <span id="debug-touch">待機中</span></div>
            <div>UI: <span id="debug-ui">PC</span></div>
        `;
        
        document.body.appendChild(debugDiv);
        
        // 定期更新
        setInterval(() => {
            if (document.getElementById('debug-move')) {
                document.getElementById('debug-move').textContent = 
                    this.inputSystem.state.virtualSticks.move.active ? 
                    `x:${this.inputSystem.state.virtualSticks.move.x.toFixed(2)}, y:${this.inputSystem.state.virtualSticks.move.y.toFixed(2)}` : 
                    '待機中';
                    
                document.getElementById('debug-aim').textContent = 
                    this.inputSystem.state.virtualSticks.aim.active ? 
                    `x:${this.inputSystem.state.virtualSticks.aim.x.toFixed(2)}, y:${this.inputSystem.state.virtualSticks.aim.y.toFixed(2)}` : 
                    '待機中';
                    
                document.getElementById('debug-shoot').textContent = 
                    this.inputSystem.state.virtualSticks.aim.shooting ? '射撃中' : '待機中';
                    
                // UI状態も更新
                const uiElement = document.getElementById('debug-ui');
                if (uiElement) {
                    const mobileUI = document.getElementById('mobile-ui');
                    const pcUI = document.getElementById('pc-ui');
                    const screenControls = document.querySelector('.screen-controls');
                    
                    let uiStatus = 'なし';
                    if (mobileUI && mobileUI.style.display !== 'none') {
                        uiStatus = screenControls && screenControls.style.display === 'flex' ? 'モバイル+タッチ' : 'モバイル';
                    } else if (pcUI && pcUI.style.display !== 'none') {
                        uiStatus = 'PC';
                    }
                    
                    uiElement.textContent = uiStatus;
                }
            }
        }, 100);
    }
    
    initDebugInfo() {
        // デバッグ表示を無効化
        return; // デバッグ表示を完全に無効化
        
        if (this.isMobile) {
            // デバッグ情報表示用のHTML要素を作成
            const debugDiv = document.createElement('div');
            debugDiv.id = 'debug-info';
            debugDiv.className = 'debug-info';
            debugDiv.innerHTML = `
                <div>Touch: <span id="debug-touch">-</span></div>
                <div>Base: <span id="debug-base">${this.baseWidth || 'undefined'}</span></div>
                <div>Scale: <span id="debug-scale">${this.gameScale || 'undefined'}</span></div>
                <div>Move: <span id="debug-move">-</span></div>
                <div>Aim: <span id="debug-aim">-</span></div>
                <div>Mobile: <span id="debug-mobile">${this.isMobile}</span></div>
                <div>PEvents: <span id="debug-pointer">${window.PointerEvent ? 'あり' : 'なし'}</span></div>
                <div>TEvents: <span id="debug-touch-support">${'ontouchstart' in window ? 'あり' : 'なし'}</span></div>
            `;
            document.body.appendChild(debugDiv);
            
            // デバッグ情報を定期的に更新 - 無効化
            // this.debugInterval = setInterval(() => {
            //     this.updateDebugInfo();
            // }, 100);
        }
    }
    
    updateDebugInfo() {
        // デバッグ表示を無効化
        return; // デバッグ表示を完全に無効化
        
        if (!this.isMobile) return;
        
        const debugMove = document.getElementById('debug-move');
        const debugAim = document.getElementById('debug-aim');
        
        if (debugMove) {
            const moveText = this.inputSystem.state.virtualSticks.move.active ? 
                `x:${this.inputSystem.state.virtualSticks.move.x.toFixed(2)},y:${this.inputSystem.state.virtualSticks.move.y.toFixed(2)}` : 
                '待機中';
            debugMove.textContent = moveText;
            debugMove.style.color = this.inputSystem.state.virtualSticks.move.active ? '#00ff00' : '#ffffff';
        }
        
        if (debugAim) {
            const aimText = this.inputSystem.state.virtualSticks.aim.shooting ? 
                `SHOOT x:${this.inputSystem.state.virtualSticks.aim.x.toFixed(2)},y:${this.inputSystem.state.virtualSticks.aim.y.toFixed(2)}` : 
                '待機中';
            debugAim.textContent = aimText;
            debugAim.style.color = this.inputSystem.state.virtualSticks.aim.shooting ? '#ff0000' : '#ffffff';
        }
        
        // 追加デバッグ情報
        const debugScale = document.getElementById('debug-scale');
        if (debugScale) {
            debugScale.textContent = this.gameScale ? this.gameScale.toFixed(3) : 'undefined';
        }
        
        const debugBase = document.getElementById('debug-base');
        if (debugBase) {
            debugBase.textContent = this.baseWidth || 'undefined';
        }
    }
    
    forceUpdateMobileDebugDisplay() {
        // デバッグ表示を無効化
        return; // デバッグ表示を完全に無効化
        
        if (!this.isMobile) return;
        
        console.log('Force updating mobile debug display - virtualSticks:', JSON.stringify(this.inputSystem.state.virtualSticks));
        
        // 全てのデバッグ要素を強制更新
        const debugMove = document.getElementById('debug-move');
        const debugAim = document.getElementById('debug-aim');
        const debugTouch = document.getElementById('debug-touch');
        
        if (debugMove) {
            const moveText = this.inputSystem.state.virtualSticks.move.active ? 
                `ACTIVE: x:${this.inputSystem.state.virtualSticks.move.x.toFixed(2)},y:${this.inputSystem.state.virtualSticks.move.y.toFixed(2)}` : 
                '待機中';
            debugMove.textContent = moveText;
            debugMove.style.color = this.inputSystem.state.virtualSticks.move.active ? '#00ff00' : '#ffffff';
            debugMove.style.fontWeight = this.inputSystem.state.virtualSticks.move.active ? 'bold' : 'normal';
        }
        
        if (debugAim) {
            const aimText = this.inputSystem.state.virtualSticks.aim.shooting ? 
                `SHOOTING: x:${this.inputSystem.state.virtualSticks.aim.x.toFixed(2)},y:${this.inputSystem.state.virtualSticks.aim.y.toFixed(2)}` : 
                '待機中';
            debugAim.textContent = aimText;
            debugAim.style.color = this.inputSystem.state.virtualSticks.aim.shooting ? '#ff0000' : '#ffffff';
            debugAim.style.fontWeight = this.inputSystem.state.virtualSticks.aim.shooting ? 'bold' : 'normal';
        }
        
        // タイムスタンプを追加してリアルタイム確認
        if (debugTouch) {
            const timestamp = Date.now() % 10000;
            debugTouch.textContent += ` [${timestamp}]`;
        }
        
        // DOM要素を強制的に再描画
        if (debugMove) debugMove.offsetHeight;
        if (debugAim) debugAim.offsetHeight;
    }
    
    loadGame() {
        // ローディング画面を表示
        this.gameState = 'loading';
        
        // ハイスコア表示
        document.getElementById('high-score-display').textContent = this.highScore.toLocaleString();
        
        // 偽のローディング（実際のアセット読み込みをシミュレート）
        let progress = 0;
        const loadingInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 100) progress = 100;
            
            document.getElementById('loading-fill').style.width = progress + '%';
            
            if (progress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    console.log('Loading complete, showing main menu');
                    this.showMainMenu();
                }, 500);
            }
        }, 100);
    }
    
    showMainMenu() {
        console.log('Showing main menu...');
        this.uiSystem.showMainMenu();
        this.gameState = 'menu';
        
        // カーソルをデフォルトに戻す
        this.resetCursor();
        
        // メニューボタンを再設定
        setTimeout(() => {
            this.setupMenuButton('start-game-btn', () => this.showCharacterSelect());
            this.setupMenuButton('instructions-btn', () => this.showInstructions());
            console.log('Menu buttons initialized');
        }, 100);
    }
    
    showInstructions() {
        this.uiSystem.showScreen('instructions-screen');
        document.body.style.touchAction = 'auto';
        document.getElementById('game-screen').classList.remove('active');
    }
    
    
    async startGame() {
        console.log('Starting game...');
        
        // キャラクターが選択されていない場合はデフォルトキャラクターを設定
        if (!this.selectedCharacter || !this.characterConfig) {
            console.log('No character selected, using default character (ray)');
            this.selectCharacter('ray');
            this.createPlayerWithCharacter();
        }
        
        // 音響コンテキストの開始
        this.audioSystem.resumeAudioContext().then(() => {
            console.log('Audio context resumed');
        });
        
        // ゲーム画面表示（UISystemで一元管理）
        this.uiSystem.showGameScreen();
        
        // ルナ選択時の専用カーソル適用
        this.applyLunaCursor();
        
        // ゲーム状態リセット
        this.gameState = 'playing';
        this.isPaused = false;
        
        // 音響システム初期化（重複初期化防止）
        if (!this.audioSystem.isInitialized) {
            console.log('🎵 Game: AudioSystem not yet initialized, initializing now...');
            await this.audioSystem.initAudio();
        } else {
            console.log('🎵 Game: AudioSystem already initialized, skipping...');
        }
        
        // プレイヤーリセット
        this.player.reset();
        
        // 武器システム完全リセット（ニューク問題修正）
        this.weaponSystem.reset();
        this.currentWeapon = 'plasma';
        
        // 統計リセット
        this.stats = {
            score: 0,
            kills: 0,
            wave: 1,
            gameTime: 0,
            startTime: Date.now()
        };
        
        // コンボリセット
        this.combo = {
            count: 0,
            maxCombo: 0
        };
        
        // エンティティクリア
        this.enemies = [];
        this.bulletSystem.clearAllBullets(); // BulletSystemを使用して弾丸クリア
        this.particles = [];
        this.pickupSystem.clearPickups(); // PickupSystemを使用してアイテムクリア
        // bloodSplatters は削除（爆発エフェクトに変更）
        
        // 背景を再初期化
        this.initBackground();
        
        // その他
        this.camera = { x: 0, y: 0 };
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        // 敵関連はEnemySystemで管理
        
        // ダメージ効果
        this.damageEffects = {
            screenFlash: 0,
            screenShake: { x: 0, y: 0, intensity: 0, duration: 0 }
        };
        
        this.uiSystem.updateUI();
        
        // 最終的にUIの表示を確実にする（競合回避）
        setTimeout(() => {
            if (this.isMobile) {
                const mobileUI = document.getElementById('mobile-ui');
                if (mobileUI) {
                    mobileUI.classList.remove('hidden');
                    mobileUI.style.display = 'block';
                    console.log('Final mobile UI display forced');
                }
                
                // 仮想スティックも確実に表示
                const moveStick = document.getElementById('move-stick');
                const aimStick = document.getElementById('aim-stick');
                if (moveStick) {
                    moveStick.style.display = 'block';
                    moveStick.style.visibility = 'visible';
                    moveStick.style.opacity = '1';
                }
                if (aimStick) {
                    aimStick.style.display = 'block';
                    aimStick.style.visibility = 'visible';
                    aimStick.style.opacity = '1';
                }
                console.log('Final virtual sticks display forced');
            }
        }, 250);
        
        // 既存のゲームループがあればキャンセル
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        
        // BGM開始（少し遅延させてユーザーインタラクション後に開始）
        setTimeout(async () => {
            try {
                await this.audioSystem.startBGM();
                console.log('🎵 Game: BGM started successfully');
            } catch (error) {
                console.error('❌ Game: Failed to start BGM:', error);
                console.error('BGM error details:', error.stack);
            }
        }, 1000); // 1秒遅延
        
        // 新しくゲームループを開始
        this.gameLoop();
    }
    
    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-modal').classList.remove('hidden');
        console.log('⏸️ Game paused');
    }
    
    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-modal').classList.add('hidden');
        console.log('▶️ Game resumed');
    }
    
    gameLoop() {
        try {
            // Handle Mario mini-game state
            if (this.gameState === 'marioMiniGame') {
                // Mario mini-game handles its own loop, just continue the main loop
                this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
                return;
            }
            
            if (this.gameState !== 'playing') {
                this.animationFrameId = null;
                return;
            }
            
            if (!this.isPaused) {
                this.update();
            }
            
            this.render();
            this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
        } catch (error) {
            console.error('❌ Game: Critical error in game loop:', error);
            console.error('Error details:', error.stack);
            console.error('Game state:', this.gameState);
            
            // ゲームを一時停止して問題を防ぐ
            this.gameState = 'paused';
            alert('ゲームでエラーが発生しました。コンソールを確認してください。');
        }
    }
    
    update() {
        const deltaTime = 1/60; // 60 FPS想定
        
        try {
            this.player.update(deltaTime);
        } catch (error) {
            console.error('❌ Player update error:', error);
        }
        
        try {
            this.weaponSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ WeaponSystem update error:', error);
        }
        
        try {
            this.enemySystem.update(deltaTime);
        } catch (error) {
            console.error('❌ EnemySystem update error:', error);
        }
        
        try {
            this.bulletSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ BulletSystem update error:', error);
        }
        
        try {
            this.physicsSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ PhysicsSystem update error:', error);
        }
        
        try {
            this.updateParticles(deltaTime);
        } catch (error) {
            console.error('❌ Particles update error:', error);
        }
        
        try {
            this.pickupSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ PickupSystem update error:', error);
        }
        
        try {
            this.renderSystem.updateBackgroundParticles(deltaTime);
        } catch (error) {
            console.error('❌ RenderSystem background update error:', error);
        }
        
        try {
            this.backgroundSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ BackgroundSystem update error:', error);
        }
        
        try {
            this.updateDamageEffects(deltaTime);
        } catch (error) {
            console.error('❌ DamageEffects update error:', error);
        }
        
        try {
            this.updateCamera();
        } catch (error) {
            console.error('❌ Camera update error:', error);
        }
        
        try {
            this.updateGameLogic(deltaTime);
        } catch (error) {
            console.error('❌ GameLogic update error:', error);
        }
        
        try {
            this.audioSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ AudioSystem update error:', error);
            console.error('AudioSystem error details:', error.stack);
        }
        
        try {
            this.uiSystem.update(deltaTime);
        } catch (error) {
            console.error('❌ UISystem update error:', error);
        }
    }
    
    // updatePlayer() メソッドは Player クラスに移行済み
    
    updatePlayerObsolete(deltaTime) {
        let moveX = 0, moveY = 0;
        
        // ✅ 新方式：InputSystem (Input State Object パターン) のテスト
        if (this.inputSystem) {
            const inputState = this.inputSystem.getInputState();
            const movement = this.inputSystem.getMovementInput();
            
            // テスト用ログ（5%の確率で表示）
            if (Math.random() < 0.05) {
                console.log('🎮 InputSystem State Test:', {
                    isMobile: this.inputSystem.isMobile,
                    movement: movement,
                    keysActive: Object.keys(inputState.keys).filter(k => inputState.keys[k]),
                    mouseDown: inputState.mouse.down
                });
            }
        }
        
        // 移動入力（既存方式を維持）
        if (this.isMobile) {
            if (this.inputSystem.state.virtualSticks.move.active) {
                moveX = this.inputSystem.state.virtualSticks.move.x;
                moveY = this.inputSystem.state.virtualSticks.move.y;
            }
        } else {
            if (this.inputSystem.state.keys['KeyW'] || this.inputSystem.state.keys['ArrowUp']) moveY -= 1;
            if (this.inputSystem.state.keys['KeyS'] || this.inputSystem.state.keys['ArrowDown']) moveY += 1;
            if (this.inputSystem.state.keys['KeyA'] || this.inputSystem.state.keys['ArrowLeft']) moveX -= 1;
            if (this.inputSystem.state.keys['KeyD'] || this.inputSystem.state.keys['ArrowRight']) moveX += 1;
        }
        
        // 移動正規化
        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // プレイヤー速度設定
        let currentSpeed = this.player.speed;
        
        // 位置更新
        this.player.x += moveX * currentSpeed * deltaTime;
        this.player.y += moveY * currentSpeed * deltaTime;
        
        // 画面境界
        this.player.x = Math.max(this.player.width/2, Math.min(this.baseWidth - this.player.width/2, this.player.x));
        this.player.y = Math.max(this.player.height/2, Math.min(this.baseHeight - this.player.height/2, this.player.y));
        
        // エイム
        if (this.isMobile) {
            if (this.inputSystem.state.virtualSticks.aim.active) {
                this.player.angle = Math.atan2(this.inputSystem.state.virtualSticks.aim.y, this.inputSystem.state.virtualSticks.aim.x);
            }
        } else {
            const dx = this.inputSystem.state.mouse.x - this.player.x;
            const dy = this.inputSystem.state.mouse.y - this.player.y;
            this.player.angle = Math.atan2(dy, dx);
            
            // テスト用：角度計算ログはコメントアウト
            // if (Math.random() < 0.05) {
            //     console.log('🎯 Player angle update:', {
            //         mouse: { x: this.mouse.x, y: this.mouse.y },
            //         player: { x: this.player.x, y: this.player.y },
            //         delta: { dx, dy },
            //         angle: this.player.angle,
            //         angleDegrees: (this.player.angle * 180 / Math.PI).toFixed(1),
            //         gameScale: this.gameScale,
            //         mouseInitialized: this.mouse.x !== undefined && this.mouse.y !== undefined
            //     });
            // }
        }
    }
    
    // ダッシュアイテムを使用
    
    // 武器関連処理はWeaponSystemに移行
    
    // 敵関連処理はEnemySystemに移行
    
    // spawnEnemy - EnemySystemに移行
    
    // getRandomEnemyType - EnemySystemに移行
    
    // 🗑️ createEnemyByType - EnemySystemに完全移行済み（レガシー削除完了）
    
    // 🗑️ spawnBoss - EnemySystemに完全移行済み（レガシー削除完了）
    
    updateEnemyBehavior(enemy, deltaTime) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        switch (enemy.type) {
            case 'fast':
                // 高速で直進
                if (distance > 0) {
                    enemy.x += (dx / distance) * enemy.speed * deltaTime;
                    enemy.y += (dy / distance) * enemy.speed * deltaTime;
                }
                break;
                
            case 'tank':
                // ゆっくりと確実に追跡
                if (distance > 0) {
                    enemy.x += (dx / distance) * enemy.speed * deltaTime;
                    enemy.y += (dy / distance) * enemy.speed * deltaTime;
                }
                break;
                
            case 'shooter':
                // 中距離を保ちながら射撃
                if (distance > 200) {
                    enemy.x += (dx / distance) * enemy.speed * deltaTime;
                    enemy.y += (dy / distance) * enemy.speed * deltaTime;
                } else if (distance < 150) {
                    enemy.x -= (dx / distance) * enemy.speed * deltaTime * 0.5;
                    enemy.y -= (dy / distance) * enemy.speed * deltaTime * 0.5;
                }
                
                // 射撃
                if (Date.now() - enemy.lastShot > enemy.shootRate && distance < 300) {
                    this.enemyShoot(enemy);
                    enemy.lastShot = Date.now();
                }
                break;
                
            case 'boss':
                this.updateBossBehavior(enemy, deltaTime, distance, dx, dy);
                break;
                
            default: // normal
                if (distance > 0) {
                    enemy.x += (dx / distance) * enemy.speed * deltaTime;
                    enemy.y += (dy / distance) * enemy.speed * deltaTime;
                }
                break;
        }
    }
    
    updateBossBehavior(boss, deltaTime, distance, dx, dy) {
        // フェーズ管理
        const healthPercentage = boss.health / boss.maxHealth;
        if (healthPercentage < 0.5 && boss.phase === 1) {
            boss.phase = 2;
            boss.speed *= 1.5;
            boss.shootRate *= 0.7;
        }
        
        // 移動パターン
        if (distance > 100) {
            boss.x += (dx / distance) * boss.speed * deltaTime;
            boss.y += (dy / distance) * boss.speed * deltaTime;
        } else {
            // 円運動
            const angle = Math.atan2(dy, dx) + Math.PI / 2;
            boss.x += Math.cos(angle) * boss.speed * deltaTime;
            boss.y += Math.sin(angle) * boss.speed * deltaTime;
        }
        
        // 通常射撃
        if (Date.now() - boss.lastShot > boss.shootRate) {
            this.bossShoot(boss);
            boss.lastShot = Date.now();
        }
        
        // 特殊攻撃
        boss.specialAttackTimer += deltaTime * 1000;
        if (boss.specialAttackTimer > boss.specialAttackRate) {
            this.bossSpecialAttack(boss);
            boss.specialAttackTimer = 0;
        }
    }
    
    
    killEnemy(index) {
        const enemy = this.enemies[index];
        
        // BGMシステムに敵撃破イベント通知
        this.audioSystem.onGameEvent('ENEMY_DEFEAT', { enemyType: enemy.type });
        
        // 敵撃破音再生
        if (this.audioSystem.sounds.enemyKill) {
            this.audioSystem.sounds.enemyKill();
        }
        
        
        // 爆発エフェクト（敵タイプによって変化）
        const effectCount = enemy.type === 'boss' ? 30 : enemy.type === 'tank' ? 20 : 15;
        for (let i = 0; i < effectCount; i++) {
            const angle = (Math.PI * 2 * i) / effectCount;
            const speed = 150 + Math.random() * 100;
            this.createParticle(
                enemy.x,
                enemy.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 2 === 0 ? '#ff6b6b' : '#ffeb3b',
                800
            );
        }
        
        // 中心の爆発フラッシュ
        const flashCount = enemy.type === 'boss' ? 15 : 5;
        for (let i = 0; i < flashCount; i++) {
            this.createParticle(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                '#ffffff',
                300
            );
        }
        
        // アイテムドロップ（PickupSystemに移行済み）
        this.pickupSystem.createPickupsFromEnemy(enemy);
        
        // ボス撃破時のみフラグリセット
        if (enemy.type === 'boss') {
            this.bossActive = false; // ボス撃破でフラグリセット
        }
        
        // コンボ更新
        this.combo.count++;
        
        // コンボグローエフェクト
        const comboElement = document.getElementById('combo-value');
        const mobileComboElement = document.getElementById('mobile-combo-value');
        if (comboElement) {
            comboElement.classList.remove('combo-glow');
            setTimeout(() => comboElement.classList.add('combo-glow'), 10);
            setTimeout(() => comboElement.classList.remove('combo-glow'), 510);
        }
        if (mobileComboElement) {
            mobileComboElement.classList.remove('combo-glow');
            setTimeout(() => mobileComboElement.classList.add('combo-glow'), 10);
            setTimeout(() => mobileComboElement.classList.remove('combo-glow'), 510);
        }
        if (this.combo.count > this.combo.maxCombo) {
            this.combo.maxCombo = this.combo.count;
        }
        
        // 統計更新
        this.stats.kills++;
        let scoreBonus = 100;
        if (enemy.type === 'boss') scoreBonus = 1000;
        else if (enemy.type === 'tank') scoreBonus = 300;
        else if (enemy.type === 'shooter') scoreBonus = 200;
        else if (enemy.type === 'fast') scoreBonus = 150;
        
        // コンボボーナス
        const comboBonus = Math.floor(this.combo.count / 5);
        this.stats.score += (scoreBonus + comboBonus * 50) * this.stats.wave;
        
        // 経験値をLevelSystemで付与
        const expGain = this.levelSystem.getExperienceForEnemy(enemy.type);
        this.levelSystem.addExperience(expGain);
        
        this.enemies.splice(index, 1);
    }
    
    // levelUp は LevelSystem に移行
    
    // showLevelUpOptions は LevelSystem に移行
    
    // selectUpgradesByRarity は LevelSystem に移行
    
    
    
    // updateParticles は ParticleSystem に移行
    updateParticles(deltaTime) {
        this.particleSystem.update(deltaTime);
    }
    
    
    updatePickups(deltaTime) {
        // アイテム物理処理はPhysicsSystemで処理済み
        // アイテム収集処理はPickupSystemで処理済み
        // このメソッドは現在空の状態（将来的に削除予定）
    }
    
    /**
     * アイテム収集処理 (PickupSystemに移行済み)
     * @deprecated このメソッドは非推奨です。代わりにPickupSystem.collectPickup()を使用してください。
     * @param {Object} pickup - 収集するアイテム
     * @param {number} index - アイテムの配列インデックス
     */
    collectPickup(pickup, index) {
        // PickupSystemに移行済み - 呼び出しを委譲
        this.pickupSystem.collectPickup(pickup, index);
    }
    
    updateDamageEffects(deltaTime) {
        // 画面フラッシュの減衰
        if (this.damageEffects.screenFlash > 0) {
            this.damageEffects.screenFlash -= deltaTime * 3; // 3秒で完全に消える
            this.damageEffects.screenFlash = Math.max(0, this.damageEffects.screenFlash);
        }
        
        // 画面揺れの更新
        if (this.damageEffects.screenShake.duration > 0) {
            this.damageEffects.screenShake.duration -= deltaTime * 1000;
            
            if (this.damageEffects.screenShake.duration > 0) {
                const intensity = this.damageEffects.screenShake.intensity * (this.damageEffects.screenShake.duration / 300);
                this.damageEffects.screenShake.x = (Math.random() - 0.5) * intensity;
                this.damageEffects.screenShake.y = (Math.random() - 0.5) * intensity;
            } else {
                this.damageEffects.screenShake.x = 0;
                this.damageEffects.screenShake.y = 0;
                this.damageEffects.screenShake.intensity = 0;
            }
        }
    }
    
    updateCamera() {
        // カメラは固定（プレイヤー中心）+ 画面揺れ
        this.camera.x = this.player.x - 640 + this.damageEffects.screenShake.x;
        this.camera.y = this.player.y - 360 + this.damageEffects.screenShake.y;
    }
    
    updateGameLogic(deltaTime) {
        // ゲーム時間更新
        this.stats.gameTime = Date.now() - this.stats.startTime;
        
        // コンボタイムアウトチェック削除（ダメージ時のみリセット）
        
        // ステージシステム更新（既存のウェーブ進行を統合）
        // 999ウェーブシステム有効時は旧ステージシステムをスキップ
        if (!this.useNewWaveSystem) {
            this.stageSystem.update(deltaTime);
        }
        
        // 999ウェーブシステム更新（新システム有効時のみ）
        if (this.useNewWaveSystem) {
            this.waveSystem.update(deltaTime);
        }
        
        // 既存のウェーブ進行（StageSystemと並行実行して互換性確保）
        // 999ウェーブシステム有効時は旧システムをスキップ
        if (!this.useNewWaveSystem) {
            this.waveTimer += deltaTime * 1000;
        }
        
        if (!this.useNewWaveSystem && this.waveTimer > 30000) { // 30秒ごとにウェーブ増加
            this.stats.wave++;
            this.waveTimer = 0;
            this.difficultyMultiplier += 0.2;
            this.enemySystem.resetBossState(); // 新ウェーブでボスフラグリセット
            
            // BGM切り替え処理（ステージ変更検出）
            const currentStage = Math.floor((this.stats.wave - 1) / 4) + 1;
            const previousStage = Math.floor((this.stats.wave - 2) / 4) + 1;
            
            // デバッグログ：毎ウェーブでステージ情報を出力
            console.log(`ZombieSurvival: Wave ${this.stats.wave} - Stage analysis:`, {
                currentStage: currentStage,
                previousStage: previousStage,
                stageChanged: currentStage > previousStage,
                waveTimer: (this.waveTimer / 1000).toFixed(1) + 's'
            });
            
            if (currentStage > previousStage) {
                // 新しいステージに入った場合、BGMを切り替え
                console.log(`ZombieSurvival: Stage change detected ${previousStage} → ${currentStage}, switching BGM`);
                
                // ステージ1音楽システム制御
                if (currentStage === 1) {
                    this.audioSystem.enableStage1Music();
                } else {
                    this.audioSystem.disableStage1Music();
                }
                
                this.audioSystem.stopBGM();
                // 少し遅延してから新しいBGMを開始（音響的な間を作る）
                setTimeout(() => {
                    this.audioSystem.startBGM();
                }, 200);
            }
        }
        
        // ゲームオーバーチェック
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    /**
     * 999ウェーブシステム切り替え制御
     * @param {boolean} enabled - 新システムを有効にするか
     */
    enableNewWaveSystem(enabled = true) {
        this.useNewWaveSystem = enabled;
        this.waveSystem.setEnabled(enabled);
        
        if (enabled) {
            // 新システム有効化時の処理
            console.log('ZombieSurvival: 999ウェーブシステムを有効化');
            // 既存ウェーブ状態をリセット
            this.stats.wave = 1;
            this.waveTimer = 0;
            this.waveSystem.reset();
        } else {
            // 旧システム復帰時の処理
            console.log('ZombieSurvival: 既存ウェーブシステムに復帰');
        }
    }
    
    /**
     * WaveSystemデバッグ情報表示
     */
    debugNewWaveSystem() {
        if (!this.waveSystem) {
            console.log('WaveSystem not initialized');
            return;
        }
        
        const debugInfo = this.waveSystem.getDebugInfo();
        const waveInfo = this.waveSystem.getWaveInfo();
        
        console.log('=== WaveSystem Debug Info ===');
        console.log('Current Wave:', waveInfo.currentWave, '/', waveInfo.maxWave);
        console.log('Enemies:', waveInfo.remainingEnemies, '/', waveInfo.totalEnemies);
        console.log('Progress:', (waveInfo.progress * 100).toFixed(1) + '%');
        console.log('Is Clearing:', waveInfo.isClearing);
        console.log('System State:', debugInfo);
        console.log('===========================');
        
        return { debugInfo, waveInfo };
    }
    
    /**
     * 999ウェーブシステム強制有効化（デバッグ用）
     * コンソールで game.enable999WaveSystem() を実行
     */
    enable999WaveSystem() {
        console.log('🌟 999ウェーブシステムを有効化します...');
        
        // 新システム有効化
        this.enableNewWaveSystem(true);
        
        // ゲーム状態リセット（startGameメソッド内のリセット処理を使用）
        this.gameState = 'playing';
        this.isPaused = false;
        
        // プレイヤーリセット
        this.player.reset();
        
        // 武器システム完全リセット
        this.weaponSystem.reset();
        this.currentWeapon = 'plasma';
        
        // 統計リセット
        this.stats = {
            score: 0,
            kills: 0,
            wave: 1,
            gameTime: 0,
            startTime: Date.now()
        };
        
        // コンボリセット
        this.combo = {
            count: 0,
            maxCombo: 0
        };
        
        // エンティティクリア
        this.enemies = [];
        this.bulletSystem.clearAllBullets();
        this.pickupSystem.clearPickups();
        
        // 999ウェーブシステム特有のリセット
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        
        console.log('✅ 999ウェーブシステムが有効化されました！');
        console.log('📊 デバッグ情報を表示するには: game.debugNewWaveSystem()');
        console.log('🔧 プール統計を表示するには: game.enemySystem.debugPool()');
        console.log('🎯 現在の設定:');
        console.log('  - 新システム:', this.useNewWaveSystem ? '有効' : '無効');
        console.log('  - デバッグモード:', this.debugWaveSystem ? '有効' : '無効');
        
        return {
            enabled: true,
            currentWave: this.waveSystem.currentWave,
            maxWave: this.waveSystem.maxWave,
            enemyPoolEnabled: this.enemySystem.useEnemyPool
        };
    }
    
    /**
     * 旧システムに復帰（デバッグ用）
     * コンソールで game.revertToLegacySystem() を実行
     */
    revertToLegacySystem() {
        console.log('🔄 旧システムに復帰します...');
        
        // 旧システム復帰
        this.enableNewWaveSystem(false);
        
        // ゲーム状態リセット（startGameメソッド内のリセット処理を使用）
        this.gameState = 'playing';
        this.isPaused = false;
        
        // プレイヤーリセット
        this.player.reset();
        
        // 武器システム完全リセット
        this.weaponSystem.reset();
        this.currentWeapon = 'plasma';
        
        // 統計リセット
        this.stats = {
            score: 0,
            kills: 0,
            wave: 1,
            gameTime: 0,
            startTime: Date.now()
        };
        
        // コンボリセット
        this.combo = {
            count: 0,
            maxCombo: 0
        };
        
        // エンティティクリア
        this.enemies = [];
        this.bulletSystem.clearAllBullets();
        this.pickupSystem.clearPickups();
        
        // 旧システム特有のリセット
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        
        console.log('✅ 旧システムに復帰しました！');
        
        return {
            enabled: false,
            legacyWave: this.stats.wave,
            useNewWaveSystem: this.useNewWaveSystem
        };
    }
    
    // damagePlayer() メソッドは Player クラスの takeDamage() に移行済み
    
    // createParticle は ParticleSystem に移行
    createParticle(x, y, vx, vy, color, life) {
        this.particleSystem.createParticle(x, y, vx, vy, color, life);
    }
    
    // 爆発処理
    explode(x, y, radius, damage) {
        // 爆発エフェクト
        for (let i = 0; i < 25; i++) {
            const angle = (Math.PI * 2 * i) / 25;
            const speed = 200 + Math.random() * 150;
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 3 === 0 ? '#ff6b6b' : i % 3 === 1 ? '#ffeb3b' : '#ff9f43',
                1000
            );
        }
        
        // 中心の白い爆発
        for (let i = 0; i < 10; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                '#ffffff',
                500
            );
        }
        
        // 範囲内の敵にダメージ
        this.enemies.forEach(enemy => {
            const dx = enemy.x - x;
            const dy = enemy.y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance <= radius) {
                const damageRatio = 1 - (distance / radius);
                const explosionDamage = damage * damageRatio;
                
                // 経験値計算（実際のダメージ量で）
                const actualDamage = Math.min(explosionDamage, enemy.health);
                const damageExp = this.physicsSystem.calculateDamageExperience(actualDamage, enemy.type);
                
                // Enemyクラスの場合はtakeDamageメソッドを使用
                if (enemy.takeDamage) {
                    enemy.takeDamage(explosionDamage);
                } else {
                    enemy.health -= explosionDamage;
                }
                
                // 経験値付与
                if (damageExp > 0) {
                    this.levelSystem.addExperience(damageExp);
                }
            }
        });
    }
    
    gameOver() {
        // 復活データを保存
        this.saveRevivalData();
        
        this.gameState = 'gameOver';
        
        // BGM停止
        this.audioSystem.stopBGM();
        
        // ハイスコア更新
        if (this.stats.score > this.highScore) {
            this.highScore = this.stats.score;
            localStorage.setItem('zombieSurvivalHighScore', this.highScore);
            document.getElementById('new-record').classList.remove('hidden');
        } else {
            document.getElementById('new-record').classList.add('hidden');
        }
        
        // 最終統計表示
        document.getElementById('final-score').textContent = this.stats.score.toLocaleString();
        document.getElementById('final-time').textContent = this.uiSystem.formatTime(this.stats.gameTime);
        document.getElementById('final-level').textContent = this.player.level;
        document.getElementById('final-kills').textContent = this.stats.kills;
        document.getElementById('final-combo').textContent = this.combo.maxCombo;
        
        this.uiSystem.showGameOverScreen();
    }
    
    /**
     * 復活データ保存
     */
    saveRevivalData() {
        console.log('🛟 ZombieSurvival: Saving revival data...');
        console.log('🔍 DEBUG: Player state before save:', {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            level: this.player.level,
            currentWave: this.stats.wave,
            currentScore: this.stats.score,
            position: { x: this.player.x, y: this.player.y }
        });
        
        this.revivalSystem.savedGameData = {
            // プレイヤー状態
            playerLevel: this.player.level,
            playerSkills: { ...this.player.skillLevels },
            playerStats: {
                maxHealth: this.player.maxHealth,
                bulletSize: this.player.bulletSizeMultiplier,
                bulletSpeed: this.player.bulletSpeedMultiplier,
                damage: this.player.damageMultiplier,
                fireRate: this.player.fireRateMultiplier,
                multishot: this.player.multishotCount,
                piercing: this.player.piercingChance,
                bouncing: this.player.bounceChance,
                homing: this.player.homingChance,
                range: this.player.rangeMultiplier,
                magnetism: this.player.magnetismRange
            },
            playerPosition: { x: this.player.x, y: this.player.y },
            
            // ゲーム進行状態
            currentWave: this.stats.wave,
            currentScore: this.stats.score,
            gameTime: this.stats.gameTime,
            kills: this.stats.kills,
            maxCombo: this.combo.maxCombo,
            difficultyMultiplier: this.difficultyMultiplier,
            
            // タイムスタンプ
            saveTime: Date.now()
        };
        
        this.revivalSystem.hasReviveData = true;
        this.revivalSystem.marioDifficulty = Math.min(this.revivalSystem.reviveCount, 5);
        
        console.log('💾 ZombieSurvival: Revival data saved successfully!', {
            reviveCount: this.revivalSystem.reviveCount,
            difficulty: this.revivalSystem.marioDifficulty,
            wave: this.stats.wave,
            level: this.player.level,
            hasReviveData: this.revivalSystem.hasReviveData,
            savedDataExists: !!this.revivalSystem.savedGameData,
            savedDataSize: this.revivalSystem.savedGameData ? Object.keys(this.revivalSystem.savedGameData).length : 0
        });
    }
    
    /**
     * "もう一度プレイ"ボタンクリック処理
     */
    async handlePlayAgainClick() {
        console.log('🎮 ZombieSurvival: Play again clicked');
        
        if (this.revivalSystem.hasReviveData) {
            // マリオミニゲーム開始
            await this.startMarioMiniGame();
        } else {
            // 通常の新ゲーム開始
            await this.startGame();
        }
    }
    
    /**
     * マリオミニゲーム開始
     */
    async startMarioMiniGame() {
        console.log('🍄 ZombieSurvival: Starting Mario mini-game with difficulty', this.revivalSystem.marioDifficulty);
        
        try {
            this.gameState = 'marioMiniGame';
            
            // Hide main game UI elements
            console.log('🔒 ZombieSurvival: Hiding UI elements');
            document.getElementById('gameover-screen').classList.add('hidden');
            document.getElementById('pc-ui').classList.add('hidden');
            document.getElementById('mobile-ui').classList.add('hidden');
            
            // Show game screen canvas
            const gameScreen = document.getElementById('game-screen');
            if (gameScreen) {
                gameScreen.classList.remove('hidden');
                gameScreen.classList.add('active');
                console.log('🖥️ ZombieSurvival: Game screen shown');
            }
            
            // Set body touch action
            document.body.style.touchAction = 'none';
            
            // マリオゲーム初期化
            console.log('🍄 ZombieSurvival: Creating MarioMiniGame instance');
            this.marioGame = new MarioMiniGame(this.canvas, this.ctx, this);
            
            // 難易度を設定してゲーム開始
            console.log('🍄 ZombieSurvival: Starting Mario game with difficulty', this.revivalSystem.marioDifficulty);
            await this.marioGame.start(this.revivalSystem.marioDifficulty);
            
            // メインゲームの更新・描画を停止（マリオゲームが制御）
            this.isPaused = true;
            
            console.log('✅ ZombieSurvival: Mario mini-game started successfully');
            
        } catch (error) {
            console.error('❌ ZombieSurvival: Failed to start Mario mini-game:', error);
            console.error('Stack trace:', error.stack);
            
            // エラー時は通常のゲーム開始にフォールバック
            this.gameState = 'gameOver';
            this.isPaused = false;
            this.uiSystem.showGameOverScreen();
        }
    }
    
    /**
     * マリオゲーム成功時の処理
     */
    handleMarioGameSuccess() {
        console.log('🏆 ZombieSurvival: Mario game succeeded! Reviving player...');
        console.log('🔍 DEBUG: Revival system state:', {
            hasReviveData: this.revivalSystem.hasReviveData,
            savedGameData: !!this.revivalSystem.savedGameData,
            reviveCount: this.revivalSystem.reviveCount,
            currentGameState: this.gameState
        });
        
        try {
            this.revivePlayer();
            this.revivalSystem.reviveCount++;
            
            // メインゲームに復帰
            console.log('🔄 DEBUG: Setting game state to playing...');
            this.gameState = 'playing';
            this.isPaused = false;
            
            console.log('✅ DEBUG: Revival completed, game state set to playing');
            console.log('🎮 DEBUG: Current game state:', this.gameState);
            console.log('⏸️ DEBUG: Is paused:', this.isPaused);
            
            // ゲームループの再開を確実にする
            if (!this.animationFrameId) {
                console.log('🔄 DEBUG: Restarting main game loop...');
                this.gameLoop();
            } else {
                console.log('🔄 DEBUG: Main game loop already running, frameId:', this.animationFrameId);
            }
        } catch (error) {
            console.error('❌ DEBUG: Revival failed:', error);
            console.error('❌ DEBUG: Error stack:', error.stack);
            return;
        }
        
        // Show main game UI elements again
        document.getElementById('gameover-screen').classList.add('hidden');
        if (this.isMobile) {
            document.getElementById('mobile-ui').classList.remove('hidden');
            document.getElementById('pc-ui').classList.add('hidden');
        } else {
            document.getElementById('pc-ui').classList.remove('hidden');
            document.getElementById('mobile-ui').classList.add('hidden');
        }
        
        // マリオゲームクリーンアップ
        if (this.marioGame) {
            this.marioGame.cleanup();
            this.marioGame = null;
        }
        
        // BGM再開
        this.audioSystem.startBGM();
        
        console.log('✨ ZombieSurvival: Player successfully revived!', {
            reviveCount: this.revivalSystem.reviveCount,
            health: this.player.health,
            wave: this.stats.wave
        });
    }
    
    /**
     * マリオゲーム失敗時の処理
     */
    handleMarioGameFailure() {
        console.log('💀 ZombieSurvival: Mario game failed. Complete game over.');
        
        // 復活データをクリア
        this.clearRevivalData();
        
        // 完全ゲームオーバー
        this.gameState = 'gameOver';
        this.isPaused = false;
        
        // Show game over screen
        document.getElementById('gameover-screen').classList.remove('hidden');
        document.getElementById('pc-ui').classList.add('hidden');
        document.getElementById('mobile-ui').classList.add('hidden');
        
        // マリオゲームクリーンアップ
        if (this.marioGame) {
            this.marioGame.cleanup();
            this.marioGame = null;
        }
        
        // ゲームオーバー画面を再表示
        this.uiSystem.showGameOverScreen();
        
        console.log('🔚 ZombieSurvival: Complete game over - no more revivals');
    }
    
    /**
     * プレイヤー復活処理
     */
    revivePlayer() {
        const savedData = this.revivalSystem.savedGameData;
        if (!savedData) {
            console.error('❌ ZombieSurvival: No revival data found!');
            console.error('🔍 DEBUG: Revival system dump:', {
                hasReviveData: this.revivalSystem.hasReviveData,
                reviveCount: this.revivalSystem.reviveCount,
                marioDifficulty: this.revivalSystem.marioDifficulty,
                savedDataType: typeof this.revivalSystem.savedGameData,
                savedDataKeys: this.revivalSystem.savedGameData ? Object.keys(this.revivalSystem.savedGameData) : 'null'
            });
            return;
        }
        
        console.log('🔍 DEBUG: Revival data found:', {
            playerLevel: savedData.playerLevel,
            currentWave: savedData.currentWave,
            currentScore: savedData.currentScore,
            playerHealthBeforeRevive: this.player.health,
            maxHealthFromSave: savedData.playerStats?.maxHealth
        });
        
        // プレイヤー状態復元
        this.player.level = savedData.playerLevel;
        this.player.skillLevels = { ...savedData.playerSkills };
        
        // ステータス復元
        const stats = savedData.playerStats;
        this.player.maxHealth = stats.maxHealth;
        this.player.bulletSizeMultiplier = stats.bulletSize;
        this.player.bulletSpeedMultiplier = stats.bulletSpeed;
        this.player.damageMultiplier = stats.damage;
        this.player.fireRateMultiplier = stats.fireRate;
        this.player.multishotCount = stats.multishot;
        this.player.piercingChance = stats.piercing;
        this.player.bounceChance = stats.bouncing;
        this.player.homingChance = stats.homing;
        this.player.rangeMultiplier = stats.range;
        this.player.magnetismRange = stats.magnetism;
        
        // HP復活（復活回数によるペナルティ）
        const revivePenalty = Math.min(this.revivalSystem.reviveCount * 0.1, 0.5);
        this.player.health = Math.ceil(this.player.maxHealth * (1 - revivePenalty));
        
        // 位置復元
        this.player.x = savedData.playerPosition.x;
        this.player.y = savedData.playerPosition.y;
        
        // ゲーム状態復元
        this.stats.wave = savedData.currentWave;
        this.stats.score = savedData.currentScore;
        this.stats.gameTime = savedData.gameTime;
        this.stats.kills = savedData.kills;
        this.combo.maxCombo = savedData.maxCombo;
        this.combo.count = 0; // コンボはリセット
        this.difficultyMultiplier = savedData.difficultyMultiplier;
        
        // 現在の敵をクリア（復活時はクリーンスタート）
        this.enemies = [];
        this.bulletSystem.clearAllBullets();
        
        // UI更新
        this.uiSystem.updateUI();
        this.uiSystem.showGameScreen();
        
        console.log('♻️ ZombieSurvival: Player revival completed', {
            health: this.player.health,
            maxHealth: this.player.maxHealth,
            level: this.player.level,
            wave: this.stats.wave,
            penalty: Math.round(revivePenalty * 100) + '%'
        });
    }
    
    /**
     * 復活データクリア
     */
    clearRevivalData() {
        this.revivalSystem.hasReviveData = false;
        this.revivalSystem.savedGameData = null;
        this.revivalSystem.reviveCount = 0;
        this.revivalSystem.marioDifficulty = 0;
        
        console.log('🗑️ ZombieSurvival: Revival data cleared');
    }
    
    
    // UI表示切替
    
    
    
    
    render() {
        // 画面クリア（宇宙戦場背景）
        this.ctx.fillStyle = '#0a0a15';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 星空エフェクト（静的な星）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = 0.6;
        for (let i = 0; i < 100; i++) {
            const x = (i * 137 + i * i) % this.baseWidth;
            const y = (i * 149 + i * i * 2) % this.baseHeight;
            const size = (i % 3) + 0.5;
            this.ctx.fillRect(x, y, size, size);
        }
        
        // 遠方の星雲エフェクト
        this.ctx.globalAlpha = 0.1;
        this.ctx.fillStyle = '#4444ff';
        for (let i = 0; i < 20; i++) {
            const x = (i * 247) % this.baseWidth;
            const y = (i * 179) % this.baseHeight;
            this.ctx.beginPath();
            this.ctx.arc(x, y, 30 + (i % 20), 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        
        // 背景要素描画（RenderSystemに移行）
        this.renderSystem.renderBackground();
        
        // 血痕描画は削除（爆発エフェクトに変更）
        
        // パーティクル描画（RenderSystemに移行）
        this.renderSystem.renderParticles();
        
        // 弾丸描画（RenderSystemに移行）
        this.renderSystem.renderBullets();
        
        // 敵描画（RenderSystemに移行）
        this.renderSystem.renderEnemies();
        
        // アイテム描画（RenderSystemに移行）
        this.renderSystem.renderPickups();
        
        // プレイヤー描画（RenderSystemに移行）
        this.renderSystem.renderPlayer();
        
        // UIエフェクト描画（RenderSystemに移行）
        this.renderSystem.renderUIEffects();
        
        // BackgroundSystem正常動作確認済み - デバッグマーカー削除
        
        // リロード表示は無限弾薬のため不要
    }
    
    /**
     * 弾丸配列へのアクセサ（後方互換性のため）
     * @returns {Array} 弾丸配列
     */
    get bullets() {
        return this.bulletSystem.getBullets();
    }
    
    /**
     * キャラクター選択処理
     * @param {string} characterType - 選択されたキャラクタータイプ
     */
    selectCharacter(characterType) {
        this.selectedCharacter = characterType;
        this.characterConfig = CharacterFactory.createCharacter(characterType);
        
        console.log(`ZombieSurvival: キャラクター選択 - ${this.characterConfig.name}`, {
            characterType,
            config: this.characterConfig
        });
    }
    
    /**
     * キャラクター選択状態に移行
     */
    showCharacterSelect() {
        this.gameState = 'characterSelect';
        this.hideAllScreens();
        document.getElementById('character-select-screen').classList.remove('hidden');
        
        // カーソルをデフォルトに戻す
        this.resetCursor();
        
        // キャラクター選択イベントリスナー設定
        this.setupCharacterSelectListeners();
    }
    
    /**
     * キャラクター選択イベントリスナー設定
     * @private
     */
    setupCharacterSelectListeners() {
        // 既存のリスナーを削除（重複防止）
        this.removeCharacterSelectListeners();
        
        // キャラクターカード選択
        this.characterSelectHandler = (e) => {
            const card = e.target.closest('.character-card');
            if (!card) return;
            
            const characterType = card.dataset.character;
            
            // 選択状態更新
            document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // キャラクター選択
            this.selectCharacter(characterType);
            
            // ゲーム開始ボタン有効化
            document.getElementById('confirm-character-btn').disabled = false;
        };
        
        // 戻るボタン
        this.backToMenuHandler = () => {
            this.gameState = 'menu';
            this.hideAllScreens();
            document.getElementById('main-menu').classList.remove('hidden');
        };
        
        // ゲーム開始ボタン
        this.confirmCharacterHandler = () => {
            console.log('confirmCharacterHandler called, selectedCharacter:', this.selectedCharacter);
            if (this.selectedCharacter) {
                console.log('Creating player and starting game...');
                this.createPlayerWithCharacter();
                this.startGame();
            } else {
                console.log('No character selected!');
            }
        };
        
        // イベントリスナー登録
        document.querySelectorAll('.character-card').forEach(card => {
            card.addEventListener('click', this.characterSelectHandler);
        });
        
        document.getElementById('character-back-btn').addEventListener('click', this.backToMenuHandler);
        document.getElementById('confirm-character-btn').addEventListener('click', this.confirmCharacterHandler);
    }
    
    /**
     * キャラクター選択イベントリスナー削除
     * @private
     */
    removeCharacterSelectListeners() {
        if (this.characterSelectHandler) {
            document.querySelectorAll('.character-card').forEach(card => {
                card.removeEventListener('click', this.characterSelectHandler);
            });
        }
        
        if (this.backToMenuHandler) {
            document.getElementById('character-back-btn')?.removeEventListener('click', this.backToMenuHandler);
        }
        
        if (this.confirmCharacterHandler) {
            document.getElementById('confirm-character-btn')?.removeEventListener('click', this.confirmCharacterHandler);
        }
    }
    
    /**
     * 選択されたキャラクターでプレイヤーを作成
     * @private
     */
    createPlayerWithCharacter() {
        // 新しいプレイヤーインスタンス作成
        this.player = new Player(640, 360, this.selectedCharacter);
        this.player.setGame(this);
        
        // キャラクター設定適用
        if (this.characterConfig) {
            this.player.applyCharacterConfig(this.characterConfig);
        }
        
        console.log(`ZombieSurvival: プレイヤー作成完了`, {
            characterType: this.selectedCharacter,
            player: this.player,
            autoAim: this.player.autoAim,
            inputMode: this.player.inputMode,
            luckLevel: this.player.skillLevels.luck
        });
    }
    
    /**
     * 全画面を非表示にする
     * @private
     */
    hideAllScreens() {
        const screens = [
            'loading-screen',
            'main-menu',
            'character-select-screen',
            'instructions-screen',
            'settings-screen'
        ];
        
        screens.forEach(screenId => {
            const screen = document.getElementById(screenId);
            if (screen) {
                screen.classList.add('hidden');
            }
        });
    }
    
    /**
     * ルナ専用カーソルの適用・解除
     * @private
     */
    applyLunaCursor() {
        const gameCanvas = document.getElementById('game-canvas');
        const gameScreen = document.getElementById('game-screen');
        
        if (this.selectedCharacter === 'luna') {
            // ルナの場合：可愛いカーソルを適用
            if (gameCanvas) gameCanvas.classList.add('luna-cursor');
            if (gameScreen) gameScreen.classList.add('luna-cursor');
            document.body.classList.add('luna-cursor');
            console.log('Luna cursor applied');
        } else {
            // その他キャラクター：標準カーソル
            if (gameCanvas) gameCanvas.classList.remove('luna-cursor');
            if (gameScreen) gameScreen.classList.remove('luna-cursor');
            document.body.classList.remove('luna-cursor');
            console.log('Standard cursor applied');
        }
    }
    
    /**
     * カーソルをデフォルトに戻す（ゲーム終了時等）
     * @private
     */
    resetCursor() {
        const gameCanvas = document.getElementById('game-canvas');
        const gameScreen = document.getElementById('game-screen');
        
        if (gameCanvas) gameCanvas.classList.remove('luna-cursor');
        if (gameScreen) gameScreen.classList.remove('luna-cursor');
        document.body.classList.remove('luna-cursor');
    }
    
    /**
     * 999ウェーブシステム関連コマンド追加
     */
    addWaveSystemCommands() {
        // ゲーム内選択UI作成
        this.createWaveSystemSelectUI();
        
        console.log('🎮 999ウェーブシステムコマンド追加完了');
    }
    
    /**
     * 999ウェーブシステム有効化
     */
    enable999WaveSystem() {
        if (this.gameState === 'playing') {
            console.warn('⚠️ ゲーム中はシステム変更できません。ゲームを再開始してください。');
            return false;
        }
        
        this.useNewWaveSystem = true;
        this.waveSystem.setEnabled(true);
        
        console.log('✅ 999ウェーブシステム有効化完了！');
        console.log('📊 システム情報:', this.waveSystem.getDebugInfo());
        
        // UI更新
        this.updateWaveSystemUI();
        
        return true;
    }
    
    /**
     * 旧システムに復帰
     */
    revertToLegacySystem() {
        if (this.gameState === 'playing') {
            console.warn('⚠️ ゲーム中はシステム変更できません。ゲームを再開始してください。');
            return false;
        }
        
        this.useNewWaveSystem = false;
        this.waveSystem.setEnabled(false);
        
        console.log('🔄 旧システムに復帰しました');
        
        // UI更新
        this.updateWaveSystemUI();
        
        return true;
    }
    
    /**
     * WaveSystemデバッグ情報表示
     */
    debugNewWaveSystem() {
        console.log('🔍 === 999ウェーブシステム デバッグ情報 ===');
        console.log('システム状態:', {
            enabled: this.useNewWaveSystem,
            waveSystemReady: this.waveSystem.isReady,
            gameState: this.gameState
        });
        
        if (this.useNewWaveSystem) {
            console.log('Wave情報:', this.waveSystem.getWaveInfo());
            console.log('デバッグ情報:', this.waveSystem.getDebugInfo());
            
            if (this.enemySystem.getPoolStats) {
                console.log('敵プール統計:', this.enemySystem.getPoolStats());
            }
        } else {
            console.log('❌ システムが無効です。enable999WaveSystem()で有効化してください。');
        }
        
        console.log('==========================================');
    }
    
    /**
     * ウェーブシステム選択UI作成
     */
    createWaveSystemSelectUI() {
        // メニュー画面にシステム選択ボタンを追加
        const menuScreen = document.getElementById('main-menu');
        if (!menuScreen) {
            console.warn('⚠️ メニュー画面が見つかりません。UIを後で追加します。');
            return;
        }
        
        // 既存のボタンがあれば削除
        const existingContainer = document.getElementById('wave-system-selector');
        if (existingContainer) {
            existingContainer.remove();
        }
        
        const selectorContainer = document.createElement('div');
        selectorContainer.id = 'wave-system-selector';
        selectorContainer.className = 'wave-system-selector';
        selectorContainer.innerHTML = `
            <div class="wave-system-title">📈 ゲームモード選択</div>
            <div class="wave-system-buttons">
                <button id="legacy-system-btn" class="wave-system-btn legacy ${!this.useNewWaveSystem ? 'active' : ''}">
                    <div class="btn-title">🏛️ 従来モード</div>
                    <div class="btn-desc">時間制限・ステージ制ゲーム</div>
                </button>
                <button id="new-wave-system-btn" class="wave-system-btn new ${this.useNewWaveSystem ? 'active' : ''}">
                    <div class="btn-title">🌊 999ウェーブモード</div>
                    <div class="btn-desc">全撃破・無限モード (NEW!)</div>
                </button>
            </div>
            <div class="wave-system-status">
                現在: <span id="current-mode">${this.useNewWaveSystem ? '999ウェーブモード' : '従来モード'}</span>
            </div>
        `;
        
        // スタイル追加
        this.addWaveSystemStyles();
        
        // 適切な位置に挿入（menu-buttonsの後）
        const menuButtons = menuScreen.querySelector('.menu-buttons');
        if (menuButtons) {
            menuButtons.parentNode.insertBefore(selectorContainer, menuButtons.nextSibling);
        } else {
            menuScreen.appendChild(selectorContainer);
        }
        
        console.log('🎮 ウェーブシステム選択UI作成完了');
        
        // イベントリスナー追加（要素が挿入された後）
        setTimeout(() => {
            const legacyBtn = document.getElementById('legacy-system-btn');
            const newBtn = document.getElementById('new-wave-system-btn');
            
            if (legacyBtn && newBtn) {
                legacyBtn.addEventListener('click', () => {
                    this.revertToLegacySystem();
                });
                
                newBtn.addEventListener('click', () => {
                    this.enable999WaveSystem();
                });
                console.log('✅ ウェーブシステムボタンイベント設定完了');
            } else {
                console.error('❌ ウェーブシステムボタンが見つかりません');
            }
        }, 100);
    }
    
    /**
     * ウェーブシステムUI更新
     */
    updateWaveSystemUI() {
        const legacyBtn = document.getElementById('legacy-system-btn');
        const newBtn = document.getElementById('new-wave-system-btn');
        const currentMode = document.getElementById('current-mode');
        
        if (legacyBtn && newBtn && currentMode) {
            legacyBtn.classList.toggle('active', !this.useNewWaveSystem);
            newBtn.classList.toggle('active', this.useNewWaveSystem);
            currentMode.textContent = this.useNewWaveSystem ? '999ウェーブモード' : '従来モード';
        }
    }
    
    /**
     * ウェーブシステム選択UIスタイル追加
     */
    addWaveSystemStyles() {
        if (document.getElementById('wave-system-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'wave-system-styles';
        style.textContent = `
            .wave-system-selector {
                background: linear-gradient(135deg, rgba(0,123,255,0.1), rgba(40,167,69,0.1));
                border: 2px solid rgba(0,123,255,0.3);
                border-radius: 12px;
                padding: 16px;
                margin: 20px auto;
                max-width: 500px;
                text-align: center;
                backdrop-filter: blur(5px);
            }
            .wave-system-title {
                font-size: 18px;
                font-weight: bold;
                color: #fff;
                margin-bottom: 12px;
                text-shadow: 1px 1px 2px rgba(0,0,0,0.7);
            }
            .wave-system-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-bottom: 12px;
            }
            .wave-system-btn {
                padding: 12px;
                border: 2px solid rgba(255,255,255,0.3);
                border-radius: 8px;
                background: rgba(0,0,0,0.4);
                color: #fff;
                cursor: pointer;
                transition: all 0.3s ease;
                font-family: inherit;
            }
            .wave-system-btn:hover {
                background: rgba(255,255,255,0.2);
                border-color: rgba(255,255,255,0.6);
                transform: translateY(-2px);
            }
            .wave-system-btn.active {
                background: linear-gradient(135deg, #007BFF, #28A745);
                border-color: #fff;
                box-shadow: 0 4px 12px rgba(0,123,255,0.4);
            }
            .wave-system-btn .btn-title {
                font-size: 14px;
                font-weight: bold;
                margin-bottom: 4px;
            }
            .wave-system-btn .btn-desc {
                font-size: 11px;
                opacity: 0.8;
            }
            .wave-system-status {
                color: #fff;
                font-size: 12px;
                opacity: 0.9;
            }
            .wave-system-status span {
                font-weight: bold;
                color: #28A745;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * 999ウェーブシステムの統合テスト実行
     */
    testWaveSystemIntegration() {
        console.log('🧪 === 999ウェーブシステム統合テスト開始 ===');
        
        // 1. システム状態チェック
        console.log('1. システム状態チェック:');
        const systemStatus = {
            waveSystemEnabled: this.useNewWaveSystem,
            waveSystemReady: this.waveSystem?.isReady,
            enemySystemReady: !!this.enemySystem,
            uiSystemReady: !!this.uiSystem,
            audioSystemReady: !!this.audioSystem
        };
        console.log('   状態:', systemStatus);
        
        // 2. WaveSystem機能テスト
        console.log('2. WaveSystem機能テスト:');
        if (this.waveSystem) {
            const wave10Composition = this.waveSystem.calculateEnemyCount(10);
            const wave100Composition = this.waveSystem.calculateEnemyCount(100);
            const wave999Composition = this.waveSystem.calculateEnemyCount(999);
            
            console.log('   Wave 10 構成:', wave10Composition);
            console.log('   Wave 100 構成:', wave100Composition);
            console.log('   Wave 999 構成:', wave999Composition);
            
            // ボスウェーブテスト
            console.log('   ボスウェーブテスト:');
            [10, 20, 50, 100, 500].forEach(wave => {
                const isBoss = this.waveSystem.isBossWave(wave);
                const bossCount = this.waveSystem.calculateBossCount(wave);
                console.log(`   Wave ${wave}: Boss=${isBoss}, Count=${bossCount}`);
            });
        }
        
        // 3. EnemySystem連携テスト
        console.log('3. EnemySystem連携テスト:');
        if (this.enemySystem) {
            const poolStats = this.enemySystem.getPoolStats?.();
            console.log('   敵プール統計:', poolStats || 'プール無効');
            
            // スポーン距離テスト
            ['normal', 'tank', 'fast', 'boss'].forEach(type => {
                const distance = this.enemySystem.getSpawnDistanceForEnemyType?.(type);
                console.log(`   ${type}スポーン距離:`, distance || '未実装');
            });
        }
        
        // 4. UISystem機能テスト
        console.log('4. UISystem機能テスト:');
        if (this.uiSystem) {
            const mockProgress = { active: 150, killed: 50, reserve: 100, total: 300 };
            console.log('   リザーブUI更新テスト:', mockProgress);
            // 実際のUI作成テスト（一時的）
            if (typeof this.uiSystem.createReserveSystemUI === 'function') {
                console.log('   ✅ リザーブUIメソッド存在');
            } else {
                console.log('   ❌ リザーブUIメソッド不在');
            }
        }
        
        // 5. AudioSystem機能テスト
        console.log('5. AudioSystem機能テスト:');
        if (this.audioSystem) {
            if (typeof this.audioSystem.playWaveCompleteSound === 'function') {
                console.log('   ✅ ウェーブクリア音メソッド存在');
            } else {
                console.log('   ❌ ウェーブクリア音メソッド不在');
            }
        }
        
        // 6. 統合チェック結果
        console.log('6. 統合チェック結果:');
        const integrationScore = Object.values(systemStatus).filter(Boolean).length;
        const maxScore = Object.keys(systemStatus).length;
        console.log(`   統合度: ${integrationScore}/${maxScore} (${Math.round(integrationScore/maxScore*100)}%)`);
        
        if (integrationScore === maxScore) {
            console.log('   🎉 全システム正常統合完了！');
            console.log('   💡 次のステップ: game.enable999WaveSystem() でシステム有効化');
        } else {
            console.log('   ⚠️  一部システムに問題があります');
        }
        
        console.log('==========================================');
        
        return {
            systemStatus,
            integrationScore,
            maxScore,
            success: integrationScore === maxScore
        };
    }
    
    /**
     * 999ウェーブシステム実戦テスト（実際にWave 1を開始）
     */
    startWaveSystemTest() {
        if (this.gameState === 'playing') {
            console.warn('⚠️ ゲーム中です。テストを停止してから実行してください。');
            return false;
        }
        
        if (!this.useNewWaveSystem) {
            console.warn('⚠️ 999ウェーブシステムが無効です。enable999WaveSystem()で有効化してください。');
            return false;
        }
        
        console.log('🎮 999ウェーブシステム実戦テスト開始...');
        
        // ゲーム状態をプレイ中に設定
        this.gameState = 'playing';
        
        // プレイヤー位置をリセット
        this.player.x = 640;
        this.player.y = 360;
        this.player.health = this.player.maxHealth;
        
        // システムリセット
        this.waveSystem.reset();
        this.enemySystem.clearAllEnemies();
        
        // Wave 1 開始
        console.log('🌊 Wave 1 テスト開始...');
        
        return true;
    }
    
}

// ゲーム開始処理はmain.jsで実行される
// ES6モジュール対応 - クラス定義時にexport済み

/**
 * グローバルゲームインスタンス設定（デバッグ用）
 * @param {ZombieSurvival} gameInstance - ゲームインスタンス
 */
export function setGlobalGameInstance(gameInstance) {
    if (typeof window !== 'undefined') {
        window.game = gameInstance;
        
        console.log('🎮 Global game instance set!');
        console.log('📋 Available debug commands:');
        console.log('');
        console.log('🌊 999ウェーブシステム:');
        console.log('  game.enable999WaveSystem()      - 999ウェーブシステム有効化');
        console.log('  game.revertToLegacySystem()      - 旧システムに復帰');
        console.log('  game.testWaveSystemIntegration() - 統合テスト実行');
        console.log('  game.startWaveSystemTest()       - 実戦テスト開始');
        console.log('');
        console.log('🔍 デバッグ・情報表示:');
        console.log('  game.debugNewWaveSystem()        - WaveSystem詳細情報');
        console.log('  game.waveSystem.getWaveInfo()    - 現在のウェーブ情報');
        console.log('  game.waveSystem.getDebugInfo()   - WaveSystemデバッグ');
        console.log('  game.enemySystem.debugPool()     - 敵プール統計表示');
        console.log('  game.enemySystem.getPoolStats()  - プール性能統計');
        console.log('');
        console.log('💡 推奨テスト手順:');
        console.log('  1. game.testWaveSystemIntegration() - 全機能チェック');
        console.log('  2. game.enable999WaveSystem()       - システム有効化');
        console.log('  3. メニューで「999ウェーブモード」選択');
        console.log('  4. ゲーム開始で実際にテスト');
    }
}
