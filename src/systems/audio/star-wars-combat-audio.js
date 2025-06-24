/**
 * StarWarsCombatAudio - スターウォーズ風戦闘音響システム
 * README.md完全対応: 「爽快感を最大化するスターウォーズにインスパイアされた戦闘音」
 * 
 * 🎬 設計理念：
 * - 銀河帝国の壮大なサウンドスケープ
 * - ライトセーバー・ブラスター・TIEファイター音の再現
 * - 敵撃破時の圧倒的爽快感
 * - 武器別の個性的な音響デザイン
 */

export class StarWarsCombatAudio {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.game = audioSystem.game;
        
        // システム状態
        this.isInitialized = false;
        this.soundCount = 0;
        this.maxConcurrentSounds = 8;
        
        // スターウォーズ風音源
        this.combatSynths = {};
        
        // エフェクトチェーン
        this.effects = {
            spatialReverb: null,    // 宇宙空間の広がり
            chorusFlanger: null,    // 金属的な響き
            distortion: null,       // 爆発の迫力
            compressor: null,       // パンチ力
            filter: null,           // 周波数シェイピング
            gain: null              // マスターゲイン
        };
        
        // 武器音響プロファイル（スターウォーズ風）
        this.weaponProfiles = this.createStarWarsWeaponProfiles();
        
        // 敵音響プロファイル（TIEファイター・デススター風）
        this.enemyProfiles = this.createStarWarsEnemyProfiles();
        
        // 音響統計
        this.stats = {
            totalShots: 0,
            totalHits: 0,
            totalDeaths: 0,
            maxSimultaneous: 0,
            avgLatency: 0
        };
        
        console.log('🎬 StarWarsCombatAudio: 銀河帝国音響システム初期化中...');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🎬 StarWarsCombatAudio: スターウォーズ風音響システム初期化開始...');
            
