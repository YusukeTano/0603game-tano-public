/**
 * StageThemes - 9ステージBGMテーマ定義
 * 各ステージの詳細な音楽設定とパターン
 */
export class StageThemes {
    constructor() {
        this.themes = this.initializeThemes();
        console.log('🎶 StageThemes: 9-stage theme definitions loaded');
    }
    
    /**
     * 全テーマ初期化
     */
    initializeThemes() {
        return {
            1: this.createNeonGenesis(),
            2: this.createCyberHighway(),
            3: this.createDigitalStorm(),
            4: this.createChromeCity(),
            5: this.createQuantumDance(),
            6: this.createLaserPulse(),
            7: this.createBinaryDreams(),
            8: this.createFinalProtocol(),
            9: this.createVictoryCode()
        };
    }
    
    /**
     * Stage 1: Neon Genesis (Future Pop)
     */
    createNeonGenesis() {
        return {
            id: 1,
            name: 'Neon Genesis',
            genre: 'Future Pop',
            bpm: 120,
            key: 'C',
            mood: 'peaceful_futuristic',
            
            instruments: {
                lead: {
                    type: 'leadSynth',
                    volume: 0.3,
                    pattern: 'melody',
                    notes: ['C4', 'E4', 'G4', 'A4', 'G4', 'E4', 'C4', 'G3'],
                    rhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 1, 1] // 拍数
                },
                bass: {
                    type: 'subBass',
                    volume: 0.4,
                    pattern: 'chord_root',
                    notes: ['C2', 'A1', 'F2', 'G2'],
                    rhythm: [4, 4, 4, 4] // 4拍コード
                },
                drums: {
                    type: 'softDrums',
                    volume: 0.2,
                    pattern: 'soft_four_on_floor',
                    sounds: ['kick', 'hihat', 'kick', 'hihat']
                },
                pad: {
                    type: 'neonPad',
                    volume: 0.15,
                    pattern: 'sustained_chords',
                    notes: ['C4_E4_G4', 'A3_C4_E4', 'F3_A3_C4', 'G3_B3_D4'],
                    rhythm: [8, 8, 8, 8] // 長いサスティン
                }
            },
            
            progression: ['C', 'Am', 'F', 'G'],
            structure: {
                intro: 8,    // 8拍イントロ
                verse: 32,   // 32拍メインパート
                build: 16,   // 16拍ビルドアップ
                drop: 32     // 32拍ドロップ
            },
            
            effects: {
                global: ['chorus', 'reverb'],
                lead: ['delay'],
                pad: ['reverb', 'chorus']
            },
            
            dynamics: {
                intro: 0.3,
                verse: 0.6,
                build: 0.8,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 2: Cyber Highway (Synthwave)
     */
    createCyberHighway() {
        return {
            id: 2,
            name: 'Cyber Highway',
            genre: 'Synthwave',
            bpm: 130,
            key: 'Dm',
            mood: 'retro_driving',
            
            instruments: {
                arp: {
                    type: 'arpSynth',
                    volume: 0.25,
                    pattern: 'arpeggiated',
                    notes: ['D4', 'F4', 'A4', 'D5'],
                    rhythm: [0.25, 0.25, 0.25, 0.25] // 16分音符
                },
                bass: {
                    type: 'reeseBass',
                    volume: 0.35,
                    pattern: 'synth_bass_line',
                    notes: ['D2', 'Bb1', 'F2', 'C2'],
                    rhythm: [2, 2, 2, 2]
                },
                drums: {
                    type: 'synthDrums',
                    volume: 0.3,
                    pattern: 'retro_beat',
                    sounds: ['kick', 'snare', 'kick', 'snare']
                },
                pad: {
                    type: 'retroPad',
                    volume: 0.2,
                    pattern: 'atmospheric',
                    notes: ['Dm_chord', 'Bb_chord', 'F_chord', 'C_chord'],
                    rhythm: [4, 4, 4, 4]
                }
            },
            
            progression: ['Dm', 'Bb', 'F', 'C'],
            structure: {
                intro: 16,
                verse: 32,
                build: 8,
                drop: 32
            },
            
            effects: {
                global: ['compression', 'reverb'],
                arp: ['chorus', 'delay'],
                bass: ['distortion'],
                pad: ['chorus', 'reverb']
            },
            
            dynamics: {
                intro: 0.4,
                verse: 0.7,
                build: 0.9,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 3: Digital Storm (Electro House)
     */
    createDigitalStorm() {
        return {
            id: 3,
            name: 'Digital Storm',
            genre: 'Electro House',
            bpm: 140,
            key: 'Em',
            mood: 'energetic_aggressive',
            
            instruments: {
                lead: {
                    type: 'pluckLead',
                    volume: 0.4,
                    pattern: 'stab_sequence',
                    notes: ['E4', 'G4', 'B4', 'E5'],
                    rhythm: [0.5, 0.5, 0.5, 0.5]
                },
                bass: {
                    type: 'bigBass',
                    volume: 0.5,
                    pattern: 'house_bass',
                    notes: ['E1', 'C2', 'G1', 'D2'],
                    rhythm: [1, 1, 1, 1]
                },
                drums: {
                    type: 'bigRoomKick',
                    volume: 0.4,
                    pattern: 'four_on_floor_hard',
                    sounds: ['kick', 'hihat', 'kick', 'snare']
                },
                fx: {
                    type: 'whiteNoise',
                    volume: 0.1,
                    pattern: 'sweep_fx',
                    notes: ['noise_sweep'],
                    rhythm: [8] // 長いスイープ
                }
            },
            
            progression: ['Em', 'C', 'G', 'D'],
            structure: {
                intro: 8,
                verse: 16,
                build: 8,
                drop: 32
            },
            
            effects: {
                global: ['compression', 'limiter'],
                lead: ['reverb'],
                bass: ['sidechain'],
                fx: ['filter_sweep']
            },
            
            dynamics: {
                intro: 0.5,
                verse: 0.8,
                build: 0.95,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 4: Chrome City (Tech House)
     */
    createChromeCity() {
        return {
            id: 4,
            name: 'Chrome City',
            genre: 'Tech House',
            bpm: 150,
            key: 'F#m',
            mood: 'industrial_driving',
            
            instruments: {
                lead: {
                    type: 'techLead',
                    volume: 0.3,
                    pattern: 'minimal_tech',
                    notes: ['F#3', 'A3', 'C#4', 'F#4'],
                    rhythm: [2, 1, 1, 4]
                },
                bass: {
                    type: 'subBass',
                    volume: 0.4,
                    pattern: 'tech_bass',
                    notes: ['F#1', 'D2', 'A1', 'E2'],
                    rhythm: [2, 2, 2, 2]
                },
                drums: {
                    type: 'industrialDrums',
                    volume: 0.35,
                    pattern: 'tech_groove',
                    sounds: ['kick', 'perc', 'kick', 'snare']
                },
                perc: {
                    type: 'metallicPerc',
                    volume: 0.2,
                    pattern: 'industrial_perc',
                    sounds: ['metal_hit', 'clap', 'metal_hit', 'rim']
                }
            },
            
            progression: ['F#m', 'D', 'A', 'E'],
            structure: {
                intro: 16,
                verse: 32,
                build: 16,
                drop: 32
            },
            
            effects: {
                global: ['compression'],
                lead: ['filter', 'delay'],
                perc: ['reverb', 'distortion']
            },
            
            dynamics: {
                intro: 0.4,
                verse: 0.7,
                build: 0.85,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 5: Quantum Dance (Future Bass)
     */
    createQuantumDance() {
        return {
            id: 5,
            name: 'Quantum Dance',
            genre: 'Future Bass',
            bpm: 160,
            key: 'G',
            mood: 'uplifting_modern',
            
            instruments: {
                lead: {
                    type: 'wobbleLead',
                    volume: 0.4,
                    pattern: 'future_bass_lead',
                    notes: ['G4', 'B4', 'D5', 'G5'],
                    rhythm: [1, 0.5, 0.5, 2]
                },
                bass: {
                    type: 'futureBass',
                    volume: 0.45,
                    pattern: 'wobble_bass',
                    notes: ['G1', 'E2', 'C2', 'D2'],
                    rhythm: [1, 1, 1, 1]
                },
                drums: {
                    type: 'trapDrums',
                    volume: 0.3,
                    pattern: 'future_trap',
                    sounds: ['kick', 'snare', 'kick', 'hi_hat_roll']
                },
                vocal: {
                    type: 'vocalChops',
                    volume: 0.2,
                    pattern: 'chopped_vocals',
                    notes: ['vocal_ah', 'vocal_oh', 'vocal_eh'],
                    rhythm: [0.5, 0.25, 0.25]
                }
            },
            
            progression: ['G', 'Em', 'C', 'D'],
            structure: {
                intro: 8,
                verse: 16,
                build: 8,
                drop: 32
            },
            
            effects: {
                global: ['compression', 'stereo_width'],
                lead: ['filter_lfo', 'reverb'],
                bass: ['sidechain', 'distortion'],
                vocal: ['reverb', 'pitch_shift']
            },
            
            dynamics: {
                intro: 0.5,
                verse: 0.7,
                build: 0.9,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 6: Laser Pulse (Hardstyle)
     */
    createLaserPulse() {
        return {
            id: 6,
            name: 'Laser Pulse',
            genre: 'Hardstyle',
            bpm: 170,
            key: 'Am',
            mood: 'hardcore_intense',
            
            instruments: {
                lead: {
                    type: 'supersawLead',
                    volume: 0.5,
                    pattern: 'hardstyle_lead',
                    notes: ['A4', 'C5', 'E5', 'A5'],
                    rhythm: [0.5, 0.5, 1, 2]
                },
                bass: {
                    type: 'kickBass',
                    volume: 0.6,
                    pattern: 'hardstyle_kick_bass',
                    notes: ['A1', 'F2', 'C2', 'G2'],
                    rhythm: [1, 1, 1, 1]
                },
                drums: {
                    type: 'hardcoreKick',
                    volume: 0.5,
                    pattern: 'hardstyle_kick',
                    sounds: ['hard_kick', 'reverse_bass', 'hard_kick', 'snare']
                },
                fx: {
                    type: 'riser',
                    volume: 0.3,
                    pattern: 'hardstyle_fx',
                    sounds: ['riser', 'impact', 'sweep_down'],
                    rhythm: [4, 0.25, 3.75]
                }
            },
            
            progression: ['Am', 'F', 'C', 'G'],
            structure: {
                intro: 16,
                verse: 16,
                build: 16,
                drop: 32
            },
            
            effects: {
                global: ['hard_compression', 'limiter'],
                lead: ['distortion', 'reverb'],
                bass: ['heavy_distortion'],
                fx: ['filter_sweep', 'delay']
            },
            
            dynamics: {
                intro: 0.6,
                verse: 0.8,
                build: 0.95,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 7: Binary Dreams (Ambient Techno)
     */
    createBinaryDreams() {
        return {
            id: 7,
            name: 'Binary Dreams',
            genre: 'Ambient Techno',
            bpm: 140,
            key: 'Bb',
            mood: 'mysterious_deep',
            
            instruments: {
                lead: {
                    type: 'ambientLead',
                    volume: 0.25,
                    pattern: 'ambient_texture',
                    notes: ['Bb3', 'D4', 'F4', 'Bb4'],
                    rhythm: [4, 2, 2, 8]
                },
                bass: {
                    type: 'deepBass',
                    volume: 0.4,
                    pattern: 'minimal_bass',
                    notes: ['Bb1', 'G2', 'Eb2', 'F2'],
                    rhythm: [4, 4, 4, 4]
                },
                drums: {
                    type: 'minimaDrums',
                    volume: 0.2,
                    pattern: 'minimal_techno',
                    sounds: ['soft_kick', 'perc', 'soft_kick', 'subtle_snare']
                },
                pad: {
                    type: 'spacePad',
                    volume: 0.3,
                    pattern: 'atmospheric_texture',
                    notes: ['Bb_ambient', 'Gm_ambient', 'Eb_ambient', 'F_ambient'],
                    rhythm: [16, 16, 16, 16] // 非常に長いサスティン
                }
            },
            
            progression: ['Bb', 'Gm', 'Eb', 'F'],
            structure: {
                intro: 32,
                verse: 64,
                build: 32,
                drop: 64
            },
            
            effects: {
                global: ['reverb', 'delay'],
                lead: ['granular_delay', 'filter'],
                pad: ['reverb', 'chorus', 'filter_lfo'],
                drums: ['reverb']
            },
            
            dynamics: {
                intro: 0.3,
                verse: 0.5,
                build: 0.7,
                drop: 0.8
            }
        };
    }
    
    /**
     * Stage 8: Final Protocol (Epic Synthwave)
     */
    createFinalProtocol() {
        return {
            id: 8,
            name: 'Final Protocol',
            genre: 'Epic Synthwave',
            bpm: 180,
            key: 'C#m',
            mood: 'epic_cinematic',
            
            instruments: {
                lead: {
                    type: 'epicLead',
                    volume: 0.5,
                    pattern: 'epic_melody',
                    notes: ['C#4', 'E4', 'F#4', 'G#4', 'A4', 'B4', 'C#5'],
                    rhythm: [1, 0.5, 0.5, 1, 0.5, 0.5, 2]
                },
                bass: {
                    type: 'orchestralBass',
                    volume: 0.4,
                    pattern: 'epic_bass',
                    notes: ['C#2', 'A1', 'E2', 'B1'],
                    rhythm: [2, 2, 2, 2]
                },
                drums: {
                    type: 'hybridDrums',
                    volume: 0.45,
                    pattern: 'epic_drums',
                    sounds: ['epic_kick', 'orchestral_snare', 'epic_kick', 'cymbal']
                },
                cinematic: {
                    type: 'cinematic',
                    volume: 0.3,
                    pattern: 'epic_texture',
                    sounds: ['choir_ah', 'brass_stab', 'string_swell'],
                    rhythm: [4, 1, 3]
                }
            },
            
            progression: ['C#m', 'A', 'E', 'B'],
            structure: {
                intro: 16,
                verse: 32,
                build: 16,
                drop: 64
            },
            
            effects: {
                global: ['compression', 'stereo_imaging'],
                lead: ['reverb', 'delay'],
                cinematic: ['reverb', 'chorus'],
                drums: ['reverb', 'compression']
            },
            
            dynamics: {
                intro: 0.6,
                verse: 0.8,
                build: 0.95,
                drop: 1.0
            }
        };
    }
    
    /**
     * Stage 9: Victory Code (Uplifting Trance)
     */
    createVictoryCode() {
        return {
            id: 9,
            name: 'Victory Code',
            genre: 'Uplifting Trance',
            bpm: 175,
            key: 'D',
            mood: 'triumphant_euphoric',
            
            instruments: {
                lead: {
                    type: 'tranceLead',
                    volume: 0.5,
                    pattern: 'trance_melody',
                    notes: ['D4', 'F#4', 'A4', 'D5', 'A4', 'F#4', 'D4'],
                    rhythm: [0.5, 0.5, 1, 2, 1, 0.5, 0.5]
                },
                bass: {
                    type: 'pumpingBass',
                    volume: 0.4,
                    pattern: 'trance_bass',
                    notes: ['D2', 'B1', 'G2', 'A2'],
                    rhythm: [1, 1, 1, 1]
                },
                drums: {
                    type: 'upliftDrums',
                    volume: 0.4,
                    pattern: 'trance_beat',
                    sounds: ['kick', 'hihat', 'kick', 'snare']
                },
                euphoria: {
                    type: 'euphoria',
                    volume: 0.3,
                    pattern: 'uplifting_texture',
                    sounds: ['pluck_sequence', 'arp_cascade', 'vocal_lift'],
                    rhythm: [0.25, 0.125, 4]
                }
            },
            
            progression: ['D', 'Bm', 'G', 'A'],
            structure: {
                intro: 16,
                verse: 32,
                build: 32,
                drop: 64
            },
            
            effects: {
                global: ['compression', 'stereo_width'],
                lead: ['reverb', 'delay', 'chorus'],
                bass: ['sidechain'],
                euphoria: ['reverb', 'pitch_shift', 'delay']
            },
            
            dynamics: {
                intro: 0.5,
                verse: 0.7,
                build: 0.9,
                drop: 1.0
            }
        };
    }
    
    /**
     * テーマ取得
     * @param {number} stageNumber - ステージ番号 (1-9)
     * @returns {Object} テーマ設定
     */
    getTheme(stageNumber) {
        const stage = Math.max(1, Math.min(9, stageNumber));
        return this.themes[stage];
    }
    
    /**
     * 全テーマリスト取得
     * @returns {Array} テーマリスト
     */
    getAllThemes() {
        return Object.values(this.themes);
    }
    
    /**
     * ジャンル別テーマ検索
     * @param {string} genre - ジャンル名
     * @returns {Array} 該当テーマ配列
     */
    getThemesByGenre(genre) {
        return this.getAllThemes().filter(theme => theme.genre === genre);
    }
    
    /**
     * BPM範囲でテーマ検索
     * @param {number} minBpm - 最小BPM
     * @param {number} maxBpm - 最大BPM
     * @returns {Array} 該当テーマ配列
     */
    getThemesByBpmRange(minBpm, maxBpm) {
        return this.getAllThemes().filter(theme => 
            theme.bpm >= minBpm && theme.bpm <= maxBpm
        );
    }
    
    /**
     * テーマ検証
     * @param {Object} theme - テーマオブジェクト
     * @returns {boolean} 有効かどうか
     */
    validateTheme(theme) {
        const required = ['id', 'name', 'genre', 'bpm', 'key', 'instruments', 'progression'];
        return required.every(prop => theme.hasOwnProperty(prop));
    }
}