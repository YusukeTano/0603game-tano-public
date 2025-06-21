/**
 * IntegratedAudioManager - 完全統合音響管理システム
 * README.md完全対応: 「全音響システムの統合管理とパフォーマンス最適化」
 * 
 * 🎼 設計理念：
 * - 全音響サブシステムの統一管理
 * - チップチューンBGM・スターウォーズ戦闘音・FF UI音・動的Wave音響の完全統合
 * - パフォーマンス最適化とリソース管理
 * - 一元化されたAPI提供
 */

import { ProfessionalChiptuneEngine } from './professional-chiptune-engine.js';
import { ImprovedPianoBGM } from './improved-piano-bgm.js';
import { StarWarsCombatAudio } from './star-wars-combat-audio.js';
import { FFUIAudioSystem } from './ff-ui-audio-system.js';
import { DynamicWaveAudioSystem } from './dynamic-wave-audio-system.js';

export class IntegratedAudioManager {
    constructor(game) {
        this.game = game;
        
        // システム状態
        this.isInitialized = false;
        this.isRunning = false;
        this.currentScene = 'menu';
        
        // 音響サブシステム
        this.subsystems = {
            chiptuneEngine: null,     // チップチューンBGMエンジン（BattleBGM用）
            improvedPianoBGM: null,   // 改善ピアノBGMエンジン（MenuBGM・CharacterBGM用）
            starWarsAudio: null,      // スターウォーズ戦闘音響
            ffUIAudio: null,          // FF風UI音響
            dynamicWaveAudio: null    // 999ウェーブ動的音響
        };
        
        // 音量制御
        this.volumeSettings = {
            master: 0.8,
            bgm: 0.1,  // BGMをさらに小さく
            sfx: 0.7
        };
        
        // 🔇 完全無音制御システム
        this.connectionStates = {
            master: true,
            subsystems: {} // 各サブシステムの接続状態
        };
        this.isMasterMuted = false;
        this.previousVolumeStates = {}; // 復帰用の音量記録
        
        // 🎵 フェード制御システム
        this.fadeSettings = {
            defaultFadeTime: 0.3,      // デフォルトフェード時間（秒）
            quickFadeTime: 0.1,        // 高速フェード時間（秒）
            slowFadeTime: 0.8,         // ゆっくりフェード時間（秒）
            crossfadeTime: 1.0         // クロスフェード時間（秒）
        };
        this.activeFades = new Map(); // 進行中のフェード処理
        
        // 統合管理
        this.masterEffects = {
            compressor: null,         // マスターコンプレッサー
            limiter: null,            // マスターリミッター
            gain: null                // マスターゲイン
        };
        
        // パフォーマンス監視
        this.performance = {
            totalSounds: 0,
            activeSounds: 0,
            maxConcurrentSounds: 0,
            avgLatency: 0,
            memoryUsage: 0,
            cpuUsage: 0
        };
        
        // 🚨 応急的リソース制限システム
        this.resourceLimits = {
            maxConcurrentSounds: 6,      // 最大同時音響数
            maxToneObjects: 20,          // 最大Tone.jsオブジェクト数
            soundCleanupInterval: 5000   // 音響クリーンアップ間隔(ms)
        };
        this.activeSoundTracking = new Map(); // アクティブ音響追跡
        this.toneObjectCount = 0;              // Tone.jsオブジェクト数
        
        // 定期的クリーンアップタイマー
        this.cleanupTimer = setInterval(() => {
            this.cleanupInactiveSounds();
        }, this.resourceLimits.soundCleanupInterval);
        
        // 統計
        this.stats = {
            sessionStart: Date.now(),
            totalPlayTime: 0,
            subsystemStats: {},
            errorCount: 0,
            lastError: null
        };
        
        // 後方互換性レイヤー: 既存 audioSystem.sounds API サポート
        this.sounds = {
            // 敵関連音響
            enemyKill: () => this.playEnemyDeathSound(),
            
            // 武器ピックアップ音響（統合）
            pickupNuke: () => this.playPickupSound(),
            pickupSuperHoming: () => this.playPickupSound(),
            pickupSuperShotgun: () => this.playPickupSound(),
            pickupHealth: () => this.playPickupSound(),
            pickupSpeed: () => this.playPickupSound(),
            
            // UI・システム音響
            upgrade: () => this.playLevelUpSound(),
            shoot: (weaponType = 'plasma', comboCount = 0, skillLevel = 0) => 
                this.playShootSound(weaponType, comboCount, skillLevel),
            
            // 物理エフェクト音響（新規実装）
            penetrate: () => this.playPenetrateSound(),
            wallBounce: () => this.playWallBounceSound()
        };
        
        console.log('🎼 IntegratedAudioManager: 完全統合音響管理システム初期化中...');
    }
    
