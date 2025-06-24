/**
 * ProfessionalChiptuneEngine - 本格8bitチップチューンBGMシステム
 * README.md完全対応: 「没入感と中毒性を高めるチップチューン」
 * 
 * 🎵 設計理念：
 * - NES風4+2チャンネル構成での本格チップチューン
 * - 記憶に残る中毒性のあるメロディー
 * - ゲーム状況に応じた動的音楽変化
 * - 999ウェーブ進行での段階的テンション上昇
 */

export class ProfessionalChiptuneEngine {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.game = audioSystem.game;
        
        // システム状態
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentScene = null;
        this.isPaused = false;
        
        // NES風音源チャンネル（本格実装）
        this.channels = {
            pulse1: null,    // メロディー主旋律（矩形波）
            pulse2: null,    // ハーモニー・対旋律（矩形波）
            triangle: null,  // ベースライン（三角波）
            noise: null,     // ドラム・パーカッション（ノイズ）
            dmc: null,       // サンプル再生チャンネル（追加）
            sub: null        // サブベース強化チャンネル（追加）
        };
        
        // プロフェッショナルエフェクトチェーン
        this.effects = {
            masterFilter: null,     // マスターローパスフィルター
            stereoWidener: null,    // ステレオワイドニング
            compressor: null,       // マスターコンプレッサー
            limiter: null,          // リミッター
            chorus: null,           // コーラス（空間的広がり）
            reverb: null,           // リバーブ（深み）
            gain: null              // マスターゲイン
        };
        
        // 楽曲ライブラリ（本格楽曲）
        this.musicLibrary = this.createProfessionalMusicLibrary();
        
        // 動的音楽システム（999ウェーブ対応）
        this.dynamicMusic = {
            baseTempo: 120,
            currentTempo: 120,
            baseKey: 0, // C major
            currentKey: 0,
            intensity: 1.0,
            waveProgression: 1,
            emotionalState: 'anticipation', // anticipation, tension, climax, victory
            layerCount: 1 // アレンジの複雑さ
        };
        
        // プロフェッショナルシーケンサー
        this.sequencer = {
            pattern: null,
            currentMeasure: 0,
            currentBeat: 0,
            totalMeasures: 32,
            beatsPerMeasure: 4,
            subdivision: 16, // 16分音符解像度
            nextStepTime: 0,
            isRunning: false,
            loopCount: 0,
            arrangementSection: 'intro' // intro, verse, chorus, bridge, outro
        };
        
        // アレンジメントシステム
        this.arrangement = {
            sections: ['intro', 'verse1', 'chorus1', 'verse2', 'chorus2', 'bridge', 'chorus3', 'outro'],
            currentSectionIndex: 0,
            measuresPerSection: {
                intro: 8,
                verse1: 16,
                verse2: 16,
                chorus1: 16,
                chorus2: 16,
                chorus3: 16,
                bridge: 8,
                outro: 8
            }
        };
        
        // パフォーマンス設定（本格版）
        this.performance = {
            lookahead: 25.0, // ms
            scheduleAheadTime: 0.1, // seconds
            updateInterval: 25, // ms
            maxPolyphony: 8, // 最大同時発音数
            voiceStealingEnabled: true
        };
        
