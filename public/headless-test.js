#!/usr/bin/env node

/**
 * Headless Browser Test for Phase 5
 * puppeteerがない環境でも実行可能な簡易テスト
 */

const { spawn } = require('child_process');
const http = require('http');

class HeadlessTest {
    constructor() {
        this.testUrl = 'http://localhost:8888/public/test-phase-5-fixed-v2.html';
        this.results = [];
    }

    log(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(entry);
        this.results.push({ type, message, timestamp });
    }

    async testServerAccessibility() {
        this.log('info', 'サーバーアクセシビリティテスト');
        
        return new Promise((resolve) => {
            const req = http.get(this.testUrl, (res) => {
                if (res.statusCode === 200) {
                    this.log('success', `✅ テストページアクセス成功 (${res.statusCode})`);
                    resolve(true);
                } else {
                    this.log('error', `❌ テストページアクセス失敗 (${res.statusCode})`);
                    resolve(false);
                }
            });

            req.on('error', (err) => {
                this.log('error', `❌ サーバーアクセスエラー: ${err.message}`);
                resolve(false);
            });

            req.setTimeout(5000, () => {
                this.log('error', '❌ サーバーアクセスタイムアウト');
                req.destroy();
                resolve(false);
            });
        });
    }

    async testToneJsCDN() {
        this.log('info', 'Tone.js CDN可用性テスト');
        
        return new Promise((resolve) => {
            const toneUrl = 'https://cdn.jsdelivr.net/npm/tone@latest/build/Tone.js';
            const https = require('https');
            
            const req = https.get(toneUrl, (res) => {
                if (res.statusCode === 200) {
                    this.log('success', '✅ Tone.js CDN利用可能');
                    resolve(true);
                } else {
                    this.log('error', `❌ Tone.js CDN利用不可 (${res.statusCode})`);
                    resolve(false);
                }
            });

            req.on('error', (err) => {
                this.log('error', `❌ Tone.js CDNエラー: ${err.message}`);
                resolve(false);
            });

            req.setTimeout(10000, () => {
                this.log('error', '❌ Tone.js CDNタイムアウト');
                req.destroy();
                resolve(false);
            });
        });
    }

    async testModuleResolution() {
        this.log('info', 'モジュール解決テスト');
        
        const modules = [
            '/public/game.js',
            '/public/js/systems/phase5-integration-controller.js',
            '/public/js/systems/integrated-audio-manager.js'
        ];

        let allResolved = true;

        for (const module of modules) {
            const moduleUrl = `http://localhost:8888${module}`;
            
            const accessible = await new Promise((resolve) => {
                const req = http.get(moduleUrl, (res) => {
                    if (res.statusCode === 200) {
                        this.log('success', `✅ ${module} 利用可能`);
                        resolve(true);
                    } else {
                        this.log('error', `❌ ${module} 利用不可 (${res.statusCode})`);
                        resolve(false);
                    }
                });

                req.on('error', () => {
                    this.log('error', `❌ ${module} アクセスエラー`);
                    resolve(false);
                });

                req.setTimeout(5000, () => {
                    req.destroy();
                    resolve(false);
                });
            });

            if (!accessible) {
                allResolved = false;
            }
        }

        return allResolved;
    }

    async simulateBrowserErrors() {
        this.log('info', '一般的なブラウザエラーシミュレーション');
        
        const commonErrors = [
            {
                name: 'CORS Error',
                condition: () => {
                    // file:// プロトコルでアクセスしているかチェック
                    return this.testUrl.startsWith('file://');
                },
                message: 'file:// プロトコルでのモジュールアクセスはCORSエラーを引き起こします'
            },
            {
                name: 'Module Import Error',
                condition: () => {
                    // ES6モジュールサポートの基本チェック
                    try {
                        // Node.jsのモジュールシステムでES6構文をチェック
                        const fs = require('fs');
                        const gameJs = fs.readFileSync('./game.js', 'utf8');
                        return !gameJs.includes('import ') || !gameJs.includes('export ');
                    } catch {
                        return true;
                    }
                },
                message: 'ES6モジュール構文が正しく設定されていません'
            },
            {
                name: 'Audio Context Error',
                condition: () => {
                    // ユーザー操作なしでのAudioContext作成はブロックされる
                    return true; // 常に警告
                },
                message: 'ユーザー操作なしでのAudioContext開始は多くのブラウザでブロックされます'
            }
        ];

        for (const error of commonErrors) {
            if (error.condition()) {
                this.log('warning', `⚠️ ${error.name}: ${error.message}`);
            } else {
                this.log('success', `✅ ${error.name}: 問題なし`);
            }
        }
    }

