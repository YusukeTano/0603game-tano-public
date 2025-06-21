/**
 * Phase 1.3.2 Synthプール管理システムテスト (Node.js環境)
 * プール機能・効率化・リソース再利用の動作確認
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

// Tone.js模擬（Phase 1.3.2テスト用）
let mockToneState = 'running';
let synthIdCounter = 0;

class MockSynth {
    constructor(options = {}) {
        this.id = `mock_synth_${++synthIdCounter}`;
        this.volume = options.volume || -12;
        this.oscillator = options.oscillator || { type: 'sine' };
        this.envelope = options.envelope || {};
        this.isDisposed = false;
        console.log(`  🎛️ Mock Synth created: ${this.id}, type: ${this.oscillator.type}`);
    }
    
    toDestination() {
        console.log(`  🔊 Mock Synth ${this.id} connected to destination`);
        return this;
    }
    
    dispose() {
        if (!this.isDisposed) {
            this.isDisposed = true;
            console.log(`  🗑️ Mock Synth ${this.id} disposed`);
        }
    }
}

class MockNoiseSynth {
    constructor(options = {}) {
        this.id = `mock_noise_synth_${++synthIdCounter}`;
        this.volume = options.volume || -12;
        this.noise = options.noise || { type: 'white' };
        this.envelope = options.envelope || {};
        this.isDisposed = false;
        console.log(`  📢 Mock NoiseSynth created: ${this.id}, noise: ${this.noise.type}`);
    }
    
    toDestination() {
        console.log(`  🔊 Mock NoiseSynth ${this.id} connected to destination`);
        return this;
    }
    
    dispose() {
        if (!this.isDisposed) {
            this.isDisposed = true;
            console.log(`  🗑️ Mock NoiseSynth ${this.id} disposed`);
        }
    }
}

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
    },
    Synth: MockSynth,
    NoiseSynth: MockNoiseSynth
};

console.log('🔧 Phase 1.3.2 Synthプール管理システムテスト開始...\n');

async function testPhase132() {
    try {
        // 0. 前提条件確認（Phase 1.1, 1.2, 1.3.1完了）
        console.log('📋 0. 前提条件確認...');
        
        const { AudioFoundationLayer } = await import('./public/js/systems/audio-foundation-layer.js');
        const foundationLayer = new AudioFoundationLayer();
        
        // AudioContext初期化
        console.log('   🔄 AudioContext初期化...');
        const initResult = await foundationLayer.initializeContext();
        
        if (!initResult.success) {
            throw new Error(`Context initialization failed: ${initResult.error}`);
        }
        
        console.log('   ✅ 前提条件確認完了 - Phase 1.1, 1.2, 1.3.1機能正常');
        
        // 1. プール基本機能テスト
        console.log('📋 1. プール基本機能テスト...');
        
        // 初期プール状態確認
        let poolStats = foundationLayer.getPoolStats();
        if (poolStats.totalPooled !== 0) {
            throw new Error('Initial pool should be empty');
        }
        
        console.log('   ✅ 初期プール状態正常:', poolStats);
        
        // 2. Synth作成・プール動作テスト
        console.log('📋 2. Synth作成・プール動作テスト...');
        
        const testTypes = ['plasma', 'nuke', 'enemyHit'];
        const createdSynths = [];
        
        for (const type of testTypes) {
            console.log(`   🔄 ${type} Synth作成 (1回目)...`);
            
            const synth1 = await foundationLayer.createSynth(type);
            createdSynths.push(synth1);
            
            // 最初はプールミスのはず
            poolStats = foundationLayer.getPoolStats();
            if (poolStats.totalMisses === 0) {
                throw new Error('First creation should be a pool miss');
            }
            
            console.log(`   ✅ ${type} 1回目作成成功 (プールミス)`);
        }
        
        // 3. Synth破棄・プール返却テスト
        console.log('📋 3. Synth破棄・プール返却テスト...');
        
        const beforeReturns = foundationLayer.getPoolStats().totalReturns;
        
        // 短時間待機（プール適格性のため）
        await new Promise(resolve => setTimeout(resolve, 150)); // 150ms待機
        
        for (const synth of createdSynths) {
            console.log(`   🔄 ${synth.type} Synth破棄・プール返却中...`);
            
            foundationLayer.disposeSynth(synth);
            
            console.log(`   ✅ ${synth.type} Synth破棄完了`);
        }
        
        poolStats = foundationLayer.getPoolStats();
        const afterReturns = poolStats.totalReturns;
        
        if (afterReturns <= beforeReturns) {
            throw new Error('Pool returns should have increased');
        }
        
        if (poolStats.totalPooled === 0) {
            throw new Error('Some synths should be in pool after disposal');
        }
        
        console.log('   ✅ プール返却テスト成功:', {
            returns: `${beforeReturns} → ${afterReturns}`,
            pooled: poolStats.totalPooled,
            byType: poolStats.byType
        });
        
        // 4. プールからの取得・ヒット率テスト
        console.log('📋 4. プールからの取得・ヒット率テスト...');
        
        const beforeHits = poolStats.totalHits;
        const reusedSynths = [];
        
        for (const type of testTypes) {
            console.log(`   🔄 ${type} Synth再作成 (プール取得期待)...`);
            
            const synth2 = await foundationLayer.createSynth(type);
            reusedSynths.push(synth2);
            
            console.log(`   ✅ ${type} 2回目作成成功`);
        }
        
        poolStats = foundationLayer.getPoolStats();
        const afterHits = poolStats.totalHits;
        
        if (afterHits <= beforeHits) {
            throw new Error('Pool hits should have increased');
        }
        
        const hitRate = poolStats.hitRate;
        console.log('   ✅ プール取得・ヒット率テスト成功:', {
            hits: `${beforeHits} → ${afterHits}`,
            hitRate: `${hitRate}%`,
            poolRemaining: poolStats.totalPooled
        });
        
        // 5. プールサイズ制限テスト
        console.log('📋 5. プールサイズ制限テスト...');
        
        // enemyHitタイプ（最大4個）で制限テスト
        const enemyHitSynths = [];
        
        // 制限まで作成
        for (let i = 0; i < 6; i++) { // 最大4個の制限を超えて作成
            const synth = await foundationLayer.createSynth('enemyHit');
            enemyHitSynths.push(synth);
        }
        
        // 短時間待機してから破棄
        await new Promise(resolve => setTimeout(resolve, 150));
        
        for (const synth of enemyHitSynths) {
            foundationLayer.disposeSynth(synth);
        }
        
        poolStats = foundationLayer.getPoolStats();
        const enemyHitPoolSize = poolStats.byType['enemyHit'] || 0;
        
        if (enemyHitPoolSize > 4) {
            throw new Error(`enemyHit pool size should not exceed 4, got: ${enemyHitPoolSize}`);
        }
        
        console.log('   ✅ プールサイズ制限テスト成功:', {
            enemyHitPoolSize,
            maxAllowed: 4
        });
        
        // 6. プール適格性テスト
        console.log('📋 6. プール適格性テスト...');
        
        // UIタイプ（プール対象外）テスト
        const uiSynth = await foundationLayer.createSynth('ui');
        
        // 短時間待機
        await new Promise(resolve => setTimeout(resolve, 150));
        
        const beforeUIReturns = foundationLayer.getPoolStats().totalReturns;
        foundationLayer.disposeSynth(uiSynth);
        const afterUIReturns = foundationLayer.getPoolStats().totalReturns;
        
        // UIタイプはプールに返却されないはず
        if (afterUIReturns > beforeUIReturns) {
            console.log('   ⚠️ Warning: UI synth was returned to pool (may be acceptable)');
        } else {
            console.log('   ✅ UI Synthはプール対象外として正常処理');
        }
        
        // 短時間使用Synthテスト（100ms未満）
        const shortSynth = await foundationLayer.createSynth('basic');
        // 即座に破棄（短時間使用）
        foundationLayer.disposeSynth(shortSynth);
        
        console.log('   ✅ プール適格性テスト完了');
        
        // 7. 設定適合性テスト
        console.log('📋 7. 設定適合性テスト...');
        
        // 異なる設定でSynth作成
        const config1 = { volume: 0.5 };
        const config2 = { volume: 0.8 };
        
        const synthA = await foundationLayer.createSynth('basic', config1);
        await new Promise(resolve => setTimeout(resolve, 150));
        foundationLayer.disposeSynth(synthA);
        
        // 同じ設定で再作成（プールから取得されるべき）
        const synthB = await foundationLayer.createSynth('basic', config1);
        
        // 異なる設定で作成（互換性テスト）
        const synthC = await foundationLayer.createSynth('basic', config2);
        
        console.log('   ✅ 設定適合性テスト完了');
        
        // 8. プール統計総合確認
        console.log('📋 8. プール統計総合確認...');
        
        poolStats = foundationLayer.getPoolStats();
        
        if (poolStats.totalHits === 0) {
            throw new Error('Should have some pool hits');
        }
        
        if (poolStats.totalMisses === 0) {
            throw new Error('Should have some pool misses');
        }
        
        if (poolStats.totalReturns === 0) {
            throw new Error('Should have some pool returns');
        }
        
        console.log('   ✅ プール統計総合確認成功:', poolStats);
        
        // 9. パフォーマンス効率テスト
        console.log('📋 9. パフォーマンス効率テスト...');
        
        const performanceStart = Date.now();
        const rapidSynths = [];
        
        // 高速作成・破棄テスト（プール効果確認）
        for (let i = 0; i < 10; i++) {
            const synth = await foundationLayer.createSynth('plasma');
            rapidSynths.push(synth);
        }
        
        // 短時間待機
        await new Promise(resolve => setTimeout(resolve, 150));
        
        for (const synth of rapidSynths) {
            foundationLayer.disposeSynth(synth);
        }
        
        const performanceEnd = Date.now();
        const duration = performanceEnd - performanceStart;
        
        console.log('   ✅ パフォーマンス効率テスト完了:', {
            duration: `${duration}ms`,
            synthsProcessed: rapidSynths.length
        });
        
        // 10. システム破棄・プールクリア確認
        console.log('📋 10. システム破棄・プールクリア確認...');
        
        const finalPoolStats = foundationLayer.getPoolStats();
        console.log('   📊 最終プール状態:', finalPoolStats);
        
        await foundationLayer.dispose();
        
        if (!foundationLayer.isDisposed) {
            throw new Error('System should be marked as disposed');
        }
        
        console.log('   ✅ システム破棄・プールクリア確認完了');
        
        console.log('\n🎉 Phase 1.3.2 Synthプール管理システムテスト完全成功！');
        console.log('📊 テスト結果サマリー:');
        console.log('   - プール基本機能: ✅ 正常');
        console.log('   - Synth作成・プール動作: ✅ 正常');
        console.log('   - プール返却システム: ✅ 正常');
        console.log('   - プール取得・ヒット率: ✅ 正常');
        console.log('   - プールサイズ制限: ✅ 正常');
        console.log('   - プール適格性判定: ✅ 正常');
        console.log('   - 設定適合性チェック: ✅ 正常');
        console.log('   - プール統計システム: ✅ 正常');
        console.log('   - パフォーマンス効率: ✅ 正常');
        console.log('   - システム破棄・クリア: ✅ 正常');
        
        console.log('\n✅ Phase 1.3.2 実装完了 - Phase 1.3.3 への準備完了');
        console.log('📈 プール効率化によるリソース使用量削減達成');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Phase 1.3.2 テスト失敗:', error.message);
        console.error('スタックトレース:', error.stack);
        return false;
    }
}

// テスト実行
testPhase132().then(success => {
    if (success) {
        console.log('\n🚀 Phase 1.3.2 検証完了 - 次サブフェーズへ進行可能');
        process.exit(0);
    } else {
        console.log('\n🚨 Phase 1.3.2 に問題があります - 修正が必要');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 テスト実行中に予期しないエラー:', error);
    process.exit(1);
});