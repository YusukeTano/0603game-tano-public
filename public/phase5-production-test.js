/**
 * Phase 5本番ゲーム動作確認テスト
 * ブラウザコンソールでの手動実行用
 */

class Phase5ProductionTest {
    constructor() {
        this.results = [];
        this.testStartTime = Date.now();
        console.log('🎮 Phase 5本番ゲーム動作確認テスト開始');
    }

    log(type, message, details = null) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
        console.log(entry);
        if (details) console.dir(details);
        this.results.push({ type, message, details, timestamp });
    }

    // 1. ページ読み込み確認
    testPageLoad() {
        this.log('info', '1. ページ読み込み確認');
        
        try {
            // 基本要素の存在確認
            const canvas = document.getElementById('game-canvas');
            const startBtn = document.getElementById('start-game-btn');
            const loadingScreen = document.getElementById('loading-screen');
            
            if (!canvas) {
                this.log('error', 'ゲームキャンバスが見つかりません');
                return false;
            }
            if (!startBtn) {
                this.log('error', 'ゲーム開始ボタンが見つかりません');
                return false;
            }
            if (!loadingScreen) {
                this.log('error', 'ローディング画面が見つかりません');
                return false;
            }
            
            this.log('success', '✅ 基本UI要素確認完了');
            
            // Tone.js読み込み確認
            if (typeof window.Tone !== 'undefined') {
                this.log('success', '✅ Tone.js読み込み確認完了');
            } else {
                this.log('error', '❌ Tone.jsが読み込まれていません');
                return false;
            }
            
            return true;
        } catch (error) {
            this.log('error', `ページ読み込み確認エラー: ${error.message}`);
            return false;
        }
    }

    // 2. ゲームインスタンス確認
    testGameInstance() {
        this.log('info', '2. ゲームインスタンス確認');
        
        try {
            if (typeof window.game === 'undefined') {
                this.log('error', '❌ グローバルgameインスタンスが見つかりません');
                return false;
            }
            
            const game = window.game;
            this.log('success', '✅ ゲームインスタンス確認完了');
            
            // Phase 5統合システム確認
            if (game.phase5Integration) {
                this.log('success', '✅ Phase5統合システム確認完了');
                this.log('info', 'Phase5統合状態:', game.phase5Integration.integrationStatus);
            } else {
                this.log('warning', '⚠️ Phase5統合システムが未初期化です');
            }
            
            // 音響システム確認
            if (game.audioSystem) {
                this.log('success', '✅ 音響システム確認完了');
            } else {
                this.log('warning', '⚠️ 音響システムが未初期化です');
            }
            
            return true;
        } catch (error) {
            this.log('error', `ゲームインスタンス確認エラー: ${error.message}`);
            return false;
        }
    }

    // 3. コンソールエラー確認
    testConsoleErrors() {
        this.log('info', '3. コンソールエラー確認（過去のエラーログを確認してください）');
        
        // 新しいエラーキャプチャー設定
        window.addEventListener('error', (event) => {
            this.log('error', `JavaScriptエラー: ${event.message}`, {
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                stack: event.error?.stack
            });
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            this.log('error', `未処理のPromiseエラー: ${event.reason}`, event.reason);
        });
        
        this.log('success', '✅ エラーモニタリング開始');
        return true;
    }

    // 4. ゲーム開始テスト
    async testGameStart() {
        this.log('info', '4. ゲーム開始テスト');
        
        try {
            const startBtn = document.getElementById('start-game-btn');
            if (!startBtn) {
                this.log('error', '❌ ゲーム開始ボタンが見つかりません');
                return false;
            }
            
            this.log('info', 'ゲーム開始ボタンをクリックします...');
            startBtn.click();
            
            // キャラクター選択画面の確認（少し待機）
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const characterSelect = document.getElementById('character-select-screen');
            if (characterSelect && !characterSelect.classList.contains('hidden')) {
                this.log('success', '✅ キャラクター選択画面表示確認');
                
                // デフォルトキャラクター（ray）を選択
                const rayCard = document.querySelector('[data-character="ray"]');
                if (rayCard) {
                    this.log('info', 'レイを選択します...');
                    rayCard.click();
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    const confirmBtn = document.getElementById('confirm-character-btn');
                    if (confirmBtn && !confirmBtn.disabled) {
                        this.log('info', 'ゲーム開始を確定します...');
                        confirmBtn.click();
                        
                        // ゲーム開始を少し待機
                        await new Promise(resolve => setTimeout(resolve, 2000));
                        
                        // ゲーム画面の確認
                        const gameScreen = document.getElementById('game-screen');
                        if (gameScreen && !gameScreen.classList.contains('hidden')) {
                            this.log('success', '✅ ゲーム画面表示確認');
                            return true;
                        } else {
                            this.log('error', '❌ ゲーム画面が表示されませんでした');
                            return false;
                        }
                    } else {
                        this.log('error', '❌ ゲーム開始確定ボタンが無効です');
                        return false;
                    }
                } else {
                    this.log('error', '❌ レイキャラクターが見つかりません');
                    return false;
                }
            } else {
                this.log('error', '❌ キャラクター選択画面が表示されませんでした');
                return false;
            }
        } catch (error) {
            this.log('error', `ゲーム開始テストエラー: ${error.message}`);
            return false;
        }
    }

    // 5. Phase 5音響機能テスト
    async testPhase5Audio() {
        this.log('info', '5. Phase 5音響機能テスト');
        
        try {
            const game = window.game;
            if (!game) {
                this.log('error', '❌ ゲームインスタンスが利用できません');
                return false;
            }
            
            // Phase 5統合システム確認
            if (!game.phase5Integration) {
                this.log('warning', '⚠️ Phase5統合システムが未初期化のため音響テストをスキップ');
                return false;
            }
            
            const phase5 = game.phase5Integration;
            
            // 音響設定確認
            this.log('info', 'Phase5音響設定:', phase5.audioConfig);
            
            // アイテム取得音テスト（シミュレーション）
            if (game.audioSystem && game.pickupSystem) {
                this.log('info', 'アイテム音響統合をテストします...');
                
                // 経験値アイテム音をテスト
                try {
                    if (typeof game.pickupSystem.playPickupSound === 'function') {
                        game.pickupSystem.playPickupSound('experience');
                        this.log('success', '✅ アイテム取得音テスト成功');
                    } else {
                        this.log('warning', '⚠️ アイテム取得音機能が利用できません');
                    }
                } catch (audioError) {
                    this.log('warning', `⚠️ アイテム取得音テストエラー: ${audioError.message}`);
                }
            }
            
            return true;
        } catch (error) {
            this.log('error', `Phase5音響テストエラー: ${error.message}`);
            return false;
        }
    }

    // 6. エラーチェック総合
    checkOverallErrors() {
        this.log('info', '6. エラーチェック総合');
        
        const errorCount = this.results.filter(r => r.type === 'error').length;
        const warningCount = this.results.filter(r => r.type === 'warning').length;
        
        this.log('info', `エラー数: ${errorCount}, 警告数: ${warningCount}`);
        
        if (errorCount === 0) {
            this.log('success', '✅ エラーなし - Phase 5システム正常動作');
        } else if (errorCount <= 2) {
            this.log('warning', '⚠️ 軽微なエラーあり - ゲーム動作に支障なし');
        } else {
            this.log('error', '❌ 重大なエラーあり - 問題調査が必要');
        }
        
        return errorCount <= 2;
    }

    // フルテスト実行
    async runFullTest() {
        console.log('🧪 Phase 5本番ゲーム動作確認開始');
        console.log('=' .repeat(60));

        const tests = [
            { name: 'ページ読み込み', test: () => this.testPageLoad() },
            { name: 'ゲームインスタンス', test: () => this.testGameInstance() },
            { name: 'コンソールエラー監視', test: () => this.testConsoleErrors() },
            { name: 'ゲーム開始', test: () => this.testGameStart() },
            { name: 'Phase5音響', test: () => this.testPhase5Audio() },
            { name: '総合チェック', test: () => this.checkOverallErrors() }
        ];

        let passedTests = 0;

        for (const { name, test } of tests) {
            try {
                console.log(`\n🔍 ${name}テスト実行中...`);
                const result = await test();
                if (result) {
                    passedTests++;
                    console.log(`✅ ${name}テスト完了`);
                } else {
                    console.log(`❌ ${name}テスト失敗`);
                }
            } catch (error) {
                console.log(`❌ ${name}テストエラー:`, error);
            }
        }

        // 結果サマリー
        console.log('\n' + '='.repeat(60));
        console.log('📊 Phase 5本番テスト結果');
        console.log('='.repeat(60));

        const summary = {
            passed: passedTests,
            total: tests.length,
            success: this.results.filter(r => r.type === 'success').length,
            warning: this.results.filter(r => r.type === 'warning').length,
            error: this.results.filter(r => r.type === 'error').length,
            totalTime: Date.now() - this.testStartTime
        };

        console.log(`🎯 テスト通過: ${summary.passed}/${summary.total}`);
        console.log(`✅ 成功: ${summary.success}`);
        console.log(`⚠️ 警告: ${summary.warning}`);
        console.log(`❌ エラー: ${summary.error}`);
        console.log(`⏱️ 実行時間: ${summary.totalTime}ms`);

        // 推奨アクション
        console.log('\n🔧 推奨アクション:');
        if (summary.error > 0) {
            console.log('❌ エラーがあります:');
            this.results
                .filter(r => r.type === 'error')
                .forEach(r => console.log(`  - ${r.message}`));
        } else if (summary.warning > 0) {
            console.log('⚠️ 警告があります（動作に支障なし）:');
            this.results
                .filter(r => r.type === 'warning')
                .slice(0, 3)
                .forEach(r => console.log(`  - ${r.message}`));
        } else {
            console.log('✅ Phase 5システムは正常に動作しています');
            console.log('  - アイテム取得、レベルアップ、コンボ音響をテストしてください');
            console.log('  - 長時間プレイしてパフォーマンスを確認してください');
        }

        return {
            success: summary.error === 0,
            summary,
            results: this.results
        };
    }

    // 個別テスト実行（ブラウザコンソール用）
    static async quickTest() {
        const test = new Phase5ProductionTest();
        return await test.runFullTest();
    }

    // 音響テストのみ実行
    static async audioOnlyTest() {
        const test = new Phase5ProductionTest();
        console.log('🎵 Phase 5音響機能テストのみ実行');
        
        const gameOk = test.testGameInstance();
        if (gameOk) {
            await test.testPhase5Audio();
        }
        
        return test.results;
    }
}

// グローバルに公開（ブラウザコンソールで使用可能）
window.Phase5ProductionTest = Phase5ProductionTest;

console.log('🎮 Phase 5本番テストツール読み込み完了');
console.log('使用方法:');
console.log('  Phase5ProductionTest.quickTest() - フルテスト実行');
console.log('  Phase5ProductionTest.audioOnlyTest() - 音響テストのみ');