    async runJavaScriptTest() {
        this.log('info', 'JavaScript実行テスト（Node.js環境）');
        
        try {
            // 基本的なJavaScript構文テスト
            const testCode = `
                const testObj = {
                    checkTone: () => typeof window !== 'undefined' && typeof window.Tone !== 'undefined',
                    checkCanvas: () => typeof document !== 'undefined' && document.getElementById,
                    checkES6: () => {
                        try {
                            eval('const arrow = () => true; class TestClass {}');
                            return true;
                        } catch { return false; }
                    }
                };
                testObj;
            `;
            
            const result = eval(testCode);
            this.log('success', '✅ JavaScript構文解析成功');
            
            if (result.checkES6()) {
                this.log('success', '✅ ES6サポート確認');
            } else {
                this.log('error', '❌ ES6サポートなし');
            }
            
        } catch (error) {
            this.log('error', `❌ JavaScript実行エラー: ${error.message}`);
        }
    }

    async runFullTest() {
        console.log('🧪 Headless Browser Test for Phase 5');
        console.log('=' .repeat(50));

        const serverOk = await this.testServerAccessibility();
        const toneOk = await this.testToneJsCDN();
        const modulesOk = await this.testModuleResolution();
        
        await this.simulateBrowserErrors();
        await this.runJavaScriptTest();

        console.log('\n' + '='.repeat(50));
        console.log('📊 テスト結果サマリー');
        console.log('='.repeat(50));

        const summary = {
            success: this.results.filter(r => r.type === 'success').length,
            warning: this.results.filter(r => r.type === 'warning').length,
            error: this.results.filter(r => r.type === 'error').length,
            info: this.results.filter(r => r.type === 'info').length
        };

        console.log(`✅ 成功: ${summary.success}`);
        console.log(`⚠️ 警告: ${summary.warning}`);
        console.log(`❌ エラー: ${summary.error}`);
        console.log(`ℹ️ 情報: ${summary.info}`);

        const criticalOk = serverOk && toneOk && modulesOk;
        console.log(`\n🎯 重要システム: ${criticalOk ? '正常' : '問題あり'}`);

        if (summary.error > 0) {
            console.log('\n❌ 主要エラー:');
            this.results
                .filter(r => r.type === 'error')
                .slice(0, 3)
                .forEach(r => console.log(`  - ${r.message}`));
        }

        if (summary.warning > 0) {
            console.log('\n⚠️ 警告:');
            this.results
                .filter(r => r.type === 'warning')
                .slice(0, 3)
                .forEach(r => console.log(`  - ${r.message}`));
        }

        // 推奨アクション
        console.log('\n🔧 推奨アクション:');
        if (!criticalOk) {
            if (!serverOk) console.log('  1. HTTPサーバーの起動確認');
            if (!toneOk) console.log('  2. インターネット接続とTone.js CDN確認');
            if (!modulesOk) console.log('  3. モジュールファイルのパス確認');
        } else {
            console.log('  - 実際のブラウザでテストページにアクセス');
            console.log('  - デベロッパーツールでコンソールエラー確認');
            console.log('  - ユーザー操作後のAudioContext開始テスト');
        }

        return {
            criticalOk,
            summary,
            serverOk,
            toneOk,
            modulesOk
        };
    }
}

// 実行
if (require.main === module) {
    const test = new HeadlessTest();
    test.runFullTest().then(results => {
        process.exit(results.criticalOk ? 0 : 1);
    });
}

module.exports = HeadlessTest;