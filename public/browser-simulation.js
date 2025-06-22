#!/usr/bin/env node

/**
 * ブラウザ環境シミュレーション
 * actual browser環境でのエラーを再現
 */

const fs = require('fs');
const path = require('path');

// ブラウザグローバルのmock
global.window = {
    location: {
        protocol: 'http:',
        href: 'http://localhost:8888/public/test-phase-5-fixed-v2.html'
    },
    addEventListener: () => {},
    setTimeout: setTimeout,
    setInterval: setInterval,
    clearTimeout: clearTimeout,
    clearInterval: clearInterval
};

global.document = {
    getElementById: (id) => {
        // 重要なUI要素を模擬
        const elements = {
            'game-canvas': { 
                getContext: () => ({ clearRect: () => {}, fillRect: () => {} }),
                width: 1280,
                height: 720
            },
            'start-game-btn': { click: () => {} },
            'loading-screen': { style: { display: 'none' } },
            'main-menu': { style: { display: 'block' } },
            'game-screen': { style: { display: 'none' } },
            'master-volume': { value: 80 },
            'bgm-volume': { value: 30 },
            'sfx-volume': { value: 70 }
        };
        return elements[id] || { style: { display: 'none' } };
    },
    addEventListener: () => {},
    createElement: () => ({ style: {}, appendChild: () => {} }),
    body: { appendChild: () => {} }
};

// Tone.js の基本的なmock
global.Tone = {
    start: async () => {
        console.log('🔊 Tone.js AudioContext started (mocked)');
    },
    version: '14.7.77',
    context: {
        state: 'running',
        sampleRate: 44100
    },
    Synth: class MockSynth {
        toDestination() { return this; }
        triggerAttackRelease() {
            console.log('🎵 Test sound played (mocked)');
        }
    }
};

global.AudioContext = class MockAudioContext {
    constructor() {
        this.state = 'suspended';
        this.sampleRate = 44100;
    }
    
    async resume() {
        this.state = 'running';
    }
};

// Console logging with colors
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(color, prefix, message) {
    console.log(`${colors[color]}${prefix}${colors.reset} ${message}`);
}

class BrowserSimulation {
    constructor() {
        this.errors = [];
        this.warnings = [];
        this.successes = [];
    }

