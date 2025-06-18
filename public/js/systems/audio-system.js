/**
 * SimpleToneAudioSystem - 効果音専用Tone.jsシステム
 * BGM機能を完全削除し、効果音のみに特化したシンプルなオーディオシステム
 */
export class SimpleToneAudioSystem {
    constructor(game) {
        this.game = game;
        
        // システム状態
        this.isInitialized = false;
        this.isToneReady = false;
        
        // 音量設定（BGM削除、効果音のみ）
        this.volumeSettings = {
            master: 0.8,
            sfx: 0.7
        };
        
        // Tone.js音源管理（効果音のみ）
        this.toneSynths = {};
        this.sounds = {};
        
        // フォールバック用（Web Audio API直接）
        this.audioContext = null;
        this.fallbackMode = false;
        
        // パフォーマンス測定
        this.performanceMetrics = {
            initTime: 0,
            avgPlayTime: 0,
            playCount: 0,
            errorCount: 0,
            concurrentSounds: 0,
            maxConcurrentSounds: 0
        };
        
        // モバイル最適化設定
        this.isMobile = this.detectMobile();
        this.mobileOptimizations = {
            maxConcurrentSounds: this.isMobile ? 3 : 6,  // BGM削除により削減
            reducedQuality: this.isMobile,
            adaptiveBuffer: this.isMobile
        };
        
        // 強化射撃音システム設定
        this.shootSoundConfig = {
            // 武器別設定
            weapons: {
                plasma: {
                    baseFreq: 800,
                    filterRange: [800, 2000],
                    pitchVariation: 0.2,
                    duration: 0.08,
                    character: 'sharp'
                },
                nuke: {
                    baseFreq: 300,
                    filterRange: [200, 800],
                    pitchVariation: 0.1,
                    duration: 0.25,
                    character: 'heavy'
                },
                superHoming: {
                    baseFreq: 600,
                    filterRange: [500, 1500],
                    pitchVariation: 0.15,
                    duration: 0.12,
                    character: 'electronic'
                },
                superShotgun: {
                    baseFreq: 400,
                    filterRange: [300, 2000],
                    pitchVariation: 0.08,
                    duration: 0.08,
                    character: 'explosive'
                }
            },
            // コンボ連動設定
            comboEffects: {
                0: { intensity: 1.0, reverb: 0.0, filter: 1.0 },
                6: { intensity: 1.1, reverb: 0.1, filter: 1.2 },
                16: { intensity: 1.3, reverb: 0.2, filter: 1.5 },
                26: { intensity: 1.5, reverb: 0.3, filter: 2.0 }
            }
        };
        
        // エフェクトチェーン管理
        this.shootEffects = {};
        
        // 保存された設定を読み込み
        this.loadVolumeSettings();
        
        // エフェクト音初期化（sounds オブジェクト作成）
        this.initializeEffectSounds();
        
        console.log('🎵 SimpleToneAudioSystem: Initializing enhanced sound effects system...');
    }
    
    /**
     * モバイルデバイス検出
     */
    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
    
    /**
     * システム初期化
     */
    async initAudio() {
        const startTime = performance.now();
        
        try {
            // Tone.js可用性チェック
            if (typeof Tone === 'undefined') {
                console.warn('🎵 SimpleToneAudioSystem: Tone.js not available, falling back to Web Audio API');
                await this.initFallbackMode();
                return;
            }
            
            // Tone.js初期化
            console.log('🎵 SimpleToneAudioSystem: Initializing Tone.js...');
            await this.initToneSystem();
            
            // 効果音作成（BGMシンセサイザー削除）
            await this.createSoundEffects();
            
            this.isInitialized = true;
            this.isToneReady = true;
            
            // パフォーマンス測定
            this.performanceMetrics.initTime = performance.now() - startTime;
            
            console.log('✅ SimpleToneAudioSystem: Initialization completed', {
                initTime: `${this.performanceMetrics.initTime.toFixed(2)}ms`,
                toneVersion: Tone.version,
                soundEffectsCreated: Object.keys(this.sounds).length,
                mobileOptimized: this.isMobile
            });
            
        } catch (error) {
            console.error('❌ SimpleToneAudioSystem: Initialization failed:', error);
            this.performanceMetrics.errorCount++;
            
            // フォールバックモードに切り替え
            await this.initFallbackMode();
        }
    }
    
    /**
     * Tone.jsシステム初期化
     */
    async initToneSystem() {
        try {
            // Tone.jsコンテキスト開始（ユーザー操作が必要）
            if (Tone.context.state !== 'running') {
                console.log('🎵 SimpleToneAudioSystem: Starting Tone.js context...');
                await Tone.start();
            }
            
            // Tone.js設定最適化
            Tone.context.lookAhead = this.isMobile ? 0.05 : 0.1;
            Tone.context.updateInterval = this.isMobile ? 0.05 : 0.025;
            
            console.log('✅ SimpleToneAudioSystem: Tone.js context ready');
            
        } catch (error) {
            throw new Error(`Tone.js context initialization failed: ${error.message}`);
        }
    }
    
