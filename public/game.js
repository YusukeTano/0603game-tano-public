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
        
        // プレイヤー（基準解像度の中央に配置）
        this.player = {
            x: 640, // 1280 / 2
            y: 360, // 720 / 2
            width: 20,
            height: 20,
            speed: 200,
            health: 100,
            maxHealth: 100,
            level: 1,
            exp: 0,
            expToNext: 100,
            angle: 0,
            // バリア効果
            barrierActive: false,
            barrierTimeLeft: 0
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
                unlocked: true,
                rarity: 'common'
            },
            // 一時的左クリック武器: ニュークランチャー（5発制限）
            nuke: {
                name: 'ニュークランチャー',
                damage: 700,
                fireRate: 800, // 発射間隔
                lastShot: 0,
                ammo: 0, // 取得時に5発設定
                maxAmmo: 5,
                totalAmmo: 999,
                reloadTime: 0,
                isReloading: false,
                spread: 0,
                range: 700,
                unlocked: false,
                limitedAmmo: true, // 制限弾薬武器
                nuke: true,
                rarity: 'legendary'
            }
        };
        
        this.currentWeapon = 'plasma';
        this.previousWeapon = 'plasma'; // 弾薬切れ時の戻り先武器
        
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
            maxCombo: 0,
            lastKillTime: 0,
            comboTimeout: 3000 // 3秒間ダメージを受けなければコンボ継続
        };
        
        // エンティティ
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.pickups = [];
        // bloodSplatters は削除（爆発エフェクトに変更）
        
        // 背景要素
        this.backgroundElements = [];
        this.backgroundParticles = [];
        this.initBackground();
        
        // 入力
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        this.isMobile = this.detectMobile();
        
        // UI表示状態
        
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
    
    
    // 武器をアップグレードで取得した際の処理
    unlockWeapon(weaponKey) {
        if (this.weapons[weaponKey] && !this.weapons[weaponKey].unlocked) {
            this.weapons[weaponKey].unlocked = true;
            
            // 制限弾薬武器の場合、自動で切り替える
            if (this.weapons[weaponKey].limitedAmmo) {
                this.previousWeapon = this.currentWeapon;
                this.currentWeapon = weaponKey;
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
    
    
    
    // 背景要素の初期化
    initBackground() {
        this.backgroundElements = [];
        
        
        // 廃墟の建物
        for (let i = 0; i < 6; i++) {
            this.backgroundElements.push({
                type: 'building',
                x: Math.random() * 1500 - 750,
                y: Math.random() * 1500 - 750,
                width: 120 + Math.random() * 180,
                height: 200 + Math.random() * 250,
                color: `rgba(80, 85, 90, 0.7)`,
                broken: Math.random() > 0.5
            });
        }
        
        // アスファルトのひび割れ
        for (let i = 0; i < 12; i++) {
            this.backgroundElements.push({
                type: 'crack',
                x: Math.random() * 1200 - 600,
                y: Math.random() * 1200 - 600,
                length: 40 + Math.random() * 120,
                width: 3 + Math.random() * 5,
                angle: Math.random() * Math.PI * 2,
                color: 'rgba(20, 20, 20, 0.6)'
            });
        }
        
        // 草と植物（廃墟感）
        for (let i = 0; i < 15; i++) {
            this.backgroundElements.push({
                type: 'vegetation',
                x: Math.random() * 1000 - 500,
                y: Math.random() * 1000 - 500,
                size: 15 + Math.random() * 30,
                color: `rgba(${60 + Math.random() * 40}, ${80 + Math.random() * 60}, ${40 + Math.random() * 30}, 0.6)`,
                type2: Math.random() > 0.5 ? 'bush' : 'grass'
            });
        }
        
        // 背景パーティクル（埃、花粉など）
        for (let i = 0; i < 40; i++) {
            this.backgroundParticles.push({
                x: Math.random() * 2000 - 1000,
                y: Math.random() * 2000 - 1000,
                vx: (Math.random() - 0.5) * 15,
                vy: (Math.random() - 0.5) * 15,
                size: 1 + Math.random() * 2,
                alpha: 0.2 + Math.random() * 0.4,
                color: `rgba(${180 + Math.random() * 40}, ${170 + Math.random() * 30}, ${160 + Math.random() * 30}, ${0.2 + Math.random() * 0.3})`,
                life: 2000 + Math.random() * 4000,
                maxLife: 2000 + Math.random() * 4000
            });
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
    
    // コンボモジュレーション計算
    getComboModulation() {
        const comboMultiplier = Math.min(this.combo.count / 10, 2); // 最大2倍まで
        return {
            pitchMultiplier: 1 + comboMultiplier * 0.5,
            volumeMultiplier: 1 + comboMultiplier * 0.3,
            distortion: comboMultiplier * 0.2
        };
    }
    
    createSounds() {
        // 射撃音
        this.sounds.shoot = () => {
            if (!this.audioContext) return;
            
            const mod = this.getComboModulation();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(800 * mod.pitchMultiplier, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(200 * mod.pitchMultiplier, this.audioContext.currentTime + 0.1);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.1 * mod.volumeMultiplier, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.1);
        };
        
        // 敵撃破音
        this.sounds.enemyKill = () => {
            if (!this.audioContext) return;
            
            const mod = this.getComboModulation();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(300 * mod.pitchMultiplier, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(50 * mod.pitchMultiplier, this.audioContext.currentTime + 0.3);
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.15 * mod.volumeMultiplier, this.audioContext.currentTime);
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
        
        // アイテム取得音
        this.sounds.pickupHealth = () => {
            if (!this.audioContext) return;
            
            const mod = this.getComboModulation();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(523.25 * mod.pitchMultiplier, this.audioContext.currentTime); // C5
            oscillator.frequency.setValueAtTime(659.25 * mod.pitchMultiplier, this.audioContext.currentTime + 0.1); // E5
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.15 * mod.volumeMultiplier, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
        
        this.sounds.pickupDash = () => {
            if (!this.audioContext) return;
            
            const mod = this.getComboModulation();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(880 * mod.pitchMultiplier, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(1760 * mod.pitchMultiplier, this.audioContext.currentTime + 0.2);
            oscillator.type = 'sawtooth';
            
            gainNode.gain.setValueAtTime(0.12 * mod.volumeMultiplier, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);
        };
        
        this.sounds.pickupSpeed = () => {
            if (!this.audioContext) return;
            
            const mod = this.getComboModulation();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(1046.5 * mod.pitchMultiplier, this.audioContext.currentTime); // C6
            oscillator.frequency.setValueAtTime(1318.51 * mod.pitchMultiplier, this.audioContext.currentTime + 0.05); // E6
            oscillator.frequency.setValueAtTime(1567.98 * mod.pitchMultiplier, this.audioContext.currentTime + 0.1); // G6
            oscillator.type = 'triangle';
            
            gainNode.gain.setValueAtTime(0.1 * mod.volumeMultiplier, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.25);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.25);
        };
        
        this.sounds.pickupAmmo = () => {
            if (!this.audioContext) return;
            
            const mod = this.getComboModulation();
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.frequency.setValueAtTime(261.63 * mod.pitchMultiplier, this.audioContext.currentTime); // C4
            oscillator.frequency.setValueAtTime(329.63 * mod.pitchMultiplier, this.audioContext.currentTime + 0.1); // E4
            oscillator.frequency.setValueAtTime(392 * mod.pitchMultiplier, this.audioContext.currentTime + 0.2); // G4
            oscillator.type = 'square';
            
            gainNode.gain.setValueAtTime(0.1 * mod.volumeMultiplier, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    startBGM() {
        if (!this.audioContext || this.isBGMPlaying) return;
        
        this.isBGMPlaying = true;
        
        // フェーズ（ウェーブ）に基づくBGM変更
        const phase = Math.min(Math.floor(this.stats.wave / 3), 4); // 3ウェーブごとにフェーズ変更、最大5フェーズ
        
        // フェーズ別コード進行とテンポ設定
        let chords, chordDuration, intensity;
        
        switch(phase) {
            case 0: // ウェーブ1-3: 序盤 - 落ち着いた雰囲気
                chords = [
                    [110, 146.83, 174.61, 220], // Am
                    [123.47, 164.81, 196, 246.94], // Bm
                    [98, 130.81, 155.56, 196], // Gm
                    [103.83, 138.59, 164.81, 207.65] // G#m
                ];
                chordDuration = 4.5; // ゆっくり
                intensity = 0.02;
                break;
                
            case 1: // ウェーブ4-6: 緊張感上昇
                chords = [
                    [110, 146.83, 174.61, 220], // Am
                    [116.54, 155.56, 185, 233.08], // Bb
                    [130.81, 174.61, 207.65, 261.63], // C
                    [98, 130.81, 155.56, 196] // Gm
                ];
                chordDuration = 3.5; // 少し高速化
                intensity = 0.025;
                break;
                
            case 2: // ウェーブ7-9: 中盤 - 戦闘激化
                chords = [
                    [87.31, 116.54, 138.59, 174.61], // F
                    [98, 130.81, 155.56, 196], // Gm
                    [110, 146.83, 174.61, 220], // Am
                    [123.47, 164.81, 196, 246.94] // Bm
                ];
                chordDuration = 3; // さらに高速化
                intensity = 0.03;
                break;
                
            case 3: // ウェーブ10-12: 終盤 - 絶望的
                chords = [
                    [69.3, 92.5, 110, 138.59], // C#m (低音)
                    [77.78, 103.83, 123.47, 155.56], // D#m
                    [87.31, 116.54, 138.59, 174.61], // Fm
                    [92.5, 123.47, 146.83, 185] // G#m
                ];
                chordDuration = 2.5; // 激しく
                intensity = 0.035;
                break;
                
            default: // ウェーブ13+: 最終局面 - カオス
                chords = [
                    [51.91, 69.3, 82.41, 103.83], // G#m (超低音)
                    [58.27, 77.78, 92.5, 116.54], // Bbm
                    [65.41, 87.31, 103.83, 130.81], // Cm
                    [73.42, 97.99, 116.54, 146.83] // Dm
                ];
                chordDuration = 2; // 最高速
                intensity = 0.04;
                break;
        }
        
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
                
                // Volume control (フェーズに基づく音量調整)
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime(intensity / currentChord.length, this.audioContext.currentTime + 0.1);
                
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
        // 基準解像度設定（PCでの標準的なゲーム画面サイズ）
        this.baseWidth = 1280;
        this.baseHeight = 720;
        
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
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
        
        // ポーズボタン
        document.getElementById('pause-btn').addEventListener('click', () => this.pauseGame());
        document.getElementById('mobile-pause-btn').addEventListener('click', () => this.pauseGame());
        
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
            // 表示座標からゲーム内座標（基準解像度）に変換
            const displayX = e.clientX - rect.left;
            const displayY = e.clientY - rect.top;
            
            // スケーリング係数を適用してゲーム内座標に変換
            this.mouse.x = displayX / this.gameScale;
            this.mouse.y = displayY / this.gameScale;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.gameState === 'playing') {
                if (e.button === 0) { // 左クリック
                    this.mouse.down = true;
                }
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
        
        // コンテキストメニュー無効化
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
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
        
        // ドキュメント全体のタッチスクロール防止（ゲーム中のみ）
        document.addEventListener('touchmove', (e) => {
            if (this.gameState === 'playing') {
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
        // 画面左右半分タッチ操作システム
        this.setupScreenControls();
    }
    
    setupScreenControls() {
        const canvas = this.canvas;
        if (!canvas) {
            console.log('Canvas not found for screen controls');
            return;
        }
        
        let leftTouch = null;
        let rightTouch = null;
        
        const getGameCoordinates = (clientX, clientY) => {
            const rect = canvas.getBoundingClientRect();
            const gameX = (clientX - rect.left) / this.gameScale;
            const gameY = (clientY - rect.top) / this.gameScale;
            return { x: gameX, y: gameY };
        };
        
        const handlePointerDown = (e) => {
            e.preventDefault();
            
            const { x: gameX, y: gameY } = getGameCoordinates(e.clientX, e.clientY);
            const screenCenterX = this.baseWidth / 2;
            
            if (gameX < screenCenterX && !leftTouch) {
                // 左半分：移動制御
                leftTouch = {
                    id: e.pointerId,
                    startX: gameX,
                    startY: gameY
                };
                canvas.setPointerCapture(e.pointerId);
                
            } else if (gameX >= screenCenterX && !rightTouch) {
                // 右半分：エイム+射撃制御
                rightTouch = {
                    id: e.pointerId,
                    startX: gameX,
                    startY: gameY
                };
                this.virtualSticks.aim.shooting = true;
                canvas.setPointerCapture(e.pointerId);
            }
        };
        
        const handlePointerMove = (e) => {
            e.preventDefault();
            
            const { x: gameX, y: gameY } = getGameCoordinates(e.clientX, e.clientY);
            
            if (leftTouch && e.pointerId === leftTouch.id) {
                // 移動ベクトル計算
                const dx = gameX - leftTouch.startX;
                const dy = gameY - leftTouch.startY;
                const distance = Math.sqrt(dx * dx + dy * dy);
                const maxDistance = 120; // 移動感度調整
                
                if (distance > 8) {
                    this.virtualSticks.move.x = Math.max(-1, Math.min(1, dx / maxDistance));
                    this.virtualSticks.move.y = Math.max(-1, Math.min(1, dy / maxDistance));
                    this.virtualSticks.move.active = true;
                } else {
                    this.virtualSticks.move.x = 0;
                    this.virtualSticks.move.y = 0;
                    this.virtualSticks.move.active = false;
                }
            }
            
            if (rightTouch && e.pointerId === rightTouch.id) {
                // エイム方向計算（プレイヤー位置からタッチ位置へ）
                const dx = gameX - this.player.x;
                const dy = gameY - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > 10) {
                    this.player.angle = Math.atan2(dy, dx);
                    this.virtualSticks.aim.active = true;
                    this.virtualSticks.aim.x = dx / distance;
                    this.virtualSticks.aim.y = dy / distance;
                }
            }
        };
        
        const handlePointerEnd = (e) => {
            e.preventDefault();
            
            if (leftTouch && e.pointerId === leftTouch.id) {
                leftTouch = null;
                this.virtualSticks.move.x = 0;
                this.virtualSticks.move.y = 0;
                this.virtualSticks.move.active = false;
            }
            
            if (rightTouch && e.pointerId === rightTouch.id) {
                rightTouch = null;
                this.virtualSticks.aim.shooting = false;
                this.virtualSticks.aim.active = false;
                this.virtualSticks.aim.x = 0;
                this.virtualSticks.aim.y = 0;
            }
        };
        
        // Pointer Events（推奨）
        canvas.addEventListener('pointerdown', handlePointerDown);
        canvas.addEventListener('pointermove', handlePointerMove);
        canvas.addEventListener('pointerup', handlePointerEnd);
        canvas.addEventListener('pointercancel', handlePointerEnd);
        
        // フォールバック：タッチイベント
        canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            for (let touch of e.changedTouches) {
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
            x: 640,
            y: 360,
            width: 20,
            height: 20,
            speed: 200,
            health: 100,
            maxHealth: 100,
            level: 1,
            exp: 0,
            expToNext: 100,
            angle: 0,
        };
        
        // 武器リセット（左クリック武器は無限弾薬）
        this.weapons.plasma.ammo = 999;
        this.weapons.plasma.lastShot = 0;
        this.weapons.plasma.isReloading = false;
        
        
        
        
        
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
            maxCombo: 0,
            lastKillTime: 0,
            comboTimeout: 3000
        };
        
        // エンティティクリア
        this.enemies = [];
        this.bullets = [];
        this.particles = [];
        this.pickups = [];
        // bloodSplatters は削除（爆発エフェクトに変更）
        
        // 背景を再初期化
        this.initBackground();
        
        // その他
        this.camera = { x: 0, y: 0 };
        this.enemySpawnTimer = 0;
        this.waveTimer = 0;
        this.difficultyMultiplier = 1;
        this.bossActive = false;
        
        // ダメージ効果
        this.damageEffects = {
            screenFlash: 0,
            screenShake: { x: 0, y: 0, intensity: 0, duration: 0 }
        };
        
        this.updateUI();
        this.gameLoop();
    }
    
    pauseGame() {
        this.isPaused = true;
        this.stopBGM();
        document.getElementById('pause-modal').classList.remove('hidden');
    }
    
    resumeGame() {
        this.isPaused = false;
        this.startBGM();
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
        this.updateBackgroundParticles(deltaTime);
        this.updateDamageEffects(deltaTime);
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
        
        // ダッシュ効果の更新
        let currentSpeed = this.player.speed;
        if (this.player.dashActive) {
            currentSpeed = this.player.dashSpeed;
            this.player.dashTimeLeft -= deltaTime * 1000;
            if (this.player.dashTimeLeft <= 0) {
                this.player.dashActive = false;
            }
        }
        
        // 位置更新
        this.player.x += moveX * currentSpeed * deltaTime;
        this.player.y += moveY * currentSpeed * deltaTime;
        
        // 画面境界
        this.player.x = Math.max(this.player.width/2, Math.min(this.baseWidth - this.player.width/2, this.player.x));
        this.player.y = Math.max(this.player.height/2, Math.min(this.baseHeight - this.player.height/2, this.player.y));
        
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
    
    // ダッシュアイテムを使用
    
    updateWeapon(deltaTime) {
        const weapon = this.getCurrentWeapon();
        
        // 左クリック武器は無限弾薬のためリロード処理なし
        // プライマリ武器の射撃
        const canShoot = Date.now() - weapon.lastShot > weapon.fireRate;
        
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
        
        // 制限弾薬武器の弾薬チェック
        if (weapon.limitedAmmo && weapon.ammo <= 0) {
            // 左クリック制限弾薬武器が弾切れの場合、前の武器に戻る
            if (weaponKey === this.currentWeapon) {
                this.currentWeapon = this.previousWeapon;
                // ニューク武器をリセット
                if (weaponKey === 'nuke') {
                    this.weapons.nuke.unlocked = false;
                    this.weapons.nuke.ammo = 0;
                }
            }
            return;
        }
        
        // 弾薬消費
        if (weapon.limitedAmmo) {
            weapon.ammo--;
        }
        weapon.lastShot = Date.now();
        
        // 射撃音再生
        if (this.sounds.shoot) {
            this.sounds.shoot();
        }
        
        // ニューク武器の特別処理
        if (weapon.nuke) {
            const angle = this.player.angle;
            const nukeBullet = {
                x: this.player.x + Math.cos(angle) * 25,
                y: this.player.y + Math.sin(angle) * 25,
                vx: Math.cos(angle) * 600,
                vy: Math.sin(angle) * 600,
                damage: weapon.damage,
                range: weapon.range,
                distance: 0,
                weaponType: 'nuke',
                explosive: true,
                explosionRadius: 300,
                nuke: true,
                size: 8
            };
            
            this.bullets.push(nukeBullet);
            
            // ニューク発射エフェクト
            this.createParticle(
                this.player.x + Math.cos(angle) * 25,
                this.player.y + Math.sin(angle) * 25,
                Math.cos(angle) * 300,
                Math.sin(angle) * 300,
                '#ff0000',
                200
            );
            return; // ニューク武器は特別処理で終了
        }
        
        // 武器タイプ別の弾丸作成
        const spread = (Math.random() - 0.5) * weapon.spread;
        const angle = this.player.angle + spread;
        const bulletSpeed = weapon.laser ? 1200 : 800;
        
        const baseBulletSize = 4;
        const bulletSizeMultiplier = this.player.bulletSizeMultiplier || 1;
        const bulletSize = baseBulletSize * bulletSizeMultiplier;
        
        const bullet = {
            x: this.player.x + Math.cos(this.player.angle) * 25,
            y: this.player.y + Math.sin(this.player.angle) * 25,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            damage: weapon.damage,
            range: weapon.range,
            distance: 0,
            weaponType: weaponKey,
            size: bulletSize
        };
        
        // プレイヤーのスキル効果を弾丸に適用
        if (this.player.piercing) {
            bullet.piercing = this.player.piercing;
            bullet.piercingLeft = this.player.piercing;
        }
        
        if (this.player.bounces) {
            bullet.bounces = this.player.bounces;
            bullet.bouncesLeft = this.player.bounces;
        }
        
        if (this.player.homing) {
            bullet.homing = true;
            bullet.homingStrength = this.player.homingStrength || 0.1;
        }
        
        // マルチショットの処理
        const shotCount = this.player.multiShot || 1;
        const baseAngle = this.player.angle;
        
        for (let i = 0; i < shotCount; i++) {
            const spreadAngle = shotCount > 1 ? (i - (shotCount - 1) / 2) * 0.2 : 0;
            const finalAngle = baseAngle + spread + spreadAngle;
            
            const multiBullet = {
                ...bullet,
                vx: Math.cos(finalAngle) * bulletSpeed,
                vy: Math.sin(finalAngle) * bulletSpeed
            };
            
            this.bullets.push(multiBullet);
        }
        
        // マズルフラッシュ
        let flashColor = '#ffeb3b';
        if (weaponKey === 'sniper') flashColor = '#ff4757';
        
        this.createParticle(
            this.player.x + Math.cos(this.player.angle) * 25,
            this.player.y + Math.sin(this.player.angle) * 25,
            Math.cos(this.player.angle) * 200,
            Math.sin(this.player.angle) * 200,
            flashColor,
            weapon.pellets ? 150 : 100
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
        
        // ボススポーン（30秒ごとの新ウェーブ開始時）
        if (this.waveTimer > 29000 && !this.bossActive) {
            this.spawnBoss();
            this.bossActive = true;
        }
        
        // 敵更新
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            // 敵タイプ別の行動パターン
            this.updateEnemyBehavior(enemy, deltaTime);
            
            // プレイヤーとの衝突判定
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
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
                x = Math.random() * this.baseWidth;
                y = -50;
                break;
            case 1: // 右
                x = this.baseWidth + 50;
                y = Math.random() * this.baseHeight;
                break;
            case 2: // 下
                x = Math.random() * this.baseWidth;
                y = this.baseHeight + 50;
                break;
            case 3: // 左
                x = -50;
                y = Math.random() * this.baseHeight;
                break;
        }
        
        // 敵タイプを決定（確率に基づく）
        const enemyType = this.getRandomEnemyType();
        const enemy = this.createEnemyByType(enemyType, x, y);
        
        this.enemies.push(enemy);
    }
    
    getRandomEnemyType() {
        const rand = Math.random();
        const waveMultiplier = Math.min(this.stats.wave, 10);
        
        if (rand < 0.6) {
            return 'normal';
        } else if (rand < 0.8 && waveMultiplier >= 2) {
            return 'fast';
        } else if (rand < 0.95 && waveMultiplier >= 3) {
            return 'tank';
        } else if (waveMultiplier >= 5) {
            return 'shooter';
        } else {
            return 'normal';
        }
    }
    
    createEnemyByType(type, x, y) {
        const baseHealth = 50 + this.stats.wave * 10;
        const baseSpeed = 60 + this.stats.wave * 5;
        const baseDamage = 10 + this.stats.wave * 2;
        
        switch (type) {
            case 'fast':
                return {
                    x, y, type: 'fast',
                    width: 12, height: 12,
                    health: baseHealth * 0.6,
                    maxHealth: baseHealth * 0.6,
                    speed: baseSpeed * 1.8,
                    damage: baseDamage * 0.7,
                    lastAttack: 0,
                    attackRate: 800,
                    color: '#ff9ff3'
                };
                
            case 'tank':
                return {
                    x, y, type: 'tank',
                    width: 25, height: 25,
                    health: baseHealth * 2.5,
                    maxHealth: baseHealth * 2.5,
                    speed: baseSpeed * 0.4,
                    damage: baseDamage * 1.8,
                    lastAttack: 0,
                    attackRate: 1500,
                    color: '#2f3542'
                };
                
            case 'shooter':
                return {
                    x, y, type: 'shooter',
                    width: 18, height: 18,
                    health: baseHealth * 1.2,
                    maxHealth: baseHealth * 1.2,
                    speed: baseSpeed * 0.7,
                    damage: baseDamage * 0.8,
                    lastAttack: 0,
                    attackRate: 1200,
                    shootRate: 2000,
                    lastShot: 0,
                    color: '#3742fa'
                };
                
            default: // normal
                return {
                    x, y, type: 'normal',
                    width: 15, height: 15,
                    health: baseHealth,
                    maxHealth: baseHealth,
                    speed: baseSpeed,
                    damage: baseDamage,
                    lastAttack: 0,
                    attackRate: 1000,
                    color: '#ff4757'
                };
        }
    }
    
    spawnBoss() {
        // ボスを画面中央上部からスポーン
        const x = this.baseWidth / 2;
        const y = -100;
        
        const boss = {
            x, y, type: 'boss',
            width: 60, height: 60,
            health: 500 + this.stats.wave * 200,
            maxHealth: 500 + this.stats.wave * 200,
            speed: 30,
            damage: 30 + this.stats.wave * 5,
            lastAttack: 0,
            attackRate: 800,
            shootRate: 1500,
            lastShot: 0,
            phase: 1,
            color: '#ff3838',
            specialAttackTimer: 0,
            specialAttackRate: 5000
        };
        
        this.enemies.push(boss);
    }
    
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
    
    enemyShoot(enemy) {
        const dx = this.player.x - enemy.x;
        const dy = this.player.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            this.bullets.push({
                x: enemy.x,
                y: enemy.y,
                vx: (dx / distance) * 200,
                vy: (dy / distance) * 200,
                damage: enemy.damage * 0.8,
                range: 300,
                distance: 0,
                enemyBullet: true,
                color: '#3742fa'
            });
        }
    }
    
    bossShoot(boss) {
        // 3方向射撃
        for (let i = -1; i <= 1; i++) {
            const dx = this.player.x - boss.x;
            const dy = this.player.y - boss.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                const angle = Math.atan2(dy, dx) + (i * 0.3);
                this.bullets.push({
                    x: boss.x,
                    y: boss.y,
                    vx: Math.cos(angle) * 250,
                    vy: Math.sin(angle) * 250,
                    damage: boss.damage,
                    range: 400,
                    distance: 0,
                    enemyBullet: true,
                    color: '#ff3838'
                });
            }
        }
    }
    
    bossSpecialAttack(boss) {
        // 8方向弾幕攻撃
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.bullets.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle) * 300,
                vy: Math.sin(angle) * 300,
                damage: boss.damage * 1.2,
                range: 500,
                distance: 0,
                enemyBullet: true,
                color: '#ff6b6b'
            });
        }
    }
    
    killEnemy(index) {
        const enemy = this.enemies[index];
        
        // 敵撃破音再生
        if (this.sounds.enemyKill) {
            this.sounds.enemyKill();
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
        
        // アイテムドロップ（敵タイプによって変化）
        let dropCount = 1;
        let dropRate = 0.8;
        
        if (enemy.type === 'boss') {
            dropCount = 5; // ボスは5個
            dropRate = 1.0; // 確定ドロップ
            this.bossActive = false; // ボス撃破でフラグリセット
        } else if (enemy.type === 'tank') {
            dropCount = 2; // タンクは2個
            dropRate = 0.9;
        }
        
        for (let d = 0; d < dropCount; d++) {
            if (Math.random() < dropRate) {
                const itemType = Math.random();
                let type;
                if (itemType < 0.01) {
                    type = 'nuke'; // 1%確率でニュークランチャー
                } else if (itemType < 0.51) {
                    type = 'health'; // 50%確率で体力増加
                } else {
                    type = 'speed'; // 49%確率で移動速度増加
                }
                
                this.pickups.push({
                    x: enemy.x + (Math.random() - 0.5) * 40,
                    y: enemy.y + (Math.random() - 0.5) * 40,
                    type: type,
                    value: type === 'ammo' ? 3 : undefined, // 弾薬アイテムは3発分
                    life: 15000
                });
            }
        }
        
        // コンボ更新
        this.combo.count++;
        this.combo.lastKillTime = Date.now();
        
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
        
        // 経験値を直接付与
        let expGain = 15; // 基本経験値
        if (enemy.type === 'boss') expGain = 100;
        else if (enemy.type === 'tank') expGain = 40;
        else if (enemy.type === 'shooter') expGain = 25;
        else if (enemy.type === 'fast') expGain = 20;
        
        this.player.exp += expGain;
        
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
            { name: '攻撃力強化', desc: '現在の武器のダメージ+5', rarity: 'common', effect: () => {
                this.getCurrentWeapon().damage += 5;
            }},
            { name: '連射速度向上', desc: '現在の武器の射撃間隔-10ms', rarity: 'common', effect: () => {
                const weapon = this.getCurrentWeapon();
                weapon.fireRate = Math.max(50, weapon.fireRate - 10);
            }},
            { name: '射程範囲増加', desc: '武器の射程距離+30%', rarity: 'common', effect: () => {
                Object.keys(this.weapons).forEach(key => {
                    this.weapons[key].range *= 1.3;
                });
            }},
            { name: '弾の大きさ増加', desc: '弾のサイズと当たり判定+50%', rarity: 'uncommon', effect: () => {
                if (!this.player.bulletSizeMultiplier) this.player.bulletSizeMultiplier = 1;
                this.player.bulletSizeMultiplier *= 1.5;
            }},
            { name: '貫通性能', desc: '弾丸が敵を1体追加で貫通する', rarity: 'rare', effect: () => {
                if (!this.player.piercing) this.player.piercing = 0;
                this.player.piercing += 1; // 1体ずつ貫通数増加
            }},
            { name: 'マルチショット', desc: '1回の射撃で0.5発追加', rarity: 'epic', effect: () => {
                if (!this.player.multiShot) this.player.multiShot = 1;
                this.player.multiShot += 0.5; // 0.5発ずつ増加
            }},
            { name: '反射性能', desc: '弾丸が壁で1回追加で跳ね返る', rarity: 'epic', effect: () => {
                if (!this.player.bounces) this.player.bounces = 0;
                this.player.bounces += 1; // 1回ずつ跳ね返り回数増加
            }},
            { name: 'ホーミング性能', desc: '弾丸が敵を自動追尾する', rarity: 'legendary', effect: () => {
                this.player.homing = true;
                this.player.homingStrength = 0.1;
            }}
        ];
        
        // 未解除武器のオプションを追加
        Object.keys(this.weapons).forEach(weaponKey => {
            const weapon = this.weapons[weaponKey];
            if (!weapon.unlocked && weaponKey !== 'plasma') {
                let rarityChance;
                switch (weapon.rarity) {
                    case 'uncommon': rarityChance = 0.7; break;
                    case 'rare': rarityChance = 0.3; break;
                    case 'epic': rarityChance = 0.1; break;
                    default: rarityChance = 1;
                }
                
                if (Math.random() < rarityChance) {
                    // 武器タイプの判定
                    const weaponType = '左クリック武器';
                    
                    upgrades.push({
                        name: `${weapon.name}解除`,
                        desc: `${weaponType}: ${this.getWeaponDescription(weaponKey)}`,
                        rarity: weapon.rarity,
                        effect: () => {
                            // 武器をアンロック
                            this.unlockWeapon(weaponKey);
                        }
                    });
                }
            }
        });
        
        // レアリティ重み付けで選択
        const selectedUpgrades = this.selectUpgradesByRarity(upgrades, 3);
        
        options.innerHTML = '';
        selectedUpgrades.forEach(upgrade => {
            const option = document.createElement('div');
            option.className = `upgrade-option ${upgrade.rarity || 'common'}`;
            // レアリティの表示名を設定
            const rarityNames = {
                common: 'コモン',
                uncommon: 'アンコモン',
                rare: 'レア',
                epic: 'エピック',
                legendary: 'レジェンダリー'
            };
            const rarityName = rarityNames[upgrade.rarity] || 'コモン';
            
            option.innerHTML = `
                <div class="upgrade-rarity">${rarityName}</div>
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
    
    // レアリティ重み付け選択システム
    selectUpgradesByRarity(upgrades, count) {
        const rarityWeights = {
            common: 50,      // 50%
            uncommon: 25,    // 25%
            rare: 15,        // 15%
            epic: 8,         // 8%
            legendary: 2     // 2%
        };
        
        const selected = [];
        const available = [...upgrades];
        
        for (let i = 0; i < count && available.length > 0; i++) {
            // 重み付けされた選択
            const totalWeight = available.reduce((sum, upgrade) => {
                return sum + (rarityWeights[upgrade.rarity] || rarityWeights.common);
            }, 0);
            
            let random = Math.random() * totalWeight;
            let selectedUpgrade = null;
            
            for (const upgrade of available) {
                const weight = rarityWeights[upgrade.rarity] || rarityWeights.common;
                random -= weight;
                if (random <= 0) {
                    selectedUpgrade = upgrade;
                    break;
                }
            }
            
            if (selectedUpgrade) {
                selected.push(selectedUpgrade);
                available.splice(available.indexOf(selectedUpgrade), 1);
            }
        }
        
        return selected;
    }
    
    updateBullets(deltaTime) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            
            // 特殊弾丸の更新処理
            this.updateSpecialBullet(bullet, deltaTime);
            
            // 基本移動
            bullet.x += bullet.vx * deltaTime;
            bullet.y += bullet.vy * deltaTime;
            bullet.distance += Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy) * deltaTime;
            
            // 時限爆弾のタイマー更新
            if (bullet.timeBomb) {
                bullet.bombTimer -= deltaTime * 1000;
                if (bullet.bombTimer <= 0) {
                    this.explode(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                    
                    // 設置済み爆弾リストからも削除
                    const deployedIndex = this.deployedBombs.indexOf(bullet);
                    if (deployedIndex !== -1) {
                        this.deployedBombs.splice(deployedIndex, 1);
                    }
                    
                    this.bullets.splice(i, 1);
                    continue;
                }
            }
            
            // 壁での跳ね返り
            if (bullet.bouncesLeft > 0) {
                if (bullet.x < 0 || bullet.x > this.baseWidth) {
                    bullet.vx = -bullet.vx;
                    bullet.bouncesLeft--;
                }
                if (bullet.y < 0 || bullet.y > this.baseHeight) {
                    bullet.vy = -bullet.vy;
                    bullet.bouncesLeft--;
                }
            }
            
            // 射程チェック
            if (bullet.distance > bullet.range) {
                if (bullet.explosive) {
                    this.explode(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                }
                this.bullets.splice(i, 1);
                continue;
            }
            
            if (bullet.enemyBullet) {
                // 敵の弾がプレイヤーに当たった場合
                const dx = bullet.x - this.player.x;
                const dy = bullet.y - this.player.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 20) {
                    this.damagePlayer(bullet.damage);
                    this.bullets.splice(i, 1);
                    continue;
                }
            } else {
                // プレイヤーの弾が敵に当たった場合
                let hit = false;
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    const dx = bullet.x - enemy.x;
                    const dy = bullet.y - enemy.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    const bulletRadius = (bullet.size || 4) / 2;
                    if (distance < 15 + bulletRadius) {
                        // 特殊効果処理
                        if (bullet.explosive) {
                            this.explode(bullet.x, bullet.y, bullet.explosionRadius, bullet.damage);
                        } else {
                            enemy.health -= bullet.damage;
                            // ヒットエフェクト
                            this.createParticle(bullet.x, bullet.y, 0, 0, '#ff6b6b', 200);
                        }
                        
                        // 貫通処理
                        if (bullet.piercing && bullet.piercingLeft > 0) {
                            bullet.piercingLeft--;
                            hit = false; // 弾丸は削除しない
                        } else {
                            this.bullets.splice(i, 1);
                            hit = true;
                        }
                        break;
                    }
                }
                if (hit) continue;
            }
        }
    }
    
    updateSpecialBullet(bullet, deltaTime) {
        // ホーミング処理
        if (bullet.homing && !bullet.enemyBullet) {
            let nearestEnemy = null;
            let nearestDistance = Infinity;
            
            this.enemies.forEach(enemy => {
                const dx = enemy.x - bullet.x;
                const dy = enemy.y - bullet.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < nearestDistance && distance < 200) {
                    nearestDistance = distance;
                    nearestEnemy = enemy;
                }
            });
            
            if (nearestEnemy) {
                const dx = nearestEnemy.x - bullet.x;
                const dy = nearestEnemy.y - bullet.y;
                const length = Math.sqrt(dx * dx + dy * dy);
                
                if (length > 0) {
                    const targetVx = (dx / length) * Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                    const targetVy = (dy / length) * Math.sqrt(bullet.vx * bullet.vx + bullet.vy * bullet.vy);
                    
                    bullet.vx += (targetVx - bullet.vx) * bullet.homingStrength;
                    bullet.vy += (targetVy - bullet.vy) * bullet.homingStrength;
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
    
    updateBackgroundParticles(deltaTime) {
        for (let i = this.backgroundParticles.length - 1; i >= 0; i--) {
            const particle = this.backgroundParticles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime * 1000;
            
            // 画面外に出たら再配置
            const screenLeft = this.camera.x - 100;
            const screenRight = this.camera.x + this.baseWidth + 100;
            const screenTop = this.camera.y - 100;
            const screenBottom = this.camera.y + this.baseHeight + 100;
            
            if (particle.x < screenLeft || particle.x > screenRight || 
                particle.y < screenTop || particle.y > screenBottom || 
                particle.life <= 0) {
                
                // 新しい位置に再配置
                particle.x = this.camera.x + Math.random() * this.baseWidth;
                particle.y = this.camera.y + Math.random() * this.baseHeight;
                particle.vx = (Math.random() - 0.5) * 20;
                particle.vy = (Math.random() - 0.5) * 20;
                particle.life = particle.maxLife;
            }
        }
    }
    
    updatePickups(deltaTime) {
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            pickup.life -= deltaTime * 1000;
            
            // プレイヤーとの衝突判定
            const dx = pickup.x - this.player.x;
            const dy = pickup.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // アイテム自動吸い寄せ（改善版 - まとわりつき防止）
            if (distance < 80 && distance > 35) {
                const attractSpeed = 300; // 吸い寄せ速度向上
                const attractForce = Math.pow(1 - (distance / 80), 2); // 二次関数で強力な吸引
                pickup.x += (this.player.x - pickup.x) * attractForce * attractSpeed * deltaTime;
                pickup.y += (this.player.y - pickup.y) * attractForce * attractSpeed * deltaTime;
            } else if (distance <= 35 && distance > 25) {
                // 近距離での瞬間吸引（確実な取得）
                const instantAttractSpeed = 800;
                pickup.x += (this.player.x - pickup.x) * instantAttractSpeed * deltaTime;
                pickup.y += (this.player.y - pickup.y) * instantAttractSpeed * deltaTime;
            }
            
            if (distance < 35) {
                if (pickup.type === 'health') {
                    // 体力上限を増加
                    const healthIncrease = 10;
                    this.player.maxHealth += healthIncrease;
                    this.player.health += healthIncrease; // 現在の体力も増加
                    if (this.sounds.pickupHealth) this.sounds.pickupHealth();
                } else if (pickup.type === 'speed') {
                    // 速度を永続的に増加（調整済み）
                    const speedIncrease = 5; // 10から5に調整
                    this.player.speed = Math.min(this.player.speed + speedIncrease, 350);
                    if (this.sounds.pickupSpeed) this.sounds.pickupSpeed();
                } else if (pickup.type === 'nuke') {
                    // ニュークランチャーを一時的な左クリック武器として装備
                    this.previousWeapon = this.currentWeapon; // 現在の武器を記録
                    this.currentWeapon = 'nuke';
                    this.weapons.nuke.ammo = 5; // 5発設定
                    this.weapons.nuke.unlocked = true;
                    if (this.sounds.pickupAmmo) this.sounds.pickupAmmo();
                }
                
                
                this.pickups.splice(i, 1);
                continue;
            }
            
            if (pickup.life <= 0) {
                this.pickups.splice(i, 1);
            }
        }
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
        
        // コンボタイムアウトチェック
        if (this.combo.count > 0 && Date.now() - this.combo.lastKillTime > this.combo.comboTimeout) {
            this.combo.count = 0;
        }
        
        // ウェーブ進行
        this.waveTimer += deltaTime * 1000;
        if (this.waveTimer > 30000) { // 30秒ごとにウェーブ増加
            this.stats.wave++;
            this.waveTimer = 0;
            this.difficultyMultiplier += 0.2;
            this.bossActive = false; // 新ウェーブでボスフラグリセット
        }
        
        // ゲームオーバーチェック
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }
    
    damagePlayer(damage) {
        this.player.health -= damage;
        this.player.health = Math.max(0, this.player.health);
        
        // コンボリセット
        this.combo.count = 0;
        
        // 画面フラッシュ効果
        this.damageEffects.screenFlash = 0.8;
        
        // 画面揺れ効果
        this.damageEffects.screenShake.intensity = damage * 2;
        this.damageEffects.screenShake.duration = 300; // 300ms
        
        // ダメージエフェクト（パーティクル増量）
        for (let i = 0; i < 15; i++) {
            this.createParticle(
                this.player.x + (Math.random() - 0.5) * 40,
                this.player.y + (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 200,
                i % 2 === 0 ? '#ff4757' : '#ff6b6b',
                500
            );
        }
        
        // 外周の爆発エフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            this.createParticle(
                this.player.x + Math.cos(angle) * 30,
                this.player.y + Math.sin(angle) * 30,
                Math.cos(angle) * 150,
                Math.sin(angle) * 150,
                '#ffffff',
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
        document.getElementById('final-combo').textContent = this.combo.maxCombo;
        
        this.hideAllScreens();
        document.getElementById('gameover-screen').classList.remove('hidden');
    }
    
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    // UI表示切替
    
    // WASD表示更新
    updateWASDDisplay() {
        if (this.isMobile) return;
        
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
        const comboValue = document.getElementById('combo-value');
        const timeValue = document.getElementById('time-value');
        
        if (scoreValue) scoreValue.textContent = this.stats.score.toLocaleString();
        if (waveValue) waveValue.textContent = this.stats.wave;
        if (comboValue) {
            comboValue.textContent = this.combo.count;
            // コンボ数に応じて色を変更
            if (this.combo.count >= 20) {
                comboValue.style.color = '#a55eea'; // 紫
            } else if (this.combo.count >= 10) {
                comboValue.style.color = '#3742fa'; // 青
            } else if (this.combo.count >= 5) {
                comboValue.style.color = '#2ed573'; // 緑
            } else {
                comboValue.style.color = '#fff'; // 白
            }
        }
        if (timeValue) timeValue.textContent = this.formatTime(this.stats.gameTime);
        
        if (this.isMobile) {
            const mobileScore = document.getElementById('mobile-score');
            if (mobileScore) mobileScore.textContent = this.stats.score.toLocaleString();
            
            // モバイル用コンボ表示
            const mobileComboValue = document.getElementById('mobile-combo-value');
            if (mobileComboValue) {
                mobileComboValue.textContent = this.combo.count;
                // コンボ数に応じて色を変更
                if (this.combo.count >= 20) {
                    mobileComboValue.style.color = '#a55eea'; // 紫
                } else if (this.combo.count >= 10) {
                    mobileComboValue.style.color = '#3742fa'; // 青
                } else if (this.combo.count >= 5) {
                    mobileComboValue.style.color = '#2ed573'; // 緑
                } else {
                    mobileComboValue.style.color = '#fff'; // 白
                }
            }
        }
    }
    
    // 背景描画
    renderBackground() {
        this.ctx.save();
        
        // カメラオフセットを適用
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        this.backgroundElements.forEach(element => {
            this.ctx.globalAlpha = 1;
            
            switch (element.type) {
                    
                case 'building':
                    this.ctx.fillStyle = element.color;
                    this.ctx.fillRect(element.x, element.y, element.width, element.height);
                    
                    // 窓と破損部分
                    if (element.broken) {
                        // 破損した窓
                        this.ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
                        for (let i = 0; i < 2; i++) {
                            for (let j = 0; j < 4; j++) {
                                if (Math.random() > 0.3) { // 一部の窓だけ描画
                                    this.ctx.fillRect(
                                        element.x + 15 + i * (element.width / 3),
                                        element.y + 30 + j * (element.height / 5),
                                        20, 25
                                    );
                                }
                            }
                        }
                        // 破損エフェクト
                        this.ctx.fillStyle = 'rgba(60, 60, 60, 0.4)';
                        this.ctx.fillRect(element.x, element.y + element.height * 0.7, element.width, element.height * 0.3);
                    } else {
                        // 通常の窓
                        this.ctx.fillStyle = 'rgba(40, 45, 50, 0.5)';
                        for (let i = 0; i < 3; i++) {
                            for (let j = 0; j < 5; j++) {
                                this.ctx.fillRect(
                                    element.x + 10 + i * (element.width / 4),
                                    element.y + 20 + j * (element.height / 6),
                                    15, 20
                                );
                            }
                        }
                    }
                    break;
                    
                case 'crack':
                    this.ctx.save();
                    this.ctx.translate(element.x, element.y);
                    this.ctx.rotate(element.angle);
                    this.ctx.fillStyle = element.color;
                    this.ctx.fillRect(-element.length/2, -element.width/2, element.length, element.width);
                    this.ctx.restore();
                    break;
                    
                case 'vegetation':
                    this.ctx.fillStyle = element.color;
                    if (element.type2 === 'bush') {
                        // 茂み
                        this.ctx.beginPath();
                        this.ctx.arc(element.x, element.y, element.size/2, 0, Math.PI * 2);
                        this.ctx.fill();
                        // 追加の小さな茂み
                        for (let i = 0; i < 3; i++) {
                            const offsetX = (Math.random() - 0.5) * element.size * 0.8;
                            const offsetY = (Math.random() - 0.5) * element.size * 0.8;
                            this.ctx.beginPath();
                            this.ctx.arc(element.x + offsetX, element.y + offsetY, element.size * 0.2, 0, Math.PI * 2);
                            this.ctx.fill();
                        }
                    } else {
                        // 草
                        for (let i = 0; i < 8; i++) {
                            const offsetX = (Math.random() - 0.5) * element.size;
                            const offsetY = (Math.random() - 0.5) * element.size;
                            this.ctx.fillRect(
                                element.x + offsetX - 1, 
                                element.y + offsetY - element.size/4, 
                                2, 
                                element.size/2
                            );
                        }
                    }
                    break;
            }
        });
        
        // 背景パーティクル描画
        this.backgroundParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha * (particle.life / particle.maxLife);
            this.ctx.fillStyle = particle.color;
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.restore();
    }
    
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
        
        // 背景要素描画
        this.renderBackground();
        
        // 血痕描画は削除（爆発エフェクトに変更）
        
        // パーティクル描画
        this.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
        
        // 弾丸描画（改良版）
        this.bullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            
            if (bullet.enemyBullet) {
                // 敵の弾 - 赤いエネルギー球
                this.ctx.shadowColor = '#ff0000';
                this.ctx.shadowBlur = 8;
                this.ctx.fillStyle = '#ff4444';
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
                
            } else if (bullet.nuke) {
                // ニューク弾 - 巨大な火の玉
                this.ctx.shadowColor = '#ff4400';
                this.ctx.shadowBlur = 15;
                this.ctx.fillStyle = '#ff6600';
                this.ctx.strokeStyle = '#ff0000';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // 内側の輝き
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
            } else if (bullet.laser) {
                // レーザー弾 - 緑のエネルギービーム
                this.ctx.shadowColor = '#00ff88';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = '#00ffaa';
                this.ctx.strokeStyle = '#00ff88';
                this.ctx.lineWidth = 1;
                
                // レーザービーム（楕円）
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                this.ctx.shadowBlur = 0;
                
            } else if (bullet.weaponType === 'sniper') {
                // スナイパー弾 - 高速弾丸の軌跡
                this.ctx.shadowColor = '#ffaa00';
                this.ctx.shadowBlur = 5;
                this.ctx.fillStyle = '#ffcc00';
                this.ctx.strokeStyle = '#ff8800';
                this.ctx.lineWidth = 1;
                
                // 弾丸本体
                this.ctx.beginPath();
                this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // 軌跡
                this.ctx.globalAlpha = 0.6;
                this.ctx.fillStyle = '#ffaa00';
                this.ctx.fillRect(-6, -1, 8, 2);
                this.ctx.globalAlpha = 1;
                this.ctx.shadowBlur = 0;
                
            } else {
                // 通常弾（プラズマ弾）
                const size = bullet.size || 4;
                this.ctx.shadowColor = '#00aaff';
                this.ctx.shadowBlur = 6;
                this.ctx.fillStyle = '#00ccff';
                this.ctx.strokeStyle = '#0088cc';
                this.ctx.lineWidth = 1;
                
                // プラズマ球
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // 内側の輝き
                this.ctx.fillStyle = '#88ddff';
                this.ctx.beginPath();
                this.ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
            }
            
            this.ctx.restore();
        });
        
        // 敵描画（モンスターデザイン）
        this.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            
            // 敵タイプ別の描画
            if (enemy.type === 'boss') {
                // ボス - 巨大なドラゴン型
                this.ctx.fillStyle = '#8B0000';
                this.ctx.strokeStyle = '#FF0000';
                this.ctx.lineWidth = 3;
                
                // 本体（楕円）
                this.ctx.beginPath();
                this.ctx.ellipse(0, 0, enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.stroke();
                
                // 翼
                this.ctx.fillStyle = '#660000';
                this.ctx.beginPath();
                this.ctx.ellipse(-20, -10, 15, 8, -0.5, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.ellipse(-20, 10, 15, 8, 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 目（発光）
                this.ctx.shadowColor = '#FF0000';
                this.ctx.shadowBlur = 10;
                this.ctx.fillStyle = '#FF4444';
                this.ctx.beginPath();
                this.ctx.arc(-10, -8, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.arc(-10, 8, 6, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                
                // 体力バー（ボス用）
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(-40, -45, 80, 8);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
                this.ctx.fillRect(-40, -45, 80 * healthPercent, 8);
                
            } else {
                // 通常敵 - タイプ別デザイン
                if (enemy.type === 'fast') {
                    // 高速敵 - スパイダー型
                    this.ctx.fillStyle = '#ff1744';
                    this.ctx.strokeStyle = '#ff5722';
                    this.ctx.lineWidth = 2;
                    
                    // 本体
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 脚（8本）
                    this.ctx.strokeStyle = '#ff1744';
                    this.ctx.lineWidth = 2;
                    for (let i = 0; i < 8; i++) {
                        const angle = (i / 8) * Math.PI * 2;
                        this.ctx.beginPath();
                        this.ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
                        this.ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
                        this.ctx.stroke();
                    }
                    
                } else if (enemy.type === 'tank') {
                    // タンク敵 - 装甲クリーチャー
                    this.ctx.fillStyle = '#37474f';
                    this.ctx.strokeStyle = '#263238';
                    this.ctx.lineWidth = 3;
                    
                    // 装甲板（重なり合う六角形）
                    this.ctx.beginPath();
                    this.ctx.moveTo(12, 0);
                    this.ctx.lineTo(6, -10);
                    this.ctx.lineTo(-6, -10);
                    this.ctx.lineTo(-12, 0);
                    this.ctx.lineTo(-6, 10);
                    this.ctx.lineTo(6, 10);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 装甲の継ぎ目
                    this.ctx.strokeStyle = '#455a64';
                    this.ctx.lineWidth = 1;
                    this.ctx.beginPath();
                    this.ctx.moveTo(-12, 0);
                    this.ctx.lineTo(12, 0);
                    this.ctx.moveTo(-6, -10);
                    this.ctx.lineTo(6, 10);
                    this.ctx.moveTo(6, -10);
                    this.ctx.lineTo(-6, 10);
                    this.ctx.stroke();
                    
                } else if (enemy.type === 'shooter') {
                    // シューター敵 - エイリアン型
                    this.ctx.fillStyle = '#673ab7';
                    this.ctx.strokeStyle = '#9c27b0';
                    this.ctx.lineWidth = 2;
                    
                    // 頭部
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, -2, 10, 8, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 胴体
                    this.ctx.fillStyle = '#512da8';
                    this.ctx.beginPath();
                    this.ctx.ellipse(0, 4, 8, 6, 0, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 発光する目
                    this.ctx.shadowColor = '#e91e63';
                    this.ctx.shadowBlur = 8;
                    this.ctx.fillStyle = '#ff4081';
                    this.ctx.beginPath();
                    this.ctx.arc(-3, -3, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(3, -3, 2, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.shadowBlur = 0;
                    
                } else {
                    // 通常敵 - ゾンビ型
                    this.ctx.fillStyle = '#388e3c';
                    this.ctx.strokeStyle = '#2e7d32';
                    this.ctx.lineWidth = 2;
                    
                    // 頭
                    this.ctx.beginPath();
                    this.ctx.arc(0, -4, 6, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 胴体
                    this.ctx.fillRect(-6, 0, 12, 10);
                    this.ctx.strokeRect(-6, 0, 12, 10);
                    
                    // 赤い目
                    this.ctx.fillStyle = '#f44336';
                    this.ctx.beginPath();
                    this.ctx.arc(-2, -4, 1.5, 0, Math.PI * 2);
                    this.ctx.fill();
                    this.ctx.beginPath();
                    this.ctx.arc(2, -4, 1.5, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                // 体力バー（通常敵用）
                const healthPercent = enemy.health / enemy.maxHealth;
                this.ctx.fillStyle = '#000';
                this.ctx.fillRect(-15, -25, 30, 4);
                this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
                this.ctx.fillRect(-15, -25, 30 * healthPercent, 4);
            }
            
            this.ctx.restore();
        });
        
        // アイテム描画（改良版）
        this.pickups.forEach(pickup => {
            this.ctx.save();
            this.ctx.translate(pickup.x, pickup.y);
            
            // アイテムタイプ別のデザイン（軽量化版）
            switch (pickup.type) {
                case 'health':
                    // 体力アイテム - 緑のクリスタル（シンプル版）
                    this.ctx.fillStyle = '#00ff66';
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -12);
                    this.ctx.lineTo(8, 0);
                    this.ctx.lineTo(0, 12);
                    this.ctx.lineTo(-8, 0);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 十字マーク
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(-1, -6, 2, 12);
                    this.ctx.fillRect(-6, -1, 12, 2);
                    break;
                    
                case 'speed':
                    // 速度アイテム - 青い六角形（シンプル版）
                    this.ctx.fillStyle = '#0088ff';
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    for (let i = 0; i < 6; i++) {
                        const angle = (i / 6) * Math.PI * 2;
                        const x = Math.cos(angle) * 10;
                        const y = Math.sin(angle) * 10;
                        if (i === 0) this.ctx.moveTo(x, y);
                        else this.ctx.lineTo(x, y);
                    }
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 矢印
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -6);
                    this.ctx.lineTo(-3, -1);
                    this.ctx.lineTo(-1, -1);
                    this.ctx.lineTo(-1, 6);
                    this.ctx.lineTo(1, 6);
                    this.ctx.lineTo(1, -1);
                    this.ctx.lineTo(3, -1);
                    this.ctx.closePath();
                    this.ctx.fill();
                    break;
                    
                case 'nuke':
                    // ニュークアイテム - 警告三角形（シンプル版）
                    this.ctx.fillStyle = '#ff6600';
                    this.ctx.strokeStyle = '#ffff00';
                    this.ctx.lineWidth = 3;
                    this.ctx.beginPath();
                    this.ctx.moveTo(0, -14);
                    this.ctx.lineTo(12, 10);
                    this.ctx.lineTo(-12, 10);
                    this.ctx.closePath();
                    this.ctx.fill();
                    this.ctx.stroke();
                    
                    // 放射能マーク
                    this.ctx.fillStyle = '#000000';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
                    this.ctx.fill();
                    
                    // 放射線（簡略化）
                    for (let i = 0; i < 3; i++) {
                        const angle = (i / 3) * Math.PI * 2;
                        this.ctx.beginPath();
                        this.ctx.arc(Math.cos(angle) * 6, Math.sin(angle) * 6, 2, 0, Math.PI * 2);
                        this.ctx.fill();
                    }
                    break;
                    
                default:
                    // デフォルトアイテム
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
                    this.ctx.fill();
                    break;
            }
            
            this.ctx.restore();
        });
        this.ctx.globalAlpha = 1;
        
        // プレイヤー描画（宇宙戦闘機デザイン）
        this.ctx.save();
        this.ctx.translate(this.player.x, this.player.y);
        this.ctx.rotate(this.player.angle);
        
        // ダッシュ効果表示
        if (this.player.dashActive) {
            this.ctx.shadowColor = '#00ff88';
            this.ctx.shadowBlur = 25;
            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        }
        
        // 戦闘機本体（三角形ベース）
        this.ctx.fillStyle = '#00ff88';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // メイン船体
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0); // 先端
        this.ctx.lineTo(-8, -6); // 左翼
        this.ctx.lineTo(-5, -3); // 左後部
        this.ctx.lineTo(-5, 3); // 右後部
        this.ctx.lineTo(-8, 6); // 右翼
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // コックピット
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン排気エフェクト
        this.ctx.fillStyle = this.player.dashActive ? '#ffff00' : '#ff6600';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -2);
        this.ctx.lineTo(-12, -1);
        this.ctx.lineTo(-12, 1);
        this.ctx.lineTo(-5, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 翼の装飾
        this.ctx.fillStyle = '#00cc66';
        this.ctx.globalAlpha = 1;
        this.ctx.fillRect(5, -1, 8, 2);
        
        this.ctx.restore();
        
        // ダメージ画面フラッシュ効果
        if (this.damageEffects.screenFlash > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.damageEffects.screenFlash * 0.5})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 低体力時の警告表示
        const healthPercent = this.player.health / this.player.maxHealth;
        if (healthPercent < 0.3) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * healthPercent})`;
            this.ctx.lineWidth = 8;
            this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
        }
        
        // ポップアップエフェクトの描画
        
        // リロード表示は無限弾薬のため不要
    }
    
}

// ゲーム開始
window.addEventListener('load', () => {
    new ZombieSurvival();
});