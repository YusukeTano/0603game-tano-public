/**
 * SettingsSystem - 設定管理システム
 * 音量設定のUI制御とイベント管理
 */
export class SettingsSystem {
    constructor(game) {
        this.game = game;
        this.isOpen = false;
        
        // DOM要素
        this.settingsModal = null;
        this.volumeSliders = {};
        this.volumeDisplays = {};
        
        this.initializeElements();
        this.bindEvents();
    }
    
    /**
     * DOM要素の初期化
     */
    initializeElements() {
        // 設定モーダル
        this.settingsModal = document.getElementById('settings-modal');
        
        // 音量スライダー（BGM削除）
        this.volumeSliders = {
            master: document.getElementById('master-volume-slider'),
            sfx: document.getElementById('sfx-volume-slider')
        };
        
        // 音量表示（BGM削除）
        this.volumeDisplays = {
            master: document.getElementById('master-volume-display'),
            sfx: document.getElementById('sfx-volume-display')
        };
        
        // ミュートボタン（BGM削除）
        this.muteButtons = {
            master: document.getElementById('master-mute-btn'),
            sfx: document.getElementById('sfx-mute-btn')
        };
        
        // その他のボタン
        this.settingsButton = document.getElementById('settings-btn');
        this.closeSettingsButton = document.getElementById('close-settings-btn');
        this.resetSettingsButton = document.getElementById('reset-settings-btn');
        
        // 設定の読み込み
        this.loadSettings();
        
        // 初期値の設定
        this.updateSliders();
    }
    
