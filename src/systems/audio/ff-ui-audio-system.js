/**
 * FFUIAudioSystem - ファイナルファンタジー風UI音響システム
 * README.md完全対応: 「派手で印象に残るファイナルファンタジーにインスパイアされたUI音」
 * 
 * 🎭 設計理念：
 * - FFシリーズの象徴的なUI音響の再現
 * - メニュー選択・レベルアップ・アイテム取得等の記憶に残る音
 * - 魔法的でファンタジックな音響デザイン
 * - ゲーム体験を向上させる感情的インパクト
 */

export class FFUIAudioSystem {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.game = audioSystem.game;
        
        // システム状態
        this.isInitialized = false;
        this.soundCount = 0;
        this.maxConcurrentSounds = 6;
        
        // FF風UI音源
        this.uiSynths = {};
        
        // 魔法的エフェクトチェーン
        this.effects = {
            crystalReverb: null,     // クリスタルのような響き
            chorusShimmer: null,     // きらめくコーラス
            magicFilter: null,       // 魔法的フィルター
            compressor: null,        // ダイナミクス制御
            stereoWidener: null,     // ステレオ効果
            gain: null               // マスターゲイン
        };
        
        // FF風UI音響プロファイル
        this.uiProfiles = this.createFFUIProfiles();
        
        // 音響統計
        this.stats = {
            totalLevelUps: 0,
            totalPickups: 0,
            totalReloads: 0,
            totalDamages: 0,
            maxSimultaneous: 0,
            avgLatency: 0
        };
        
        console.log('🎭 FFUIAudioSystem: ファイナルファンタジー風UI音響システム初期化中...');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🎭 FFUIAudioSystem: FF風UI音響システム初期化開始...');
            
