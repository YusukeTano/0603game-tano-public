/**
 * BackgroundThemes - ステージ別背景テーマ定義
 * A+C+D統合背景システム用設定ファイル
 */

export const BackgroundThemes = {
    stage1: {
        name: 'Neon Genesis',
        theme: 'cyber_space',
        mood: 'peaceful_futuristic',
        
        // 遠景装飾要素（A案） - 星々のみの背景にする場合
        distantStructures: [
            // 宇宙ステーションと惑星を削除して、よりシンプルな背景に
        ],
        
        // 環境エフェクト（C案）
        environmentEffects: {
            aurora: {
                active: false, // オーロラを無効化
                colors: ['#00ff88', '#0088ff', '#8800ff'],
                position: 'top',
                intensity: 0.2
            },
            comboStars: {
                active: true,
                starCount: 200, // 80個 → 200個に大幅増加
                colors: ['#ffffff', '#88ddff', '#ffdd88', '#ff88dd'],
                pulseSpeed: 1.5,
                maxIntensity: 1.0
            },
            nebulaFlow: {
                active: true,
                direction: 'horizontal',
                speed: 0.5,
                color: 'rgba(0, 100, 255, 0.1)'
            }
        },
        
        // インタラクティブ要素（D案）
        interactive: {
            comboResponse: {
                threshold: 10,
                effect: 'combo_stars_only', // 星々のみのエフェクトに変更
                intensity: 1.5
            },
            bossMode: {
                tint: 'rgba(255, 100, 100, 0.1)',
                effect: 'lightning_flashes'
            }
        }
    },
    
    stage2: {
        name: 'Cyber Highway',
        theme: 'retro_city',
        mood: 'retro_driving',
        
        distantStructures: [
            {
                type: 'cityscape',
                size: { width: 1200, height: 200 },
                x: 0.5, y: 0.85,
                color: 'rgba(255, 0, 100, 0.3)',
                neonSigns: true
            },
            {
                type: 'highway',
                size: { width: 800, height: 100 },
                x: 0.5, y: 0.9,
                color: 'rgba(100, 100, 255, 0.2)',
                lanes: 4
            }
        ],
        
        environmentEffects: {
            neonGlow: {
                active: true,
                colors: ['#ff0080', '#00ff80', '#8000ff'],
                pulse: 2.0 // 2秒周期
            },
            retroGrid: {
                active: true,
                style: 'tron',
                color: 'rgba(0, 255, 255, 0.05)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 15,
                effect: 'neon_intensity',
                intensity: 2.0
            },
            bossMode: {
                tint: 'rgba(255, 0, 0, 0.15)',
                effect: 'city_blackout'
            }
        }
    },
    
    stage3: {
        name: 'Digital Storm',
        theme: 'energy_storm',
        mood: 'intense_electronic',
        
        distantStructures: [
            {
                type: 'energyTower',
                size: 500,
                x: 0.2, y: 0.6,
                color: 'rgba(255, 255, 0, 0.4)',
                electricity: true
            },
            {
                type: 'stormCloud',
                size: 400,
                x: 0.7, y: 0.3,
                color: 'rgba(150, 0, 255, 0.3)',
                lightning: true
            }
        ],
        
        environmentEffects: {
            lightning: {
                active: true,
                frequency: 3, // 3秒に1回
                color: '#ffffff',
                duration: 0.1
            },
            electricField: {
                active: true,
                particles: 50,
                color: 'rgba(255, 255, 0, 0.6)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 20,
                effect: 'storm_intensity',
                intensity: 1.8
            },
            bossMode: {
                tint: 'rgba(255, 255, 0, 0.2)',
                effect: 'continuous_lightning'
            }
        }
    },
    
    stage4: {
        name: 'Chrome City',
        theme: 'metallic_city',
        mood: 'tech_precision',
        
        distantStructures: [
            {
                type: 'chromeSpire',
                size: 700,
                x: 0.6, y: 0.5,
                color: 'rgba(200, 200, 255, 0.3)',
                metallic: true
            },
            {
                type: 'techPlatform',
                size: { width: 600, height: 150 },
                x: 0.3, y: 0.8,
                color: 'rgba(150, 150, 200, 0.25)'
            }
        ],
        
        environmentEffects: {
            reflection: {
                active: true,
                intensity: 0.3,
                metallic: true
            },
            techGrid: {
                active: true,
                style: 'hexagonal',
                color: 'rgba(0, 200, 255, 0.1)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 25,
                effect: 'chrome_shine',
                intensity: 2.2
            },
            bossMode: {
                tint: 'rgba(255, 150, 0, 0.15)',
                effect: 'tech_overload'
            }
        }
    },
    
    stage5: {
        name: 'Quantum Dance',
        theme: 'quantum_space',
        mood: 'mysterious_energy',
        
        distantStructures: [
            {
                type: 'quantumPortal',
                size: 400,
                x: 0.5, y: 0.4,
                color: 'rgba(255, 0, 255, 0.4)',
                warp: true
            },
            {
                type: 'energyRing',
                size: 350,
                x: 0.8, y: 0.6,
                color: 'rgba(0, 255, 255, 0.3)',
                rotation: 0.05
            }
        ],
        
        environmentEffects: {
            quantumField: {
                active: true,
                distortion: 0.2,
                color: 'rgba(255, 0, 255, 0.1)'
            },
            particleStream: {
                active: true,
                count: 30,
                flow: 'spiral'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 30,
                effect: 'quantum_resonance',
                intensity: 2.5
            },
            bossMode: {
                tint: 'rgba(255, 0, 255, 0.2)',
                effect: 'reality_distortion'
            }
        }
    },
    
    stage6: {
        name: 'Laser Pulse',
        theme: 'laser_environment',
        mood: 'high_energy',
        
        distantStructures: [
            {
                type: 'laserArray',
                size: { width: 800, height: 300 },
                x: 0.5, y: 0.7,
                color: 'rgba(255, 50, 0, 0.4)',
                beams: true
            },
            {
                type: 'energyCore',
                size: 250,
                x: 0.15, y: 0.4,
                color: 'rgba(255, 100, 0, 0.5)',
                pulse: 1.0
            }
        ],
        
        environmentEffects: {
            laserGrid: {
                active: true,
                beams: 8,
                color: '#ff3300',
                sweep: true
            },
            energyWave: {
                active: true,
                frequency: 1.5,
                color: 'rgba(255, 100, 0, 0.2)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 35,
                effect: 'laser_intensity',
                intensity: 3.0
            },
            bossMode: {
                tint: 'rgba(255, 0, 0, 0.25)',
                effect: 'laser_storm'
            }
        }
    },
    
    stage7: {
        name: 'Binary Dreams',
        theme: 'digital_realm',
        mood: 'ambient_data',
        
        distantStructures: [
            {
                type: 'dataStream',
                size: { width: 1000, height: 400 },
                x: 0.5, y: 0.6,
                color: 'rgba(0, 255, 0, 0.2)',
                flow: 'matrix'
            },
            {
                type: 'codeSpire',
                size: 600,
                x: 0.8, y: 0.5,
                color: 'rgba(0, 200, 100, 0.3)',
                binary: true
            }
        ],
        
        environmentEffects: {
            dataRain: {
                active: true,
                style: 'matrix',
                color: '#00ff00',
                density: 0.3
            },
            digitalNoise: {
                active: true,
                intensity: 0.1,
                color: 'rgba(0, 255, 0, 0.05)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 40,
                effect: 'data_surge',
                intensity: 2.8
            },
            bossMode: {
                tint: 'rgba(255, 255, 255, 0.1)',
                effect: 'system_corruption'
            }
        }
    },
    
    stage8: {
        name: 'Final Protocol',
        theme: 'final_battle',
        mood: 'epic_confrontation',
        
        distantStructures: [
            {
                type: 'enemyDreadnought',
                size: 800,
                x: 0.5, y: 0.3,
                color: 'rgba(150, 0, 0, 0.4)',
                menacing: true
            },
            {
                type: 'battleDebris',
                size: { width: 1200, height: 600 },
                x: 0.5, y: 0.5,
                color: 'rgba(100, 100, 100, 0.2)',
                floating: true
            }
        ],
        
        environmentEffects: {
            warZone: {
                active: true,
                explosions: true,
                frequency: 2,
                color: '#ff6600'
            },
            smokeTrails: {
                active: true,
                density: 0.4,
                color: 'rgba(50, 50, 50, 0.3)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 45,
                effect: 'battle_fury',
                intensity: 3.2
            },
            bossMode: {
                tint: 'rgba(200, 0, 0, 0.3)',
                effect: 'apocalypse_mode'
            }
        }
    },
    
    stage9: {
        name: 'Victory Code',
        theme: 'triumph_space',
        mood: 'uplifting_victory',
        
        distantStructures: [
            {
                type: 'victoryGate',
                size: 900,
                x: 0.5, y: 0.4,
                color: 'rgba(255, 215, 0, 0.5)',
                radiant: true
            },
            {
                type: 'celebrationRings',
                size: 500,
                x: 0.3, y: 0.6,
                color: 'rgba(255, 255, 255, 0.4)',
                expand: true
            }
        ],
        
        environmentEffects: {
            goldenLight: {
                active: true,
                rays: 12,
                color: '#ffd700',
                pulse: 3.0
            },
            starBurst: {
                active: true,
                particles: 100,
                color: 'rgba(255, 255, 255, 0.6)'
            }
        },
        
        interactive: {
            comboResponse: {
                threshold: 50,
                effect: 'victory_crescendo',
                intensity: 4.0
            },
            bossMode: {
                tint: 'rgba(255, 215, 0, 0.2)',
                effect: 'final_triumph'
            }
        }
    }
};

