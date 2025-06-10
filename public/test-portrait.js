#!/usr/bin/env node

/**
 * 縦画面（ポートレート）モード専用テストスクリプト
 * screen-controlsが正しく機能するかを検証
 */

const puppeteer = require('puppeteer');

async function testPortraitMode() {
    console.log('🧪 縦画面モードテスト開始...\n');
    
    const browser = await puppeteer.launch({
        headless: false,
        devtools: true
    });
    
    const page = await browser.newPage();
    
    // iPhone 12 Pro 縦画面モード
    await page.emulate({
        name: 'iPhone 12 Pro Portrait',
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
    
    console.log('📱 デバイス: iPhone 12 Pro (縦画面)');
    console.log('📐 画面サイズ: 390x844\n');
    
    // ゲームページへ移動
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#start-game-btn');
    
    // ゲーム開始
    await page.click('#start-game-btn');
    await page.waitForSelector('#game-canvas');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 画面状態の確認
    const screenInfo = await page.evaluate(() => {
        const controls = document.querySelector('.screen-controls');
        const mobileUI = document.querySelector('#mobile-ui');
        const pcUI = document.querySelector('#pc-ui');
        const canvas = document.querySelector('#game-canvas');
        const leftArea = document.querySelector('.left-area');
        const rightArea = document.querySelector('.right-area');
        
        return {
            screenControls: {
                exists: !!controls,
                display: controls ? getComputedStyle(controls).display : null,
                zIndex: controls ? getComputedStyle(controls).zIndex : null,
                pointerEvents: controls ? getComputedStyle(controls).pointerEvents : null
            },
            mobileUI: {
                exists: !!mobileUI,
                display: mobileUI ? getComputedStyle(mobileUI).display : null,
                hasHiddenClass: mobileUI ? mobileUI.classList.contains('hidden') : null
            },
            pcUI: {
                exists: !!pcUI,
                display: pcUI ? getComputedStyle(pcUI).display : null
            },
            canvas: {
                width: canvas ? canvas.width : null,
                height: canvas ? canvas.height : null,
                offsetWidth: canvas ? canvas.offsetWidth : null,
                offsetHeight: canvas ? canvas.offsetHeight : null
            },
            touchAreas: {
                leftExists: !!leftArea,
                rightExists: !!rightArea
            }
        };
    });
    
    console.log('📊 画面状態チェック結果:');
    console.log('================================');
    console.log(`✅ Screen Controls: ${screenInfo.screenControls.exists ? '表示' : '非表示'}`);
    console.log(`   - Display: ${screenInfo.screenControls.display}`);
    console.log(`   - Z-Index: ${screenInfo.screenControls.zIndex}`);
    console.log(`   - Pointer Events: ${screenInfo.screenControls.pointerEvents}`);
    console.log(`✅ Mobile UI: ${screenInfo.mobileUI.display === 'block' ? '表示' : '非表示'}`);
    console.log(`✅ PC UI: ${screenInfo.pcUI.display === 'none' ? '非表示' : '表示'}`);
    console.log(`✅ タッチエリア: 左=${screenInfo.touchAreas.leftExists}, 右=${screenInfo.touchAreas.rightExists}`);
    console.log(`📐 Canvas: ${screenInfo.canvas.offsetWidth}x${screenInfo.canvas.offsetHeight}`);
    console.log('================================\n');
    
    // タッチイベントテスト
    console.log('👆 タッチイベントテスト...');
    
    // 左半分タッチ（移動）
    const touchResult = await page.evaluate(() => {
        const canvas = document.getElementById('game-canvas');
        const rect = canvas.getBoundingClientRect();
        
        // 左側タッチ
        const leftX = rect.left + rect.width * 0.25;
        const leftY = rect.top + rect.height * 0.5;
        
        const touchEvent = new Touch({
            identifier: 1,
            target: canvas,
            clientX: leftX,
            clientY: leftY,
            pageX: leftX,
            pageY: leftY
        });
        
        const touchStart = new TouchEvent('touchstart', {
            bubbles: true,
            cancelable: true,
            touches: [touchEvent],
            targetTouches: [touchEvent],
            changedTouches: [touchEvent]
        });
        
        canvas.dispatchEvent(touchStart);
        
        // デバッグ情報を取得
        const debugInfo = document.getElementById('debug-info');
        return debugInfo ? debugInfo.innerText : 'デバッグ情報なし';
    });
    
    console.log('📊 タッチ後のデバッグ情報:');
    console.log(touchResult);
    
    console.log('\n✅ テスト完了！');
    console.log('🔍 ブラウザは開いたままです。手動でも確認してください。');
    
    // 10秒後に終了
    setTimeout(async () => {
        await browser.close();
        process.exit(0);
    }, 10000);
}

// 実行
testPortraitMode().catch(console.error);