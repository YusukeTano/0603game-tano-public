const puppeteer = require('puppeteer');

async function testLevelUpModal() {
    console.log('🔍 レベルアップモーダル詳細デバッグテスト開始');
    
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: {
            width: 375,
            height: 812,
            isMobile: true,
            hasTouch: true,
            deviceScaleFactor: 3
        },
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
        const page = await browser.newPage();
        
        // iPhone User Agent設定
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
        
        // ページ読み込み
        await page.goto('http://localhost:8080');
        
        // ゲーム読み込み完了まで待機
        await page.waitForSelector('#start-game-btn', { visible: true });
        console.log('✅ メニュー画面表示確認');
        
        // ゲーム開始
        await page.click('#start-game-btn');
        await page.waitForSelector('#mobile-ui', { visible: true });
        console.log('✅ モバイルゲームUI表示確認');
        
        // レベルアップのためにEXPを強制的に増加
        console.log('🔧 EXP強制増加でレベルアップ発生');
        await page.evaluate(() => {
            // プレイヤーのEXPを強制的に増加してレベルアップを発生
            window.game.player.exp = window.game.player.expToNext;
            window.game.levelUp();
        });
        
        // レベルアップモーダル表示確認
        await page.waitForSelector('#levelup-modal', { visible: true, timeout: 5000 });
        console.log('✅ レベルアップモーダル表示確認');
        
        // モーダルの詳細情報を取得
        const modalInfo = await page.evaluate(() => {
            const modal = document.getElementById('levelup-modal');
            const options = document.querySelectorAll('.upgrade-option');
            
            return {
                modalVisible: !modal.classList.contains('hidden'),
                modalComputedStyle: window.getComputedStyle(modal),
                optionsCount: options.length,
                optionsInfo: Array.from(options).map((option, index) => ({
                    index,
                    visible: option.offsetParent !== null,
                    computedStyle: {
                        display: window.getComputedStyle(option).display,
                        pointerEvents: window.getComputedStyle(option).pointerEvents,
                        zIndex: window.getComputedStyle(option).zIndex,
                        position: window.getComputedStyle(option).position,
                        opacity: window.getComputedStyle(option).opacity
                    },
                    boundingBox: option.getBoundingClientRect(),
                    innerHTML: option.innerHTML.substring(0, 100) + '...'
                }))
            };
        });
        
        console.log('📊 モーダル詳細情報:');
        console.log('  - モーダル表示:', modalInfo.modalVisible);
        console.log('  - スキル選択肢数:', modalInfo.optionsCount);
        console.log('  - モーダルスタイル:', {
            display: modalInfo.modalComputedStyle.display,
            pointerEvents: modalInfo.modalComputedStyle.pointerEvents,
            zIndex: modalInfo.modalComputedStyle.zIndex
        });
        
        modalInfo.optionsInfo.forEach((option, i) => {
            console.log(`  - 選択肢${i + 1}:`, {
                visible: option.visible,
                style: option.computedStyle,
                boundingBox: option.boundingBox,
                size: `${option.boundingBox.width}x${option.boundingBox.height}`
            });
        });
        
        // 最初のスキル選択肢をクリックテスト
        console.log('🖱️ 最初のスキル選択肢クリックテスト');
        
        const clickResult = await page.evaluate(() => {
            const options = document.querySelectorAll('.upgrade-option');
            if (options.length === 0) return { success: false, error: 'スキル選択肢が見つからない' };
            
            const firstOption = options[0];
            const rect = firstOption.getBoundingClientRect();
            
            // 様々な方法でクリックを試行
            const results = [];
            
            // 1. 直接click()メソッド
            try {
                firstOption.click();
                results.push({ method: 'direct_click', success: true });
            } catch (e) {
                results.push({ method: 'direct_click', success: false, error: e.message });
            }
            
            // 2. MouseEventでのシミュレーション
            try {
                const clickEvent = new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true,
                    clientX: rect.left + rect.width / 2,
                    clientY: rect.top + rect.height / 2
                });
                firstOption.dispatchEvent(clickEvent);
                results.push({ method: 'mouse_event', success: true });
            } catch (e) {
                results.push({ method: 'mouse_event', success: false, error: e.message });
            }
            
            // 3. TouchEventでのシミュレーション
            try {
                const touchStart = new TouchEvent('touchstart', {
                    bubbles: true,
                    cancelable: true,
                    touches: [{
                        clientX: rect.left + rect.width / 2,
                        clientY: rect.top + rect.height / 2
                    }]
                });
                const touchEnd = new TouchEvent('touchend', {
                    bubbles: true,
                    cancelable: true
                });
                firstOption.dispatchEvent(touchStart);
                firstOption.dispatchEvent(touchEnd);
                results.push({ method: 'touch_event', success: true });
            } catch (e) {
                results.push({ method: 'touch_event', success: false, error: e.message });
            }
            
            return {
                success: true,
                elementInfo: {
                    tagName: firstOption.tagName,
                    className: firstOption.className,
                    boundingBox: rect,
                    offsetParent: firstOption.offsetParent ? 'exists' : 'null'
                },
                clickResults: results
            };
        });
        
        console.log('🔍 クリックテスト結果:', clickResult);
        
        // モーダルが閉じたかチェック
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const finalState = await page.evaluate(() => {
            const modal = document.getElementById('levelup-modal');
            return {
                modalHidden: modal.classList.contains('hidden'),
                gameState: window.game.gameState,
                isPaused: window.game.isPaused
            };
        });
        
        console.log('📊 最終状態:', finalState);
        
        if (finalState.modalHidden) {
            console.log('✅ スキル選択成功 - モーダルが閉じました');
        } else {
            console.log('❌ スキル選択失敗 - モーダルが残っています');
            
            // タッチイベントの追加テスト
            console.log('🔧 タッチイベント追加テスト');
            await page.tap('.upgrade-option');
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const afterTapState = await page.evaluate(() => {
                const modal = document.getElementById('levelup-modal');
                return modal.classList.contains('hidden');
            });
            
            if (afterTapState) {
                console.log('✅ タップ操作で成功');
            } else {
                console.log('❌ タップ操作でも失敗');
            }
        }
        
    } catch (error) {
        console.error('❌ テスト中にエラーが発生:', error);
    } finally {
        await browser.close();
    }
}

testLevelUpModal().catch(console.error);