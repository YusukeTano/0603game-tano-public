/**
 * AudioCore - 基盤音響層
 * Tone.js抽象化・Web Audio API管理・リソース制御
 * 新3層アーキテクチャの基盤レイヤー
 */

export class AudioCore {
    constructor() {
        // Core状態管理
        this.isInitialized = false;
        this.audioContext = null;
        this.toneReady = false;
        
        // リソース管理
        this.toneObjects = new Map();           // Tone.jsオブジェクト管理
        this.objectPool = new Map();            // オブジェクトプール
        this.maxObjects = 20;                   // 最大オブジェクト数
        
        // 基盤音響設定
        this.baseVolume = 0.8;
        this.masterGain = null;
        
        // エラー統計
        this.errorStats = {
            initErrors: 0,
            playbackErrors: 0,
            lastError: null
        };
        
        console.log('🔧 AudioCore: 基盤音響層初期化');
    }
    
    /**
     * 基盤音響システム初期化
     */
    async initialize() {
        try {
            // Tone.js可用性確認
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available');
            }
            
            // AudioContext安全初期化
            if (Tone.context.state !== 'running') {
                await Tone.start();
                console.log('✅ AudioCore: Tone.js context started');
            }
            
            // マスターゲインノード作成
            this.masterGain = new Tone.Gain(this.baseVolume);
            this.masterGain.toDestination();
            
            this.audioContext = Tone.context;
            this.toneReady = true;
            this.isInitialized = true;
            
            console.log('✅ AudioCore: 基盤音響システム初期化完了');
            return { success: true, message: 'AudioCore initialized' };
            
        } catch (error) {
            this.errorStats.initErrors++;
            this.errorStats.lastError = error;
            console.error('❌ AudioCore: 初期化失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * Tone.jsオブジェクト安全作成
     */
    createToneObject(type, options = {}, objectId = null) {
        try {
            if (!this.isInitialized || !this.toneReady) {
                throw new Error('AudioCore not initialized');
            }
            
            // リソース制限チェック
            if (this.toneObjects.size >= this.maxObjects) {
                console.warn('🚨 AudioCore: Tone.jsオブジェクト上限に達しました');
                this.cleanupOldObjects();
            }
            
            // オブジェクト作成
            let toneObject;
            switch (type) {
                case 'Synth':
                    toneObject = new Tone.Synth(options);
                    break;
                case 'PolySynth':
                    toneObject = new Tone.PolySynth(Tone.Synth, options);
                    break;
                case 'NoiseSynth':
                    toneObject = new Tone.NoiseSynth(options);
                    break;
                case 'FMSynth':
                    toneObject = new Tone.FMSynth(options);
                    break;
                case 'PluckSynth':
                    toneObject = new Tone.PluckSynth(options);
                    break;
                case 'Player':
                    toneObject = new Tone.Player(options);
                    break;
                case 'Reverb':
                    toneObject = new Tone.Reverb(options);
                    break;
                case 'Filter':
                    toneObject = new Tone.Filter(options);
                    break;
                case 'Compressor':
                    toneObject = new Tone.Compressor(options);
                    break;
                default:
                    throw new Error(`Unknown Tone.js object type: ${type}`);
            }
            
            // オブジェクト登録・追跡
            const id = objectId || `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const objectInfo = {
                id,
                type,
                object: toneObject,
                created: Date.now(),
                lastUsed: Date.now()
            };
            
            this.toneObjects.set(id, objectInfo);
            
            console.log(`🔧 AudioCore: ${type} オブジェクト作成 (ID: ${id})`);
            return { success: true, object: toneObject, id };
            
        } catch (error) {
            this.errorStats.playbackErrors++;
            this.errorStats.lastError = error;
            console.error('❌ AudioCore: オブジェクト作成失敗:', error);
            return { success: false, error: error.message };
        }
    }
    
    /**
     * オブジェクトプールからの取得
     */
    getPooledObject(type, options = {}) {
        const poolKey = `${type}_${JSON.stringify(options)}`;
        
        if (this.objectPool.has(poolKey)) {
            const pooledObjects = this.objectPool.get(poolKey);
            if (pooledObjects.length > 0) {
                const object = pooledObjects.pop();
                console.log(`♻️ AudioCore: プールから${type}オブジェクト取得`);
                return { success: true, object, fromPool: true };
            }
        }
        
        // プールにない場合は新規作成
        return this.createToneObject(type, options);
    }
    
    /**
     * オブジェクトをプールに返却
     */
    returnToPool(objectId) {
        const objectInfo = this.toneObjects.get(objectId);
        if (!objectInfo) return;
        
        const poolKey = `${objectInfo.type}_${JSON.stringify({})}`;
        
        if (!this.objectPool.has(poolKey)) {
            this.objectPool.set(poolKey, []);
        }
        
        // オブジェクトをクリーンアップしてプールに戻す
        try {
            objectInfo.object.disconnect();
            this.objectPool.get(poolKey).push(objectInfo.object);
            this.toneObjects.delete(objectId);
            
            console.log(`♻️ AudioCore: ${objectInfo.type}オブジェクトをプールに返却`);
        } catch (error) {
            console.warn('⚠️ AudioCore: プール返却時エラー:', error);
        }
    }
    
    /**
     * 古いオブジェクトのクリーンアップ
     */
    cleanupOldObjects() {
        const now = Date.now();
        const maxAge = 30000; // 30秒
        let cleanedCount = 0;
        
        for (const [id, objectInfo] of this.toneObjects.entries()) {
            if (now - objectInfo.lastUsed > maxAge) {
                try {
                    objectInfo.object.dispose();
                    this.toneObjects.delete(id);
                    cleanedCount++;
                } catch (error) {
                    console.warn('⚠️ AudioCore: オブジェクト削除エラー:', error);
                }
            }
        }
        
        if (cleanedCount > 0) {
            console.log(`🧹 AudioCore: ${cleanedCount}個の古いオブジェクトをクリーンアップ`);
        }
    }
    
    /**
     * マスター音量設定
     */
    setMasterVolume(volume) {
        if (this.masterGain && typeof volume === 'number') {
            this.masterGain.gain.setValueAtTime(
                Math.max(0, Math.min(1, volume)), 
                this.audioContext.currentTime
            );
            this.baseVolume = volume;
            console.log(`🎚️ AudioCore: マスター音量設定 ${(volume * 100).toFixed(1)}%`);
        }
    }
    
    /**
     * AudioContext状態取得
     */
    getContextState() {
        return {
            state: this.audioContext ? this.audioContext.state : 'null',
            sampleRate: this.audioContext ? this.audioContext.sampleRate : 0,
            currentTime: this.audioContext ? this.audioContext.currentTime.toFixed(3) : '0',
            isInitialized: this.isInitialized,
            toneReady: this.toneReady,
            objectCount: this.toneObjects.size,
            maxObjects: this.maxObjects,
            errorStats: this.errorStats
        };
    }
    
    /**
     * システム診断
     */
    diagnose() {
        const state = this.getContextState();
        const poolStats = {};
        
        for (const [poolKey, objects] of this.objectPool.entries()) {
            poolStats[poolKey] = objects.length;
        }
        
        return {
            coreStatus: this.isInitialized ? 'Ready' : 'Not Initialized',
            audioContext: state,
            resourceUsage: {
                activeObjects: this.toneObjects.size,
                maxObjects: this.maxObjects,
                utilizationRate: (this.toneObjects.size / this.maxObjects * 100).toFixed(1) + '%'
            },
            objectPool: poolStats,
            performance: {
                avgObjectAge: this.calculateAverageObjectAge(),
                oldestObject: this.findOldestObject()
            }
        };
    }
    
    /**
     * 平均オブジェクト年齢計算
     */
    calculateAverageObjectAge() {
        if (this.toneObjects.size === 0) return 0;
        
        const now = Date.now();
        const totalAge = Array.from(this.toneObjects.values())
            .reduce((sum, obj) => sum + (now - obj.created), 0);
            
        return Math.round(totalAge / this.toneObjects.size);
    }
    
    /**
     * 最古オブジェクト検索
     */
    findOldestObject() {
        if (this.toneObjects.size === 0) return null;
        
        let oldest = null;
        let oldestTime = Infinity;
        
        for (const objectInfo of this.toneObjects.values()) {
            if (objectInfo.created < oldestTime) {
                oldestTime = objectInfo.created;
                oldest = objectInfo;
            }
        }
        
        return oldest ? {
            id: oldest.id,
            type: oldest.type,
            age: Date.now() - oldest.created
        } : null;
    }
    
    /**
     * クリーンアップ・破棄
     */
    dispose() {
        console.log('🧹 AudioCore: システムクリーンアップ開始');
        
        try {
            // 全Tone.jsオブジェクト破棄
            for (const objectInfo of this.toneObjects.values()) {
                try {
                    objectInfo.object.dispose();
                } catch (error) {
                    console.warn('⚠️ AudioCore: オブジェクト破棄エラー:', error);
                }
            }
            this.toneObjects.clear();
            
            // プール内オブジェクト破棄
            for (const pooledObjects of this.objectPool.values()) {
                pooledObjects.forEach(obj => {
                    try {
                        obj.dispose();
                    } catch (error) {
                        console.warn('⚠️ AudioCore: プールオブジェクト破棄エラー:', error);
                    }
                });
            }
            this.objectPool.clear();
            
            // マスターゲイン切断
            if (this.masterGain) {
                this.masterGain.disconnect();
                this.masterGain.dispose();
                this.masterGain = null;
            }
            
            this.isInitialized = false;
            this.toneReady = false;
            
            console.log('✅ AudioCore: システムクリーンアップ完了');
            
        } catch (error) {
            console.error('❌ AudioCore: クリーンアップエラー:', error);
        }
    }
}