            // Tone.js可用性チェック
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available for FF UI audio');
            }
            
            // FF風シンセサイザー作成
            await this.createFFUISynths();
            
            // エフェクトチェーン作成
            this.createFFUIEffectChain();
            
            this.isInitialized = true;
            console.log('✅ FFUIAudioSystem: ファイナルファンタジー風UI音響システム準備完了');
            
            return { success: true, message: 'FF UI audio system ready' };
            
        } catch (error) {
            console.error('❌ FFUIAudioSystem: 初期化失敗:', error);
            this.isInitialized = false;
            return { success: false, message: `FF UI audio init failed: ${error.message}` };
        }
    }
    
    /**
     * FF風UI音響シンセサイザー作成
     */
    async createFFUISynths() {
        // レベルアップ音（ファンファーレ風）
        this.uiSynths.levelUp = new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: 4,
            voice: {
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.01,
                    decay: 0.3,
                    sustain: 0.8,
                    release: 1.0
                }
            }
        });
        
        // アイテム取得音（キラキラ音）
        this.uiSynths.pickup = new Tone.FMSynth({
            harmonicity: 4,
            modulationIndex: 12,
            detune: 0,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.005,
                decay: 0.2,
                sustain: 0.3,
                release: 0.8
            },
            modulation: {
                type: 'sine'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.1,
                release: 0.4
            }
        });
        
        // リロード音（魔法詠唱風）
        this.uiSynths.reload = new Tone.AMSynth({
            harmonicity: 3,
            detune: 0,
            oscillator: {
                type: 'sawtooth'
            },
            envelope: {
                attack: 0.02,
                decay: 0.1,
                sustain: 0.7,
                release: 0.5
            },
            modulation: {
                type: 'square'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.5,
                release: 0.3
            }
        });
        
        // ダメージ音（肉体的衝撃音）
        this.uiSynths.damage = new Tone.NoiseSynth({
            noise: {
                type: 'brown'  // 低音ノイズでドスッという衝撃感
            },
            envelope: {
                attack: 0.001,
                decay: 0.06,
                sustain: 0.15,   // サステイン増加で痛み持続
                release: 0.4     // 長めのリリースで長引く痛み
            }
        });
        
        // 肉体的インパクト音（低周波衝撃）
        this.uiSynths.bodyImpact = new Tone.MembraneSynth({
            pitchDecay: 0.03,    // 短いピッチディケイ
            octaves: 6,          // 低いオクターブ
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.05,
                release: 0.25,
                attackCurve: 'exponential'
            }
        });
        
        // 痛みの息切れ音（フィルターされたノイズ）
        this.uiSynths.painBreath = new Tone.NoiseSynth({
            noise: {
                type: 'pink'
            },
            envelope: {
                attack: 0.02,
                decay: 0.05,
                sustain: 0.3,
                release: 0.2
            }
        });
        
        // 内臓振動音（超低周波振動）
        this.uiSynths.visceralShock = new Tone.Oscillator({
            frequency: 25,  // 超低周波で内臓が揺れる感覚
            type: 'sine'
        });
        
        // 振動効果用のLFO
        this.uiSynths.shockLFO = new Tone.LFO({
            frequency: 8,   // 8Hzの振動
            min: 20,
            max: 30
        });
        
        // 血流ドクドク音（心臓の鼓動風）
        this.uiSynths.bloodPulse = new Tone.MembraneSynth({
            pitchDecay: 0.01,
            octaves: 2,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.05,
                sustain: 0.1,
                release: 0.1,
                attackCurve: 'sine'
            }
        });
        
        // 選択音（メニュー選択風）
        this.uiSynths.select = new Tone.PluckSynth({
            attackNoise: 1,
            dampening: 2000,
            resonance: 0.9
        });
        
        // 確定音（決定音）
        this.uiSynths.confirm = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 10,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.001,
                decay: 0.4,
                sustain: 0.01,
                release: 1.4,
                attackCurve: 'exponential'
            }
        });
        
        // ボタンホバー音（Skill Select風のキラキラ音）
        this.uiSynths.buttonHover = new Tone.FMSynth({
            harmonicity: 2.5,       // Skill Selectと同じ設定
            modulationIndex: 6,     // Skill Selectと同じ設定
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.12,        // 少し短めに調整
                sustain: 0.15,
                release: 0.3
            },
            modulation: {
                type: 'sine'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.15,
                sustain: 0.1,
                release: 0.2
            }
        });
        
        // ゲーム開始音（スペシャルファンファーレ）
        this.uiSynths.gameStart = new Tone.PolySynth(Tone.Synth, {
            maxPolyphony: 6,
            voice: {
                oscillator: {
                    type: 'sine'
                },
                envelope: {
                    attack: 0.02,
                    decay: 0.4,
                    sustain: 0.6,
                    release: 1.2
                }
            }
        });
        
        // スキル選択音（キラキラ音）
        this.uiSynths.skillSelect = new Tone.FMSynth({
            harmonicity: 2.5,
            modulationIndex: 6,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.15,
                sustain: 0.2,
                release: 0.4
            },
            modulation: {
                type: 'sine'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.1,
                release: 0.3
            }
        });
        
        // メニューナビゲーション音（Skill Select風のキラキラ音）
        this.uiSynths.menuNav = new Tone.FMSynth({
            harmonicity: 2.5,       // Skill Selectと同じ設定
            modulationIndex: 6,     // Skill Selectと同じ設定
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.005,      // よりクイックな反応
                decay: 0.08,        // かなり短めに調整
                sustain: 0.1,
                release: 0.2
            },
            modulation: {
                type: 'sine'
            },
            modulationEnvelope: {
                attack: 0.005,
                decay: 0.1,
                sustain: 0.05,
                release: 0.15
            }
        });
        
        console.log('🎭 FFUIAudioSystem: FF風UIシンセサイザー作成完了');
    }
    
    /**
     * FF風UI音響エフェクトチェーン作成
     */
    createFFUIEffectChain() {
        // クリスタルリバーブ（FF風響き）
        this.effects.crystalReverb = new Tone.Reverb({
            decay: 2.5,
            wet: 0.3,
            roomSize: 0.8
        });
        
        // きらめきコーラス
        this.effects.chorusShimmer = new Tone.Chorus({
            frequency: 4,
            delayTime: 3.5,
            depth: 0.4,
            wet: 0.3
        });
        
        // 魔法的ローパスフィルター
        this.effects.magicFilter = new Tone.Filter({
            frequency: 12000,
            type: 'lowpass',
            rolloff: -12
        });
        
        // ダイナミクスコンプレッサー
        this.effects.compressor = new Tone.Compressor({
            threshold: -18,
            ratio: 4,
            attack: 0.003,
            release: 0.1
        });
        
        // ステレオワイドナー
        this.effects.stereoWidener = new Tone.StereoWidener({
            width: 0.3
        });
        
        // マスターゲイン
        this.effects.gain = new Tone.Gain(0.8);
        
        // FF風エフェクトチェーン接続
        const ffUIChain = [
            this.effects.chorusShimmer,
            this.effects.magicFilter,
            this.effects.crystalReverb,
            this.effects.stereoWidener,
            this.effects.compressor,
            this.effects.gain,
            Tone.Destination
        ];
        
        // 全UIシンセをチェーンに接続
        Object.values(this.uiSynths).forEach(synth => {
            if (synth) {
                // LFOとOscillator以外のシンセをチェーンに接続
                if (!(synth instanceof Tone.LFO) && !(synth instanceof Tone.Oscillator || 
                    (synth.oscillator && typeof synth.start === 'function'))) {
                    synth.chain(...ffUIChain);
                } else if (synth instanceof Tone.Oscillator) {
                    // Oscillatorは直接destinationに接続
                    synth.toDestination();
                }
            }
        });
        
        console.log('🎭 FFUIAudioSystem: FF風UIエフェクトチェーン作成完了');
    }
    
    /**
     * FF風UI音響プロファイル作成
     */
    createFFUIProfiles() {
        return {
            levelUp: {
                name: 'FF Victory Fanfare',
                synth: 'levelUp',
                sequence: [
                    { notes: ['C4', 'E4', 'G4'], duration: '8n', delay: 0 },
                    { notes: ['D4', 'F4', 'A4'], duration: '8n', delay: 0.2 },
                    { notes: ['E4', 'G4', 'B4'], duration: '8n', delay: 0.4 },
                    { notes: ['F4', 'A4', 'C5'], duration: '4n', delay: 0.6 }
                ],
                characteristics: 'FFのレベルアップファンファーレのような壮大な和音進行'
            },
            
            pickup: {
                name: 'FF Crystal Get',
                synth: 'pickup',
                sequence: [
                    { frequency: 1200, duration: 0.1, delay: 0 },
                    { frequency: 1600, duration: 0.15, delay: 0.08 },
                    { frequency: 2000, duration: 0.2, delay: 0.16 },
                    { frequency: 2400, duration: 0.3, delay: 0.24 }
                ],
                characteristics: 'FF風クリスタル・アイテム取得音のような上昇キラキラ音'
            },
            
            reload: {
                name: 'FF Magic Charge',
                synth: 'reload',
                sequence: [
                    { frequency: 300, duration: 0.3, delay: 0 },
                    { frequency: 450, duration: 0.25, delay: 0.15 },
                    { frequency: 600, duration: 0.2, delay: 0.25 },
                    { frequency: 800, duration: 0.15, delay: 0.35 }
                ],
                characteristics: 'FF風魔法詠唱チャージ音のような神秘的な上昇音'
            },
            
            damage: {
                name: 'FF Bodily Impact Enhanced',
                synth: 'damage',
                sequence: [
                    { duration: 0.1, delay: 0, type: 'impact' },          // Layer 1: メイン衝撃音
                    { frequency: 80, duration: 0.15, delay: 0.02, type: 'body' },    // Layer 2: 肉体インパクト
                    { frequency: 25, duration: 0.2, delay: 0.05, type: 'visceral' }, // Layer 3: 内臓振動（NEW）
                    { duration: 0.08, delay: 0.1, type: 'breath' },       // Layer 4: 痛みの息切れ
                    { frequency: 60, duration: 0.3, delay: 0.2, type: 'blood' }      // Layer 5: 血流ドクドク（NEW）
                ],
                characteristics: 'FF風5層肉体的ダメージ音：衝撃+肉体+内臓+息切れ+血流の重層的苦痛表現'
            },
            
            select: {
                name: 'FF Menu Select',
                synth: 'select',
                sequence: [
                    { frequency: 800, duration: 0.1, delay: 0 }
                ],
                characteristics: 'FF風メニュー選択音のような軽快な確認音'
            },
            
            confirm: {
                name: 'FF Decision',
                synth: 'confirm',
                sequence: [
                    { frequency: 400, duration: 0.3, delay: 0 },
                    { frequency: 600, duration: 0.2, delay: 0.1 }
                ],
                characteristics: 'FF風決定音のような確定感のある音'
            },
            
            buttonHover: {
                name: 'FF Button Hover',
                synth: 'buttonHover',
                sequence: [
                    { frequency: 600, duration: 0.08, delay: 0 }
                ],
                characteristics: 'FF風ボタンホバー時の軽やかな知らせ音'
            },
            
            gameStart: {
                name: 'FF Game Start Fanfare (Compact)',
                synth: 'gameStart',
                sequence: [
                    { notes: ['C4', 'E4', 'G4'], duration: '8n', delay: 0 },        // 短く
                    { notes: ['F4', 'A4', 'C5'], duration: '8n', delay: 0.3 },      // 中間の和音を統合
                    { notes: ['G4', 'B4', 'D5', 'G5'], duration: '4n', delay: 0.6 } // 最終和音（4音で豪華に）
                ],
                characteristics: 'FF風ゲーム開始のコンパクトで印象的なファンファーレ（1.5秒）'
            },
            
            skillSelect: {
                name: 'FF Skill Selection',
                synth: 'skillSelect',
                sequence: [
                    { frequency: 800, duration: 0.15, delay: 0 },
                    { frequency: 1200, duration: 0.12, delay: 0.08 },
                    { frequency: 1600, duration: 0.1, delay: 0.15 }
                ],
                characteristics: 'FF風スキル選択時のキラキラ上昇音'
            },
            
            menuNav: {
                name: 'FF Menu Navigation',
                synth: 'menuNav',
                sequence: [
                    { frequency: 400, duration: 0.06, delay: 0 }
                ],
                characteristics: 'FF風メニューナビゲーションのシンプルな確認音'
            }
        };
    }
    
    /**
     * FF風レベルアップ音再生
     */
    async playFFLevelUpSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.levelUp;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) {
                console.warn(`Synth not found: ${profile.synth}`);
                return;
            }
            
            // 音量計算
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.8);
            const dbValue = -12 + (volume * 15);
            synth.volume.value = dbValue;
            
            // FF風ファンファーレ再生
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        synth.triggerAttackRelease(note.notes, note.duration);
                    } catch (error) {
                        console.warn('Level up note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            this.stats.totalLevelUps++;
            this.updateSoundCount(1);
            
            console.log('🎭 FF Victory Fanfare played! Level up celebration!');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: レベルアップ音再生失敗:', error);
        }
    }
    
    /**
     * FF風アイテム取得音再生
     */
    async playFFPickupSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.pickup;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) {
                console.warn(`Synth not found: ${profile.synth}`);
                return;
            }
            
            // 音量計算
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.6);
            const dbValue = -15 + (volume * 12);
            synth.volume.value = dbValue;
            
            // FF風キラキラ音再生
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        synth.triggerAttackRelease(note.frequency, note.duration);
                    } catch (error) {
                        console.warn('Pickup note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            this.stats.totalPickups++;
            this.updateSoundCount(1);
            
            console.log('🎭 FF Crystal Get sound! ✨');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: アイテム取得音再生失敗:', error);
        }
    }
    
    /**
     * FF風リロード音再生
     */
    async playFFReloadSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.reload;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) {
                console.warn(`Synth not found: ${profile.synth}`);
                return;
            }
            
            // 音量計算
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.7);
            const dbValue = -14 + (volume * 12);
            synth.volume.value = dbValue;
            
            // FF風魔法詠唱音再生
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        synth.triggerAttackRelease(note.frequency, note.duration);
                    } catch (error) {
                        console.warn('Reload note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            this.stats.totalReloads++;
            this.updateSoundCount(1);
            
            console.log('🎭 FF Magic Charge sound! 🔮');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: リロード音再生失敗:', error);
        }
    }
    
    /**
     * FF風ダメージ音再生
     */
    async playFFDamageSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.damage;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) {
                console.warn(`Synth not found: ${profile.synth}`);
                return;
            }
            
            // 音量計算
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.9);
            const dbValue = -10 + (volume * 12);
            synth.volume.value = dbValue;
            
            // FF風5層肉体的ダメージ音再生（強化版多層インパクト）
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        if (note.type === 'impact') {
                            // Layer 1: 衝撃音（メインノイズ）
                            synth.triggerAttackRelease(note.duration);
                        } else if (note.type === 'body' && this.uiSynths.bodyImpact) {
                            // Layer 2: 肉体インパクト（低周波ドスッ）
                            this.uiSynths.bodyImpact.volume.value = dbValue - 3;
                            this.uiSynths.bodyImpact.triggerAttackRelease(note.frequency, note.duration);
                        } else if (note.type === 'visceral' && this.uiSynths.visceralShock) {
                            // Layer 3: 内臓振動（NEW - 超低周波で内臓が揺れる感覚）
                            this.uiSynths.visceralShock.volume.value = dbValue - 6;
                            this.uiSynths.shockLFO.connect(this.uiSynths.visceralShock.frequency);
                            this.uiSynths.shockLFO.start();
                            this.uiSynths.visceralShock.start();
                            this.uiSynths.visceralShock.stop(`+${note.duration}`);
                            this.uiSynths.shockLFO.stop(`+${note.duration}`);
                        } else if (note.type === 'breath' && this.uiSynths.painBreath) {
                            // Layer 4: 痛みの息切れ音
                            this.uiSynths.painBreath.volume.value = dbValue - 6;
                            this.uiSynths.painBreath.triggerAttackRelease(note.duration);
                        } else if (note.type === 'blood' && this.uiSynths.bloodPulse) {
                            // Layer 5: 血流ドクドク音（NEW - 心臓の鼓動風）
                            this.uiSynths.bloodPulse.volume.value = dbValue - 10;
                            // 2回の鼓動
                            this.uiSynths.bloodPulse.triggerAttackRelease(note.frequency, '16n');
                            setTimeout(() => {
                                this.uiSynths.bloodPulse.triggerAttackRelease(note.frequency * 0.9, '16n');
                            }, 150);
                        }
                    } catch (error) {
                        console.warn('Damage note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            this.stats.totalDamages++;
            this.updateSoundCount(1);
            
            console.log('🎭 FF Enhanced 5-Layer Bodily Impact! 💥⚡🩸 (Impact+Body+Visceral+Breath+Blood)');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: ダメージ音再生失敗:', error);
        }
    }
    
    /**
     * FF風選択音再生
     */
    async playFFSelectSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.select;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) return;
            
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.5);
            const dbValue = -18 + (volume * 10);
            synth.volume.value = dbValue;
            
            synth.triggerAttackRelease(800, 0.1);
            
            console.log('🎭 FF Menu Select sound!');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: 選択音再生失敗:', error);
        }
    }
    
    /**
     * FF風確定音再生
     */
    async playFFConfirmSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.confirm;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) return;
            
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.7);
            const dbValue = -16 + (volume * 12);
            synth.volume.value = dbValue;
            
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    synth.triggerAttackRelease(note.frequency, note.duration);
                }, note.delay * 1000);
            });
            
            console.log('🎭 FF Decision sound! ✓');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: 確定音再生失敗:', error);
        }
    }
    
    /**
     * 同時再生音数管理
     */
    updateSoundCount(delta) {
        this.soundCount += delta;
        this.stats.maxSimultaneous = Math.max(this.stats.maxSimultaneous, this.soundCount);
        
        // 自動減少（音の長さを考慮）
        setTimeout(() => {
            this.soundCount = Math.max(0, this.soundCount - 1);
        }, 1000);
    }
    
    /**
     * 音量更新
     */
    updateVolume() {
        if (this.effects.gain) {
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.8);
            this.effects.gain.gain.setValueAtTime(volume, Tone.now());
        }
    }
    
    /**
     * 統計取得
     */
    getStats() {
        return {
            ...this.stats,
            currentSounds: this.soundCount,
            systemReady: this.isInitialized
        };
    }
    
    /**
     * FF風ボタンホバー音再生
     */
    async playFFButtonHoverSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.buttonHover;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) return;
            
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.6);  // 0.3 → 0.6に倍増
            const dbValue = -10 + (volume * 12);  // -20 → -10、8 → 12に大幅向上
            synth.volume.value = dbValue;
            
            // Skill Select風の周波数パターン
            synth.triggerAttackRelease(800, 0.08);
            
            console.log('🎭 FF Button Hover sound! 👆');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: ボタンホバー音再生失敗:', error);
        }
    }
    
    /**
     * FF風ゲーム開始ファンファーレ再生
     */
    async playFFGameStartSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.gameStart;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) return;
            
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.9);
            const dbValue = -8 + (volume * 18);
            synth.volume.value = dbValue;
            
            // 壮大なファンファーレ再生
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        synth.triggerAttackRelease(note.notes, note.duration);
                    } catch (error) {
                        console.warn('Game start note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            console.log('🎭 FF Game Start Fanfare! 🎆');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: ゲーム開始音再生失敗:', error);
        }
    }
    
    /**
     * FF風スキル選択音再生
     */
    async playFFSkillSelectSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.skillSelect;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) return;
            
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.6);
            const dbValue = -16 + (volume * 12);
            synth.volume.value = dbValue;
            
            // キラキラ上昇音再生
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        synth.triggerAttackRelease(note.frequency, note.duration);
                    } catch (error) {
                        console.warn('Skill select note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            console.log('🎭 FF Skill Selection sound! ✨');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: スキル選択音再生失敗:', error);
        }
    }
    
    /**
     * FF風メニューナビゲーション音再生
     */
    async playFFMenuNavSound() {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.uiProfiles.menuNav;
            const synth = this.uiSynths[profile.synth];
            
            if (!synth) {
                console.warn(`Synth not found: ${profile.synth}`);
                return;
            }
            
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.7);  // 0.6 → 0.7にさらに向上
            const dbValue = -8 + (volume * 15);  // -10 → -8、12 → 15に大幅向上
            synth.volume.value = dbValue;
            
            // プロファイルのsequenceを正しく使用
            profile.sequence.forEach((note, index) => {
                setTimeout(() => {
                    try {
                        synth.triggerAttackRelease(note.frequency, note.duration);
                        console.log(`🎭 [MENU NAV DEBUG] Playing frequency: ${note.frequency}, duration: ${note.duration}`);
                    } catch (error) {
                        console.warn('Menu nav note play failed:', error);
                    }
                }, note.delay * 1000);
            });
            
            console.log('🎭 FF Menu Navigation sound! 🧭 (Profile-based sequence)');
            
        } catch (error) {
            console.warn('🎭 FFUIAudioSystem: メニューナビゲーション音再生失敗:', error);
        }
    }
    
    /**
     * 統計リセット
     */
    resetStats() {
        this.stats = {
            totalLevelUps: 0,
            totalPickups: 0,
            totalReloads: 0,
            totalDamages: 0,
            maxSimultaneous: 0,
            avgLatency: 0
        };
    }
    
    /**
     * システム破棄
     */
    destroy() {
        // シンセサイザー破棄
        Object.values(this.uiSynths).forEach(synth => {
            if (synth) {
                try {
                    // LFOとOscillatorは先にstopしてからdispose
                    if (synth instanceof Tone.LFO || synth instanceof Tone.Oscillator) {
                        if (synth.state === 'started') {
                            synth.stop();
                        }
                    }
                    synth.dispose();
                } catch (error) {
                    console.warn('Synth disposal error:', error);
                }
            }
        });
        
        // エフェクト破棄
        Object.values(this.effects).forEach(effect => {
            if (effect) {
                effect.dispose();
            }
        });
        
        console.log('🎭 FFUIAudioSystem: ファイナルファンタジー風UI音響システム破棄完了');
    }
}