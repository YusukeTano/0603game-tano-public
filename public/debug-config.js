/**
 * 🔍 最終診断モード - デバッグ設定システム
 * ログの整理・フィルタリング・重要度別表示制御
 */

window.DebugConfig = {
    // 🎛️ 診断ログ制御フラグ - 本番環境では無効化推奨
    enabled: false,                   // 診断システム全体のON/OFF（本番: false）
    verboseMode: false,               // 詳細ログ表示（通常はfalse）
    criticalOnly: true,               // 重要ログのみ表示（推奨）
    
    // 📋 カテゴリー別ログ制御
    categories: {
        enemyLifecycle: true,         // 🔍 敵ライフサイクル監視
        damageProcess: true,          // ⚔️ ダメージ処理
        deathDetection: true,         // 💀 死亡判定
        killEnemyCall: true,          // 🎯 killEnemy呼び出し
        markingProcess: true,         // 🏷️ 削除マーク処理
        cleanupProcess: true,         // 🗑️ クリーンアップ処理
        removalExecution: true        // ✂️ 実際の削除実行
    },
    
    // 🚨 重要度レベル定義
    levels: {
        CRITICAL: 1,    // 🚨 最重要（HP0未削除等）
        WARNING: 2,     // ⚠️ 警告（異常状態）
        INFO: 3,        // ℹ️ 情報（正常プロセス）
        DEBUG: 4        // 🔧 デバッグ（詳細情報）
    },
    
    // 🎨 表示設定
    display: {
        showTimestamp: true,          // タイムスタンプ表示
        showCategory: true,           // カテゴリー表示
        showCallStack: false,         // 呼び出しスタック表示
        maxLogEntries: 50            // 最大ログ保持数
    },
    
    /**
     * 🔍 診断ログ出力メソッド
     * @param {string} category - ログカテゴリー
     * @param {number} level - 重要度レベル
     * @param {string} message - メッセージ
     * @param {Object} data - データオブジェクト
     */
    log(category, level, message, data = {}) {
        // 診断システム無効時はスキップ
        if (!this.enabled) return;
        
        // カテゴリーフィルタリング
        if (!this.categories[category]) return;
        
        // 重要度フィルタリング
        if (this.criticalOnly && level > this.levels.WARNING) return;
        if (!this.verboseMode && level > this.levels.INFO) return;
        
        // 🎨 ログ形式の整理
        const timestamp = this.display.showTimestamp ? 
            `[${new Date().toLocaleTimeString()}]` : '';
        const categoryTag = this.display.showCategory ? 
            `[${category.toUpperCase()}]` : '';
        
        // 重要度別の表示スタイル
        const levelInfo = this.getLevelInfo(level);
        const formattedMessage = `${levelInfo.icon} ${timestamp} ${categoryTag} ${message}`;
        
        // データの整理表示
        const cleanData = this.cleanDataForDisplay(data);
        
        // コンソール出力（重要度別）
        switch (level) {
            case this.levels.CRITICAL:
                console.error(formattedMessage, cleanData);
                break;
            case this.levels.WARNING:
                console.warn(formattedMessage, cleanData);
                break;
            case this.levels.INFO:
                console.info(formattedMessage, cleanData);
                break;
            default:
                console.log(formattedMessage, cleanData);
        }
    },
    
    /**
     * 重要度情報取得
     */
    getLevelInfo(level) {
        const levelMap = {
            [this.levels.CRITICAL]: { icon: '🚨', name: 'CRITICAL' },
            [this.levels.WARNING]: { icon: '⚠️', name: 'WARNING' },
            [this.levels.INFO]: { icon: 'ℹ️', name: 'INFO' },
            [this.levels.DEBUG]: { icon: '🔧', name: 'DEBUG' }
        };
        return levelMap[level] || { icon: '❓', name: 'UNKNOWN' };
    },
    
    /**
     * データ表示用クリーンアップ
     */
    cleanDataForDisplay(data) {
        if (!data || typeof data !== 'object') return data;
        
        const cleaned = {};
        Object.keys(data).forEach(key => {
            const value = data[key];
            
            // 重要な情報のみ抽出
            if (key.includes('health') || key.includes('Health') ||
                key.includes('type') || key.includes('Type') ||
                key.includes('index') || key.includes('Index') ||
                key.includes('marked') || key.includes('Marked') ||
                key.includes('dead') || key.includes('Dead') ||
                key.includes('damage') || key.includes('Damage') ||
                key.includes('count') || key.includes('Count')) {
                cleaned[key] = value;
            }
        });
        
        return Object.keys(cleaned).length > 0 ? cleaned : data;
    },
    
    /**
     * 🧹 コンソールクリア
     */
    clearConsole() {
        console.clear();
        console.log('🧹 Console cleared - Debug mode ready');
        console.log('🔍 Diagnosis settings:', {
            enabled: this.enabled,
            criticalOnly: this.criticalOnly,
            verboseMode: this.verboseMode
        });
    },
    
    /**
     * ⚙️ 設定変更用ヘルパー
     */
    setCriticalOnly() {
        this.criticalOnly = true;
        this.verboseMode = false;
        console.log('🚨 Critical logs only mode enabled');
    },
    
    setVerboseMode() {
        this.criticalOnly = false;
        this.verboseMode = true;
        console.log('🔧 Verbose mode enabled - All logs shown');
    },
    
    setNormalMode() {
        this.criticalOnly = false;
        this.verboseMode = false;
        console.log('ℹ️ Normal mode enabled - Important logs shown');
    }
};

// 🎛️ グローバルショートカット
window.debugClear = () => window.DebugConfig.clearConsole();
window.debugCritical = () => window.DebugConfig.setCriticalOnly();
window.debugVerbose = () => window.DebugConfig.setVerboseMode();
window.debugNormal = () => window.DebugConfig.setNormalMode();

// 初期化メッセージ
console.log('🔍 Debug Config loaded. Available commands:');
console.log('- debugClear()    : コンソールクリア');
console.log('- debugCritical() : 重要ログのみ表示');
console.log('- debugNormal()   : 通常ログ表示');
console.log('- debugVerbose()  : 全ログ表示');