    /**
     * イベントバインド
     */
    bindEvents() {
        // 設定ボタンクリック
        if (this.settingsButton) {
            this.settingsButton.addEventListener('click', () => this.openSettings());
        }
        
        // 閉じるボタンクリック
        if (this.closeSettingsButton) {
            this.closeSettingsButton.addEventListener('click', () => this.closeSettings());
        }
        
        // リセットボタンクリック
        if (this.resetSettingsButton) {
            this.resetSettingsButton.addEventListener('click', () => this.resetToDefaults());
        }
        
        // プリセットボタンクリック
        const presetQuiet = document.getElementById('preset-quiet');
        const presetNormal = document.getElementById('preset-normal');
        const presetLoud = document.getElementById('preset-loud');
        
        if (presetQuiet) {
            presetQuiet.addEventListener('click', () => this.applyPreset('quiet'));
        }
        if (presetNormal) {
            presetNormal.addEventListener('click', () => this.applyPreset('normal'));
        }
        if (presetLoud) {
            presetLoud.addEventListener('click', () => this.applyPreset('loud'));
        }
        
        // 音量スライダーの変更イベント
        Object.keys(this.volumeSliders).forEach(type => {
            const slider = this.volumeSliders[type];
            if (slider) {
                slider.addEventListener('input', (e) => {
                    this.onVolumeChange(type, parseFloat(e.target.value));
                });
                
                // リアルタイム試聴のための mousedown/touchstart イベント
                slider.addEventListener('mousedown', () => this.startVolumePreview(type));
                slider.addEventListener('touchstart', () => this.startVolumePreview(type));
            }
        });
        
        // ミュートボタンの変更イベント
        Object.keys(this.muteButtons).forEach(type => {
            const button = this.muteButtons[type];
            if (button) {
                button.addEventListener('click', () => this.toggleMute(type));
            }
        });
        
        // モーダル外クリックで閉じる
        if (this.settingsModal) {
            this.settingsModal.addEventListener('click', (e) => {
                if (e.target === this.settingsModal) {
                    this.closeSettings();
                }
            });
        }
        
        // ESCキーで閉じる
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) {
                this.closeSettings();
            }
        });
    }
    
    /**
     * 設定画面を開く
     */
    openSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.remove('hidden');
            this.isOpen = true;
            this.updateSliders();
            
            // ゲームポーズ
            if (this.game && this.game.isPaused !== undefined) {
                this.game.isPaused = true;
            }
            
            console.log('⏸️ Settings opened, game paused');
        }
    }
    
    /**
     * 設定画面を閉じる
     */
    closeSettings() {
        if (this.settingsModal) {
            this.settingsModal.classList.add('hidden');
            this.isOpen = false;
            
            // ゲーム再開
            if (this.game && this.game.isPaused !== undefined) {
                this.game.isPaused = false;
            }
            
            console.log('▶️ Settings closed, game resumed');
        }
    }
    
    /**
     * 音量変更時の処理
     * @param {string} type - 音量タイプ
     * @param {number} value - 音量値 (0-100)
     */
    onVolumeChange(type, value) {
        const volume = value / 100; // 0-1に正規化
        
        console.log(`🔧 SettingsSystem: Volume change requested - ${type}: ${value}% (${volume.toFixed(3)})`);
        
        // AudioSystemに音量設定を反映
        if (this.game.audioSystem) {
            this.game.audioSystem.setVolume(type, volume);
            console.log(`🔧 SettingsSystem: Volume sent to AudioSystem - ${type}: ${volume.toFixed(3)}`);
        } else {
            console.warn('🔧 SettingsSystem: AudioSystem not available');
        }
        
        // 表示更新
        this.updateVolumeDisplay(type, Math.round(value));
        
        // ミュート状態の更新
        this.updateMuteButton(type, volume > 0);
        
        // AudioSystemが自動的に設定を保存する
        console.log(`🔧 SettingsSystem: Volume change completed - ${type}: ${volume.toFixed(3)}`);
    }
    
    /**
     * 音量プレビュー開始
     * @param {string} type - 音量タイプ
     */
    startVolumePreview(type) {
        if (type === 'sfx' && this.game.audioSystem) {
            // 効果音のプレビュー（射撃音を短時間再生）
            setTimeout(() => {
                if (this.game.audioSystem.sounds.shoot) {
                    this.game.audioSystem.sounds.shoot();
                }
            }, 100);
        }
    }
    
    /**
     * ミュート切り替え
     * @param {string} type - 音量タイプ
     */
    toggleMute(type) {
        const slider = this.volumeSliders[type];
        if (!slider) return;
        
        const currentValue = parseFloat(slider.value);
        
        if (currentValue > 0) {
            // ミュート: 音量を0に
            slider.dataset.previousValue = currentValue.toString();
            slider.value = '0';
            this.onVolumeChange(type, 0);
        } else {
            // ミュート解除: 前の音量に戻す
            const previousValue = parseFloat(slider.dataset.previousValue || '50');
            slider.value = previousValue.toString();
            this.onVolumeChange(type, previousValue);
        }
    }
    
    /**
     * デフォルト設定にリセット
     */
    resetToDefaults() {
        const defaults = {
            master: 80,
            sfx: 70
        };
        
        Object.keys(defaults).forEach(type => {
            const slider = this.volumeSliders[type];
            if (slider) {
                slider.value = defaults[type].toString();
                this.onVolumeChange(type, defaults[type]);
            }
        });
        
        // 確認メッセージ
        this.showNotification('設定をデフォルトに戻しました');
        
        // AudioSystemが自動的に設定を保存する
    }
    
    /**
     * プリセット適用
     * @param {string} presetType - プリセットタイプ ('quiet', 'normal', 'loud')
     */
    applyPreset(presetType) {
        const presets = {
            quiet: {
                master: 40,
                sfx: 30
            },
            normal: {
                master: 80,
                sfx: 70
            },
            loud: {
                master: 100,
                sfx: 100
            }
        };
        
        const preset = presets[presetType];
        if (!preset) return;
        
        Object.keys(preset).forEach(type => {
            const slider = this.volumeSliders[type];
            if (slider) {
                slider.value = preset[type].toString();
                this.onVolumeChange(type, preset[type]);
            }
        });
        
        // 確認メッセージ
        const presetNames = {
            quiet: '静か',
            normal: '標準',
            loud: '大音量'
        };
        this.showNotification(`${presetNames[presetType]}プリセットを適用しました`);
    }
    
    /**
     * スライダーの値を更新
     */
    updateSliders() {
        if (!this.game.audioSystem) return;
        
        Object.keys(this.volumeSliders).forEach(type => {
            const slider = this.volumeSliders[type];
            if (slider) {
                const volume = this.game.audioSystem.getVolume(type);
                const percentage = Math.round(volume * 100);
                slider.value = percentage.toString();
                this.updateVolumeDisplay(type, percentage);
                this.updateMuteButton(type, volume > 0);
            }
        });
    }
    
    /**
     * 音量表示の更新
     * @param {string} type - 音量タイプ
     * @param {number} percentage - 音量パーセンテージ
     */
    updateVolumeDisplay(type, percentage) {
        const display = this.volumeDisplays[type];
        if (display) {
            display.textContent = `${percentage}%`;
        }
    }
    
    /**
     * ミュートボタンの表示更新
     * @param {string} type - 音量タイプ
     * @param {boolean} isUnmuted - ミュート解除状態
     */
    updateMuteButton(type, isUnmuted) {
        const button = this.muteButtons[type];
        if (button) {
            button.textContent = isUnmuted ? '🔊' : '🔇';
            button.setAttribute('aria-label', isUnmuted ? 'ミュート' : 'ミュート解除');
        }
    }
    
    /**
     * 通知メッセージ表示
     * @param {string} message - メッセージ
     */
    showNotification(message) {
        // 簡易通知システム
        const notification = document.createElement('div');
        notification.className = 'settings-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            z-index: 10000;
            font-size: 14px;
        `;
        
        document.body.appendChild(notification);
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }
    
    /**
     * 設定をlocalStorageに保存
     */
    saveSettings() {
        // AudioSystemが自動的に設定を保存するため、
        // ここでは何もしない（重複保存防止）
        console.log('🔧 SettingsSystem: AudioSystem handles volume saving');
    }
    
    /**
     * 設定をlocalStorageから読み込み
     */
    loadSettings() {
        // AudioSystemが既に設定を読み込んでいるため、
        // ここでは何もしない（重複読み込み防止）
        console.log('🔧 SettingsSystem: AudioSystem handles volume loading');
        return true;
    }
}