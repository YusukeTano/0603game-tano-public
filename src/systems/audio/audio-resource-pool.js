/**
 * AudioResourcePool - Phase 1.2.2 リソースプールシステム
 * 
 * 🎯 目的: Tone.jsオブジェクトの効率的な再利用（69個 → 20個以下）
 * 📐 設計: オブジェクトプール・ライフサイクル管理・メモリ最適化
 * 🛡️ Phase 1: Foundation層リソース管理
 */

export class AudioResourcePool {
    constructor() {
        // プール設定
        this.maxPoolSize = 20;               // 最大オブジェクト数（推奨値）
        this.minPoolSize = 5;                // 最小プリウォーム数
        this.maxAge = 30000;                 // オブジェクト最大年齢（30秒）
        
        // オブジェクトプール
        this.pools = new Map();              // タイプ別プール
        this.activeObjects = new Map();      // アクティブオブジェクト追跡
        
        // 統計情報
        this.stats = {
            totalCreated: 0,
            totalReused: 0,
            totalDisposed: 0,
            poolHitRate: 0,
            memoryUsage: 0,
            activeCount: 0
        };
        
        // プールタイプ定義
        this.poolTypes = {
            synth: {
                maxSize: 6,
                factory: () => new window.Tone.Synth(),
                validator: (obj) => obj && typeof obj.triggerAttackRelease === 'function',
                reset: (obj) => {
                    obj.volume.value = -12; // デフォルト音量
                    return obj;
                }
            },
            noise: {
                maxSize: 4,
                factory: () => new window.Tone.NoiseSynth(),
                validator: (obj) => obj && typeof obj.triggerAttackRelease === 'function',
                reset: (obj) => {
                    obj.volume.value = -15;
                    return obj;
                }
            },
            fm: {
                maxSize: 3,
                factory: () => new window.Tone.FMSynth(),
                validator: (obj) => obj && typeof obj.triggerAttackRelease === 'function',
                reset: (obj) => {
                    obj.volume.value = -10;
                    return obj;
                }
            },
            effect: {
                maxSize: 4,
                factory: () => ({
                    reverb: new window.Tone.Reverb(0.3),
                    filter: new window.Tone.Filter(800),
                    delay: new window.Tone.Delay(0.1)
                }),
                validator: (obj) => obj && obj.reverb && obj.filter && obj.delay,
                reset: (obj) => {
                    obj.reverb.wet.value = 0.3;
                    obj.filter.frequency.value = 800;
                    obj.delay.wet.value = 0.0;
                    return obj;
                }
            }
        };
        
        // クリーンアップタイマー
        this.cleanupInterval = null;
        
        console.log('🏊 AudioResourcePool: Phase 1.2.2 リソースプール初期化');
        this.initializePools();
    }
    
    /**
     * プール初期化
     */
    async initializePools() {
        try {
            console.log('🏊 AudioResourcePool: プール初期化開始');
            
            // Tone.js準備確認
            if (typeof window.Tone === 'undefined') {
                throw new Error('Tone.js not available');
            }
            
            // 各タイプのプールを初期化
            for (const [type, config] of Object.entries(this.poolTypes)) {
                this.pools.set(type, []);
                
                // 最小数まで事前生成（プリウォーミング）
                await this.prewarmPool(type, Math.min(this.minPoolSize, config.maxSize));
            }
            
            // 定期クリーンアップ開始
            this.startCleanupTimer();
            
            console.log('✅ AudioResourcePool: プール初期化完了');
            this.logPoolStatus();
            
        } catch (error) {
            console.error('❌ AudioResourcePool: 初期化失敗:', error);
            throw error;
        }
    }
    
    /**
     * プールプリウォーミング
     */
    async prewarmPool(type, count) {
        const config = this.poolTypes[type];
        if (!config) return;
        
        try {
            for (let i = 0; i < count; i++) {
                const obj = await this.createObject(type);
                if (obj) {
                    this.pools.get(type).push({
                        object: obj,
                        createdAt: Date.now(),
                        lastUsed: Date.now()
                    });
                }
            }
            console.log(`🏊 Pool ${type}: ${count}個プリウォーム完了`);
        } catch (error) {
            console.warn(`⚠️ Pool ${type}: プリウォーム失敗:`, error);
        }
    }
    