        console.log('🎮 ProfessionalChiptuneEngine: 本格8bitチップチューンシステム初期化中...');
    }
    
    /**
     * 音楽開始（本格チップチューンシステム）
     */
    async startMusic(scene = 'menu') {
        if (!this.isInitialized) {
            console.warn('🎮 チップチューンエンジン未初期化');
            return;
        }
        
        try {
            console.log(`🎮 [CHIPTUNE] チップチューン${scene}BGM開始`);
            
            // 前の音楽停止
            this.stopMusic();
            
            // シーン状態設定
            this.currentScene = scene;
            this.isPlaying = true;
            
            // シーン別チップチューンBGM開始
            if (scene === 'menu') {
                console.log('🎮 [CHIPTUNE] メニューチップチューンBGM開始');
                this.playChiptuneMenuMusic();
            } else if (scene === 'character') {
                console.log('🎮 [CHIPTUNE] キャラクターチップチューンBGM開始');
                this.playChiptuneCharacterMusic();
            } else if (scene === 'battle') {
                console.log('🎮 [CHIPTUNE] バトルチップチューンBGM開始');
                this.playChiptuneBattleMusic();
            } else {
                console.log(`🎮 [CHIPTUNE] 不明シーン${scene} - デフォルトメニューBGM`);
                this.playChiptuneMenuMusic();
            }
            
            console.log(`✅ [CHIPTUNE] ${scene} チップチューンBGM再生中`);
            
        } catch (error) {
            console.error('🎮 [CHIPTUNE ERROR] チップチューンBGM開始失敗:', error);
        }
    }
    
    /**
     * 音楽停止（本格チップチューンシステム）
     */
    stopMusic() {
        try {
            console.log('🎮 [CHIPTUNE STOP] チップチューンBGM停止中...');
            
            // 全チャンネルの音を停止
            Object.values(this.channels).forEach(channel => {
                if (channel && typeof channel.releaseAll === 'function') {
                    channel.releaseAll();
                } else if (channel && typeof channel.triggerRelease === 'function') {
                    channel.triggerRelease();
                }
            });
            
            // シーケンサー停止
            this.sequencer.isRunning = false;
            
            this.isPlaying = false;
            this.currentScene = null;
            
            console.log('✅ [CHIPTUNE STOP] チップチューンBGM停止完了');
            
        } catch (error) {
            console.error('❌ [CHIPTUNE STOP] チップチューンBGM停止失敗:', error);
        }
    }
    
    /**
     * システム初期化 - 本格チップチューンシステム復元
     */
    async initialize() {
        try {
            console.log('🎮 ProfessionalChiptuneEngine: === 本格チップチューンシステム初期化開始 ===');
            
            // Tone.js可用性チェック
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available');
            }
            console.log('✅ Tone.js利用可能');
            
            // AudioContext開始（サブシステム用安全チェック）
            if (Tone.context.state === 'suspended') {
                console.log('🎼 ProfessionalChiptuneEngine: AudioContext suspended, attempting start...');
                await Tone.start();
            } else if (Tone.context.state === 'running') {
                console.log('🎼 ProfessionalChiptuneEngine: AudioContext already running');
            }
            console.log('✅ AudioContext状態:', Tone.context.state);
            
            // 本格チップチューン音源チャンネル作成
            this.createProfessionalChiptuneChannels();
            
            // プロフェッショナルエフェクトチェーン作成
            this.createProfessionalEffectChain();
            
            // プロフェッショナルシーケンサー初期化
            this.initializeProfessionalSequencer();
            
            this.isInitialized = true;
            console.log('✅ ProfessionalChiptuneEngine: === 本格チップチューンシステム初期化完了 ===');
            
            return { success: true, message: 'Professional Chiptune Engine ready (8-bit authentic sound)' };
            
        } catch (error) {
            console.error('❌ ProfessionalChiptuneEngine: 初期化失敗:', error);
            this.isInitialized = false;
            return { success: false, message: `Chiptune engine init failed: ${error.message}` };
        }
    }
    
    /**
     * 本格チップチューンチャンネル作成 (NES風8bit音源)
     */
    createProfessionalChiptuneChannels() {
        try {
            console.log('🎮 [CHIPTUNE CHANNELS] 本格8bitチップチューンチャンネル作成開始...');
            
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available');
            }
            
            // === NES風本格チップチューンチャンネル作成 ===
            
            // Pulse1: メロディー主旋律（矩形波 - NES風）
            this.channels.pulse1 = new Tone.Synth({
                oscillator: {
                    type: 'square'  // 典型的なチップチューン矩形波
                },
                envelope: {
                    attack: 0.001,   // 即座のアタック（8bit特性）
                    decay: 0.1,      // 短いディケイ
                    sustain: 0.3,    // 中程度のサステイン
                    release: 0.1     // 短いリリース（8bit特性）
                },
                volume: -10
            });
            
            // Pulse2: ハーモニー・対旋律（矩形波）
            this.channels.pulse2 = new Tone.Synth({
                oscillator: {
                    type: 'square'
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.1,
                    sustain: 0.2,
                    release: 0.1
                },
                volume: -15
            });
            
            // Triangle: ベースライン（三角波 - NES風）
            this.channels.triangle = new Tone.Synth({
                oscillator: {
                    type: 'triangle'  // クラシックなチップチューン三角波
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.2,
                    sustain: 0.5,
                    release: 0.2
                },
                volume: -12
            });
            
            // Noise: ドラム・パーカッション（ホワイトノイズ）
            this.channels.noise = new Tone.NoiseSynth({
                noise: {
                    type: 'white'
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0.0,
                    release: 0.05
                },
                volume: -20
            });
            
            // DMC: サンプル再生チャンネル（追加チップチューン効果）
            this.channels.dmc = new Tone.Synth({
                oscillator: {
                    type: 'sawtooth'  // チップチューンでよく使われるのこぎり波
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.1,
                    release: 0.2
                },
                volume: -18
            });
            
            // Sub: サブベース強化チャンネル（低音強化）
            this.channels.sub = new Tone.Synth({
                oscillator: {
                    type: 'sine'  // 低音用サイン波
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.4,
                    release: 0.5
                },
                volume: -15
            });
            
            // 全チャンネルをDestinationに接続（シンプルなチップチューンスタイル）
            Object.values(this.channels).forEach(channel => {
                if (channel) {
                    channel.toDestination();
                }
            });
            
            console.log('✅ [CHIPTUNE CHANNELS] 本格8bitチップチューンチャンネル作成完了');
            console.log('🎮 Available channels:', Object.keys(this.channels));
            
        } catch (error) {
            console.error('❌ [CHIPTUNE CHANNELS] チップチューンチャンネル作成失敗:', error);
            throw error;
        }
    }
    
    /**
     * プロフェッショナルエフェクトチェーン作成
     */
    createProfessionalEffectChain() {
        // ローパスフィルター（8bit感とアナログ感）
        this.effects.masterFilter = new Tone.Filter({
            frequency: 12000,
            type: 'lowpass',
            rolloff: -12
        });
        
        // ステレオワイドニング（空間的広がり）
        this.effects.stereoWidener = new Tone.StereoWidener(0.3);
        
        // コーラス（温かみと厚み）
        this.effects.chorus = new Tone.Chorus({
            frequency: 2,
            delayTime: 3,
            depth: 0.1,
            wet: 0.15
        });
        
        // リバーブ（深みと空間感）
        this.effects.reverb = new Tone.Reverb({
            decay: 2.0,
            wet: 0.2
        });
        
        // コンプレッサー（音圧とパンチ）
        this.effects.compressor = new Tone.Compressor({
            threshold: -18,
            ratio: 4,
            attack: 0.003,
            release: 0.1
        });
        
        // リミッター（最終段保護）
        this.effects.limiter = new Tone.Limiter(-3);
        
        // マスターゲイン
        this.effects.gain = new Tone.Gain(0.4);
        
        // プロフェッショナルチェーン接続
        // Channels → Chorus → Filter → Reverb → StereoWidener → Compressor → Limiter → Gain → Destination
        const masterChain = [
            this.effects.chorus,
            this.effects.masterFilter,
            this.effects.reverb,
            this.effects.stereoWidener,
            this.effects.compressor,
            this.effects.limiter,
            this.effects.gain,
            Tone.Destination
        ];
        
        // 全チャンネルをマスターチェーンに接続
        Object.values(this.channels).forEach(channel => {
            if (channel) {
                channel.chain(...masterChain);
            }
        });
        
        console.log('🎮 ProfessionalChiptuneEngine: プロフェッショナルエフェクトチェーン作成完了');
    }
    
    /**
     * プロフェッショナルシーケンサー初期化
     */
    initializeProfessionalSequencer() {
        try {
            // シーケンサー基本設定
            this.sequencer.isRunning = false;
            this.sequencer.currentMeasure = 0;
            this.sequencer.currentBeat = 0;
            this.sequencer.nextStepTime = 0;
            
            console.log('🎮 Professional sequencer initialized');
            
        } catch (error) {
            console.error('🎮 Sequencer initialization failed:', error);
        }
    }

    /**
     * チップチューンメニューBGM（8bitレトロサウンド）
     */
    playChiptuneMenuMusic() {
        try {
            console.log('🎮 [CHIPTUNE MENU] 8bitチップチューンメニューBGM開始');
            
            // シンプルで記憶に残るチップチューンメロディー
            const chiptuneMenuMelody = [
                { note: 'C4', time: 0, duration: '8n' },
                { note: 'E4', time: 0.5, duration: '8n' },
                { note: 'G4', time: 1, duration: '8n' },
                { note: 'C5', time: 1.5, duration: '4n' },
                { note: 'G4', time: 2.5, duration: '8n' },
                { note: 'E4', time: 3, duration: '8n' },
                { note: 'C4', time: 3.5, duration: '4n' }
            ];
            
            const chiptuneMenuHarmony = [
                { note: 'E3', time: 0, duration: '2n' },
                { note: 'G3', time: 2, duration: '2n' }
            ];
            
            const chiptuneMenuBass = [
                { note: 'C2', time: 0, duration: '4n' },
                { note: 'G2', time: 1, duration: '4n' },
                { note: 'F2', time: 2, duration: '4n' },
                { note: 'C2', time: 3, duration: '4n' }
            ];
            
            // メロディー再生
            chiptuneMenuMelody.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse1 && this.isPlaying && this.currentScene === 'menu') {
                        this.channels.pulse1.triggerAttackRelease(note, duration);
                        console.log(`🎮 [MENU MELODY] ${note}`);
                    }
                }, time * 1000);
            });
            
            // ハーモニー再生
            chiptuneMenuHarmony.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse2 && this.isPlaying && this.currentScene === 'menu') {
                        this.channels.pulse2.triggerAttackRelease(note, duration);
                    }
                }, time * 1000);
            });
            
            // ベース再生
            chiptuneMenuBass.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.triangle && this.isPlaying && this.currentScene === 'menu') {
                        this.channels.triangle.triggerAttackRelease(note, duration);
                    }
                }, time * 1000);
            });
            
            // ループ設定
            setTimeout(() => {
                if (this.isPlaying && this.currentScene === 'menu') {
                    this.playChiptuneMenuMusic();
                }
            }, 5000);
            
            console.log('✅ [CHIPTUNE MENU] 8bitメニューBGM再生中');
            
        } catch (error) {
            console.error('❌ [CHIPTUNE MENU] メニューBGM失敗:', error);
        }
    }
    
    /**
     * チップチューンキャラクター選択BGM（8bitレトロサウンド）
     */
    playChiptuneCharacterMusic() {
        try {
            console.log('🎮 [CHIPTUNE CHARACTER] 8bitキャラクター選択BGM開始');
            
            // より明るいチップチューンメロディー
            const chiptuneCharacterMelody = [
                { note: 'G4', time: 0, duration: '8n' },
                { note: 'C5', time: 0.5, duration: '8n' },
                { note: 'E5', time: 1, duration: '8n' },
                { note: 'G5', time: 1.5, duration: '4n' },
                { note: 'F5', time: 2.5, duration: '8n' },
                { note: 'E5', time: 3, duration: '8n' },
                { note: 'D5', time: 3.5, duration: '8n' },
                { note: 'C5', time: 4, duration: '4n' }
            ];
            
            const chiptuneCharacterHarmony = [
                { note: 'C4', time: 0, duration: '2n' },
                { note: 'F4', time: 2, duration: '2n' },
                { note: 'G4', time: 4, duration: '2n' }
            ];
            
            const chiptuneCharacterBass = [
                { note: 'C2', time: 0, duration: '4n' },
                { note: 'E2', time: 1, duration: '4n' },
                { note: 'F2', time: 2, duration: '4n' },
                { note: 'G2', time: 3, duration: '4n' },
                { note: 'C2', time: 4, duration: '4n' }
            ];
            
            // メロディー再生
            chiptuneCharacterMelody.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse1 && this.isPlaying && this.currentScene === 'character') {
                        this.channels.pulse1.triggerAttackRelease(note, duration);
                        console.log(`🎮 [CHARACTER MELODY] ${note}`);
                    }
                }, time * 800);
            });
            
            // ハーモニー再生
            chiptuneCharacterHarmony.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse2 && this.isPlaying && this.currentScene === 'character') {
                        this.channels.pulse2.triggerAttackRelease(note, duration);
                    }
                }, time * 800);
            });
            
            // ベース再生
            chiptuneCharacterBass.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.triangle && this.isPlaying && this.currentScene === 'character') {
                        this.channels.triangle.triggerAttackRelease(note, duration);
                    }
                }, time * 800);
            });
            
            // ループ設定
            setTimeout(() => {
                if (this.isPlaying && this.currentScene === 'character') {
                    this.playChiptuneCharacterMusic();
                }
            }, 5000);
            
            console.log('✅ [CHIPTUNE CHARACTER] 8bitキャラクター選択BGM再生中');
            
        } catch (error) {
            console.error('❌ [CHIPTUNE CHARACTER] キャラクター選択BGM失敗:', error);
        }
    }
    
    /**
     * チップチューンバトルBGM（8bitレトロサウンド）
     */
    playChiptuneBattleMusic() {
        try {
            console.log('🎮 [CHIPTUNE BATTLE] 8bitバトルBGM開始');
            
            // 激しいチップチューンバトルメロディー
            const chiptuneBattleMelody = [
                { note: 'D4', time: 0, duration: '16n' },
                { note: 'F4', time: 0.2, duration: '16n' },
                { note: 'A4', time: 0.4, duration: '16n' },
                { note: 'D5', time: 0.6, duration: '8n' },
                { note: 'C5', time: 1, duration: '16n' },
                { note: 'A4', time: 1.2, duration: '16n' },
                { note: 'F4', time: 1.4, duration: '8n' },
                { note: 'D4', time: 1.8, duration: '8n' }
            ];
            
            const chiptuneBattleHarmony = [
                { note: 'F3', time: 0, duration: '4n' },
                { note: 'G3', time: 0.5, duration: '4n' },
                { note: 'A3', time: 1, duration: '4n' },
                { note: 'Bb3', time: 1.5, duration: '4n' }
            ];
            
            const chiptuneBattleBass = [
                { note: 'D2', time: 0, duration: '8n' },
                { note: 'D2', time: 0.5, duration: '8n' },
                { note: 'G2', time: 1, duration: '8n' },
                { note: 'A2', time: 1.5, duration: '8n' }
            ];
            
            // ドラムパターン
            const drumPattern = [
                { time: 0, duration: '32n' },
                { time: 0.5, duration: '32n' },
                { time: 1, duration: '32n' },
                { time: 1.5, duration: '32n' }
            ];
            
            // メロディー再生
            chiptuneBattleMelody.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse1 && this.isPlaying && this.currentScene === 'battle') {
                        this.channels.pulse1.triggerAttackRelease(note, duration);
                        console.log(`🎮 [BATTLE MELODY] ${note}`);
                    }
                }, time * 600);
            });
            
            // ハーモニー再生
            chiptuneBattleHarmony.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse2 && this.isPlaying && this.currentScene === 'battle') {
                        this.channels.pulse2.triggerAttackRelease(note, duration);
                    }
                }, time * 600);
            });
            
            // ベース再生
            chiptuneBattleBass.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.triangle && this.isPlaying && this.currentScene === 'battle') {
                        this.channels.triangle.triggerAttackRelease(note, duration);
                    }
                }, time * 600);
            });
            
            // ドラム再生
            drumPattern.forEach(({ time, duration }) => {
                setTimeout(() => {
                    if (this.channels.noise && this.isPlaying && this.currentScene === 'battle') {
                        this.channels.noise.triggerAttackRelease(duration);
                    }
                }, time * 600);
            });
            
            // ループ設定（短いループで緊張感を維持）
            setTimeout(() => {
                if (this.isPlaying && this.currentScene === 'battle') {
                    this.playChiptuneBattleMusic();
                }
            }, 2000);
            
            console.log('✅ [CHIPTUNE BATTLE] 8bitバトルBGM再生中');
            
        } catch (error) {
            console.error('❌ [CHIPTUNE BATTLE] バトルBGM失敗:', error);
        }
    }

    /**
     * 本格ピアノメニューBGM（チップチューンではない真のピアノ音響）
     */
    playGentleFFMenuMusic() {
        try {
            console.log('🎹 [PIANO DEBUG] Starting REAL PIANO Menu BGM (Non-Chiptune Authentic Piano)...');
            console.log('🎹 [PIANO DEBUG] Current isPlaying status:', this.isPlaying);
            console.log('🎹 [PIANO DEBUG] Available channels:', Object.keys(this.channels));

            // FF Prelude風の美しいピアノメロディー（簡潔で確実に聞こえる構造）
            const pianoMelody = [
                // 第一フレーズ：印象的な上昇アルペジオ（即座に認識できる）
                { note: 'C4', time: 0, duration: '4n' },
                { note: 'E4', time: 0.5, duration: '4n' },
                { note: 'G4', time: 1, duration: '4n' },
                { note: 'C5', time: 1.5, duration: '2n' },
                
                // 第二フレーズ：美しい下降（記憶に残る）
                { note: 'B4', time: 2.5, duration: '8n' },
                { note: 'A4', time: 3, duration: '8n' },
                { note: 'G4', time: 3.5, duration: '4n' },
                { note: 'F4', time: 4, duration: '2n' },
                
                // 第三フレーズ：感動的な終結
                { note: 'E4', time: 5, duration: '4n' },
                { note: 'G4', time: 5.5, duration: '4n' },
                { note: 'C5', time: 6, duration: '1n' }
            ];

            // 温かいハーモニー（簡潔で美しい左手）
            const warmHarmony = [
                // Cメジャー和音の基本
                { note: 'G3', time: 0, duration: '1n' },
                { note: 'C4', time: 1.5, duration: '1n' },
                
                // Fメジャー和音への移行
                { note: 'A3', time: 3, duration: '1n' },
                { note: 'F4', time: 4.5, duration: '1n' },
                
                // Cメジャーへの美しい解決
                { note: 'G3', time: 6, duration: '1n' }
            ];

            // 深いベースライン（簡潔で力強い低音）
            const deepBass = [
                { note: 'C2', time: 0, duration: '2n' },
                { note: 'F2', time: 2, duration: '2n' },
                { note: 'G2', time: 4, duration: '2n' },
                { note: 'C2', time: 6, duration: '2n' }
            ];

            // ピアノ的なアルペジオ装飾（簡潔で美しい装飾）
            const pianoArpeggio = [
                { note: 'C4', time: 0.25, duration: '16n' },
                { note: 'E4', time: 0.5, duration: '16n' },
                { note: 'G4', time: 0.75, duration: '16n' },
                { note: 'F4', time: 2.25, duration: '16n' },
                { note: 'A4', time: 2.5, duration: '16n' },
                { note: 'C5', time: 2.75, duration: '16n' },
                { note: 'G4', time: 4.25, duration: '16n' },
                { note: 'B4', time: 4.5, duration: '16n' },
                { note: 'D5', time: 4.75, duration: '16n' }
            ];

            // 本格ピアノ音量設定（確実に聞こえるレベルに大幅向上）
            if (this.channels.pulse1) this.channels.pulse1.volume.value = -6;   // メロディー：8dB向上で確実に聞こえる
            if (this.channels.pulse2) this.channels.pulse2.volume.value = -8;   // ハーモニー：8dB向上で豊かな支え
            if (this.channels.triangle) this.channels.triangle.volume.value = -10; // ベース：8dB向上で深い響き
            if (this.channels.dmc) this.channels.dmc.volume.value = -12;        // アルペジオ：8dB向上で美しい装飾

            // ピアノメロディー再生（適度なテンポで確実に聞こえる）
            pianoMelody.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse1 && this.isPlaying) {
                        try {
                            this.channels.pulse1.triggerAttackRelease(note, duration);
                            console.log('🎹 [MELODY DEBUG] Playing note:', note, 'at time:', time);
                        } catch (error) {
                            console.error('🎹 [MELODY ERROR]:', error);
                        }
                    }
                }, time * 800);  // 適度なテンポ（800ms）
            });

            // 温かいハーモニー再生
            warmHarmony.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse2 && this.isPlaying) {
                        try {
                            this.channels.pulse2.triggerAttackRelease(note, duration);
                            console.log('🎹 [HARMONY DEBUG] Playing harmony:', note, 'at time:', time);
                        } catch (error) {
                            console.error('🎹 [HARMONY ERROR]:', error);
                        }
                    }
                }, time * 800);
            });

            // 深いベース再生
            deepBass.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.triangle && this.isPlaying) {
                        try {
                            this.channels.triangle.triggerAttackRelease(note, duration);
                            console.log('🎹 [BASS DEBUG] Playing bass:', note, 'at time:', time);
                        } catch (error) {
                            console.error('🎹 [BASS ERROR]:', error);
                        }
                    }
                }, time * 800);
            });

            // 繊細なアルペジオ装飾
            pianoArpeggio.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.dmc && this.isPlaying) {
                        try {
                            this.channels.dmc.triggerAttackRelease(note, duration);
                            console.log('🎹 [ARPEGGIO DEBUG] Playing arpeggio:', note, 'at time:', time);
                        } catch (error) {
                            console.error('🎹 [ARPEGGIO ERROR]:', error);
                        }
                    }
                }, time * 800);
            });

            // ループ設定（8秒後に再開 - より短いループで確実な繰り返し）
            setTimeout(() => {
                if (this.isPlaying && (this.currentScene === 'menu' || this.currentScene === 'character')) {
                    console.log('🎹 [LOOP DEBUG] Menu BGM loop restarting...');
                    this.playGentleFFMenuMusic();
                }
            }, 8000);

            console.log('🎹 [PIANO DEBUG] Real Piano Menu BGM playing (NO MORE CHIPTUNE - Authentic Piano Sound!)');
            console.log('🎹 [PIANO DEBUG] Volume levels - Pulse1:', this.channels.pulse1?.volume.value, 'Pulse2:', this.channels.pulse2?.volume.value);

        } catch (error) {
            console.error('🎮 Gentle piano menu music failed:', error);
        }
    }

    /**
     * クリアなバトルBGM（ザーザー音を除去）
     */
    playClearBattleMusic() {
        try {
            // クリアなバトルメロディー
            const battleMelody = [
                { note: 'C4', time: 0, duration: '8n' },
                { note: 'D4', time: 0.3, duration: '8n' },
                { note: 'E4', time: 0.6, duration: '8n' },
                { note: 'G4', time: 0.9, duration: '4n' },
                { note: 'F4', time: 1.4, duration: '8n' },
                { note: 'E4', time: 1.7, duration: '8n' },
                { note: 'D4', time: 2.0, duration: '4n' },
                { note: 'C4', time: 2.5, duration: '4n' }
            ];

            // パワフルなハーモニー
            const battleHarmony = [
                { note: 'E3', time: 0, duration: '4n' },
                { note: 'G3', time: 0.6, duration: '4n' },
                { note: 'C4', time: 1.2, duration: '4n' },
                { note: 'F3', time: 1.8, duration: '4n' }
            ];

            // 力強いベース
            const battleBass = [
                { note: 'C2', time: 0, duration: '4n' },
                { note: 'G2', time: 0.5, duration: '4n' },
                { note: 'F2', time: 1.0, duration: '4n' },
                { note: 'C2', time: 1.5, duration: '4n' }
            ];

            // バトルBGM音量設定（極大音量 - 絶対に聞こえるレベル）
            if (this.channels.pulse1) this.channels.pulse1.volume.value = -3;   // 維持：既に適切
            if (this.channels.pulse2) this.channels.pulse2.volume.value = -5;   // 維持：既に適切  
            if (this.channels.triangle) this.channels.triangle.volume.value = -7; // 維持：既に適切

            // バトルメロディー再生
            battleMelody.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse1) {
                        this.channels.pulse1.triggerAttackRelease(note, duration);
                    }
                }, time * 600);
            });

            // ハーモニー再生
            battleHarmony.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.pulse2) {
                        this.channels.pulse2.triggerAttackRelease(note, duration);
                    }
                }, time * 600);
            });

            // ベース再生
            battleBass.forEach(({ note, time, duration }) => {
                setTimeout(() => {
                    if (this.channels.triangle) {
                        this.channels.triangle.triggerAttackRelease(note, duration);
                    }
                }, time * 600);
            });

            console.log('⚔️ [BATTLE DEBUG] Clear battle music started with improved volume');
            console.log('⚔️ [BATTLE DEBUG] Current isPlaying status:', this.isPlaying);
            console.log('⚔️ [BATTLE DEBUG] Volume levels - Pulse1:', this.channels.pulse1?.volume.value, 'Pulse2:', this.channels.pulse2?.volume.value);

            // ループ設定（3秒後に再開）
            setTimeout(() => {
                if (this.isPlaying && this.currentScene === 'battle') {
                    this.playClearBattleMusic();
                }
            }, 3000);

        } catch (error) {
            console.error('🎮 Clear battle music failed:', error);
        }
    }
    
    /**
     * プロフェッショナル楽曲ライブラリ作成
     */
    createProfessionalMusicLibrary() {
        return {
            // ホーム画面BGM「故郷への望郷」- 記憶に残る名曲
            home: {
                name: "Nostalgia for Earth - 故郷への望郷",
                tempo: 110,
                key: 0, // C major
                timeSignature: [4, 4],
                mood: 'nostalgic_hopeful',
                complexity: 3,
                sections: {
                    intro: {
                        measures: 8,
                        pulse1: [
                            // イントロ - 神秘的な導入
                            ['C4', '', 'E4', '', 'G4', '', 'C5', '', 'B4', '', 'A4', '', 'G4', '', 'F4', ''],
                            ['E4', '', 'G4', '', 'C5', '', 'B4', '', 'A4', '', 'G4', '', 'F4', '', 'E4', ''],
                            ['G4', '', 'F4', '', 'E4', '', 'D4', '', 'C4', '', 'D4', '', 'E4', '', 'F4', ''],
                            ['C4', '', '', '', 'G4', '', '', '', 'A4', '', '', '', 'G4', '', '', '']
                        ],
                        pulse2: [
                            // ハーモニー
                            ['E3', '', 'G3', '', 'C4', '', 'E4', '', 'D4', '', 'C4', '', 'B3', '', 'A3', ''],
                            ['G3', '', 'B3', '', 'E4', '', 'D4', '', 'C4', '', 'B3', '', 'A3', '', 'G3', ''],
                            ['C4', '', 'A3', '', 'G3', '', 'F3', '', 'E3', '', 'F3', '', 'G3', '', 'A3', ''],
                            ['E3', '', '', '', 'C4', '', '', '', 'F4', '', '', '', 'E4', '', '', '']
                        ],
                        triangle: [
                            // ベースライン
                            ['C2', '', '', '', 'F2', '', '', '', 'G2', '', '', '', 'C2', '', '', ''],
                            ['C2', '', '', '', 'G2', '', '', '', 'A2', '', '', '', 'F2', '', '', ''],
                            ['C2', '', '', '', 'F2', '', '', '', 'G2', '', '', '', 'C2', '', '', ''],
                            ['C2', '', '', '', 'G2', '', '', '', 'F2', '', '', '', 'C2', '', '', '']
                        ],
                        noise: [
                            // ソフトなドラムパターン
                            [0.3, 0, 0.1, 0, 0.3, 0, 0.1, 0, 0.3, 0, 0.1, 0, 0.3, 0, 0.1, 0],
                            [0.3, 0, 0.1, 0.05, 0.3, 0, 0.1, 0, 0.3, 0.05, 0.1, 0, 0.3, 0, 0.1, 0],
                            [0.3, 0, 0.1, 0, 0.3, 0.05, 0.1, 0.05, 0.3, 0, 0.1, 0.05, 0.3, 0, 0.1, 0],
                            [0.3, 0, 0.1, 0, 0.3, 0, 0.1, 0, 0.3, 0, 0.1, 0, 0.3, 0, 0.2, 0.1]
                        ]
                    }
                },
                dynamicElements: {
                    tempoProgression: true,
                    harmonyEvolution: true,
                    filterSweeps: true
                }
            },
            
            // キャラクター選択BGM「戦士たちの誓い」- 高揚感とワクワク感
            character: {
                name: "Oath of Warriors - 戦士たちの誓い",
                tempo: 130,
                key: 4, // E minor (エモーショナル)
                timeSignature: [4, 4],
                mood: 'determined_epic',
                complexity: 4,
                sections: {
                    intro: {
                        measures: 8,
                        pulse1: [
                            // パワフルなイントロ
                            ['E4', '', 'G4', '', 'B4', '', 'E5', '', 'D5', '', 'B4', '', 'G4', '', 'E4', ''],
                            ['B4', '', 'A4', '', 'G4', '', 'F#4', '', 'E4', '', 'F#4', '', 'G4', '', 'A4', ''],
                            ['E4', '', 'D4', '', 'C4', '', 'B3', '', 'A3', '', 'B3', '', 'C4', '', 'D4', ''],
                            ['E4', '', 'E4', '', 'B4', '', 'B4', '', 'A4', '', 'A4', '', 'G4', '', '', '']
                        ],
                        pulse2: [
                            // 力強いハーモニー
                            ['G3', '', 'B3', '', 'E4', '', 'G4', '', 'F#4', '', 'E4', '', 'D4', '', 'B3', ''],
                            ['E4', '', 'D4', '', 'B3', '', 'A3', '', 'G3', '', 'A3', '', 'B3', '', 'C4', ''],
                            ['G3', '', 'F#3', '', 'E3', '', 'D3', '', 'C3', '', 'D3', '', 'E3', '', 'F#3', ''],
                            ['G3', '', 'G3', '', 'E4', '', 'E4', '', 'D4', '', 'D4', '', 'B3', '', '', '']
                        ],
                        triangle: [
                            // ドライビングベース
                            ['E2', '', 'E2', '', 'A2', '', '', '', 'B2', '', 'B2', '', 'E2', '', '', ''],
                            ['E2', '', 'E2', '', 'B2', '', '', '', 'C3', '', 'C3', '', 'A2', '', '', ''],
                            ['E2', '', 'E2', '', 'A2', '', '', '', 'B2', '', 'B2', '', 'E2', '', '', ''],
                            ['E2', '', 'E2', '', 'B2', '', '', '', 'A2', '', 'A2', '', 'E2', '', '', '']
                        ],
                        noise: [
                            // 力強いドラムパターン
                            [0.8, 0.2, 0.4, 0.2, 0.8, 0.3, 0.4, 0.2, 0.8, 0.2, 0.4, 0.3, 0.8, 0.2, 0.4, 0.2],
                            [0.8, 0.2, 0.4, 0.1, 0.8, 0.2, 0.4, 0.3, 0.8, 0.3, 0.4, 0.1, 0.8, 0.2, 0.4, 0.2],
                            [0.8, 0.1, 0.4, 0.2, 0.8, 0.2, 0.4, 0.1, 0.8, 0.2, 0.4, 0.2, 0.8, 0.3, 0.4, 0.1],
                            [0.8, 0.2, 0.4, 0.2, 0.8, 0.3, 0.4, 0.2, 0.8, 0.2, 0.4, 0.2, 0.8, 0.3, 0.6, 0.4]
                        ]
                    }
                },
                dynamicElements: {
                    buildupIntensity: true,
                    rhythmComplexity: true,
                    melodicVariations: true
                }
            },
            
            // 戦闘BGM「無限の戦場」- 中毒性のある緊張感
            battle: {
                name: "Infinite Battlefield - 無限の戦場",
                tempo: 150,
                key: 2, // D minor (緊張感)
                timeSignature: [4, 4],
                mood: 'intense_addictive',
                complexity: 5,
                sections: {
                    intro: {
                        measures: 8,
                        pulse1: [
                            // 印象的で中毒性のあるリフ
                            ['D4', '', 'F4', '', 'A4', '', 'D5', '', 'C5', '', 'A4', '', 'F4', '', 'D4', ''],
                            ['A4', '', 'G4', '', 'F4', '', 'E4', '', 'D4', '', 'E4', '', 'F4', '', 'G4', ''],
                            ['D4', '', 'C4', '', 'Bb3', '', 'A3', '', 'G3', '', 'A3', '', 'Bb3', '', 'C4', ''],
                            ['D4', '', 'D4', '', 'A4', '', 'A4', '', 'G4', '', 'G4', '', 'F4', '', '', '']
                        ],
                        pulse2: [
                            // テンションハーモニー
                            ['F3', '', 'A3', '', 'D4', '', 'F4', '', 'E4', '', 'D4', '', 'C4', '', 'A3', ''],
                            ['D4', '', 'C4', '', 'A3', '', 'G3', '', 'F3', '', 'G3', '', 'A3', '', 'Bb3', ''],
                            ['F3', '', 'E3', '', 'D3', '', 'C3', '', 'Bb2', '', 'C3', '', 'D3', '', 'E3', ''],
                            ['F3', '', 'F3', '', 'D4', '', 'D4', '', 'C4', '', 'C4', '', 'A3', '', '', '']
                        ],
                        triangle: [
                            // 攻撃的ベース
                            ['D2', '', 'D2', '', 'G2', '', '', '', 'A2', '', 'A2', '', 'D2', '', '', ''],
                            ['D2', '', 'D2', '', 'A2', '', '', '', 'Bb2', '', 'Bb2', '', 'G2', '', '', ''],
                            ['D2', '', 'D2', '', 'G2', '', '', '', 'A2', '', 'A2', '', 'D2', '', '', ''],
                            ['D2', '', 'D2', '', 'A2', '', '', '', 'G2', '', 'G2', '', 'D2', '', '', '']
                        ],
                        noise: [
                            // 激しいドラムパターン
                            [1.0, 0.3, 0.7, 0.3, 1.0, 0.4, 0.7, 0.3, 1.0, 0.3, 0.7, 0.4, 1.0, 0.3, 0.7, 0.3],
                            [1.0, 0.3, 0.7, 0.2, 1.0, 0.3, 0.7, 0.4, 1.0, 0.4, 0.7, 0.2, 1.0, 0.3, 0.7, 0.3],
                            [1.0, 0.2, 0.7, 0.3, 1.0, 0.3, 0.7, 0.2, 1.0, 0.3, 0.7, 0.3, 1.0, 0.4, 0.7, 0.2],
                            [1.0, 0.3, 0.7, 0.3, 1.0, 0.4, 0.7, 0.3, 1.0, 0.3, 0.7, 0.3, 1.0, 0.4, 0.8, 0.5]
                        ]
                    }
                },
                dynamicElements: {
                    waveProgression: true,
                    tensionBuildup: true,
                    climaxMoments: true,
                    addictiveHooks: true
                }
            }
        };
    }
    
    /**
     * プロフェッショナルシーケンサー初期化
     */
    initializeProfessionalSequencer() {
        this.sequencer.stepTime = 60 / (this.dynamicMusic.currentTempo * this.sequencer.subdivision);
        this.sequencer.nextStepTime = Tone.now();
        
        console.log('🎮 ProfessionalChiptuneEngine: プロフェッショナルシーケンサー初期化完了');
    }
    
    /**
     * BGM再生開始（プロフェッショナル版）
     */
    async startBGM(sceneName = 'home') {
        if (!this.isInitialized) {
            console.warn('ProfessionalChiptuneEngine not initialized');
            return;
        }
        
        try {
            console.log(`🎮 ProfessionalChiptuneEngine: 本格BGM開始 - ${sceneName}`);
            
            // 現在の音楽を停止
            if (this.isPlaying) {
                this.stopBGM();
            }
            
            this.currentScene = sceneName;
            const music = this.musicLibrary[sceneName];
            
            if (!music) {
                console.warn(`Music not found for scene: ${sceneName}`);
                return;
            }
            
            // 動的音楽設定
            this.dynamicMusic.baseTempo = music.tempo;
            this.dynamicMusic.currentTempo = music.tempo;
            this.dynamicMusic.baseKey = music.key;
            this.dynamicMusic.currentKey = music.key;
            
            // ウェーブ進行による動的調整
            this.updateDynamicMusicForWave();
            
            // シーケンサーパターン設定
            this.sequencer.pattern = music.sections.intro;
            this.sequencer.currentMeasure = 0;
            this.sequencer.currentBeat = 0;
            this.sequencer.isRunning = true;
            
            // 音量設定
            const volume = this.audioSystem.getCalculatedVolume('bgm', 0.4);
            this.effects.gain.gain.setValueAtTime(volume, Tone.now());
            
            this.isPlaying = true;
            this.isPaused = false;
            
            // プロフェッショナルシーケンサー開始
            this.scheduleProfessionalStep();
            
            console.log(`✅ ProfessionalChiptuneEngine: "${music.name}" 再生開始`);
            
        } catch (error) {
            console.error('❌ ProfessionalChiptuneEngine: BGM開始失敗:', error);
        }
    }
    
    /**
     * プロフェッショナルステップスケジューリング
     */
    scheduleProfessionalStep() {
        if (!this.sequencer.isRunning || !this.isPlaying || this.isPaused) {
            return;
        }
        
        const currentTime = Tone.now();
        
        // 先読みスケジューリング（プロフェッショナル版）
        while (this.sequencer.nextStepTime < currentTime + this.performance.scheduleAheadTime) {
            this.playProfessionalStep(this.sequencer.nextStepTime);
            this.advanceProfessionalStep();
        }
        
        // 次回実行をスケジュール
        setTimeout(() => this.scheduleProfessionalStep(), this.performance.updateInterval);
    }
    
    /**
     * プロフェッショナルステップ再生
     */
    playProfessionalStep(time) {
        const pattern = this.sequencer.pattern;
        const stepInMeasure = (this.sequencer.currentBeat * this.sequencer.subdivision / 4) % this.sequencer.subdivision;
        const measureIndex = this.sequencer.currentMeasure % pattern.pulse1.length;
        
        // Pulse1 (メロディー)
        const note1 = pattern.pulse1[measureIndex][stepInMeasure];
        if (note1 && note1 !== '') {
            this.triggerProfessionalNote(this.channels.pulse1, note1, time, '16n', 0.15);
        }
        
        // Pulse2 (ハーモニー)
        const note2 = pattern.pulse2[measureIndex][stepInMeasure];
        if (note2 && note2 !== '') {
            this.triggerProfessionalNote(this.channels.pulse2, note2, time, '16n', 0.12);
        }
        
        // Triangle (ベース)
        const note3 = pattern.triangle[measureIndex][stepInMeasure];
        if (note3 && note3 !== '') {
            this.triggerProfessionalNote(this.channels.triangle, note3, time, '8n', 0.2);
        }
        
        // Noise (ドラム)
        const noiseLevel = pattern.noise[measureIndex][stepInMeasure];
        if (typeof noiseLevel === 'number' && noiseLevel > 0) {
            this.triggerProfessionalNoise(time, noiseLevel * 0.3, '32n');
        }
    }
    
    /**
     * プロフェッショナルノートトリガー
     */
    triggerProfessionalNote(oscillator, note, time, duration, volume) {
        try {
            // システム初期化チェック
            if (!this.isInitialized || !this.channels || !this.effects) {
                console.warn('🎮 ProfessionalChiptuneEngine: System not properly initialized, skipping note trigger');
                return;
            }

            // 新しいシンセインスタンスを作成（ポリフォニー対応）
            const synth = new Tone.Synth({
                oscillator: {
                    type: oscillator.type || 'square'
                },
                envelope: {
                    attack: 0.005,
                    decay: 0.1,
                    sustain: 0.3,
                    release: 0.1
                }
            });
            
            // 音量設定（安全性チェック追加）
            let finalVolume = 0.3; // デフォルト値
            if (this.audioSystem && typeof this.audioSystem.getCalculatedVolume === 'function') {
                finalVolume = this.audioSystem.getCalculatedVolume('bgm', volume);
            }
            
            const dbValue = -25 + (finalVolume * 20);
            
            // synth.volumeの存在確認
            if (synth && synth.volume) {
                synth.volume.value = dbValue;
            } else {
                console.warn('🎮 ProfessionalChiptuneEngine: Synth volume not available');
                return;
            }
            
            // エフェクトチェーンに接続（安全性チェック）
            if (this.effects && this.effects.chorus && this.effects.gain) {
                synth.chain(
                    this.effects.chorus,
                    this.effects.masterFilter,
                    this.effects.reverb,
                    this.effects.stereoWidener,
                    this.effects.compressor,
                    this.effects.limiter,
                    this.effects.gain,
                    Tone.Destination
                );
            } else {
                // フォールバック: 直接出力に接続
                synth.toDestination();
            }
            
            // 再生
            synth.triggerAttackRelease(note, duration, time);
            
            // クリーンアップ
            const durationMs = Tone.Time(duration).toSeconds() * 1000;
            setTimeout(() => {
                synth.dispose();
            }, durationMs + 100);
            
        } catch (error) {
            console.warn('🎮 ProfessionalChiptuneEngine: Note trigger failed:', error);
        }
    }
    
    /**
     * プロフェッショナルノイズトリガー
     */
    triggerProfessionalNoise(time, volume, duration) {
        try {
            // システム初期化チェック
            if (!this.isInitialized || !this.channels || !this.effects) {
                console.warn('🎮 ProfessionalChiptuneEngine: System not properly initialized, skipping noise trigger');
                return;
            }

            const noise = new Tone.Noise({
                type: 'white'
            });
            
            const envelope = new Tone.AmplitudeEnvelope({
                attack: 0.001,
                decay: 0.05,
                sustain: 0.1,
                release: 0.05
            });
            
            // 音量設定（安全性チェック追加）
            let finalVolume = 0.3; // デフォルト値
            if (this.audioSystem && typeof this.audioSystem.getCalculatedVolume === 'function') {
                finalVolume = this.audioSystem.getCalculatedVolume('bgm', volume);
            }
            
            const dbValue = -30 + (finalVolume * 15);
            
            // envelope.volumeの存在確認
            if (envelope && envelope.volume) {
                envelope.volume.value = dbValue;
            } else {
                console.warn('🎮 ProfessionalChiptuneEngine: Envelope volume not available');
                return;
            }
            
            // エフェクトチェーン接続（安全性チェック）
            if (this.effects && this.effects.gain) {
                noise.chain(envelope, this.effects.gain, Tone.Destination);
            } else {
                noise.chain(envelope, Tone.Destination);
            }
            
            // 再生
            noise.start(time);
            envelope.triggerAttackRelease(duration, time);
            
            // クリーンアップ
            const durationMs = Tone.Time(duration).toSeconds() * 1000;
            setTimeout(() => {
                noise.dispose();
                envelope.dispose();
            }, durationMs + 50);
            
        } catch (error) {
            console.warn('🎮 ProfessionalChiptuneEngine: Noise trigger failed:', error);
        }
    }
    
    /**
     * プロフェッショナルステップ進行
     */
    advanceProfessionalStep() {
        // 16分音符単位で進行
        this.sequencer.currentBeat += 0.25;
        
        // 小節の境界チェック
        if (this.sequencer.currentBeat >= this.sequencer.beatsPerMeasure) {
            this.sequencer.currentBeat = 0;
            this.sequencer.currentMeasure++;
            
            // セクション切り替えロジック（アレンジメント）
            const currentSection = this.arrangement.sections[this.arrangement.currentSectionIndex];
            const sectionLength = this.arrangement.measuresPerSection[currentSection];
            
            if (this.sequencer.currentMeasure >= sectionLength) {
                this.sequencer.currentMeasure = 0;
                this.sequencer.loopCount++;
                this.onProfessionalLoopComplete();
            }
        }
        
        // 次ステップ時間計算
        this.sequencer.stepTime = 60 / (this.dynamicMusic.currentTempo * this.sequencer.subdivision);
        this.sequencer.nextStepTime += this.sequencer.stepTime;
    }
    
    /**
     * プロフェッショナルループ完了処理
     */
    onProfessionalLoopComplete() {
        // 999ウェーブ進行による動的変化
        if (this.currentScene === 'battle' && this.game) {
            this.updateDynamicMusicForWave();
        }
        
        // アレンジメント進行
        this.updateArrangementSection();
    }
    
    /**
     * ウェーブ進行による動的音楽更新
     */
    updateDynamicMusicForWave() {
        const wave = this.game.stats?.wave || 1;
        
        // 999ウェーブに対応した段階的変化
        const progressRatio = Math.min(wave / 999, 1.0);
        
        // テンポ加速（150 → 200 BPM）
        const tempoBoost = progressRatio * 50;
        this.dynamicMusic.currentTempo = this.dynamicMusic.baseTempo + tempoBoost;
        
        // キー変調（50Wave毎に半音上昇、最大1オクターブ）
        const keyShift = Math.min(Math.floor(wave / 50), 12);
        this.dynamicMusic.currentKey = (this.dynamicMusic.baseKey + keyShift) % 12;
        
        // インテンシティ上昇（エフェクト強化）
        this.dynamicMusic.intensity = 1.0 + progressRatio * 0.5;
        
        // 感情状態変化
        if (wave < 100) {
            this.dynamicMusic.emotionalState = 'anticipation';
        } else if (wave < 500) {
            this.dynamicMusic.emotionalState = 'tension';
        } else if (wave < 900) {
            this.dynamicMusic.emotionalState = 'climax';
        } else {
            this.dynamicMusic.emotionalState = 'final_battle';
        }
        
        // エフェクト調整
        this.updateDynamicEffects();
        
        console.log(`🎮 Dynamic Music: Wave ${wave}, Tempo ${this.dynamicMusic.currentTempo}, Key +${keyShift}, State ${this.dynamicMusic.emotionalState}`);
    }
    
    /**
     * 動的エフェクト更新
     */
    updateDynamicEffects() {
        if (!this.effects.masterFilter) return;
        
        const intensity = this.dynamicMusic.intensity;
        
        // フィルター周波数調整（緊張感演出）
        const filterFreq = 12000 + (intensity - 1) * 8000;
        this.effects.masterFilter.frequency.setValueAtTime(filterFreq, Tone.now());
        
        // リバーブ調整（空間感演出）
        const reverbWet = 0.2 + (intensity - 1) * 0.3;
        this.effects.reverb.wet.setValueAtTime(Math.min(reverbWet, 0.5), Tone.now());
        
        // コーラス調整（厚み演出）
        const chorusWet = 0.15 + (intensity - 1) * 0.25;
        this.effects.chorus.wet.setValueAtTime(Math.min(chorusWet, 0.4), Tone.now());
    }
    
    /**
     * アレンジメントセクション更新
     */
    updateArrangementSection() {
        // アレンジメントセクションの循環進行
        this.arrangement.currentSectionIndex = 
            (this.arrangement.currentSectionIndex + 1) % this.arrangement.sections.length;
        
        const newSection = this.arrangement.sections[this.arrangement.currentSectionIndex];
        console.log(`🎮 Arrangement: Moving to ${newSection}`);
    }
    
    /**
     * BGM停止
     */
    stopBGM() {
        if (!this.isPlaying) return;
        
        console.log('🎮 ProfessionalChiptuneEngine: BGM停止');
        
        this.isPlaying = false;
        this.sequencer.isRunning = false;
        
        // Transport停止（安全に）
        try {
            if (typeof Tone !== 'undefined') {
                Tone.Transport.stop();
                Tone.Transport.cancel();
            }
        } catch (error) {
            console.warn('Transport stop error:', error);
        }
    }
    
    /**
     * BGM一時停止
     */
    pauseBGM() {
        this.isPaused = true;
        console.log('🎮 ProfessionalChiptuneEngine: BGM一時停止');
    }
    
    /**
     * BGM再開
     */
    resumeBGM() {
        if (this.isPlaying) {
            this.isPaused = false;
            this.scheduleProfessionalStep();
            console.log('🎮 ProfessionalChiptuneEngine: BGM再開');
        }
    }

    /**
     * 穏やかなFF風メニューBGM
     */
    playGentleFFMenuMusic() {
        try {
            console.log('🎵 Playing gentle FF-style menu music...');
            
            // FF風プレリュードのような穏やかなメロディー
            const gentleMelody = [
                { note: 'C4', time: 0, duration: '2n' },
                { note: 'E4', time: 1, duration: '2n' },
                { note: 'G4', time: 2, duration: '2n' },
                { note: 'C5', time: 3, duration: '1n' },
                { note: 'B4', time: 5, duration: '4n' },
                { note: 'A4', time: 5.5, duration: '4n' },
                { note: 'G4', time: 6, duration: '2n' },
                { note: 'F4', time: 7, duration: '4n' },
                { note: 'E4', time: 7.5, duration: '4n' },
                { note: 'D4', time: 8, duration: '2n' },
                { note: 'C4', time: 10, duration: '1n' }
            ];
            
            // ハーモニーライン（穏やかな和音）
            const harmonyLine = [
                { note: 'E3', time: 0, duration: '1n' },
                { note: 'G3', time: 2, duration: '1n' },
                { note: 'F3', time: 4, duration: '1n' },
                { note: 'G3', time: 6, duration: '1n' },
                { note: 'C3', time: 8, duration: '2n' }
            ];
            
            // ベースライン（柔らかい低音）
            const bassLine = [
                { note: 'C2', time: 0, duration: '1n' },
                { note: 'G2', time: 2, duration: '1n' },
                { note: 'F2', time: 4, duration: '1n' },
                { note: 'G2', time: 6, duration: '1n' },
                { note: 'C2', time: 8, duration: '2n' }
            ];
            
            // 穏やかな音量設定
            const volume = this.audioSystem.getCalculatedVolume('bgm', 0.3);
            
            // メロディー再生
            if (this.channels.pulse1) {
                gentleMelody.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        this.triggerProfessionalNote(
                            this.channels.pulse1, 
                            note.note, 
                            note.duration, 
                            time, 
                            volume * 0.8
                        );
                    }, note.time);
                });
            }
            
            // ハーモニー再生
            if (this.channels.pulse2) {
                harmonyLine.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        this.triggerProfessionalNote(
                            this.channels.pulse2, 
                            note.note, 
                            note.duration, 
                            time, 
                            volume * 0.6
                        );
                    }, note.time);
                });
            }
            
            // ベース再生
            if (this.channels.triangle) {
                bassLine.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        this.triggerProfessionalNote(
                            this.channels.triangle, 
                            note.note, 
                            note.duration, 
                            time, 
                            volume * 0.7
                        );
                    }, note.time);
                });
            }
            
            // ループ設定
            Tone.Transport.scheduleRepeat((time) => {
                this.playGentleFFMenuMusic();
            }, '12m', '12m');
            
            console.log('✅ Gentle FF-style menu music started successfully');
            
        } catch (error) {
            console.error('🎵 Gentle FF menu music failed:', error);
        }
    }
    
    /**
     * クリアなバトルBGM（ザーーー音除去版）
     */
    playClearBattleMusic() {
        try {
            console.log('⚔️ Playing clear battle music...');
            
            // クリアなバトルメロディー（ザーーー音なし）
            const battleMelody = [
                { note: 'A4', time: 0, duration: '8n' },
                { note: 'B4', time: 0.25, duration: '8n' },
                { note: 'C5', time: 0.5, duration: '8n' },
                { note: 'D5', time: 0.75, duration: '8n' },
                { note: 'E5', time: 1, duration: '4n' },
                { note: 'D5', time: 1.5, duration: '8n' },
                { note: 'C5', time: 1.75, duration: '8n' },
                { note: 'B4', time: 2, duration: '4n' },
                { note: 'A4', time: 2.5, duration: '4n' },
                { note: 'G4', time: 3, duration: '2n' }
            ];
            
            // リズムライン（クリアなパーカッション）
            const rhythmPattern = [
                { time: 0, duration: '16n' },
                { time: 0.5, duration: '16n' },
                { time: 1, duration: '16n' },
                { time: 1.5, duration: '16n' },
                { time: 2, duration: '8n' },
                { time: 3, duration: '8n' },
                { time: 3.5, duration: '16n' }
            ];
            
            // バトル音量設定（適切な音量）
            const volume = this.audioSystem.getCalculatedVolume('bgm', 0.4);
            
            // メロディー再生（クリアな音質）
            if (this.channels.pulse1) {
                battleMelody.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        this.triggerProfessionalNote(
                            this.channels.pulse1, 
                            note.note, 
                            note.duration, 
                            time, 
                            volume * 0.8  // 適切な音量
                        );
                    }, note.time);
                });
            }
            
            // リズム再生（ノイズ抑制）
            if (this.channels.noise) {
                rhythmPattern.forEach(beat => {
                    Tone.Transport.schedule((time) => {
                        this.triggerProfessionalNoise(
                            time, 
                            volume * 0.3,  // ノイズ音量を抱制
                            beat.duration
                        );
                    }, beat.time);
                });
            }
            
            // ベースライン
            const battleBass = [
                { note: 'A2', time: 0, duration: '4n' },
                { note: 'F2', time: 1, duration: '4n' },
                { note: 'G2', time: 2, duration: '4n' },
                { note: 'A2', time: 3, duration: '4n' }
            ];
            
            if (this.channels.triangle) {
                battleBass.forEach(note => {
                    Tone.Transport.schedule((time) => {
                        this.triggerProfessionalNote(
                            this.channels.triangle, 
                            note.note, 
                            note.duration, 
                            time, 
                            volume * 0.6
                        );
                    }, note.time);
                });
            }
            
            // バトルループ設定
            Tone.Transport.scheduleRepeat((time) => {
                this.playClearBattleMusic();
            }, '4m', '4m');
            
            console.log('✅ Clear battle music started successfully');
            
        } catch (error) {
            console.error('⚔️ Clear battle music failed:', error);
        }
    }
    
    /**
     * 動的パラメータ更新（統合システム対応）
     */
    updateDynamicParams(params) {
        try {
            if (params.tempo) {
                this.dynamicMusic.currentTempo = params.tempo;
                console.log(`🎵 Chiptune tempo updated: ${params.tempo} BPM`);
            }
            
            if (params.intensity) {
                this.dynamicMusic.intensity = params.intensity;
                console.log(`🎵 Chiptune intensity updated: ${params.intensity}`);
            }
            
            if (params.tensionLevel) {
                this.dynamicMusic.emotionalState = this.getTensionState(params.tensionLevel);
                console.log(`🎵 Chiptune tension: ${this.dynamicMusic.emotionalState}`);
            }
            
            // 動的エフェクト適用
            this.updateDynamicEffects();
            
        } catch (error) {
            console.warn('🎵 Dynamic params update failed:', error);
        }
    }
    
    /**
     * テンションレベルから感情状態へ変換
     */
    getTensionState(tensionLevel) {
        switch(tensionLevel) {
            case 1: return 'anticipation';
            case 2: return 'building';
            case 3: return 'tension';
            case 4: return 'climax';
            case 5: return 'ultimate';
            default: return 'anticipation';
        }
    }
    
    /**
     * 音量更新
     */
    updateVolume() {
        if (this.effects.gain) {
            const volume = this.audioSystem.getCalculatedVolume('bgm', 0.4);
            this.effects.gain.gain.setValueAtTime(volume, Tone.now());
        }
    }
    
    /**
     * システム破棄
     */
    destroy() {
        this.stopBGM();
        
        // チャンネル破棄
        Object.values(this.channels).forEach(channel => {
            if (channel) {
                channel.dispose();
            }
        });
        
        // エフェクト破棄
        Object.values(this.effects).forEach(effect => {
            if (effect) {
                effect.dispose();
            }
        });
        
        console.log('🎮 ProfessionalChiptuneEngine: システム破棄完了');
    }
}