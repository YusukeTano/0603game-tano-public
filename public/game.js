class ZombieSurvival {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 音響システム初期化
        this.audioContext = null;
        this.sounds = {};
        this.initAudio();
        
        // ゲーム状態
        this.gameState = 'loading'; // loading, menu, playing, paused, gameOver
        this.isPaused = false;
        
        // プレイヤー
        this.player = {
            x: 400,
            y: 300,
            width: 20,
            height: 20,
            speed: 200,
            dashSpeed: 400,
            isDashing: false,
            dashCooldown: 0,
            health: 100,
            maxHealth: 100,
            level: 1,
            exp: 0,
            expToNext: 100,
            angle: 0
        };
        
        // 武器システム（複数武器対応）
        this.weapons = {
            plasma: {
                name: 'プラズマライフル',
                damage: 25,
                fireRate: 150,
                lastShot: 0,
                ammo: 999,
                maxAmmo: 999,
                totalAmmo: 999,
                reloadTime: 0,
                isReloading: false,
                spread: 0.1,
                range: 300,
                unlocked: true
            },
            grenade: {
                name: 'グレネードランチャー',
                damage: 80,
                fireRate: 1000,
                lastShot: 0,
                ammo: 3,
                maxAmmo: 3,
                totalAmmo: 12,
                reloadTime: 2000,
                isReloading: false,
                spread: 0.05,
                range: 250,
                unlocked: false,
                explosive: true
            }
        };
        
        this.currentWeapon = 'plasma';
        this.secondaryWeapon = 'grenade';
        
        // ゲーム統計
        this.stats = {
            score: 0,
            kills: 0,
            wave: 1,
            gameTime: 0,
            startTime: 0
        };
        
        // エンティティ
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.pickups = [];
        // bloodSplatters は削除（爆発エフェクトに変更）
        
        // 入力
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.isMobile = this.detectMobile();
        
        // UI表示状態
        this.uiVisible = true;
        
        // モバイル用仮想スティック
        this.virtualSticks = {
            move: { x: 0, y: 0, active: false },
            aim: { x: 0, y: 0, active: false, shooting: false }
        };
        
        // ゲーム設定
        this.camera = { x: 0, y: 0 };
        this.enemySpawnTimer = 0;
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        
        // ローカルストレージ
        this.highScore = parseInt(localStorage.getItem('zombieSurvivalHighScore')) || 0;
        
        this.init();
    }
    
    // 現在の武器を取得
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    // セカンダリ武器を取得
    getSecondaryWeapon() {
        return this.weapons[this.secondaryWeapon];
    }
    
    // 武器切り替え
    switchWeapon() {
        if (this.weapons[this.secondaryWeapon].unlocked) {
            const temp = this.currentWeapon;
            this.currentWeapon = this.secondaryWeapon;
            this.secondaryWeapon = temp;
        }
    }
    
    // セカンダリ武器を使用（右クリック）
    useSecondaryWeapon() {
        const weapon = this.getSecondaryWeapon();
        if (!weapon.unlocked) return;
        
        const canShoot = !weapon.isReloading && 
                        weapon.ammo > 0 && 
                        Date.now() - weapon.lastShot > weapon.fireRate;
        
        if (canShoot) {
            if (weapon.explosive) {
                this.shootGrenade();
            } else {
                // 他の武器タイプはここに追加
                this.shootWithWeapon(this.secondaryWeapon);
            }
        }
    }
    
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // BGM用変数
            this.bgmOscillators = [];
            this.isBGMPlaying = false;
            
            // 音響エフェクト生成
            this.createSounds();
        } catch (error) {
            console.log('音響システムの初期化に失敗:', error);
        }
    }
    
    createSounds() {
        // 射撃音
        this.sounds.shoot = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        
        // 敵撃破音
        this.sounds.enemyKill = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(300, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.3);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
        
        // レベルアップ音
        this.sounds.levelUp = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(500, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1000, this.audioContext.currentTime + 0.5);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.5);
        };
        
        // リロード音
        this.sounds.reload = () => {
            if (!this.audioContext) return;
            
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime + 0.1);
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
    }
    
    startBGM() {
        if (!this.audioContext || this.isBGMPlaying) return;
        
        this.isBGMPlaying = true;
        
        // ダークでテンションの高いBGMを作成
        const chord1 = [110, 146.83, 174.61, 220]; // Am chord
        const chord2 = [123.47, 164.81, 196, 246.94]; // Bm chord
        const chord3 = [98, 130.81, 155.56, 196]; // Gm chord
        const chord4 = [103.83, 138.59, 164.81, 207.65]; // G#m chord
        
        const chords = [chord1, chord2, chord3, chord4];
        const chordDuration = 4; // 4秒ごとにコード変更
        
        let currentChordIndex = 0;
        
        const playChord = () => {
            if (!this.isBGMPlaying || !this.audioContext) return;
            
            // 前のコードを停止
            this.bgmOscillators.forEach(osc => {
                try {
                    osc.stop();
                } catch (e) {}
            });
            this.bgmOscillators = [];
            
            const currentChord = chords[currentChordIndex];
            
            currentChord.forEach((freq, index) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
                oscillator.type = index < 2 ? 'sawtooth' : 'square';
                
                // LPF for atmosphere
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(800 + Math.sin(Date.now() * 0.001) * 200, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(5, this.audioContext.currentTime);
                
                // Volume control
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(0.03 / currentChord.length, this.audioContext.currentTime + 0.1);
                
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start();
                this.bgmOscillators.push(oscillator);
            });
            
            // 次のコードへ
            currentChordIndex = (currentChordIndex + 1) % chords.length;
            
            // 次のコード変更をスケジュール
            setTimeout(playChord, chordDuration * 1000);
        };
        
        // ドラムパート（リズム）
        const playDrums = () => {
            if (!this.isBGMPlaying || !this.audioContext) return;
            
            // キック（低音）
            const kick = () => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                
                oscillator.frequency.setValueAtTime(60, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.1);
                oscillator.type = 'sine';
                
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                
                oscillator.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.2);
            };
            
            // ハイハット（高音）
            const hihat = () => {
                const noise = this.audioContext.createBufferSource();
                const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() - 0.5) * 2;
                }
                
                noise.buffer = buffer;
                
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();
                
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(8000, this.audioContext.currentTime);
                
                gainNode.gain.setValueAtTime(0.02, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                
                noise.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                noise.start();
            };
            
            // ドラムパターン
            const drumPattern = () => {
                if (!this.isBGMPlaying) return;
                
                kick(); // 1拍目
                setTimeout(() => { if (this.isBGMPlaying) hihat(); }, 250); // 16分音符
                setTimeout(() => { if (this.isBGMPlaying) hihat(); }, 500); // 2拍目
                setTimeout(() => { if (this.isBGMPlaying) kick(); }, 750); // 16分音符
                setTimeout(() => { if (this.isBGMPlaying) hihat(); }, 1000); // 3拍目
                setTimeout(() => { if (this.isBGMPlaying) hihat(); }, 1250); // 16分音符
                setTimeout(() => { if (this.isBGMPlaying) hihat(); }, 1500); // 4拍目
                setTimeout(() => { if (this.isBGMPlaying) hihat(); }, 1750); // 16分音符
                
                setTimeout(drumPattern, 2000); // 2秒ごとに繰り返し
            };
            
            drumPattern();
        };
        
        // BGM開始
        playChord();
        playDrums();
    }
    
    stopBGM() {
        this.isBGMPlaying = false;
        
        this.bgmOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.bgmOscillators = [];
    }
    
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (navigator.maxTouchPoints && navigator.maxTouchPoints > 0);
    }
    
    init() {
        this.setupCanvas();
        this.setupEventListeners();
        if (this.isMobile) {
            this.setupMobileControls();
        }
        this.loadGame();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEventListeners() {
        // 音響コンテキスト開始用のクリックイベント
        document.addEventListener('click', () => {
            if (this.audioContext && this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }
        }, { once: true });
        
        // メニューボタン
        document.getElementById('start-game-btn').addEventListener('click', () => this.startGame());
        document.getElementById('instructions-btn').addEventListener('click', () => this.showInstructions());
        document.getElementById('back-to-menu-btn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('resume-btn').addEventListener('click', () => this.resumeGame());
        document.getElementById('restart-btn').addEventListener('click', () => this.startGame());
        document.getElementById('quit-btn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('play-again-btn').addEventListener('click', () => this.startGame());
        document.getElementById('main-menu-btn').addEventListener('click', () => this.showMainMenu());
        
        // キーボード操作
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            
            if (e.code === 'Escape' && this.gameState === 'playing') {
                this.pauseGame();
            }
            
            // Rキーは無限弾薬のため無効化
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // マウス操作
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState === 'playing') {
                if (e.button === 0) { // 左クリック
                    this.mouse.down = true;
                } else if (e.button === 2) { // 右クリック
                    this.useSecondaryWeapon();
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // コンテキストメニュー無効化
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
        // UI表示切替ボタン
        const uiToggleBtn = document.getElementById('ui-toggle-btn');
        if (uiToggleBtn) {
            uiToggleBtn.addEventListener('click', () => this.toggleUI());
        }
        
        // モバイルアクションボタン
        if (this.isMobile) {
            const dashBtn = document.getElementById('dash-btn');
            const weaponSwitchBtn = document.getElementById('weapon-switch-btn');
            const shootBtn = document.getElementById('mobile-shoot-btn');
            
            if (dashBtn) {
                dashBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.dash();
                });
            }
            
            if (weaponSwitchBtn) {
                weaponSwitchBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    this.switchWeapon();
                });
            }
            
            if (shootBtn) {
                let shooting = false;
                shootBtn.addEventListener('touchstart', (e) => {
                    e.preventDefault();
                    shooting = true;
                    this.virtualSticks.aim.shooting = true;
                });
                shootBtn.addEventListener('touchend', (e) => {
                    e.preventDefault();
                    shooting = false;
                    this.virtualSticks.aim.shooting = false;
                });
            }
        }
    }
    
    setupMobileControls() {
        // 移動スティック
        this.setupVirtualStick('move-stick', 'move');
        // エイムスティック（射撃も兼ねる）
        this.setupVirtualStick('aim-stick', 'aim');
    }
    
    setupVirtualStick(stickId, type) {
        const base = document.getElementById(`${stickId}-base`);
        const knob = document.getElementById(`${stickId}-knob`);
        
        if (!base || !knob) {
            console.log(`Virtual stick ${stickId} not found`);
            return;
        }
        
        let isDragging = false;
        let startX, startY;
        
        const handleStart = (clientX, clientY) => {
            isDragging = true;
            const rect = base.getBoundingClientRect();
            startX = rect.left + rect.width / 2;
            startY = rect.top + rect.height / 2;
            
            if (type === 'aim') {
                this.virtualSticks.aim.shooting = true;
            }
        };
        
        const handleMove = (clientX, clientY) => {
            if (!isDragging) return;
            
            const dx = clientX - startX;
            const dy = clientY - startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const maxDistance = 40;
            
            if (distance > maxDistance) {
                const angle = Math.atan2(dy, dx);
                knob.style.transform = `translate(${Math.cos(angle) * maxDistance}px, ${Math.sin(angle) * maxDistance}px)`;
                this.virtualSticks[type].x = Math.cos(angle);
                this.virtualSticks[type].y = Math.sin(angle);
            } else {
                knob.style.transform = `translate(${dx}px, ${dy}px)`;
                this.virtualSticks[type].x = distance > 0 ? dx / maxDistance : 0;
                this.virtualSticks[type].y = distance > 0 ? dy / maxDistance : 0;
            }
            
            this.virtualSticks[type].active = distance > 5;
        };
        
        const handleEnd = () => {
            isDragging = false;
            knob.style.transform = 'translate(0px, 0px)';
            this.virtualSticks[type].x = 0;
            this.virtualSticks[type].y = 0;
            this.virtualSticks[type].active = false;
            
            if (type === 'aim') {
                this.virtualSticks.aim.shooting = false;
            }
        };
        
        // タッチイベント
        base.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
        });
        
        base.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        });
        
        base.addEventListener('touchend', (e) => {
            e.preventDefault();
            handleEnd();
        });
        
        base.addEventListener('touchcancel', (e) => {
            e.preventDefault();
            handleEnd();
        });
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
                    this.showMainMenu();
                }, 500);
            }
        }, 100);
    }
    
    showMainMenu() {
        this.hideAllScreens();
        document.getElementById('main-menu').classList.remove('hidden');
        this.gameState = 'menu';
    }
    
    showInstructions() {
        this.hideAllScreens();
        document.getElementById('instructions-screen').classList.remove('hidden');
    }
    
    hideAllScreens() {
        const screens = ['loading-screen', 'main-menu', 'instructions-screen', 'game-screen', 'gameover-screen'];
        screens.forEach(screen => {
            document.getElementById(screen).classList.add('hidden');
        });
        
        // UI も非表示
        document.getElementById('pc-ui').classList.add('hidden');
        document.getElementById('mobile-ui').classList.add('hidden');
        
        // モーダルも非表示
        document.getElementById('levelup-modal').classList.add('hidden');
        document.getElementById('pause-modal').classList.add('hidden');
    }
    
    startGame() {
        this.hideAllScreens();
        document.getElementById('game-screen').classList.remove('hidden');
        
        // UI表示
        if (this.isMobile) {
            document.getElementById('mobile-ui').classList.remove('hidden');
        } else {
            document.getElementById('pc-ui').classList.remove('hidden');
        }
        
        // ゲーム状態リセット
        this.gameState = 'playing';
        this.isPaused = false;
        
        // BGM開始
        this.startBGM();
        
        // プレイヤーリセット
        this.player = {
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            width: 20,
            height: 20,
            speed: 200,
            dashSpeed: 400,
            isDashing: false,
            dashCooldown: 0,
            health: 100,
            maxHealth: 100,
            level: 1,
            exp: 0,
            expToNext: 100,
            angle: 0
        };
        
        // 武器リセット
        this.weapons.plasma.ammo = 999;
        this.weapons.plasma.lastShot = 0;
        this.weapons.plasma.isReloading = false;
        
        this.weapons.grenade.ammo = 3;
        this.weapons.grenade.totalAmmo = 12;
        this.weapons.grenade.lastShot = 0;
        this.weapons.grenade.isReloading = false;
        
        this.currentWeapon = 'plasma';
        
        // 統計リセット
        this.stats = {
            score: 0,
            kills: 0,
            wave: 1,
            gameTime: 0,
            startTime: Date.now()
        };
        
        // エンティティクリア
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.pickups = [];
        // bloodSplatters は削除（爆発エフェクトに変更）
        
        // その他
        this.camera = { x: 0, y: 0 };
        this.enemySpawnTimer = 0;
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        
        this.updateUI();
        this.gameLoop();
    }
    
    pauseGame() {
        this.isPaused = true;
        document.getElementById('pause-modal').classList.remove('hidden');
    }
    
    resumeGame() {
        this.isPaused = false;
        document.getElementById('pause-modal').classList.add('hidden');
    }
    
    gameLoop() {
        if (this.gameState !== 'playing') return;
        
        if (!this.isPaused) {
            this.update();
        }
        
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update() {
        const deltaTime = 1/60; // 60 FPS想定
        
        this.updatePlayer(deltaTime);
        this.updateWeapon(deltaTime);
        this.updateEnemies(deltaTime);
        this.updateBullets(deltaTime);
        this.updateParticles(deltaTime);
        this.updatePickups(deltaTime);
        this.updateCamera();
        this.updateGameLogic(deltaTime);
        this.updateUI();
        this.updateWASDDisplay();
    }
    
    updatePlayer(deltaTime) {
        let moveX = 0, moveY = 0;
        
        // 移動入力
        if (this.isMobile) {
            if (this.virtualSticks.move.active) {
                moveX = this.virtualSticks.move.x;
                moveY = this.virtualSticks.move.y;
            }
        } else {
            if (this.keys['KeyW'] || this.keys['ArrowUp']) moveY -= 1;
            if (this.keys['KeyS'] || this.keys['ArrowDown']) moveY += 1;
            if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveX -= 1;
            if (this.keys['KeyD'] || this.keys['ArrowRight']) moveX += 1;
        }
        
        // 移動正規化
        if (moveX !== 0 || moveY !== 0) {
            const length = Math.sqrt(moveX * moveX + moveY * moveY);
            moveX /= length;
            moveY /= length;
        }
        
        // ダッシュ
        let currentSpeed = this.player.speed;
        if (this.player.isDashing) {
            currentSpeed = this.player.dashSpeed;
            this.player.dashCooldown -= deltaTime * 1000;
            if (this.player.dashCooldown <= 0) {
                this.player.isDashing = false;
            }
        }
        
        if ((this.keys['ShiftLeft'] || this.keys['ShiftRight']) && !this.player.isDashing && this.player.dashCooldown <= 0) {
            this.dash();
        }
        
        // 位置更新
        this.player.x += moveX * currentSpeed * deltaTime;
        this.player.y += moveY * currentSpeed * deltaTime;
        
        // 画面境界
        this.player.x = Math.max(this.player.width/2, Math.min(this.canvas.width - this.player.width/2, this.player.x));
        this.player.y = Math.max(this.player.height/2, Math.min(this.canvas.height - this.player.height/2, this.player.y));
        
        // エイム
        if (this.isMobile) {
            if (this.virtualSticks.aim.active) {
                this.player.angle = Math.atan2(this.virtualSticks.aim.y, this.virtualSticks.aim.x);
            }
        } else {
            const dx = this.mouse.x - this.player.x;
            const dy = this.mouse.y - this.player.y;
            this.player.angle = Math.atan2(dy, dx);
        }
    }
    
    dash() {
        if (this.player.dashCooldown <= 0) {
            this.player.isDashing = true;
            this.player.dashCooldown = 1000; // 1秒クールダウン
            
            // ダッシュエフェクト
            for (let i = 0; i < 10; i++) {
                this.createParticle(
                    this.player.x + (Math.random() - 0.5) * 20,
                    this.player.y + (Math.random() - 0.5) * 20,
                    (Math.random() - 0.5) * 100,
                    (Math.random() - 0.5) * 100,
                    '#74b9ff',
                    500
                );
            }
        }
    }
    
    updateWeapon(deltaTime) {
        const weapon = this.getCurrentWeapon();
        
        // リロード処理
        if (weapon.isReloading) {
            weapon.reloadTime -= deltaTime * 1000;
            if (weapon.reloadTime <= 0) {
                const reloadAmount = Math.min(weapon.maxAmmo - weapon.ammo, weapon.totalAmmo);
                weapon.ammo += reloadAmount;
                weapon.totalAmmo -= reloadAmount;
                weapon.isReloading = false;
                weapon.reloadTime = weapon.name === 'グレネードランチャー' ? 2000 : 0;
            }
        }
        
        // プライマリ武器の射撃
        const canShoot = !weapon.isReloading && 
                        (weapon.ammo > 0 || weapon.ammo === 999) && 
                        Date.now() - weapon.lastShot > weapon.fireRate;
        
        const wantToShoot = this.isMobile ? this.virtualSticks.aim.shooting : this.mouse.down;
        
        if (canShoot && wantToShoot) {
            this.shoot();
        }
    }
    
    shoot() {
        this.shootWithWeapon(this.currentWeapon);
    }
    
    shootWithWeapon(weaponKey) {
        const weapon = this.weapons[weaponKey];
        if (weapon.ammo <= 0 && weapon.ammo !== 999) return;
        
        // 弾薬消費（無限弾薬でない場合）
        if (weapon.ammo !== 999) {
            weapon.ammo--;
        }
        weapon.lastShot = Date.now();
        
        // 射撃音再生
        if (this.sounds.shoot) {
            this.sounds.shoot();
        }
        
        // 弾丸作成
        const spread = (Math.random() - 0.5) * weapon.spread;
        const angle = this.player.angle + spread;
        
        this.bullets.push({
            x: this.player.x + Math.cos(this.player.angle) * 25,
            y: this.player.y + Math.sin(this.player.angle) * 25,
            vx: Math.cos(angle) * 800,
            vy: Math.sin(angle) * 800,
            damage: weapon.damage,
            range: weapon.range,
            distance: 0,
            weaponType: weaponKey
        });
        
        // マズルフラッシュ
        this.createParticle(
            this.player.x + Math.cos(this.player.angle) * 25,
            this.player.y + Math.sin(this.player.angle) * 25,
            Math.cos(angle) * 200,
            Math.sin(angle) * 200,
            '#ffeb3b',
            100
        );
    }
    
    shootGrenade() {
        const weapon = this.getSecondaryWeapon();
        if (weapon.ammo <= 0) return;
        
        weapon.ammo--;
        weapon.lastShot = Date.now();
        
        // グレネード発射音
        if (this.sounds.shoot) {
            this.sounds.shoot();
        }
        
        // グレネード作成
        const angle = this.player.angle;
        
        this.bullets.push({
            x: this.player.x + Math.cos(angle) * 25,
            y: this.player.y + Math.sin(angle) * 25,
            vx: Math.cos(angle) * 400,
            vy: Math.sin(angle) * 400,
            damage: weapon.damage,
            range: weapon.range,
            distance: 0,
            weaponType: 'grenade',
            explosive: true,
            explosionRadius: 80
        });
        
        // マズルフラッシュ
        this.createParticle(
            this.player.x + Math.cos(angle) * 25,
            this.player.y + Math.sin(angle) * 25,
            Math.cos(angle) * 200,
            Math.sin(angle) * 200,
            '#ff6b6b',
            200
        );
    }
    
    reload() {
        if (!this.weapon.isReloading && 
            this.weapon.ammo < this.weapon.maxAmmo && 
            this.weapon.totalAmmo > 0) {
            this.weapon.isReloading = true;
            this.weapon.reloadTime = 2000;
            
            // リロード音再生
            if (this.sounds.reload) {
                this.sounds.reload();
            }
        }
    }
    
    updateEnemies(deltaTime) {
        // 敵スポーン
        this.enemySpawnTimer += deltaTime * 1000;
        const spawnRate = Math.max(500 - this.stats.wave * 50, 100);
        
        if (this.enemySpawnTimer > spawnRate) {
            this.spawnEnemy();
            this.enemySpawnTimer = 0;
        }
        
        // 敵更新
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // プレイヤーに向かって移動
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                enemy.x += (dx / distance) * enemy.speed * deltaTime;
                enemy.y += (dy / distance) * enemy.speed * deltaTime;
            }
            
            // プレイヤーとの衝突判定
            if (distance < 30 && Date.now() - enemy.lastAttack > enemy.attackRate) {
                this.damagePlayer(enemy.damage);
                enemy.lastAttack = Date.now();
            }
            
            // 体力チェック
            if (enemy.health <= 0) {
                this.killEnemy(i);
            }
        }
    }
    
    spawnEnemy() {
        const side = Math.floor(Math.random() * 4);
        let x, y;
        
        switch (side) {
            case 0: // 上
                x = Math.random() * this.canvas.width;
                y = -50;
                break;
            case 1: // 右
                x = this.canvas.width + 50;
                y = Math.random() * this.canvas.height;
                break;
            case 2: // 下
                x = Math.random() * this.canvas.width;
                y = this.canvas.height + 50;
                break;
            case 3: // 左
                x = -50;
                y = Math.random() * this.canvas.height;
                break;
        }
        
        const enemy = {
            x: x,
            y: y,
            width: 15,
            height: 15,
            health: 50 + this.stats.wave * 10,
            maxHealth: 50 + this.stats.wave * 10,
            speed: 60 + this.stats.wave * 5,
            damage: 10 + this.stats.wave * 2,
            lastAttack: 0,
            attackRate: 1000,
            color: '#ff4757'
        };
        
        this.enemies.push(enemy);
    }
    
    killEnemy(index) {
        const enemy = this.enemies[index];
        
        // 敵撃破音再生
        if (this.sounds.enemyKill) {
            this.sounds.enemyKill();
        }
        
        // 爆発エフェクト
        for (let i = 0; i < 15; i++) {
            const angle = (Math.PI * 2 * i) / 15;
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
        for (let i = 0; i < 5; i++) {
            this.createParticle(
                enemy.x + (Math.random() - 0.5) * 20,
                enemy.y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 50,
                '#ffffff',
                300
            );
        }
        
        // アイテムドロップ（弾薬は無限のため体力のみ）
        if (Math.random() < 0.2) {
            this.pickups.push({
                x: enemy.x,
                y: enemy.y,
                type: 'health',
                life: 10000
            });
        }
        
        // 統計更新
        this.stats.kills++;
        this.stats.score += 100 * this.stats.wave;
        this.player.exp += 25;
        
        // レベルアップチェック
        if (this.player.exp >= this.player.expToNext) {
            this.levelUp();
        }
        
        this.enemies.splice(index, 1);
    }
    
    levelUp() {
        this.player.level++;
        this.player.exp -= this.player.expToNext;
        this.player.expToNext = Math.floor(this.player.expToNext * 1.2);
        
        // レベルアップ音再生
        if (this.sounds.levelUp) {
            this.sounds.levelUp();
        }
        
        // レベルアップモーダル表示（ゲームとBGMを一時停止）
        this.isPaused = true;
        this.stopBGM();
        this.showLevelUpOptions();
    }
    
    showLevelUpOptions() {
        const modal = document.getElementById('levelup-modal');
        const options = document.getElementById('upgrade-options');
        
        // アップグレードオプション生成
        const upgrades = [
            { name: '体力増加', desc: '最大体力+20、現在の体力も回復', effect: () => {
                this.player.maxHealth += 20;
                this.player.health = Math.min(this.player.health + 20, this.player.maxHealth);
            }},
            { name: '攻撃力強化', desc: '現在の武器のダメージ+5', effect: () => {
                this.getCurrentWeapon().damage += 5;
            }},
            { name: '連射速度向上', desc: '現在の武器の射撃間隔-20ms', effect: () => {
                const weapon = this.getCurrentWeapon();
                weapon.fireRate = Math.max(50, weapon.fireRate - 20);
            }},
            { name: '移動速度上昇', desc: '移動速度+15%', effect: () => {
                this.player.speed *= 1.15;
            }},
            { name: 'ダッシュクールタイム短縮', desc: 'ダッシュのクールタイム-200ms', effect: () => {
                this.player.dashCooldownMax = Math.max(300, (this.player.dashCooldownMax || 1000) - 200);
            }}
        ];
        
        // グレネードランチャーが未解除の場合、解除オプションを追加
        if (!this.weapons.grenade.unlocked) {
            upgrades.push({
                name: 'グレネードランチャー解除',
                desc: '右クリックで爆発武器が使用可能',
                effect: () => {
                    this.weapons.grenade.unlocked = true;
                }
            });
        } else {
            // 解除済みの場合はグレネード関連のアップグレード
            upgrades.push({
                name: 'グレネード弾薬増加',
                desc: 'グレネードの総弾薬数+3',
                effect: () => {
                    this.weapons.grenade.totalAmmo += 3;
                    this.weapons.grenade.ammo = Math.min(this.weapons.grenade.ammo + 1, this.weapons.grenade.maxAmmo);
                }
            });
        }
        
        // ランダムに3つ選択
        const selectedUpgrades = upgrades.sort(() => Math.random() - 0.5).slice(0, 3);
        
        options.innerHTML = '';
        selectedUpgrades.forEach(upgrade => {
            const option = document.createElement('div');
            option.className = 'upgrade-option';
            option.innerHTML = `
                <div class="upgrade-title">${upgrade.name}</div>
                <div class="upgrade-desc">${upgrade.desc}</div>
            `;
            option.addEventListener('click', () => {
                upgrade.effect();
                modal.classList.add('hidden');
                // ゲーム再開とBGM再開
                this.isPaused = false;
                this.startBGM();
            });
            options.appendChild(option);
        });
        
        modal.classList.remove('hidden');
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            bullet.distance += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * deltaTime;
            
            // 射程チェック
            if (bullet.distance > bullet.range) {
                // グレネードの場合は爆発
                if (bullet.explosive) {
                    this.explode(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                }
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 敵との衝突判定
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const enemy = this.enemies[j];
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 15) {
                    // グレネードの場合は爆発
                    if (bullet.explosive) {
                        this.explode(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                        this.bullets.splice(i, 1);
                        break;
                    } else {
                        enemy.health -= bullet.damage;
                        
                        // ヒットエフェクト
                        this.createParticle(bullet.x, bullet.y, 0, 0, '#ff6b6b', 200);
                        
                        this.bullets.splice(i, 1);
                        break;
                    }
                }
            }
        }
    }
    
    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime * 1000;
            particle.vx *= 0.98;
            particle.vy *= 0.98;
            return particle.life > 0;
        });
    }
    
    updatePickups(deltaTime) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.life -= deltaTime * 1000;
            
            // プレイヤーとの衝突判定
            const dx = pickup.x - this.player.x;
            const dy = pickup.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 25) {
                if (pickup.type === 'health') {
                    this.player.health = Math.min(this.player.health + 30, this.player.maxHealth);
                }
                
                this.pickups.splice(i, 1);
                continue;
            }
            
            if (pickup.life <= 0) {
                this.pickups.splice(i, 1);
            }
        }
    }
    
    updateCamera() {
        // カメラは固定（プレイヤー中心）
        this.camera.x = this.player.x - this.canvas.width / 2;
        this.camera.y = this.player.y - this.canvas.height / 2;
    }
    
    updateGameLogic(deltaTime) {
        // ゲーム時間更新
        this.stats.gameTime = Date.now() - this.stats.startTime;
        
        // ウェーブ進行
        this.waveTimer += deltaTime * 1000;
        if (this.waveTimer > 30000) { // 30秒ごとにウェーブ増加
            this.stats.wave++;
            this.waveTimer = 0;
            this.difficultyMultiplier += 0.2;
        }
        
        // ゲームオーバーチェック
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    damagePlayer(damage) {
        this.player.health -= damage;
        this.player.health = Math.max(0, this.player.health);
        
        // ダメージエフェクト
        for (let i = 0; i < 5; i++) {
            this.createParticle(
                this.player.x + (Math.random() - 0.5) * 20,
                this.player.y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                '#ff4757',
                300
            );
        }
    }
    
    createParticle(x, y, vx, vy, color, life) {
        this.particles.push({
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            color: color,
            life: life,
            maxLife: life
        });
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
                enemy.health -= damage * damageRatio;
            }
        });
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        // BGM停止
        this.stopBGM();
        
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
        document.getElementById('final-time').textContent = this.formatTime(this.stats.gameTime);
        document.getElementById('final-level').textContent = this.player.level;
        document.getElementById('final-kills').textContent = this.stats.kills;
        
        this.hideAllScreens();
        document.getElementById('gameover-screen').classList.remove('hidden');
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    // UI表示切替
    toggleUI() {
        this.uiVisible = !this.uiVisible;
        const elements = ['pc-ui', 'mobile-ui'];
        
        elements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (this.uiVisible) {
                    element.style.opacity = '1';
                } else {
                    element.style.opacity = '0.2';
                }
            }
        });
    }
    
    // WASD表示更新
    updateWASDDisplay() {
        if (!this.uiVisible || this.isMobile) return;
        
        const keys = ['w', 'a', 's', 'd'];
        const keyCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
        
        keys.forEach((key, index) => {
            const element = document.getElementById(`wasd-${key}`);
            if (element) {
                if (this.keys[keyCodes[index]]) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            }
        });
    }
    
    updateUI() {
        // 体力バー
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        const healthFill = document.getElementById('health-fill');
        const healthValue = document.getElementById('health-value');
        
        if (healthFill) healthFill.style.width = healthPercent + '%';
        if (healthValue) healthValue.textContent = Math.ceil(this.player.health);
        
        if (this.isMobile) {
            const mobileHealthFill = document.getElementById('mobile-health-fill');
            if (mobileHealthFill) mobileHealthFill.style.width = healthPercent + '%';
        }
        
        // 経験値バー
        const expPercent = (this.player.exp / this.player.expToNext) * 100;
        const expFill = document.getElementById('exp-fill');
        const levelValue = document.getElementById('level-value');
        
        if (expFill) expFill.style.width = expPercent + '%';
        if (levelValue) levelValue.textContent = this.player.level;
        
        if (this.isMobile) {
            const mobileExpFill = document.getElementById('mobile-exp-fill');
            const mobileLevel = document.getElementById('mobile-level');
            if (mobileExpFill) mobileExpFill.style.width = expPercent + '%';
            if (mobileLevel) mobileLevel.textContent = this.player.level;
        }
        
        // 弾薬表示（現在の武器）
        const weapon = this.getCurrentWeapon();
        const currentAmmo = document.getElementById('current-ammo');
        const totalAmmo = document.getElementById('total-ammo');
        const weaponName = document.getElementById('weapon-name');
        
        if (currentAmmo) currentAmmo.textContent = weapon.ammo === 999 ? '∞' : weapon.ammo;
        if (totalAmmo) totalAmmo.textContent = weapon.totalAmmo === 999 ? '∞' : weapon.totalAmmo;
        if (weaponName) weaponName.textContent = weapon.name;
        
        if (this.isMobile) {
            const mobileCurrentAmmo = document.getElementById('mobile-current-ammo');
            const mobileTotalAmmo = document.getElementById('mobile-total-ammo');
            if (mobileCurrentAmmo) mobileCurrentAmmo.textContent = weapon.ammo === 999 ? '∞' : weapon.ammo;
            if (mobileTotalAmmo) mobileTotalAmmo.textContent = weapon.totalAmmo === 999 ? '∞' : weapon.totalAmmo;
        }
        
        // その他統計
        const scoreValue = document.getElementById('score-value');
        const waveValue = document.getElementById('wave-value');
        const timeValue = document.getElementById('time-value');
        
        if (scoreValue) scoreValue.textContent = this.stats.score.toLocaleString();
        if (waveValue) waveValue.textContent = this.stats.wave;
        if (timeValue) timeValue.textContent = this.formatTime(this.stats.gameTime);
        
        if (this.isMobile) {
            const mobileScore = document.getElementById('mobile-score');
            if (mobileScore) mobileScore.textContent = this.stats.score.toLocaleString();
        }
    }
    
    render() {
        // 画面クリア
        this.ctx.fillStyle = '#1a1a1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 血痕描画は削除（爆発エフェクトに変更）
        
        // パーティクル描画
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
        
        // 弾丸描画
        this.ctx.fillStyle = '#ffeb3b';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x - 2, bullet.y - 2, 4, 4);
        });
        
        // 敵描画
        this.enemies.forEach(enemy => {
            this.ctx.fillStyle = enemy.color;
            this.ctx.fillRect(
                enemy.x - enemy.width/2,
                enemy.y - enemy.height/2,
                enemy.width,
                enemy.height
            );
            
            // 体力バー
            const healthPercent = enemy.health / enemy.maxHealth;
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30, 4);
            this.ctx.fillStyle = healthPercent > 0.5 ? '#2ed573' : healthPercent > 0.25 ? '#ffa502' : '#ff4757';
            this.ctx.fillRect(enemy.x - 15, enemy.y - 25, 30 * healthPercent, 4);
        });
        
        // アイテム描画（体力アイテムのみ）
        this.pickups.forEach(pickup => {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.ctx.globalAlpha = pulse;
            this.ctx.fillStyle = '#2ed573';
            this.ctx.fillRect(pickup.x - 8, pickup.y - 8, 16, 16);
            
            // アイコン
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('+', pickup.x, pickup.y + 4);
        });
        this.ctx.globalAlpha = 1;
        
        // プレイヤー描画
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // プレイヤー本体
        this.ctx.fillStyle = this.player.isDashing ? '#74b9ff' : '#54a0ff';
        this.ctx.fillRect(-this.player.width/2, -this.player.height/2, this.player.width, this.player.height);
        
        // 武器
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(this.player.width/2, -2, 15, 4);
        
        this.ctx.restore();
        
        // リロード表示は無限弾薬のため不要
    }
}

// ゲーム開始
window.addEventListener('load', () => {
    new ZombieSurvival();
});