    /**
     * オーディオコンテキスト再開（ボタンクリック等のユーザー操作用）
     * 既存のgame.jsコードとの互換性を保つためのメソッド
     */
    async resumeAudioContext() {
        try {
            console.log('🎵 SimpleToneAudioSystem: resumeAudioContext() called');
            
            // 初期化されていない場合は初期化を実行
            if (!this.isInitialized) {
                console.log('🎵 System not initialized, running initAudio()...');
                await this.initAudio();
                return;
            }
            
            // フォールバックモードの場合
            if (this.fallbackMode && this.audioContext) {
                if (this.audioContext.state === 'suspended') {
                    console.log('🎵 Resuming Web Audio API context...');
                    await this.audioContext.resume();
                    console.log('✅ Web Audio API context resumed');
                }
                return;
            }
            
            // Tone.js使用時
            if (typeof Tone !== 'undefined') {
                if (Tone.context.state !== 'running') {
                    console.log('🎵 Starting Tone.js context...');
                    await Tone.start();
                    console.log('✅ Tone.js context started');
                } else {
                    console.log('🎵 Tone.js context already running');
                }
                return;
            }
            
            console.log('🎵 No audio context to resume');
            
        } catch (error) {
            console.error('❌ SimpleToneAudioSystem: resumeAudioContext failed:', error);
            this.performanceMetrics.errorCount++;
            
            // エラーが発生してもPromiseをrejectしない（既存コードの互換性）
            console.log('🎵 Continuing despite audio context resume error');
        }
    }
    
    /**
     * 強化射撃音システム作成
     */
    async createEnhancedShootSounds() {
        try {
            console.log('🎵 Creating enhanced shoot sound system...');
            
            // 武器別シンセサイザーとエフェクトチェーン作成
            this.shootSynths = {};
            this.shootEffects = {};
            
            // 各武器のシンセサイザーとエフェクト作成
            for (const [weaponType, config] of Object.entries(this.shootSoundConfig.weapons)) {
                await this.createWeaponShootSound(weaponType, config);
            }
            
            console.log('✅ Enhanced shoot sound system created');
            
        } catch (error) {
            console.error('❌ Enhanced shoot sound creation failed:', error);
            throw error;
        }
    }
    
    /**
     * 武器別射撃音作成
     */
    async createWeaponShootSound(weaponType, config) {
        try {
            // 武器特性に応じたシンセサイザー作成
            let baseSynth;
            
            switch (config.character) {
                case 'sharp': // Plasma - シャープな射撃音
                    baseSynth = new Tone.NoiseSynth({
                        volume: -15,
                        noise: { type: 'pink' },
                        envelope: {
                            attack: 0.001,
                            decay: 0.05,
                            sustain: 0,
                            release: 0.1
                        }
                    });
                    break;
                    
                case 'heavy': // Nuke - 重厚な射撃音
                    baseSynth = new Tone.FMSynth({
                        volume: -12,
                        harmonicity: 0.3,
                        modulationIndex: 3,
                        envelope: {
                            attack: 0.01,
                            decay: 0.2,
                            sustain: 0.1,
                            release: 0.3
                        }
                    });
                    break;
                    
                case 'electronic': // SuperHoming - 電子的射撃音
                    baseSynth = new Tone.Synth({
                        volume: -13,
                        oscillator: { type: 'sawtooth' },
                        envelope: {
                            attack: 0.001,
                            decay: 0.08,
                            sustain: 0,
                            release: 0.12
                        }
                    });
                    break;
                    
                case 'explosive': // SuperShotgun - 爆発的射撃音
                    baseSynth = new Tone.NoiseSynth({
                        volume: -11,
                        noise: { type: 'white' },
                        envelope: {
                            attack: 0.001,
                            decay: 0.06,
                            sustain: 0,
                            release: 0.08
                        }
                    });
                    break;
                    
                default:
                    baseSynth = new Tone.NoiseSynth({
                        volume: -15,
                        noise: { type: 'pink' }
                    });
            }
            
            // エフェクトチェーン作成
            const filter = new Tone.Filter({
                frequency: config.baseFreq,
                type: 'lowpass',
                Q: 1
            });
            
            const reverb = new Tone.Reverb({
                decay: 0.8,
                wet: 0
            });
            
            const compressor = new Tone.Compressor({
                threshold: -18,
                ratio: 6,
                attack: 0.001,
                release: 0.1
            });
            
            // エフェクトチェーン接続
            baseSynth.chain(filter, reverb, compressor, Tone.Destination);
            
            // 武器別に保存
            this.shootSynths[weaponType] = baseSynth;
            this.shootEffects[weaponType] = {
                filter: filter,
                reverb: reverb,
                compressor: compressor,
                config: config
            };
            
            console.log(`🔫 Created ${weaponType} shoot sound (${config.character})`);
            
        } catch (error) {
            console.error(`❌ Failed to create ${weaponType} shoot sound:`, error);
            throw error;
        }
    }
    
