/**
 * AudioSystem - 新世代オーディオ管理システム
 * モダンBGM + プロレベル効果音管理のハイブリッドシステム
 */
import { ModernBGMEngine } from '../audio/modern-bgm-engine.js';
import { WeaponAudioSynthesizer } from '../audio/weapon-audio-synthesizer.js';

export class AudioSystem {
    constructor(game) {
        this.game = game;
        
        // モダンBGMエンジン
        this.modernBGM = new ModernBGMEngine(game);
        
        // プロレベル効果音システム
        this.weaponSynthesizer = null;
        
        // 効果音管理（既存機能維持）
        this.audioContext = null;
        this.sounds = {};
        
        // 音量設定
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.3,      // モダンBGM音量を下げる (0.6 → 0.3)
            sfx: 0.3       // 効果音低音量
        };
        
        // 後方互換性フラグ
        this.isBGMPlaying = false;
        this.isInitialized = false;
        
        console.log('🎵 AudioSystem: New generation audio system initialized');
    }
    
    /**
     * システム初期化
     */
    async initAudio() {
        try {
            // AudioContext作成
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // モダンBGMエンジン初期化
            try {
                await this.modernBGM.initialize();
                console.log('✅ Modern BGM Engine initialized successfully');
            } catch (bgmError) {
                console.warn('⚠️ Modern BGM Engine initialization failed, continuing without BGM:', bgmError);
            }
            
            // プロレベル武器音響シンセサイザー初期化
            try {
                this.weaponSynthesizer = new WeaponAudioSynthesizer(this.audioContext);
                await this.weaponSynthesizer.initialize();
                console.log('✅ Weapon Synthesizer initialized successfully');
            } catch (weaponError) {
                console.warn('⚠️ Weapon Synthesizer initialization failed:', weaponError);
                this.weaponSynthesizer = null;
            }
            
            // 効果音作成
            this.createSounds();
            
            // 音量同期
            this.syncVolumeSettings();
            
            this.isInitialized = true;
            console.log('🎵 AudioSystem: Initialization completed', {
                audioContext: !!this.audioContext,
                audioContextState: this.audioContext?.state,
                weaponSynthesizer: !!this.weaponSynthesizer,
                soundsCreated: !!this.sounds.shoot,
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
     * 音量同期
     */
    syncVolumeSettings() {
        this.modernBGM.setVolume('master', this.volumeSettings.master);
        this.modernBGM.setVolume('bgm', this.volumeSettings.bgm);
        console.log('🎵 Modern BGM volume sync completed');
    }
    
    /**
     * BGM開始（モダンシステム）
     */
    async startBGM() {
        if (!this.isInitialized) {
            await this.initAudio();
        }
        
        // AudioContext確認・再開
        await this.resumeAudioContext();
        
        // ステージ番号取得
        const stageNumber = this.game.stageSystem ? 
            this.game.stageSystem.getStageInfo().stage : 1;
        
        // モダンBGMシステムで再生
        try {
            const success = await this.modernBGM.playStage(stageNumber);
            
            if (success) {
                this.isBGMPlaying = true;
                console.log(`🎵 AudioSystem: Modern BGM started for stage ${stageNumber}`);
            }
            
            return success;
        } catch (bgmError) {
            console.warn('⚠️ Modern BGM playback failed:', bgmError);
            return false;
        }
    }
    
    /**
     * BGM一時停止
     */
    pauseBGM() {
        if (!this.isBGMPlaying) {
            console.log('🎵 AudioSystem: BGM not playing, cannot pause');
            return false;
        }
        
        try {
            const success = this.modernBGM.pause();
            if (success) {
                console.log('⏸️ AudioSystem: BGM paused successfully');
            }
            return success;
        } catch (error) {
            console.warn('🎵 AudioSystem: Error pausing BGM:', error);
            return false;
        }
    }
    
    /**
     * BGM再開
     */
    resumeBGM() {
        if (!this.isBGMPlaying) {
            console.log('🎵 AudioSystem: BGM not playing, cannot resume');
            return false;
        }
        
        try {
            const success = this.modernBGM.resume();
            if (success) {
                console.log('▶️ AudioSystem: BGM resumed successfully');
            }
            return success;
        } catch (error) {
            console.warn('🎵 AudioSystem: Error resuming BGM:', error);
            return false;
        }
    }
    
    /**
     * BGM停止
     */
    stopBGM() {
        this.modernBGM.stop();
        this.isBGMPlaying = false;
        console.log('🎵 AudioSystem: Modern BGM stopped');
    }
    
    /**
     * BGM一時停止状態確認
     */
    isBGMPaused() {
        return this.modernBGM.isPaused;
    }
    
    /**
     * BGM状態取得
     */
    getBGMStatus() {
        return {
            isPlaying: this.isBGMPlaying,
            isPaused: this.modernBGM.isPaused,
            currentStage: this.modernBGM.currentStage,
            currentTheme: this.modernBGM.currentTheme?.name || 'None'
        };
    }
    
    /**
     * ステージ1音楽有効化（後方互換）
     */
    enableStage1Music() {
        console.log('🎵 AudioSystem: Stage 1 music enabled (delegating to Modern BGM)');
        this.modernBGM.playStage(1);
        this.isBGMPlaying = true;
    }
    
    /**
     * ステージ1音楽無効化（後方互換）
     */
    disableStage1Music() {
        console.log('🎵 AudioSystem: Stage 1 music disabled');
        this.modernBGM.stop();
        this.isBGMPlaying = false;
    }
    
    /**
     * 音量設定
     * @param {string} type - 音量タイプ
     * @param {number} volume - 音量値 (0.0-1.0)
     */
    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        
        // モダンBGMエンジンに転送
        if (type === 'master' || type === 'bgm') {
            this.modernBGM.setVolume(type, volume);
        }
        
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
     * ゲームイベント通知
     * @param {string} eventType - イベント種別
     * @param {Object} data - イベントデータ
     */
    onGameEvent(eventType, data = {}) {
        try {
            if (this.modernBGM) {
                this.modernBGM.onGameEvent(eventType, data);
            }
        } catch (bgmError) {
            console.warn('⚠️ Modern BGM event handling failed:', bgmError);
        }
    }
    
    /**
     * 動的インテンシティ設定
     * @param {number} intensity - インテンシティ (0.0-1.0)
     */
    setMusicIntensity(intensity) {
        this.modernBGM.setIntensity(intensity);
    }
    
    /**
     * システム更新
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        if (this.isInitialized) {
            this.modernBGM.update(deltaTime);
        }
    }
    
    /**
     * 効果音作成（既存機能維持）
     */
    createSounds() {
        const sounds = {};
        
        // 射撃音: プロレベル物理ベース合成
        sounds.shoot = () => {
            console.log('🔫 Shoot sound called', {
                synthesizer: !!this.weaponSynthesizer,
                audioContext: !!this.audioContext,
                state: this.audioContext?.state
            });
            
            if (!this.weaponSynthesizer) {
                console.warn('🔫 Professional weapon synthesizer not available, using fallback');
                this.playSound(440, 0.1, 'square', 0.3);
                return;
            }
            
            try {
                console.log('🔫 Attempting professional gunshot synthesis...');
                this.weaponSynthesizer.synthesizeGunshotPro('plasma', this.getCalculatedVolume('sfx', 0.7));
                console.log('🔫 Professional gunshot synthesis completed');
            } catch (error) {
                console.error('🔫 Failed to play professional gunshot:', error);
                // フォールバック: シンプル射撃音
                console.log('🔫 Using fallback sound...');
                this.playSound(440, 0.1, 'square', 0.3);
            }
        };
        
        // スーパーホーミング射撃音: プロレベル合成
        sounds.shootSuperHoming = () => {
            if (!this.weaponSynthesizer) {
                this.playSound(660, 0.15, 'sine', 0.4);
                return;
            }
            
            try {
                this.weaponSynthesizer.synthesizeGunshotPro('superHoming', this.getCalculatedVolume('sfx', 0.8));
            } catch (error) {
                console.error('🔫 Failed to play professional super homing sound:', error);
                this.playSound(660, 0.15, 'sine', 0.4);
            }
        };
        
        // スーパーショットガン射撃音: プロレベル合成
        sounds.shootSuperShotgun = () => {
            if (!this.weaponSynthesizer) {
                this.playSound(220, 0.2, 'sawtooth', 0.5);
                return;
            }
            
            try {
                this.weaponSynthesizer.synthesizeGunshotPro('superShotgun', this.getCalculatedVolume('sfx', 0.9));
            } catch (error) {
                console.error('🔫 Failed to play professional super shotgun sound:', error);
                this.playSound(220, 0.2, 'sawtooth', 0.5);
            }
        };
        
        // 敵撃破音: プロレベル物理爆発音
        sounds.enemyHit = () => {
            console.log('💥 Enemy hit sound called');
            if (!this.weaponSynthesizer) {
                console.log('💥 Using fallback hit sound');
                this.playSound(220, 0.2, 'sawtooth', 0.4);
                return;
            }
            
            try {
                console.log('💥 Attempting professional explosion...');
                this.weaponSynthesizer.synthesizeExplosionPro('grenade', this.getCalculatedVolume('sfx', 0.6));
            } catch (error) {
                console.error('💥 Failed to play professional explosion:', error);
                this.playSound(220, 0.2, 'sawtooth', 0.4);
            }
        };
        
        sounds.enemyKill = () => {
            console.log('💀 Enemy kill sound called');
            if (!this.weaponSynthesizer) {
                console.log('💀 Using fallback kill sound');
                this.playSound(220, 0.2, 'sawtooth', 0.4);
                return;
            }
            
            try {
                console.log('💀 Attempting professional explosion...');
                this.weaponSynthesizer.synthesizeExplosionPro('grenade', this.getCalculatedVolume('sfx', 0.6));
            } catch (error) {
                console.error('💀 Failed to play professional explosion:', error);
                this.playSound(220, 0.2, 'sawtooth', 0.4);
            }
        };
        
        // アイテム取得音
        sounds.pickup = () => this.playSound(880, 0.3, 'sine', 0.5);
        
        // レベルアップ音（旧スティンガーシステム削除予定）
        sounds.levelUp = () => {
            // this.bgmController.transitionEngine.playStinger('LEVEL_UP', 5000); // 旧BGMシステム削除予定
            this.playSound(880, 0.8, 'triangle', 0.7); // フォールバック音
            console.log('🎵 Level up sound using fallback (old stinger system disabled)');
        };
        
        // アップグレード音
        sounds.upgrade = () => this.playSound(660, 0.4, 'triangle', 0.6);
        
        // ダメージ音
        sounds.damage = () => this.playSound(150, 0.3, 'square', 0.7);
        
        // ヘルス回復音
        sounds.pickupHealth = () => this.playSound(523, 0.5, 'sine', 0.4);
        
        // スピード向上音
        sounds.pickupSpeed = () => this.playSound(784, 0.4, 'triangle', 0.5);
        
        this.sounds = sounds;
        console.log('🎵 AudioSystem: Sound effects created', {
            shootExists: !!sounds.shoot,
            enemyKillExists: !!sounds.enemyKill,
            totalSounds: Object.keys(sounds).length,
            allSounds: Object.keys(sounds)
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
            console.warn('🎵 AudioSystem: AudioContext suspended, attempting resume');
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
     * 音響フェーズ取得（後方互換）
     * @returns {number} フェーズ番号
     */
    getBGMPhase() {
        // StageSystemから安全にフェーズを取得
        if (this.game.stageSystem && this.game.stageSystem.getStageInfo) {
            const stageInfo = this.game.stageSystem.getStageInfo();
            return Math.floor(stageInfo.wave / 4); // 4ウェーブごとにフェーズ変更
        }
        return 0;
    }
    
    /**
     * デバッグ情報取得
     * @returns {Object} デバッグ情報
     */
    getDebugInfo() {
        return {
            isInitialized: this.isInitialized,
            isBGMPlaying: this.isBGMPlaying,
            volumeSettings: this.volumeSettings,
            bgmController: this.bgmController.getDebugInfo?.() || 'N/A',
            audioContextState: this.audioContext?.state
        };
    }
    
    /**
     * システム破棄
     */
    dispose() {
        this.stopBGM();
        this.modernBGM.dispose();
        
        if (this.weaponSynthesizer) {
            this.weaponSynthesizer.dispose();
        }
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('🎵 AudioSystem: Disposed');
    }
}

