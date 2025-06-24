/**
 * UISystem - UI管理システム  
 * 画面表示・UI更新・デバイス切替の一元管理
 */
export class UISystem {
    constructor(game) {
        this.game = game; // ゲームへの参照
        
        // ウェーブクリア演出管理
        this.currentWaveClearEffect = null;
        this.waveClearTimeoutId = null;
        
        // 🎆 初期化時に新システムを確実に適用
        setTimeout(() => {
            this.removeOldEnemyCountDisplay();
            this.ensureMiddleAreaSystem();
        }, 100); // DOM読み込み完了を待つ
        
        console.log('UISystem: UI管理システム初期化完了');
        console.log('🚀 Smart Position System for Wave Progress: Ready');
        console.log('🎆 新中間エリアシステム: 初期化中...');
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
            // コンボ数に応じて色を変更（新色系列：グレー→青→緑→赤→金）
            if (this.game.combo.count >= 24) {
                comboValue.style.color = '#FF9800'; // 金 (--color-gold)
            } else if (this.game.combo.count >= 18) {
                comboValue.style.color = '#F44336'; // 赤 (--color-red)
            } else if (this.game.combo.count >= 12) {
                comboValue.style.color = '#4CAF50'; // 緑 (--color-green)
            } else if (this.game.combo.count >= 6) {
                comboValue.style.color = '#2196F3'; // 青 (--color-blue)
            } else {
                comboValue.style.color = '#FFFFFF'; // 白 (--ui-text)
            }
        }
        if (timeValue) timeValue.textContent = this.formatTime(this.game.stats.gameTime);
        
