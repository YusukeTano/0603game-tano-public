/**
 * AudioSystem - オーディオ管理システム
 * Web Audio APIを使用したBGMと効果音の管理
 */
export class AudioSystem {
    constructor(game) {
        this.game = game;
        
        // オーディオコンテキスト
        this.audioContext = null;
        this.sounds = {};
        
        // BGM用変数
        this.bgmOscillators = [];
        this.isBGMPlaying = false;
        
        // 初期化
        this.initAudio();
    }
    
    /**
     * オーディオシステムの初期化
     */
    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 音響エフェクト生成
            this.createSounds();
        } catch (error) {
            console.log('音響システムの初期化に失敗:', error);
        }
    }
    
    /**
     * オーディオコンテキストの再開
     * ユーザーインタラクション後に呼び出す
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('Audio context resumed');
                return Promise.resolve();
            } catch (error) {
                console.log('Audio context resume failed:', error);
                return Promise.reject(error);
            }
        }
        return Promise.resolve();
    }
    
    /**
     * コンボモジュレーション計算
     * コンボ数に応じた音響効果の変化
     */
    getComboModulation() {
        const comboMultiplier = Math.min(this.game.combo.count / 10, 2); // 最大2倍まで
        return {
            pitchMultiplier: 1 + comboMultiplier * 0.5,
            volumeMultiplier: 1 + comboMultiplier * 0.3,
            distortion: comboMultiplier * 0.2
        };
    }
    
    /**
     * 各種サウンドエフェクトの作成
     */
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
        
        // アイテム取得音 - 体力
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
        
        // アイテム取得音 - ダッシュ
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
        
        // アイテム取得音 - スピード
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
        
        // アイテム取得音 - 弾薬
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
        
        // アイテム取得音 - ニューク（超レア専用）
        this.sounds.pickupNuke = () => {
            if (!this.audioContext) return;
            
            // 複数のオシレーターで派手な音を作成
            const createNukeOscillator = (freq, type, delay, duration) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
                oscillator.type = type;
                
                // ローパスフィルターでエフェクト
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(freq * 4, this.audioContext.currentTime + delay);
                filterNode.Q.setValueAtTime(10, this.audioContext.currentTime + delay);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + delay + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + duration);
                
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(this.audioContext.currentTime + delay);
                oscillator.stop(this.audioContext.currentTime + delay + duration);
            };
            
            // 第1段階: 低音の警告音
            createNukeOscillator(110, 'sawtooth', 0, 0.3);
            createNukeOscillator(220, 'sawtooth', 0, 0.3);
            
            // 第2段階: 上昇する緊張音
            createNukeOscillator(440, 'square', 0.15, 0.4);
            createNukeOscillator(880, 'square', 0.25, 0.4);
            
            // 第3段階: 爆発的なピーク音
            createNukeOscillator(1760, 'triangle', 0.4, 0.6);
            createNukeOscillator(2200, 'sine', 0.45, 0.5);
            
            // ノイズエフェクト（爆発音）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const noise = this.audioContext.createBufferSource();
                const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.3, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < data.length; i++) {
                    data[i] = (Math.random() - 0.5) * 2 * Math.exp(-i / (data.length * 0.3));
                }
                
                noise.buffer = buffer;
                
                const noiseGain = this.audioContext.createGain();
                const noiseFilter = this.audioContext.createBiquadFilter();
                
                noiseFilter.type = 'bandpass';
                noiseFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
                noiseFilter.Q.setValueAtTime(5, this.audioContext.currentTime);
                
                noiseGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                
                noise.connect(noiseFilter);
                noiseFilter.connect(noiseGain);
                noiseGain.connect(this.audioContext.destination);
                
                noise.start();
            }, 400);
        };
        
        // アイテム取得音 - スーパーホーミングガン（超レア専用）
        this.sounds.pickupSuperHoming = () => {
            if (!this.audioContext) return;
            
            // 複数段階の電子音で構成
            const createHomingOscillator = (freq, type, delay, duration, modulation = false) => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
                oscillator.type = type;
                
                // モジュレーション（ビブラート効果）
                if (modulation) {
                    const lfo = this.audioContext.createOscillator();
                    const lfoGain = this.audioContext.createGain();
                    lfo.frequency.setValueAtTime(6, this.audioContext.currentTime + delay); // 6Hz LFO
                    lfoGain.gain.setValueAtTime(freq * 0.05, this.audioContext.currentTime + delay); // 5%モジュレーション
                    lfo.connect(lfoGain);
                    lfoGain.connect(oscillator.frequency);
                    lfo.start(this.audioContext.currentTime + delay);
                    lfo.stop(this.audioContext.currentTime + delay + duration);
                }
                
                // ハイパスフィルターで未来的な音
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(freq * 0.5, this.audioContext.currentTime + delay);
                filterNode.Q.setValueAtTime(8, this.audioContext.currentTime + delay);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(0.2, this.audioContext.currentTime + delay + 0.02);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + duration);
                
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(this.audioContext.currentTime + delay);
                oscillator.stop(this.audioContext.currentTime + delay + duration);
            };
            
            // 第1段階: 起動音（電子音上昇）
            createHomingOscillator(220, 'sine', 0, 0.3);
            createHomingOscillator(440, 'sine', 0.05, 0.3);
            createHomingOscillator(880, 'sine', 0.1, 0.3);
            
            // 第2段階: ロックオン音（ピピピ...）
            for (let i = 0; i < 5; i++) {
                createHomingOscillator(1320, 'square', 0.3 + i * 0.08, 0.05);
            }
            
            // 第3段階: チャージ音（ウィーン）
            createHomingOscillator(660, 'sawtooth', 0.7, 0.4, true); // ビブラート付き
            createHomingOscillator(990, 'triangle', 0.75, 0.35, true);
            
            // 第4段階: 完了音（キラーン + エコー）
            createHomingOscillator(1760, 'sine', 1.0, 0.6);
            createHomingOscillator(2200, 'triangle', 1.05, 0.5);
            createHomingOscillator(2640, 'sine', 1.1, 0.4);
            
            // エコーエフェクト（遅延音）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                createHomingOscillator(1320, 'sine', 0, 0.3);
                createHomingOscillator(660, 'sine', 0.1, 0.2);
            }, 200);
            
            // フィナーレチャイム（キラキラ）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const chimeFreqs = [1760, 2093, 2637, 3136]; // C6, C7, E7, G7
                chimeFreqs.forEach((freq, i) => {
                    createHomingOscillator(freq, 'sine', i * 0.1, 0.8);
                });
            }, 400);
        };
        
        // 射撃音 - スーパーホーミングガン専用（精密ライフル感）
        this.sounds.shootSuperHoming = () => {
            if (!this.audioContext) return;
            
            // 第1段階: 瞬間的爆発音（銃撃の基本）
            const shot = this.audioContext.createOscillator();
            const shotGain = this.audioContext.createGain();
            const shotFilter = this.audioContext.createBiquadFilter();
            
            shot.frequency.setValueAtTime(150, this.audioContext.currentTime);
            shot.frequency.exponentialRampToValueAtTime(80, this.audioContext.currentTime + 0.08);
            shot.type = 'sawtooth';
            
            shotFilter.type = 'lowpass';
            shotFilter.frequency.setValueAtTime(400, this.audioContext.currentTime);
            shotFilter.Q.setValueAtTime(3, this.audioContext.currentTime);
            
            shotGain.gain.setValueAtTime(0.25, this.audioContext.currentTime);
            shotGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
            
            shot.connect(shotFilter);
            shotFilter.connect(shotGain);
            shotGain.connect(this.audioContext.destination);
            
            shot.start();
            shot.stop(this.audioContext.currentTime + 0.15);
            
            // 第2段階: 精密ライフルの金属音
            const metallic = this.audioContext.createOscillator();
            const metallicGain = this.audioContext.createGain();
            const metallicFilter = this.audioContext.createBiquadFilter();
            
            metallic.frequency.setValueAtTime(1200, this.audioContext.currentTime);
            metallic.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.1);
            metallic.type = 'square';
            
            metallicFilter.type = 'bandpass';
            metallicFilter.frequency.setValueAtTime(1000, this.audioContext.currentTime);
            metallicFilter.Q.setValueAtTime(8, this.audioContext.currentTime);
            
            metallicGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
            metallicGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            metallic.connect(metallicFilter);
            metallicFilter.connect(metallicGain);
            metallicGain.connect(this.audioContext.destination);
            
            metallic.start();
            metallic.stop(this.audioContext.currentTime + 0.2);
            
            // 第3段階: ホーミング起動音（短い確認音）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const beep = this.audioContext.createOscillator();
                const beepGain = this.audioContext.createGain();
                
                beep.frequency.setValueAtTime(1320, this.audioContext.currentTime);
                beep.type = 'sine';
                
                beepGain.gain.setValueAtTime(0.06, this.audioContext.currentTime);
                beepGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.08);
                
                beep.connect(beepGain);
                beepGain.connect(this.audioContext.destination);
                
                beep.start();
                beep.stop(this.audioContext.currentTime + 0.08);
            }, 50);
        };
        
        // スーパーマルチショット発射音
        this.sounds.shootSuperMultiShot = () => {
            if (!this.audioContext) return;
            
            // 複数の発射音を同時再生（9発同時発射を表現）
            const shotCount = 3; // 実際は9発だが音は3つに抑制
            
            for (let i = 0; i < shotCount; i++) {
                setTimeout(() => {
                    // メイン発射音（低周波でパワフル）
                    const oscillator = this.audioContext.createOscillator();
                    const gainNode = this.audioContext.createGain();
                    const filterNode = this.audioContext.createBiquadFilter();
                    
                    oscillator.frequency.setValueAtTime(120 + i * 40, this.audioContext.currentTime); // 120-200Hz
                    oscillator.type = 'sawtooth';
                    
                    filterNode.type = 'lowpass';
                    filterNode.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    
                    oscillator.connect(filterNode);
                    filterNode.connect(gainNode);
                    gainNode.connect(this.audioContext.destination);
                    
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    
                    // 高周波ホイッスル音（同時発射の迫力）
                    const whistle = this.audioContext.createOscillator();
                    const whistleGain = this.audioContext.createGain();
                    
                    whistle.frequency.setValueAtTime(2000 + i * 300, this.audioContext.currentTime);
                    whistle.type = 'sine';
                    
                    whistleGain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
                    whistleGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
                    
                    whistle.connect(whistleGain);
                    whistleGain.connect(this.audioContext.destination);
                    
                    whistle.start();
                    whistle.stop(this.audioContext.currentTime + 0.15);
                }, i * 20); // 20msずつ遅延で連射感
            }
        };
        
        // 射撃音 - スーパーショットガン専用（リアル散弾銃感）
        this.sounds.shootSuperShotgun = () => {
            if (!this.audioContext) return;
            
            // 第1段階: 瞬間的な散弾銃爆発音（実際の散弾銃の特性）
            const mainBlast = this.audioContext.createOscillator();
            const blastGain = this.audioContext.createGain();
            const blastFilter = this.audioContext.createBiquadFilter();
            
            mainBlast.frequency.setValueAtTime(100, this.audioContext.currentTime);
            mainBlast.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.08);
            mainBlast.type = 'sawtooth';
            
            blastFilter.type = 'lowpass';
            blastFilter.frequency.setValueAtTime(300, this.audioContext.currentTime);
            blastFilter.Q.setValueAtTime(2, this.audioContext.currentTime);
            
            blastGain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            blastGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.25);
            
            mainBlast.connect(blastFilter);
            blastFilter.connect(blastGain);
            blastGain.connect(this.audioContext.destination);
            
            mainBlast.start();
            mainBlast.stop(this.audioContext.currentTime + 0.25);
            
            // 第2段階: ダブルバレル連射音（2発同時発射）
            for (let barrel = 0; barrel < 2; barrel++) {
                setTimeout(() => {
                    // 各バレルの個別爆発音
                    const barrelShot = this.audioContext.createOscillator();
                    const shotGain = this.audioContext.createGain();
                    const shotFilter = this.audioContext.createBiquadFilter();
                    
                    barrelShot.frequency.setValueAtTime(80 + barrel * 15, this.audioContext.currentTime);
                    barrelShot.frequency.exponentialRampToValueAtTime(35, this.audioContext.currentTime + 0.12);
                    barrelShot.type = 'sawtooth';
                    
                    shotFilter.type = 'lowpass';
                    shotFilter.frequency.setValueAtTime(250, this.audioContext.currentTime);
                    shotFilter.Q.setValueAtTime(3, this.audioContext.currentTime);
                    
                    shotGain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                    shotGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    
                    barrelShot.connect(shotFilter);
                    shotFilter.connect(shotGain);
                    shotGain.connect(this.audioContext.destination);
                    
                    barrelShot.start();
                    barrelShot.stop(this.audioContext.currentTime + 0.3);
                    
                    // 散弾拡散音（高周波クラック音）
                    const crackle = this.audioContext.createOscillator();
                    const crackleGain = this.audioContext.createGain();
                    const crackleFilter = this.audioContext.createBiquadFilter();
                    
                    crackle.frequency.setValueAtTime(2000 + barrel * 500, this.audioContext.currentTime);
                    crackle.frequency.exponentialRampToValueAtTime(800, this.audioContext.currentTime + 0.1);
                    crackle.type = 'square';
                    
                    crackleFilter.type = 'bandpass';
                    crackleFilter.frequency.setValueAtTime(1800, this.audioContext.currentTime);
                    crackleFilter.Q.setValueAtTime(10, this.audioContext.currentTime);
                    
                    crackleGain.gain.setValueAtTime(0.12, this.audioContext.currentTime);
                    crackleGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
                    
                    crackle.connect(crackleFilter);
                    crackleFilter.connect(crackleGain);
                    crackleGain.connect(this.audioContext.destination);
                    
                    crackle.start();
                    crackle.stop(this.audioContext.currentTime + 0.15);
                    
                }, barrel * 20); // 20ms間隔で連射感
            }
            
            // 第3段階: 薬莢排出音（メカニカル・リアル）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const eject = this.audioContext.createOscillator();
                const ejectGain = this.audioContext.createGain();
                const ejectFilter = this.audioContext.createBiquadFilter();
                
                eject.frequency.setValueAtTime(1200, this.audioContext.currentTime);
                eject.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.15);
                eject.type = 'square';
                
                ejectFilter.type = 'bandpass';
                ejectFilter.frequency.setValueAtTime(800, this.audioContext.currentTime);
                ejectFilter.Q.setValueAtTime(6, this.audioContext.currentTime);
                
                ejectGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                ejectGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                
                eject.connect(ejectFilter);
                ejectFilter.connect(ejectGain);
                ejectGain.connect(this.audioContext.destination);
                
                eject.start();
                eject.stop(this.audioContext.currentTime + 0.2);
            }, 150);
            
            // 第4段階: エコー（散弾銃らしい残響）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const echo = this.audioContext.createOscillator();
                const echoGain = this.audioContext.createGain();
                
                echo.frequency.setValueAtTime(60, this.audioContext.currentTime);
                echo.frequency.exponentialRampToValueAtTime(30, this.audioContext.currentTime + 0.4);
                echo.type = 'triangle';
                
                echoGain.gain.setValueAtTime(0.06, this.audioContext.currentTime);
                echoGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.6);
                
                echo.connect(echoGain);
                echoGain.connect(this.audioContext.destination);
                
                echo.start();
                echo.stop(this.audioContext.currentTime + 0.6);
            }, 200);
        };
        
        // スーパーマルチショット取得音
        this.sounds.pickupSuperMultiShot = () => {
            if (!this.audioContext) return;
            
            // 第1段階: 機械展開音
            const mechanicalOsc = this.audioContext.createOscillator();
            const mechanicalGain = this.audioContext.createGain();
            const mechanicalFilter = this.audioContext.createBiquadFilter();
            
            mechanicalOsc.frequency.setValueAtTime(200, this.audioContext.currentTime);
            mechanicalOsc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            mechanicalOsc.type = 'square';
            
            mechanicalFilter.type = 'bandpass';
            mechanicalFilter.frequency.setValueAtTime(300, this.audioContext.currentTime);
            mechanicalFilter.Q.setValueAtTime(5, this.audioContext.currentTime);
            
            mechanicalGain.gain.setValueAtTime(0.15, this.audioContext.currentTime);
            mechanicalGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            
            mechanicalOsc.connect(mechanicalFilter);
            mechanicalFilter.connect(mechanicalGain);
            mechanicalGain.connect(this.audioContext.destination);
            
            mechanicalOsc.start();
            mechanicalOsc.stop(this.audioContext.currentTime + 0.3);
            
            // 第2段階: チャージ音（300ms後）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const chargeOsc = this.audioContext.createOscillator();
                const chargeGain = this.audioContext.createGain();
                
                chargeOsc.frequency.setValueAtTime(440, this.audioContext.currentTime);
                chargeOsc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.4);
                chargeOsc.type = 'sine';
                
                chargeGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                chargeGain.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.4);
                
                chargeOsc.connect(chargeGain);
                chargeGain.connect(this.audioContext.destination);
                
                chargeOsc.start();
                chargeOsc.stop(this.audioContext.currentTime + 0.4);
            }, 300);
            
            // 第3段階: 完了確認音（700ms後）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                // 9つのビープ音（9発表現）
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const beep = this.audioContext.createOscillator();
                        const beepGain = this.audioContext.createGain();
                        
                        beep.frequency.setValueAtTime(1320 + i * 220, this.audioContext.currentTime);
                        beep.type = 'sine';
                        
                        beepGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                        beepGain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                        
                        beep.connect(beepGain);
                        beepGain.connect(this.audioContext.destination);
                        
                        beep.start();
                        beep.stop(this.audioContext.currentTime + 0.1);
                    }, i * 50);
                }
            }, 700);
        };
        
        // アイテム取得音 - スーパーショットガン（超レア専用）
        this.sounds.pickupSuperShotgun = () => {
            if (!this.audioContext) return;
            
            // ヘルパー関数：ショットガン用音響効果
            const createShotgunOscillator = (freq, type, delay, duration, filterType = 'lowpass') => {
                const oscillator = this.audioContext.createOscillator();
                const gainNode = this.audioContext.createGain();
                const filterNode = this.audioContext.createBiquadFilter();
                
                oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime + delay);
                oscillator.type = type;
                
                // フィルター設定（金属音・メカニカル音用）
                filterNode.type = filterType;
                filterNode.frequency.setValueAtTime(freq * 2, this.audioContext.currentTime + delay);
                filterNode.Q.setValueAtTime(3, this.audioContext.currentTime + delay);
                
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime + delay);
                gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + delay + 0.05);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + delay + duration);
                
                oscillator.connect(filterNode);
                filterNode.connect(gainNode);
                gainNode.connect(this.audioContext.destination);
                
                oscillator.start(this.audioContext.currentTime + delay);
                oscillator.stop(this.audioContext.currentTime + delay + duration);
            };
            
            // 第1段階: 武器ハンドリング音（ガシャン）
            createShotgunOscillator(200, 'square', 0, 0.2, 'bandpass');
            createShotgunOscillator(150, 'sawtooth', 0.05, 0.25, 'lowpass');
            
            // 第2段階: ポンプアクション音（シャコン）
            createShotgunOscillator(300, 'square', 0.3, 0.15, 'bandpass');
            createShotgunOscillator(250, 'square', 0.35, 0.1, 'highpass');
            
            // 第3段階: シェル装填音（カチャカチャ）
            for (let i = 0; i < 4; i++) {
                createShotgunOscillator(400 + i * 50, 'square', 0.5 + i * 0.1, 0.08, 'bandpass');
            }
            
            // 第4段階: ブリーチクローズ音（ガチャン）
            createShotgunOscillator(180, 'sawtooth', 0.9, 0.3, 'lowpass');
            createShotgunOscillator(120, 'square', 0.95, 0.25, 'lowpass');
            
            // 第5段階: セイフティクリック音（カチッ）
            createShotgunOscillator(800, 'square', 1.2, 0.05, 'highpass');
            
            // 第6段階: 最終確認音（低い金属音）
            createShotgunOscillator(100, 'sawtooth', 1.4, 0.5, 'lowpass');
            createShotgunOscillator(80, 'triangle', 1.45, 0.45, 'lowpass');
            
            // エコー効果（重厚感）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                createShotgunOscillator(150, 'sawtooth', 0, 0.3, 'lowpass');
                createShotgunOscillator(100, 'triangle', 0.1, 0.25, 'lowpass');
            }, 300);
            
            // ファイナルクランク（威圧感）
            setTimeout(() => {
                if (!this.audioContext) return;
                
                // 低周波ランブル
                createShotgunOscillator(60, 'sawtooth', 0, 0.8, 'lowpass');
                createShotgunOscillator(40, 'triangle', 0.05, 0.75, 'lowpass');
                
                // ハーモニック（重厚感）
                createShotgunOscillator(120, 'sawtooth', 0.1, 0.6, 'lowpass');
                createShotgunOscillator(180, 'square', 0.15, 0.5, 'bandpass');
            }, 500);
        };
        
        // 壁反射音 - スーパーショットガン専用（高級感）
        this.sounds.wallBounce = () => {
            if (!this.audioContext) return;
            
            // 高級金属反響音
            const metalPing = this.audioContext.createOscillator();
            const metalGain = this.audioContext.createGain();
            const metalFilter = this.audioContext.createBiquadFilter();
            
            metalPing.frequency.setValueAtTime(2200, this.audioContext.currentTime);
            metalPing.frequency.exponentialRampToValueAtTime(1100, this.audioContext.currentTime + 0.15);
            metalPing.type = 'triangle';
            
            metalFilter.type = 'bandpass';
            metalFilter.frequency.setValueAtTime(1800, this.audioContext.currentTime);
            metalFilter.Q.setValueAtTime(15, this.audioContext.currentTime);
            
            metalGain.gain.setValueAtTime(0.08, this.audioContext.currentTime);
            metalGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
            
            metalPing.connect(metalFilter);
            metalFilter.connect(metalGain);
            metalGain.connect(this.audioContext.destination);
            
            metalPing.start();
            metalPing.stop(this.audioContext.currentTime + 0.2);
            
            // エコー効果
            setTimeout(() => {
                if (!this.audioContext) return;
                
                const echo = this.audioContext.createOscillator();
                const echoGain = this.audioContext.createGain();
                
                echo.frequency.setValueAtTime(1400, this.audioContext.currentTime);
                echo.type = 'sine';
                
                echoGain.gain.setValueAtTime(0.03, this.audioContext.currentTime);
                echoGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                
                echo.connect(echoGain);
                echoGain.connect(this.audioContext.destination);
                
                echo.start();
                echo.stop(this.audioContext.currentTime + 0.1);
            }, 50);
        };
    }
    
    /**
     * BGM用音楽フェーズ取得（StageSystem統合）
     * @returns {number} 音楽フェーズ番号 (0-4)
     */
    getBGMPhase() {
        // 🔒 安全性: 両方式で計算して検証
        const legacyPhase = this.getLegacyBGMPhase();
        
        if (this.game.stageSystem && this.game.stageSystem.isSystemReady()) {
            const stagePhase = this.game.stageSystem.getMusicPhase();
            
            // 🚨 重要: 結果比較でデバッグ
            if (legacyPhase !== stagePhase) {
                console.warn('AudioSystem: BGM Phase mismatch', {
                    legacy: legacyPhase,
                    stage: stagePhase,
                    wave: this.game.stats.wave,
                    stageInfo: this.game.stageSystem.getStageInfo()
                });
            }
            
            return stagePhase;
        }
        
        // フォールバック: 既存システム継続
        return legacyPhase;
    }
    
    /**
     * 既存ロジックを保持（バックアップ用）
     * @returns {number} レガシー音楽フェーズ番号 (0-8)
     * @private
     */
    getLegacyBGMPhase() {
        // ステージベースの音楽フェーズ（1ステージ = 4ウェーブ）
        return Math.min(Math.floor((this.game.stats.wave - 1) / 4), 8);
    }

    /**
     * BGMの開始
     * ウェーブに応じた動的な音楽を生成
     */
    startBGM() {
        if (!this.audioContext || this.isBGMPlaying) return;
        
        this.isBGMPlaying = true;
        
        // StageSystem統合: 安全なフェーズ取得
        let phase;
        try {
            phase = this.getBGMPhase();
        } catch (error) {
            console.error('AudioSystem: BGM Phase error, using fallback', error);
            phase = 0; // 安全なフォールバック
        }
        
        // フェーズ別コード進行とテンポ設定
        let chords, chordDuration, intensity;
        
        switch(phase) {
            case 0: // ステージ1 (ウェーブ1-4): アンビエント - 森林の静寂
                chords = [
                    [110, 146.83, 174.61, 220], // Am
                    [87.31, 116.54, 138.59, 174.61], // F
                    [130.81, 174.61, 207.65, 261.63], // C
                    [98, 130.81, 155.56, 196] // G
                ];
                chordDuration = 6.0; // 非常にゆっくり
                intensity = 0.018;
                break;
                
            case 1: // ステージ2 (ウェーブ5-8): ミニマル - 緊張の兆し
                chords = [
                    [146.83, 196, 233.08, 293.66], // Dm
                    [110, 146.83, 174.61, 220], // Am
                    [116.54, 155.56, 185, 233.08], // Bb
                    [87.31, 116.54, 138.59, 174.61] // F
                ];
                chordDuration = 4.8; // ゆっくり
                intensity = 0.022;
                break;
                
            case 2: // ステージ3 (ウェーブ9-12): エレクトロニカ - 戦闘開始
                chords = [
                    [164.81, 220, 261.63, 329.63], // Em
                    [130.81, 174.61, 207.65, 261.63], // C
                    [196, 261.63, 311.13, 392], // G
                    [146.83, 196, 233.08, 293.66] // D
                ];
                chordDuration = 3.5; // 普通
                intensity = 0.028;
                break;
                
            case 3: // ステージ4 (ウェーブ13-16): インダストリアル - 機械的威圧
                chords = [
                    [184.99, 246.94, 293.66, 369.99], // F#m
                    [146.83, 196, 233.08, 293.66], // D
                    [220, 293.66, 349.23, 440], // A
                    [164.81, 220, 261.63, 329.63] // E
                ];
                chordDuration = 2.8; // 少し速い
                intensity = 0.032;
                break;
                
            case 4: // ステージ5 (ウェーブ17-20): ダークアンビエント - 絶望の始まり
                chords = [
                    [138.59, 185, 220, 277.18], // C#m
                    [220, 293.66, 349.23, 440], // A
                    [164.81, 220, 261.63, 329.63], // E
                    [246.94, 329.63, 392, 493.88] // B
                ];
                chordDuration = 4.2; // 重厚にゆっくり
                intensity = 0.035;
                break;
                
            case 5: // ステージ6 (ウェーブ21-24): メタル - 怒りの爆発
                chords = [
                    [98, 130.81, 155.56, 196], // Gm
                    [155.56, 207.65, 246.94, 311.13], // Eb
                    [116.54, 155.56, 185, 233.08], // Bb
                    [87.31, 116.54, 138.59, 174.61] // F
                ];
                chordDuration = 2.2; // 速い
                intensity = 0.042;
                break;
                
            case 6: // ステージ7 (ウェーブ25-28): オーケストラル - 荘厳な最終局面
                chords = [
                    [55, 73.42, 87.31, 110], // Am (超低音)
                    [43.65, 58.27, 69.3, 87.31], // F
                    [65.41, 87.31, 103.83, 130.81], // C
                    [49, 65.41, 77.78, 98] // G
                ];
                chordDuration = 5.5; // 荘厳にゆっくり
                intensity = 0.048;
                break;
                
            case 7: // ステージ8 (ウェーブ29-32): カオス - 無調性の混沌
                chords = [
                    [73.42, 103.83, 138.59, 196], // 12音技法風
                    [82.41, 116.54, 155.56, 220],
                    [92.5, 130.81, 174.61, 246.94],
                    [87.31, 123.47, 164.81, 233.08]
                ];
                chordDuration = 1.8; // 非常に速い
                intensity = 0.055;
                break;
                
            default: // ステージ9+ (ウェーブ33+): ドローン - 超越的静寂
                chords = [
                    [32.7, 32.7, 32.7, 32.7], // C1 ドローン
                    [32.7, 32.7, 32.7, 32.7],
                    [32.7, 32.7, 32.7, 32.7],
                    [32.7, 32.7, 32.7, 32.7]
                ];
                chordDuration = 8.0; // 極めてゆっくり
                intensity = 0.025; // 静寂
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
                
                // ステージ別音色設定
                this.configureStageOscillator(oscillator, filterNode, phase, freq, index);
                
                // Volume control (フェーズに基づく音量調整)
                gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
                gainNode.gain.linearRampToValueAtTime((intensity * 2.5) / currentChord.length, this.audioContext.currentTime + 0.1);
                
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
    
    /**
     * BGMの停止
     */
    stopBGM() {
        this.isBGMPlaying = false;
        
        this.bgmOscillators.forEach(osc => {
            try {
                osc.stop();
            } catch (e) {}
        });
        this.bgmOscillators = [];
    }
    
    /**
     * ステージ別オシレーター設定
     * @param {OscillatorNode} oscillator - オシレーターノード
     * @param {BiquadFilterNode} filterNode - フィルターノード
     * @param {number} phase - 音楽フェーズ
     * @param {number} freq - 周波数
     * @param {number} index - コード内のインデックス
     */
    configureStageOscillator(oscillator, filterNode, phase, freq, index) {
        oscillator.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        
        switch(phase) {
            case 0: // ステージ1: アンビエント - 自然音
                oscillator.type = 'sine'; // 柔らかい音色
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(400, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(2, this.audioContext.currentTime);
                break;
                
            case 1: // ステージ2: ミニマル - クリーンな電子音
                oscillator.type = 'triangle';
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(600, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(3, this.audioContext.currentTime);
                break;
                
            case 2: // ステージ3: エレクトロニカ - LFO付きシンセ
                oscillator.type = index < 2 ? 'sawtooth' : 'square';
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(800 + Math.sin(Date.now() * 0.002) * 300, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(5, this.audioContext.currentTime);
                
                // LFO追加
                if (index === 0) {
                    this.addLFO(oscillator, freq);
                }
                break;
                
            case 3: // ステージ4: インダストリアル - 無機質な音
                oscillator.type = 'square';
                filterNode.type = 'bandpass';
                filterNode.frequency.setValueAtTime(1200, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(8, this.audioContext.currentTime);
                break;
                
            case 4: // ステージ5: ダークアンビエント - 歪んだ音
                oscillator.type = 'sawtooth';
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(500, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(12, this.audioContext.currentTime);
                
                // ディストーション効果
                this.addDistortion(oscillator, filterNode);
                break;
                
            case 5: // ステージ6: メタル - 激しく歪んだ音
                oscillator.type = 'sawtooth';
                filterNode.type = 'highpass';
                filterNode.frequency.setValueAtTime(800, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(15, this.audioContext.currentTime);
                
                // 強いディストーション
                this.addDistortion(oscillator, filterNode, 2.0);
                break;
                
            case 6: // ステージ7: オーケストラル - 豊かな倍音
                oscillator.type = index < 2 ? 'sine' : 'triangle';
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(1000, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(3, this.audioContext.currentTime);
                
                // リバーブ模擬
                this.addReverb(oscillator, filterNode);
                break;
                
            case 7: // ステージ8: カオス - ランダム変調
                oscillator.type = ['sine', 'square', 'sawtooth', 'triangle'][index % 4];
                filterNode.type = 'bandpass';
                filterNode.frequency.setValueAtTime(
                    800 + Math.random() * 1200, 
                    this.audioContext.currentTime
                );
                filterNode.Q.setValueAtTime(10 + Math.random() * 10, this.audioContext.currentTime);
                
                // ランダム周波数変調
                this.addRandomModulation(oscillator, freq);
                break;
                
            default: // ステージ9+: ドローン - 純粋なドローン
                oscillator.type = 'sine';
                filterNode.type = 'lowpass';
                filterNode.frequency.setValueAtTime(100, this.audioContext.currentTime);
                filterNode.Q.setValueAtTime(1, this.audioContext.currentTime);
                break;
        }
    }
    
    /**
     * LFO (Low Frequency Oscillator) 追加
     * @param {OscillatorNode} oscillator - 対象オシレーター
     * @param {number} baseFreq - 基本周波数
     */
    addLFO(oscillator, baseFreq) {
        const lfo = this.audioContext.createOscillator();
        const lfoGain = this.audioContext.createGain();
        
        lfo.frequency.setValueAtTime(0.5, this.audioContext.currentTime); // 0.5Hz LFO
        lfo.type = 'sine';
        lfoGain.gain.setValueAtTime(baseFreq * 0.03, this.audioContext.currentTime); // 3% modulation
        
        lfo.connect(lfoGain);
        lfoGain.connect(oscillator.frequency);
        
        lfo.start();
        this.bgmOscillators.push(lfo);
    }
    
    /**
     * ディストーション効果追加
     * @param {OscillatorNode} oscillator - 対象オシレーター
     * @param {BiquadFilterNode} filterNode - フィルターノード
     * @param {number} intensity - ディストーション強度
     */
    addDistortion(oscillator, filterNode, intensity = 1.0) {
        const waveshaper = this.audioContext.createWaveShaper();
        const curve = new Float32Array(65536);
        const deg = Math.PI / 180;
        
        for (let i = 0; i < 32768; i++) {
            const x = (i - 16384) / 16384;
            curve[i + 32768] = ((3 + intensity) * x * 20 * deg) / (Math.PI + intensity * Math.abs(x));
        }
        
        waveshaper.curve = curve;
        waveshaper.oversample = '4x';
        
        oscillator.disconnect(filterNode);
        oscillator.connect(waveshaper);
        waveshaper.connect(filterNode);
    }
    
    /**
     * リバーブ模擬効果追加
     * @param {OscillatorNode} oscillator - 対象オシレーター
     * @param {BiquadFilterNode} filterNode - フィルターノード
     */
    addReverb(oscillator, filterNode) {
        const delay = this.audioContext.createDelay(0.3);
        const feedback = this.audioContext.createGain();
        const wetGain = this.audioContext.createGain();
        
        delay.delayTime.setValueAtTime(0.15, this.audioContext.currentTime);
        feedback.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        wetGain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        
        filterNode.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);
        wetGain.connect(this.audioContext.destination);
    }
    
    /**
     * ランダム変調追加
     * @param {OscillatorNode} oscillator - 対象オシレーター
     * @param {number} baseFreq - 基本周波数
     */
    addRandomModulation(oscillator, baseFreq) {
        setInterval(() => {
            if (this.isBGMPlaying) {
                const randomOffset = (Math.random() - 0.5) * baseFreq * 0.1;
                oscillator.frequency.setTargetAtTime(
                    baseFreq + randomOffset,
                    this.audioContext.currentTime,
                    0.1
                );
            }
        }, 200 + Math.random() * 300);
    }
}