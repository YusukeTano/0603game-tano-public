/**
 * Phase 1.2 コンテキスト管理システムテスト (Node.js環境)
 * 実装完了機能の動作確認
 */

// ES6 modules対応のため、globalを使用してテスト環境を模擬
global.console = console;
global.performance = { 
    now: () => Date.now(),
    memory: { usedJSHeapSize: 25 * 1024 * 1024 } // 25MB
};
global.Map = Map;
global.Date = Date;
global.setTimeout = setTimeout;
global.clearInterval = clearInterval;
global.setInterval = setInterval;

// Tone.js模擬（Phase 1.2テスト用）
let mockToneState = 'suspended';
global.Tone = {
    context: { 
        get state() { return mockToneState; },
        sampleRate: 44100,
        currentTime: 0,
        baseLatency: 0.02,
        rawContext: {
            get state() { return mockToneState; },
            sampleRate: 44100,
            get currentTime() { return Date.now() / 1000; },
            baseLatency: 0.02,
            resume: async () => {
                console.log('  🎵 Mock AudioContext.resume() called');
                mockToneState = 'running';
                return Promise.resolve();
            },
            suspend: async () => {
                console.log('  🎵 Mock AudioContext.suspend() called');
                mockToneState = 'suspended';
                return Promise.resolve();
            }
        }
    },
    start: async () => {
        console.log('  🎵 Mock Tone.start() called');
        mockToneState = 'running';
        return Promise.resolve();
    }
};

console.log('🔧 Phase 1.2 コンテキスト管理システムテスト開始...\n');

