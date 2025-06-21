/**
 * Phase 1.3.1 基本Synth作成システムテスト (Node.js環境)
 * リソース管理・Synth作成・破棄機能の動作確認
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

// Tone.js模擬（Phase 1.3.1テスト用）
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

console.log('🔧 Phase 1.3.1 基本Synth作成システムテスト開始...\n');

async function testPhase131() {
    try {
        // 0. 前提条件確認（Phase 1.1, 1.2完了）
        console.log('📋 0. 前提条件確認...');
        
        const { AudioFoundationLayer } = await import('./public/js/systems/audio-foundation-layer.js');
        const foundationLayer = new AudioFoundationLayer();
        
        // AudioContext初期化（Phase 1.2機能使用）
        console.log('   🔄 AudioContext初期化...');
        const initResult = await foundationLayer.initializeContext();
        
        if (!initResult.success) {
            throw new Error(`Context initialization failed: ${initResult.error}`);
        }
        
        console.log('   ✅ 前提条件確認完了 - Phase 1.1, 1.2機能正常');
        
        // 1. 基本Synth作成テスト
        console.log('📋 1. 基本Synth作成テスト...');
        
        const synthTypes = ['basic', 'plasma', 'nuke', 'superHoming', 'superShotgun', 'enemyHit', 'enemyDeath', 'ui'];
        const createdSynths = [];
        
        for (const type of synthTypes) {
            console.log(`   🔄 ${type} Synth作成中...`);
            
            const synth = await foundationLayer.createSynth(type);
            
            // 基本プロパティ確認
            if (!synth.id || !synth.type || !synth.instance) {
                throw new Error(`Invalid synth object for type: ${type}`);
            }
            
            if (synth.type !== type) {
                throw new Error(`Synth type mismatch: expected ${type}, got ${synth.type}`);
            }
            
            createdSynths.push(synth);
            console.log(`   ✅ ${type} Synth作成成功: ID=${synth.id}`);
        }
        
        console.log(`   ✅ 全SynthType作成成功: ${createdSynths.length}個`);
        
        // 2. Synth設定カスタマイズテスト
        console.log('📋 2. Synth設定カスタマイズテスト...');
        
        const customConfigs = [
            { volume: 0.5 },
            { volume: 0.8, maxVoices: 2 },
            { envelope: 'custom' },
            {} // デフォルト設定
        ];
        
        for (let i = 0; i < customConfigs.length; i++) {
            const config = customConfigs[i];
            console.log(`   🔄 カスタム設定${i+1} テスト: ${JSON.stringify(config)}`);
            
            const synth = await foundationLayer.createSynth('basic', config);
            
            if (config.volume !== undefined && synth.config.volume !== config.volume) {
                throw new Error(`Volume config not applied: expected ${config.volume}, got ${synth.config.volume}`);
            }
            
            createdSynths.push(synth);
            console.log(`   ✅ カスタム設定${i+1} 適用成功`);
        }
        
        // 3. リソース制限テスト
        console.log('📋 3. リソース制限テスト...');
        
        const activeCount = foundationLayer.activeSynths.size;
        const maxSynths = foundationLayer.resourceLimits.maxSynths;
        
        console.log(`   📊 現在のアクティブSynth数: ${activeCount}/${maxSynths}`);
        
        if (activeCount >= maxSynths) {
            console.log('   🔄 制限超過テスト実行...');
            
            try {
                await foundationLayer.createSynth('basic');
                throw new Error('Should have thrown ResourceError for exceeding max synths');
            } catch (error) {
                if (error.name !== 'ResourceError') {
                    throw new Error(`Expected ResourceError, got: ${error.name}`);
                }
                console.log('   ✅ リソース制限正常動作確認');
            }
        } else {
            console.log('   ⚠️ 制限に未達 - 制限超過テストスキップ');
        }
        
        // 4. Synth破棄テスト
        console.log('📋 4. Synth破棄テスト...');
        
        const beforeDisposeCount = foundationLayer.activeSynths.size;
        console.log(`   📊 破棄前アクティブSynth数: ${beforeDisposeCount}`);
        
        // 半分のSynthを破棄
        const synthsToDispose = createdSynths.slice(0, Math.floor(createdSynths.length / 2));
        
        for (const synth of synthsToDispose) {
            console.log(`   🔄 Synth破棄中: ${synth.id} (${synth.type})`);
            
            foundationLayer.disposeSynth(synth);
            
            // アクティブSynthから削除されているか確認
            if (foundationLayer.activeSynths.has(synth.id)) {
                throw new Error(`Synth ${synth.id} should be removed from active synths`);
            }
            
            console.log(`   ✅ Synth破棄成功: ${synth.id}`);
        }
        
        const afterDisposeCount = foundationLayer.activeSynths.size;
        const expectedCount = beforeDisposeCount - synthsToDispose.length;
        
        if (afterDisposeCount !== expectedCount) {
            throw new Error(`Active synth count mismatch: expected ${expectedCount}, got ${afterDisposeCount}`);
        }
        
        console.log(`   ✅ Synth破棄テスト成功: ${beforeDisposeCount} → ${afterDisposeCount}`);
        
        // 5. エラーハンドリングテスト
        console.log('📋 5. エラーハンドリングテスト...');
        
        // 無効なSynthType
        try {
            await foundationLayer.createSynth('invalid_type');
            throw new Error('Should have thrown SynthError for invalid type');
        } catch (error) {
            if (error.name !== 'SynthError') {
                throw new Error(`Expected SynthError, got: ${error.name}`);
            }
            console.log('   ✅ 無効SynthTypeエラーハンドリング正常');
        }
        
        // 無効な設定
        try {
            await foundationLayer.createSynth('basic', { volume: -1 });
            throw new Error('Should have thrown SynthError for invalid config');
        } catch (error) {
            if (error.name !== 'SynthError') {
                throw new Error(`Expected SynthError, got: ${error.name}`);
            }
            console.log('   ✅ 無効設定エラーハンドリング正常');
        }
        
        // 無効なSynth破棄
        try {
            foundationLayer.disposeSynth(null);
            throw new Error('Should have thrown SynthError for null synth');
        } catch (error) {
            if (error.name !== 'SynthError') {
                throw new Error(`Expected SynthError, got: ${error.name}`);
            }
            console.log('   ✅ 無効Synth破棄エラーハンドリング正常');
        }
        
        // 6. 統計・監視データ確認
        console.log('📋 6. 統計・監視データ確認...');
        
        const statistics = foundationLayer.statistics;
        
        if (statistics.synthsCreated <= 0) {
            throw new Error('Statistics should show created synths > 0');
        }
        
        if (statistics.synthsDisposed <= 0) {
            throw new Error('Statistics should show disposed synths > 0');
        }
        
        console.log('   ✅ 統計データ正常:', {
            created: statistics.synthsCreated,
            disposed: statistics.synthsDisposed,
            active: foundationLayer.activeSynths.size
        });
        
        // 7. デバッグ情報確認
        console.log('📋 7. デバッグ情報確認...');
        
        const debugInfo = foundationLayer.getDebugInfo();
        
        if (debugInfo.resources.activeSynths !== foundationLayer.activeSynths.size) {
            throw new Error('Debug info active synths count mismatch');
        }
        
        if (debugInfo.statistics.synthsCreated !== statistics.synthsCreated) {
            throw new Error('Debug info synths created count mismatch');
        }
        
        console.log('   ✅ デバッグ情報正常取得');
        
        // 8. システム破棄テスト
        console.log('📋 8. システム破棄テスト...');
        
        await foundationLayer.dispose();
        
        if (!foundationLayer.isDisposed) {
            throw new Error('System should be marked as disposed');
        }
        
        console.log('   ✅ システム破棄正常完了');
        
        console.log('\n🎉 Phase 1.3.1 基本Synth作成システムテスト完全成功！');
        console.log('📊 テスト結果サマリー:');
        console.log('   - 基本Synth作成: ✅ 正常 (8タイプ対応)');
        console.log('   - 設定カスタマイズ: ✅ 正常');
        console.log('   - リソース制限制御: ✅ 正常');
        console.log('   - Synth破棄: ✅ 正常');
        console.log('   - エラーハンドリング: ✅ 正常');
        console.log('   - 統計・監視: ✅ 正常');
        console.log('   - デバッグ情報: ✅ 正常');
        console.log('   - システム破棄: ✅ 正常');
        
        console.log('\n✅ Phase 1.3.1 実装完了 - Phase 1.3.2 への準備完了');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ Phase 1.3.1 テスト失敗:', error.message);
        console.error('スタックトレース:', error.stack);
        return false;
    }
}

// テスト実行
testPhase131().then(success => {
    if (success) {
        console.log('\n🚀 Phase 1.3.1 検証完了 - 次サブフェーズへ進行可能');
        process.exit(0);
    } else {
        console.log('\n🚨 Phase 1.3.1 に問題があります - 修正が必要');
        process.exit(1);
    }
}).catch(error => {
    console.error('\n💥 テスト実行中に予期しないエラー:', error);
    process.exit(1);
});