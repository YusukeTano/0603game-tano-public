/**
 * CharacterFactory - キャラクター生成ファクトリークラス
 * 異なるキャラクタータイプの統一的な生成とカスタマイズ
 */
export class CharacterFactory {
    /**
     * キャラクター作成メイン関数
     * @param {string} characterType - キャラクタータイプ ('ray', 'luna', 'aurum')
     * @param {number} x - 初期X座標
     * @param {number} y - 初期Y座標
     * @returns {Object} カスタマイズされたキャラクター情報
     */
    static createCharacter(characterType, x = 640, y = 360) {
        const baseConfig = this._getBaseConfig();
        const characterConfig = this._getCharacterConfig(characterType);
        
        return {
            ...baseConfig,
            ...characterConfig,
            x,
            y,
            characterType
        };
    }
    
    /**
     * 基本キャラクター設定
     * @private
     * @returns {Object} 基本設定
     */
    static _getBaseConfig() {
        return {
            // 基本ステータス
            width: 20,
            height: 20,
            health: 100,
            maxHealth: 100,
            speed: 200,
            level: 1,
            exp: 0,
            expToNext: 100,
            angle: 0,
            
            // バリア効果
            barrierActive: false,
            barrierTimeLeft: 0,
            
            // スキル関連
            skillLevels: {
                damage: 0,
                fireRate: 0,
                bulletSize: 0,
                piercing: 0,
                multiShot: 0,
                bounce: 0,
                homing: 0,
                range: 0,
                itemAttraction: 0,
                luck: 0
            },
            
            // 能力値
            rangeBoosts: 0,
            currentRangeMultiplier: 1.0,
            homingStrengthBonus: 0,
            homingRangeBonus: 0,
            itemAttractionBonus: 0,
            bounceChance: 0,
            piercingChance: 0,
            
            // 視覚・操作設定（デフォルト）
            visualConfig: {
                shape: 'square',
                color: '#00ccff',
                size: 20,
                effects: []
            },
            
            // 操作設定（デフォルト）
            controlConfig: {
                autoAim: false,
                inputMode: 'standard' // 'standard', 'mouse', 'simplified'
            },
            
            // 特殊能力設定
            specialAbilities: {}
        };
    }
    
    /**
     * キャラクター別設定取得
     * @private
     * @param {string} characterType - キャラクタータイプ
     * @returns {Object} キャラクター専用設定
     */
    static _getCharacterConfig(characterType) {
        const configs = {
            ray: this._getRayConfig(),
            luna: this._getLunaConfig(),
            aurum: this._getAurumConfig()
        };
        
        return configs[characterType] || configs.ray;
    }
    
    /**
     * レイ（既存キャラクター）設定
     * @private
     * @returns {Object} レイの設定
     */
    static _getRayConfig() {
        return {
            name: 'レイ',
            description: '地球の平和を守るのが仕事',
            characterType: 'ray',
            
            visualConfig: {
                shape: 'square',
                color: '#00ccff',
                size: 20,
                borderColor: '#ffffff',
                borderWidth: 2,
                effects: [],
                animation: 'none'
            },
            
            controlConfig: {
                autoAim: false,
                inputMode: 'standard'
            },
            
            specialAbilities: {}
        };
    }
    