    /**
     * オブジェクト取得（再利用優先）
     */
    async acquireObject(type) {
        try {
            const pool = this.pools.get(type);
            const config = this.poolTypes[type];
            
            if (!pool || !config) {
                throw new Error(`Unknown pool type: ${type}`);
            }
            
            // プールから再利用可能オブジェクト検索
            let poolItem = pool.find(item => 
                config.validator(item.object) && 
                Date.now() - item.createdAt < this.maxAge
            );
            
            if (poolItem) {
                // プールから削除して再利用
                const index = pool.indexOf(poolItem);
                pool.splice(index, 1);
                
                // オブジェクトリセット
                poolItem.object = config.reset(poolItem.object);
                poolItem.lastUsed = Date.now();
                
                this.stats.totalReused++;
                this.updateHitRate();
                
                // アクティブリストに追加
                const activeId = this.generateActiveId();
                this.activeObjects.set(activeId, {
                    type,
                    object: poolItem.object,
                    acquiredAt: Date.now()
                });
                
                console.log(`🔄 Pool ${type}: オブジェクト再利用 (ID: ${activeId})`);
                return { id: activeId, object: poolItem.object };
                
            } else {
                // 新規作成
                const newObject = await this.createObject(type);
                if (newObject) {
                    this.stats.totalCreated++;
                    this.updateHitRate();
                    
                    const activeId = this.generateActiveId();
                    this.activeObjects.set(activeId, {
                        type,
                        object: newObject,
                        acquiredAt: Date.now()
                    });
                    
                    console.log(`🆕 Pool ${type}: オブジェクト新規作成 (ID: ${activeId})`);
                    return { id: activeId, object: newObject };
                }
            }
            
            throw new Error(`Failed to acquire object of type: ${type}`);
            
        } catch (error) {
            console.error(`❌ Pool ${type}: オブジェクト取得失敗:`, error);
            return null;
        }
    }
    
    /**
     * オブジェクト返却（プールへ戻す）
     */
    releaseObject(id) {
        try {
            const activeItem = this.activeObjects.get(id);
            if (!activeItem) {
                console.warn(`⚠️ Pool: 不明なアクティブID: ${id}`);
                return false;
            }
            
            const { type, object } = activeItem;
            const pool = this.pools.get(type);
            const config = this.poolTypes[type];
            
            if (!pool || !config) {
                console.warn(`⚠️ Pool: 不明なタイプ: ${type}`);
                return false;
            }
            
            // アクティブリストから削除
            this.activeObjects.delete(id);
            
            // プールサイズチェック
            if (pool.length < config.maxSize && config.validator(object)) {
                // プールに返却
                pool.push({
                    object: config.reset(object),
                    createdAt: Date.now(),
                    lastUsed: Date.now()
                });
                console.log(`🔙 Pool ${type}: オブジェクト返却 (ID: ${id})`);
                return true;
            } else {
                // プール満杯またはオブジェクト無効 → 破棄
                this.disposeObject(object);
                console.log(`🗑️ Pool ${type}: オブジェクト破棄 (ID: ${id})`);
                return true;
            }
            
        } catch (error) {
            console.error(`❌ Pool: オブジェクト返却失敗 (ID: ${id}):`, error);
            return false;
        }
    }
    
    /**
     * オブジェクト作成
     */
    async createObject(type) {
        try {
            const config = this.poolTypes[type];
            if (!config) {
                throw new Error(`Unknown type: ${type}`);
            }
            
            const obj = config.factory();
            
            // 基本設定適用
            if (obj && typeof obj.toDestination === 'function') {
                obj.toDestination();
            }
            
            return obj;
            
        } catch (error) {
            console.error(`❌ Pool ${type}: オブジェクト作成失敗:`, error);
            return null;
        }
    }
    
