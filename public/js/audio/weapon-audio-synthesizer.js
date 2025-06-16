/**
 * WeaponAudioSynthesizer - 武器音響シンセサイザー
 * 物理学ベースの銃声・爆発音・武器音生成
 */
import { ProSFXEngine } from './pro-sfx-engine.js';

export class WeaponAudioSynthesizer {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.proEngine = new ProSFXEngine(audioContext);
        
        // 銃声物理パラメータ
        this.GUNSHOT_PHYSICS = {
            muzzleBlast: {
                frequency: 3500,     // 銃口爆風主周波数
                duration: 0.08,      // 持続時間
                intensity: 0.9       // 強度
            },
            powderExplosion: {
                frequency: 800,      // 火薬爆発周波数
                duration: 0.15,      // 持続時間
                intensity: 0.7       // 強度
            },
            mechanicalAction: {
                frequency: 2200,     // 機械動作周波数
                duration: 0.12,      // 持続時間
                intensity: 0.4       // 強度
            },
            supersonic: {
                frequency: 8000,     // 超音速弾音
                duration: 0.02,      // 持続時間
                intensity: 0.8       // 強度
            }
        };
        
        // 爆発物理パラメータ
        this.EXPLOSION_PHYSICS = {
            shockwave: {
                frequency: 40,       // 衝撃波基本周波数
                duration: 0.3,       // 持続時間
                intensity: 1.0       // 最大強度
            },
            fireball: {
                frequency: 200,      // 火球周波数
                duration: 0.5,       // 持続時間
                intensity: 0.8       // 強度
            },
            debris: {
                frequency: 1500,     // 破片周波数
                duration: 0.8,       // 持続時間
                intensity: 0.6       // 強度
            }
        };
        
