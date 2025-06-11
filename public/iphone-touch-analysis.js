const puppeteer = require('puppeteer');

async function analyzeIPhoneTouchEvents() {
    console.log('📱 iPhone タッチイベント詳細分析開始');
    
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
        
        // 本物のiPhone User Agent設定
        await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
        
        // タッチイベント監視を追加
        await page.evaluateOnNewDocument(() => {
            console.log('🔧 タッチイベント監視を設定');
            
            // グローバルタッチイベントログ
            window.touchEventLog = [];
            window.clickEventLog = [];
            
            // 全てのタッチイベントを監視
            ['touchstart', 'touchmove', 'touchend', 'touchcancel'].forEach(eventType => {
                document.addEventListener(eventType, (e) => {
                    window.touchEventLog.push({
                        type: eventType,
                        timestamp: Date.now(),
                        target: e.target.tagName + '.' + e.target.className,
                        touches: e.touches.length,
                        changedTouches: e.changedTouches.length,
                        defaultPrevented: e.defaultPrevented,
                        isTrusted: e.isTrusted
                    });
                }, { passive: false });
            });
            
            // 全てのクリックイベントを監視
            ['click', 'mousedown', 'mouseup'].forEach(eventType => {
                document.addEventListener(eventType, (e) => {
                    window.clickEventLog.push({
                        type: eventType,
                        timestamp: Date.now(),
                        target: e.target.tagName + '.' + e.target.className,
                        clientX: e.clientX,
                        clientY: e.clientY,
                        defaultPrevented: e.defaultPrevented,
                        isTrusted: e.isTrusted
                    });
                }, true);
            });
        });
        
        // ページ読み込み
        await page.goto('http://localhost:8080');
        
        // ゲーム読み込み完了まで待機
        await page.waitForSelector('#start-game-btn', { visible: true });
        console.log('✅ メニュー画面表示確認');
        
        // ゲーム開始
        await page.click('#start-game-btn');
        await page.waitForSelector('#mobile-ui', { visible: true });
        console.log('✅ モバイルゲームUI表示確認');
        
        // レベルアップを発生させる
        console.log('🔧 レベルアップ発生');
        await page.evaluate(() => {
            window.game.player.exp = window.game.player.expToNext;
            window.game.levelUp();
        });
        
        // レベルアップモーダル表示確認
        await page.waitForSelector('#levelup-modal', { visible: true, timeout: 5000 });
        console.log('✅ レベルアップモーダル表示確認');
        
        // モーダルの正確な位置とサイズを取得
        const modalGeometry = await page.evaluate(() => {
            const modal = document.getElementById('levelup-modal');
            const options = document.querySelectorAll('.upgrade-option');
            
            return {
                modal: {
                    rect: modal.getBoundingClientRect(),
                    style: window.getComputedStyle(modal),
                    zIndex: window.getComputedStyle(modal).zIndex
                },
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                },
                options: Array.from(options).map((option, index) => {
                    const rect = option.getBoundingClientRect();
                    const style = window.getComputedStyle(option);
                    return {
                        index,
                        rect: {
                            x: rect.x,
                            y: rect.y,
                            width: rect.width,
                            height: rect.height,
                            top: rect.top,
                            left: rect.left,
                            right: rect.right,
                            bottom: rect.bottom
                        },
                        style: {
                            display: style.display,
                            position: style.position,
                            zIndex: style.zIndex,
                            pointerEvents: style.pointerEvents,
                            opacity: style.opacity,
                            visibility: style.visibility
                        },
                        offsetParent: option.offsetParent ? 'exists' : 'null',
                        content: option.textContent.substring(0, 50)
                    };
                })
            };
        });
        
        console.log('📊 モーダル幾何学情報:');
        console.log('  - Viewport:', modalGeometry.viewport);
        console.log('  - Modal rect:', modalGeometry.modal.rect);
        console.log('  - Modal z-index:', modalGeometry.modal.zIndex);
        
        modalGeometry.options.forEach((option, i) => {
            console.log(`  - 選択肢${i + 1}:`, {
                rect: option.rect,
                style: option.style,
                content: option.content.trim()
            });
        });
        
        // イベントログをクリア
        await page.evaluate(() => {
            window.touchEventLog = [];
            window.clickEventLog = [];
        });
        
        // 最初の選択肢の中央をタップ
        const firstOption = modalGeometry.options[0];
        if (firstOption.rect.width > 0 && firstOption.rect.height > 0) {
            const centerX = firstOption.rect.left + firstOption.rect.width / 2;
            const centerY = firstOption.rect.top + firstOption.rect.height / 2;
            
            console.log(`🖱️ 選択肢1をタップ: (${centerX}, ${centerY})`);
            
            await page.tap('.upgrade-option:first-child');
            
            // 少し待ってからイベントログを確認
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const eventLogs = await page.evaluate(() => ({
                touchEvents: window.touchEventLog,
                clickEvents: window.clickEventLog
            }));
            
            console.log('📋 タッチイベントログ:');
            eventLogs.touchEvents.forEach(event => {
                console.log(`  - ${event.type}: ${event.target}, touches: ${event.touches}, prevented: ${event.defaultPrevented}`);
            });
            
            console.log('📋 クリックイベントログ:');
            eventLogs.clickEvents.forEach(event => {
                console.log(`  - ${event.type}: ${event.target}, pos: (${event.clientX}, ${event.clientY}), prevented: ${event.defaultPrevented}`);
            });
            
            // モーダルの状態確認
            const modalState = await page.evaluate(() => {
                const modal = document.getElementById('levelup-modal');
                return {
                    hidden: modal.classList.contains('hidden'),
                    gameState: window.game.gameState,
                    isPaused: window.game.isPaused
                };
            });
            
            console.log('📊 タップ後の状態:', modalState);
            
            if (!modalState.hidden) {
                console.log('❌ タップでモーダルが閉じませんでした');
                
                // 直接クリックイベントを発生させてテスト
                console.log('🔧 直接クリックイベント発生テスト');
                await page.evaluate(() => {
                    const firstOption = document.querySelector('.upgrade-option');
                    if (firstOption) {
                        const clickEvent = new MouseEvent('click', {
                            bubbles: true,
                            cancelable: true,
                            view: window
                        });
                        firstOption.dispatchEvent(clickEvent);
                    }
                });
                
                await new Promise(resolve => setTimeout(resolve, 500));
                
                const afterClickState = await page.evaluate(() => {
                    const modal = document.getElementById('levelup-modal');
                    return modal.classList.contains('hidden');
                });
                
                if (afterClickState) {
                    console.log('✅ 直接クリックイベントで成功');
                } else {
                    console.log('❌ 直接クリックイベントでも失敗');
                }
            } else {
                console.log('✅ タップでモーダルが正常に閉じました');
            }
            
        } else {
            console.log('❌ 選択肢の有効な座標が取得できませんでした');
        }
        
    } catch (error) {
        console.error('❌ 分析中にエラーが発生:', error);
    } finally {
        await browser.close();
    }
}

analyzeIPhoneTouchEvents().catch(console.error);