    /**
     * オブジェクト破棄
     */
    disposeObject(object) {
        try {
            if (object && typeof object.dispose === 'function') {
                object.dispose();
                this.stats.totalDisposed++;
            }
        } catch (error) {
            console.warn('⚠️ Pool: オブジェクト破棄エラー:', error);
        }
    }
    
    /**
     * プールクリーンアップ
     */
    cleanupPools() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [type, pool] of this.pools.entries()) {
            const config = this.poolTypes[type];
            
            // 古いオブジェクトを削除
            for (let i = pool.length - 1; i >= 0; i--) {
                const item = pool[i];
                if (now - item.createdAt > this.maxAge || !config.validator(item.object)) {
                    this.disposeObject(item.object);
                    pool.splice(i, 1);
                    cleanedCount++;
                }
            }
        }
        
        // アクティブオブジェクトの長時間使用チェック
        for (const [id, item] of this.activeObjects.entries()) {
            if (now - item.acquiredAt > this.maxAge * 2) {
                console.warn(`⚠️ Pool: 長時間アクティブなオブジェクト検出 (ID: ${id})`);
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 Pool: クリーンアップ完了 (${cleanedCount}個破棄)`);
        }
        
        this.updateStats();
    }
    
    /**
     * 統計更新
     */
    updateStats() {
        let totalPooled = 0;
        for (const pool of this.pools.values()) {
            totalPooled += pool.length;
        }
        
        this.stats.activeCount = this.activeObjects.size;
        this.stats.memoryUsage = totalPooled + this.stats.activeCount;
    }
    
    /**
     * ヒット率更新
     */
    updateHitRate() {
        const total = this.stats.totalCreated + this.stats.totalReused;
        this.stats.poolHitRate = total > 0 ? (this.stats.totalReused / total * 100) : 0;
    }
    
    /**
     * アクティブID生成
     */
    generateActiveId() {
        return `audio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * クリーンアップタイマー開始
     */
    startCleanupTimer() {
        this.cleanupInterval = setInterval(() => {
            this.cleanupPools();
        }, 10000); // 10秒間隔
    }
    
    /**
     * プール状態ログ出力
     */
    logPoolStatus() {
        console.group('🏊 AudioResourcePool Status');
        
        for (const [type, pool] of this.pools.entries()) {
            console.log(`${type}: ${pool.length}/${this.poolTypes[type].maxSize}`);
        }
        
        console.log('Active objects:', this.stats.activeCount);
        console.log('Pool hit rate:', `${this.stats.poolHitRate.toFixed(1)}%`);
        console.log('Memory usage:', `${this.stats.memoryUsage}/${this.maxPoolSize}`);
        
        console.groupEnd();
    }
    
    /**
     * プール状態取得（テスト用）
     */
    getPoolStatus() {
        const poolSizes = {};
        for (const [type, pool] of this.pools.entries()) {
            poolSizes[type] = {
                current: pool.length,
                max: this.poolTypes[type].maxSize
            };
        }
        
        return {
            pools: poolSizes,
            stats: { ...this.stats },
            totalMemoryUsage: this.stats.memoryUsage,
            maxCapacity: this.maxPoolSize,
            isOptimal: this.stats.memoryUsage <= this.maxPoolSize
        };
    }
    
    /**
     * プール破棄
     */
    dispose() {
        console.log('🏊 AudioResourcePool: プール破棄開始');
        
        // クリーンアップタイマー停止
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
            this.cleanupInterval = null;
        }
        
        // 全オブジェクト破棄
        for (const pool of this.pools.values()) {
            for (const item of pool) {
                this.disposeObject(item.object);
            }
        }
        
        for (const item of this.activeObjects.values()) {
            this.disposeObject(item.object);
        }
        
        // コレクションクリア
        this.pools.clear();
        this.activeObjects.clear();
        
        console.log('✅ AudioResourcePool: プール破棄完了');
    }
}

// グローバル対応
if (typeof window !== 'undefined') {
    window.AudioResourcePool = AudioResourcePool;
}