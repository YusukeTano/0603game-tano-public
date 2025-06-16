/**
 * AudioSystem - 新世代オーディオ管理システム
 * BGMController統合 + 効果音管理のハイブリッドシステム
 */
import { BGMController } from '../audio/bgm-controller.js';

export class AudioSystem {
    constructor(game) {
        this.game = game;
        
        // 新BGMシステム
        this.bgmController = new BGMController(game);
        
        // 効果音管理（既存機能維持）
        this.audioContext = null;
        this.sounds = {};
        
        // 音量設定
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.9,      // BGM高音量
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
            
            // BGMController初期化
            await this.bgmController.initialize();
            
            // 効果音作成
            this.createSounds();
            
            // 音量同期
            this.syncVolumeSettings();
            
            this.isInitialized = true;
            console.log('🎵 AudioSystem: Initialization completed');
            
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
        this.bgmController.setVolume('master', this.volumeSettings.master);
        this.bgmController.setVolume('music', this.volumeSettings.bgm);
    }
    
    /**
     * BGM開始（新システム）
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
        
        // 新BGMシステムで再生
        const success = await this.bgmController.playStage(stageNumber);
        
        if (success) {
            this.isBGMPlaying = true;
            console.log(`🎵 AudioSystem: BGM started for stage ${stageNumber}`);
        }
        
        return success;
    }
    
    /**
     * BGM停止
     */
    stopBGM() {
        this.bgmController.stop();
        this.isBGMPlaying = false;
        console.log('🎵 AudioSystem: BGM stopped');
    }
    
    /**
     * ステージ1音楽有効化（後方互換）
     */
    enableStage1Music() {
        console.log('🎵 AudioSystem: Stage 1 music enabled (delegating to BGMController)');
        this.bgmController.playStage(1);
        this.isBGMPlaying = true;
    }
    
    /**
     * ステージ1音楽無効化（後方互換）
     */
    disableStage1Music() {
        console.log('🎵 AudioSystem: Stage 1 music disabled');
        this.bgmController.stop();
        this.isBGMPlaying = false;
    }
    
