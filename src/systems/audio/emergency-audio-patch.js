/**
 * EmergencyAudioSystem - 緊急音響システムパッチ
 * 音響システム完全復旧計画 Phase A.1
 * 
 * 最小限の機能を提供し、ゲームの基本動作を確保
 */

export class EmergencyAudioSystem {
    constructor(game = null) {
        this.game = game;
        this.isInitialized = false;
        
        // BGM状態管理
        this.bgmState = {
            isPlaying: false,
            currentType: null,
            volume: 0.3
        };
        
        // 音響設定
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.3,
            sfx: 0.7
        };
        
        console.log('🚨 EmergencyAudioSystem: 緊急音響システム起動');
    }
    
    /**
     * システム初期化
     */
    async initialize() {
        try {
            console.log('🚨 EmergencyAudioSystem: 初期化開始');
            
            // Tone.jsの基本チェック
            if (typeof Tone === 'undefined') {
                console.warn('⚠️ Tone.js not available - audio disabled');
                this.isInitialized = false;
                return { success: true, activeSystem: 'emergency-silent' };
            }
            
            // 基本的な初期化のみ
            this.isInitialized = true;
            
            console.log('✅ EmergencyAudioSystem: 初期化完了（最小機能）');
            return { success: true, activeSystem: 'emergency-audio' };
            
        } catch (error) {
            console.error('❌ EmergencyAudioSystem: 初期化エラー:', error);
            this.isInitialized = false;
            return { success: false, error: error.message };
        }
    }
    
    /**
     * BGM開始
     */
    startBGM(type = 'menu', volume = null, loop = true) {
        console.log(`🎵 EmergencyAudioSystem: BGM開始 [${type}]`);
        
        if (!this.isInitialized) {
            console.warn('⚠️ Audio system not initialized');
            return;
        }
        
        try {
            this.bgmState.isPlaying = true;
            this.bgmState.currentType = type;
            this.bgmState.volume = volume || this.volumeSettings.bgm;
            
            // 実際の音響再生はここで実装
            // 今は基本動作確保のためログのみ
            console.log(`🎼 BGM: ${type} (volume: ${this.bgmState.volume})`);
            
        } catch (error) {
            console.error('❌ BGM start error:', error);
        }
    }
    
    /**
     * BGM停止
     */
    stopBGM() {
        console.log('🔇 EmergencyAudioSystem: BGM停止');
        
        this.bgmState.isPlaying = false;
        this.bgmState.currentType = null;
    }
    
    /**
     * BGM音量設定
     */
    setBGMVolume(volume) {
        this.bgmState.volume = Math.max(0, Math.min(1, volume));
        console.log(`🔊 BGM Volume: ${this.bgmState.volume}`);
    }
    
    /**
     * Wave完了音再生
     */
    playWaveCompleteSound(volume = null) {
        console.log('🔊 EmergencyAudioSystem: Wave完了音');
        
        if (!this.isInitialized) {
            return;
        }
        
        const effectVolume = volume || this.volumeSettings.sfx;
        console.log(`🎉 Wave Complete! (volume: ${effectVolume})`);
    }
    
    /**
     * レベルアップ音再生
     */
    playLevelUpSound(volume = null) {
        console.log('🔊 EmergencyAudioSystem: レベルアップ音');
        
        if (!this.isInitialized) {
            return;
        }
        
        const effectVolume = volume || this.volumeSettings.sfx;
        console.log(`⬆️ Level Up! (volume: ${effectVolume})`);
    }
    
    /**
     * 射撃音再生
     */
    playShootSound(weaponType = 'default', volume = null) {
        // 射撃音は頻繁なのでログ出力しない
        if (!this.isInitialized) {
            return;
        }
    }
    
    /**
     * 敵ヒット音再生
     */
    playEnemyHitSound(enemyType = 'small', volume = null) {
        // ヒット音は頻繁なのでログ出力しない
        if (!this.isInitialized) {
            return;
        }
    }
    
    /**
     * 敵撃破音再生
     */
    playEnemyDeathSound(enemyType = 'small', volume = null) {
        // 撃破音は頻繁なのでログ出力しない
        if (!this.isInitialized) {
            return;
        }
    }
    
    /**
     * アイテム取得音再生
     */
    playItemPickupSound(volume = null) {
        if (!this.isInitialized) {
            return;
        }
        
        const effectVolume = volume || this.volumeSettings.sfx;
        console.log(`💎 Item Pickup! (volume: ${effectVolume})`);
    }
    
    /**
     * ボタンホバー音再生
     */
    playButtonHoverSound(volume = null) {
        // UI音は頻繁なのでログ出力しない
        if (!this.isInitialized) {
            return;
        }
    }
    
    /**
     * メニュー選択音再生
     */
    playMenuSelectSound(volume = null) {
        if (!this.isInitialized) {
            return;
        }
        
        const effectVolume = volume || this.volumeSettings.sfx;
        console.log(`📋 Menu Select (volume: ${effectVolume})`);
    }
    
    /**
     * ゲーム開始音再生
     */
    playGameStartSound(volume = null) {
        if (!this.isInitialized) {
            return;
        }
        
        const effectVolume = volume || this.volumeSettings.sfx;
        console.log(`🚀 Game Start! (volume: ${effectVolume})`);
    }
    
    /**
     * 更新処理（ゲームループ用）
     */
    update(deltaTime) {
        // 緊急モードでは最小限の処理のみ
        if (!this.isInitialized) {
            return;
        }
        
        // 必要に応じて音響状態の更新処理
    }
    
    /**
     * システム破棄
     */
    destroy() {
        console.log('💥 EmergencyAudioSystem: システム破棄');
        
        this.stopBGM();
        this.isInitialized = false;
    }
    
    /**
     * デバッグ情報取得
     */
    getDebugInfo() {
        return {
            system: 'EmergencyAudioSystem',
            isInitialized: this.isInitialized,
            bgmState: this.bgmState,
            volumeSettings: this.volumeSettings,
            status: 'emergency_mode'
        };
    }
    
    /**
     * システムヘルス状態
     */
    getSystemHealth() {
        return {
            status: 'emergency',
            healthy: this.isInitialized,
            features: {
                bgm: true,
                sfx: true,
                volume: true,
                performance: 'minimal'
            }
        };
    }
}