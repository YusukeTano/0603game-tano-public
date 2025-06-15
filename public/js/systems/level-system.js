/**
 * LevelSystem - レベル管理システム
 * レベルアップ・経験値・スキル選択の一元管理
 */
import { TutorialConfig } from '../config/tutorial.js';
import { SkillLevelCalculator } from '../utils/skill-level-calculator.js';

export class LevelSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // レアリティ設定
        this.rarityWeights = {
            common: 67.679,     // 67.679%
            uncommon: 17.591,   // 17.591%
            rare: 8.329,        // 8.329%
            epic: 5.391,        // 5.391%
            legendary: 1.010    // 1.010%
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
        
        // スキルレベル計算システム
        this.skillLevelCalculator = new SkillLevelCalculator(this.game);
        
        console.log('LevelSystem: レベルシステム初期化完了');
    }
    
    /**
     * 経験値を追加
     * @param {number} amount - 追加する経験値量
     */
    addExperience(amount) {
        // チュートリアル: 経験値ブースト適用
        const currentStage = this.game.stageSystem ? this.game.stageSystem.getStageInfo().stage : 1;
        const expMultiplier = TutorialConfig.getExperienceMultiplier(currentStage, this.game.player.level);
        
        if (expMultiplier > 1.0) {
            const boostedAmount = amount * expMultiplier;
            console.log('LevelSystem: Experience boosted', {
                original: amount,
                multiplier: expMultiplier,
                boosted: boostedAmount,
                stage: currentStage,
                level: this.game.player.level
            });
            amount = boostedAmount;
        }
        
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
            div.className = `upgrade-option ${upgrade.rarity}`;
            div.dataset.rarity = upgrade.rarity;
            // div.style.borderColor = this.rarityColors[upgrade.rarity]; // CSSアニメーションのため削除
            
            // レアリティラベル
            const rarityLabel = document.createElement('div');
            rarityLabel.className = 'rarity-label';
            rarityLabel.textContent = this._getRarityLabel(upgrade.rarity);
            // rarityLabel.style.color = this.rarityColors[upgrade.rarity]; // CSSで管理
            
            // アップグレード名とレベル表示
            const name = document.createElement('div');
            name.className = 'upgrade-title';
            
            // スキルレベル情報を取得（レアリティも渡す）
            const levelInfo = this.skillLevelCalculator.getSkillLevelInfo(upgrade.name, upgrade.rarity);
            
            // スキル名とレベル表示を組み合わせ
            const skillNameSpan = document.createElement('span');
            skillNameSpan.className = 'skill-name';
            skillNameSpan.textContent = upgrade.name;
            
            const skillLevelSpan = document.createElement('span');
            skillLevelSpan.className = 'skill-level';
            skillLevelSpan.textContent = levelInfo.display;
            
            name.appendChild(skillNameSpan);
            name.appendChild(skillLevelSpan);
            
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
        // スキル効果を適用
        upgrade.effect();
        
        // スキル取得レベルを更新（効果量ベース）
        this._updateSkillLevel(upgrade);
        
        // アップグレード音再生
        if (this.game.audioSystem.sounds.upgrade) {
            this.game.audioSystem.sounds.upgrade();
        }
    }
    
    /**
     * スキル取得レベルを更新
     * @param {Object} upgrade - 適用したアップグレード
     * @private
     */
    _updateSkillLevel(upgrade) {
        // レアリティに応じたレベル加算値
        const rarityLevelGain = {
            common: 1,      // 10%効果 = +1レベル
            uncommon: 2,    // 20%効果 = +2レベル
            rare: 3,        // 30%効果 = +3レベル
            epic: 3,        // 30%効果 = +3レベル
            legendary: 2    // 20%効果 = +2レベル
        };
        
        // スキルタイプを判定
        const skillType = this.skillLevelCalculator.getSkillTypeFromName(upgrade.name);
        
        if (skillType !== 'unknown' && this.game.player.skillLevels[skillType] !== undefined) {
            const levelGain = rarityLevelGain[upgrade.rarity] || 1;
            this.game.player.skillLevels[skillType] += levelGain;
            
            console.log(`LevelSystem: ${upgrade.name} 取得`, {
                skillType: skillType,
                rarity: upgrade.rarity,
                levelGain: levelGain,
                newLevel: this.game.player.skillLevels[skillType]
            });
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
        
        // 未解除武器のオプションを追加（ピックアップ限定武器を除外）
        Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
            const weapon = this.game.weaponSystem.getWeapon(weaponKey);
            if (!weapon.unlocked && weaponKey !== 'plasma' && !weapon.isPickupOnly) {
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
            // === Common (67.679%) ===
            {
                name: '攻撃力強化 I',
                desc: '全武器のダメージ+10%',
                rarity: 'common',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
                        const weapon = this.game.weaponSystem.weapons[weaponKey];
                        if (!weapon.isTemporary) {
                            weapon.damage *= 1.1;
                        }
                    });
                }
            },
            {
                name: '連射速度向上 I',
                desc: '全武器の射撃速度+10%',
                rarity: 'common',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
                        const weapon = this.game.weaponSystem.weapons[weaponKey];
                        if (!weapon.isTemporary) {
                            weapon.fireRate *= 0.9; // 10%向上
                            weapon.fireRate = Math.max(30, weapon.fireRate);
                        }
                    });
                }
            },
            {
                name: '弾の大きさ増加 I',
                desc: '弾のサイズ+10%',
                rarity: 'common',
                effect: () => {
                    if (!this.game.player.bulletSizeMultiplier) {
                        this.game.player.bulletSizeMultiplier = 1;
                    }
                    this.game.player.bulletSizeMultiplier *= 1.1;
                }
            },
            
            // === Uncommon (17.591%) ===
            {
                name: '攻撃力強化 II',
                desc: '全武器のダメージ+20%',
                rarity: 'uncommon',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
                        const weapon = this.game.weaponSystem.weapons[weaponKey];
                        if (!weapon.isTemporary) {
                            weapon.damage *= 1.2;
                        }
                    });
                }
            },
            {
                name: '連射速度向上 II',
                desc: '全武器の射撃速度+20%',
                rarity: 'uncommon',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
                        const weapon = this.game.weaponSystem.weapons[weaponKey];
                        if (!weapon.isTemporary) {
                            weapon.fireRate *= 0.8; // 20%向上
                            weapon.fireRate = Math.max(30, weapon.fireRate);
                        }
                    });
                }
            },
            {
                name: '弾の大きさ増加 II',
                desc: '弾のサイズ+20%',
                rarity: 'uncommon',
                effect: () => {
                    if (!this.game.player.bulletSizeMultiplier) {
                        this.game.player.bulletSizeMultiplier = 1;
                    }
                    this.game.player.bulletSizeMultiplier *= 1.2;
                }
            },
            {
                name: '貫通性能 I',
                desc: '弾丸貫通確率+10%',
                rarity: 'uncommon',
                effect: () => {
                    this.game.player.piercingChance = 
                        (this.game.player.piercingChance || 0) + 10;
                }
            },
            {
                name: 'マルチショット I',
                desc: '追加弾発射確率+10%',
                rarity: 'uncommon',
                effect: () => {
                    this.game.player.multiShotChance = 
                        (this.game.player.multiShotChance || 0) + 10;
                }
            },
            
            // === Rare (8.329%) ===
            {
                name: '攻撃力強化 III',
                desc: '全武器のダメージ+30%',
                rarity: 'rare',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
                        const weapon = this.game.weaponSystem.weapons[weaponKey];
                        if (!weapon.isTemporary) {
                            weapon.damage *= 1.3;
                        }
                    });
                }
            },
            {
                name: '連射速度向上 III',
                desc: '全武器の射撃速度+30%',
                rarity: 'rare',
                effect: () => {
                    Object.keys(this.game.weaponSystem.weapons).forEach(weaponKey => {
                        const weapon = this.game.weaponSystem.weapons[weaponKey];
                        if (!weapon.isTemporary) {
                            weapon.fireRate *= 0.7; // 30%向上
                            weapon.fireRate = Math.max(30, weapon.fireRate);
                        }
                    });
                }
            },
            {
                name: '弾の大きさ増加 III',
                desc: '弾のサイズ+30%',
                rarity: 'rare',
                effect: () => {
                    if (!this.game.player.bulletSizeMultiplier) {
                        this.game.player.bulletSizeMultiplier = 1;
                    }
                    this.game.player.bulletSizeMultiplier *= 1.3;
                }
            },
            {
                name: '貫通性能 II',
                desc: '弾丸貫通確率+20%',
                rarity: 'rare',
                effect: () => {
                    this.game.player.piercingChance = 
                        (this.game.player.piercingChance || 0) + 20;
                }
            },
            {
                name: 'マルチショット II',
                desc: '追加弾発射確率+20%',
                rarity: 'rare',
                effect: () => {
                    this.game.player.multiShotChance = 
                        (this.game.player.multiShotChance || 0) + 20;
                }
            },
            
            // === Epic (5.391%) ===
            {
                name: '貫通性能 III',
                desc: '弾丸貫通確率+30%',
                rarity: 'epic',
                effect: () => {
                    this.game.player.piercingChance = 
                        (this.game.player.piercingChance || 0) + 30;
                }
            },
            {
                name: 'マルチショット III',
                desc: '追加弾発射確率+30%',
                rarity: 'epic',
                effect: () => {
                    this.game.player.multiShotChance = 
                        (this.game.player.multiShotChance || 0) + 30;
                }
            },
            
            // === Legendary (1.010%) ===
            {
                name: 'ホーミング性能',
                desc: 'ホーミング追尾性能+20%',
                rarity: 'legendary',
                effect: () => {
                    this.game.player.homingStrengthBonus = 
                        (this.game.player.homingStrengthBonus || 0) + 0.02;
                    this.game.player.homingRangeBonus = 
                        (this.game.player.homingRangeBonus || 0) + 40;
                }
            },
            {
                name: '反射性能',
                desc: '弾丸反射確率+20%',
                rarity: 'legendary',
                effect: () => {
                    this.game.player.bounceChance = 
                        (this.game.player.bounceChance || 0) + 20;
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