    /**
     * 音量設定
     * @param {string} type - 音量タイプ
     * @param {number} volume - 音量値 (0.0-1.0)
     */
    setVolume(type, volume) {
        this.volumeSettings[type] = Math.max(0, Math.min(1, volume));
        
        // BGMControllerに転送
        if (type === 'master' || type === 'bgm') {
            this.bgmController.setVolume(type === 'bgm' ? 'music' : type, volume);
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
        this.bgmController.onGameEvent(eventType, data);
    }
    
    /**
     * 動的インテンシティ設定
     * @param {number} intensity - インテンシティ (0.0-1.0)
     */
    setMusicIntensity(intensity) {
        this.bgmController.setIntensity(intensity);
    }
    
    /**
     * システム更新
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        if (this.isInitialized) {
            this.bgmController.update(deltaTime);
        }
    }
    
    /**
     * 効果音作成（既存機能維持）
     */
    createSounds() {
        const sounds = {};
        
        // 射撃音: パンチの効いた複合音
        sounds.shoot = () => {
            if (!this.audioContext) return;
            
            try {
                const now = this.audioContext.currentTime;
                
                // 1. アタック音（クリック感）
                const click = this.audioContext.createOscillator();
                const clickGain = this.audioContext.createGain();
                click.type = 'square';
                click.frequency.value = 1000;
                clickGain.gain.setValueAtTime(this.getCalculatedVolume('sfx', 0.3), now);
                clickGain.gain.exponentialRampToValueAtTime(0.01, now + 0.01);
                click.connect(clickGain);
                clickGain.connect(this.audioContext.destination);
                click.start(now);
                click.stop(now + 0.01);
                
                // 2. メイン音（パワー感）
                const main = this.audioContext.createOscillator();
                const mainGain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                main.type = 'sawtooth';
                main.frequency.setValueAtTime(200, now);
                main.frequency.exponentialRampToValueAtTime(100, now + 0.08);
                filter.type = 'lowpass';
                filter.frequency.value = 800;
                filter.Q.value = 2;
                mainGain.gain.setValueAtTime(this.getCalculatedVolume('sfx', 0.4), now);
                mainGain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                main.connect(filter);
                filter.connect(mainGain);
                mainGain.connect(this.audioContext.destination);
                main.start(now);
                main.stop(now + 0.08);
                
                // 3. 低音補強
                this.playSound(80, 0.05, 'sine', 0.5);
            } catch (error) {
                console.error('🎵 AudioSystem: Failed to play shoot sound:', error);
            }
        };
        
        // スーパーホーミング射撃音
        sounds.shootSuperHoming = () => {
            if (!this.audioContext) return;
            
            try {
                const now = this.audioContext.currentTime;
                
                // 電子音的な高音
                const osc = this.audioContext.createOscillator();
                const gain = this.audioContext.createGain();
                const filter = this.audioContext.createBiquadFilter();
                
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(2000, now);
                osc.frequency.exponentialRampToValueAtTime(800, now + 0.15);
                
                filter.type = 'bandpass';
                filter.frequency.value = 1500;
                filter.Q.value = 5;
                
                gain.gain.setValueAtTime(this.getCalculatedVolume('sfx', 0.4), now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                
                osc.connect(filter);
                filter.connect(gain);
                gain.connect(this.audioContext.destination);
                
                osc.start();
                osc.stop(now + 0.15);
                
                // キラキラ音
                setTimeout(() => this.playSound(1200, 0.05, 'sine', 0.3), 20);
            } catch (error) {
                console.error('🎵 AudioSystem: Failed to play super homing sound:', error);
            }
        };
        
        // スーパーショットガン射撃音
        sounds.shootSuperShotgun = () => {
            if (!this.audioContext) return;
            
            try {
                const now = this.audioContext.currentTime;
                
                // 重低音ブラスト
                this.playSound(60, 0.15, 'sawtooth', 0.7);
                
                // 散弾の金属音
                for (let i = 0; i < 3; i++) {
                    setTimeout(() => {
                        const freq = 300 + Math.random() * 200;
                        this.playSound(freq, 0.02, 'square', 0.3);
                    }, i * 10);
                }
                
                // ノイズバースト
                const noise = this.audioContext.createBufferSource();
                const buffer = this.audioContext.createBuffer(1, 2205, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < data.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                noise.buffer = buffer;
                
                const noiseGain = this.audioContext.createGain();
                noiseGain.gain.setValueAtTime(this.getCalculatedVolume('sfx', 0.4), now);
                noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
                
                noise.connect(noiseGain);
                noiseGain.connect(this.audioContext.destination);
                noise.start();
            } catch (error) {
                console.error('🎵 AudioSystem: Failed to play super shotgun sound:', error);
            }
        };
        
        // 敵撃破音: 満足感のある破壊音
        sounds.enemyHit = () => {
            if (!this.audioContext) return;
            
            try {
                const now = this.audioContext.currentTime;
                
                // 1. インパクト音
                this.playSound(150, 0.05, 'square', 0.6);
                
                // 2. 爆発の広がり
                const explosion = this.audioContext.createOscillator();
                const expGain = this.audioContext.createGain();
                const expFilter = this.audioContext.createBiquadFilter();
                explosion.type = 'sawtooth';
                explosion.frequency.setValueAtTime(300, now);
                explosion.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                expFilter.type = 'lowpass';
                expFilter.frequency.setValueAtTime(2000, now);
                expFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
                expGain.gain.setValueAtTime(this.getCalculatedVolume('sfx', 0.5), now);
                expGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                explosion.connect(expFilter);
                expFilter.connect(expGain);
                expGain.connect(this.audioContext.destination);
                explosion.start(now);
                explosion.stop(now + 0.2);
                
                // 3. 余韻（デブリ音）
                setTimeout(() => {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const freq = 200 + Math.random() * 300;
                            this.playSound(freq, 0.03, 'triangle', 0.2);
                        }, i * 20);
                    }
                }, 50);
            } catch (error) {
                console.error('🎵 AudioSystem: Failed to play enemy hit sound:', error);
            }
        };
        
        sounds.enemyKill = () => {
            if (!this.audioContext) return;
            
            try {
                const now = this.audioContext.currentTime;
                
                // 1. インパクト音
                this.playSound(150, 0.05, 'square', 0.6);
                
                // 2. 爆発の広がり
                const explosion = this.audioContext.createOscillator();
                const expGain = this.audioContext.createGain();
                const expFilter = this.audioContext.createBiquadFilter();
                explosion.type = 'sawtooth';
                explosion.frequency.setValueAtTime(300, now);
                explosion.frequency.exponentialRampToValueAtTime(50, now + 0.2);
                expFilter.type = 'lowpass';
                expFilter.frequency.setValueAtTime(2000, now);
                expFilter.frequency.exponentialRampToValueAtTime(200, now + 0.2);
                expGain.gain.setValueAtTime(this.getCalculatedVolume('sfx', 0.5), now);
                expGain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                explosion.connect(expFilter);
                expFilter.connect(expGain);
                expGain.connect(this.audioContext.destination);
                explosion.start(now);
                explosion.stop(now + 0.2);
                
                // 3. 余韻（デブリ音）
                setTimeout(() => {
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const freq = 200 + Math.random() * 300;
                            this.playSound(freq, 0.03, 'triangle', 0.2);
                        }, i * 20);
                    }
                }, 50);
            } catch (error) {
                console.error('🎵 AudioSystem: Failed to play enemy kill sound:', error);
            }
        };
        
        // アイテム取得音
        sounds.pickup = () => this.playSound(880, 0.3, 'sine', 0.5);
        
        // レベルアップ音（スティンガー使用）
        sounds.levelUp = () => {
            this.bgmController.transitionEngine.playStinger('LEVEL_UP', 5000);
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
        console.log('🎵 AudioSystem: Sound effects created');
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
        this.bgmController.dispose();
        
        if (this.audioContext) {
            this.audioContext.close();
        }
        
        console.log('🎵 AudioSystem: Disposed');
    }
}

// BGMControllerのデバッグ情報取得メソッド追加
BGMController.prototype.getDebugInfo = function() {
    return {
        isInitialized: this.isInitialized,
        isPlaying: this.isPlaying,
        currentStage: this.currentStage,
        currentIntensity: this.currentIntensity,
        stateMachine: this.stateMachine?.getDebugInfo?.() || 'N/A',
        instrumentBank: {
            activeInstruments: this.instrumentBank?.getActiveInstruments?.() || []
        },
        transitionEngine: this.transitionEngine?.getDebugInfo?.() || 'N/A'
    };
};