// 背景テーマユーティリティ関数
export class BackgroundThemeUtils {
    /**
     * ステージ番号から背景テーマを取得
     * @param {number} stageNumber - ステージ番号（1-9）
     * @returns {Object} 背景テーマ設定
     */
    static getThemeByStage(stageNumber) {
        const stageKey = `stage${Math.max(1, Math.min(9, stageNumber))}`;
        return BackgroundThemes[stageKey] || BackgroundThemes.stage1;
    }
    
    /**
     * 現在のテーマで敵との色対比をチェック
     * @param {Object} theme - 背景テーマ
     * @param {string} enemyColor - 敵の色
     * @returns {boolean} 視認性が十分かどうか
     */
    static checkVisibilityContrast(theme, enemyColor) {
        // 敵は主に赤系なので、背景は青系・緑系を推奨
        const backgroundHue = theme.environmentEffects?.primaryColor || '#0066ff';
        return true; // 簡易実装（将来的に色彩計算を追加）
    }
    
    /**
     * コンボ数に応じたインタラクティブエフェクト強度計算
     * @param {Object} theme - 背景テーマ
     * @param {number} comboCount - 現在のコンボ数
     * @returns {number} エフェクト強度（0-5）
     */
    static calculateInteractiveIntensity(theme, comboCount) {
        if (!theme.interactive?.comboResponse) return 1;
        
        const threshold = theme.interactive.comboResponse.threshold;
        const baseIntensity = theme.interactive.comboResponse.intensity;
        
        if (comboCount >= threshold) {
            const multiplier = Math.min(comboCount / threshold, 3); // 最大3倍
            return baseIntensity * multiplier;
        }
        
        return 1;
    }
}