        if (this.game.isMobile) {
            const mobileScore = document.getElementById('mobile-score');
            if (mobileScore) mobileScore.textContent = this.game.stats.score.toLocaleString();
            
            // 旧システム削除（毎フレーム確認）
            this.removeOldEnemyCountDisplay();
            
            // モバイル用Wave Progress 中間エリア更新
            this.updateMiddleAreaWaveProgress();
            
            // モバイル用コンボ表示
            const mobileComboValue = document.getElementById('mobile-combo-value');
            if (mobileComboValue) {
                mobileComboValue.textContent = this.game.combo.count;
                // コンボ数に応じて色を変更（新色系列：グレー→青→緑→赤→金）
                if (this.game.combo.count >= 24) {
                    mobileComboValue.style.color = '#FF9800'; // 金 (--color-gold)
                } else if (this.game.combo.count >= 18) {
                    mobileComboValue.style.color = '#F44336'; // 赤 (--color-red)
                } else if (this.game.combo.count >= 12) {
                    mobileComboValue.style.color = '#4CAF50'; // 緑 (--color-green)
                } else if (this.game.combo.count >= 6) {
                    mobileComboValue.style.color = '#2196F3'; // 青 (--color-blue)
                } else {
                    mobileComboValue.style.color = '#FFFFFF'; // 白 (--ui-text)
                }
            }
        }
    }
    
    /**
     * モバイル用Wave Progress中間エリア更新
     */
    updateMiddleAreaWaveProgress() {
        // 📝 メイン更新処理
        const middleWaveValue = document.getElementById('middle-wave-value');
        const middleEnemiesRemaining = document.getElementById('middle-enemies-remaining');
        const middleEnemiesTotal = document.getElementById('middle-enemies-total');
        
        if (middleWaveValue) {
            middleWaveValue.textContent = this.game.stats.wave;
        }
        
        if (middleEnemiesRemaining && middleEnemiesTotal) {
            const activeEnemies = this.game.enemySystem ? this.game.enemySystem.getActiveEnemyCount() : 0;
            const totalEnemies = this.game.stats.enemiesThisWave || 0;
            middleEnemiesRemaining.textContent = activeEnemies;
            middleEnemiesTotal.textContent = totalEnemies;
        }
        
        // 🔄 定期的なシステム強化チェック
        this.ensureMiddleAreaSystem();
    }


    /**
     * Wave Progress中央表示制御（モバイル時は非表示）
     */
    toggleWaveProgressDisplay() {
        const waveProgressElements = document.querySelectorAll('.wave-progress-ui, .wave-progress-container, .reserve-system-ui, #reserve-system-ui');
        const mobileMiddleArea = document.getElementById('mobile-wave-middle-area');
        
        // 旧システムの完全削除
        waveProgressElements.forEach(element => {
            if (this.game.isMobile) {
                element.style.display = 'none';
                element.style.visibility = 'hidden';
                element.classList.add('hidden');
            } else {
                element.style.display = '';
                element.style.visibility = '';
                element.classList.remove('hidden');
            }
        });
        
        // 旧赤ボックス要素の強制削除
        this.removeOldEnemyCountDisplay();
        
        // 新しい中間エリアの表示制御
        if (mobileMiddleArea) {
            if (this.game.isMobile && this.game.gameState === 'playing') {
                mobileMiddleArea.classList.remove('hidden');
            } else {
                mobileMiddleArea.classList.add('hidden');
            }
        }
    }
    
    /**
     * 旧敵数表示（赤ボックス）の強制削除
     */
    removeOldEnemyCountDisplay() {
        // 🧹 旧システム要素を完全洄去
        const elementsToRemove = [
            'enemy-count',           // メイン赤ボックス
            'enemy-count-container', // コンテナ
            'wave-progress'          // 旧Wave表示
        ];
        
        let removedCount = 0;
        elementsToRemove.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.remove();
                removedCount++;
                console.log(`🚫 UISystem: 旧要素 '${id}' を削除しました`);
            }
        });
        
        // クラス名でも検索して削除
        const classBased = document.querySelectorAll('.enemy-count-container, .enemy-count-text');
        classBased.forEach(element => {
            element.remove();
            removedCount++;
            console.log(`🚫 UISystem: クラスベース旧要素を削除しました`);
        });
        
        if (removedCount > 0) {
            console.log(`🎆 UISystem: 合計 ${removedCount} 個の旧システム要素を洄去完了`);
        }
    }
    
    /**
     * 中間エリアシステムの確実な動作保証
     * 強化版：完全な初期化と検証
     */
    ensureMiddleAreaSystem() {
        // 📝 Step 1: 旧システム要素を完全削除
        this.removeOldEnemyCountDisplay();
        
        // 📝 Step 2: 中間エリア要素を取得・検証
        const middleArea = document.getElementById('mobile-wave-middle-area');
        
        if (middleArea) {
            // 📝 Step 3: 表示強制適用（複数メソッド）
            middleArea.classList.remove('hidden');
            middleArea.style.display = 'flex';
            middleArea.style.visibility = 'visible';
            middleArea.style.opacity = '1';
            
            // 📝 Step 4: 初期データを設定
            const middleWaveValue = document.getElementById('middle-wave-value');
            const middleEnemiesRemaining = document.getElementById('middle-enemies-remaining');
            const middleEnemiesTotal = document.getElementById('middle-enemies-total');
            
            if (middleWaveValue) {
                middleWaveValue.textContent = this.game.stats.wave || 1;
            }
            
            if (middleEnemiesRemaining && middleEnemiesTotal) {
                const activeEnemies = this.game.enemySystem ? this.game.enemySystem.getActiveEnemyCount() : 0;
                const totalEnemies = this.game.stats.enemiesThisWave || 0;
                middleEnemiesRemaining.textContent = activeEnemies;
                middleEnemiesTotal.textContent = totalEnemies;
            }
            
            console.log('🎆 UISystem: 中間エリアシステム強化適用完了', {
                display: middleArea.style.display,
                visibility: middleArea.style.visibility,
                waveValue: middleWaveValue?.textContent,
                enemiesData: `${middleEnemiesRemaining?.textContent}/${middleEnemiesTotal?.textContent}`
            });
        } else {
            console.error('⚠️ UISystem: 中間エリア要素が見つかりません！');
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
        
        // Wave Progress表示制御
        this.toggleWaveProgressDisplay();
        
        // 中間エリアシステムの強制初期化（モバイル時）
        if (this.game.isMobile) {
            this.ensureMiddleAreaSystem();
        }
        
        // モバイルコントロールの再設定
        if (this.game.isMobile && !wasMobile) {
            this.game.setupMobileControls();
        }
        
        // UI更新後の最終確認（強制適用）
        setTimeout(() => {
            this.forceUIDisplay();
            if (this.game.isMobile) {
                this.removeOldEnemyCountDisplay(); // 追加削除チェック
            }
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
        const screens = ['loading-screen', 'main-menu', 'character-select-screen', 'instructions-screen', 'game-screen', 'gameover-screen'];
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
        document.getElementById('settings-modal').classList.add('hidden');
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
        console.log('UISystem: showGameScreen called');
        this.hideAllScreens();
        
        const gameScreen = document.getElementById('game-screen');
        console.log('UISystem: game-screen element found:', !!gameScreen);
        
        if (gameScreen) {
            gameScreen.classList.remove('hidden');
            // ゲーム画面にactiveクラスを追加（タッチ制限のため）
            gameScreen.classList.add('active');
            console.log('UISystem: game-screen hidden class removed, active class added');
        }
        
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
    
    // ===== 999ウェーブシステム用 演出メソッド =====
    
    /**
     * ウェーブ開始通知（999ウェーブシステム用）
     * @param {number} waveNumber - ウェーブ番号
     * @param {number} totalEnemies - 敵総数
     */
    onWaveStart(waveNumber, totalEnemies) {
        console.log(`UISystem: Wave ${waveNumber} started with ${totalEnemies} enemies`);
        
        // ウェーブ開始演出
        this.showWaveStartEffect(waveNumber, totalEnemies);
        
        // 進行度UI更新
        this.updateWaveProgress(waveNumber, 999);
        
        // 旧敵残数表示は無効化（新中間エリアシステムを使用）
        // this.updateEnemyCount(totalEnemies, totalEnemies);
    }
    
    /**
     * ウェーブクリア通知（999ウェーブシステム用）
     * @param {number} completedWave - 完了したウェーブ番号
     */
    onWaveComplete(completedWave) {
        console.log(`UISystem: Wave ${completedWave} completed!`);
        
        // ウェーブクリア演出
        this.showWaveClearEffect(completedWave);
        
        // 次ウェーブ予告
        if (completedWave < 999) {
            setTimeout(() => {
                this.showNextWavePreview(completedWave + 1);
            }, 1500); // 1.5秒後に次ウェーブ予告
        }
    }
    
    /**
     * ウェーブ開始演出表示
     * @param {number} waveNumber - ウェーブ番号
     * @param {number} totalEnemies - 敵総数
     * @private
     */
    showWaveStartEffect(waveNumber, totalEnemies) {
        // 演出用HTML要素を動的作成
        const effectElement = document.createElement('div');
        effectElement.className = 'wave-start-effect';
        effectElement.innerHTML = `
            <div class="wave-start-content">
                <h1 class="wave-start-title">WAVE ${waveNumber}</h1>
                <p class="wave-start-subtitle">敵を ${totalEnemies} 体撃破しよう</p>
            </div>
        `;
        
        // ゲーム画面に追加
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(effectElement);
            
            // アニメーション後に削除
            setTimeout(() => {
                if (effectElement.parentNode) {
                    effectElement.parentNode.removeChild(effectElement);
                }
            }, 2000);
        }
    }
    
    /**
     * 段階的ウェーブクリア演出表示
     * @param {number} completedWave - 完了したウェーブ番号
     * @private
     */
    showWaveClearEffect(completedWave) {
        console.log(`🌊 UISystem: showWaveClearEffect() called for wave ${completedWave}`);
        console.log('🔍 Game paused state:', this.game.isPaused);
        
        // ゲームが一時停止中（レベルアップモーダル表示中など）の場合は演出をスキップ
        if (this.game.isPaused) {
            console.log('⏸️ UISystem: Game is paused, skipping wave clear effect to avoid UI conflict');
            return;
        }
        
        // 既存のウェーブクリア演出をクリーンアップ
        this.cleanupExistingWaveClearEffects();
        
        const effectTier = this.getWaveClearTier(completedWave);
        const effectConfig = this.getWaveClearConfig(effectTier, completedWave);
        
        // 演出用HTML要素を動的作成
        const effectElement = document.createElement('div');
        effectElement.className = `wave-clear-effect tier-${effectTier}`;
        effectElement.id = `wave-clear-effect-${Date.now()}`; // 一意ID付与
        effectElement.innerHTML = `
            <div class="wave-clear-content">
                <h1 class="wave-clear-title" style="color: ${effectConfig.titleColor}; font-size: ${effectConfig.titleSize}px;">
                    ${effectConfig.titleText}
                </h1>
                <h2 class="wave-clear-subtitle" style="color: ${effectConfig.subtitleColor}; font-size: ${effectConfig.subtitleSize}px;">
                    ${effectConfig.subtitle}
                </h2>
                <div class="wave-clear-stars" style="font-size: ${effectConfig.starSize}px;">
                    ${effectConfig.stars}
                </div>
                ${effectConfig.specialText ? `<div class="wave-clear-special" style="color: ${effectConfig.specialColor}; font-size: ${effectConfig.specialSize}px;">${effectConfig.specialText}</div>` : ''}
            </div>
        `;
        
        // 段階別スタイル設定（z-indexをレベルアップモーダルより下位に設定）
        effectElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 8000;
            background: ${effectConfig.background};
            animation: ${effectConfig.animation} ${effectConfig.duration}ms ease-out;
            pointer-events: none;
        `;
        
        // 演出要素を追跡するために保存
        this.currentWaveClearEffect = effectElement;
        console.log('📋 UISystem: Wave clear effect element created and tracked');
        
        // ゲーム画面に追加
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(effectElement);
            console.log('🎭 UISystem: Wave clear effect added to DOM');
            
            // 段階別パーティクルエフェクト
            this.createTieredClearParticles(effectTier, completedWave);
            
            // 段階別サウンドエフェクト
            this.playWaveClearSound(effectTier);
            
            // アニメーション後に削除
            this.waveClearTimeoutId = setTimeout(() => {
                console.log('⏰ UISystem: Wave clear timeout triggered, removing effect');
                console.log('🔍 DEBUG: effectElement exists?', !!effectElement);
                console.log('🔍 DEBUG: effectElement in DOM?', document.contains(effectElement));
                this.removeWaveClearEffect(effectElement);
            }, effectConfig.duration);
            console.log(`⏳ UISystem: Wave clear timeout set for ${effectConfig.duration}ms (${effectConfig.duration/1000} seconds)`);
        }
    }
    
    /**
     * 既存のウェーブクリア演出をクリーンアップ
     * @private
     */
    cleanupExistingWaveClearEffects() {
        console.log('🧹 UISystem: cleanupExistingWaveClearEffects() called');
        
        // 既存のタイムアウトをクリア
        if (this.waveClearTimeoutId) {
            console.log('⏰ Clearing existing wave clear timeout:', this.waveClearTimeoutId);
            clearTimeout(this.waveClearTimeoutId);
            this.waveClearTimeoutId = null;
        } else {
            console.log('⏰ No existing wave clear timeout to clear');
        }
        
        // 既存の演出要素を削除
        if (this.currentWaveClearEffect) {
            console.log('🎭 Removing tracked wave clear effect');
            this.removeWaveClearEffect(this.currentWaveClearEffect);
            this.currentWaveClearEffect = null;
        } else {
            console.log('🎭 No tracked wave clear effect to remove');
        }
        
        // クラス名で検索して残存する演出要素を削除
        const existingEffects = document.querySelectorAll('.wave-clear-effect');
        console.log(`🔍 Found ${existingEffects.length} wave clear effects in DOM`);
        existingEffects.forEach((effect, index) => {
            console.log(`🗑️ Removing wave clear effect ${index + 1}/${existingEffects.length}`);
            this.removeWaveClearEffect(effect);
        });
        
        console.log('✅ UISystem: cleanupExistingWaveClearEffects() completed');
    }
    
    /**
     * ウェーブクリア演出要素を安全に削除
     * @param {HTMLElement} effectElement - 削除する演出要素
     * @private
     */
    removeWaveClearEffect(effectElement) {
        console.log('🗑️ UISystem: removeWaveClearEffect() called');
        console.log('🔍 Effect element:', effectElement);
        console.log('🔍 Has parent node:', effectElement && effectElement.parentNode);
        console.log('🔍 Current time:', Date.now());
        
        if (effectElement && effectElement.parentNode) {
            effectElement.parentNode.removeChild(effectElement);
            console.log('✅ UISystem: Wave clear effect DOM element removed successfully');
            
            // 削除後の確認
            const remainingEffects = document.querySelectorAll('.wave-clear-effect');
            console.log('🔍 Remaining wave clear effects after removal:', remainingEffects.length);
        } else {
            console.log('⚠️ UISystem: Wave clear effect element not found or already removed');
        }
        
        // currentWaveClearEffect の参照をクリア
        if (this.currentWaveClearEffect === effectElement) {
            this.currentWaveClearEffect = null;
            console.log('🧹 Cleared currentWaveClearEffect reference');
        }
    }
    
    /**
     * レベルアップモーダル表示時にウェーブクリア演出を強制停止
     */
    forceStopWaveClearEffect() {
        console.log('🔧 UISystem: forceStopWaveClearEffect() called');
        console.log('🔍 Before cleanup - Current wave clear effect:', this.currentWaveClearEffect);
        console.log('🔍 Before cleanup - Wave clear timeout ID:', this.waveClearTimeoutId);
        
        // 既存の演出要素を確認
        const existingEffects = document.querySelectorAll('.wave-clear-effect');
        console.log('🔍 Found existing wave clear effects:', existingEffects.length);
        
        this.cleanupExistingWaveClearEffects();
        
        // 即座に再確認し、必要に応じて再クリーンアップ
        setTimeout(() => {
            const stillRemaining = document.querySelectorAll('.wave-clear-effect');
            if (stillRemaining.length > 0) {
                console.log('⚠️ Wave clear effects still present after cleanup, force removing...');
                stillRemaining.forEach((effect, index) => {
                    console.log(`🗑️ Force removing remaining effect ${index + 1}/${stillRemaining.length}`);
                    if (effect.parentNode) {
                        effect.parentNode.removeChild(effect);
                    }
                });
            }
            
            // 最終確認
            const finalCheck = document.querySelectorAll('.wave-clear-effect');
            console.log(`✅ Final check - Remaining wave clear effects: ${finalCheck.length}`);
        }, 10); // 10ms後に再確認
        
        console.log('✅ UISystem: Wave clear effects forcefully stopped for level up modal');
    }
    
    /**
     * ウェーブクリア段階判定
     * @param {number} wave - ウェーブ番号
     * @returns {number} 段階 (1-4)
     */
    getWaveClearTier(wave) {
        if (wave === 999) return 4; // 最終ウェーブ
        if (wave >= 500 || wave === 250 || wave === 100) return 3; // 伝説的マイルストーン
        if (wave >= 50 && wave % 50 === 0) return 3; // 50区切り
        if (wave % 10 === 0) return 2; // 10区切り（ボスウェーブ）
        return 1; // 通常ウェーブ
    }
    
    /**
     * ウェーブクリア演出設定取得
     * @param {number} tier - 段階
     * @param {number} wave - ウェーブ番号
     * @returns {Object} 演出設定
     */
    getWaveClearConfig(tier, wave) {
        switch (tier) {
            case 4: // 伝説的（999ウェーブクリア）
                return {
                    titleText: `LEGENDARY WAVE ${wave}`,
                    titleColor: '#FFD700',
                    titleSize: 48,
                    subtitle: '🎉 ULTIMATE CLEAR! 🎉',
                    subtitleColor: '#FF6B6B',
                    subtitleSize: 32,
                    stars: '⭐ ✨ ⭐ ✨ ⭐ ✨ ⭐',
                    starSize: 24,
                    specialText: wave === 999 ? 'GAME COMPLETE!' : 'INCREDIBLE ACHIEVEMENT!',
                    specialColor: '#00FF7F',
                    specialSize: 28,
                    background: 'radial-gradient(circle, rgba(255,215,0,0.3), rgba(255,107,107,0.3), rgba(138,43,226,0.3))',
                    animation: 'waveClearLegendary',
                    duration: 500
                };
                
            case 3: // エピック（大きなマイルストーン）
                return {
                    titleText: `EPIC WAVE ${wave}`,
                    titleColor: '#FF6B6B',
                    titleSize: 36,
                    subtitle: '🌟 EPIC CLEAR! 🌟',
                    subtitleColor: '#4ECDC4',
                    subtitleSize: 24,
                    stars: '⭐ ⭐ ⭐ ⭐ ⭐',
                    starSize: 20,
                    specialText: this.getEpicMilestoneText(wave),
                    specialColor: '#FFE66D',
                    specialSize: 18,
                    background: 'radial-gradient(circle, rgba(255,107,107,0.25), rgba(78,205,196,0.25))',
                    animation: 'waveClearEpic',
                    duration: 500
                };
                
            case 2: // 強化版（10ウェーブ区切り・ボス）
                return {
                    titleText: `BOSS WAVE ${wave}`,
                    titleColor: '#4ECDC4',
                    titleSize: 28,
                    subtitle: '💥 BOSS CLEAR! 💥',
                    subtitleColor: '#A8E6CF',
                    subtitleSize: 20,
                    stars: '⭐ ⭐ ⭐ ⭐',
                    starSize: 16,
                    specialText: null,
                    background: 'radial-gradient(circle, rgba(78,205,196,0.2), rgba(168,230,207,0.2))',
                    animation: 'waveClearEnhanced',
                    duration: 500
                };
                
            default: // 標準版
                return {
                    titleText: `WAVE ${wave}`,
                    titleColor: '#A8E6CF',
                    titleSize: 24,
                    subtitle: 'CLEAR!',
                    subtitleColor: '#DCEDC1',
                    subtitleSize: 18,
                    stars: '⭐ ⭐ ⭐',
                    starSize: 14,
                    specialText: null,
                    background: 'radial-gradient(circle, rgba(168,230,207,0.15), rgba(220,237,193,0.15))',
                    animation: 'waveClearStandard',
                    duration: 500
                };
        }
    }
    
    /**
     * エピックマイルストーン特別テキスト
     * @param {number} wave - ウェーブ番号
     * @returns {string} 特別メッセージ
     */
    getEpicMilestoneText(wave) {
        if (wave === 100) return 'FIRST CENTURY!';
        if (wave === 250) return 'QUARTER THOUSAND!';
        if (wave === 500) return 'HALF THOUSAND!';
        if (wave === 750) return 'THREE QUARTERS!';
        if (wave % 50 === 0) return `${wave} WAVES CONQUERED!`;
        return 'MILESTONE ACHIEVED!';
    }
    
    /**
     * 次ウェーブ予告表示
     * @param {number} nextWave - 次のウェーブ番号
     * @private
     */
    showNextWavePreview(nextWave) {
        // 演出用HTML要素を動的作成
        const effectElement = document.createElement('div');
        effectElement.className = 'wave-preview-effect';
        effectElement.innerHTML = `
            <div class="wave-preview-content">
                <p class="wave-preview-text">WAVE ${nextWave}</p>
                <p class="wave-preview-subtext">APPROACHING...</p>
            </div>
        `;
        
        // ゲーム画面に追加
        const gameScreen = document.getElementById('game-screen');
        if (gameScreen) {
            gameScreen.appendChild(effectElement);
            
            // アニメーション後に削除
            setTimeout(() => {
                if (effectElement.parentNode) {
                    effectElement.parentNode.removeChild(effectElement);
                }
            }, 2000);
        }
    }
    
    /**
     * クリア時パーティクルエフェクト（基本版）
     * @private
     */
    createClearParticles() {
        if (!this.game.particleSystem) return;
        
        // 画面中央付近でパーティクル生成
        const centerX = this.game.player.x;
        const centerY = this.game.player.y;
        
        // 祝福パーティクル - 金色
        for (let i = 0; i < 30; i++) {
            const angle = (Math.PI * 2 * i) / 30;
            const speed = 100 + Math.random() * 100;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleSystem.createParticle(
                centerX + (Math.random() - 0.5) * 100,
                centerY + (Math.random() - 0.5) * 100,
                vx,
                vy,
                '#FFD700', // 金色
                2000 // 2秒間持続
            );
        }
        
        // 星型パーティクル - 白色
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 50;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            this.game.particleSystem.createParticle(
                centerX,
                centerY,
                vx,
                vy,
                '#FFFFFF', // 白色
                1500 // 1.5秒間持続
            );
        }
    }
    
    /**
     * 段階別クリアパーティクル作成
     * @param {number} tier - 演出段階
     * @param {number} wave - ウェーブ番号
     */
    createTieredClearParticles(tier, wave) {
        const particleConfigs = this.getTieredParticleConfig(tier);
        
        // 基本パーティクル作成
        this.createClearParticles();
        
        // 段階別追加パーティクル
        if (tier >= 2) {
            // 強化版以上: 追加の色付きパーティクル
            this.createEnhancedParticles(particleConfigs);
        }
        
        if (tier >= 3) {
            // エピック以上: 爆発パーティクル
            this.createEpicParticles(particleConfigs);
        }
        
        if (tier === 4) {
            // 伝説的: 最大規模のお祝いパーティクル
            this.createLegendaryParticles(wave);
        }
    }
    
    /**
     * 段階別パーティクル設定取得
     * @param {number} tier - 演出段階
     * @returns {Object} パーティクル設定
     */
    getTieredParticleConfig(tier) {
        const configs = {
            1: { colors: ['#A8E6CF', '#DCEDC1'], count: 20 },
            2: { colors: ['#4ECDC4', '#A8E6CF', '#96CEB4'], count: 35 },
            3: { colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#A8E6CF'], count: 50 },
            4: { colors: ['#FFD700', '#FF6B6B', '#00FF7F', '#8A2BE2', '#FF1493'], count: 80 }
        };
        return configs[tier] || configs[1];
    }
    
    /**
     * 強化パーティクル作成
     * @param {Object} config - パーティクル設定
     */
    createEnhancedParticles(config) {
        for (let i = 0; i < config.count; i++) {
            setTimeout(() => {
                const color = config.colors[Math.floor(Math.random() * config.colors.length)];
                this.game.particleSystem.createParticle(
                    this.game.baseWidth / 2 + (Math.random() - 0.5) * 400,
                    this.game.baseHeight / 2 + (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 300,
                    (Math.random() - 0.5) * 300,
                    color,
                    Math.random() * 4 + 3,
                    2000
                );
            }, Math.random() * 1000);
        }
    }
    
    /**
     * エピックパーティクル作成
     * @param {Object} config - パーティクル設定
     */
    createEpicParticles(config) {
        // 中央からの放射状爆発エフェクト
        const centerX = this.game.baseWidth / 2;
        const centerY = this.game.baseHeight / 2;
        
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const speed = 200 + Math.random() * 100;
            
            setTimeout(() => {
                this.game.particleSystem.createParticle(
                    centerX,
                    centerY,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    config.colors[Math.floor(Math.random() * config.colors.length)],
                    Math.random() * 3 + 4,
                    3000
                );
            }, Math.random() * 500);
        }
        
        // 螺旋パーティクル
        this.createSpiralParticles(config.colors);
    }
    
    /**
     * 伝説的パーティクル作成
     * @param {number} wave - ウェーブ番号
     */
    createLegendaryParticles(wave) {
        // 虹色の大爆発
        this.createRainbowExplosion();
        
        // 連続花火
        this.createFireworksSequence();
        
        // 特殊な999ウェーブエフェクト
        if (wave === 999) {
            this.createGameCompleteParticles();
        }
    }
    
    /**
     * 螺旋パーティクル作成
     * @param {Array} colors - 色配列
     */
    createSpiralParticles(colors) {
        for (let i = 0; i < 30; i++) {
            setTimeout(() => {
                const angle = (i / 30) * Math.PI * 4; // 2回転
                const radius = i * 8;
                const centerX = this.game.baseWidth / 2;
                const centerY = this.game.baseHeight / 2;
                
                this.game.particleSystem.createParticle(
                    centerX + Math.cos(angle) * radius,
                    centerY + Math.sin(angle) * radius,
                    Math.cos(angle + Math.PI/2) * 50,
                    Math.sin(angle + Math.PI/2) * 50,
                    colors[i % colors.length],
                    3 + Math.random() * 2,
                    2500
                );
            }, i * 50);
        }
    }
    
    /**
     * 虹色爆発作成
     */
    createRainbowExplosion() {
        const rainbowColors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
        const centerX = this.game.baseWidth / 2;
        const centerY = this.game.baseHeight / 2;
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => {
                const angle = Math.random() * Math.PI * 2;
                const speed = 150 + Math.random() * 200;
                
                this.game.particleSystem.createParticle(
                    centerX,
                    centerY,
                    Math.cos(angle) * speed,
                    Math.sin(angle) * speed,
                    rainbowColors[Math.floor(Math.random() * rainbowColors.length)],
                    5 + Math.random() * 3,
                    4000
                );
            }, Math.random() * 1000);
        }
    }
    
    /**
     * 花火シーケンス作成
     */
    createFireworksSequence() {
        for (let firework = 0; firework < 5; firework++) {
            setTimeout(() => {
                const x = Math.random() * this.game.baseWidth;
                const y = Math.random() * this.game.baseHeight * 0.5;
                this.game.particleSystem.createExplosion(x, y, 25, '#FFD700', 300, 2000);
            }, firework * 800);
        }
    }
    
    /**
     * ゲーム完了特別パーティクル
     */
    createGameCompleteParticles() {
        // 全画面ゴールドパーティクル
        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                this.game.particleSystem.createParticle(
                    Math.random() * this.game.baseWidth,
                    -10,
                    (Math.random() - 0.5) * 100,
                    Math.random() * 50 + 50,
                    '#FFD700',
                    Math.random() * 4 + 2,
                    5000
                );
            }, Math.random() * 3000);
        }
    }
    
    /**
     * 段階別ウェーブクリア音響効果
     * @param {number} tier - 演出段階
     */
    playWaveClearSound(tier) {
        if (!this.game.audioSystem) return;
        
        // 段階に応じた音響効果を再生（新AudioSystem準拠）
        try {
            switch (tier) {
                case 4: // 伝説的
                    // 豪華な音響：レベルアップ音 + 複数のピックアップ音で重複効果
                    this.game.audioSystem.playLevelUpSound();
                    setTimeout(() => this.game.audioSystem.playPickupSound(), 100);
                    setTimeout(() => this.game.audioSystem.playWaveCompleteSound(), 300);
                    console.log('🌊 Legendary wave clear sound played (tier 4)');
                    break;
                    
                case 3: // エピック
                    // エピック音響：レベルアップ音 + ウェーブ完了音
                    this.game.audioSystem.playLevelUpSound();
                    setTimeout(() => this.game.audioSystem.playWaveCompleteSound(), 200);
                    console.log('🌊 Epic wave clear sound played (tier 3)');
                    break;
                    
                case 2: // 強化版
                    // 強化音響：ウェーブ完了音 + ピックアップ音
                    this.game.audioSystem.playWaveCompleteSound();
                    setTimeout(() => this.game.audioSystem.playPickupSound(), 150);
                    console.log('🌊 Enhanced wave clear sound played (tier 2)');
                    break;
                    
                default: // 標準
                    // 標準音響：ウェーブ完了音のみ
                    this.game.audioSystem.playWaveCompleteSound();
                    console.log('🌊 Standard wave clear sound played (tier 0/1)');
                    break;
            }
        } catch (error) {
            console.warn('🎵 Wave clear sound failed:', error, 'tier:', tier);
            // フォールバック：最低限のウェーブ完了音
            try {
                this.game.audioSystem.playWaveCompleteSound();
            } catch (fallbackError) {
                console.error('🎵 Fallback wave clear sound also failed:', fallbackError);
            }
        }
    }
    
    /**
     * ウェーブ進行度UI更新（レガシー＋リザーブシステム対応）
     * @param {number|Object} currentWaveOrProgress - ウェーブ番号またはリザーブシステム進行状況
     * @param {number} [maxWave] - 最大ウェーブ (999) - レガシーモード用
     * @private
     */
    updateWaveProgress(currentWaveOrProgress, maxWave) {
        // リザーブシステム用のオブジェクト形式かチェック
        if (typeof currentWaveOrProgress === 'object' && currentWaveOrProgress.hasOwnProperty('active')) {
            this.updateReserveSystemUI(currentWaveOrProgress);
            return;
        }
        
        // レガシーモード: 通常のウェーブ進行度
        const currentWave = currentWaveOrProgress;
        let progressElement = document.getElementById('wave-progress');
        
        if (!progressElement) {
            // 動的に進行度バー作成
            this.createWaveProgressBar();
            progressElement = document.getElementById('wave-progress');
        }
        
        if (progressElement) {
            const progress = (currentWave / maxWave) * 100;
            progressElement.innerHTML = `
                <div class="wave-progress-text">Wave ${currentWave} / ${maxWave}</div>
                <div class="wave-progress-bar">
                    <div class="wave-progress-fill" style="width: ${progress.toFixed(1)}%"></div>
                </div>
            `;
        }
    }
    
    /**
     * リザーブシステム用UI更新
     * @param {Object} waveProgress - {active, killed, reserve, total}
     * @private
     */
    updateReserveSystemUI(waveProgress) {
        let reserveElement = document.getElementById('reserve-system-ui');
        
        if (!reserveElement) {
            // 動的にリザーブシステムUI作成
            this.createReserveSystemUI();
            reserveElement = document.getElementById('reserve-system-ui');
        }
        
        if (reserveElement) {
            const killProgress = (waveProgress.killed / waveProgress.total) * 100;
            
            reserveElement.innerHTML = `
                <div class="reserve-ui-container">
                    <div class="reserve-ui-title">Wave Progress</div>
                    <div class="reserve-ui-stats">
                        <div class="reserve-stat active">
                            <span class="reserve-stat-label">Active</span>
                            <span class="reserve-stat-value">${waveProgress.active}</span>
                        </div>
                        <div class="reserve-stat killed">
                            <span class="reserve-stat-label">Killed</span>
                            <span class="reserve-stat-value">${waveProgress.killed}</span>
                        </div>
                        <div class="reserve-stat reserve">
                            <span class="reserve-stat-label">Reserve</span>
                            <span class="reserve-stat-value">${waveProgress.reserve}</span>
                        </div>
                        <div class="reserve-stat total">
                            <span class="reserve-stat-label">Total</span>
                            <span class="reserve-stat-value">${waveProgress.total}</span>
                        </div>
                    </div>
                    <div class="reserve-progress-bar">
                        <div class="reserve-progress-fill" style="width: ${killProgress.toFixed(1)}%"></div>
                        <div class="reserve-progress-text">${waveProgress.killed} / ${waveProgress.total}</div>
                    </div>
                </div>
            `;
        }
    }
    
    /**
     * 敵残数UI更新 - 旧システム（完全無効化）
     * @param {number} remaining - 残り敵数
     * @param {number} total - 総敵数
     * @private
     * @deprecated 新中間エリアシステムを使用してください
     */
    updateEnemyCount(remaining, total) {
        // 🚫 完全無効化：新中間エリアシステムを使用
        console.warn('UISystem: updateEnemyCount は無効化されました。新中間エリアシステムを使用してください。');
        
        // 既存の旧システム要素を強制削除
        this.removeOldEnemyCountDisplay();
        
        // 新システムの確実な動作を保証
        this.ensureMiddleAreaSystem();
        
        return; // 処理を停止
    }
    
    /**
     * ウェーブ進行度バー動的作成
     * @private
     */
    createWaveProgressBar() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || document.getElementById('wave-progress')) return;
        
        const progressContainer = document.createElement('div');
        progressContainer.id = 'wave-progress';
        progressContainer.className = 'wave-progress-container';
        progressContainer.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 1000;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 16px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
        `;
        
        gameScreen.appendChild(progressContainer);
    }
    
    /**
     * 敵数表示動的作成 - 旧システム（完全無効化）
     * @private
     * @deprecated 新中間エリアシステムを使用してください
     */
    createEnemyCountDisplay() {
        // 🚫 完全無効化：赤ボックス作成を阻止
        console.warn('UISystem: createEnemyCountDisplay は無効化されました。');
        
        // 既存要素があれば削除
        this.removeOldEnemyCountDisplay();
        
        return; // 処理を停止
    }
    
    /**
     * リザーブシステムUI動的作成
     * Smart Position System 対応版
     * @private
     */
    createReserveSystemUI() {
        const gameScreen = document.getElementById('game-screen');
        if (!gameScreen || document.getElementById('reserve-system-ui')) return;
        
        const reserveContainer = document.createElement('div');
        reserveContainer.id = 'reserve-system-ui';
        reserveContainer.className = 'reserve-system-container';
        
        // Smart Position System: 動的位置計算
        const smartPosition = this.calculateSmartPosition();
        
        reserveContainer.style.cssText = `
            position: fixed;
            ${smartPosition.position};
            z-index: ${smartPosition.zIndex};
            background: linear-gradient(135deg, rgba(0, 123, 255, 0.9), rgba(40, 167, 69, 0.9));
            color: white;
            padding: ${smartPosition.padding};
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            font-size: ${smartPosition.fontSize};
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            min-width: ${smartPosition.minWidth};
            max-width: ${smartPosition.maxWidth};
            transition: all 0.3s ease;
        `;
        
        // CSS スタイルを追加（動的）
        const style = document.createElement('style');
        style.textContent = `
            .reserve-ui-container {
                text-align: center;
            }
            .reserve-ui-title {
                font-weight: bold;
                margin-bottom: 8px;
                font-size: 14px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
            }
            .reserve-ui-stats {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 6px;
                margin-bottom: 10px;
            }
            .reserve-stat {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 11px;
            }
            .reserve-stat.active {
                background: rgba(255, 193, 7, 0.3);
                border: 1px solid #FFC107;
            }
            .reserve-stat.killed {
                background: rgba(40, 167, 69, 0.3);
                border: 1px solid #28A745;
            }
            .reserve-stat.reserve {
                background: rgba(108, 117, 125, 0.3);
                border: 1px solid #6C757D;
            }
            .reserve-stat.total {
                background: rgba(0, 123, 255, 0.3);
                border: 1px solid #007BFF;
                grid-column: span 2;
            }
            .reserve-stat-label {
                font-weight: bold;
            }
            .reserve-stat-value {
                font-weight: bold;
                text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.5);
            }
            .reserve-progress-bar {
                position: relative;
                background: rgba(0, 0, 0, 0.4);
                height: 20px;
                border-radius: 10px;
                overflow: hidden;
                margin-top: 8px;
            }
            .reserve-progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #28A745, #20C997);
                transition: width 0.3s ease;
                border-radius: 10px;
            }
            .reserve-progress-text {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-weight: bold;
                font-size: 11px;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.8);
                color: white;
            }
        `;
        
        if (!document.head.querySelector('style[data-reserve-ui]')) {
            style.setAttribute('data-reserve-ui', 'true');
            document.head.appendChild(style);
        }
        
        gameScreen.appendChild(reserveContainer);
        
        // レスポンシブ対応: 画面リサイズ時の位置再計算
        this.setupResponsiveWaveProgress(reserveContainer);
    }
    
    /**
     * Smart Position System: Wave Progress位置計算
     * @returns {Object} 位置・サイズ設定オブジェクト
     * @private
     */
    calculateSmartPosition() {
        const isMobile = this.game.isMobile;
        const isPortrait = window.innerHeight > window.innerWidth;
        const isLandscape = !isPortrait;
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        
        // Safe Area取得（モバイル向け）
        const safeAreaTop = this.getSafeAreaValue('top');
        const safeAreaBottom = this.getSafeAreaValue('bottom');
        const safeAreaLeft = this.getSafeAreaValue('left');
        const safeAreaRight = this.getSafeAreaValue('right');
        
        console.log('📱 Smart Position System - デバイス情報:', {
            isMobile, isPortrait, isLandscape,
            screenWidth, screenHeight,
            safeArea: { top: safeAreaTop, bottom: safeAreaBottom, left: safeAreaLeft, right: safeAreaRight }
        });
        
        if (isMobile) {
            if (isPortrait) {
                // 📱 モバイル縦画面: 画面中央やや下に配置
                return {
                    position: `
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -30%);
                        margin-top: ${safeAreaTop + 40}px
                    `,
                    zIndex: '1500',
                    padding: '10px',
                    fontSize: '11px',
                    minWidth: '180px',
                    maxWidth: '280px'
                };
            } else {
                // 📱 モバイル横画面: 右上だが下寄りに配置
                return {
                    position: `
                        top: ${safeAreaTop + 60}px;
                        right: ${safeAreaRight + 15}px
                    `,
                    zIndex: '1500',
                    padding: '8px',
                    fontSize: '10px',
                    minWidth: '160px',
                    maxWidth: '220px'
                };
            }
        } else {
            // 💻 PC: 元の位置を維持
            return {
                position: `
                    top: 10px;
                    right: 20px
                `,
                zIndex: '1000',
                padding: '12px',
                fontSize: '12px',
                minWidth: '200px',
                maxWidth: '300px'
            };
        }
    }
    
    /**
     * Safe Area値取得ヘルパー - 強化版
     * @param {string} side - 'top', 'bottom', 'left', 'right'
     * @returns {number} Safe Area値（px）
     * @private
     */
    getSafeAreaValue(side) {
        try {
            // CSS env()関数でSafe Area値を取得
            const testElement = document.createElement('div');
            testElement.style.cssText = `
                position: fixed;
                top: env(safe-area-inset-${side});
                left: env(safe-area-inset-${side});
                width: 1px;
                height: 1px;
                opacity: 0;
                pointer-events: none;
                z-index: -1;
            `;
            
            document.body.appendChild(testElement);
            const computedStyle = getComputedStyle(testElement);
            
            let value = 0;
            if (side === 'top' || side === 'bottom') {
                const topValue = computedStyle.top;
                value = parseInt(topValue) || 0;
            } else {
                const leftValue = computedStyle.left;
                value = parseInt(leftValue) || 0;
            }
            
            document.body.removeChild(testElement);
            
            // フォールバック: ユーザーエージェントベースの推定
            if (value === 0 && this.isIOSDevice()) {
                value = this.estimateIOSSafeArea(side);
            }
            
            console.log(`🛡️ Safe Area ${side}: ${value}px`);
            return value;
            
        } catch (error) {
            console.warn(`⚠️ Safe Area ${side}の取得に失敗:`, error);
            
            // エラー時のフォールバック
            if (this.isIOSDevice()) {
                return this.estimateIOSSafeArea(side);
            }
            
            return 0;
        }
    }
    
    /**
     * iOSデバイス判定
     * @returns {boolean} iOSデバイスかどうか
     * @private
     */
    isIOSDevice() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    }
    
    /**
     * iOS Safe Area推定値
     * @param {string} side - 'top', 'bottom', 'left', 'right'
     * @returns {number} 推定 Safe Area値
     * @private
     */
    estimateIOSSafeArea(side) {
        const screenHeight = screen.height;
        const screenWidth = screen.width;
        const isLandscape = window.innerWidth > window.innerHeight;
        
        // iPhoneモデル別Safe Area推定
        const estimates = {
            // iPhone X, 11, 12, 13, 14 Pro系 (2436x1125, 2532x1170, 2556x1179)
            tall: {
                top: isLandscape ? 0 : 44,
                bottom: isLandscape ? 21 : 34,
                left: isLandscape ? 44 : 0,
                right: isLandscape ? 44 : 0
            },
            // iPhone Plus系 (2208x1242)
            plus: {
                top: 0, bottom: 0, left: 0, right: 0
            },
            // iPhone SE系 (1334x750, 1136x640)
            compact: {
                top: 0, bottom: 0, left: 0, right: 0
            }
        };
        
        // 画面サイズで判定
        let deviceType = 'compact';
        if (screenHeight >= 2436 || screenWidth >= 2436) {
            deviceType = 'tall'; // iPhone X系
        } else if (screenHeight >= 2208 || screenWidth >= 2208) {
            deviceType = 'plus'; // iPhone Plus系
        }
        
        const estimate = estimates[deviceType][side] || 0;
        console.log(`📱 iOS Safe Area推定 (${deviceType}): ${side} = ${estimate}px`);
        
        return estimate;
    }
    
    /**
     * レスポンシブWave Progress設定
     * @param {HTMLElement} container - Wave Progressコンテナ
     * @private
     */
    setupResponsiveWaveProgress(container) {
        let resizeTimer;
        
        const handleResize = () => {
            clearTimeout(resizeTimer);
            resizeTimer = setTimeout(() => {
                const smartPosition = this.calculateSmartPosition();
                
                // Z-index階層確認と更新
                this.updateZIndexHierarchy(container);
                
                // 位置とスタイルを動的更新
                this.applySmartPositionStyles(container, smartPosition);
                
                console.log('🔄 Wave Progress位置を再計算しました');
            }, 150); // デバウンス: 150ms
        };
        
        // イベントリスナー設定
        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', () => {
            setTimeout(handleResize, 300); // オリエンテーション変更は遅延実行
        });
        
        // iOS Safari用のviewport変化検出
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', handleResize);
            window.visualViewport.addEventListener('scroll', handleResize);
        }
        
        // 初期位置設定の強化
        setTimeout(() => {
            const initialPosition = this.calculateSmartPosition();
            this.applySmartPositionStyles(container, initialPosition);
            this.updateZIndexHierarchy(container);
        }, 100);
    }
    
    /**
     * Smart Positionスタイル適用
     * @param {HTMLElement} container - コンテナ要素
     * @param {Object} smartPosition - 位置情報
     * @private
     */
    applySmartPositionStyles(container, smartPosition) {
        // 位置スタイルを適用
        const positionStyles = smartPosition.position.split(';').filter(s => s.trim());
        positionStyles.forEach(style => {
            const [property, value] = style.split(':').map(s => s.trim());
            if (property && value) {
                container.style.setProperty(property, value, 'important');
            }
        });
        
        // その他のスタイルを適用
        container.style.setProperty('padding', smartPosition.padding, 'important');
        container.style.setProperty('font-size', smartPosition.fontSize, 'important');
        container.style.setProperty('min-width', smartPosition.minWidth, 'important');
        container.style.setProperty('max-width', smartPosition.maxWidth, 'important');
        container.style.setProperty('z-index', smartPosition.zIndex, 'important');
        
        console.log('🎨 Smart Positionスタイルを適用しました');
    }
    
    /**
     * Z-index階層管理システム
     * @param {HTMLElement} container - Wave Progressコンテナ
     * @private
     */
    updateZIndexHierarchy(container) {
        // Z-index階層定義
        const zIndexLayers = {
            background: 0,           // 背景システム
            game: 100,              // ゲーム本体
            ui: 1000,               // 通常UI
            skills: 1200,           // スキルレベル表示
            waveProgress: 1500,     // Wave Progress (ここ)
            notifications: 2000,    // 通知・エフェクト
            modals: 9000           // モーダル系
        };
        
        // Wave ProgressのZ-indexを設定
        container.style.setProperty('z-index', zIndexLayers.waveProgress.toString(), 'important');
        
        // 他のUI要素のZ-indexも確認・調整
        this.ensureProperZIndexHierarchy(zIndexLayers);
        
        console.log('🎯 Z-index階層を整理しました:', zIndexLayers);
    }
    
    /**
     * 全体のZ-index階層確認
     * @param {Object} zIndexLayers - Z-index階層定義
     * @private
     */
    ensureProperZIndexHierarchy(zIndexLayers) {
        // スキルレベル表示のZ-index確認
        const skillDisplay = document.getElementById('skill-levels-display');
        if (skillDisplay) {
            skillDisplay.style.setProperty('z-index', zIndexLayers.skills.toString(), 'important');
        }
        
        const mobileSkillLevels = document.getElementById('mobile-skill-levels');
        if (mobileSkillLevels) {
            mobileSkillLevels.style.setProperty('z-index', zIndexLayers.skills.toString(), 'important');
        }
        
        // モーダルのZ-index確認（既にCSSで設定済みであることを確認）
        const modals = ['levelup-modal', 'settings-modal', 'pause-modal'];
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (modal) {
                const currentZIndex = parseInt(getComputedStyle(modal).zIndex) || 0;
                if (currentZIndex < zIndexLayers.modals) {
                    console.warn(`⚠️ ${modalId}のZ-indexが低いです: ${currentZIndex}`);
                }
            }
        });
    }
    
    /**
     * ゲーム完全クリア画面表示
     */
    showGameCompleteScreen() {
        // 999ウェーブ完全クリア演出
        const effectElement = document.createElement('div');
        effectElement.className = 'game-complete-effect';
        effectElement.innerHTML = `
            <div class="game-complete-content">
                <h1 class="game-complete-title">CONGRATULATIONS!</h1>
                <h2 class="game-complete-subtitle">ALL 999 WAVES COMPLETED!</h2>
                <p class="game-complete-text">You are a true legend!</p>
                <div class="game-complete-stars">★ ★ ★ ★ ★</div>
            </div>
        `;
        
        effectElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #FFD700, #FFA500, #FF6347);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: gameCompleteAnimation 3s ease-in-out;
        `;
        
        document.body.appendChild(effectElement);
        
        // 最大級のパーティクルエフェクト
        this.createMassiveCelebrationParticles();
    }
    
    /**
     * 大規模祝福パーティクル
     * @private
     */
    createMassiveCelebrationParticles() {
        if (!this.game.particleSystem) return;
        
        const centerX = this.game.player.x;
        const centerY = this.game.player.y;
        
        // 超大量のパーティクル
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 200;
            const vx = Math.cos(angle) * speed;
            const vy = Math.sin(angle) * speed;
            
            const colors = ['#FFD700', '#FF6347', '#32CD32', '#1E90FF', '#FF69B4', '#FFFFFF'];
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.game.particleSystem.createParticle(
                centerX + (Math.random() - 0.5) * 300,
                centerY + (Math.random() - 0.5) * 300,
                vx,
                vy,
                color,
                5000 // 5秒間持続
            );
        }
    }
}