    async testModuleImports() {
        colorLog('cyan', '📦', 'モジュールインポートテスト開始');
        
        const modules = [
            { 
                path: './game.js', 
                name: 'ZombieSurvival',
                critical: true
            },
            { 
                path: './js/systems/phase5-integration-controller.js', 
                name: 'Phase5IntegrationController',
                critical: true
            },
            { 
                path: './js/systems/integrated-audio-manager.js', 
                name: 'IntegratedAudioManager',
                critical: true
            },
            { 
                path: './js/systems/phase4-audio-facade.js', 
                name: 'Phase4AudioFacade',
                critical: false
            }
        ];

        for (const mod of modules) {
            try {
                colorLog('blue', 'ℹ️', `${mod.name} インポート試行中...`);
                
                // ファイル存在確認
                const fullPath = path.resolve(__dirname, mod.path);
                if (!fs.existsSync(fullPath)) {
                    throw new Error(`File not found: ${fullPath}`);
                }

                // ファイル内容確認
                const content = fs.readFileSync(fullPath, 'utf8');
                
                // export文確認
                if (!content.includes('export')) {
                    throw new Error(`No export statements found in ${mod.path}`);
                }

                // import文の依存関係確認
                const importMatches = content.match(/import\s+.*?\s+from\s+['"`](.*?)['"`]/g);
                if (importMatches) {
                    for (const importMatch of importMatches) {
                        const depPath = importMatch.match(/from\s+['"`](.*?)['"`]/)[1];
                        let resolvedPath;
                        
                        if (depPath.startsWith('./')) {
                            resolvedPath = path.resolve(path.dirname(fullPath), depPath);
                        } else {
                            resolvedPath = path.resolve(__dirname, depPath);
                        }
                        
                        if (!fs.existsSync(resolvedPath)) {
                            throw new Error(`Dependency not found: ${depPath} (resolved: ${resolvedPath})`);
                        }
                    }
                }

                this.successes.push(mod.name);
                colorLog('green', '✅', `${mod.name} インポート成功`);
                
            } catch (error) {
                const errorMsg = `${mod.name} インポート失敗: ${error.message}`;
                if (mod.critical) {
                    this.errors.push(errorMsg);
                    colorLog('red', '❌', errorMsg);
                } else {
                    this.warnings.push(errorMsg);
                    colorLog('yellow', '⚠️', errorMsg);
                }
            }
        }
    }

    async testGameInitialization() {
        colorLog('cyan', '🎮', 'ゲーム初期化シミュレーション');
        
        try {
            // game.jsの基本構文確認
            const gameJsPath = path.resolve(__dirname, 'game.js');
            const gameContent = fs.readFileSync(gameJsPath, 'utf8');
            
            // クラス定義確認
            if (!gameContent.includes('class ZombieSurvival')) {
                throw new Error('ZombieSurvival class not found');
            }

            // コンストラクタ確認
            if (!gameContent.includes('constructor()')) {
                throw new Error('Constructor not found');
            }

            // 重要メソッド確認
            const requiredMethods = [
                'init()', 
                'initializeAudioSystem()', 
                'update()', 
                'render()'
            ];

            for (const method of requiredMethods) {
                if (!gameContent.includes(method)) {
                    throw new Error(`Required method ${method} not found`);
                }
            }

            // Phase 5統合確認
            if (!gameContent.includes('phase5Integration')) {
                throw new Error('phase5Integration property not found');
            }

            this.successes.push('GameInitialization');
            colorLog('green', '✅', 'ゲーム初期化構造確認');

        } catch (error) {
            const errorMsg = `ゲーム初期化エラー: ${error.message}`;
            this.errors.push(errorMsg);
            colorLog('red', '❌', errorMsg);
        }
    }

    async testAudioSystemStructure() {
        colorLog('cyan', '🔊', '音響システム構造確認');

        const audioFiles = [
            'js/systems/integrated-audio-manager.js',
            'js/systems/phase4-audio-facade.js',
            'js/systems/phase5-integration-controller.js',
            'js/systems/audio-core.js',
            'js/systems/audio-engine.js'
        ];

        let audioSystemOk = true;

        for (const file of audioFiles) {
            try {
                const filePath = path.resolve(__dirname, file);
                if (!fs.existsSync(filePath)) {
                    throw new Error(`Audio file not found: ${file}`);
                }

                const content = fs.readFileSync(filePath, 'utf8');
                
                // クラス定義確認
                if (!content.includes('class ') && !content.includes('export ')) {
                    throw new Error(`No class or export found in ${file}`);
                }

                colorLog('green', '✅', `${file} 構造確認`);

            } catch (error) {
                audioSystemOk = false;
                this.errors.push(`音響ファイル: ${error.message}`);
                colorLog('red', '❌', `音響ファイル: ${error.message}`);
            }
        }

        if (audioSystemOk) {
            this.successes.push('AudioSystemStructure');
        }
    }

    async testPhase5Features() {
        colorLog('cyan', '🚀', 'Phase 5機能確認');

        try {
            const phase5Path = path.resolve(__dirname, 'js/systems/phase5-integration-controller.js');
            const content = fs.readFileSync(phase5Path, 'utf8');

            // 重要メソッド確認
            const requiredFeatures = [
                'playPickupSound',
                'playLevelUpSound', 
                'handleComboSound',
                'toggleFeature'
            ];

            const missingFeatures = [];
            for (const feature of requiredFeatures) {
                if (!content.includes(feature)) {
                    missingFeatures.push(feature);
                }
            }

            if (missingFeatures.length > 0) {
                throw new Error(`Missing Phase 5 features: ${missingFeatures.join(', ')}`);
            }

            this.successes.push('Phase5Features');
            colorLog('green', '✅', 'Phase 5機能確認完了');

        } catch (error) {
            const errorMsg = `Phase 5機能: ${error.message}`;
            this.errors.push(errorMsg);
            colorLog('red', '❌', errorMsg);
        }
    }

    async runFullSimulation() {
        console.log('🔬 ブラウザ環境シミュレーション開始');
        console.log('=' .repeat(50));

        await this.testModuleImports();
        await this.testGameInitialization();
        await this.testAudioSystemStructure();
        await this.testPhase5Features();

        console.log('\n' + '='.repeat(50));
        colorLog('cyan', '📊', '最終結果サマリー');
        console.log('=' .repeat(50));

        console.log(`✅ 成功: ${this.successes.length}`);
        console.log(`⚠️ 警告: ${this.warnings.length}`);
        console.log(`❌ エラー: ${this.errors.length}`);

        const total = this.successes.length + this.warnings.length + this.errors.length;
        const successRate = total > 0 ? (this.successes.length / total * 100).toFixed(1) : 0;
        console.log(`\n🎯 成功率: ${successRate}%`);

        if (this.errors.length > 0) {
            console.log('\n❌ 重要なエラー:');
            this.errors.slice(0, 5).forEach(error => {
                colorLog('red', '  -', error);
            });
        }

        if (this.warnings.length > 0) {
            console.log('\n⚠️ 警告:');
            this.warnings.slice(0, 3).forEach(warning => {
                colorLog('yellow', '  -', warning);
            });
        }

        return {
            successes: this.successes.length,
            warnings: this.warnings.length,
            errors: this.errors.length,
            successRate: parseFloat(successRate),
            issues: [...this.errors, ...this.warnings]
        };
    }
}

// 実行
if (require.main === module) {
    const simulation = new BrowserSimulation();
    simulation.runFullSimulation().then(results => {
        process.exit(results.errors > 0 ? 1 : 0);
    });
}

module.exports = BrowserSimulation;