            // Tone.js可用性チェック
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available for Star Wars combat audio');
            }
            
            // スターウォーズ風シンセサイザー作成
            await this.createStarWarsSynths();
            
            // エフェクトチェーン作成
            this.createStarWarsEffectChain();
            
            this.isInitialized = true;
            console.log('✅ StarWarsCombatAudio: 銀河帝国音響システム準備完了');
            
            return { success: true, message: 'Star Wars combat audio system ready' };
            
        } catch (error) {
            console.error('❌ StarWarsCombatAudio: 初期化失敗:', error);
            this.isInitialized = false;
            return { success: false, message: `Star Wars audio init failed: ${error.message}` };
        }
    }
    
    /**
     * スターウォーズ風シンセサイザー作成
     */
    async createStarWarsSynths() {
        // ブラスター射撃用（レーザー音）
        this.combatSynths.blaster = new Tone.Synth({
            oscillator: {
                type: 'sawtooth'
            },
            envelope: {
                attack: 0.001,
                decay: 0.05,
                sustain: 0.3,
                release: 0.1
            }
        });
        
        // ライトセーバー風（特殊武器用）
        this.combatSynths.lightsaber = new Tone.Synth({
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.3,
                sustain: 0.7,
                release: 0.2
            }
        });
        
        // 一般的なヒット音（金属音ではない）
        this.combatSynths.genericHit = new Tone.NoiseSynth({
            noise: {
                type: 'pink'
            },
            envelope: {
                attack: 0.001,
                decay: 0.08,
                sustain: 0.0,
                release: 0.06
            }
        });
        
        // ボス専用ヒット音（重厚インパクト音に改良）
        this.combatSynths.bossHit = new Tone.MembraneSynth({
            pitchDecay: 0.01,        // 超短いピッチディケイで重厚感
            octaves: 10,             // 広いオクターブレンジ
            oscillator: {
                type: 'sine'         // クリアな基本波形
            },
            envelope: {
                attack: 0.001,       // 即座のアタック
                decay: 0.03,         // 短いディケイでパンチ力
                sustain: 0.0,        // ゼロサステインで瞬間的インパクト
                release: 0.2,        // 適度なリリースで重厚な余韻
                attackCurve: 'exponential'
            }
        });
        
        // 小爆発音（小型敵用）
        this.combatSynths.smallExplosion = new Tone.NoiseSynth({
            noise: {
                type: 'white'
            },
            envelope: {
                attack: 0.001,
                decay: 0.1,
                sustain: 0.0,
                release: 0.2
            }
        });

        // 中爆発音（中型敵用）
        this.combatSynths.mediumExplosion = new Tone.NoiseSynth({
            noise: {
                type: 'pink'
            },
            envelope: {
                attack: 0.003,
                decay: 0.15,
                sustain: 0.05,
                release: 0.4
            }
        });

        // 大爆発音（大型敵用）
        this.combatSynths.largeExplosion = new Tone.NoiseSynth({
            noise: {
                type: 'brown'
            },
            envelope: {
                attack: 0.005,
                decay: 0.2,
                sustain: 0.1,
                release: 0.6
            }
        });

        // デススター爆発風（ボス用）
        this.combatSynths.deathStar = new Tone.NoiseSynth({
            noise: {
                type: 'brown'
            },
            envelope: {
                attack: 0.005,
                decay: 0.3,
                sustain: 0.15,
                release: 1.0
            }
        });
        
        // フォース風（エネルギー音）
        this.combatSynths.force = new Tone.AMSynth({
            harmonicity: 2,
            detune: 0,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.3,
                release: 0.4
            },
            modulation: {
                type: 'square'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.5,
                sustain: 1,
                release: 0.5
            }
        });
        
        // ビーム砲風（重武器用）
        this.combatSynths.beamCannon = new Tone.FMSynth({
            harmonicity: 3,
            modulationIndex: 10,
            detune: 0,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.01,
                sustain: 1,
                release: 0.5
            },
            modulation: {
                type: 'square'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.2,
                release: 0.1
            }
        });
        
        // === 多層インパクトシステム（敵ヒット音強化） ===
        
        // メインインパクト音（金属的衝撃）
        this.combatSynths.metalImpact = new Tone.MetalSynth({
            frequency: 200,
            envelope: {
                attack: 0.001,
                decay: 0.1,
                release: 0.2
            },
            harmonicity: 5.1,
            modulationIndex: 32,
            resonance: 4000,
            octaves: 1.5
        });
        
        // エネルギー放出音（プラズマヒット）
        this.combatSynths.energyBurst = new Tone.PluckSynth({
            attackNoise: 1,
            dampening: 4000,
            resonance: 0.7
        });
        
        // シールドスパーク音（電気的音）
        this.combatSynths.shieldSpark = new Tone.NoiseSynth({
            noise: {
                type: 'white'
            },
            envelope: {
                attack: 0.001,
                decay: 0.05,
                sustain: 0.02,
                release: 0.1
            }
        });
        
        // アーマークラック音（低周波振動）
        this.combatSynths.armorCrack = new Tone.MembraneSynth({
            pitchDecay: 0.05,
            octaves: 4,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.001,
                decay: 0.2,
                sustain: 0.01,
                release: 0.3,
                attackCurve: 'exponential'
            }
        });
        
        // レーザーシザー音（レーザーが物質を焼く音）
        this.combatSynths.laserSizzle = new Tone.FMSynth({
            harmonicity: 8,
            modulationIndex: 25,
            oscillator: {
                type: 'sine'
            },
            envelope: {
                attack: 0.01,
                decay: 0.1,
                sustain: 0.05,
                release: 0.15
            },
            modulation: {
                type: 'sawtooth'
            },
            modulationEnvelope: {
                attack: 0.01,
                decay: 0.2,
                sustain: 0.1,
                release: 0.1
            }
        });
        
        console.log('🎬 StarWarsCombatAudio: スターウォーズ風シンセサイザー作成完了（多層インパクトシステム統合）');
    }
    
    /**
     * スターウォーズ風エフェクトチェーン作成
     */
    createStarWarsEffectChain() {
        // 宇宙空間リバーブ（広大な空間感）
        this.effects.spatialReverb = new Tone.Reverb({
            decay: 3.0,
            wet: 0.4,
            roomSize: 0.9
        });
        
        // コーラス+フランジャー（金属的響き）
        this.effects.chorusFlanger = new Tone.Chorus({
            frequency: 3,
            delayTime: 2,
            depth: 0.3,
            wet: 0.2
        });
        
        // ディストーション（爆発の迫力）
        this.effects.distortion = new Tone.Distortion({
            distortion: 0.4,
            wet: 0.1
        });
        
        // コンプレッサー（パンチ力）
        this.effects.compressor = new Tone.Compressor({
            threshold: -12,
            ratio: 6,
            attack: 0.003,
            release: 0.1
        });
        
        // ローパスフィルター（周波数シェイピング）
        this.effects.filter = new Tone.Filter({
            frequency: 8000,
            type: 'lowpass',
            rolloff: -24
        });
        
        // マスターゲイン
        this.effects.gain = new Tone.Gain(0.7);
        
        // エフェクトチェーン接続
        const starWarsChain = [
            this.effects.chorusFlanger,
            this.effects.distortion,
            this.effects.filter,
            this.effects.spatialReverb,
            this.effects.compressor,
            this.effects.gain,
            Tone.Destination
        ];
        
        // 全シンセをチェーンに接続（多層インパクトシステム対応）
        Object.values(this.combatSynths).forEach(synth => {
            if (synth) {
                try {
                    synth.chain(...starWarsChain);
                } catch (error) {
                    console.warn('Synth chain connection failed:', error);
                    // フォールバック：直接接続
                    synth.toDestination();
                }
            }
        });
        
        console.log('🎬 StarWarsCombatAudio: スターウォーズ風エフェクトチェーン作成完了');
    }
    
    /**
     * スターウォーズ風武器プロファイル作成
     */
    createStarWarsWeaponProfiles() {
        return {
            plasma: {
                name: 'Imperial Blaster',
                synth: 'blaster',
                frequency: { base: 800, sweep: [800, 400] },
                duration: 0.08,
                effects: {
                    distortion: 0.2,
                    chorus: 0.1,
                    filter: 1200
                },
                characteristics: 'ピューン！という軽快なブラスター音'
            },
            
            nuke: {
                name: 'Devastating Death Star Superlaser',
                synth: 'beamCannon',
                frequency: { base: 120, sweep: [120, 60] },  // さらに低周波化
                duration: 0.4,
                effects: {
                    distortion: 0.8,     // ディストーション強化
                    chorus: 0.4,
                    filter: 600,        // フィルター低下で重厚感
                    noiseLayer: 0.3      // ノイズレイヤー追加
                },
                characteristics: '壊滅的なデス・スター主砲の超重厚レーザー音'
            },
            
            superHoming: {
                name: 'High-Speed Laser Beam',
                synth: 'lightsaber',
                frequency: { base: 1200, sweep: [1200, 2400] },  // 高い周波数で「ぴゅ〜〜〜」感
                duration: 0.12,  // 少し短く
                effects: {
                    distortion: 0.01,    // 極小ディストーションでクリアに
                    chorus: 0.05,        // 極小コーラスでシャープに
                    filter: 4000,        // 高周波通過でキーンとした音
                    precision: 1.0,      // 最大精密射撃感
                    frequencyRamp: 1.5   // 周波数上昇率（ぴゅ〜〜〜感）
                },
                characteristics: '高速レーザービーム「ぴゅ〜〜〜」という鋭い上昇音'
            },
            
            superShotgun: {
                name: 'Seismic Charge',
                synth: 'deathStar',
                frequency: { base: 300, sweep: [300, 150] },
                duration: 0.15,
                effects: {
                    distortion: 0.8,
                    chorus: 0.2,
                    filter: 600
                },
                characteristics: 'ジャンゴ・フェットの地震弾のような爆発音'
            }
        };
    }
    
    /**
     * スターウォーズ風敵プロファイル作成
     */
    createStarWarsEnemyProfiles() {
        return {
            small: {
                name: 'Small Enemy',
                hitSound: {
                    synth: 'genericHit',
                    frequency: { base: 1000, variation: 300 },
                    duration: 0.06,
                    effects: { impact: 0.8, quick: 0.9 }
                },
                deathSound: {
                    synth: 'smallExplosion',
                    frequency: { base: 800, sweep: [800, 400] },
                    duration: 0.3,
                    effects: { explosion: 0.6, small: 1.0 }
                },
                characteristics: '軽快な衝撃音と小爆発'
            },
            
            medium: {
                name: 'Medium Enemy',
                hitSound: {
                    synth: 'genericHit',
                    frequency: { base: 800, variation: 250 },
                    duration: 0.08,
                    effects: { impact: 0.9, medium: 0.8 }
                },
                deathSound: {
                    synth: 'mediumExplosion',
                    frequency: { base: 600, sweep: [600, 200] },
                    duration: 0.5,
                    effects: { explosion: 0.8, medium: 1.0 }
                },
                characteristics: '中程度の衝撃音と中爆発'
            },
            
            large: {
                name: 'Large Enemy',
                hitSound: {
                    synth: 'genericHit',
                    frequency: { base: 600, variation: 200 },
                    duration: 0.1,
                    effects: { impact: 1.0, heavy: 0.9 }
                },
                deathSound: {
                    synth: 'largeExplosion',
                    frequency: { base: 400, sweep: [400, 100] },
                    duration: 0.7,
                    effects: { explosion: 1.0, large: 1.0 }
                },
                characteristics: '重厚な衝撃音と大爆発'
            },
            
            boss: {
                name: 'Boss Enemy',
                hitSound: {
                    synth: 'bossHit',
                    frequency: { base: 400, variation: 150 },
                    duration: 0.12,
                    effects: { energy: 1.0, boss: 1.0 }
                },
                deathSound: {
                    synth: 'deathStar',
                    frequency: { base: 200, sweep: [200, 50] },
                    duration: 1.2,
                    effects: { explosion: 1.5, epic: 1.0 }
                },
                characteristics: '重厚なエネルギー音と究極爆発'
            }
        };
    }
    
    /**
     * スターウォーズ風射撃音再生
     */
    async playStarWarsShootSound(weaponType = 'plasma', comboCount = 0, skillLevel = 0) {
        if (!this.isInitialized) return;
        
        try {
            const profile = this.weaponProfiles[weaponType];
            if (!profile) {
                console.warn(`Unknown weapon type: ${weaponType}`);
                return;
            }
            
            const synth = this.combatSynths[profile.synth];
            if (!synth) {
                console.warn(`Synth not found: ${profile.synth}`);
                return;
            }
            
            // コンボ・スキル連動音響強化
            const comboBonus = 1.0 + (comboCount * 0.02); // 2%ずつ強化
            const skillBonus = 1.0 + (skillLevel * 0.1);  // 10%ずつ強化
            const totalBonus = Math.min(comboBonus * skillBonus, 3.0);
            
            // 周波数計算（スイープ効果）
            const baseFreq = profile.frequency.base;
            const sweepFreq = profile.frequency.sweep || [baseFreq, baseFreq * 0.8];
            
            // 音量計算
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.6 * totalBonus);
            const dbValue = -15 + (volume * 12);
            
            // スターウォーズ風射撃音再生（音の持続時間を適切に制御）
            if (profile.synth === 'blaster') {
                // ブラスター風（周波数スイープ）- 持続時間制限
                const blasterDuration = Math.min(profile.duration, 0.1); // 最大0.1秒に制限
                synth.frequency.setValueAtTime(sweepFreq[0], Tone.now());
                synth.frequency.exponentialRampToValueAtTime(sweepFreq[1], Tone.now() + blasterDuration);
                synth.volume.value = dbValue;
                synth.triggerAttackRelease(sweepFreq[0], blasterDuration);
                
                // 安全な自動停止
                setTimeout(() => {
                    if (synth && synth.triggerRelease) {
                        synth.triggerRelease();
                    }
                }, blasterDuration * 1000 + 50);
                
            } else if (profile.synth === 'lightsaber') {
                // 精密ライトセーバー風（シャープでプロフェッショナルな音）
                const lightSaberDuration = Math.min(profile.duration * 1.3, 0.25);
                
                // メインシャープビーム音（間抜け感解消）
                synth.frequency.setValueAtTime(sweepFreq[0], Tone.now());
                synth.frequency.exponentialRampToValueAtTime(sweepFreq[1], Tone.now() + lightSaberDuration * 0.8);
                synth.volume.value = dbValue + 1; // クリアでシャープに
                synth.triggerAttackRelease(sweepFreq[0], lightSaberDuration);
                
                // 精密エコー効果（より短くシャープに）
                setTimeout(() => {
                    if (synth) {
                        synth.frequency.setValueAtTime(sweepFreq[1] * 1.1, Tone.now());
                        synth.frequency.exponentialRampToValueAtTime(sweepFreq[1] * 0.9, Tone.now() + lightSaberDuration * 0.3);
                        synth.volume.value = dbValue - 6;
                        synth.triggerAttackRelease(sweepFreq[1], lightSaberDuration * 0.3);
                    }
                }, lightSaberDuration * 1000 * 0.3);
                
                // 精密終了エフェクト（シャープな終了）
                setTimeout(() => {
                    if (synth) {
                        synth.frequency.setValueAtTime(sweepFreq[1] * 1.05, Tone.now());
                        synth.volume.value = dbValue - 10;
                        synth.triggerAttackRelease(sweepFreq[1] * 1.05, lightSaberDuration * 0.15);
                    }
                }, lightSaberDuration * 1000 * 0.7);
                
            } else if (profile.synth === 'beamCannon') {
                // 超重厚ビーム砲風（爆発的迫力版）
                synth.volume.value = dbValue + 10; // +10dB で圧倒的迫力
                const beamDuration = Math.min(profile.duration * 1.8, 0.35); // さらに長い持続時間
                
                // メインビーム（超低周波スイープ）
                synth.frequency.setValueAtTime(baseFreq, Tone.now());
                synth.frequency.exponentialRampToValueAtTime(baseFreq * 0.4, Tone.now() + beamDuration * 0.8);
                synth.triggerAttackRelease(baseFreq, beamDuration);
                
                // 追加の爆発的ノイズレイヤー（最大の迫力）
                this.triggerNukeNoiseLayer(dbValue + 8, beamDuration);
                
                // 第1波エコー（中程度の迫力）
                setTimeout(() => {
                    if (synth) {
                        synth.volume.value = dbValue + 5;
                        synth.triggerAttackRelease(baseFreq * 0.6, beamDuration * 0.6);
                    }
                }, beamDuration * 1000 * 0.2);
                
                // 第2波エコー（低音残響）
                setTimeout(() => {
                    if (synth) {
                        synth.volume.value = dbValue;
                        synth.triggerAttackRelease(baseFreq * 0.3, beamDuration * 0.4);
                    }
                }, beamDuration * 1000 * 0.5);
                
                // 最終残響（超低音）
                setTimeout(() => {
                    if (synth) {
                        synth.volume.value = dbValue - 3;
                        synth.triggerAttackRelease(baseFreq * 0.15, beamDuration * 0.3);
                    }
                }, beamDuration * 1000 * 0.7);
                
                // 安全な自動停止
                setTimeout(() => {
                    if (synth && synth.triggerRelease) {
                        synth.triggerRelease();
                    }
                }, beamDuration * 1000 + 200);
                
            } else if (profile.synth === 'deathStar') {
                // 地震弾風（ノイズ爆発）- 大幅迫力強化版
                synth.volume.value = dbValue + 8; // +8dB で大幅迫力向上
                const explosionDuration = Math.min(profile.duration * 1.8, 0.35); // 持続時間も長く
                
                // メイン爆発音
                synth.triggerAttackRelease(explosionDuration);
                
                // 追加の爆発エコー（迫力強化）
                setTimeout(() => {
                    if (synth) {
                        synth.volume.value = dbValue + 4;
                        synth.triggerAttackRelease(explosionDuration * 0.6);
                    }
                }, explosionDuration * 1000 * 0.3);
                
                // 最終残響音
                setTimeout(() => {
                    if (synth) {
                        synth.volume.value = dbValue;
                        synth.triggerAttackRelease(explosionDuration * 0.3);
                    }
                }, explosionDuration * 1000 * 0.7);
                
                // 安全な自動停止
                setTimeout(() => {
                    if (synth && synth.triggerRelease) {
                        synth.triggerRelease();
                    }
                }, explosionDuration * 1000 + 150);
            }
            
            // ライトセーバーの追加安全機構
            if (profile.synth === 'lightsaber') {
                setTimeout(() => {
                    if (synth && synth.triggerRelease) {
                        synth.triggerRelease();
                    }
                }, 250); // 最大250ms後に強制停止
            }
            
            // 音の自動停止タイマー（念のための安全機構）
            const maxDuration = Math.max(profile.duration * 2, 0.5); // 最大0.5秒
            setTimeout(() => {
                try {
                    if (synth.state === 'started') {
                        synth.triggerRelease();
                    }
                } catch (e) {
                    // シンセが既に破棄されている場合は無視
                }
            }, maxDuration * 1000);
            
            this.stats.totalShots++;
            this.updateSoundCount(1);
            
            console.log(`🎬 ${profile.name} fired (Combo: ${comboCount}, Skill: ${skillLevel}, Bonus: ${totalBonus.toFixed(2)}x)`);
            
        } catch (error) {
            console.warn('🎬 StarWarsCombatAudio: 射撃音再生失敗:', error);
        }
    }
    
    /**
     * スターウォーズ風敵ヒット音再生
     */
    async playStarWarsEnemyHit(enemy, impactPoint, intensity = 1.0) {
        if (!this.isInitialized) return;
        
        try {
            // 敵サイズによるタイプ判定
            const enemyType = this.getEnemyTypeBySize(enemy.size);
            const profile = this.enemyProfiles[enemyType];
            
            if (!profile) {
                console.warn(`Unknown enemy type: ${enemyType}`);
                return;
            }
            
            const hitProfile = profile.hitSound;
            const synth = this.combatSynths[hitProfile.synth];
            
            if (!synth) {
                console.warn(`Hit synth not found: ${hitProfile.synth}`);
                return;
            }
            
            // 音量・周波数計算（大幅音量増加）
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.8 * intensity);
            const dbValue = -5 + (volume * 20);  // 音量を大幅に増加
            
            const baseFreq = hitProfile.frequency.base;
            const variation = hitProfile.frequency.variation || 0;
            const finalFreq = baseFreq + (Math.random() - 0.5) * variation;
            
            // スターウォーズ風多層インパクトヒット音再生（大幅強化版）
            
            // 敵タイプ別多層インパクトシステム
            const impactLayers = this.getMultiLayerImpactSequence(enemyType, finalFreq, dbValue, hitProfile.duration);
            
            // 各レイヤーを次々に再生
            impactLayers.forEach((layer, index) => {
                setTimeout(() => {
                    try {
                        this.playImpactLayer(layer, intensity);
                    } catch (error) {
                        console.warn(`Impact layer ${index} failed:`, error);
                    }
                }, layer.delay);
            });
            
            // フォールバック：従来のシンプルヒット音（エラー時）
            if (hitProfile.synth === 'genericHit') {
                synth.volume.value = dbValue;
                synth.triggerAttackRelease(hitProfile.duration);
                
            } else if (hitProfile.synth === 'bossHit') {
                // ボス専用ヒット音（FMSynth - 強化版）
                synth.volume.value = dbValue + 3;
                synth.frequency.setValueAtTime(finalFreq, Tone.now());
                synth.frequency.exponentialRampToValueAtTime(finalFreq * 0.7, Tone.now() + hitProfile.duration * 0.5);
                synth.triggerAttackRelease(finalFreq, hitProfile.duration);
                
                console.log(`🎬 Enhanced Boss hit sound: ${finalFreq.toFixed(0)}Hz for ${hitProfile.duration}s (Volume: ${(dbValue + 3).toFixed(1)}dB)`);
            }
            
            this.stats.totalHits++;
            this.updateSoundCount(1);
            
            console.log(`🎬 ${profile.name} Multi-Layer Impact Hit! (${impactLayers.length} layers, ${finalFreq.toFixed(0)}Hz, ${dbValue.toFixed(1)}dB)`);
            
        } catch (error) {
            console.warn('🎬 StarWarsCombatAudio: 敵ヒット音再生失敗:', error);
        }
    }
    
    /**
     * 敵タイプ別多層インパクトシーケンス生成
     */
    getMultiLayerImpactSequence(enemyType, baseFreq, baseVolume, baseDuration) {
        const sequences = {
            'small': [
                // Small敵: シンプル・印象的・満足感（パン！バシッ！）
                { type: 'metalImpact', frequency: baseFreq * 1.5, volume: baseVolume + 3, duration: baseDuration * 0.6, delay: 0 },
                { type: 'shieldSpark', frequency: baseFreq * 3.0, volume: baseVolume + 1, duration: baseDuration * 0.3, delay: 10 }
            ],
            'medium': [
                // Medium敵: バランス・印象的・満足感（バシッ！ガン！）
                { type: 'metalImpact', frequency: baseFreq * 1.2, volume: baseVolume + 4, duration: baseDuration * 0.8, delay: 0 },
                { type: 'energyBurst', frequency: baseFreq * 0.7, volume: baseVolume + 2, duration: baseDuration * 0.6, delay: 8 },
                { type: 'shieldSpark', frequency: baseFreq * 2.5, volume: baseVolume, duration: baseDuration * 0.4, delay: 25 }
            ],
            'large': [
                // Large敵: 重厚・印象的・満足感（ドカン！ガシャン！）
                { type: 'metalImpact', frequency: baseFreq, volume: baseVolume + 6, duration: baseDuration * 1.0, delay: 0 },
                { type: 'armorCrack', frequency: baseFreq * 0.5, volume: baseVolume + 4, duration: baseDuration * 1.2, delay: 5 },
                { type: 'energyBurst', frequency: baseFreq * 0.8, volume: baseVolume + 2, duration: baseDuration * 0.8, delay: 20 },
                { type: 'shieldSpark', frequency: baseFreq * 2.0, volume: baseVolume, duration: baseDuration * 0.5, delay: 50 }
            ],
            'boss': [
                // Boss敵: 圧倒的・印象的・満足感（ドゴォォン！ガァン！）
                { type: 'metalImpact', frequency: baseFreq * 0.8, volume: baseVolume + 8, duration: baseDuration * 1.4, delay: 0 },
                { type: 'armorCrack', frequency: baseFreq * 0.3, volume: baseVolume + 6, duration: baseDuration * 1.6, delay: 3 },
                { type: 'energyBurst', frequency: baseFreq * 0.6, volume: baseVolume + 4, duration: baseDuration * 1.0, delay: 15 },
                { type: 'shieldSpark', frequency: baseFreq * 2.8, volume: baseVolume + 2, duration: baseDuration * 0.7, delay: 40 },
                { type: 'metalImpact', frequency: baseFreq * 0.4, volume: baseVolume + 1, duration: baseDuration * 0.8, delay: 100 } // 重いエコー
            ]
        };
        
        return sequences[enemyType] || sequences['medium']; // デフォルトはmedium
    }
    
    /**
     * 単一インパクトレイヤー再生
     */
    playImpactLayer(layer, intensity = 1.0) {
        try {
            const synth = this.combatSynths[layer.type];
            if (!synth) {
                console.warn(`Impact synth not found: ${layer.type}`);
                return;
            }
            
            // 音量調整（インテンシティ適用）
            const finalVolume = layer.volume + (intensity > 1 ? Math.log10(intensity) * 3 : 0);
            synth.volume.value = finalVolume;
            
            // シンセタイプ別再生処理
            switch (layer.type) {
                case 'metalImpact':
                    // 金属インパクト（MetalSynth）
                    synth.frequency.value = layer.frequency;
                    synth.triggerAttackRelease(layer.duration);
                    break;
                    
                case 'energyBurst':
                    // エネルギーバースト（PluckSynth）
                    synth.triggerAttackRelease(layer.frequency, layer.duration);
                    break;
                    
                case 'shieldSpark':
                    // シールドスパーク（NoiseSynth）
                    synth.triggerAttackRelease(layer.duration);
                    break;
                    
                case 'armorCrack':
                    // アーマークラック（MembraneSynth）
                    synth.triggerAttackRelease(layer.frequency, layer.duration);
                    break;
                    
                case 'laserSizzle':
                    // レーザーシザー（FMSynth）
                    synth.triggerAttackRelease(layer.frequency, layer.duration);
                    break;
                    
                default:
                    console.warn(`Unknown impact layer type: ${layer.type}`);
            }
            
            console.log(`🎯 Impact layer: ${layer.type} (${layer.frequency.toFixed(0)}Hz, ${finalVolume.toFixed(1)}dB, ${layer.duration.toFixed(2)}s)`);
            
        } catch (error) {
            console.warn(`Impact layer playback failed: ${layer.type}`, error);
        }
    }
    
    /**
     * スターウォーズ風敵撃破音再生
     */
    async playStarWarsEnemyDeath(enemy, deathType = 'explosion') {
        if (!this.isInitialized) return;
        
        try {
            // 敵サイズによるタイプ判定
            const enemyType = this.getEnemyTypeBySize(enemy.size);
            const profile = this.enemyProfiles[enemyType];
            
            if (!profile) {
                console.warn(`Unknown enemy type: ${enemyType}`);
                return;
            }
            
            const deathProfile = profile.deathSound;
            const synth = this.combatSynths[deathProfile.synth];
            
            if (!synth) {
                console.warn(`Death synth not found: ${deathProfile.synth}`);
                return;
            }
            
            // 音量・周波数計算（撃破音は大きめ）
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.8);
            const dbValue = -12 + (volume * 15);
            
            // スターウォーズ風撃破音再生（敵タイプ別差別化）
            // 敵タイプ別の音響パラメータ調整
            let finalVolume = dbValue;
            let finalDuration = deathProfile.duration;
            
            // 敵サイズによる音響差別化
            switch (enemyType) {
                case 'small':
                    finalVolume -= 5; // 小さめの音
                    finalDuration *= 0.7;
                    break;
                case 'medium':
                    finalVolume -= 2; // 中程度の音
                    finalDuration *= 0.9;
                    break;
                case 'large':
                    finalVolume += 2; // 大きめの音
                    finalDuration *= 1.2;
                    break;
                case 'boss':
                    finalVolume += 5; // 最大の音
                    finalDuration *= 1.5;
                    break;
            }
            
            // 新しい「バン！」音システム（シンプル・印象的・満足感）
            this.playGunShotBangSound(enemyType, finalVolume, finalDuration);
            
            // 特別な演出（ボス撃破時）
            if (enemyType === 'boss') {
                this.playEpicDeathStarExplosion(dbValue);
            }
            
            this.stats.totalDeaths++;
            this.updateSoundCount(1);
            
            console.log(`🎬 ${profile.name} destroyed with satisfying BANG! 🔫💥`);
            
        } catch (error) {
            console.warn('🎬 StarWarsCombatAudio: 敵撃破音再生失敗:', error);
        }
    }
    
    /**
     * 「バン！」音システム（シンプル・印象的・満足感）
     */
    playGunShotBangSound(enemyType, baseVolume, baseDuration) {
        try {
            // 敵タイプ別「バン！」音設計
            const bangSequences = {
                'small': [
                    // Small: 軽快な「パン！」
                    { type: 'shieldSpark', volume: baseVolume + 2, duration: 0.08, delay: 0 },
                    { type: 'metalImpact', volume: baseVolume, duration: 0.05, delay: 5 }
                ],
                'medium': [
                    // Medium: しっかりした「バン！」
                    { type: 'metalImpact', volume: baseVolume + 3, duration: 0.1, delay: 0 },
                    { type: 'shieldSpark', volume: baseVolume + 1, duration: 0.06, delay: 8 }
                ],
                'large': [
                    // Large: 重厚な「ドン！」
                    { type: 'armorCrack', volume: baseVolume + 4, duration: 0.12, delay: 0 },
                    { type: 'metalImpact', volume: baseVolume + 2, duration: 0.08, delay: 10 }
                ],
                'boss': [
                    // Boss: 圧倒的な「ドーン！」
                    { type: 'armorCrack', volume: baseVolume + 6, duration: 0.15, delay: 0 },
                    { type: 'metalImpact', volume: baseVolume + 4, duration: 0.1, delay: 8 },
                    { type: 'shieldSpark', volume: baseVolume + 2, duration: 0.06, delay: 20 }
                ]
            };
            
            const bangSequence = bangSequences[enemyType] || bangSequences['medium'];
            
            // 「バン！」音再生
            bangSequence.forEach((bang, index) => {
                setTimeout(() => {
                    try {
                        const synth = this.combatSynths[bang.type];
                        if (synth) {
                            synth.volume.value = bang.volume;
                            if (bang.type === 'shieldSpark') {
                                synth.triggerAttackRelease(bang.duration);
                            } else if (bang.type === 'metalImpact') {
                                synth.frequency.value = 800; // 銃撃音の周波数
                                synth.triggerAttackRelease(bang.duration);
                            } else if (bang.type === 'armorCrack') {
                                synth.triggerAttackRelease(200, bang.duration); // 低音ドン音
                            }
                        }
                    } catch (error) {
                        console.warn(`Bang sound layer ${index} failed:`, error);
                    }
                }, bang.delay);
            });
            
            console.log(`🔫 ${enemyType.toUpperCase()} BANG! played (${bangSequence.length} layers)`);
            
        } catch (error) {
            console.warn('Bang sound system failed:', error);
        }
    }
    
    /**
     * 壮大なデス・スター爆発演出
     */
    playEpicDeathStarExplosion(baseVolume) {
        try {
            // 3段階爆発演出
            const explosionStages = [
                { delay: 0, duration: 0.8, volume: baseVolume },
                { delay: 400, duration: 0.6, volume: baseVolume - 3 },
                { delay: 800, duration: 0.4, volume: baseVolume - 6 }
            ];
            
            explosionStages.forEach((stage, index) => {
                setTimeout(() => {
                    if (this.combatSynths.deathStar) {
                        this.combatSynths.deathStar.volume.value = stage.volume;
                        this.combatSynths.deathStar.triggerAttackRelease(stage.duration);
                    }
                }, stage.delay);
            });
            
            // フォース風残響音
            setTimeout(() => {
                if (this.combatSynths.force) {
                    this.combatSynths.force.volume.value = baseVolume - 10;
                    this.combatSynths.force.triggerAttackRelease(200, 2.0);
                }
            }, 1200);
            
        } catch (error) {
            console.warn('🎬 Epic explosion failed:', error);
        }
    }
    
    /**
     * 敵サイズによるタイプ判定
     */
    getEnemyTypeBySize(size) {
        if (size <= 15) return 'small';
        if (size <= 25) return 'medium';
        if (size <= 40) return 'large';
        return 'boss';
    }
    
    /**
     * Nuke専用爆発ノイズレイヤー（超迫力版）
     */
    triggerNukeNoiseLayer(baseVolume, duration) {
        try {
            // 爆発的ノイズシンセ
            const explosiveNoise = new Tone.NoiseSynth({
                noise: {
                    type: 'brown'  // 低周波ノイズ
                },
                envelope: {
                    attack: 0.001,
                    decay: 0.05,
                    sustain: 0.3,
                    release: 0.2
                }
            });
            
            // 超低周波フィルター
            const lowPassFilter = new Tone.Filter({
                frequency: 200,
                type: 'lowpass',
                rolloff: -24
            });
            
            // ディストーションエフェクト
            const distortion = new Tone.Distortion({
                distortion: 0.9,
                wet: 0.7
            });
            
            // エフェクトチェーン接続
            explosiveNoise.chain(lowPassFilter, distortion, this.effects.gain, Tone.Destination);
            
            // 音量設定と再生
            explosiveNoise.volume.value = baseVolume;
            explosiveNoise.triggerAttackRelease(duration);
            
            // クリーンアップ
            setTimeout(() => {
                explosiveNoise.dispose();
                lowPassFilter.dispose();
                distortion.dispose();
            }, duration * 1000 + 100);
            
            console.log(`💥 Nuke explosive noise layer triggered (${baseVolume.toFixed(1)}dB, ${duration.toFixed(2)}s)`);
            
        } catch (error) {
            console.warn('💥 Nuke noise layer failed:', error);
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
        }, 500);
    }
    
    /**
     * 音量更新
     */
    updateVolume() {
        if (this.effects.gain) {
            const volume = this.audioSystem.getCalculatedVolume('sfx', 0.7);
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
     * 統計リセット
     */
    resetStats() {
        this.stats = {
            totalShots: 0,
            totalHits: 0,
            totalDeaths: 0,
            maxSimultaneous: 0,
            avgLatency: 0
        };
    }
    
    /**
     * システム破棄
     */
    destroy() {
        // シンセサイザー破棄
        Object.values(this.combatSynths).forEach(synth => {
            if (synth) {
                synth.dispose();
            }
        });
        
        // エフェクト破棄
        Object.values(this.effects).forEach(effect => {
            if (effect) {
                effect.dispose();
            }
        });
        
        console.log('🎬 StarWarsCombatAudio: 銀河帝国音響システム破棄完了');
    }
}