    /**
     * 効果音作成（BGM関連削除）
     */
    async createSoundEffects() {
        try {
            console.log('🎵 SimpleToneAudioSystem: Creating sound effects...');
            
            // 強化射撃音システム作成
            await this.createEnhancedShootSounds();
            
            // 効果音専用シンセサイザー作成
            this.toneSynths = {
                
                // リロード音用
                reloadSynth: new Tone.PluckSynth({
                    volume: -10,
                    attackNoise: 1,
                    dampening: 3000,
                    resonance: 0.8
                }).toDestination(),
                
                // アイテム取得音用
                pickupSynth: new Tone.Synth({
                    volume: -8,
                    oscillator: { type: 'triangle' },
                    envelope: {
                        attack: 0.01,
                        decay: 0.2,
                        sustain: 0,
                        release: 0.3
                    }
                }).toDestination(),
                
                // 敵死亡音用
                enemyDeathSynth: new Tone.FMSynth({
                    volume: -12,
                    harmonicity: 0.5,
                    modulationIndex: 2,
                    envelope: {
                        attack: 0.01,
                        decay: 0.3,
                        sustain: 0,
                        release: 0.5
                    }
                }).toDestination(),
                
                // レベルアップ音用（和音対応PolySynth）
                levelUpSynth: new Tone.PolySynth(Tone.Synth, {
                    volume: -10,  // 和音の音量加算を考慮して-6から-10に調整
                    maxPolyphony: 6,  // 最大6音同時再生（メモリ効率とクオリティのバランス）
                    voice: {
                        oscillator: { type: 'sine' },
                        envelope: {
                            attack: 0.08,   // 0.1→0.08 若干クイックなアタック
                            decay: 0.25,    // 0.3→0.25 少し短めのディケイ
                            sustain: 0.2,   // 0.3→0.2 和音クリアネスのためサスティン減
                            release: 0.8    // 1.0→0.8 リリース短縮で次音との重複減
                        }
                    }
                }).toDestination(),
                
                // ダメージ音用
                damageSynth: new Tone.NoiseSynth({
                    volume: -8,
                    noise: { type: 'brown' },
                    envelope: {
                        attack: 0.001,
                        decay: 0.1,
                        sustain: 0,
                        release: 0.2
                    }
                }).toDestination()
            };
            
            // 効果音メソッド作成
            this.sounds = {
                shoot: (weaponType = 'plasma') => this.playEnhancedShootSound(weaponType),
                reload: () => this.playReloadSound(),
                pickup: () => this.playPickupSound(),
                enemyDeath: () => this.playEnemyDeathSound(),
                levelUp: () => this.playLevelUpSound(),
                damage: () => this.playDamageSound()
            };
            
            console.log('✅ SimpleToneAudioSystem: Sound effects created');
            
        } catch (error) {
            throw new Error(`Sound effects creation failed: ${error.message}`);
        }
    }
    
    /**
     * フォールバックモード初期化（Web Audio API直接）
     */
    async initFallbackMode() {
        try {
            console.log('🎵 SimpleToneAudioSystem: Initializing fallback mode...');
            
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.fallbackMode = true;
            
            // フォールバック用効果音作成
            this.sounds = {
                shoot: (weaponType = 'plasma') => this.playFallbackShoot(weaponType),
                reload: () => this.playFallbackReload(),
                pickup: () => this.playFallbackPickup(),
                enemyDeath: () => this.playFallbackEnemyDeath(),
                levelUp: () => this.playFallbackLevelUp(),
                damage: () => this.playFallbackDamage()
            };
            
            this.isInitialized = true;
            console.log('✅ SimpleToneAudioSystem: Fallback mode ready');
            
        } catch (error) {
            console.error('❌ SimpleToneAudioSystem: Fallback mode failed:', error);
            this.performanceMetrics.errorCount++;
        }
    }
    
    // ===== 効果音再生メソッド（Tone.js） =====
    
