/**
 * AudioSystem - 簡素化された効果音管理システム
 * BGMシステムを削除し、基本効果音のみを管理
 */
export class AudioSystem {
    constructor(game) {
        this.game = game;
        
        // 音量設定
        this.volumeSettings = {
            master: 0.8,
            sfx: 0.7       // 効果音音量
        };
        
        // 保存された設定を読み込み
        this.loadVolumeSettings();
        
        // 効果音管理
        this.audioContext = null;
        this.sounds = {};
        this.isInitialized = false;
        
        console.log('🎵 AudioSystem: Simple audio system initialized');
    }
    
    /**
     * システム初期化
     */
    async initAudio() {
        try {
            // AudioContext作成
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // 効果音作成
            this.createSounds();
            
            this.isInitialized = true;
            console.log('🎵 AudioSystem: Initialization completed', {
                audioContext: !!this.audioContext,
                audioContextState: this.audioContext?.state,
                soundsCount: Object.keys(this.sounds).length
            });
            
        } catch (error) {
            console.error('🎵 AudioSystem: Initialization failed:', error);
        }
    }
    
    /**
     * AudioContext再開
     */
    async resumeAudioContext() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            try {
                await this.audioContext.resume();
                console.log('🎵 AudioSystem: AudioContext resumed');
            } catch (error) {
                console.error('🎵 AudioSystem: Failed to resume AudioContext:', error);
            }
        }
    }
    
    /**
     * BGM関連メソッド（後方互換性のため空実装）
     */
    async startBGM() {
        console.log('🎵 AudioSystem: BGM disabled - no action taken');
        return true;
    }
    
    pauseBGM() {
        console.log('🎵 AudioSystem: BGM disabled - no action taken');
        return true;
    }
    
    resumeBGM() {
        console.log('🎵 AudioSystem: BGM disabled - no action taken');
        return true;
    }
    
    stopBGM() {
        console.log('🎵 AudioSystem: BGM disabled - no action taken');
    }
    
    isBGMPaused() {
        return false;
    }
    
    enableStage1Music() {
        console.log('🎵 AudioSystem: BGM disabled - no action taken');
    }
    
    disableStage1Music() {
        console.log('🎵 AudioSystem: BGM disabled - no action taken');
    }
    
    getBGMStatus() {
        return {
            isPlaying: false,
            isPaused: false,
            currentStage: 0,
            currentTheme: 'None'
        };
    }
    
    /**
     * 音量設定
     * @param {string} type - 音量タイプ
     * @param {number} volume - 音量値 (0.0-1.0)
     */
    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        
        // 設定を保存
        this.saveVolumeSettings();
        
        console.log(`🎵 AudioSystem: Volume set - ${type}: ${volume}`);
    }
    
    /**
     * 音量取得
     * @param {string} type - 音量タイプ
     * @returns {number} 音量値
     */
    getVolume(type) {
        return this.volumeSettings[type] || 0;
    }
    
    /**
     * 計算された音量取得
     * @param {string} type - 音量タイプ
     * @param {number} baseVolume - 基本音量
     * @returns {number} 最終音量
     */
    getCalculatedVolume(type, baseVolume = 1.0) {
        return this.volumeSettings.master * this.volumeSettings[type] * baseVolume;
    }
    
    /**
     * ゲームイベント通知（空実装）
     */
    onGameEvent(eventType, data = {}) {
        // 効果音以外のイベントは無視
    }
    
    /**
     * 動的インテンシティ設定（空実装）
     */
    setMusicIntensity(intensity) {
        // BGM無効のため何もしない
    }
    
    /**
     * システム更新（空実装）
     */
    update(deltaTime) {
        // BGM無効のため何もしない
    }
    
    /**
     * 効果音作成
     */
    createSounds() {
        const sounds = {};
        
        // 射撃音
        sounds.shoot = () => {
            this.playSound(440, 0.1, 'square', 0.3);
        };
        
        // 敵撃破音
        sounds.enemyHit = () => {
            this.playSound(220, 0.2, 'sawtooth', 0.4);
        };
        
        sounds.enemyKill = () => {
            this.playSound(220, 0.2, 'sawtooth', 0.4);
        };
        
        // アイテム取得音
        sounds.pickup = () => this.playSound(880, 0.3, 'sine', 0.5);
        
        // レベルアップ音
        sounds.levelUp = () => {
            this.playSound(880, 0.8, 'triangle', 0.7);
        };
        
        // アップグレード音
        sounds.upgrade = () => this.playSound(660, 0.4, 'triangle', 0.6);
        
        // ダメージ音
        sounds.damage = () => this.playSound(150, 0.3, 'square', 0.7);
        
        // ヘルス回復音
        sounds.pickupHealth = () => this.playSound(523, 0.5, 'sine', 0.4);
        
        // スピード向上音
        sounds.pickupSpeed = () => this.playSound(784, 0.4, 'triangle', 0.5);
        
        // スーパー武器音（基本版）
        sounds.shootSuperHoming = () => {
            this.playSound(660, 0.15, 'sine', 0.4);
        };
        
        sounds.shootSuperShotgun = () => {
            this.playSound(220, 0.2, 'sawtooth', 0.5);
        };
        
        this.sounds = sounds;
        console.log('🎵 AudioSystem: Simple sound effects created', {
            totalSounds: Object.keys(sounds).length
        });
    }
    
    /**
     * 効果音再生
     * @param {number} frequency - 周波数
     * @param {number} duration - 持続時間
     * @param {string} waveform - 波形
     * @param {number} volume - 音量
     */
    playSound(frequency, duration, waveform = 'sine', volume = 0.5) {
        if (!this.audioContext) {
            console.warn('🎵 AudioSystem: AudioContext not initialized, skipping sound');
            return;
        }
        
        // AudioContext状態確認
        if (this.audioContext.state === 'suspended') {
            this.resumeAudioContext();
        }
        
        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            
            oscillator.type = waveform;
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            
            const finalVolume = this.getCalculatedVolume('sfx', volume);
            gainNode.gain.setValueAtTime(finalVolume, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
            
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);
            
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);
            
        } catch (error) {
            console.error('🎵 AudioSystem: Failed to play sound:', error);
        }
    }
    
    /**
     * 音量設定を読み込み
     */
    loadVolumeSettings() {
        try {
            const savedSettings = localStorage.getItem('audioSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                
                if (settings.master !== undefined) {
                    this.volumeSettings.master = settings.master;
                }
                if (settings.sfx !== undefined) {
                    this.volumeSettings.sfx = settings.sfx;
                }
                
                console.log('🎵 AudioSystem: Volume settings loaded:', this.volumeSettings);
                return true;
            }
        } catch (error) {
            console.error('🎵 AudioSystem: Failed to load volume settings:', error);
        }
        
        console.log('🎵 AudioSystem: Using default volume settings');
        return false;
    }
    
    /**
     * 音量設定を保存
     */
    saveVolumeSettings() {
        try {
            const settings = {
                master: this.volumeSettings.master,
                sfx: this.volumeSettings.sfx
            };
            localStorage.setItem('audioSettings', JSON.stringify(settings));
            console.log('🎵 AudioSystem: Volume settings saved:', settings);
        } catch (error) {
            console.error('🎵 AudioSystem: Failed to save volume settings:', error);
        }
    }
    
    /**
     * システム破棄
     */
    dispose() {
        if (this.audioContext) {
            this.audioContext.close();
        }
        console.log('🎵 AudioSystem: Disposed');
    }
}