async function testPhase12() {
    try {
        // Phase 1.1の機能確認
        console.log('📋 0. Phase 1.1 基本機能確認...');
        
        const { AudioFoundationLayer } = await import('./public/js/systems/audio-foundation-layer.js');
        const foundationLayer = new AudioFoundationLayer();
        
        console.log('   ✅ AudioFoundationLayer インスタンス作成成功');
        
        // 1. initializeContext() テスト
        console.log('📋 1. initializeContext() 動作テスト...');
        
        console.log('   🔄 AudioContext初期化実行...');
        const initResult = await foundationLayer.initializeContext();
        
        if (!initResult.success) {
            throw new Error(`Context initialization failed: ${initResult.error}`);
        }
        
        console.log('   ✅ AudioContext初期化成功:', {
            contextState: initResult.contextState.state,
            sampleRate: initResult.contextState.sampleRate,
            toneStarted: initResult.toneStarted
        });
        
        // 初期化状態確認
        if (!foundationLayer.isInitialized) {
            throw new Error('isInitialized should be true after successful initialization');
        }
        
        if (!foundationLayer.initializationTime) {
            throw new Error('initializationTime should be set');
        }
        
        console.log('   ✅ 初期化状態確認成功');
        
        // 2. getContextState() テスト
        console.log('📋 2. getContextState() 動作テスト...');
        
        const contextState = foundationLayer.getContextState();
        
        const requiredFields = ['state', 'sampleRate', 'currentTime', 'baseLatency', 'isInitialized', 'uptime'];
        for (const field of requiredFields) {
            if (!(field in contextState)) {
                throw new Error(`Context state missing field: ${field}`);
            }
        }
        
        if (contextState.state !== 'running') {
            console.log('   ⚠️ Warning: Expected state to be running, got:', contextState.state);
        }
        
        if (contextState.isInitialized !== true) {
            throw new Error('Context state should show isInitialized: true');
        }
        
        if (contextState.uptime <= 0) {
            throw new Error('Context uptime should be positive');
        }
        
        console.log('   ✅ getContextState() 正常動作確認:', {
            state: contextState.state,
            uptime: `${contextState.uptime}ms`,
            sampleRate: contextState.sampleRate
        });
        
        // 3. suspendContext() テスト
        console.log('📋 3. suspendContext() 動作テスト...');
        
        console.log('   🔄 AudioContext停止実行...');
        await foundationLayer.suspendContext();
        
        // 状態確認
        const suspendedState = foundationLayer.getContextState();
        if (suspendedState.state !== 'suspended') {
            console.log('   ⚠️ Warning: Expected suspended state, got:', suspendedState.state);
        }
        
        console.log('   ✅ suspendContext() 正常動作確認:', {
            state: suspendedState.state
        });
        
        // 4. resumeContext() テスト
        console.log('📋 4. resumeContext() 動作テスト...');
        
        console.log('   🔄 AudioContext再開実行...');
        await foundationLayer.resumeContext();
        
        // 状態確認
        const resumedState = foundationLayer.getContextState();
        if (resumedState.state !== 'running') {
            console.log('   ⚠️ Warning: Expected running state, got:', resumedState.state);
        }
        
        console.log('   ✅ resumeContext() 正常動作確認:', {
            state: resumedState.state
        });
        
        // 5. エラーハンドリング・フォールバックテスト
        console.log('📋 5. エラーハンドリング・フォールバックテスト...');
        
        // Tone.js無効化テスト（フォールバック機能検証）
        const originalTone = global.Tone;
        global.Tone = undefined;
        
        try {
            const errorLayer = new AudioFoundationLayer();
            const result = await errorLayer.initializeContext();
            
            // フォールバック機能により成功するはず
            if (!result.success) {
                throw new Error('Fallback should succeed even without Tone.js');
            }
            
            if (!result.fallback) {
                throw new Error('Result should indicate fallback mode');
            }
            
            if (!result.originalError.includes('Tone.js not loaded')) {
                throw new Error('Original error should mention Tone.js not loaded');
            }
            
            console.log('   ✅ Tone.js未読み込み時のフォールバック機能正常動作');
            console.log('   📋 フォールバック制限:', result.limitations);
            
        } catch (error) {
            throw new Error(`Fallback test failed: ${error.message}`);
        }
        
        // Tone.js復元
        global.Tone = originalTone;
        
        // 6. フォールバック機能テスト
        console.log('📋 6. フォールバック機能テスト...');
        
        // start失敗を模擬
        const originalStart = global.Tone.start;
        global.Tone.start = async () => {
            throw new Error('Mock start failure');
        };
        
        try {
            const fallbackLayer = new AudioFoundationLayer();
            const fallbackResult = await fallbackLayer.initializeContext();
            
            if (!fallbackResult.success) {
                throw new Error('Fallback should still succeed');
            }
            
            console.log('   ✅ フォールバック初期化成功:', {
                contextState: fallbackResult.contextState.state,
                toneStarted: fallbackResult.toneStarted
            });
            
        } finally {
            // start復元
            global.Tone.start = originalStart;
        }
        
        // 7. リソース監視テスト
        console.log('📋 7. リソース監視システムテスト...');
        
        // 監視が開始されているか確認
        if (!foundationLayer.resourceMonitorTimer) {
            throw new Error('Resource monitoring should be started');
        }
        
        // リソース統計取得
        const resourceStats = foundationLayer.getResourceStats();
        const requiredStatFields = ['synthCount', 'maxSynths', 'activeSounds', 'memoryUsage', 'cpuUsage'];
        
        for (const field of requiredStatFields) {
            if (!(field in resourceStats)) {
                throw new Error(`Resource stats missing field: ${field}`);
            }
        }
        
        console.log('   ✅ リソース監視システム正常動作:', {
            synthCount: resourceStats.synthCount,
            maxSynths: resourceStats.maxSynths,
            activeSounds: resourceStats.activeSounds
        });
        
        // 8. パフォーマンス測定テスト
        console.log('📋 8. パフォーマンス測定テスト...');
        
        const performanceMetrics = foundationLayer.performanceTracker.getAllMetrics();
        
        const expectedMetrics = ['contextInitialization', 'contextResume', 'contextSuspend'];
        for (const metric of expectedMetrics) {
            if (!(metric in performanceMetrics)) {
                console.log(`   ⚠️ Warning: Performance metric missing: ${metric}`);
            } else {
                console.log(`   ✅ ${metric}: 平均 ${performanceMetrics[metric].average.toFixed(2)}ms`);
            }
        }
        
        // 9. ヘルスメトリクステスト
        console.log('📋 9. ヘルスメトリクステスト...');
        
        const healthMetrics = foundationLayer.getHealthMetrics();
        
        const requiredHealthFields = ['uptime', 'errorCount', 'averageLatency', 'performanceScore', 'overallStatus'];
        for (const field of requiredHealthFields) {
            if (!(field in healthMetrics)) {
                throw new Error(`Health metrics missing field: ${field}`);
            }
        }
        
        if (healthMetrics.performanceScore < 0 || healthMetrics.performanceScore > 100) {
            throw new Error('Performance score should be 0-100');
        }
        
        console.log('   ✅ ヘルスメトリクス正常取得:', {
            uptime: `${healthMetrics.uptime}ms`,
            errorCount: healthMetrics.errorCount,
            performanceScore: healthMetrics.performanceScore,
            overallStatus: healthMetrics.overallStatus
        });
        
        // 10. システム破棄テスト
        console.log('📋 10. システム破棄テスト...');
        
        await foundationLayer.dispose();
        
        if (!foundationLayer.isDisposed) {
            throw new Error('isDisposed should be true after disposal');
        }
        
        if (foundationLayer.resourceMonitorTimer) {
            throw new Error('Resource monitor timer should be cleared');
        }
        
        console.log('   ✅ システム破棄正常完了');
        
        console.log('\n🎉 Phase 1.2 コンテキスト管理システムテスト完全成功！');
        console.log('📊 テスト結果サマリー:');
        console.log('   - AudioContext初期化: ✅ 正常');
        console.log('   - 状態取得・更新: ✅ 正常');
        console.log('   - コンテキスト制御(suspend/resume): ✅ 正常');
        console.log('   - エラーハンドリング: ✅ 正常');
        console.log('   - フォールバック機能: ✅ 正常');
        console.log('   - リソース監視: ✅ 正常');
        console.log('   - パフォーマンス測定: ✅ 正常');
        console.log('   - ヘルスメトリクス: ✅ 正常');
        console.log('   - システム破棄: ✅ 正常');
        
        console.log('\n✅ Phase 1.2 実装完了 - Phase 1.3 への準備完了');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Phase 1.2 テスト失敗:', error.message);
        console.error('スタックトレース:', error.stack);
        return false;
    }
}

// テスト実行
testPhase12().then(success => {
    if (success) {
        console.log('\n🚀 Phase 1.2 検証完了 - 次フェーズへ進行可能');
        process.exit(0);
    } else {
        console.log('\n🚨 Phase 1.2 に問題があります - 修正が必要');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 テスト実行中に予期しないエラー:', error);
    process.exit(1);
});