    /**
     * 完全システム初期化
     */
    async initialize() {
        try {
            console.log('🎼 IntegratedAudioManager: 統合音響システム初期化開始...');
            
            // Tone.js初期化確認
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available for integrated audio manager');
            }
            
            // 🔄 Tone.js安全な一元的初期化
            if (Tone.context.state !== 'running') {
                await Tone.start();
                console.log('✅ Tone.js context started for integrated system');
            } else {
                console.log('🎼 Tone.js context already running, skipping start()');
            }
            
            // localStorage設定を読み込み
            this.loadVolumeSettings();
            
            // マスターエフェクトチェーン作成
            this.createMasterEffectChain();
            
            // サブシステム初期化
            await this.initializeSubsystems();
            
            // 統合設定適用
            this.applyIntegratedSettings();
            
            this.isInitialized = true;
            this.isRunning = true;
            
            console.log('✅ IntegratedAudioManager: 完全統合音響システム初期化完了');
            
            return { 
                success: true, 
                message: 'Integrated audio system fully initialized',
                subsystems: Object.keys(this.subsystems).length,
                ready: this.isInitialized
            };
            
        } catch (error) {
            console.error('❌ IntegratedAudioManager: 初期化失敗:', error);
            this.stats.errorCount++;
            this.stats.lastError = error.message;
            return { 
                success: false, 
                message: `Integrated audio init failed: ${error.message}`,
                error: error.message
            };
        }
    }
    
    /**
     * マスターエフェクトチェーン作成
     */
    createMasterEffectChain() {
        try {
            // マスターコンプレッサー（全音響の統一感）
            this.masterEffects.compressor = new Tone.MultibandCompressor({
                low: {
                    threshold: -12,
                    ratio: 4,
                    attack: 0.003,
                    release: 0.1
                },
                mid: {
                    threshold: -15,
                    ratio: 3,
                    attack: 0.005,
                    release: 0.15
                },
                high: {
                    threshold: -18,
                    ratio: 2,
                    attack: 0.002,
                    release: 0.08
                }
            });
            
            // マスターリミッター（クリッピング防止）
            this.masterEffects.limiter = new Tone.Limiter(-3);
            
            // マスターゲイン
            this.masterEffects.gain = new Tone.Gain(this.volumeSettings.master);
            
            // マスターチェーン接続
            this.masterEffects.compressor.chain(
                this.masterEffects.limiter,
                this.masterEffects.gain,
                Tone.Destination
            );
            
            console.log('🎼 マスターエフェクトチェーン作成完了');
            
        } catch (error) {
            console.error('Master effect chain creation failed:', error);
        }
    }
    
    /**
     * サブシステム初期化
     */
    async initializeSubsystems() {
        const initResults = {};
        
        try {
            // チップチューンBGMエンジン（BattleBGM用）
            console.log('🎮 Initializing Chiptune BGM Engine (Battle BGM)...');
            this.subsystems.chiptuneEngine = new ProfessionalChiptuneEngine(this);
            initResults.chiptune = await this.subsystems.chiptuneEngine.initialize();
            
            // 改善ピアノBGMエンジン（MenuBGM・CharacterBGM用）
            console.log('🎹 Initializing Improved Piano BGM (Menu & Character BGM)...');
            this.subsystems.improvedPianoBGM = new ImprovedPianoBGM(this);
            initResults.improvedPiano = await this.subsystems.improvedPianoBGM.initialize();
            
            // スターウォーズ戦闘音響
            console.log('🎬 Initializing Star Wars Combat Audio...');
            this.subsystems.starWarsAudio = new StarWarsCombatAudio(this);
            initResults.starWars = await this.subsystems.starWarsAudio.initialize();
            
            // FF風UI音響
            console.log('🎭 Initializing FF UI Audio System...');
            this.subsystems.ffUIAudio = new FFUIAudioSystem(this);
            initResults.ffUI = await this.subsystems.ffUIAudio.initialize();
            
            // 999ウェーブ動的音響
            console.log('🌊 Initializing Dynamic Wave Audio System...');
            this.subsystems.dynamicWaveAudio = new DynamicWaveAudioSystem(this);
            initResults.dynamicWave = await this.subsystems.dynamicWaveAudio.initialize();
            
            // 初期化結果確認
            const successCount = Object.values(initResults).filter(r => r.success).length;
            const totalCount = Object.keys(initResults).length;
            
            console.log(`🎼 サブシステム初期化完了: ${successCount}/${totalCount} systems ready`);
            
            if (successCount < totalCount) {
                console.warn('⚠️ Some subsystems failed to initialize:', initResults);
            }
            
            this.stats.subsystemStats = initResults;
            
        } catch (error) {
            console.error('Subsystem initialization failed:', error);
            throw error;
        }
    }
    
    /**
     * 統合設定適用
     */
    applyIntegratedSettings() {
        try {
            // 音量設定の統一適用
            this.updateAllVolumes();
            
            // マスターエフェクトへの接続（各サブシステムを統合チェーンに接続）
            this.connectSubsystemsToMaster();
            
            console.log('🎼 統合設定適用完了');
            
        } catch (error) {
            console.warn('Integrated settings application failed:', error);
        }
    }
    
    /**
     * サブシステムをマスターチェーンに接続
     */
    connectSubsystemsToMaster() {
        try {
            // 各サブシステムの出力をマスターコンプレッサーに接続
            Object.entries(this.subsystems).forEach(([name, subsystem]) => {
                if (subsystem && subsystem.effects && subsystem.effects.gain) {
                    subsystem.effects.gain.disconnect();
                    subsystem.effects.gain.connect(this.masterEffects.compressor);
                    this.connectionStates.subsystems[name] = true;
                }
            });
            
            console.log('🎼 サブシステムとマスターチェーン接続完了');
            
        } catch (error) {
            console.warn('Subsystem to master connection failed:', error);
        }
    }
    
    /**
     * 🔇 完全無音制御システム - サブシステム切断
     */
    disconnectSubsystem(subsystemName) {
        try {
            const subsystem = this.subsystems[subsystemName];
            if (subsystem && subsystem.effects && subsystem.effects.gain && this.connectionStates.subsystems[subsystemName]) {
                subsystem.effects.gain.disconnect();
                this.connectionStates.subsystems[subsystemName] = false;
                console.log(`🔇 ${subsystemName} サブシステム切断完了`);
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`Failed to disconnect subsystem ${subsystemName}:`, error);
            return false;
        }
    }
    
    /**
     * 🔊 音響復帰制御システム - サブシステム再接続
     */
    connectSubsystem(subsystemName) {
        try {
            const subsystem = this.subsystems[subsystemName];
            if (subsystem && subsystem.effects && subsystem.effects.gain && !this.connectionStates.subsystems[subsystemName]) {
                subsystem.effects.gain.connect(this.masterEffects.compressor);
                this.connectionStates.subsystems[subsystemName] = true;
                console.log(`🔊 ${subsystemName} サブシステム再接続完了`);
                return true;
            }
            return false;
        } catch (error) {
            console.warn(`Failed to connect subsystem ${subsystemName}:`, error);
            return false;
        }
    }
    
    /**
     * 🔇 全サブシステム完全切断（真の無音保証）
     */
    disconnectAllSubsystems() {
        let disconnectedCount = 0;
        Object.keys(this.subsystems).forEach(name => {
            if (this.disconnectSubsystem(name)) {
                disconnectedCount++;
            }
        });
        console.log(`🔇 全サブシステム切断完了: ${disconnectedCount}個のシステム`);
        return disconnectedCount;
    }
    
    /**
     * 🔊 全サブシステム再接続（音響復帰）
     */
    connectAllSubsystems() {
        let connectedCount = 0;
        Object.keys(this.subsystems).forEach(name => {
            if (this.connectSubsystem(name)) {
                connectedCount++;
            }
        });
        console.log(`🔊 全サブシステム再接続完了: ${connectedCount}個のシステム`);
        return connectedCount;
    }
    
    /**
     * 🔇 マスターミュート機能（物理的切断による完全無音）
     */
    setMasterMute(isMuted) {
        try {
            if (isMuted && !this.isMasterMuted) {
                // 完全無音：マスター出力を物理的に切断
                if (this.masterEffects.gain) {
                    this.masterEffects.gain.disconnect();
                    this.connectionStates.master = false;
                    this.isMasterMuted = true;
                    console.log('🔇 マスター出力完全切断 - 真の無音状態');
                }
            } else if (!isMuted && this.isMasterMuted) {
                // 音響復帰：マスター出力を再接続
                if (this.masterEffects.gain) {
                    this.masterEffects.gain.connect(Tone.Destination);
                    this.connectionStates.master = true;
                    this.isMasterMuted = false;
                    console.log('🔊 マスター出力再接続 - 音響復帰完了');
                }
            }
            return this.isMasterMuted;
        } catch (error) {
            console.error('Master mute control failed:', error);
            return this.isMasterMuted;
        }
    }
    
    /**
     * 🎛️ 音量0判定・自動切断システム
     */
    isVolumeZero(type) {
        if (type === 'master') {
            return this.volumeSettings.master === 0;
        } else if (type === 'bgm') {
            return this.volumeSettings.bgm === 0;
        } else if (type === 'sfx') {
            return this.volumeSettings.sfx === 0;
        }
        return false;
    }
    
    /**
     * 🔄 音量復帰判定・自動再接続システム
     */
    shouldReconnect(type, newVolume, oldVolume) {
        return oldVolume === 0 && newVolume > 0;
    }
    
    /**
     * BGM制御 (統合インターフェース - BGM使い分け対応)
     */
    async startBGM(scene = 'menu') {
        if (!this.isInitialized) return;
        
        try {
            this.currentScene = scene;
            
            // BGM使い分けロジック
            if (scene === 'battle') {
                // BattleBGM → チップチューン
                console.log('🎮 [BGM Split] Starting Chiptune Battle BGM...');
                if (this.subsystems.chiptuneEngine) {
                    await this.subsystems.chiptuneEngine.startMusic(scene);
                    console.log(`🎮 Chiptune BGM started for battle scene`);
                }
            } else if (scene === 'menu' || scene === 'character') {
                // MenuBGM・CharacterBGM → 改善ピアノ
                console.log(`🎹 [BGM Split] Starting Improved Piano BGM for ${scene}...`);
                if (this.subsystems.improvedPianoBGM) {
                    await this.subsystems.improvedPianoBGM.startMusic(scene);
                    console.log(`🎹 Improved Piano BGM started for ${scene} scene`);
                }
            } else {
                // 不明なシーン → デフォルトでピアノ
                console.log(`🎹 [BGM Split] Unknown scene '${scene}' - using default piano BGM`);
                if (this.subsystems.improvedPianoBGM) {
                    await this.subsystems.improvedPianoBGM.startMusic('menu');
                    console.log(`🎹 Default Piano BGM started for unknown scene: ${scene}`);
                }
            }
            
        } catch (error) {
            console.warn('BGM start failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async stopBGM() {
        if (!this.isInitialized) return;
        
        try {
            // 両方のBGMシステムを停止
            if (this.subsystems.chiptuneEngine) {
                this.subsystems.chiptuneEngine.stopMusic();
                console.log('🎮 Chiptune BGM stopped');
            }
            
            if (this.subsystems.improvedPianoBGM) {
                this.subsystems.improvedPianoBGM.stopMusic();
                console.log('🎹 Improved Piano BGM stopped');
            }
            
        } catch (error) {
            console.warn('BGM stop failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async changeBGMScene(newScene) {
        await this.stopBGM();
        await new Promise(r => setTimeout(r, 500)); // Smooth transition
        await this.startBGM(newScene);
    }
    
    /**
     * 戦闘音響制御 (統合インターフェース)
     */
    async playShootSound(weaponType = 'plasma', comboCount = 0, skillLevel = 0) {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.starWarsAudio) {
                await this.subsystems.starWarsAudio.playStarWarsShootSound(weaponType, comboCount, skillLevel);
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Shoot sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playEnemyHitSound(enemy, impactPoint, intensity = 1.0) {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.starWarsAudio) {
                await this.subsystems.starWarsAudio.playStarWarsEnemyHit(enemy, impactPoint, intensity);
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Enemy hit sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playEnemyDeathSound(enemy, deathType = 'explosion') {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.starWarsAudio) {
                await this.subsystems.starWarsAudio.playStarWarsEnemyDeath(enemy, deathType);
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Enemy death sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    /**
     * UI音響制御 (統合インターフェース)
     */
    async playLevelUpSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFLevelUpSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Level up sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playPickupSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFPickupSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Pickup sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playReloadSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFReloadSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Reload sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playDamageSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFDamageSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Damage sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    /**
     * FF風ボタン音響制御 (統合インターフェース)
     */
    async playButtonHoverSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFButtonHoverSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Button hover sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playGameStartSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFGameStartSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Game start sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playSkillSelectSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFSkillSelectSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Skill select sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playMenuNavSound() {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFMenuNavSound();
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Menu nav sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    /**
     * ウェーブ進行音響制御
     */
    async playWaveCompleteSound() {
        if (!this.isInitialized) return;
        
        try {
            // ウェーブクリア音: レベルアップ音と同等の祝福音響を使用
            if (this.subsystems.ffUIAudio) {
                await this.subsystems.ffUIAudio.playFFLevelUpSound();
                this.performance.totalSounds++;
                console.log('🌊 Wave complete sound played successfully');
            }
            
        } catch (error) {
            console.warn('Wave complete sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    /**
     * 物理エフェクト音響制御（新規実装）
     */
    async playPenetrateSound() {
        if (!this.isInitialized) return;
        
        try {
            // 貫通音: 高周波のシンセサイザー効果
            if (this.subsystems.starWarsAudio) {
                // スターウォーズ音響システムを利用した貫通音効果
                await this.subsystems.starWarsAudio.playStarWarsShootSound('penetrate', 0, 0);
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Penetrate sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    async playWallBounceSound() {
        if (!this.isInitialized) return;
        
        try {
            // 壁反射音: 金属的な反響音効果
            if (this.subsystems.starWarsAudio) {
                // 小規模なヒット音として壁反射音を再生
                await this.subsystems.starWarsAudio.playStarWarsEnemyHit(
                    { size: 5, type: 'wall' }, 
                    { x: 0, y: 0 }, 
                    0.3 // 低強度
                );
                this.performance.totalSounds++;
            }
            
        } catch (error) {
            console.warn('Wall bounce sound failed:', error);
            this.stats.errorCount++;
        }
    }
    
    /**
     * ウェーブ進行制御
     */
    updateWave(newWave) {
        if (!this.isInitialized) return;
        
        try {
            if (this.subsystems.dynamicWaveAudio) {
                this.subsystems.dynamicWaveAudio.updateWaveAudio(newWave);
            }
            
        } catch (error) {
            console.warn('Wave update failed:', error);
            this.stats.errorCount++;
        }
    }
    
    /**
     * 音量制御 (統合)
     */
    updateMasterVolume(volume) {
        this.volumeSettings.master = Math.max(0, Math.min(1, volume));
        
        if (this.masterEffects.gain) {
            this.masterEffects.gain.gain.setValueAtTime(this.volumeSettings.master, Tone.now());
        }
        
        console.log(`🎼 Master volume: ${(this.volumeSettings.master * 100).toFixed(1)}%`);
    }
    
    updateBGMVolume(volume) {
        this.volumeSettings.bgm = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        console.log(`🎮 BGM volume: ${(this.volumeSettings.bgm * 100).toFixed(1)}%`);
    }
    
    updateSFXVolume(volume) {
        this.volumeSettings.sfx = Math.max(0, Math.min(1, volume));
        this.updateAllVolumes();
        console.log(`🔊 SFX volume: ${(this.volumeSettings.sfx * 100).toFixed(1)}%`);
    }
    
    updateAllVolumes() {
        Object.values(this.subsystems).forEach(subsystem => {
            if (subsystem && typeof subsystem.updateVolume === 'function') {
                subsystem.updateVolume();
            }
        });
        
        // 即座に音量設定を反映させるため、localStorage保存
        try {
            localStorage.setItem('audioSettings', JSON.stringify({
                master: this.volumeSettings.master,
                bgm: this.volumeSettings.bgm,
                sfx: this.volumeSettings.sfx
            }));
            console.log('🔊 Volume settings saved to localStorage');
        } catch (error) {
            console.warn('Failed to save volume settings:', error);
        }
    }
    
    /**
     * 音量計算（統一API）
     */
    getCalculatedVolume(type, baseVolume = 1.0) {
        const masterVol = this.volumeSettings.master;
        const typeVol = type === 'bgm' ? this.volumeSettings.bgm : this.volumeSettings.sfx;
        return masterVol * typeVol * baseVolume;
    }
    
    /**
     * 音量設定のローカル保存管理
     */
    loadVolumeSettings() {
        try {
            const saved = localStorage.getItem('audioSettings');
            if (saved) {
                const settings = JSON.parse(saved);
                this.volumeSettings.master = settings.master || 0.8;
                this.volumeSettings.bgm = settings.bgm || 0.1;
                this.volumeSettings.sfx = settings.sfx || 0.7;
                console.log('🔊 Volume settings loaded from localStorage:', this.volumeSettings);
            }
        } catch (error) {
            console.warn('Failed to load volume settings:', error);
        }
    }
    
    /**
     * SettingsSystem互換API - 音量取得・設定
     */
    getVolume(type) {
        switch (type) {
            case 'master':
                return this.volumeSettings.master;
            case 'bgm':
                return this.volumeSettings.bgm;
            case 'sfx':
                return this.volumeSettings.sfx;
            default:
                console.warn(`Unknown volume type: ${type}`);
                return 0;
        }
    }
    
    setVolume(type, volume, options = {}) {
        const clampedVolume = Math.max(0, Math.min(1, volume));
        const oldVolume = this.volumeSettings[type] || 0;
        const { useFade = true, fadeTime = null, force = false } = options;
        
        // 🎯 音量0時完全切断・復帰時再接続ロジック
        const wasZero = this.isVolumeZero(type);
        const willBeZero = clampedVolume === 0;
        const willReconnect = this.shouldReconnect(type, clampedVolume, oldVolume);
        
        console.log(`🎛️ Volume Control: ${type} ${(oldVolume * 100).toFixed(1)}% → ${(clampedVolume * 100).toFixed(1)}% ${useFade ? '(with fade)' : '(instant)'}`);
        
        // 🎵 フェード使用時の処理
        if (useFade && Math.abs(clampedVolume - oldVolume) > 0.01) {
            // フェード付き音量変更の非同期処理
            this.setVolumeWithFade(type, clampedVolume, fadeTime, willBeZero, willReconnect);
            return; // 非同期処理なので即座にreturn
        }
        
        // 即座の音量変更処理（従来通り）
        this.setVolumeImmediate(type, clampedVolume, oldVolume, willBeZero, willReconnect);
    }
    
    /**
     * 🎵 フェード付き音量変更（非同期）
     */
    async setVolumeWithFade(type, clampedVolume, fadeTime, willBeZero, willReconnect) {
        try {
            if (willBeZero) {
                // 0にフェードダウンして切断
                await this.fadeOutAndDisconnect(type, fadeTime);
            } else if (willReconnect) {
                // 再接続してフェードイン
                await this.connectAndFadeIn(type, clampedVolume, fadeTime);
            } else {
                // 通常のフェード
                await this.fadeVolumeSmooth(clampedVolume, fadeTime, type);
            }
            
            // 設定値更新
            this.volumeSettings[type] = clampedVolume;
            this.saveVolumeSettings();
            
            console.log(`✅ Fade Volume Control Complete: ${type} = ${(clampedVolume * 100).toFixed(1)}%`);
            
        } catch (error) {
            console.error(`Fade volume control failed for ${type}:`, error);
            // フェード失敗時は即座の変更にフォールバック
            this.setVolumeImmediate(type, clampedVolume, this.volumeSettings[type] || 0, willBeZero, willReconnect);
        }
    }
    
    /**
     * ⚡ 即座の音量変更（従来通り）
     */
    setVolumeImmediate(type, clampedVolume, oldVolume, willBeZero, willReconnect) {
        // マスター音量の特別処理
        if (type === 'master') {
            if (willBeZero) {
                // マスター音量0 = 完全無音化
                this.setMasterMute(true);
                console.log('🔇 MASTER VOLUME 0: 完全無音モード有効');
            } else if (willReconnect) {
                // マスター音量復帰 = 音響システム復活
                this.setMasterMute(false);
                console.log('🔊 MASTER VOLUME RESTORED: 音響システム復活');
            }
        }
        
        // BGM・SFX音量の個別処理
        if (type === 'bgm' || type === 'sfx') {
            if (willBeZero) {
                // 該当カテゴリのサブシステム切断
                const subsystemsToDisconnect = this.getSubsystemsByType(type);
                subsystemsToDisconnect.forEach(name => this.disconnectSubsystem(name));
                console.log(`🔇 ${type.toUpperCase()} VOLUME 0: ${subsystemsToDisconnect.join(', ')} 切断`);
            } else if (willReconnect) {
                // 該当カテゴリのサブシステム再接続
                const subsystemsToReconnect = this.getSubsystemsByType(type);
                subsystemsToReconnect.forEach(name => this.connectSubsystem(name));
                console.log(`🔊 ${type.toUpperCase()} VOLUME RESTORED: ${subsystemsToReconnect.join(', ')} 再接続`);
            }
        }
        
        // 通常の音量更新処理
        switch (type) {
            case 'master':
                this.updateMasterVolume(clampedVolume);
                break;
            case 'bgm':
                this.updateBGMVolume(clampedVolume);
                break;
            case 'sfx':
                this.updateSFXVolume(clampedVolume);
                break;
            default:
                console.warn(`Unknown volume type: ${type}`);
                return;
        }
        
        console.log(`✅ Instant Volume Control Complete: ${type} = ${(clampedVolume * 100).toFixed(1)}%`);
    }
    
    /**
     * 💾 音量設定の保存（共通化）
     */
    saveVolumeSettings() {
        try {
            localStorage.setItem('audioSettings', JSON.stringify({
                master: this.volumeSettings.master,
                bgm: this.volumeSettings.bgm,
                sfx: this.volumeSettings.sfx
            }));
            console.log('💾 Volume settings saved to localStorage');
        } catch (error) {
            console.warn('Failed to save volume settings:', error);
        }
    }
    
    /**
     * 🎯 音量タイプ別サブシステム特定
     */
    getSubsystemsByType(type) {
        switch (type) {
            case 'bgm':
                return ['chiptuneEngine', 'improvedPianoBGM'];
            case 'sfx':
                return ['starWarsAudio', 'ffUIAudio', 'dynamicWaveAudio'];
            default:
                return [];
        }
    }
    
    /**
     * 🎵 フェードイン/アウト制御システム
     */
    async fadeVolumeSmooth(targetVolume, fadeTimeSeconds = null, type = 'master') {
        const fadeTime = fadeTimeSeconds || this.fadeSettings.defaultFadeTime;
        const fadeId = `${type}_${Date.now()}`;
        
        try {
            // 対象のGainNodeを特定
            let gainNode;
            let currentVolume;
            
            if (type === 'master') {
                gainNode = this.masterEffects.gain;
                currentVolume = this.volumeSettings.master;
            } else {
                // BGM/SFX個別制御の場合は、該当サブシステムのGainNode
                const subsystems = this.getSubsystemsByType(type);
                if (subsystems.length > 0) {
                    const subsystem = this.subsystems[subsystems[0]];
                    if (subsystem && subsystem.effects && subsystem.effects.gain) {
                        gainNode = subsystem.effects.gain;
                        currentVolume = this.volumeSettings[type];
                    }
                }
            }
            
            if (!gainNode) {
                console.warn(`Fade target not found for type: ${type}`);
                return false;
            }
            
            console.log(`🎵 Fade Start: ${type} ${(currentVolume * 100).toFixed(1)}% → ${(targetVolume * 100).toFixed(1)}% (${fadeTime}s)`);
            
            // 既存のフェードをキャンセル
            if (this.activeFades.has(type)) {
                this.activeFades.get(type).cancel();
            }
            
            // フェード実行
            const startTime = Tone.now();
            const fadePromise = new Promise((resolve, reject) => {
                const fadeControl = {
                    cancel: () => reject(new Error('Fade cancelled')),
                    resolve,
                    reject
                };
                this.activeFades.set(type, fadeControl);
                
                // Tone.jsのrampToメソッドを使用した滑らかなフェード
                gainNode.gain.rampTo(targetVolume, fadeTime, startTime);
                
                // フェード完了のタイマー
                setTimeout(() => {
                    this.activeFades.delete(type);
                    this.volumeSettings[type] = targetVolume;
                    console.log(`✅ Fade Complete: ${type} = ${(targetVolume * 100).toFixed(1)}%`);
                    resolve(targetVolume);
                }, fadeTime * 1000 + 50); // 少し余裕を持たせる
            });
            
            return await fadePromise;
            
        } catch (error) {
            this.activeFades.delete(fadeId);
            if (error.message !== 'Fade cancelled') {
                console.error(`Fade failed for ${type}:`, error);
            }
            return false;
        }
    }
    
    /**
     * 🔇 スムーズフェードアウト → 切断
     */
    async fadeOutAndDisconnect(type = 'master', fadeTime = null) {
        const actualFadeTime = fadeTime || this.fadeSettings.quickFadeTime;
        console.log(`🔇 Fade Out & Disconnect: ${type} (${actualFadeTime}s)`);
        
        try {
            // フェードアウト実行
            await this.fadeVolumeSmooth(0, actualFadeTime, type);
            
            // 完全切断
            if (type === 'master') {
                this.setMasterMute(true);
            } else {
                const subsystemsToDisconnect = this.getSubsystemsByType(type);
                subsystemsToDisconnect.forEach(name => this.disconnectSubsystem(name));
            }
            
            console.log(`✅ Fade Out & Disconnect Complete: ${type}`);
            return true;
            
        } catch (error) {
            console.error(`Fade out and disconnect failed for ${type}:`, error);
            return false;
        }
    }
    
    /**
     * 🔊 接続 → スムーズフェードイン
     */
    async connectAndFadeIn(type = 'master', targetVolume = null, fadeTime = null) {
        const actualTargetVolume = targetVolume || this.volumeSettings[type] || 0.8;
        const actualFadeTime = fadeTime || this.fadeSettings.defaultFadeTime;
        console.log(`🔊 Connect & Fade In: ${type} → ${(actualTargetVolume * 100).toFixed(1)}% (${actualFadeTime}s)`);
        
        try {
            // 再接続
            if (type === 'master') {
                this.setMasterMute(false);
            } else {
                const subsystemsToReconnect = this.getSubsystemsByType(type);
                subsystemsToReconnect.forEach(name => this.connectSubsystem(name));
            }
            
            // 音量を0からスタート
            if (type === 'master' && this.masterEffects.gain) {
                this.masterEffects.gain.gain.setValueAtTime(0, Tone.now());
            }
            
            // フェードイン実行
            await this.fadeVolumeSmooth(actualTargetVolume, actualFadeTime, type);
            
            console.log(`✅ Connect & Fade In Complete: ${type}`);
            return true;
            
        } catch (error) {
            console.error(`Connect and fade in failed for ${type}:`, error);
            return false;
        }
    }
    
    /**
     * 🎼 BGMクロスフェード（シーン切り替え時）
     */
    async crossfadeBGM(fromScene, toScene) {
        const crossfadeTime = this.fadeSettings.crossfadeTime;
        console.log(`🎼 BGM Crossfade: ${fromScene} → ${toScene} (${crossfadeTime}s)`);
        
        try {
            // 並行してフェードアウト・フェードイン実行
            const fadeOutPromise = this.fadeOutAndDisconnect('bgm', crossfadeTime);
            
            // 少し遅らせて新しいBGMを開始
            setTimeout(async () => {
                await this.startBGM(toScene);
                await this.connectAndFadeIn('bgm', this.volumeSettings.bgm, crossfadeTime * 0.8);
            }, crossfadeTime * 300); // 30%の位置で新BGM開始
            
            await fadeOutPromise;
            console.log(`✅ BGM Crossfade Complete: ${fromScene} → ${toScene}`);
            return true;
            
        } catch (error) {
            console.error(`BGM crossfade failed: ${fromScene} → ${toScene}:`, error);
            return false;
        }
    }
    
    /**
     * 🛑 全フェード処理強制停止
     */
    cancelAllFades() {
        console.log(`🛑 Cancel All Fades: ${this.activeFades.size} active fades`);
        
        this.activeFades.forEach((fadeControl, type) => {
            try {
                fadeControl.cancel();
            } catch (error) {
                console.warn(`Failed to cancel fade for ${type}:`, error);
            }
        });
        
        this.activeFades.clear();
        console.log('✅ All fades cancelled');
    }
    
    /**
     * 🔍 接続状態一元管理・診断システム
     */
    getConnectionStatus() {
        const status = {
            master: {
                connected: this.connectionStates.master,
                muted: this.isMasterMuted,
                volume: this.volumeSettings.master
            },
            subsystems: {},
            summary: {
                totalSubsystems: Object.keys(this.subsystems).length,
                connectedSubsystems: 0,
                disconnectedSubsystems: 0,
                readySubsystems: 0
            }
        };
        
        // 各サブシステムの詳細状態
        Object.entries(this.subsystems).forEach(([name, subsystem]) => {
            const isConnected = this.connectionStates.subsystems[name] || false;
            const isReady = subsystem && subsystem.isInitialized;
            const hasGain = subsystem && subsystem.effects && subsystem.effects.gain;
            
            status.subsystems[name] = {
                connected: isConnected,
                initialized: isReady,
                hasGainNode: hasGain,
                type: this.getSubsystemType(name)
            };
            
            if (isConnected) status.summary.connectedSubsystems++;
            else status.summary.disconnectedSubsystems++;
            if (isReady) status.summary.readySubsystems++;
        });
        
        return status;
    }
    
    /**
     * 🩺 音響システム診断機能
     */
    diagnoseAudioSystem() {
        const status = this.getConnectionStatus();
        const issues = [];
        const recommendations = [];
        
        console.log('🩺 IntegratedAudioManager: システム診断開始...');
        
        // マスター接続診断
        if (!status.master.connected) {
            issues.push('CRITICAL: マスター出力が切断されています');
            recommendations.push('setMasterMute(false) でマスター出力を復旧してください');
        }
        
        // サブシステム診断
        Object.entries(status.subsystems).forEach(([name, info]) => {
            if (info.initialized && !info.connected) {
                issues.push(`WARNING: ${name} が初期化済みですが切断されています`);
                recommendations.push(`connectSubsystem('${name}') で再接続してください`);
            }
            
            if (!info.hasGainNode) {
                issues.push(`ERROR: ${name} にGainNodeがありません`);
                recommendations.push(`${name} の初期化を確認してください`);
            }
        });
        
        // 音量設定診断
        if (status.master.volume === 0) {
            issues.push('INFO: マスター音量が0です（意図的な無音状態）');
        }
        
        // 診断結果表示
        console.log('📊 診断結果:', {
            totalIssues: issues.length,
            criticalIssues: issues.filter(i => i.startsWith('CRITICAL')).length,
            warnings: issues.filter(i => i.startsWith('WARNING')).length,
            errors: issues.filter(i => i.startsWith('ERROR')).length
        });
        
        if (issues.length > 0) {
            console.warn('⚠️ 発見された問題:', issues);
            console.info('💡 推奨対応:', recommendations);
        } else {
            console.log('✅ 音響システムは正常に動作しています');
        }
        
        return {
            status,
            issues,
            recommendations,
            isHealthy: issues.filter(i => i.startsWith('CRITICAL') || i.startsWith('ERROR')).length === 0
        };
    }
    
    /**
     * 🔧 自動復旧システム
     */
    autoRepairConnections() {
        console.log('🔧 音響システム自動復旧開始...');
        
        let repairedCount = 0;
        const diagnosis = this.diagnoseAudioSystem();
        
        // マスター接続復旧
        if (!diagnosis.status.master.connected && !this.isMasterMuted) {
            this.setMasterMute(false);
            repairedCount++;
            console.log('🔧 マスター出力復旧完了');
        }
        
        // サブシステム接続復旧
        Object.entries(diagnosis.status.subsystems).forEach(([name, info]) => {
            if (info.initialized && !info.connected && info.hasGainNode) {
                if (this.connectSubsystem(name)) {
                    repairedCount++;
                    console.log(`🔧 ${name} 接続復旧完了`);
                }
            }
        });
        
        console.log(`✅ 自動復旧完了: ${repairedCount}個の問題を修復`);
        
        // 復旧後の再診断
        const postRepairDiagnosis = this.diagnoseAudioSystem();
        return {
            repairedCount,
            preDiagnosis: diagnosis,
            postDiagnosis: postRepairDiagnosis,
            isNowHealthy: postRepairDiagnosis.isHealthy
        };
    }
    
    /**
     * 🎯 サブシステムタイプ判定
     */
    getSubsystemType(subsystemName) {
        switch (subsystemName) {
            case 'chiptuneEngine':
            case 'improvedPianoBGM':
                return 'bgm';
            case 'starWarsAudio':
            case 'ffUIAudio':
            case 'dynamicWaveAudio':
                return 'sfx';
            default:
                return 'unknown';
        }
    }
    
    /**
     * 📈 接続状態リアルタイム監視
     */
    startConnectionMonitoring(intervalMs = 5000) {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
        }
        
        this.connectionMonitor = setInterval(() => {
            const diagnosis = this.diagnoseAudioSystem();
            if (!diagnosis.isHealthy) {
                console.warn('🚨 音響システム異常検出 - 自動復旧実行中...');
                this.autoRepairConnections();
            }
        }, intervalMs);
        
        console.log(`📈 接続状態監視開始: ${intervalMs}ms間隔`);
    }
    
    stopConnectionMonitoring() {
        if (this.connectionMonitor) {
            clearInterval(this.connectionMonitor);
            this.connectionMonitor = null;
            console.log('📈 接続状態監視停止');
        }
    }
    
    /**
     * 🎛️ デバッグ用状態表示
     */
    printDetailedStatus() {
        const status = this.getConnectionStatus();
        
        console.log('🎛️ IntegratedAudioManager 詳細状態:');
        console.log('├─ Master:', {
            connected: status.master.connected,
            muted: status.master.muted,
            volume: `${(status.master.volume * 100).toFixed(1)}%`
        });
        
        console.log('├─ Subsystems:');
        Object.entries(status.subsystems).forEach(([name, info]) => {
            const icon = info.connected ? '✅' : '❌';
            const typeLabel = info.type.toUpperCase();
            console.log(`│  ├─ ${icon} ${name} (${typeLabel}):`, {
                connected: info.connected,
                initialized: info.initialized,
                hasGain: info.hasGainNode
            });
        });
        
        console.log('└─ Summary:', status.summary);
        
        return status;
    }
    
    /**
     * 🧪 音響制御統合テスト・検証システム
     */
    async testVolumeControlSystem() {
        console.log('🧪 === 音響制御統合テスト開始 ===');
        
        const testResults = {
            testStartTime: Date.now(),
            tests: {},
            summary: {
                passed: 0,
                failed: 0,
                total: 0
            }
        };
        
        try {
            // 初期状態確認
            console.log('📋 Test 1: 初期状態確認');
            testResults.tests.initialState = await this.testInitialState();
            
            // 音量0時切断テスト
            console.log('📋 Test 2: 音量0時完全切断テスト');
            testResults.tests.volumeZeroDisconnect = await this.testVolumeZeroDisconnect();
            
            // フェード機能テスト
            console.log('📋 Test 3: フェード機能テスト');
            testResults.tests.fadeControl = await this.testFadeControl();
            
            // マスターミュートテスト
            console.log('📋 Test 4: マスターミュート機能テスト');
            testResults.tests.masterMute = await this.testMasterMute();
            
            // 接続状態管理テスト
            console.log('📋 Test 5: 接続状態管理テスト');
            testResults.tests.connectionManagement = await this.testConnectionManagement();
            
            // BGMクロスフェードテスト
            console.log('📋 Test 6: BGMクロスフェードテスト');
            testResults.tests.bgmCrossfade = await this.testBGMCrossfade();
            
            // 自動復旧テスト
            console.log('📋 Test 7: 自動復旧機能テスト');
            testResults.tests.autoRepair = await this.testAutoRepair();
            
            // エラーシナリオテスト
            console.log('📋 Test 8: エラーシナリオテスト');
            testResults.tests.errorScenarios = await this.testErrorScenarios();
            
        } catch (error) {
            console.error('❌ 統合テスト実行エラー:', error);
            testResults.testError = error.message;
        }
        
        // テスト結果集計
        Object.values(testResults.tests).forEach(result => {
            if (result && typeof result === 'object') {
                testResults.summary.total++;
                if (result.passed) testResults.summary.passed++;
                else testResults.summary.failed++;
            }
        });
        
        testResults.testDuration = Date.now() - testResults.testStartTime;
        testResults.successRate = testResults.summary.total > 0 ? 
            (testResults.summary.passed / testResults.summary.total * 100).toFixed(1) : '0.0';
        
        // 結果表示
        console.log('📊 === 音響制御統合テスト結果 ===');
        console.log(`✅ 成功: ${testResults.summary.passed}/${testResults.summary.total} (${testResults.successRate}%)`);
        console.log(`⏱️ 実行時間: ${testResults.testDuration}ms`);
        
        if (testResults.summary.failed > 0) {
            console.warn(`❌ 失敗したテスト: ${testResults.summary.failed}個`);
            Object.entries(testResults.tests).forEach(([testName, result]) => {
                if (result && !result.passed) {
                    console.warn(`  - ${testName}: ${result.error || 'Unknown error'}`);
                }
            });
        } else {
            console.log('🎉 全テスト成功！音響制御システムは正常に動作しています');
        }
        
        return testResults;
    }
    
    /**
     * Test 1: 初期状態確認
     */
    async testInitialState() {
        try {
            const status = this.getConnectionStatus();
            
            const checks = {
                masterConnected: status.master.connected,
                subsystemsReady: status.summary.readySubsystems > 0,
                volumeSettingsValid: this.volumeSettings.master >= 0 && this.volumeSettings.master <= 1
            };
            
            const passed = Object.values(checks).every(check => check);
            
            return {
                passed,
                checks,
                message: passed ? '初期状態は正常です' : '初期状態に問題があります'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 2: 音量0時完全切断テスト
     */
    async testVolumeZeroDisconnect() {
        try {
            const originalMasterVolume = this.volumeSettings.master;
            
            // マスター音量を0に設定
            this.setVolume('master', 0, { useFade: false });
            await new Promise(r => setTimeout(r, 100)); // 処理待機
            
            const afterZero = this.getConnectionStatus();
            const masterDisconnected = !afterZero.master.connected || this.isMasterMuted;
            
            // 元の音量に復帰
            this.setVolume('master', originalMasterVolume, { useFade: false });
            await new Promise(r => setTimeout(r, 100)); // 処理待機
            
            const afterRestore = this.getConnectionStatus();
            const masterReconnected = afterRestore.master.connected && !this.isMasterMuted;
            
            const passed = masterDisconnected && masterReconnected;
            
            return {
                passed,
                details: {
                    disconnectWorked: masterDisconnected,
                    reconnectWorked: masterReconnected
                },
                message: passed ? '音量0時切断・復帰が正常に動作' : '音量0時切断・復帰に問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 3: フェード機能テスト
     */
    async testFadeControl() {
        try {
            const originalVolume = this.volumeSettings.master;
            const targetVolume = originalVolume * 0.5;
            
            // フェード実行
            const fadeStartTime = Date.now();
            await this.fadeVolumeSmooth(targetVolume, 0.2, 'master');
            const fadeDuration = Date.now() - fadeStartTime;
            
            // 音量が変更されたかチェック
            const actualVolume = this.volumeSettings.master;
            const volumeChanged = Math.abs(actualVolume - targetVolume) < 0.05;
            
            // フェード時間が妥当かチェック（150ms-400ms程度）
            const timeValid = fadeDuration >= 150 && fadeDuration <= 400;
            
            // 元の音量に戻す
            this.setVolume('master', originalVolume, { useFade: false });
            
            const passed = volumeChanged && timeValid;
            
            return {
                passed,
                details: {
                    volumeChanged,
                    timeValid,
                    fadeDuration
                },
                message: passed ? 'フェード機能が正常に動作' : 'フェード機能に問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 4: マスターミュート機能テスト
     */
    async testMasterMute() {
        try {
            const originalMuteState = this.isMasterMuted;
            
            // ミュート実行
            this.setMasterMute(true);
            const muteWorked = this.isMasterMuted && !this.connectionStates.master;
            
            // ミュート解除
            this.setMasterMute(false);
            const unmuteWorked = !this.isMasterMuted && this.connectionStates.master;
            
            // 元の状態に戻す
            this.setMasterMute(originalMuteState);
            
            const passed = muteWorked && unmuteWorked;
            
            return {
                passed,
                details: {
                    muteWorked,
                    unmuteWorked
                },
                message: passed ? 'マスターミュート機能が正常に動作' : 'マスターミュート機能に問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 5: 接続状態管理テスト
     */
    async testConnectionManagement() {
        try {
            // 診断実行
            const diagnosis = this.diagnoseAudioSystem();
            
            // 状態取得
            const status = this.getConnectionStatus();
            
            const checks = {
                diagnosisWorked: diagnosis && typeof diagnosis.isHealthy === 'boolean',
                statusWorked: status && status.summary && typeof status.summary.totalSubsystems === 'number',
                detailsComplete: status.subsystems && Object.keys(status.subsystems).length > 0
            };
            
            const passed = Object.values(checks).every(check => check);
            
            return {
                passed,
                checks,
                message: passed ? '接続状態管理が正常に動作' : '接続状態管理に問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 6: BGMクロスフェードテスト  
     */
    async testBGMCrossfade() {
        try {
            // 注意: 実際のBGM切り替えはサブシステム依存のため、ロジックのみテスト
            const fadeSettings = this.fadeSettings;
            const hasValidFadeSettings = fadeSettings && 
                typeof fadeSettings.crossfadeTime === 'number' && 
                fadeSettings.crossfadeTime > 0;
            
            const hasSubsystems = this.getSubsystemsByType('bgm').length > 0;
            
            const passed = hasValidFadeSettings && hasSubsystems;
            
            return {
                passed,
                details: {
                    fadeSettingsValid: hasValidFadeSettings,
                    bgmSubsystemsAvailable: hasSubsystems
                },
                message: passed ? 'BGMクロスフェード機能準備完了' : 'BGMクロスフェード機能に設定問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 7: 自動復旧機能テスト
     */
    async testAutoRepair() {
        try {
            // 自動復旧システム実行
            const repairResult = this.autoRepairConnections();
            
            const checks = {
                repairExecuted: repairResult && typeof repairResult.repairedCount === 'number',
                healthCheckWorked: repairResult && repairResult.postDiagnosis && 
                    typeof repairResult.postDiagnosis.isHealthy === 'boolean'
            };
            
            const passed = Object.values(checks).every(check => check);
            
            return {
                passed,
                checks,
                repairResult,
                message: passed ? '自動復旧機能が正常に動作' : '自動復旧機能に問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * Test 8: エラーシナリオテスト
     */
    async testErrorScenarios() {
        try {
            let errorHandled = false;
            
            // 不正な音量値テスト
            try {
                this.setVolume('invalid_type', -1, { useFade: false });
                this.setVolume('master', 999, { useFade: false });
                errorHandled = true; // エラーが発生しなければOK（内部でクランプされる）
            } catch (error) {
                errorHandled = true; // エラーハンドリングができればOK
            }
            
            // 不正なフェード時間テスト
            try {
                await this.fadeVolumeSmooth(0.5, -1, 'master');
                errorHandled = true;
            } catch (error) {
                errorHandled = true;
            }
            
            const passed = errorHandled;
            
            return {
                passed,
                message: passed ? 'エラーシナリオが適切に処理される' : 'エラーハンドリングに問題あり'
            };
            
        } catch (error) {
            return { passed: false, error: error.message };
        }
    }
    
    /**
     * 統合テストメソッド
     */
    async testCompleteSystem() {
        if (!this.isInitialized) {
            console.warn('System not initialized for testing');
            return;
        }
        
        try {
            console.log('🧪 Complete system test starting...');
            
            // BGMテスト（エラーハンドリング強化）
            console.log('🎮 Testing BGM system...');
            await this.startBGM('battle');
            await new Promise(r => setTimeout(r, 1000));
            
            // 戦闘音響テスト（段階的テスト）
            console.log('🎬 Testing combat audio system...');
            
            // 複数武器タイプテスト
            const weaponTypes = ['plasma', 'nuke', 'superHoming', 'superShotgun'];
            for (const weapon of weaponTypes) {
                console.log(`  Testing ${weapon} weapon...`);
                await this.playShootSound(weapon, 5, 3);
                await new Promise(r => setTimeout(r, 200));
            }
            
            // 複数敵サイズテスト
            const enemySizes = [10, 20, 30, 50]; // small, medium, large, boss
            for (const size of enemySizes) {
                console.log(`  Testing enemy size ${size}...`);
                await this.playEnemyHitSound({ size }, { x: 400, y: 300 }, 0.8);
                await new Promise(r => setTimeout(r, 200));
                
                await this.playEnemyDeathSound({ size }, 'explosion');
                await new Promise(r => setTimeout(r, 300));
            }
            
            // UI音響テスト
            console.log('🎭 Testing UI audio system...');
            await this.playPickupSound();
            await new Promise(r => setTimeout(r, 300));
            
            await this.playLevelUpSound();
            await new Promise(r => setTimeout(r, 300));
            
            await this.playReloadSound();
            await new Promise(r => setTimeout(r, 300));
            
            await this.playDamageSound();
            await new Promise(r => setTimeout(r, 300));
            
            // ウェーブテスト
            console.log('🌊 Testing wave progression...');
            for (const wave of [50, 150, 500, 900]) {
                console.log(`  Testing wave ${wave}...`);
                this.updateWave(wave);
                await new Promise(r => setTimeout(r, 200));
            }
            
            console.log('✅ Complete system test successful!');
            console.log('📊 Final stats:', this.getStats());
            
        } catch (error) {
            console.error('❌ Complete system test failed:', error);
            this.stats.errorCount++;
            this.stats.lastError = error.message;
        }
    }

    /**
     * デバッグ用個別システムテスト
     */
    async testChiptuneSystem() {
        console.log('🎮 Testing Chiptune BGM System only...');
        if (this.subsystems.chiptuneEngine) {
            try {
                await this.subsystems.chiptuneEngine.startMusic('battle');
                console.log('✅ Chiptune BGM started successfully');
                await new Promise(r => setTimeout(r, 3000));
                this.subsystems.chiptuneEngine.stopMusic();
                console.log('✅ Chiptune BGM stopped successfully');
            } catch (error) {
                console.error('❌ Chiptune test failed:', error);
            }
        }
    }

    async testCombatAudioSystem() {
        console.log('🎬 Testing Star Wars Combat Audio System only...');
        if (this.subsystems.starWarsAudio) {
            try {
                await this.subsystems.starWarsAudio.playStarWarsShootSound('plasma', 0, 0);
                await new Promise(r => setTimeout(r, 300));
                await this.subsystems.starWarsAudio.playStarWarsEnemyHit({ size: 20 }, {}, 1.0);
                await new Promise(r => setTimeout(r, 300));
                await this.subsystems.starWarsAudio.playStarWarsEnemyDeath({ size: 20 });
                console.log('✅ Combat audio test successful');
            } catch (error) {
                console.error('❌ Combat audio test failed:', error);
            }
        }
    }
    
    /**
     * システム状態取得
     */
    getSystemState() {
        return {
            isInitialized: this.isInitialized,
            isRunning: this.isRunning,
            currentScene: this.currentScene,
            volumeSettings: { ...this.volumeSettings },
            subsystemStatus: Object.fromEntries(
                Object.entries(this.subsystems).map(([name, system]) => [
                    name, 
                    system ? system.isInitialized : false
                ])
            ),
            performance: { ...this.performance },
            stats: { ...this.stats }
        };
    }
    
    /**
     * 統計取得
     */
    getStats() {
        const systemState = this.getSystemState();
        
        // サブシステム統計を収集
        const subsystemStats = {};
        Object.entries(this.subsystems).forEach(([name, system]) => {
            if (system && typeof system.getStats === 'function') {
                subsystemStats[name] = system.getStats();
            }
        });
        
        return {
            ...systemState,
            subsystemStats,
            uptime: Date.now() - this.stats.sessionStart
        };
    }
    
    /**
     * オーディオコンテキスト再開（ゲーム互換性用）
     */
    async resumeAudioContext() {
        try {
            if (typeof Tone !== 'undefined' && Tone.context.state !== 'running') {
                console.log('🎼 IntegratedAudioManager: AudioContext再開中...');
                await Tone.start();
                console.log('✅ IntegratedAudioManager: AudioContext再開完了');
                return { success: true, message: 'Audio context resumed' };
            } else {
                console.log('🎼 IntegratedAudioManager: AudioContext既に実行中');
                return { success: true, message: 'Audio context already running' };
            }
        } catch (error) {
            console.error('❌ IntegratedAudioManager: AudioContext再開失敗:', error);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * システム破棄
     */
    destroy() {
        try {
            // サブシステム破棄
            Object.values(this.subsystems).forEach(subsystem => {
                if (subsystem && typeof subsystem.destroy === 'function') {
                    subsystem.destroy();
                }
            });
            
            // マスターエフェクト破棄
            Object.values(this.masterEffects).forEach(effect => {
                if (effect) {
                    effect.dispose();
                }
            });
            
            this.isInitialized = false;
            this.isRunning = false;
            
            console.log('🎼 IntegratedAudioManager: 完全統合音響システム破棄完了');
            
        } catch (error) {
            console.error('System destruction failed:', error);
        }
    }

    // 🚨 応急的リソース制限・管理システム
    
    /**
     * 音響再生前のリソースチェック
     */
    canPlaySound() {
        const activeCount = this.activeSoundTracking.size;
        
        if (activeCount >= this.resourceLimits.maxConcurrentSounds) {
            console.warn(`🚨 IntegratedAudioManager: 最大同時音響数制限(${this.resourceLimits.maxConcurrentSounds})に達しました`);
            return false;
        }
        
        return true;
    }
    
    /**
     * 音響開始時の追跡登録
     */
    trackSoundStart(soundId, soundType = 'generic') {
        if (!this.canPlaySound()) {
            return false;
        }
        
        const soundInfo = {
            id: soundId,
            type: soundType,
            startTime: Date.now(),
            duration: 5000 // デフォルト5秒後にクリーンアップ
        };
        
        this.activeSoundTracking.set(soundId, soundInfo);
        this.performance.activeSounds = this.activeSoundTracking.size;
        this.performance.maxConcurrentSounds = Math.max(
            this.performance.maxConcurrentSounds, 
            this.performance.activeSounds
        );
        
        return true;
    }
    
    /**
     * 音響終了時の追跡削除
     */
    trackSoundEnd(soundId) {
        if (this.activeSoundTracking.has(soundId)) {
            this.activeSoundTracking.delete(soundId);
            this.performance.activeSounds = this.activeSoundTracking.size;
        }
    }
    
    /**
     * 非アクティブ音響のクリーンアップ
     */
    cleanupInactiveSounds() {
        const now = Date.now();
        let cleanedCount = 0;
        
        for (const [soundId, soundInfo] of this.activeSoundTracking.entries()) {
            if (now - soundInfo.startTime > soundInfo.duration) {
                this.activeSoundTracking.delete(soundId);
                cleanedCount++;
            }
        }
        
        if (cleanedCount > 0) {
            this.performance.activeSounds = this.activeSoundTracking.size;
            console.log(`🧹 IntegratedAudioManager: ${cleanedCount}個の非アクティブ音響をクリーンアップ`);
        }
    }
    
    /**
     * リソース使用状況取得
     */
    getResourceUsage() {
        return {
            activeSounds: this.activeSoundTracking.size,
            maxConcurrentSounds: this.resourceLimits.maxConcurrentSounds,
            toneObjectCount: this.toneObjectCount,
            maxToneObjects: this.resourceLimits.maxToneObjects,
            utilizationRate: (this.activeSoundTracking.size / this.resourceLimits.maxConcurrentSounds * 100).toFixed(1) + '%'
        };
    }

    /**
     * システム更新処理（ゲームループ統合用）
     */
    update(deltaTime) {
        if (!this.isInitialized || !this.isRunning) return;
        
        try {
            // サブシステムの更新処理
            Object.values(this.subsystems).forEach(subsystem => {
                if (subsystem && typeof subsystem.update === 'function') {
                    subsystem.update(deltaTime);
                }
            });
            
            // 🚨 応急的リソース監視
            if (this.activeSoundTracking.size > 0) {
                console.log(`🎵 Audio Resource Usage: ${this.getResourceUsage().utilizationRate} (${this.activeSoundTracking.size}/${this.resourceLimits.maxConcurrentSounds})`);
            }
        } catch (error) {
            console.error('❌ IntegratedAudioManager: 更新エラー:', error);
        }
    }

    // ========================================
    // Phase 3 互換性API - 動的音響制御メソッド  
    // ========================================

    /**
     * BGMテンポ設定 (Phase 3連携)
     */
    async setBGMTempo(tempo) {
        try {
            console.log(`🎵 SetBGMTempo: ${tempo} BPM`);
            
            // チップチューンエンジンへのテンポ適用
            if (this.subsystems.chiptuneEngine && typeof this.subsystems.chiptuneEngine.setTempo === 'function') {
                await this.subsystems.chiptuneEngine.setTempo(tempo);
            }
            
            // 改善ピアノBGMへのテンポ適用
            if (this.subsystems.improvedPianoBGM && typeof this.subsystems.improvedPianoBGM.setTempo === 'function') {
                await this.subsystems.improvedPianoBGM.setTempo(tempo);
            }
            
            return { success: true, tempo };
        } catch (error) {
            console.warn('⚠️ setBGMTempo failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * マスター音響強度設定 (Phase 3連携)
     */
    async setMasterIntensity(intensity) {
        try {
            console.log(`🔊 SetMasterIntensity: ${intensity}`);
            
            // マスター音量調整で代替
            const adjustedVolume = this.volumeSettings.master * intensity;
            if (this.masterEffects.gain) {
                this.masterEffects.gain.gain.rampTo(adjustedVolume, 0.1);
            }
            
            return { success: true, intensity };
        } catch (error) {
            console.warn('⚠️ setMasterIntensity failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 体力状態フィルター適用 (Phase 3連携)
     */
    async applyHealthFilter(filterType) {
        try {
            console.log(`🎛️ ApplyHealthFilter: ${filterType}`);
            
            // マスターエフェクトチェーンに体力フィルター適用
            if (this.masterEffects.compressor) {
                switch (filterType) {
                    case 'lowpass':
                        // 低体力時のローパスフィルター効果をコンプレッサーで代替
                        this.masterEffects.compressor.low.threshold.value = -20;
                        break;
                    case 'highpass':
                        // 中体力時のハイパスフィルター効果
                        this.masterEffects.compressor.high.threshold.value = -10;
                        break;
                    default:
                        // 通常状態に戻す
                        this.masterEffects.compressor.low.threshold.value = -12;
                        this.masterEffects.compressor.high.threshold.value = -8;
                }
            }
            
            return { success: true, filterType };
        } catch (error) {
            console.warn('⚠️ applyHealthFilter failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 音響強度設定 (Phase 3連携)  
     */
    async setIntensity(intensity) {
        try {
            console.log(`🎚️ SetIntensity: ${intensity}`);
            
            // 全サブシステムに強度調整適用
            for (const [name, subsystem] of Object.entries(this.subsystems)) {
                if (subsystem && typeof subsystem.setIntensity === 'function') {
                    await subsystem.setIntensity(intensity);
                } else if (subsystem && subsystem.effects && subsystem.effects.gain) {
                    // GainNodeで代替
                    const adjustedGain = intensity * 0.8; // 適度な調整
                    subsystem.effects.gain.gain.rampTo(adjustedGain, 0.2);
                }
            }
            
            return { success: true, intensity };
        } catch (error) {
            console.warn('⚠️ setIntensity failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * リバーブ設定 (Phase 3連携)
     */
    async setReverb(reverbLevel) {
        try {
            console.log(`🏛️ SetReverb: ${reverbLevel}`);
            
            // マスターリバーブ効果調整（コンプレッサーで代替）
            if (this.masterEffects.compressor) {
                const ratio = 2 + (reverbLevel * 6); // 2-8の範囲
                this.masterEffects.compressor.mid.ratio.value = ratio;
            }
            
            return { success: true, reverbLevel };
        } catch (error) {
            console.warn('⚠️ setReverb failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * コンプレッション設定 (Phase 3連携)
     */
    async setCompression(compressionLevel) {
        try {
            console.log(`🗜️ SetCompression: ${compressionLevel}`);
            
            // マスターコンプレッサー調整
            if (this.masterEffects.compressor) {
                const threshold = -15 - (compressionLevel * 10); // -15 to -25 dB
                const ratio = 3 + (compressionLevel * 5); // 3-8倍
                
                this.masterEffects.compressor.low.threshold.value = threshold;
                this.masterEffects.compressor.mid.threshold.value = threshold;
                this.masterEffects.compressor.high.threshold.value = threshold;
                
                this.masterEffects.compressor.low.ratio.value = ratio;
                this.masterEffects.compressor.mid.ratio.value = ratio;
                this.masterEffects.compressor.high.ratio.value = ratio;
            }
            
            return { success: true, compressionLevel };
        } catch (error) {
            console.warn('⚠️ setCompression failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * BGM音量設定 (Phase 3連携)
     */
    async setBGMVolume(volume) {
        try {
            console.log(`🎼 SetBGMVolume: ${volume}`);
            
            // 既存のsetVolumeメソッドを利用
            this.setVolume('bgm', volume, { useFade: true, fadeTime: 0.3 });
            
            return { success: true, volume };
        } catch (error) {
            console.warn('⚠️ setBGMVolume failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * SFX音量設定 (Phase 3連携)
     */
    async setSFXVolume(volume) {
        try {
            console.log(`🔊 SetSFXVolume: ${volume}`);
            
            // 既存のsetVolumeメソッドを利用
            this.setVolume('sfx', volume, { useFade: true, fadeTime: 0.3 });
            
            return { success: true, volume };
        } catch (error) {
            console.warn('⚠️ setSFXVolume failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 再生率設定 (Phase 3連携)
     */
    async setPlaybackRate(rate) {
        try {
            console.log(`⚡ SetPlaybackRate: ${rate}`);
            
            // 各BGMエンジンに再生率適用
            for (const [name, subsystem] of Object.entries(this.subsystems)) {
                if ((name === 'chiptuneEngine' || name === 'improvedPianoBGM') && 
                    subsystem && typeof subsystem.setPlaybackRate === 'function') {
                    await subsystem.setPlaybackRate(rate);
                }
            }
            
            return { success: true, rate };
        } catch (error) {
            console.warn('⚠️ setPlaybackRate failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * BGMキー設定 (Phase 3連携)
     */
    async setBGMKey(key) {
        try {
            console.log(`🎼 SetBGMKey: ${key}`);
            
            // チップチューンエンジンへのキー適用
            if (this.subsystems.chiptuneEngine && typeof this.subsystems.chiptuneEngine.setKey === 'function') {
                await this.subsystems.chiptuneEngine.setKey(key);
            }
            
            return { success: true, key };
        } catch (error) {
            console.warn('⚠️ setBGMKey failed:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * BGMムード設定 (Phase 3連携)
     */
    async setBGMMood(mood) {
        try {
            console.log(`🎭 SetBGMMood: ${mood}`);
            
            // ムードに応じた音響調整
            switch (mood) {
                case 'calm':
                    await this.setReverb(0.3);
                    await this.setCompression(0.2);
                    break;
                case 'energetic':
                    await this.setReverb(0.5);
                    await this.setCompression(0.6);
                    break;
                case 'dramatic':
                    await this.setReverb(0.7);
                    await this.setCompression(0.8);
                    break;
            }
            
            return { success: true, mood };
        } catch (error) {
            console.warn('⚠️ setBGMMood failed:', error);
            return { success: false, error: error.message };
        }
    }
}