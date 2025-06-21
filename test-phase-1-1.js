/**
 * Phase 1.1 基本動作確認テスト (Node.js環境)
 * ブラウザテスト前の基本的な動作確認
 */

// ES6 modules対応のため、globalを使用してテスト環境を模擬
global.console = console;
global.performance = { now: () => Date.now() };
global.Map = Map;
global.Date = Date;

// Tone.jsを模擬（Phase 1.1では実際のTone.jsは不要）
global.Tone = {
    context: { state: 'suspended' },
    start: () => Promise.resolve()
};

console.log('🔧 Phase 1.1 基本動作確認テスト開始...\n');

async function testPhase11() {
    try {
        // 1. 型定義・エラークラス読み込みテスト
        console.log('📋 1. 型定義・エラークラス読み込みテスト...');
        
        const { 
            AudioError, 
            AudioContextError, 
            ResourceError, 
            SynthError,
            AudioTypeValidator,
            AudioPerformanceTracker,
            AudioDebugLogger 
        } = await import('./public/js/systems/audio-types.js');
        
        console.log('   ✅ 型定義モジュール読み込み成功');
        
        // 2. エラークラステスト
        console.log('📋 2. エラークラス動作テスト...');
        
        const testError = new AudioError('Test message', 'TEST_CODE', { detail: 'test' });
        if (testError.name !== 'AudioError' || testError.code !== 'TEST_CODE') {
            throw new Error('AudioError creation failed');
        }
        
        const contextError = new AudioContextError('Context test');
        if (contextError.name !== 'AudioContextError') {
            throw new Error('AudioContextError creation failed');
        }
        
        console.log('   ✅ エラークラス動作確認成功');
        
        // 3. 型検証システムテスト
        console.log('📋 3. 型検証システムテスト...');
        
        // 有効なSynthType
        const validTypes = ['basic', 'plasma', 'nuke', 'superHoming'];
        for (const type of validTypes) {
            if (!AudioTypeValidator.isValidSynthType(type)) {
                throw new Error(`Valid type rejected: ${type}`);
            }
        }
        
        // 無効なSynthType
        const invalidTypes = ['invalid', null, 123, undefined];
        for (const type of invalidTypes) {
            if (AudioTypeValidator.isValidSynthType(type)) {
                throw new Error(`Invalid type accepted: ${type}`);
            }
        }
        
        // 有効なSynthConfig
        const validConfigs = [
            {},
            { volume: 0.5 },
            { volume: 1.0, maxVoices: 2 },
            { envelope: 'default' }
        ];
        
        for (const config of validConfigs) {
            if (!AudioTypeValidator.isValidSynthConfig(config)) {
                throw new Error(`Valid config rejected: ${JSON.stringify(config)}`);
            }
        }
        
        console.log('   ✅ 型検証システム動作確認成功');
        
        // 4. パフォーマンストラッカーテスト
        console.log('📋 4. パフォーマンストラッカーテスト...');
        
        const tracker = new AudioPerformanceTracker();
        tracker.startTimer('test-operation');
        
        // 少し待機
        await new Promise(resolve => setTimeout(resolve, 10));
        
        const duration = tracker.endTimer('test-operation');
        if (duration <= 0) {
            throw new Error('Performance tracking failed');
        }
        
        const metrics = tracker.getAllMetrics();
        if (!metrics['test-operation'] || metrics['test-operation'].count !== 1) {
            throw new Error('Metrics collection failed');
        }
        
        console.log('   ✅ パフォーマンストラッカー動作確認成功');
        
        // 5. デバッグロガーテスト
        console.log('📋 5. デバッグロガーテスト...');
        
        const logger = new AudioDebugLogger(true);
        logger.log('info', 'Test log message', { detail: 'test' });
        
        const history = logger.getHistory(10);
        if (history.length !== 1 || history[0].message !== 'Test log message') {
            throw new Error('Debug logger failed');
        }
        
        console.log('   ✅ デバッグロガー動作確認成功');
        
        // 6. AudioFoundationLayer読み込み・インスタンス作成テスト
        console.log('📋 6. AudioFoundationLayer読み込み・インスタンス作成テスト...');
        
        const { AudioFoundationLayer } = await import('./public/js/systems/audio-foundation-layer.js');
        
        if (typeof AudioFoundationLayer !== 'function') {
            throw new Error('AudioFoundationLayer is not a constructor');
        }
        
        const foundationLayer = new AudioFoundationLayer();
        
        if (!(foundationLayer instanceof AudioFoundationLayer)) {
            throw new Error('AudioFoundationLayer instantiation failed');
        }
        
        console.log('   ✅ AudioFoundationLayer読み込み・インスタンス作成成功');
        
        // 7. 初期状態確認
        console.log('📋 7. AudioFoundationLayer初期状態確認...');
        
        if (foundationLayer.isInitialized !== false) {
            throw new Error('Initial isInitialized should be false');
        }
        
        if (foundationLayer.isDisposed !== false) {
            throw new Error('Initial isDisposed should be false');
        }
        
        if (!(foundationLayer.synthPool instanceof Map)) {
            throw new Error('synthPool should be Map instance');
        }
        
        if (foundationLayer.synthPool.size !== 0) {
            throw new Error('Initial synthPool should be empty');
        }
        
        console.log('   ✅ 初期状態確認成功');
        
        // 8. デバッグ情報取得テスト
        console.log('📋 8. デバッグ情報取得テスト...');
        
        const debugInfo = foundationLayer.getDebugInfo();
        
        const requiredSections = ['system', 'context', 'resources', 'performance', 'statistics', 'config'];
        for (const section of requiredSections) {
            if (!(section in debugInfo)) {
                throw new Error(`Debug info missing section: ${section}`);
            }
        }
        
        if (debugInfo.system.isInitialized !== false) {
            throw new Error('Debug info system state incorrect');
        }
        
        if (debugInfo.resources.activeSynths !== 0) {
            throw new Error('Debug info resources state incorrect');
        }
        
        console.log('   ✅ デバッグ情報取得成功');
        
        // 9. 予定メソッドpending状態確認
        console.log('📋 9. 予定メソッド pending状態確認...');
        
        const pendingMethods = [
            'initializeContext',
            'resumeContext',
            'suspendContext',
            'createSynth',
            'disposeSynth'
        ];
        
        for (const method of pendingMethods) {
            try {
                await foundationLayer[method]();
                throw new Error(`Method ${method} should throw 'implementation pending' error`);
            } catch (error) {
                if (!error.message.includes('implementation pending')) {
                    throw new Error(`Method ${method} should throw 'implementation pending' error, got: ${error.message}`);
                }
            }
        }
        
        console.log('   ✅ 予定メソッド pending状態確認成功');
        
        // 10. リソース統計取得テスト
        console.log('📋 10. リソース統計取得テスト...');
        
        const resourceStats = foundationLayer.getResourceStats();
        
        const requiredStats = ['synthCount', 'maxSynths', 'activeSounds', 'memoryUsage', 'cpuUsage'];
        for (const stat of requiredStats) {
            if (!(stat in resourceStats)) {
                throw new Error(`Resource stats missing: ${stat}`);
            }
        }
        
        if (resourceStats.synthCount !== 0) {
            throw new Error('Initial synth count should be 0');
        }
        
        console.log('   ✅ リソース統計取得成功');
        
        console.log('\n🎉 Phase 1.1 基本動作確認テスト完全成功！');
        console.log('📊 テスト結果サマリー:');
        console.log('   - 型定義・エラークラス: ✅ 正常');
        console.log('   - エラーシステム: ✅ 正常');
        console.log('   - 型検証システム: ✅ 正常');
        console.log('   - パフォーマンストラッカー: ✅ 正常');
        console.log('   - デバッグロガー: ✅ 正常');
        console.log('   - AudioFoundationLayerクラス: ✅ 正常');
        console.log('   - 初期状態: ✅ 正常');
        console.log('   - デバッグ情報: ✅ 正常');
        console.log('   - 予定メソッド状態: ✅ 正常');
        console.log('   - リソース統計: ✅ 正常');
        
        console.log('\n✅ Phase 1.1 実装完了 - Phase 1.2 への準備完了');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Phase 1.1 テスト失敗:', error.message);
        console.error('スタックトレース:', error.stack);
        return false;
    }
}

// テスト実行
testPhase11().then(success => {
    if (success) {
        console.log('\n🚀 Phase 1.1 検証完了 - 次フェーズへ進行可能');
        process.exit(0);
    } else {
        console.log('\n🚨 Phase 1.1 に問題があります - 修正が必要');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 テスト実行中に予期しないエラー:', error);
    process.exit(1);
});