    /**
     * 強化射撃音再生
     * @param {string} weaponType - 武器タイプ (plasma, nuke, superHoming, superShotgun)
     */
    playEnhancedShootSound(weaponType = 'plasma') {
        // 🔧 基本準備状態チェック
        if (!this.isToneReady) {
            return this.playFallbackShoot(weaponType);
        }
        
        // 🔧 完全性チェック: 必要オブジェクトの存在確認
        if (!this.shootSynths || !this.shootEffects || !this.shootSoundConfig || !this.shootSoundConfig.weapons) {
            console.warn('🔫 Enhanced shoot sound system not fully initialized, using fallback');
            return this.playFallbackShoot(weaponType);
        }
        
        // 🔧 スコープ修正: エラーデバッグ用変数をtry-catch外で定義
        let comboCount = 0;
        let skillLevel = 0;
        
        try {
            // 武器タイプチェック & フォールバック処理
            if (!this.shootSynths[weaponType]) {
                console.warn(`🔫 Unknown weapon type: ${weaponType}, falling back to plasma`);
                weaponType = 'plasma';
                
                // プラズマも存在しない場合はフォールバック
                if (!this.shootSynths[weaponType]) {
                    console.warn('🔫 Even plasma synth not available, using fallback');
                    return this.playFallbackShoot(weaponType);
                }
            }
            
            // ゲーム状態取得（変数に代入）
            comboCount = this.game?.combo?.count || 0;
            skillLevel = this.game?.player?.skillLevels?.damage || 0;
            
            // 射撃音設定取得
            const config = this.shootSoundConfig.weapons[weaponType];
            const effects = this.shootEffects[weaponType];
            
            // コンボエフェクト計算
            const comboEffect = this.getComboEffect(comboCount);
            
            // ランダムバリエーション
            const pitchVariation = 1 + (Math.random() - 0.5) * config.pitchVariation;
            const filterVariation = config.filterRange[0] + 
                Math.random() * (config.filterRange[1] - config.filterRange[0]);
            
            // エフェクト設定適用
            if (effects.filter) {
                // フィルタースイープ
                const targetFreq = filterVariation * comboEffect.filter;
                effects.filter.frequency.setValueAtTime(config.baseFreq, Tone.now());
                effects.filter.frequency.exponentialRampToValueAtTime(targetFreq, Tone.now() + 0.05);
            }
            
            if (effects.reverb) {
                effects.reverb.wet.value = comboEffect.reverb;
            }
            
            // 音量調整（スキルレベル連動）
            const volumeBoost = 1 + (skillLevel - 1) * 0.1; // レベル毎に10%向上
            const finalVolume = -15 + (volumeBoost - 1) * 10;
            
            // 射撃音再生
            const synth = this.shootSynths[weaponType];
            
            if (config.character === 'heavy' || config.character === 'electronic') {
                // 音程のある武器
                const baseNote = config.character === 'heavy' ? 'C2' : 'C4';
                synth.triggerAttackRelease(baseNote, config.duration, Tone.now(), pitchVariation);
            } else {
                // ノイズベース武器
                synth.triggerAttackRelease(config.duration, Tone.now());
            }
            
            // スーパーショットガンの特殊処理（複数発射音）
            if (weaponType === 'superShotgun') {
                // 散弾効果のため少し遅延して追加音
                setTimeout(() => {
                    const variation = 0.9 + Math.random() * 0.2;
                    synth.triggerAttackRelease(config.duration * 0.8, Tone.now(), variation);
                }, 10);
                setTimeout(() => {
                    const variation = 0.8 + Math.random() * 0.4;
                    synth.triggerAttackRelease(config.duration * 0.6, Tone.now(), variation);
                }, 20);
            }
            
            this.updatePerformanceMetrics();
            
            // パフォーマンス統計更新（デバッグログは高コンボ時のみ）
            if (comboCount > 0 && comboCount % 20 === 0) {
                console.log(`🔫 Enhanced ${weaponType} shot (Combo: ${comboCount}, Skill: ${skillLevel})`);
            }
            
        } catch (error) {
            console.warn('🎵 Enhanced shoot sound failed:', error);
            this.performanceMetrics.errorCount++;
            
            // 詳細なエラー情報をログ（デバッグ用）
            if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
                console.error('Audio error details:', {
                    weaponType,
                    comboCount,
                    skillLevel,
                    isToneReady: this.isToneReady,
                    error: error.message
                });
            }
            
            // フォールバック（武器タイプ対応）
            this.playFallbackShoot(weaponType);
        }
    }
    
    /**
     * コンボエフェクト計算
     * @param {number} comboCount - 現在のコンボ数
     * @returns {Object} エフェクト設定
     */
    getComboEffect(comboCount) {
        const effects = this.shootSoundConfig.comboEffects;
        
        // 該当するコンボレベル検索
        let currentEffect = effects[0]; // デフォルト
        
        for (const [threshold, effect] of Object.entries(effects)) {
            if (comboCount >= parseInt(threshold)) {
                currentEffect = effect;
            }
        }
        
        return currentEffect;
    }
    
    /**
     * 旧式射撃音（互換性維持）
     */
    playShootSound() {
        return this.playEnhancedShootSound('plasma');
    }
    
    playReloadSound() {
        if (!this.isToneReady) return this.sounds?.reload && this.playFallbackReload();
        
        try {
            this.toneSynths.reloadSynth.triggerAttackRelease('C4', '4n', Tone.now());
            this.updatePerformanceMetrics();
        } catch (error) {
            console.warn('🎵 Reload sound failed:', error);
        }
    }
    
    playPickupSound() {
        if (!this.isToneReady) return this.sounds?.pickup && this.playFallbackPickup();
        
        try {
            const notes = ['C5', 'E5', 'G5'];
            notes.forEach((note, index) => {
                this.toneSynths.pickupSynth.triggerAttackRelease(note, '16n', Tone.now() + index * 0.1);
            });
            this.updatePerformanceMetrics();
        } catch (error) {
            console.warn('🎵 Pickup sound failed:', error);
        }
    }
    
    playEnemyDeathSound() {
        if (!this.isToneReady) return this.sounds?.enemyDeath && this.playFallbackEnemyDeath();
        
        try {
            this.toneSynths.enemyDeathSynth.triggerAttackRelease('G2', '4n', Tone.now());
            this.updatePerformanceMetrics();
        } catch (error) {
            console.warn('🎵 Enemy death sound failed:', error);
        }
    }
    
    playLevelUpSound() {
        if (!this.isToneReady) return this.sounds?.levelUp && this.playFallbackLevelUp();
        
        try {
            const synth = this.toneSynths.levelUpSynth;
            
            // PolySynth対応確認
            if (!synth) {
                console.warn('🎵 levelUpSynth not available for level up sound');
                return this.playFallbackLevelUp();
            }
            
            const melody = ['C4', 'E4', 'G4', 'C5'];
            
            // PolySynth互換性確認 - triggerAttackRelease存在チェック
            if (typeof synth.triggerAttackRelease !== 'function') {
                console.warn('🎵 PolySynth triggerAttackRelease not available');
                return this.playFallbackLevelUp();
            }
            
            // 順次単音再生（PolySynth対応）
            melody.forEach((note, index) => {
                try {
                    synth.triggerAttackRelease(note, '8n', Tone.now() + index * 0.2);
                } catch (noteError) {
                    console.warn(`🎵 Note ${note} playback failed:`, noteError);
                    // 個別音符失敗は継続
                }
            });
            
            this.updatePerformanceMetrics();
            console.log('🎵 Level up melody played successfully');
            
        } catch (error) {
            console.warn('🎵 Level up sound failed, using fallback:', error);
            this.playFallbackLevelUp();
        }
    }
    
    playDamageSound() {
        if (!this.isToneReady) return this.sounds?.damage && this.playFallbackDamage();
        
        try {
            this.toneSynths.damageSynth.triggerAttackRelease('16n', Tone.now());
            this.updatePerformanceMetrics();
        } catch (error) {
            console.warn('🎵 Damage sound failed:', error);
        }
    }
    
    // ===== フォールバック効果音（Web Audio API直接） =====
    
    /**
     * フォールバック射撃音（武器別対応）
     * @param {string} weaponType - 武器タイプ
     */
    playFallbackShoot(weaponType = 'plasma') {
        // 武器別フォールバック音設定
        const fallbackConfig = {
            plasma: { freq: 220, duration: 0.05, type: 'sawtooth' },
            nuke: { freq: 120, duration: 0.15, type: 'square' },
            superHoming: { freq: 330, duration: 0.08, type: 'triangle' },
            superShotgun: { freq: 180, duration: 0.06, type: 'sawtooth' }
        };
        
        const config = fallbackConfig[weaponType] || fallbackConfig.plasma;
        
        // バリエーション追加
        const variation = 0.9 + Math.random() * 0.2;
        const frequency = config.freq * variation;
        
        this.createBeep(frequency, config.duration, config.type);
        
        // スーパーショットガンは複数音
        if (weaponType === 'superShotgun') {
            setTimeout(() => {
                this.createBeep(frequency * 0.8, config.duration * 0.8, config.type);
            }, 10);
        }
    }
    
    playFallbackReload() {
        this.createBeep(330, 0.2, 'square');
    }
    
    playFallbackPickup() {
        setTimeout(() => this.createBeep(523, 0.1, 'triangle'), 0);
        setTimeout(() => this.createBeep(659, 0.1, 'triangle'), 100);
        setTimeout(() => this.createBeep(784, 0.1, 'triangle'), 200);
    }
    
    playFallbackEnemyDeath() {
        this.createBeep(196, 0.3, 'sawtooth');
    }
    
    playFallbackLevelUp() {
        const notes = [262, 330, 392, 523];
        notes.forEach((freq, index) => {
            setTimeout(() => this.createBeep(freq, 0.15, 'sine'), index * 150);
        });
    }
    
    playFallbackDamage() {
        this.createBeep(150, 0.1, 'sawtooth');
    }
    
    /**
     * Web Audio APIビープ音作成
     */
    createBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = type;
            
            const volume = this.getCalculatedVolume('sfx');
            gainNode.gain.setValueAtTime(volume * 0.1, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
            
            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
            
            this.updatePerformanceMetrics();
            
        } catch (error) {
            console.warn('🎵 Fallback beep failed:', error);
        }
    }
    
    // ===== 音量制御（BGM削除） =====
    
    /**
     * 音量設定
     * @param {string} type - 'master' または 'sfx'のみ
     * @param {number} volume - 音量（0-1）
     */
    setVolume(type, volume) {
        if (!['master', 'sfx'].includes(type)) {
            console.warn(`🎵 SimpleToneAudioSystem: Invalid volume type: ${type}`);
            return;
        }
        
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        this.saveVolumeSettings();
        
        console.log(`🎵 SimpleToneAudioSystem: Volume set - ${type}: ${(volume * 100).toFixed(0)}%`);
    }
    
    /**
     * 音量取得
     */
    getVolume(type) {
        return this.volumeSettings[type] || 0;
    }
    
    /**
     * 計算された最終音量取得
     */
    getCalculatedVolume(type) {
        const master = this.volumeSettings.master || 0;
        const specific = this.volumeSettings[type] || 0;
        return master * specific;
    }
    
    /**
     * ミュート設定
     */
    setMute(type, isMuted) {
        if (isMuted) {
            this.volumeSettings[`${type}_backup`] = this.volumeSettings[type];
            this.setVolume(type, 0);
        } else {
            const backupVolume = this.volumeSettings[`${type}_backup`] || 0.7;
            this.setVolume(type, backupVolume);
            delete this.volumeSettings[`${type}_backup`];
        }
    }
    
    // ===== 設定管理 =====
    
    /**
     * 音量設定保存
     */
    saveVolumeSettings() {
        try {
            const settings = {
                master: this.volumeSettings.master,
                sfx: this.volumeSettings.sfx
            };
            localStorage.setItem('audioSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('🎵 Failed to save volume settings:', error);
        }
    }
    
    /**
     * 音量設定読み込み
     */
    loadVolumeSettings() {
        try {
            const saved = localStorage.getItem('audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.volumeSettings.master = settings.master || 0.8;
                this.volumeSettings.sfx = settings.sfx || 0.7;
                
                console.log('🎵 SimpleToneAudioSystem: Volume settings loaded', this.volumeSettings);
            }
        } catch (error) {
            console.warn('🎵 Failed to load volume settings:', error);
        }
    }
    
    // ===== パフォーマンス管理 =====
    
    updatePerformanceMetrics() {
        this.performanceMetrics.playCount++;
        this.performanceMetrics.concurrentSounds++;
        
        // 同時再生数制限（モバイル最適化）
        if (this.performanceMetrics.concurrentSounds > this.mobileOptimizations.maxConcurrentSounds) {
            console.warn('🎵 Max concurrent sounds reached, skipping sound');
            return false;
        }
        
        // 最大同時再生数を記録
        this.performanceMetrics.maxConcurrentSounds = Math.max(
            this.performanceMetrics.maxConcurrentSounds,
            this.performanceMetrics.concurrentSounds
        );
        
        // 同時再生数をリセット（モバイルは短縮）
        const resetDelay = this.isMobile ? 80 : 100;
        setTimeout(() => {
            this.performanceMetrics.concurrentSounds = Math.max(0, this.performanceMetrics.concurrentSounds - 1);
        }, resetDelay);
        
        return true;
    }
    
    /**
     * パフォーマンス統計取得
     */
    getPerformanceStats() {
        return {
            ...this.performanceMetrics,
            isToneReady: this.isToneReady,
            fallbackMode: this.fallbackMode,
            volumeSettings: { ...this.volumeSettings }
        };
    }
    
    /**
     * 🔄 AudioSystemメインループ更新処理
     * @param {number} deltaTime - フレーム時間（秒）
     */
    update(deltaTime) {
        try {
            // 🎯 軽量処理のみ：効果音専用システム用
            
            // 1. パフォーマンス統計更新
            this.performanceMetrics.concurrentSounds = Object.keys(this.sounds).length;
            if (this.performanceMetrics.concurrentSounds > this.performanceMetrics.maxConcurrentSounds) {
                this.performanceMetrics.maxConcurrentSounds = this.performanceMetrics.concurrentSounds;
            }
            
            // 2. エラー状態監視
            if (this.performanceMetrics.errorCount > 10) {
                // エラーが多い場合はフォールバックモードに切り替え
                if (!this.fallbackMode) {
                    console.warn('🎵 AudioSystem: High error count, switching to fallback mode');
                    this.fallbackMode = true;
                }
            }
            
            // 3. モバイル最適化：定期的なメモリクリーンアップ
            if (this.isMobile && Math.random() < 0.01) { // 1%の確率で実行
                this.performMobileCleanup();
            }
            
        } catch (error) {
            console.warn('🎵 AudioSystem update error:', error);
            this.performanceMetrics.errorCount++;
        }
    }
    
    /**
     * 🔊 オーディオコンテキスト再開
     */
    async resumeAudioContext() {
        try {
            // Tone.js コンテキスト再開
            if (this.isToneReady && Tone.context.state !== 'running') {
                await Tone.start();
                console.log('🎵 AudioSystem: Tone.js context resumed');
            }
            
            // Web Audio API コンテキスト再開
            if (this.audioContext && this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
                console.log('🎵 AudioSystem: Web Audio context resumed');
            }
            
        } catch (error) {
            console.warn('🎵 AudioSystem: Context resume error:', error);
        }
    }
    
    /**
     * 🎵 BGM関連メソッド群（互換性維持用）
     * 注意：SimpleToneAudioSystemは効果音専用のため、BGMは無効化されています
     */
    
    /**
     * BGM開始（互換性維持用 - No-op）
     */
    async startBGM() {
        console.log('🎵 AudioSystem: BGM start requested (effects-only system - no BGM)');
        // BGM機能は無効化済み、ログのみ出力
    }
    
    /**
     * BGM停止（互換性維持用 - No-op）
     */
    stopBGM() {
        console.log('🎵 AudioSystem: BGM stop requested (effects-only system - no BGM)');
        // BGM機能は無効化済み、ログのみ出力
    }
    
    /**
     * ステージ1音楽有効化（互換性維持用 - No-op）
     */
    enableStage1Music() {
        console.log('🎵 AudioSystem: Stage1 music enable requested (effects-only system - no BGM)');
        // BGM機能は無効化済み、ログのみ出力
    }
    
    /**
     * ステージ1音楽無効化（互換性維持用 - No-op）
     */
    disableStage1Music() {
        console.log('🎵 AudioSystem: Stage1 music disable requested (effects-only system - no BGM)');
        // BGM機能は無効化済み、ログのみ出力
    }
    
    /**
     * 🎮 ゲームイベントハンドリング
     * @param {string} eventType - イベントタイプ
     * @param {Object} data - イベントデータ
     */
    onGameEvent(eventType, data = {}) {
        try {
            switch (eventType) {
                case 'ENEMY_DEFEAT':
                    this.playEnemyDeathSound();
                    break;
                case 'PLAYER_DAMAGE':
                    this.playDamageSound();
                    break;
                case 'LEVEL_UP':
                    this.playLevelUpSound();
                    break;
                case 'WAVE_COMPLETE':
                    this.playWaveCompleteSound();
                    break;
                default:
                    console.log(`🎵 AudioSystem: Unknown event type: ${eventType}`);
            }
        } catch (error) {
            console.warn('🎵 AudioSystem: Event handling error:', error);
        }
    }
    
    /**
     * 🌊 ウェーブ完了音再生
     */
    playWaveCompleteSound() {
        if (!this.isToneReady) return this.playFallbackWaveComplete();
        
        try {
            // ウェーブ完了の華やかなファンファーレ
            const notes = ['C4', 'E4', 'G4', 'C5'];
            const synth = this.toneSynths.levelUpSynth;
            
            // PolySynth対応確認
            if (!synth) {
                console.warn('🎵 levelUpSynth not available, using fallback');
                return this.playFallbackWaveComplete();
            }
            
            // 順次単音再生（メロディ）
            notes.forEach((note, index) => {
                synth.triggerAttackRelease(note, '8n', Tone.now() + index * 0.1);
            });
            
            // 最後に和音（PolySynth機能活用）
            setTimeout(() => {
                try {
                    synth.triggerAttackRelease(['C4', 'E4', 'G4'], '4n', Tone.now());
                    console.log('🎵 Chord played successfully: C4-E4-G4');
                } catch (chordError) {
                    console.warn('🎵 Chord playback failed, playing arpeggiated fallback:', chordError);
                    // 和音失敗時のアルペジオフォールバック
                    ['C4', 'E4', 'G4'].forEach((note, i) => {
                        synth.triggerAttackRelease(note, '8n', Tone.now() + i * 0.05);
                    });
                }
            }, 500);
            
            this.updatePerformanceMetrics();
            console.log('🌊 Wave complete sound played with PolySynth');
            
        } catch (error) {
            console.warn('🎵 Wave complete sound failed entirely:', error);
            this.playFallbackWaveComplete();
        }
    }
    
    /**
     * フォールバック：ウェーブ完了音
     */
    playFallbackWaveComplete() {
        const frequencies = [523, 659, 784, 1047]; // C4, E4, G4, C5
        frequencies.forEach((freq, index) => {
            setTimeout(() => this.createBeep(freq, 0.2, 'sine'), index * 100);
        });
        
        // 最後に和音（複数音同時再生）
        setTimeout(() => {
            frequencies.slice(0, 3).forEach(freq => {
                this.createBeep(freq, 0.4, 'sine');
            });
        }, 500);
    }
    
    /**
     * モバイル最適化：メモリクリーンアップ
     * @private
     */
    performMobileCleanup() {
        try {
            // 古いBeepオブジェクトをクリーンアップ
            if (this.audioContext) {
                // ガベージコレクションを促進
                const currentTime = this.audioContext.currentTime;
                console.log(`🧹 Mobile cleanup performed at ${currentTime}`);
            }
        } catch (error) {
            console.warn('🧹 Mobile cleanup error:', error);
        }
    }
    
    /**
     * エフェクト音事前準備
     * @private
     */
    initializeEffectSounds() {
        try {
            // sounds オブジェクト作成（他システムから参照される）
            this.sounds = {
                // 基本効果音（既存メソッドにマッピング）
                shoot: () => this.playShootSound(),
                reload: () => this.playReloadSound(),
                pickup: () => this.playPickupSound(),
                enemyKill: () => this.playEnemyDeathSound(),
                levelUp: () => this.playLevelUpSound(),
                damage: () => this.playDamageSound(),
                upgrade: () => this.playLevelUpSound(), // アップグレード音は レベルアップ音と同じ
                
                // 武器専用効果音
                pickupNuke: () => this.playPickupSound(),
                pickupSuperHoming: () => this.playPickupSound(),
                pickupSuperShotgun: () => this.playPickupSound(),
                pickupAmmo: () => this.playPickupSound(),
                pickupHealth: () => this.playPickupSound(),
                pickupSpeed: () => this.playPickupSound(),
                
                // 特殊効果音
                penetrate: () => this.playShootSound(), // 貫通音は射撃音ベース
                
                // 関数型互換性維持
                playWaveCompleteSound: () => this.playWaveCompleteSound()
            };
            
            console.log('🎵 AudioSystem: Effect sounds initialized');
            
        } catch (error) {
            console.warn('🎵 AudioSystem: Effect sounds initialization failed:', error);
        }
    }
    
    // ===== デバッグ・テスト用メソッド =====
    
    /**
     * 🧪 和音再生テストメソッド（開発・デバッグ用）
     * コンソールから game.audioSystem.testChordPlayback() で実行可能
     * @param {Array<string>} notes - 再生する音程配列（デフォルト: ['C4', 'E4', 'G4']）
     */
    testChordPlayback(notes = ['C4', 'E4', 'G4']) {
        console.log('🧪 Testing chord playback:', notes);
        
        if (!this.isToneReady) {
            console.warn('🎵 Tone.js not ready, initializing audio first...');
            this.initAudio();
            return;
        }
        
        try {
            const synth = this.toneSynths.levelUpSynth;
            
            if (!synth) {
                console.error('🎵 levelUpSynth not available');
                return;
            }
            
            console.log('🎵 Playing chord with PolySynth...');
            synth.triggerAttackRelease(notes, '2n', Tone.now());
            
            console.log('✅ Chord test completed successfully');
            
        } catch (error) {
            console.error('❌ Chord test failed:', error);
            
            // フォールバック：アルペジオテスト
            console.log('🎵 Trying arpeggio fallback...');
            try {
                const synth = this.toneSynths.levelUpSynth;
                notes.forEach((note, index) => {
                    synth.triggerAttackRelease(note, '8n', Tone.now() + index * 0.2);
                });
                console.log('✅ Arpeggio fallback test completed');
            } catch (fallbackError) {
                console.error('❌ Arpeggio fallback also failed:', fallbackError);
            }
        }
    }
    
    /**
     * 🧪 音響システム統合テスト（開発・デバッグ用）
     */
    testAudioSystemIntegration() {
        console.log('🧪 Running audio system integration test...');
        
        const tests = [
            { name: '単音再生', fn: () => this.playLevelUpSound() },
            { name: 'ウェーブ完了音', fn: () => this.playWaveCompleteSound() },
            { name: '和音テスト', fn: () => this.testChordPlayback(['C4', 'E4', 'G4', 'C5']) },
            { name: 'ピックアップ音', fn: () => this.playPickupSound() },
            { name: '射撃音', fn: () => this.playEnhancedShootSound('plasma') }
        ];
        
        tests.forEach((test, index) => {
            setTimeout(() => {
                console.log(`🧪 Testing: ${test.name}`);
                try {
                    test.fn();
                    console.log(`✅ ${test.name} - OK`);
                } catch (error) {
                    console.error(`❌ ${test.name} - Failed:`, error);
                }
            }, index * 1000);
        });
        
        console.log('🧪 Integration test scheduled (5 tests over 5 seconds)');
    }
}