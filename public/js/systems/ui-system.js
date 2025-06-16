/**
 * UISystem - UI管理システム  
 * 画面表示・UI更新・デバイス切替の一元管理
 */
export class UISystem {
    constructor(game) {
        this.game = game; // ゲームへの参照
        
        console.log('UISystem: UI管理システム初期化完了');
    }
    
    /**
     * UIシステム更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        this.updateUI();
        this.updateWASDDisplay();
    }
    
    /**
     * 時間フォーマット
     * @param {number} ms - ミリ秒
     * @returns {string} MM:SS形式の時間文字列
     */
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        return `${minutes.toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
    }
    
    /**
     * 体力数字表示更新 - Threshold-based Styling Pattern
     */
    updateHealthDisplay() {
        const health = this.game.player.health;
        const maxHealth = this.game.player.maxHealth;
        const healthPercent = (health / maxHealth) * 100;
        const healthValue = Math.ceil(health);
        
        // 閾値ベーススタイリング設定（統一カラーパレット使用）
        const thresholds = [
            { min: 0, max: 25, class: 'health-critical', scale: 1.5, color: '#F44336' },  // 危険: --status-danger
            { min: 26, max: 50, class: 'health-low', scale: 1.2, color: '#FF9800' },     // 警告: --status-warning
            { min: 51, max: 75, class: 'health-medium', scale: 1.0, color: '#FFC107' },  // 注意: --status-caution
            { min: 76, max: 100, class: 'health-high', scale: 1.0, color: '#4CAF50' }    // 安全: --status-safe
        ];
        
        const threshold = thresholds.find(t => healthPercent >= t.min && healthPercent <= t.max);
        
        // PC用体力表示
        const healthElement = document.getElementById('health-value');
        if (healthElement && threshold) {
            healthElement.textContent = healthValue;
            
            // CSS クラス適用
            healthElement.className = `health-display ${threshold.class}`;
            
            // CSS Custom Properties による動的スタイリング
            healthElement.style.setProperty('--health-scale', threshold.scale);
            healthElement.style.setProperty('--health-color', threshold.color);
        }
        
        // モバイル用体力表示
        if (this.game.isMobile) {
            const mobileHealthElement = document.getElementById('mobile-health-value');
            if (mobileHealthElement && threshold) {
                mobileHealthElement.textContent = healthValue;
                
                // CSS クラス適用
                mobileHealthElement.className = `health-display mobile-health-display ${threshold.class}`;
                
                // CSS Custom Properties による動的スタイリング
                mobileHealthElement.style.setProperty('--health-scale', threshold.scale);
                mobileHealthElement.style.setProperty('--health-color', threshold.color);
            }
        }
    }
    
    /**
     * WASD表示更新（PC用）
     */
    updateWASDDisplay() {
        if (this.game.isMobile) return;
        
        const keys = ['w', 'a', 's', 'd'];
        const keyCodes = ['KeyW', 'KeyA', 'KeyS', 'KeyD'];
        
        keys.forEach((key, index) => {
            const element = document.getElementById(`wasd-${key}`);
            if (element) {
                if (this.game.inputSystem.state.keys[keyCodes[index]]) {
                    element.classList.add('active');
                } else {
                    element.classList.remove('active');
                }
            }
        });
    }
    
    /**
     * メインUI更新処理
     */
    updateUI() {
        // 体力数字表示 - Threshold-based Styling Pattern
        this.updateHealthDisplay();
        
        // スキルレベル表示更新
        this.updateSkillLevelsDisplay();
        
        // 経験値バー
        const expPercent = (this.game.player.exp / this.game.player.expToNext) * 100;
        const expFill = document.getElementById('exp-fill');
        const levelValue = document.getElementById('level-value');
        
        if (expFill) expFill.style.width = expPercent + '%';
        if (levelValue) levelValue.textContent = this.game.player.level;
        
        if (this.game.isMobile) {
            const mobileExpFill = document.getElementById('mobile-exp-fill');
            const mobileLevel = document.getElementById('mobile-level');
            if (mobileExpFill) mobileExpFill.style.width = expPercent + '%';
            if (mobileLevel) mobileLevel.textContent = this.game.player.level;
        }
        
        // 弾薬表示（現在の武器）
        const weaponInfo = this.game.weaponSystem.getWeaponInfo();
        const currentAmmo = document.getElementById('current-ammo');
        const totalAmmo = document.getElementById('total-ammo');
        const weaponName = document.getElementById('weapon-name');
        
        if (currentAmmo) currentAmmo.textContent = weaponInfo.currentAmmo;
        if (totalAmmo) totalAmmo.textContent = weaponInfo.maxAmmo;
        if (weaponName) weaponName.textContent = weaponInfo.name;
        
        if (this.game.isMobile) {
            const mobileCurrentAmmo = document.getElementById('mobile-current-ammo');
            const mobileTotalAmmo = document.getElementById('mobile-total-ammo');
            if (mobileCurrentAmmo) mobileCurrentAmmo.textContent = weaponInfo.currentAmmo;
            if (mobileTotalAmmo) mobileTotalAmmo.textContent = weaponInfo.maxAmmo;
        }
        
        // その他統計
        const scoreValue = document.getElementById('score-value');
        const waveValue = document.getElementById('wave-value');
        const stageValue = document.getElementById('stage-value');
        const stageProgressBar = document.getElementById('stage-progress-bar');
        const comboValue = document.getElementById('combo-value');
        const timeValue = document.getElementById('time-value');
        
        if (scoreValue) scoreValue.textContent = this.game.stats.score.toLocaleString();
        if (waveValue) waveValue.textContent = this.game.stats.wave;
        
        // ステージ表示更新（StageSystemから取得）
        if (this.game.stageSystem && this.game.stageSystem.isSystemReady()) {
            const stageInfo = this.game.stageSystem.getStageInfo();
            if (stageValue) stageValue.textContent = `${stageInfo.stage}-${stageInfo.wave}`;
            if (stageProgressBar) {
                stageProgressBar.style.width = `${stageInfo.progress * 100}%`;
            }
        } else {
            // フォールバック: StageSystemが利用できない場合
            if (stageValue) stageValue.textContent = this.game.stageSystem ? this.game.stageSystem.getDisplayText() : `1-${this.game.stats.wave}`;
            if (stageProgressBar) stageProgressBar.style.width = '0%';
        }
        if (comboValue) {
            comboValue.textContent = this.game.combo.count;
            // コンボ数に応じて色を変更（統一カラーパレット使用）
            if (this.game.combo.count >= 20) {
                comboValue.style.color = '#9C27B0'; // 紫 (--color-purple)
            } else if (this.game.combo.count >= 10) {
                comboValue.style.color = '#2196F3'; // 青 (--color-blue)
            } else if (this.game.combo.count >= 5) {
                comboValue.style.color = '#4CAF50'; // 緑 (--color-green)
            } else {
                comboValue.style.color = '#FFFFFF'; // 白 (--ui-text)
            }
        }
        if (timeValue) timeValue.textContent = this.formatTime(this.game.stats.gameTime);
        
        if (this.game.isMobile) {
            const mobileScore = document.getElementById('mobile-score');
            if (mobileScore) mobileScore.textContent = this.game.stats.score.toLocaleString();
            
            // モバイル用コンボ表示
            const mobileComboValue = document.getElementById('mobile-combo-value');
            if (mobileComboValue) {
                mobileComboValue.textContent = this.game.combo.count;
                // コンボ数に応じて色を変更（統一カラーパレット使用）
                if (this.game.combo.count >= 20) {
                    mobileComboValue.style.color = '#9C27B0'; // 紫 (--color-purple)
                } else if (this.game.combo.count >= 10) {
                    mobileComboValue.style.color = '#2196F3'; // 青 (--color-blue)
                } else if (this.game.combo.count >= 5) {
                    mobileComboValue.style.color = '#4CAF50'; // 緑 (--color-green)
                } else {
                    mobileComboValue.style.color = '#FFFFFF'; // 白 (--ui-text)
                }
            }
        }
    }
    
    /**
     * デバイス別UI更新
     */
    updateUIForDevice() {
        // 動的にモバイル判定を更新（画面回転考慮）
        const wasMobile = this.game.isMobile;
        this.game.isMobile = this.game.detectMobile();
        
        console.log('Device UI update:', {
            wasMobile,
            isMobile: this.game.isMobile,
            orientation: screen.orientation ? screen.orientation.type : 'unknown',
            windowSize: { w: window.innerWidth, h: window.innerHeight }
        });
        
        const pcUI = document.getElementById('pc-ui');
        const mobileUI = document.getElementById('mobile-ui');
        const screenControls = document.querySelector('.screen-controls');
        const virtualSticks = document.querySelector('.virtual-sticks');
        
        // CSS競合を回避するため、bodyにデバイスクラスを設定
        document.body.classList.remove('device-mobile', 'device-desktop');
        
        if (this.game.isMobile) {
            // モバイルUI表示（CSS !important に対抗）
            document.body.classList.add('device-mobile');
            
            if (pcUI) {
                pcUI.style.display = 'none';
                pcUI.style.visibility = 'hidden';
                pcUI.classList.add('hidden');
            }
            
            if (mobileUI) {
                mobileUI.style.setProperty('display', 'block', 'important');
                mobileUI.style.setProperty('visibility', 'visible', 'important');
                mobileUI.classList.remove('hidden');
                mobileUI.style.zIndex = '100';
                mobileUI.style.pointerEvents = 'auto';
            }
            
            // screen-controlsを確実に表示
            if (screenControls) {
                screenControls.style.setProperty('display', 'flex', 'important');
                screenControls.style.setProperty('visibility', 'visible', 'important');
                screenControls.style.zIndex = '2';
                screenControls.style.pointerEvents = 'auto';
                screenControls.classList.remove('hidden');
            }
            
            // 仮想スティックも確実に表示
            if (virtualSticks) {
                virtualSticks.style.setProperty('display', 'block', 'important');
                virtualSticks.style.setProperty('visibility', 'visible', 'important');
                virtualSticks.style.zIndex = '100';
                virtualSticks.classList.remove('hidden');
            }
            
            console.log('✅ Mobile UI enabled with force display');
        } else {
            // PC UI表示
            document.body.classList.add('device-desktop');
            
            if (mobileUI) {
                mobileUI.style.setProperty('display', 'none', 'important');
                mobileUI.style.visibility = 'hidden';
                mobileUI.classList.add('hidden');
            }
            
            if (pcUI) {
                pcUI.style.setProperty('display', 'block', 'important');
                pcUI.style.setProperty('visibility', 'visible', 'important');
                pcUI.classList.remove('hidden');
                pcUI.style.zIndex = '100';
                pcUI.style.pointerEvents = 'auto';
            }
            
            // screen-controlsを非表示
            if (screenControls) {
                screenControls.style.setProperty('display', 'none', 'important');
                screenControls.style.visibility = 'hidden';
                screenControls.classList.add('hidden');
            }
            
            // 仮想スティックも非表示
            if (virtualSticks) {
                virtualSticks.style.setProperty('display', 'none', 'important');
                virtualSticks.style.visibility = 'hidden';
                virtualSticks.classList.add('hidden');
            }
            
            console.log('✅ PC UI enabled with force display');
        }
        
        // モバイルコントロールの再設定
        if (this.game.isMobile && !wasMobile) {
            this.game.setupMobileControls();
        }
        
        // UI更新後の最終確認（強制適用）
        setTimeout(() => {
            this.forceUIDisplay();
        }, 100);
    }
    
    /**
     * CSS競合を完全に回避するUI強制表示メソッド
     */
    forceUIDisplay() {
        const pcUI = document.getElementById('pc-ui');
        const mobileUI = document.getElementById('mobile-ui');
        const screenControls = document.querySelector('.screen-controls');
        const virtualSticks = document.querySelector('.virtual-sticks');
        
        console.log('🔧 Force UI display check...', {
            isMobile: this.game.isMobile,
            gameState: this.game.gameState
        });
        
        if (this.game.isMobile) {
            // モバイルUIの強制表示
            if (mobileUI && (mobileUI.style.display === 'none' || mobileUI.style.display === '')) {
                console.log('🚨 Forcing mobile UI display');
                mobileUI.style.setProperty('display', 'block', 'important');
                mobileUI.style.setProperty('visibility', 'visible', 'important');
                mobileUI.classList.remove('hidden');
            }
            
            // 仮想スティックの強制表示
            if (virtualSticks && (virtualSticks.style.display === 'none' || virtualSticks.style.display === '')) {
                console.log('🚨 Forcing virtual sticks display');
                virtualSticks.style.setProperty('display', 'block', 'important');
                virtualSticks.style.setProperty('visibility', 'visible', 'important');
                virtualSticks.classList.remove('hidden');
            }
            
            // PCUIの強制非表示
            if (pcUI && pcUI.style.display !== 'none') {
                pcUI.style.setProperty('display', 'none', 'important');
                pcUI.classList.add('hidden');
            }
        } else {
            // PCUIの強制表示
            if (pcUI && (pcUI.style.display === 'none' || pcUI.style.display === '')) {
                console.log('🚨 Forcing PC UI display');
                pcUI.style.setProperty('display', 'block', 'important');
                pcUI.style.setProperty('visibility', 'visible', 'important');
                pcUI.classList.remove('hidden');
            }
            
            // モバイルUIの強制非表示
            if (mobileUI && mobileUI.style.display !== 'none') {
                mobileUI.style.setProperty('display', 'none', 'important');
                mobileUI.classList.add('hidden');
            }
            
            // 仮想スティックの強制非表示
            if (virtualSticks && virtualSticks.style.display !== 'none') {
                virtualSticks.style.setProperty('display', 'none', 'important');
                virtualSticks.classList.add('hidden');
            }
        }
    }
    
    /**
     * 全画面を非表示にする
     */
    hideAllScreens() {
        const screens = ['loading-screen', 'main-menu', 'instructions-screen', 'game-screen', 'gameover-screen'];
        screens.forEach(screen => {
            document.getElementById(screen).classList.add('hidden');
        });
        
        // UI も非表示（ただしゲーム中のモバイルUIは保護）
        document.getElementById('pc-ui').classList.add('hidden');
        
        // モバイルUIはゲーム中で仮想スティックが必要な場合は隠さない
        if (!this.game.isMobile || this.game.gameState !== 'playing') {
            document.getElementById('mobile-ui').classList.add('hidden');
        }
        
        // モーダルも非表示
        document.getElementById('levelup-modal').classList.add('hidden');
        document.getElementById('pause-modal').classList.add('hidden');
    }
    
    /**
     * 特定画面を表示
     * @param {string} screenId - 表示する画面のID
     */
    showScreen(screenId) {
        this.hideAllScreens();
        const screen = document.getElementById(screenId);
        if (screen) {
            screen.classList.remove('hidden');
        }
    }
    
    /**
     * ゲーム画面を表示（startGame用）
     */
    showGameScreen() {
        this.hideAllScreens();
        document.getElementById('game-screen').classList.remove('hidden');
        
        // ゲーム画面にactiveクラスを追加（タッチ制限のため）
        document.getElementById('game-screen').classList.add('active');
        
        // ゲーム中のみbodyにタッチ制限を適用
        document.body.style.touchAction = 'none';
        
        // UI表示（強制適用）
        this.updateUIForDevice(); // デバイス判定を更新
        
        if (this.game.isMobile) {
            const mobileUI = document.getElementById('mobile-ui');
            if (mobileUI) {
                mobileUI.classList.remove('hidden');
                mobileUI.style.setProperty('display', 'block', 'important');
                mobileUI.style.setProperty('visibility', 'visible', 'important');
            }
            
            // 最終的にUIの表示を確実にする（競合回避）
            setTimeout(() => {
                if (this.game.isMobile) {
                    const mobileUI = document.getElementById('mobile-ui');
                    if (mobileUI) {
                        mobileUI.classList.remove('hidden');
                        mobileUI.style.display = 'block';
                        console.log('Final mobile UI display forced');
                    }
                    
                    // 仮想スティックも確実に表示
                    const moveStick = document.getElementById('move-stick');
                    const aimStick = document.getElementById('aim-stick');
                    if (moveStick) {
                        moveStick.style.display = 'block';
                        moveStick.style.visibility = 'visible';
                        moveStick.style.opacity = '1';
                    }
                    if (aimStick) {
                        aimStick.style.display = 'block';
                        aimStick.style.visibility = 'visible';
                        aimStick.style.opacity = '1';
                    }
                    console.log('Final virtual sticks display forced');
                }
            }, 250);
        } else {
            const pcUI = document.getElementById('pc-ui');
            if (pcUI) {
                pcUI.classList.remove('hidden');
                pcUI.style.setProperty('display', 'block', 'important');
                pcUI.style.setProperty('visibility', 'visible', 'important');
            }
        }
    }
    
    /**
     * ゲーム終了画面を表示
     */
    showGameOverScreen() {
        this.hideAllScreens();
        
        // 操作説明画面でもタッチ制限を解除
        document.body.style.touchAction = 'auto';
        document.getElementById('game-screen').classList.remove('active');
        
        // ゲームオーバー画面表示
        document.getElementById('gameover-screen').classList.remove('hidden');
    }
    
    /**
     * メニュー画面を表示
     */
    showMainMenu() {
        this.hideAllScreens();
        
        // タッチ制限を解除
        document.body.style.touchAction = 'auto';
        document.getElementById('game-screen').classList.remove('active');
        
        // メインメニュー表示
        document.getElementById('main-menu').classList.remove('hidden');
    }
    
    /**
     * UIシステムの状態取得
     * @returns {Object} UIシステムの状態
     */
    getUISystemState() {
        return {
            isMobile: this.game.isMobile,
            gameState: this.game.gameState,
            currentScreenVisible: this.getCurrentVisibleScreen()
        };
    }
    
    /**
     * スキルレベル表示更新
     */
    updateSkillLevelsDisplay() {
        const skillTypes = ['damage', 'fireRate', 'bulletSize', 'piercing', 'multiShot', 'bounce', 'homing', 'range', 'itemAttraction', 'luck'];
        
        skillTypes.forEach(skillType => {
            const currentLevel = this.game.player.skillLevels[skillType] || 0;
            
            // PC版スキル表示更新
            const pcSkillElement = document.getElementById(`skill-${skillType}`);
            if (pcSkillElement) {
                const levelSpan = pcSkillElement.querySelector('.skill-level');
                if (levelSpan) {
                    levelSpan.textContent = `Lv.${currentLevel}`;
                }
                
                // レベルに応じたCSSクラス設定
                this.setSkillLevelClass(pcSkillElement, currentLevel);
            }
            
            // モバイル版スキル表示更新
            if (this.game.isMobile) {
                const mobileSkillElement = document.getElementById(`mobile-skill-${skillType}`);
                if (mobileSkillElement) {
                    const levelSpan = mobileSkillElement.querySelector('span');
                    if (levelSpan) {
                        levelSpan.textContent = `Lv.${currentLevel}`;
                    }
                    
                    // レベルに応じたCSSクラス設定
                    this.setSkillLevelClass(mobileSkillElement, currentLevel);
                }
            }
        });
    }
    
    /**
     * スキルレベルに応じたCSSクラスを設定
     * @param {HTMLElement} element - スキル要素
     * @param {number} level - スキルレベル
     */
    setSkillLevelClass(element, level) {
        // 既存のレベルクラスを削除
        element.classList.remove('level-0', 'level-1-3', 'level-4-6', 'level-7-9', 'level-10-14', 'level-15plus');
        
        // レベルに応じたクラスを追加
        if (level === 0) {
            element.classList.add('level-0');
        } else if (level >= 1 && level <= 3) {
            element.classList.add('level-1-3');
        } else if (level >= 4 && level <= 6) {
            element.classList.add('level-4-6');
        } else if (level >= 7 && level <= 9) {
            element.classList.add('level-7-9');
        } else if (level >= 10 && level <= 14) {
            element.classList.add('level-10-14');
        } else if (level >= 15) {
            element.classList.add('level-15plus');
        }
    }
    
    /**
     * スキルレベルアップ時のグロー効果
     * @param {string} skillType - スキルタイプ
     */
    triggerSkillLevelUpGlow(skillType) {
        const pcElement = document.getElementById(`skill-${skillType}`);
        const mobileElement = document.getElementById(`mobile-skill-${skillType}`);
        
        [pcElement, mobileElement].forEach(element => {
            if (element) {
                element.classList.add('level-up-glow');
                setTimeout(() => {
                    element.classList.remove('level-up-glow');
                }, 1500);
            }
        });
    }
    
    /**
     * 現在表示中の画面を取得
     * @returns {string} 現在表示中の画面ID
     * @private
     */
    getCurrentVisibleScreen() {
        const screens = ['loading-screen', 'main-menu', 'instructions-screen', 'game-screen', 'gameover-screen'];
        for (const screenId of screens) {
            const screen = document.getElementById(screenId);
            if (screen && !screen.classList.contains('hidden')) {
                return screenId;
            }
        }
        return 'none';
    }
}