        console.log('🔫 WeaponAudioSynthesizer: Professional weapon audio engine ready');
    }
    
    /**
     * 初期化
     */
    async initialize() {
        await this.proEngine.initialize();
        console.log('🔫 WeaponAudioSynthesizer: Weapon audio synthesis ready');
    }
    
    /**
     * プロレベル射撃音生成 (Multi-band Synthesis)
     */
    async synthesizeGunshotPro(weaponType = 'assault_rifle', volume = 0.7) {
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            const masterGain = this.audioContext.createGain();
            masterGain.gain.value = volume;
            
            // === BAND 1: 超音速弾音 (衝撃波) ===
            const supersonicComponents = this.createSupersonicTransient();
            supersonicComponents.forEach(comp => {
                comp.gainNode.connect(masterGain);
                comp.oscillator.start(now);
                comp.oscillator.stop(now + this.GUNSHOT_PHYSICS.supersonic.duration);
            });
            
            // === BAND 2: 銃口爆風 (高域メイン) ===
            const muzzleBlast = this.createMuzzleBlast();
            muzzleBlast.gainNode.connect(masterGain);
            muzzleBlast.oscillator.start(now + 0.001); // 微小遅延
            muzzleBlast.oscillator.stop(now + this.GUNSHOT_PHYSICS.muzzleBlast.duration);
            
            // === BAND 3: 火薬爆発 (中低域) ===
            const powderExplosion = this.createPowderExplosion();
            powderExplosion.gainNode.connect(masterGain);
            powderExplosion.oscillator.start(now + 0.002);
            powderExplosion.oscillator.stop(now + this.GUNSHOT_PHYSICS.powderExplosion.duration);
            
            // === BAND 4: 機械動作音 ===
            const mechanicalNoise = this.createMechanicalAction();
            mechanicalNoise.gainNode.connect(masterGain);
            mechanicalNoise.noise.start(now + 0.01);
            mechanicalNoise.noise.stop(now + this.GUNSHOT_PHYSICS.mechanicalAction.duration);
            
            // === BAND 5: 物理ノイズ成分 ===
            const physicalNoise = this.createPhysicalGunNoise();
            physicalNoise.gainNode.connect(masterGain);
            physicalNoise.noise.start(now);
            physicalNoise.noise.stop(now + 0.06);
            
            // === 心理音響エンハンサー ===
            const enhancer = this.proEngine.createSatisfactionEnhancer();
            masterGain.connect(enhancer.input);
            enhancer.output.connect(this.audioContext.destination);
            
            console.log('🔫 Professional gunshot synthesized with multi-band physics');
            
        } catch (error) {
            console.error('🔫 Failed to synthesize professional gunshot:', error);
        }
    }
    
    /**
     * 超音速弾音成分（衝撃波）
     */
    createSupersonicTransient() {
        const components = [];
        
        // メイン衝撃波
        const mainShock = this.proEngine.createShockwave(
            this.GUNSHOT_PHYSICS.supersonic.frequency,
            this.GUNSHOT_PHYSICS.supersonic.intensity,
            this.GUNSHOT_PHYSICS.supersonic.duration
        );
        components.push(mainShock);
        
        // 倍音衝撃波 (物理的に正確な倍音列)
        for (let i = 2; i <= 4; i++) {
            const harmonic = this.proEngine.createShockwave(
                this.GUNSHOT_PHYSICS.supersonic.frequency * i,
                this.GUNSHOT_PHYSICS.supersonic.intensity / i,
                this.GUNSHOT_PHYSICS.supersonic.duration / i
            );
            components.push(harmonic);
        }
        
        return components;
    }
    
    /**
     * 銃口爆風成分
     */
    createMuzzleBlast() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        const distortion = this.audioContext.createWaveShaper();
        
        // 複雑な波形 (実銃声に近似)
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(
            this.GUNSHOT_PHYSICS.muzzleBlast.frequency, 
            this.audioContext.currentTime
        );
        
        // 周波数スイープ (爆風の物理特性)
        oscillator.frequency.exponentialRampToValueAtTime(
            this.GUNSHOT_PHYSICS.muzzleBlast.frequency * 0.3,
            this.audioContext.currentTime + this.GUNSHOT_PHYSICS.muzzleBlast.duration
        );
        
        // 高域強調フィルター
        filter.type = 'highpass';
        filter.frequency.value = 1500;
        filter.Q.value = 2;
        
        // ハーモニック・ディストーション (火薬爆発の非線形性)
        const curve = new Float32Array(256);
        for (let i = 0; i < 256; i++) {
            const x = (i - 128) / 128;
            curve[i] = Math.tanh(x * 3) * 0.8; // ソフトクリッピング
        }
        distortion.curve = curve;
        distortion.oversample = '4x';
        
        // エンベロープ (急激なアタック、自然な減衰)
        this.proEngine.createADSREnvelope(
            gainNode, 
            0.001,  // 超高速アタック
            0.02,   // 短いディケイ
            0.0,    // サスティンなし
            this.GUNSHOT_PHYSICS.muzzleBlast.duration - 0.021,
            this.GUNSHOT_PHYSICS.muzzleBlast.intensity
        );
        
        oscillator.connect(filter);
        filter.connect(distortion);
        distortion.connect(gainNode);
        
        return { oscillator, gainNode, filter, distortion };
    }
    
    /**
     * 火薬爆発成分
     */
    createPowderExplosion() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // 低周波ランブル
        oscillator.type = 'triangle'; // より滑らかな低音
        oscillator.frequency.setValueAtTime(
            this.GUNSHOT_PHYSICS.powderExplosion.frequency,
            this.audioContext.currentTime
        );
        
        // 火薬燃焼による周波数変化
        oscillator.frequency.exponentialRampToValueAtTime(
            this.GUNSHOT_PHYSICS.powderExplosion.frequency * 0.7,
            this.audioContext.currentTime + this.GUNSHOT_PHYSICS.powderExplosion.duration
        );
        
        // ローパスフィルター (低音強調)
        filter.type = 'lowpass';
        filter.frequency.value = 1200;
        filter.Q.value = 1.5;
        
        // 指数減衰エンベロープ
        this.proEngine.createADSREnvelope(
            gainNode,
            0.005,  // ミディアムアタック
            0.03,   // ディケイ
            0.2,    // サスティン
            this.GUNSHOT_PHYSICS.powderExplosion.duration - 0.035,
            this.GUNSHOT_PHYSICS.powderExplosion.intensity
        );
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        return { oscillator, gainNode, filter };
    }
    
    /**
     * 機械動作成分
     */
    createMechanicalAction() {
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // 金属ノイズバッファ
        const buffer = this.proEngine.createPhysicalNoise(
            this.GUNSHOT_PHYSICS.mechanicalAction.duration, 
            'pink'
        );
        noise.buffer = buffer;
        
        // 金属共鳴フィルター
        filter.type = 'bandpass';
        filter.frequency.value = this.GUNSHOT_PHYSICS.mechanicalAction.frequency;
        filter.Q.value = 8; // 鋭い金属音
        
        // 機械的エンベロープ (安全値使用)
        const MIN_GAIN = 1e-6;
        gainNode.gain.setValueAtTime(MIN_GAIN, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(
            Math.max(MIN_GAIN, this.GUNSHOT_PHYSICS.mechanicalAction.intensity),
            this.audioContext.currentTime + 0.01
        );
        gainNode.gain.exponentialRampToValueAtTime(
            MIN_GAIN,
            this.audioContext.currentTime + this.GUNSHOT_PHYSICS.mechanicalAction.duration
        );
        
        noise.connect(filter);
        filter.connect(gainNode);
        
        return { noise, gainNode, filter };
    }
    
    /**
     * 物理ガンノイズ成分
     */
    createPhysicalGunNoise() {
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // ホワイトノイズベース (ガス噴出音)
        const buffer = this.proEngine.createPhysicalNoise(0.06, 'white');
        noise.buffer = buffer;
        
        // 高域通過 (ガス音強調)
        filter.type = 'highpass';
        filter.frequency.value = 3000;
        filter.Q.value = 0.5;
        
        // 短時間エンベロープ (安全値使用)
        const MIN_GAIN = 1e-6;
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, this.audioContext.currentTime + 0.06);
        
        noise.connect(filter);
        filter.connect(gainNode);
        
        return { noise, gainNode, filter };
    }
    
    /**
     * プロレベル爆発音生成 (物理ベース)
     */
    async synthesizeExplosionPro(explosionType = 'grenade', volume = 0.8) {
        if (!this.audioContext) return;
        
        try {
            const now = this.audioContext.currentTime;
            const masterGain = this.audioContext.createGain();
            masterGain.gain.value = volume;
            
            // === フェーズ1: 衝撃波 ===
            const shockwave = this.createExplosionShockwave();
            shockwave.gainNode.connect(masterGain);
            shockwave.oscillator.start(now);
            shockwave.oscillator.stop(now + this.EXPLOSION_PHYSICS.shockwave.duration);
            
            // === フェーズ2: 火球膨張 ===
            const fireball = this.createFireballExpansion();
            fireball.gainNode.connect(masterGain);
            fireball.oscillator.start(now + 0.01);
            fireball.oscillator.stop(now + this.EXPLOSION_PHYSICS.fireball.duration);
            
            // === フェーズ3: 破片散乱 ===
            const debris = this.createDebrisField();
            debris.forEach(fragment => {
                fragment.gainNode.connect(masterGain);
                fragment.noise.start(now + 0.05 + Math.random() * 0.1);
                fragment.noise.stop(now + this.EXPLOSION_PHYSICS.debris.duration);
            });
            
            // === 物理ノイズ成分 ===
            const explosionNoise = this.createExplosionNoise();
            explosionNoise.gainNode.connect(masterGain);
            explosionNoise.noise.start(now);
            explosionNoise.noise.stop(now + 0.4);
            
            // === 直接出力 ===
            masterGain.connect(this.audioContext.destination);
            
            console.log('💥 Professional explosion synthesized with physical modeling');
            
        } catch (error) {
            console.error('💥 Failed to synthesize professional explosion:', error);
        }
    }
    
    /**
     * 爆発衝撃波成分
     */
    createExplosionShockwave() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // 超低周波衝撃波
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(
            this.EXPLOSION_PHYSICS.shockwave.frequency,
            this.audioContext.currentTime
        );
        
        // 周波数上昇 (圧力波の物理)
        oscillator.frequency.exponentialRampToValueAtTime(
            this.EXPLOSION_PHYSICS.shockwave.frequency * 3,
            this.audioContext.currentTime + 0.05
        );
        
        // その後急降下
        oscillator.frequency.exponentialRampToValueAtTime(
            this.EXPLOSION_PHYSICS.shockwave.frequency * 0.5,
            this.audioContext.currentTime + this.EXPLOSION_PHYSICS.shockwave.duration
        );
        
        // ローパスフィルター
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        filter.Q.value = 0.7;
        
        // 衝撃的エンベロープ
        this.proEngine.createADSREnvelope(
            gainNode,
            0.002,  // 瞬間アタック
            0.05,   // 短いディケイ
            0.0,    // サスティンなし
            this.EXPLOSION_PHYSICS.shockwave.duration - 0.052,
            this.EXPLOSION_PHYSICS.shockwave.intensity
        );
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        return { oscillator, gainNode, filter };
    }
    
    /**
     * 火球膨張成分
     */
    createFireballExpansion() {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // 中域ランブル
        oscillator.type = 'sawtooth';
        oscillator.frequency.setValueAtTime(
            this.EXPLOSION_PHYSICS.fireball.frequency,
            this.audioContext.currentTime
        );
        
        // 火球冷却による周波数降下
        oscillator.frequency.exponentialRampToValueAtTime(
            this.EXPLOSION_PHYSICS.fireball.frequency * 0.3,
            this.audioContext.currentTime + this.EXPLOSION_PHYSICS.fireball.duration
        );
        
        // バンドパスフィルター
        filter.type = 'bandpass';
        filter.frequency.value = 400;
        filter.Q.value = 2;
        
        // 火球エンベロープ
        this.proEngine.createADSREnvelope(
            gainNode,
            0.02,   // 急速アタック
            0.1,    // ディケイ
            0.3,    // サスティン
            this.EXPLOSION_PHYSICS.fireball.duration - 0.12,
            this.EXPLOSION_PHYSICS.fireball.intensity
        );
        
        oscillator.connect(filter);
        filter.connect(gainNode);
        
        return { oscillator, gainNode, filter };
    }
    
    /**
     * 破片散乱成分
     */
    createDebrisField() {
        const fragments = [];
        const fragmentCount = 8;
        
        for (let i = 0; i < fragmentCount; i++) {
            const noise = this.audioContext.createBufferSource();
            const gainNode = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            
            // ランダムメタルノイズ
            const buffer = this.proEngine.createPhysicalNoise(
                0.2 + Math.random() * 0.6, 
                'pink'
            );
            noise.buffer = buffer;
            
            // 破片周波数 (ランダム金属共鳴)
            const fragmentFreq = 800 + Math.random() * 2000;
            filter.type = 'bandpass';
            filter.frequency.value = fragmentFreq;
            filter.Q.value = 3 + Math.random() * 5;
            
            // ランダム減衰 (安全値使用)
            const MIN_GAIN = 1e-6;
            const decayTime = 0.3 + Math.random() * 0.5;
            gainNode.gain.setValueAtTime(0.2 + Math.random() * 0.4, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, this.audioContext.currentTime + decayTime);
            
            noise.connect(filter);
            filter.connect(gainNode);
            
            fragments.push({ noise, gainNode, filter });
        }
        
        return fragments;
    }
    
    /**
     * 爆発ノイズ成分
     */
    createExplosionNoise() {
        const noise = this.audioContext.createBufferSource();
        const gainNode = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        // ブラウンノイズ (爆発特性)
        const buffer = this.proEngine.createPhysicalNoise(0.4, 'brown');
        noise.buffer = buffer;
        
        // 全域通過
        filter.type = 'allpass';
        filter.frequency.value = 1000;
        
        // 爆発的エンベロープ (安全値使用)
        const MIN_GAIN = 1e-6;
        gainNode.gain.setValueAtTime(0.6, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(MIN_GAIN, this.audioContext.currentTime + 0.4);
        
        noise.connect(filter);
        filter.connect(gainNode);
        
        return { noise, gainNode, filter };
    }
    
    /**
     * 武器タイプ別音響カスタマイズ
     */
    getWeaponAcousticProfile(weaponType) {
        const profiles = {
            plasma: {
                muzzleBlast: { frequency: 4500, intensity: 0.7 },
                powderExplosion: { frequency: 600, intensity: 0.5 },
                mechanicalAction: { frequency: 3000, intensity: 0.3 },
                supersonic: { frequency: 12000, intensity: 0.9 }
            },
            superHoming: {
                muzzleBlast: { frequency: 6000, intensity: 0.8 },
                powderExplosion: { frequency: 400, intensity: 0.4 },
                mechanicalAction: { frequency: 4000, intensity: 0.5 },
                supersonic: { frequency: 15000, intensity: 1.0 }
            },
            superShotgun: {
                muzzleBlast: { frequency: 2500, intensity: 1.0 },
                powderExplosion: { frequency: 150, intensity: 0.9 },
                mechanicalAction: { frequency: 1800, intensity: 0.7 },
                supersonic: { frequency: 6000, intensity: 0.6 }
            }
        };
        
        return profiles[weaponType] || profiles.plasma;
    }
    
    /**
     * マスターボリューム設定
     */
    setMasterVolume(volume) {
        this.proEngine.setMasterVolume(volume);
    }
    
    /**
     * シンセサイザー破棄
     */
    dispose() {
        this.proEngine.dispose();
        console.log('🔫 WeaponAudioSynthesizer: Synthesizer disposed');
    }
}