    /**
     * ルナ（初心者向け）設定
     * @private
     * @returns {Object} ルナの設定
     */
    static _getLunaConfig() {
        return {
            name: 'ルナ',
            description: '初心者用キャラ、マウスで操作',
            characterType: 'luna',
            
            visualConfig: {
                shape: 'circle',
                color: '#FFB6C1', // 淡いピンク
                size: 18,
                centerColor: '#FFF0F5', // 中心部薄いピンク
                borderColor: '#FF69B4',
                borderWidth: 1,
                effects: [
                    {
                        type: 'hearts',
                        positions: [
                            { x: -4, y: -3, size: 2, color: '#FF1493' },
                            { x: 4, y: -3, size: 2, color: '#FF1493' }
                        ]
                    },
                    {
                        type: 'sparkles',
                        particles: [
                            { offset: 8, color: '#FFD700', size: 1 },
                            { offset: 12, color: '#FF69B4', size: 0.5 }
                        ]
                    }
                ],
                animation: 'float', // 上下に浮遊
                trailEffect: 'pink_hearts'
            },
            
            controlConfig: {
                autoAim: true, // オートエイム有効
                inputMode: 'mouse', // マウス/タッチ移動のみ
                aimAssist: true
            },
            
            specialAbilities: {
                autoTargeting: {
                    enabled: true,
                    range: 300,
                    priority: 'nearest' // 最も近い敵を狙う
                }
            }
        };
    }
    
    /**
     * オーラム（運特化）設定
     * @private
     * @returns {Object} オーラムの設定
     */
    static _getAurumConfig() {
        return {
            name: 'オーラム',
            description: 'レア武器を拾いやすい',
            characterType: 'aurum',
            
            // 運レベル10でスタート
            skillLevels: {
                damage: 0,
                fireRate: 0,
                bulletSize: 0,
                piercing: 0,
                multiShot: 0,
                bounce: 0,
                homing: 0,
                range: 0,
                itemAttraction: 0,
                luck: 10 // 運レベル10スタート
            },
            
            visualConfig: {
                shape: 'hexagon', // 六角形
                color: '#FFD700', // 金色
                size: 20,
                effects: [
                    {
                        type: 'aura',
                        layers: [
                            {
                                color: '#FFFF00', // 内側黄色オーラ
                                radius: 25,
                                opacity: 0.6,
                                animation: 'pulse_slow'
                            },
                            {
                                color: '#FFA500', // 外側オレンジオーラ
                                radius: 35,
                                opacity: 0.3,
                                animation: 'rotate_clockwise'
                            }
                        ]
                    },
                    {
                        type: 'particles',
                        particleType: 'golden_dust',
                        count: 8,
                        orbit: true,
                        sparkle: 'random'
                    }
                ],
                animation: 'pulse',
                surfaceEffect: 'metallic',
                facets: 6
            },
            
            controlConfig: {
                autoAim: false,
                inputMode: 'standard'
            },
            
            specialAbilities: {
                luckBoost: {
                    enabled: true,
                    initialLevel: 10,
                    rainbowThreshold: 20 // 運レベル20でレインボー
                },
                enhancedDrops: {
                    enabled: true,
                    rateMultiplier: 1.5 // 運レベル10で既に1.5倍
                }
            }
        };
    }
    
    /**
     * キャラクター情報取得（UI用）
     * @param {string} characterType - キャラクタータイプ
     * @returns {Object} UI表示用情報
     */
    static getCharacterInfo(characterType) {
        const config = this._getCharacterConfig(characterType);
        return {
            name: config.name,
            description: config.description,
            characterType: characterType,
            previewConfig: {
                visual: config.visualConfig,
                abilities: Object.keys(config.specialAbilities)
            }
        };
    }
    
    /**
     * 利用可能なキャラクター一覧取得
     * @returns {Array} キャラクター情報配列
     */
    static getAvailableCharacters() {
        return [
            this.getCharacterInfo('ray'),
            this.getCharacterInfo('luna'),
            this.getCharacterInfo('aurum')
        ];
    }
    
    /**
     * キャラクター別視覚エフェクト設定取得
     * @param {string} characterType - キャラクタータイプ
     * @returns {Object} 視覚エフェクト設定
     */
    static getVisualEffects(characterType) {
        const config = this._getCharacterConfig(characterType);
        return config.visualConfig;
    }
    
    /**
     * キャラクター別操作設定取得
     * @param {string} characterType - キャラクタータイプ
     * @returns {Object} 操作設定
     */
    static getControlConfig(characterType) {
        const config = this._getCharacterConfig(characterType);
        return config.controlConfig;
    }
}