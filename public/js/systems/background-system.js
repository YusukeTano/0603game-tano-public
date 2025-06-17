/**
 * BackgroundSystem - A+C+D統合背景システム
 * 遠景装飾・環境エフェクト・インタラクティブ要素を統合管理
 */

import { BackgroundThemes, BackgroundThemeUtils } from './background-themes.js';

export class BackgroundSystem {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.canvas = game.canvas;
        
        // 現在の背景テーマ
        this.currentTheme = null;
        this.currentStage = 1;
        
        // 遠景要素管理（A案）
        this.distantStructures = [];
        this.structureAnimations = new Map();
        
        // 環境エフェクト管理（C案）
        this.environmentEffects = new Map();
        this.effectTimers = new Map();
        
        // インタラクティブ状態（D案）
        this.interactiveState = {
            comboIntensity: 1.0,
            bossMode: false,
            lastComboCount: 0,
            effectQueue: []
        };
        
        // パフォーマンス設定
        this.performanceSettings = {
            enableDistantStructures: true,
            enableEnvironmentEffects: true,
            enableInteractiveEffects: true,
            maxParticles: 50,
            updateFrequency: 60 // FPS
        };
        
        // 初期化
        this.initializeBackground();
        
        console.log('BackgroundSystem: A+C+D統合背景システム初期化完了');
    }
    
    /**
     * 背景システム初期化
     * @private
     */
    initializeBackground() {
        // ステージ1のテーマを読み込み
        this.loadTheme(1);
        
        // エフェクトタイマーの初期化
        this.effectTimers.set('lightning', 0);
        this.effectTimers.set('pulse', 0);
        this.effectTimers.set('aurora', 0);
    }
    
    /**
     * メイン更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        // ステージ変化の検出
        this.checkStageChange();
        
        // 遠景要素のアニメーション更新
        this.updateDistantStructures(deltaTime);
        
        // 環境エフェクトの更新
        this.updateEnvironmentEffects(deltaTime);
        
        // インタラクティブ要素の更新
        this.updateInteractiveElements(deltaTime);
    }
    
    /**
     * 背景描画メイン処理
     */
    render() {
        if (!this.currentTheme) return;
        
        this.ctx.save();
        
        // レイヤー1: 遠景装飾要素（最背面）
        if (this.performanceSettings.enableDistantStructures) {
            this.renderDistantStructures();
        }
        
        // レイヤー2: 環境エフェクト
        if (this.performanceSettings.enableEnvironmentEffects) {
            this.renderEnvironmentEffects();
        }
        
        // レイヤー3: インタラクティブエフェクト（最前面）
        if (this.performanceSettings.enableInteractiveEffects) {
            this.renderInteractiveEffects();
        }
        
        this.ctx.restore();
    }
    
    /**
     * ステージ変化の検出と背景切り替え
     * @private
     */
    checkStageChange() {
        if (!this.game.stageSystem || !this.game.stageSystem.isSystemReady()) {
            return;
        }
        
        const newStage = this.game.stageSystem.currentStage;
        if (newStage !== this.currentStage) {
            console.log(`BackgroundSystem: Stage change detected ${this.currentStage} -> ${newStage}`);
            this.loadTheme(newStage);
        }
    }
    
    /**
     * 背景テーマの読み込み
     * @param {number} stageNumber - ステージ番号
     */
    loadTheme(stageNumber) {
        this.currentStage = stageNumber;
        this.currentTheme = BackgroundThemeUtils.getThemeByStage(stageNumber);
        
        // 遠景要素の初期化
        this.initializeDistantStructures();
        
        // 環境エフェクトの初期化
        this.initializeEnvironmentEffects();
        
        console.log(`BackgroundSystem: Loaded theme for stage ${stageNumber}:`, this.currentTheme.name);
    }
    
    /**
     * 遠景装飾要素の初期化（A案）
     * @private
     */
    initializeDistantStructures() {
        this.distantStructures = [];
        
        if (!this.currentTheme.distantStructures) return;
        
        this.currentTheme.distantStructures.forEach((config, index) => {
            const structure = {
                id: `${this.currentStage}_${index}`,
                type: config.type,
                x: this.canvas.width * config.x,
                y: this.canvas.height * config.y,
                size: config.size,
                color: config.color,
                rotation: 0,
                rotationSpeed: config.rotation || 0,
                config: config
            };
            
            this.distantStructures.push(structure);
            
            // アニメーション状態を初期化
            this.structureAnimations.set(structure.id, {
                pulse: 0,
                drift: 0,
                glow: 1.0
            });
        });
    }
    
    /**
     * 環境エフェクトの初期化（C案）
     * @private
     */
    initializeEnvironmentEffects() {
        this.environmentEffects.clear();
        
        if (!this.currentTheme.environmentEffects) return;
        
        Object.entries(this.currentTheme.environmentEffects).forEach(([effectName, config]) => {
            if (config.active) {
                this.environmentEffects.set(effectName, {
                    config: config,
                    state: this.createEffectState(effectName, config),
                    lastUpdate: 0
                });
            }
        });
    }
    
    /**
     * エフェクト状態の初期化
     * @param {string} effectName - エフェクト名
     * @param {Object} config - エフェクト設定
     * @returns {Object} エフェクト状態
     * @private
     */
    createEffectState(effectName, config) {
        switch (effectName) {
            case 'aurora':
                return {
                    waveOffset: 0,
                    intensity: config.intensity || 0.2,
                    colors: config.colors || ['#00ff88', '#0088ff']
                };
                
            case 'lightning':
                return {
                    nextStrike: Date.now() + (config.frequency || 3) * 1000,
                    active: false,
                    duration: config.duration || 0.1
                };
                
            case 'nebulaFlow':
                return {
                    offset: 0,
                    speed: config.speed || 0.5,
                    particles: []
                };
                
            case 'neonGlow':
                return {
                    pulsePhase: 0,
                    pulseSpeed: Math.PI * 2 / (config.pulse || 2.0)
                };
                
            default:
                return {};
        }
    }
    
    /**
     * 遠景要素のアニメーション更新
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    updateDistantStructures(deltaTime) {
        this.distantStructures.forEach(structure => {
            const animation = this.structureAnimations.get(structure.id);
            if (!animation) return;
            
            // 回転アニメーション
            if (structure.rotationSpeed > 0) {
                structure.rotation += structure.rotationSpeed * deltaTime;
            }
            
            // パルスアニメーション
            animation.pulse += deltaTime * 0.001; // 1秒周期
            
            // ドリフトアニメーション（微細な浮遊）
            animation.drift += deltaTime * 0.0005;
            
            // グローエフェクト
            if (structure.config.glow) {
                animation.glow = 0.8 + 0.2 * Math.sin(animation.pulse * Math.PI * 2);
            }
        });
    }
    
    /**
     * 環境エフェクトの更新
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    updateEnvironmentEffects(deltaTime) {
        const currentTime = Date.now();
        
        this.environmentEffects.forEach((effect, effectName) => {
            const state = effect.state;
            const config = effect.config;
            
            switch (effectName) {
                case 'aurora':
                    state.waveOffset += deltaTime * 0.001;
                    break;
                    
                case 'lightning':
                    if (currentTime >= state.nextStrike && !state.active) {
                        state.active = true;
                        state.nextStrike = currentTime + (config.frequency || 3) * 1000;
                        setTimeout(() => { state.active = false; }, state.duration * 1000);
                    }
                    break;
                    
                case 'nebulaFlow':
                    state.offset += state.speed * deltaTime * 0.01;
                    if (state.offset > this.canvas.width) {
                        state.offset = -200;
                    }
                    break;
                    
                case 'neonGlow':
                    state.pulsePhase += state.pulseSpeed * deltaTime * 0.001;
                    break;
            }
        });
    }
    
    /**
     * インタラクティブ要素の更新（D案）
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    updateInteractiveElements(deltaTime) {
        if (!this.currentTheme.interactive) return;
        
        // コンボレスポンスの更新
        const currentCombo = this.game.combo ? this.game.combo.count : 0;
        if (currentCombo !== this.interactiveState.lastComboCount) {
            this.handleComboChange(currentCombo);
            this.interactiveState.lastComboCount = currentCombo;
        }
        
        // ボスモードの検出（簡易実装）
        const bossMode = this.detectBossMode();
        if (bossMode !== this.interactiveState.bossMode) {
            this.handleBossModeChange(bossMode);
        }
        
        // インタラクティブ強度の計算
        this.interactiveState.comboIntensity = BackgroundThemeUtils.calculateInteractiveIntensity(
            this.currentTheme, 
            currentCombo
        );
    }
    
    /**
     * コンボ変化の処理
     * @param {number} newCombo - 新しいコンボ数
     * @private
     */
    handleComboChange(newCombo) {
        const threshold = this.currentTheme.interactive?.comboResponse?.threshold || 10;
        
        if (newCombo >= threshold) {
            // 高コンボ時のエフェクト発動
            this.triggerComboEffect();
        }
    }
    
    /**
     * ボスモード変化の処理
     * @param {boolean} bossMode - ボスモード状態
     * @private
     */
    handleBossModeChange(bossMode) {
        this.interactiveState.bossMode = bossMode;
        
        if (bossMode) {
            console.log('BackgroundSystem: Boss mode activated');
            // ボスモード専用エフェクトの開始
        } else {
            console.log('BackgroundSystem: Boss mode deactivated');
        }
    }
    
    /**
     * ボスモードの検出（簡易実装）
     * @returns {boolean} ボスモード状態
     * @private
     */
    detectBossMode() {
        // 簡易実装：ステージの最終ウェーブをボスモードとする
        if (this.game.stageSystem && this.game.stageSystem.isSystemReady()) {
            return this.game.stageSystem.waveInStage === 4;
        }
        return false;
    }
    
    /**
     * コンボエフェクトの発動
     * @private
     */
    triggerComboEffect() {
        const effectName = this.currentTheme.interactive?.comboResponse?.effect;
        if (!effectName) return;
        
        // エフェクトを一時的に強化
        this.interactiveState.effectQueue.push({
            effect: effectName,
            startTime: Date.now(),
            duration: 2000 // 2秒間
        });
    }
    
    /**
     * 遠景装飾要素の描画
     * @private
     */
    renderDistantStructures() {
        this.distantStructures.forEach(structure => {
            this.ctx.save();
            
            const animation = this.structureAnimations.get(structure.id);
            const driftX = Math.sin(animation.drift) * 5;
            const driftY = Math.cos(animation.drift * 0.7) * 3;
            
            this.ctx.translate(structure.x + driftX, structure.y + driftY);
            
            if (structure.rotation > 0) {
                this.ctx.rotate(structure.rotation);
            }
            
            // グローエフェクト
            if (structure.config.glow && animation.glow > 0) {
                this.ctx.shadowBlur = 20 * animation.glow;
                this.ctx.shadowColor = structure.color;
            }
            
            this.ctx.globalAlpha = 0.3 * animation.glow;
            
            // 構造物タイプ別の描画
            this.renderStructureByType(structure);
            
            this.ctx.restore();
        });
    }
    
    /**
     * 構造物タイプ別描画
     * @param {Object} structure - 構造物データ
     * @private
     */
    renderStructureByType(structure) {
        this.ctx.fillStyle = structure.color;
        
        switch (structure.type) {
            case 'spaceStation':
                this.renderSpaceStation(structure);
                break;
                
            case 'planet':
                this.renderPlanet(structure);
                break;
                
            case 'cityscape':
                this.renderCityscape(structure);
                break;
                
            case 'energyTower':
                this.renderEnergyTower(structure);
                break;
                
            case 'quantumPortal':
                this.renderQuantumPortal(structure);
                break;
                
            default:
                // 汎用円形描画
                this.ctx.beginPath();
                this.ctx.arc(0, 0, structure.size / 2, 0, Math.PI * 2);
                this.ctx.fill();
        }
    }
    
    /**
     * 宇宙ステーション描画
     * @param {Object} structure - 構造物データ
     * @private
     */
    renderSpaceStation(structure) {
        const radius = structure.size / 2;
        
        // メイン構造
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // ドッキングポート
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x = Math.cos(angle) * radius * 0.8;
            const y = Math.sin(angle) * radius * 0.8;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius * 0.1, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 中央コア
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 惑星描画
     * @param {Object} structure - 構造物データ
     * @private
     */
    renderPlanet(structure) {
        const radius = structure.size / 2;
        
        // 惑星本体
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 大気層
        if (structure.config.atmosphere) {
            this.ctx.globalAlpha *= 0.3;
            this.ctx.fillStyle = 'rgba(150, 200, 255, 0.3)';
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius * 1.2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 地表の模様
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        for (let i = 0; i < 3; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius * 0.6;
            const x = Math.cos(angle) * distance;
            const y = Math.sin(angle) * distance;
            const size = radius * (0.1 + Math.random() * 0.2);
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * サイバー都市描画
     * @param {Object} structure - 構造物データ
     * @private
     */
    renderCityscape(structure) {
        const width = structure.size.width;
        const height = structure.size.height;
        
        // ビル群の描画
        const buildingCount = 12;
        const buildingWidth = width / buildingCount;
        
        for (let i = 0; i < buildingCount; i++) {
            const buildingHeight = height * (0.3 + Math.random() * 0.7);
            const x = (i - buildingCount / 2) * buildingWidth;
            const y = -buildingHeight / 2;
            
            // ビル本体
            this.ctx.fillRect(x, y, buildingWidth * 0.8, buildingHeight);
            
            // ネオンライン
            if (structure.config.neonSigns) {
                this.ctx.fillStyle = 'rgba(255, 0, 100, 0.6)';
                this.ctx.fillRect(x, y + buildingHeight * 0.2, buildingWidth * 0.8, 2);
                this.ctx.fillRect(x, y + buildingHeight * 0.6, buildingWidth * 0.8, 2);
            }
        }
    }
    
    /**
     * エネルギータワー描画
     * @param {Object} structure - 構造物データ
     * @private
     */
    renderEnergyTower(structure) {
        const height = structure.size;
        const width = height * 0.2;
        
        // タワー本体
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        
        // エネルギーコア
        if (structure.config.electricity) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.beginPath();
            this.ctx.arc(0, -height * 0.3, width * 0.6, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 電気エフェクト（簡易）
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
            this.ctx.lineWidth = 2;
            for (let i = 0; i < 3; i++) {
                const angle = Math.random() * Math.PI * 2;
                const length = width * (1 + Math.random());
                this.ctx.beginPath();
                this.ctx.moveTo(0, -height * 0.3);
                this.ctx.lineTo(Math.cos(angle) * length, -height * 0.3 + Math.sin(angle) * length);
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * 量子ポータル描画
     * @param {Object} structure - 構造物データ
     * @private
     */
    renderQuantumPortal(structure) {
        const radius = structure.size / 2;
        
        // ポータルリング
        this.ctx.strokeStyle = structure.color;
        this.ctx.lineWidth = 8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // ワープエフェクト
        if (structure.config.warp) {
            const animation = this.structureAnimations.get(structure.id);
            for (let i = 0; i < 5; i++) {
                const warpRadius = radius * (0.2 + i * 0.15);
                const alpha = 0.5 - i * 0.1;
                this.ctx.globalAlpha = alpha;
                this.ctx.strokeStyle = `rgba(255, 0, 255, ${alpha})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(0, 0, warpRadius + Math.sin(animation.pulse * 3 + i) * 5, 0, Math.PI * 2);
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * 環境エフェクトの描画
     * @private
     */
    renderEnvironmentEffects() {
        this.environmentEffects.forEach((effect, effectName) => {
            this.ctx.save();
            
            switch (effectName) {
                case 'aurora':
                    this.renderAurora(effect.state, effect.config);
                    break;
                    
                case 'lightning':
                    if (effect.state.active) {
                        this.renderLightning(effect.state, effect.config);
                    }
                    break;
                    
                case 'nebulaFlow':
                    this.renderNebulaFlow(effect.state, effect.config);
                    break;
                    
                case 'neonGlow':
                    this.renderNeonGlow(effect.state, effect.config);
                    break;
                    
                case 'retroGrid':
                    this.renderRetroGrid(effect.state, effect.config);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * オーロラエフェクト描画
     * @param {Object} state - エフェクト状態
     * @param {Object} config - エフェクト設定
     * @private
     */
    renderAurora(state, config) {
        const intensity = state.intensity * this.interactiveState.comboIntensity;
        this.ctx.globalAlpha = intensity;
        
        const colors = state.colors;
        const waveHeight = this.canvas.height * 0.3;
        const waveY = this.canvas.height * 0.1;
        
        colors.forEach((color, index) => {
            const gradient = this.ctx.createLinearGradient(0, waveY, 0, waveY + waveHeight);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.moveTo(0, waveY);
            
            for (let x = 0; x <= this.canvas.width; x += 10) {
                const wave1 = Math.sin((x * 0.01) + (state.waveOffset * 2) + (index * 0.5)) * 20;
                const wave2 = Math.sin((x * 0.005) + (state.waveOffset * 1.5) + (index * 0.3)) * 15;
                const y = waveY + wave1 + wave2;
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.lineTo(this.canvas.width, waveY + waveHeight);
            this.ctx.lineTo(0, waveY + waveHeight);
            this.ctx.closePath();
            this.ctx.fill();
        });
    }
    
    /**
     * 雷エフェクト描画
     * @param {Object} state - エフェクト状態
     * @param {Object} config - エフェクト設定
     * @private
     */
    renderLightning(state, config) {
        // 画面全体を一瞬明るくする
        this.ctx.globalAlpha = 0.3;
        this.ctx.fillStyle = config.color || '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 稲妻の描画
        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = config.color || '#ffffff';
        this.ctx.lineWidth = 3;
        
        for (let i = 0; i < 2; i++) {
            this.ctx.beginPath();
            let x = Math.random() * this.canvas.width;
            let y = 0;
            this.ctx.moveTo(x, y);
            
            while (y < this.canvas.height) {
                x += (Math.random() - 0.5) * 50;
                y += 30 + Math.random() * 40;
                this.ctx.lineTo(x, y);
            }
            
            this.ctx.stroke();
        }
    }
    
    /**
     * 星雲流れエフェクト描画
     * @param {Object} state - エフェクト状態
     * @param {Object} config - エフェクト設定
     * @private
     */
    renderNebulaFlow(state, config) {
        this.ctx.globalAlpha = 0.1;
        this.ctx.fillStyle = config.color || 'rgba(0, 100, 255, 0.1)';
        
        // 流れる雲状のパーティクル
        for (let i = 0; i < 5; i++) {
            const x = state.offset + (i * 200) - 200;
            const y = this.canvas.height * (0.3 + i * 0.1);
            const size = 100 + i * 50;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, size, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * ネオングローエフェクト描画
     * @param {Object} state - エフェクト状態
     * @param {Object} config - エフェクト設定
     * @private
     */
    renderNeonGlow(state, config) {
        const pulseIntensity = 0.5 + 0.5 * Math.sin(state.pulsePhase);
        this.ctx.globalAlpha = pulseIntensity * 0.3;
        
        // ネオンカラーのグロー効果
        const colors = config.colors || ['#ff0080', '#00ff80', '#8000ff'];
        colors.forEach((color, index) => {
            this.ctx.shadowBlur = 30 * pulseIntensity;
            this.ctx.shadowColor = color;
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 2;
            
            // グロー線の描画
            const y = this.canvas.height * (0.2 + index * 0.1);
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        });
    }
    
    /**
     * レトログリッド描画
     * @param {Object} state - エフェクト状態
     * @param {Object} config - エフェクト設定
     * @private
     */
    renderRetroGrid(state, config) {
        this.ctx.globalAlpha = 0.1;
        this.ctx.strokeStyle = config.color || 'rgba(0, 255, 255, 0.05)';
        this.ctx.lineWidth = 1;
        
        const gridSize = 40;
        
        // Tronスタイルグリッド
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    /**
     * インタラクティブエフェクトの描画
     * @private
     */
    renderInteractiveEffects() {
        const currentTime = Date.now();
        
        // エフェクトキューの処理
        this.interactiveState.effectQueue = this.interactiveState.effectQueue.filter(effect => {
            const elapsed = currentTime - effect.startTime;
            if (elapsed > effect.duration) {
                return false; // エフェクト終了
            }
            
            // エフェクトの描画
            this.renderInteractiveEffect(effect, elapsed / effect.duration);
            return true;
        });
        
        // ボスモードエフェクト
        if (this.interactiveState.bossMode) {
            this.renderBossModeEffect();
        }
    }
    
    /**
     * インタラクティブエフェクト描画
     * @param {Object} effect - エフェクト情報
     * @param {number} progress - 進行度（0-1）
     * @private
     */
    renderInteractiveEffect(effect, progress) {
        const intensity = Math.sin(progress * Math.PI) * this.interactiveState.comboIntensity;
        this.ctx.globalAlpha = intensity * 0.5;
        
        switch (effect.effect) {
            case 'brighten_aurora':
                // オーロラを明るくする
                this.ctx.fillStyle = 'rgba(0, 255, 150, 0.1)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height * 0.3);
                break;
                
            case 'neon_intensity':
                // ネオンを強化
                this.ctx.shadowBlur = 50 * intensity;
                this.ctx.shadowColor = '#ff0080';
                this.ctx.strokeStyle = '#ff0080';
                this.ctx.lineWidth = 4;
                this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
                break;
                
            case 'storm_intensity':
                // 嵐エフェクトを強化
                this.ctx.fillStyle = `rgba(255, 255, 0, ${intensity * 0.3})`;
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
        }
    }
    
    /**
     * ボスモードエフェクト描画
     * @private
     */
    renderBossModeEffect() {
        if (!this.currentTheme.interactive?.bossMode) return;
        
        const tint = this.currentTheme.interactive.bossMode.tint;
        const effect = this.currentTheme.interactive.bossMode.effect;
        
        // ボスモード用の画面色調変更
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = tint;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 追加エフェクト
        switch (effect) {
            case 'lightning_flashes':
                if (Math.random() < 0.1) { // 10%の確率で稲妻
                    this.ctx.globalAlpha = 0.5;
                    this.ctx.fillStyle = '#ffffff';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                }
                break;
                
            case 'apocalypse_mode':
                // 終末モードエフェクト
                this.ctx.globalAlpha = 0.3;
                this.ctx.fillStyle = 'rgba(200, 0, 0, 0.3)';
                this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                break;
        }
    }
    
    /**
     * パフォーマンス設定の更新
     * @param {Object} settings - 新しい設定
     */
    updatePerformanceSettings(settings) {
        Object.assign(this.performanceSettings, settings);
        console.log('BackgroundSystem: Performance settings updated', this.performanceSettings);
    }
    
    /**
     * 現在の背景情報を取得
     * @returns {Object} 背景情報
     */
    getBackgroundInfo() {
        return {
            currentStage: this.currentStage,
            themeName: this.currentTheme?.name || 'Unknown',
            distantStructureCount: this.distantStructures.length,
            activeEffectCount: this.environmentEffects.size,
            comboIntensity: this.interactiveState.comboIntensity,
            bossMode: this.interactiveState.bossMode
        };
    }
}