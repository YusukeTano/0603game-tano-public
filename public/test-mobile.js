#!/usr/bin/env node

/**
 * モバイルタッチ操作テスト用スクリプト
 * Puppeteerを使用してモバイル環境でのタッチイベントをシミュレート
 */

const puppeteer = require('puppeteer');

class MobileGameTester {
    constructor() {
        this.browser = null;
        this.page = null;
        this.logs = [];
    }

    async initialize() {
        console.log('🚀 Puppeteerブラウザを起動中...');
        
        this.browser = await puppeteer.launch({
            headless: false, // ブラウザウィンドウを表示
            devtools: true,  // 開発者ツールを開く
            args: [
                '--enable-features=TouchpadAndWheelScrollLatching',
                '--enable-touch-events',
                '--enable-features=VizDisplayCompositor',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });

        this.page = await this.browser.newPage();
        
        // iPhone 12 Proのスペックでエミュレート
        await this.page.emulate({
            name: 'iPhone 12 Pro',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            viewport: {
                width: 390,
                height: 844,
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true,
                isLandscape: false
            }
        });

        // コンソールログを監視
        this.page.on('console', (msg) => {
            const logEntry = `[${msg.type()}] ${msg.text()}`;
            this.logs.push(logEntry);
            console.log(`📱 ${logEntry}`);
        });

        // エラーを監視
        this.page.on('error', (error) => {
            console.error('❌ ページエラー:', error);
        });

        // ネットワークエラーを監視
        this.page.on('pageerror', (error) => {
            console.error('❌ JavaScriptエラー:', error);
        });

        console.log('✅ ブラウザ初期化完了');
    }

    async navigateToGame() {
        console.log('🎮 ゲームページに移動中...');
        
        try {
            await this.page.goto('http://localhost:8080', {
                waitUntil: 'networkidle0',
                timeout: 10000
            });
            
            console.log('✅ ページ読み込み完了');
            
            // ゲームタイトルの確認
            const title = await this.page.title();
            console.log(`📄 ページタイトル: ${title}`);
            
            return true;
        } catch (error) {
            console.error('❌ ページ読み込み失敗:', error);
            return false;
        }
    }

    async waitForGameStart() {
        console.log('⏳ ゲーム開始を待機中...');
        
        try {
            // ゲーム開始ボタンを待機
            await this.page.waitForSelector('#start-game-btn', { timeout: 5000 });
            console.log('✅ ゲーム開始ボタンを発見');
            
            // JavaScriptでクリックを実行（より確実）
            await this.page.evaluate(() => {
                const startBtn = document.getElementById('start-game-btn');
                if (startBtn) {
                    startBtn.click();
                    return true;
                }
                return false;
            });
            console.log('🎯 ゲーム開始ボタンをクリック');
            
            // ゲーム画面の読み込みを待機
            await this.page.waitForSelector('#game-canvas', { timeout: 10000 });
            console.log('✅ ゲームキャンバスを発見');
            
            // ゲーム状態の確認
            await new Promise(resolve => setTimeout(resolve, 2000)); // ゲーム初期化待機
            
            // モバイルUIの表示を確認（エラーでも続行）
            try {
                await this.page.waitForSelector('.screen-controls', { timeout: 3000 });
                console.log('✅ モバイルタッチエリアを発見');
            } catch (e) {
                console.log('⚠️ モバイルタッチエリア未発見（続行）');
            }
            
            // デバッグ情報の表示を確認（エラーでも続行）
            try {
                await this.page.waitForSelector('#debug-info', { timeout: 3000 });
                console.log('✅ デバッグ情報パネルを発見');
            } catch (e) {
                console.log('⚠️ デバッグ情報パネル未発見（続行）');
            }
            
            return true;
        } catch (error) {
            console.error('❌ ゲーム開始失敗:', error);
            return false;
        }
    }

    async getDebugInfo() {
        try {
            const debugInfo = await this.page.evaluate(() => {
                const debugElement = document.getElementById('debug-info');
                if (!debugElement) return null;
                
                return {
                    touch: document.getElementById('debug-touch')?.textContent || 'N/A',
                    base: document.getElementById('debug-base')?.textContent || 'N/A',
                    scale: document.getElementById('debug-scale')?.textContent || 'N/A',
                    move: document.getElementById('debug-move')?.textContent || 'N/A',
                    aim: document.getElementById('debug-aim')?.textContent || 'N/A',
                    mobile: document.getElementById('debug-mobile')?.textContent || 'N/A',
                    pointer: document.getElementById('debug-pointer')?.textContent || 'N/A',
                    touchSupport: document.getElementById('debug-touch-support')?.textContent || 'N/A'
                };
            });
            
            return debugInfo;
        } catch (error) {
            console.error('❌ デバッグ情報取得失敗:', error);
            return null;
        }
    }

    async simulateTouchEvents() {
        console.log('👆 タッチイベントシミュレーション開始...');
        
        try {
            // キャンバス要素を取得
            const canvas = await this.page.$('#game-canvas');
            if (!canvas) {
                throw new Error('キャンバス要素が見つかりません');
            }
            
            const canvasBox = await canvas.boundingBox();
            console.log('📐 キャンバス位置:', canvasBox);
            
            // 左半分タッチテスト（移動）
            console.log('👆 左半分タッチテスト...');
            const leftX = canvasBox.x + canvasBox.width * 0.25; // 左側25%位置
            const leftY = canvasBox.y + canvasBox.height * 0.5;  // 中央高さ
            
            console.log(`📍 左タッチ座標: (${leftX.toFixed(1)}, ${leftY.toFixed(1)})`);
            
            // タッチダウン
            await this.page.touchscreen.tap(leftX, leftY);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // デバッグ情報を確認
            let debugInfo = await this.getDebugInfo();
            console.log('📊 左タッチ後のデバッグ情報:', debugInfo);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // 右半分タッチテスト（射撃）
            console.log('👆 右半分タッチテスト...');
            const rightX = canvasBox.x + canvasBox.width * 0.75; // 右側75%位置
            const rightY = canvasBox.y + canvasBox.height * 0.5;  // 中央高さ
            
            console.log(`📍 右タッチ座標: (${rightX.toFixed(1)}, ${rightY.toFixed(1)})`);
            
            // タッチダウン
            await this.page.touchscreen.tap(rightX, rightY);
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // デバッグ情報を確認
            debugInfo = await this.getDebugInfo();
            console.log('📊 右タッチ後のデバッグ情報:', debugInfo);
            
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // ドラッグテスト（移動）
            console.log('👆 ドラッグテスト（移動）...');
            
            // より高度なタッチイベントシミュレーション
            await this.page.evaluate((x, y) => {
                const canvas = document.getElementById('game-canvas');
                if (canvas) {
                    // PointerEventを直接発火
                    const pointerDown = new PointerEvent('pointerdown', {
                        pointerId: 1,
                        clientX: x,
                        clientY: y,
                        bubbles: true,
                        cancelable: true
                    });
                    canvas.dispatchEvent(pointerDown);
                    
                    console.log('Direct PointerEvent sent:', x, y);
                    
                    // タッチイベントも同時に発火
                    const touchStart = new TouchEvent('touchstart', {
                        touches: [{
                            identifier: 1,
                            clientX: x,
                            clientY: y,
                            target: canvas
                        }],
                        bubbles: true,
                        cancelable: true
                    });
                    canvas.dispatchEvent(touchStart);
                }
            }, leftX, leftY);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // ドラッグ移動
            await this.page.evaluate((x1, y1, x2, y2) => {
                const canvas = document.getElementById('game-canvas');
                if (canvas) {
                    const pointerMove = new PointerEvent('pointermove', {
                        pointerId: 1,
                        clientX: x2,
                        clientY: y2,
                        bubbles: true,
                        cancelable: true
                    });
                    canvas.dispatchEvent(pointerMove);
                }
            }, leftX, leftY, leftX + 50, leftY + 30);
            
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // ドラッグ終了
            await this.page.evaluate((x, y) => {
                const canvas = document.getElementById('game-canvas');
                if (canvas) {
                    const pointerUp = new PointerEvent('pointerup', {
                        pointerId: 1,
                        clientX: x,
                        clientY: y,
                        bubbles: true,
                        cancelable: true
                    });
                    canvas.dispatchEvent(pointerUp);
                }
            }, leftX + 50, leftY + 30);
            
            // 最終デバッグ情報
            debugInfo = await this.getDebugInfo();
            console.log('📊 ドラッグ後のデバッグ情報:', debugInfo);
            
            return true;
        } catch (error) {
            console.error('❌ タッチシミュレーション失敗:', error);
            return false;
        }
    }

    async runFullTest() {
        console.log('🧪 フルテスト開始...');
        
        try {
            // 1. ブラウザ初期化
            await this.initialize();
            
            // 2. ゲームページに移動
            const pageLoaded = await this.navigateToGame();
            if (!pageLoaded) return false;
            
            // 3. ゲーム開始
            const gameStarted = await this.waitForGameStart();
            if (!gameStarted) return false;
            
            // 4. 初期デバッグ情報を確認
            console.log('📊 初期デバッグ情報取得...');
            const initialDebug = await this.getDebugInfo();
            console.log('📊 初期状態:', initialDebug);
            
            // 5. タッチイベントテスト
            await this.simulateTouchEvents();
            
            // 6. 結果レポート
            console.log('\n📋 テスト結果レポート:');
            console.log('==================');
            console.log(`📝 コンソールログ件数: ${this.logs.length}`);
            this.logs.forEach((log, index) => {
                if (index < 20) { // 最初の20件のみ表示
                    console.log(`  ${index + 1}. ${log}`);
                }
            });
            
            console.log('\n✅ テスト完了！ブラウザは開いたままにしてあります。');
            console.log('🔍 手動でも確認してみてください。');
            
            return true;
        } catch (error) {
            console.error('❌ テスト実行エラー:', error);
            return false;
        }
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
            console.log('🧹 ブラウザを終了しました');
        }
    }
}

// メイン実行
async function main() {
    const tester = new MobileGameTester();
    
    try {
        await tester.runFullTest();
        
        // テスト完了後、しばらく待機してからブラウザを終了
        console.log('\n⏳ 10秒後にブラウザを終了します...');
        setTimeout(async () => {
            await tester.cleanup();
            process.exit(0);
        }, 10000);
        
    } catch (error) {
        console.error('❌ メイン実行エラー:', error);
        await tester.cleanup();
        process.exit(1);
    }
}

// 実行
if (require.main === module) {
    main();
}

module.exports = MobileGameTester;