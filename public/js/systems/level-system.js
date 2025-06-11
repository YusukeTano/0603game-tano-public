/**
 * LevelSystem - レベル管理システム
 * レベルアップ・経験値・スキル選択の一元管理
 */
export class LevelSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // レアリティ設定
        this.rarityWeights = {
            common: 50,      // 50%
            uncommon: 30,    // 30%
            rare: 13,        // 13%
            epic: 5,         // 5%
            legendary: 2     // 2%
        };
        
        // レアリティカラー設定
        this.rarityColors = {
            common: '#b0bec5',
            uncommon: '#66bb6a',
            rare: '#42a5f5',
            epic: '#ab47bc',
            legendary: '#ff9800'
        };
        
        // アップグレード定義
        this.availableUpgrades = this._defineUpgrades();
        
        console.log('LevelSystem: レベルシステム初期化完了');
    }
    
    /**
     * 経験値を追加
     * @param {number} amount - 追加する経験値量
     */
    addExperience(amount) {
        this.game.player.exp += amount;
        
        // レベルアップチェック
        while (this.game.player.exp >= this.game.player.expToNext) {
            this.levelUp();
        }
    }
    
    /**
     * レベルアップ処理
     */
    levelUp() {
        this.game.player.level++;
        this.game.player.exp -= this.game.player.expToNext;
        this.game.player.expToNext = Math.floor(this.game.player.expToNext * 1.2);
        
        // レベルアップ音再生
        if (this.game.audioSystem.sounds.levelUp) {
            this.game.audioSystem.sounds.levelUp();
        }
        
        // レベルアップエフェクト
        this.game.particleSystem.createLevelUpEffect(
            this.game.player.x,
            this.game.player.y
        );
        
        // レベルアップモーダル表示（ゲームとBGMを一時停止）
        this.game.isPaused = true;
        this.game.audioSystem.stopBGM();
        this.showLevelUpOptions();
    }
    
    /**
     * レベルアップオプション表示
     */
    showLevelUpOptions() {
        const modal = document.getElementById('levelup-modal');
        const options = document.getElementById('upgrade-options');
        
        // 3つのアップグレードを選択
        const selectedUpgrades = this.selectRandomUpgrades(3);
        
        // オプションをクリア
        options.innerHTML = '';
        
        selectedUpgrades.forEach((upgrade, index) => {
            const div = document.createElement('div');
            div.className = 'upgrade-option';
            div.dataset.rarity = upgrade.rarity;
            div.style.borderColor = this.rarityColors[upgrade.rarity];
            
            // レアリティラベル
            const rarityLabel = document.createElement('div');
            rarityLabel.className = 'rarity-label';
            rarityLabel.textContent = this._getRarityLabel(upgrade.rarity);
            rarityLabel.style.color = this.rarityColors[upgrade.rarity];
            
            // アップグレード名
            const name = document.createElement('div');
            name.className = 'upgrade-name';
            name.textContent = upgrade.name;
            
            // アップグレード説明
            const desc = document.createElement('div');
            desc.className = 'upgrade-desc';
            desc.textContent = upgrade.desc;
            
            div.appendChild(rarityLabel);
            div.appendChild(name);
            div.appendChild(desc);
            
            // スキル選択処理をまとめた関数
            const handleSkillSelect = (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.applyUpgrade(upgrade);
                this.hideLevelUpOptions();
                console.log('Skill selected:', upgrade.name);
            };
            
            // PC用クリックイベント
            div.addEventListener('click', handleSkillSelect);
            
            // iPhone用タッチイベント（より確実な処理）
            let touchStarted = false;
            
            div.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();
                touchStarted = true;
                // 視覚的フィードバック
                div.style.transform = 'scale(0.95)';
                div.style.opacity = '0.8';
                console.log('Skill option touchstart:', upgrade.name);
            }, { passive: false });
            
            div.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (touchStarted) {
                    // 視覚的フィードバックをリセット
                    div.style.transform = '';
                    div.style.opacity = '';
                    touchStarted = false;
                    handleSkillSelect(e);
                }
            }, { passive: false });
            
            div.addEventListener('touchcancel', (e) => {
                // タッチキャンセル時の視覚的フィードバックリセット
                div.style.transform = '';
                div.style.opacity = '';
                touchStarted = false;
                console.log('Skill option touch cancelled');
            }, { passive: false });
            
            options.appendChild(div);
        });
        
        // モーダル内でのタッチイベント分離（タッチスクロール防止の競合を避ける）
        modal.addEventListener('touchmove', (e) => {
            e.stopPropagation(); // 親要素（document）への伝播を阻止
            console.log('Modal touchmove - propagation stopped');
        }, { passive: false });
        
        modal.addEventListener('touchstart', (e) => {
            e.stopPropagation(); // 親要素への伝播を阻止
            console.log('Modal touchstart - propagation stopped');
        }, { passive: false });
        
        modal.classList.remove('hidden');
        console.log('Level up modal displayed with touch event isolation');
    }
    
    /**
     * レベルアップオプションを隠す
     */
    hideLevelUpOptions() {
        document.getElementById('levelup-modal').classList.add('hidden');
        this.game.isPaused = false;
        this.game.audioSystem.startBGM();
    }
    
    /**
     * アップグレード適用
     * @param {Object} upgrade - 適用するアップグレード
     */
    applyUpgrade(upgrade) {
        upgrade.effect();
        
        // アップグレード音再生
        if (this.game.audioSystem.sounds.upgrade) {
            this.game.audioSystem.sounds.upgrade();
        }
    }
    
    /**
     * ランダムアップグレード選択（レアリティ重み付き）
     * @param {number} count - 選択数
     * @returns {Array} 選択されたアップグレード
     */
    selectRandomUpgrades(count) {
        // ベースアップグレードと武器アップグレードを組み合わせ
        const available = [...this.availableUpgrades, ...this._getWeaponUpgrades()];
        const selected = [];
        
        for (let i = 0; i < count && available.length > 0; i++) {
            // 重み付き選択
            const totalWeight = available.reduce((sum, upgrade) => {
                return sum + (this.rarityWeights[upgrade.rarity] || this.rarityWeights.common);
            }, 0);
            
            let random = Math.random() * totalWeight;
            let selectedUpgrade = null;
            
            for (const upgrade of available) {
                const weight = this.rarityWeights[upgrade.rarity] || this.rarityWeights.common;
                random -= weight;
                if (random <= 0) {
                    selectedUpgrade = upgrade;
                    break;
                }
            }
            
            if (selectedUpgrade) {
                selected.push(selectedUpgrade);
                available.splice(available.indexOf(selectedUpgrade), 1);
            }
        }
        
        return selected;
    }
    
    /**
     * 武器アンロックアップグレード追加
     * @private
     * @returns {Array} 武器アップグレードリスト
     */
    _getWeaponUpgrades() {
        const weaponUpgrades = [];
        
        // 未解除武器のオプションを追加
        Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
            const weapon = this.game.weaponSystem.getWeapon(weaponKey);
            if (!weapon.unlocked && weaponKey !== 'plasma') {
                let rarityChance;
                switch (weapon.rarity) {
                    case 'uncommon': rarityChance = 0.7; break;
                    case 'rare': rarityChance = 0.3; break;
                    case 'epic': rarityChance = 0.1; break;
                    default: rarityChance = 1;
                }
                
                if (Math.random() < rarityChance) {
                    const weaponType = '左クリック武器';
                    
                    weaponUpgrades.push({
                        name: `${weapon.name}解除`,
                        desc: `${weaponType}: ${this._getWeaponDescription(weaponKey)}`,
                        rarity: weapon.rarity,
                        effect: () => {
                            this.game.unlockWeapon(weaponKey);
                        }
                    });
                }
            }
        });
        
        return weaponUpgrades;
    }
    
    /**
     * 武器の説明取得
     * @private
     * @param {string} weaponKey - 武器キー
     * @returns {string} 武器説明
     */
    _getWeaponDescription(weaponKey) {
        const descriptions = {
            plasma: '標準的なプラズマ武器、無限弾薬',
            nuke: '強力な爆発ダメージ、限定使用'
        };
        return descriptions[weaponKey] || '特殊武器';
    }
    
    /**
     * アップグレード定義
     * @private
     * @returns {Array} アップグレードリスト
     */
    _defineUpgrades() {
        const baseUpgrades = [
            // Common (50%)
            {
                name: '攻撃力強化',
                desc: '現在の武器のダメージ+5',
                rarity: 'common',
                effect: () => {
                    const weapon = this.game.weaponSystem.getCurrentWeapon();
                    weapon.damage += 5;
                }
            },
            {
                name: '連射速度向上',
                desc: '現在の武器の射撃間隔-10ms',
                rarity: 'common',
                effect: () => {
                    const weapon = this.game.weaponSystem.getCurrentWeapon();
                    weapon.fireRate = Math.max(50, weapon.fireRate - 10);
                }
            },
            {
                name: '射程範囲増加',
                desc: '武器の射程距離+30%',
                rarity: 'common',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(key => {
                        this.game.weaponSystem.multiplyWeaponProperty(key, 'range', 1.3);
                    });
                }
            },
            {
                name: '移動速度向上',
                desc: '移動速度+10%',
                rarity: 'common',
                effect: () => {
                    this.game.player.speed *= 1.1;
                }
            },
            {
                name: '最大体力増加',
                desc: '最大HP+20',
                rarity: 'common',
                effect: () => {
                    this.game.player.maxHealth += 20;
                    this.game.player.health += 20;
                }
            },
            
            // Uncommon (30%)
            {
                name: '体力回復',
                desc: '現在の体力を30%回復',
                rarity: 'uncommon',
                effect: () => {
                    const healAmount = Math.floor(this.game.player.maxHealth * 0.3);
                    this.game.player.health = Math.min(
                        this.game.player.health + healAmount,
                        this.game.player.maxHealth
                    );
                }
            },
            {
                name: '弾の大きさ増加',
                desc: '弾のサイズと当たり判定+50%',
                rarity: 'uncommon',
                effect: () => {
                    if (!this.game.player.bulletSizeMultiplier) {
                        this.game.player.bulletSizeMultiplier = 1;
                    }
                    this.game.player.bulletSizeMultiplier *= 1.5;
                }
            },
            {
                name: '波動チャージ増加',
                desc: '波動攻撃の最大チャージ数+2',
                rarity: 'uncommon',
                effect: () => {
                    // 波動攻撃のチャージ上限増加
                    if (!this.game.player.maxWaveCharges) {
                        this.game.player.maxWaveCharges = 10;
                    }
                    this.game.player.maxWaveCharges += 2;
                }
            },
            
            // Rare (13%)
            {
                name: '貫通性能',
                desc: '弾丸が敵を1体追加で貫通する',
                rarity: 'rare',
                effect: () => {
                    if (!this.game.player.piercing) {
                        this.game.player.piercing = 0;
                    }
                    this.game.player.piercing += 1;
                }
            },
            {
                name: '全武器強化',
                desc: '全武器のダメージ+25%',
                rarity: 'rare',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(key => {
                        this.game.weaponSystem.multiplyWeaponProperty(key, 'damage', 1.25);
                    });
                }
            },
            
            // Epic (5%)
            {
                name: 'マルチショット',
                desc: '1回の射撃で0.5発追加',
                rarity: 'epic',
                effect: () => {
                    if (!this.game.player.multiShot) {
                        this.game.player.multiShot = 1;
                    }
                    this.game.player.multiShot += 0.5;
                }
            },
            {
                name: '反射性能',
                desc: '弾丸が壁で1回追加で跳ね返る',
                rarity: 'epic',
                effect: () => {
                    if (!this.game.player.bounces) {
                        this.game.player.bounces = 0;
                    }
                    this.game.player.bounces += 1;
                }
            },
            
            // Legendary (2%)
            {
                name: 'ホーミング性能',
                desc: '弾丸が敵を自動追尾する',
                rarity: 'legendary',
                effect: () => {
                    this.game.player.homing = true;
                    this.game.player.homingStrength = 0.1;
                }
            },
            {
                name: 'バリア付与',
                desc: '10秒間無敵バリアを付与',
                rarity: 'legendary',
                effect: () => {
                    this.game.player.barrierActive = true;
                    this.game.player.barrierTimeLeft = 10000; // 10秒
                }
            }
        ];
        
        return baseUpgrades;
    }
    
    /**
     * レアリティラベル取得
     * @private
     * @param {string} rarity - レアリティ
     * @returns {string} 表示用ラベル
     */
    _getRarityLabel(rarity) {
        const labels = {
            common: 'コモン',
            uncommon: 'アンコモン',
            rare: 'レア',
            epic: 'エピック',
            legendary: 'レジェンダリー'
        };
        return labels[rarity] || 'コモン';
    }
    
    /**
     * 現在のレベル情報取得
     * @returns {Object} レベル情報
     */
    getLevelInfo() {
        return {
            level: this.game.player.level,
            exp: this.game.player.exp,
            expToNext: this.game.player.expToNext,
            expPercentage: (this.game.player.exp / this.game.player.expToNext) * 100
        };
    }
    
    /**
     * 敵タイプ別の経験値取得
     * @param {string} enemyType - 敵タイプ
     * @returns {number} 経験値量
     */
    getExperienceForEnemy(enemyType) {
        const expValues = {
            normal: 15,
            fast: 20,
            shooter: 25,
            tank: 40,
            boss: 100
        };
        return expValues[enemyType] || 15;
    }
}