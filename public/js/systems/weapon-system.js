/**
 * WeaponSystem - 武器管理システム
 * 武器切り替え・弾丸生成・武器アップグレードの一元管理
 */
import { ComboColorSystem } from '../utils/combo-color-system.js';

export class WeaponSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        this.comboColorSystem = new ComboColorSystem();
        
        // 武器設定定義
        this.weapons = {
            plasma: {
                name: 'プラズマライフル',
                damage: 50,
                fireRate: 300,
                lastShot: 0,
                ammo: 999,
                maxAmmo: 999,
                totalAmmo: 999,
                reloadTime: 0,
                isReloading: false,
                spread: 0.1,
                range: 300,
                unlocked: true,
                rarity: 'common'
            },
            // 一時的左クリック武器: ニュークランチャー（5発制限）
            nuke: {
                name: 'ニュークランチャー',
                damage: 700,
                fireRate: 800, // 発射間隔
                lastShot: 0,
                ammo: 0, // 取得時に5発設定
                maxAmmo: 5,
                totalAmmo: 999,
                reloadTime: 0,
                isReloading: false,
                spread: 0,
                range: 700,
                unlocked: false,
                limitedAmmo: true, // 制限弾薬武器
                nuke: true,
                rarity: 'legendary',
                isTemporary: true,    // 一時武器フラグ
                isPickupOnly: true,   // ドロップ限定武器
                autoRevert: true      // 弾切れ時自動復帰
            },
            // 一時的左クリック武器: スーパーホーミングガン（25発制限）
            superHoming: {
                name: 'スーパーホーミングガン',
                damage: 120,
                fireRate: 250, // 高速連射
                lastShot: 0,
                ammo: 0, // 取得時に25発設定
                maxAmmo: 25,
                totalAmmo: 999,
                reloadTime: 0,
                isReloading: false,
                spread: 0,
                range: 1000,
                unlocked: false,
                limitedAmmo: true, // 制限弾薬武器
                homing: true,
                superHoming: true, // 超強力ホーミング
                homingStrength: 0.3, // 通常の15倍
                homingRange: 800, // 通常の4倍
                penetration: 2, // 貫通能力
                rarity: 'legendary',
                isTemporary: true,    // 一時武器フラグ
                isPickupOnly: true,   // ドロップ限定武器
                autoRevert: true      // 弾切れ時自動復帰
            },
            // 一時的左クリック武器: スーパーショットガン（15発制限）
            superShotgun: {
                name: 'スーパーショットガン',
                damage: 25, // 1発あたり（15発同時 = 375総ダメージ）
                fireRate: 400, // 0.4秒間隔（高速連射）
                lastShot: 0,
                ammo: 0, // 取得時に15発設定
                maxAmmo: 15,
                totalAmmo: 999,
                reloadTime: 0,
                isReloading: false,
                spread: Math.PI / 3, // 60度拡散
                range: 500, // 長射程
                unlocked: false,
                limitedAmmo: true, // 制限弾薬武器
                shotgun: true, // ショットガンフラグ
                pelletsPerShot: 15, // 15発同時発射
                penetration: 1, // 各弾丸1回貫通
                bulletSpeed: 1200, // 高速弾丸（2倍速）
                rarity: 'legendary',
                isTemporary: true,    // 一時武器フラグ
                isPickupOnly: true,   // ドロップ限定武器
                autoRevert: true      // 弾切れ時自動復帰
            },
        };
        
        this.currentWeapon = 'plasma';
        this.previousWeapon = 'plasma'; // 弾薬切れ時の戻り先武器
        this.baseWeapon = 'plasma'; // 一時武器から常に戻るべきベース武器
        
        console.log('WeaponSystem: 武器システム初期化完了');
    }
    
    /**
     * 現在の武器を取得
     * @returns {Object} 現在の武器オブジェクト
     */
    getCurrentWeapon() {
        return this.weapons[this.currentWeapon];
    }
    
    /**
     * 武器切り替え
     * @param {string} weaponKey - 切り替え先の武器キー
     */
    switchWeapon(weaponKey) {
        if (this.weapons[weaponKey] && this.weapons[weaponKey].unlocked) {
            this.previousWeapon = this.currentWeapon;
            this.currentWeapon = weaponKey;
        }
    }
    
    /**
     * 武器の更新処理（射撃判定）
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        const weapon = this.getCurrentWeapon();
        
        // 左クリック武器は無限弾薬のためリロード処理なし
        // プライマリ武器の射撃
        const canShoot = Date.now() - weapon.lastShot > weapon.fireRate;
        
        // 射撃判定（フォールバック機能付き）
        let wantToShoot = false;
        
        // キャラクター別射撃入力を取得
        const characterType = this.game.player?.characterType || 'ray';
        wantToShoot = this.game.inputSystem.getShootingInput(characterType);
        
        // デバッグログ（開発環境のみ）
        if (wantToShoot && window.location.hostname === 'localhost') {
            console.log('🔫 WeaponSystem shooting:', {
                weapon: this.currentWeapon,
                combo: this.game.combo?.count || 0
            });
        }
        
        if (canShoot && wantToShoot) {
            this.shoot();
        }
    }
    
    /**
     * 射撃実行
     */
    shoot() {
        this.shootWithWeapon(this.currentWeapon);
    }
    
    /**
     * 指定武器での射撃
     * @param {string} weaponKey - 使用する武器キー
     */
    shootWithWeapon(weaponKey) {
        const weapon = this.weapons[weaponKey];
        
        // 制限弾薬武器の弾薬チェック
        if (weapon.limitedAmmo && weapon.ammo <= 0) {
            // 一時武器が弾切れの場合、ベース武器に戻る
            if (weaponKey === this.currentWeapon) {
                this.currentWeapon = this.baseWeapon;
                console.log('WeaponSystem: 弾切れによりベース武器に復帰', {
                    fromWeapon: weaponKey,
                    toBaseWeapon: this.baseWeapon
                });
                
                // 特殊武器をリセット
                if (weaponKey === 'nuke') {
                    this.weapons.nuke.unlocked = false;
                    this.weapons.nuke.ammo = 0;
                } else if (weaponKey === 'superHoming') {
                    this.weapons.superHoming.unlocked = false;
                    this.weapons.superHoming.ammo = 0;
                } else if (weaponKey === 'superShotgun') {
                    this.weapons.superShotgun.unlocked = false;
                    this.weapons.superShotgun.ammo = 0;
                }
            }
            return;
        }
        
        // 弾薬消費
        if (weapon.limitedAmmo) {
            weapon.ammo--;
        }
        weapon.lastShot = Date.now();
        
        // 強化射撃音再生（武器別・ゲーム状態連携）
        if (this.game.audioSystem?.playEnhancedShootSound) {
            const weaponType = this.getAudioWeaponType(weapon);
            this.game.audioSystem.playEnhancedShootSound(weaponType);
        }
        
        // 特殊武器の特別処理
        if (weapon.nuke) {
            this._createNukeBullet(weapon);
            return; // ニューク武器は特別処理で終了
        } else if (weapon.superHoming) {
            this._createSuperHomingBullet(weapon);
            return; // スーパーホーミング武器は特別処理で終了
        } else if (weapon.shotgun) {
            this._createSuperShotgunBullets(weapon);
            return; // スーパーショットガン武器は特別処理で終了
        }
        
        // 通常武器の弾丸作成
        this._createNormalBullets(weapon, weaponKey);
    }
    
    /**
     * ニューク弾丸作成
     * @param {Object} weapon - 武器オブジェクト
     * @private
     */
    _createNukeBullet(weapon) {
        const angle = this.game.player.angle;
        
        // コンボ弾丸色システムから情報を取得
        const comboCount = this.game.combo ? this.game.combo.count : 0;
        const bulletInfo = this.comboColorSystem.getBulletInfo(comboCount);
        
        // デバッグログ（開発環境・高コンボ時のみ）
        if (comboCount > 0 && comboCount % 15 === 0 && window.location.hostname === 'localhost') {
            console.log('[WeaponSystem] 高コンボ状態:', {
                comboCount,
                isRainbow: bulletInfo.isRainbow,
                sizeMultiplier: bulletInfo.sizeMultiplier
            });
        }
        
        const baseBulletSize = 8;
        const bulletSizeMultiplier = this.game.player.bulletSizeMultiplier || 1;
        const comboSizeMultiplier = bulletInfo.sizeMultiplier || 1;
        const bulletSize = baseBulletSize * bulletSizeMultiplier * comboSizeMultiplier;
        
        const nukeBullet = {
            x: this.game.player.x + Math.cos(angle) * 25,
            y: this.game.player.y + Math.sin(angle) * 25,
            vx: Math.cos(angle) * 600,
            vy: Math.sin(angle) * 600,
            damage: weapon.damage,
            range: weapon.range,
            distance: 0,
            weaponType: 'nuke',
            explosive: true,
            explosionRadius: 300,
            nuke: true,
            size: bulletSize,
            // コンボ色情報を追加
            comboColor: bulletInfo.color,
            comboGlowIntensity: bulletInfo.glowIntensity,
            comboHasSpecialEffect: bulletInfo.hasSpecialEffect,
            comboIsRainbow: bulletInfo.isRainbow,
            comboRainbowHue: bulletInfo.rainbowHue
        };
        
        this.game.bulletSystem.addBullet(nukeBullet);
        
        // ニューク発射エフェクト
        this.game.particleSystem.createMuzzleFlash(
            this.game.player.x + Math.cos(angle) * 25,
            this.game.player.y + Math.sin(angle) * 25,
            angle,
            '#ff0000'
        );
    }
    
    /**
     * スーパーホーミング弾丸作成
     * @param {Object} weapon - 武器オブジェクト
     * @private
     */
    _createSuperHomingBullet(weapon) {
        const angle = this.game.player.angle;
        
        // コンボ弾丸色システムから情報を取得
        const comboCount = this.game.combo ? this.game.combo.count : 0;
        const bulletInfo = this.comboColorSystem.getBulletInfo(comboCount);
        
        // デバッグログ（開発環境・高コンボ時のみ）
        if (comboCount > 0 && comboCount % 15 === 0 && window.location.hostname === 'localhost') {
            console.log('[WeaponSystem] 高コンボ状態:', {
                comboCount,
                isRainbow: bulletInfo.isRainbow,
                sizeMultiplier: bulletInfo.sizeMultiplier
            });
        }
        
        const baseBulletSize = 5;
        const bulletSizeMultiplier = this.game.player.bulletSizeMultiplier || 1;
        const comboSizeMultiplier = bulletInfo.sizeMultiplier || 1;
        const bulletSize = baseBulletSize * bulletSizeMultiplier * comboSizeMultiplier;
        
        const superHomingBullet = {
            x: this.game.player.x + Math.cos(angle) * 25,
            y: this.game.player.y + Math.sin(angle) * 25,
            vx: Math.cos(angle) * 1500, // 超高速弾（1.875倍速）
            vy: Math.sin(angle) * 1500,
            damage: weapon.damage,
            range: 99999, // 射程無限（3体ヒットで消滅するため）
            distance: 0,
            weaponType: 'superHoming',
            homing: true,
            superHoming: true,
            homingStrength: weapon.homingStrength, // 0.3
            homingRange: weapon.homingRange, // 800px
            penetration: 2, // 2回貫通 = 3体ヒット
            penetrateCount: 0, // 貫通カウンター
            maxHits: 3, // 最大ヒット数（新規追加）
            size: bulletSize,
            color: bulletInfo.comboIsRainbow ? bulletInfo.color : '#00ffff', // レインボーまたはシアン色
            // コンボ色情報を追加
            comboColor: bulletInfo.color,
            comboGlowIntensity: bulletInfo.glowIntensity,
            comboHasSpecialEffect: bulletInfo.hasSpecialEffect,
            comboIsRainbow: bulletInfo.isRainbow,
            comboRainbowHue: bulletInfo.rainbowHue
        };
        
        this.game.bulletSystem.addBullet(superHomingBullet);
        
        // スーパーホーミング発射エフェクト
        this.game.particleSystem.createMuzzleFlash(
            this.game.player.x + Math.cos(angle) * 25,
            this.game.player.y + Math.sin(angle) * 25,
            angle,
            '#00ffff'
        );
    }
    
    
    /**
     * 通常弾丸作成
     * @param {Object} weapon - 武器オブジェクト
     * @param {string} weaponKey - 武器キー
     * @private
     */
    _createNormalBullets(weapon, weaponKey) {
        // 武器タイプ別の弾丸作成
        const spread = (Math.random() - 0.5) * weapon.spread;
        const angle = this.game.player.angle + spread;
        const bulletSpeed = weapon.laser ? 1200 : 800;
        
        // コンボ弾丸色システムから情報を取得
        const comboCount = this.game.combo ? this.game.combo.count : 0;
        const bulletInfo = this.comboColorSystem.getBulletInfo(comboCount);
        
        // デバッグログ（開発環境・高コンボ時のみ）
        if (comboCount > 0 && comboCount % 15 === 0 && window.location.hostname === 'localhost') {
            console.log('[WeaponSystem] 高コンボ状態:', {
                comboCount,
                isRainbow: bulletInfo.isRainbow,
                sizeMultiplier: bulletInfo.sizeMultiplier
            });
        }
        
        const baseBulletSize = 4;
        const bulletSizeMultiplier = this.game.player.bulletSizeMultiplier || 1;
        const comboSizeMultiplier = bulletInfo.sizeMultiplier || 1;
        const bulletSize = baseBulletSize * bulletSizeMultiplier * comboSizeMultiplier;
        
        const bullet = {
            x: this.game.player.x + Math.cos(this.game.player.angle) * 25,
            y: this.game.player.y + Math.sin(this.game.player.angle) * 25,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            damage: weapon.damage,
            range: weapon.range,
            distance: 0,
            weaponType: weaponKey,
            size: bulletSize,
            // コンボ色情報を追加
            comboColor: bulletInfo.color,
            comboGlowIntensity: bulletInfo.glowIntensity,
            comboHasSpecialEffect: bulletInfo.hasSpecialEffect,
            comboIsRainbow: bulletInfo.isRainbow,
            comboRainbowHue: bulletInfo.rainbowHue
        };
        
        // プレイヤーのスキル効果を弾丸に適用
        this._applyPlayerSkillsToBullet(bullet);
        
        
        // メイン弾丸発射
        const mainBullet = {
            ...bullet,
            vx: Math.cos(this.game.player.angle + spread) * bulletSpeed,
            vy: Math.sin(this.game.player.angle + spread) * bulletSpeed
        };
        this.game.bulletSystem.addBullet(mainBullet);
        
        // マズルフラッシュ
        this._createMuzzleFlash(weaponKey, weapon);
    }
    
    
    /**
     * プレイヤースキルを弾丸に適用
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _applyPlayerSkillsToBullet(bullet) {
        // 🛡️ 貫通スキル安全チェック: 実際にスキルレベルがある場合のみ適用
        const piercingSkillLevel = this.game.player.skillLevels?.piercing || 0;
        const actualPiercingChance = this.game.player.piercingChance || 0;
        
        if (piercingSkillLevel > 0 && actualPiercingChance > 0) {
            bullet.piercingChance = actualPiercingChance;
            // 多段階貫通プロパティを設定
            bullet.piercesRemaining = Math.floor(actualPiercingChance / 100);
            bullet.bonusPierceChance = actualPiercingChance % 100;
            
            console.log('🎯 WeaponSystem: Piercing skill applied', {
                skillLevel: piercingSkillLevel,
                piercingChance: actualPiercingChance,
                piercesRemaining: bullet.piercesRemaining,
                bonusPierceChance: bullet.bonusPierceChance
            });
        } else {
            // 🚫 貫通スキルなし: 明示的に貫通プロパティを設定しない
            console.log('🚫 WeaponSystem: No piercing skills, bullet will not pierce', {
                piercingSkillLevel,
                actualPiercingChance
            });
        }
        
        // 確率反射（多段階対応）
        if (this.game.player.bounceChance) {
            bullet.bounceChance = this.game.player.bounceChance;
            // 多段階反射プロパティを設定
            bullet.bouncesRemaining = Math.floor(this.game.player.bounceChance / 100);
            bullet.bonusBounceChance = this.game.player.bounceChance % 100;
            bullet.hasUsedBonusBounce = false;
            
            // 反射スキル詳細ログ（開発環境のみ）
            if (window.location.hostname === 'localhost') {
                console.log('WeaponSystem: 反射弾丸作成', {
                    bounceChance: bullet.bounceChance,
                    bouncesRemaining: bullet.bouncesRemaining
                });
            }
        }
        
        // ホーミング性能適用
        if (this.game.player.homingStrengthBonus > 0 || this.game.player.homingRangeBonus > 0) {
            bullet.homing = true;
            bullet.homingStrength = 0.1 + this.game.player.homingStrengthBonus;
            bullet.homingRange = 200 + this.game.player.homingRangeBonus;
        }
        
        // レガシー対応: 従来の確実スキルも維持
        if (this.game.player.piercing) {
            bullet.piercing = this.game.player.piercing;
            bullet.piercingLeft = this.game.player.piercing;
        }
        
        if (this.game.player.bounces) {
            bullet.bounces = this.game.player.bounces;
            bullet.bouncesLeft = this.game.player.bounces;
        }
    }
    
    /**
     * マズルフラッシュエフェクト作成
     * @param {string} weaponKey - 武器キー
     * @param {Object} weapon - 武器オブジェクト
     * @private
     */
    _createMuzzleFlash(weaponKey, weapon) {
        let flashColor = '#ffeb3b';
        if (weaponKey === 'sniper') flashColor = '#ff4757';
        
        this.game.particleSystem.createMuzzleFlash(
            this.game.player.x + Math.cos(this.game.player.angle) * 25,
            this.game.player.y + Math.sin(this.game.player.angle) * 25,
            this.game.player.angle,
            flashColor
        );
    }
    
    /**
     * 武器リロード
     */
    reload() {
        const weapon = this.getCurrentWeapon();
        if (!weapon.isReloading && 
            weapon.ammo < weapon.maxAmmo && 
            weapon.totalAmmo > 0) {
            weapon.isReloading = true;
            weapon.reloadTime = 2000;
            
            // リロード音再生
            if (this.game.audioSystem.sounds.reload) {
                this.game.audioSystem.sounds.reload();
            }
        }
    }
    
    /**
     * 武器アンロック
     * @param {string} weaponKey - アンロックする武器キー
     * @param {number} ammo - 初期弾薬数（オプション）
     */
    unlockWeapon(weaponKey, ammo = null) {
        if (this.weapons[weaponKey]) {
            this.weapons[weaponKey].unlocked = true;
            if (ammo !== null) {
                this.weapons[weaponKey].ammo = ammo;
            }
        }
    }
    
    /**
     * ニュークランチャー装備
     * アイテム取得時の特別処理（重複取得対応）
     */
    equipNukeLauncher() {
        // ベース武器保護ロジック: 一時武器でない場合のみベース武器を更新
        if (!this.isTemporaryWeapon(this.currentWeapon)) {
            this.baseWeapon = this.currentWeapon;
            console.log('WeaponSystem: ベース武器更新', {
                newBaseWeapon: this.baseWeapon,
                switchingTo: 'nuke'
            });
        } else {
            console.log('WeaponSystem: ニュークランチャー弾薬補充 (ベース武器保持)', {
                baseWeapon: this.baseWeapon,
                currentWeapon: this.currentWeapon,
                remainingAmmo: this.weapons.nuke.ammo
            });
        }
        
        this.currentWeapon = 'nuke';
        this.weapons.nuke.ammo = 5; // 5発設定（リセット）
        this.weapons.nuke.unlocked = true;
        
        // 武器装備音響フィードバック
        this.playWeaponEquipSound('nuke');
    }
    
    /**
     * スーパーホーミングガン装備
     * アイテム取得時の特別処理（重複取得対応）
     */
    equipSuperHomingGun() {
        // ベース武器保護ロジック: 一時武器でない場合のみベース武器を更新
        if (!this.isTemporaryWeapon(this.currentWeapon)) {
            this.baseWeapon = this.currentWeapon;
            console.log('WeaponSystem: ベース武器更新', {
                newBaseWeapon: this.baseWeapon,
                switchingTo: 'superHoming'
            });
        } else {
            console.log('WeaponSystem: スーパーホーミングガン弾薬補充 (ベース武器保持)', {
                baseWeapon: this.baseWeapon,
                currentWeapon: this.currentWeapon,
                remainingAmmo: this.weapons.superHoming.ammo
            });
        }
        
        this.currentWeapon = 'superHoming';
        this.weapons.superHoming.ammo = 25; // 25発設定（リセット）
        this.weapons.superHoming.unlocked = true;
        
        // 武器装備音響フィードバック
        this.playWeaponEquipSound('superHoming');
    }
    
    /**
     * スーパーショットガン装備
     * アイテム取得時の特別処理（重複取得対応）
     */
    equipSuperShotgun() {
        // ベース武器保護ロジック: 一時武器でない場合のみベース武器を更新
        if (!this.isTemporaryWeapon(this.currentWeapon)) {
            this.baseWeapon = this.currentWeapon;
            console.log('WeaponSystem: ベース武器更新', {
                newBaseWeapon: this.baseWeapon,
                switchingTo: 'superShotgun'
            });
        } else {
            console.log('WeaponSystem: スーパーショットガン弾薬補充 (ベース武器保持)', {
                baseWeapon: this.baseWeapon,
                currentWeapon: this.currentWeapon,
                remainingAmmo: this.weapons.superShotgun.ammo
            });
        }
        
        this.currentWeapon = 'superShotgun';
        this.weapons.superShotgun.ammo = 15; // 15発設定（リセット）
        this.weapons.superShotgun.unlocked = true;
        
        // 武器装備音響フィードバック
        this.playWeaponEquipSound('superShotgun');
    }
    
    
    /**
     * スーパーショットガン弾丸作成
     * @param {Object} weapon - 武器オブジェクト
     * @private
     */
    _createSuperShotgunBullets(weapon) {
        const baseAngle = this.game.player.angle;
        const spreadAngle = weapon.spread; // 60度（π/3）
        const pelletsPerShot = weapon.pelletsPerShot; // 15発
        
        // プレイヤーからの発射位置
        const startX = this.game.player.x + Math.cos(baseAngle) * 25;
        const startY = this.game.player.y + Math.sin(baseAngle) * 25;
        
        // 15発の散弾を均等に分散
        for (let i = 0; i < pelletsPerShot; i++) {
            // 均等分散: -30度から+30度まで均等に配置
            const angleOffset = (i / (pelletsPerShot - 1) - 0.5) * spreadAngle;
            const bulletAngle = baseAngle + angleOffset;
            
            // コンボ弾丸色システムから情報を取得
            const comboCount = this.game.combo ? this.game.combo.count : 0;
            const bulletInfo = this.comboColorSystem.getBulletInfo(comboCount);
            
            const baseBulletSize = 3; // ショットガン弾は小さめ
            const bulletSizeMultiplier = this.game.player.bulletSizeMultiplier || 1;
            const comboSizeMultiplier = bulletInfo.sizeMultiplier || 1;
            const bulletSize = baseBulletSize * bulletSizeMultiplier * comboSizeMultiplier;
            
            const bullet = {
                x: startX,
                y: startY,
                vx: Math.cos(bulletAngle) * weapon.bulletSpeed,
                vy: Math.sin(bulletAngle) * weapon.bulletSpeed,
                damage: weapon.damage,
                range: weapon.range,
                distance: 0,
                weaponType: 'superShotgun',
                size: bulletSize,
                superShotgun: true, // ショットガン弾フラグ
                penetration: weapon.penetration, // 1回貫通
                piercingLeft: weapon.penetration,
                wallReflection: true, // 壁反射機能
                removeOnEnemyHit: true, // 敵ヒット時削除
                // コンボ色情報を追加
                comboColor: bulletInfo.color,
                comboGlowIntensity: bulletInfo.glowIntensity,
                comboHasSpecialEffect: bulletInfo.hasSpecialEffect,
                comboIsRainbow: bulletInfo.isRainbow,
                comboRainbowHue: bulletInfo.rainbowHue
            };
            
            // プレイヤーのスキル効果を弾丸に適用
            this._applyPlayerSkillsToBullet(bullet);
            
            this.game.bulletSystem.addBullet(bullet);
        }
        
        // マズルフラッシュ（ショットガン専用）
        this._createShotgunMuzzleFlash(baseAngle);
        
        // プレイヤーリコイル（反動）
        const recoilForce = 80; // リコイルの強さ
        this.game.player.x -= Math.cos(baseAngle) * recoilForce * 0.016; // 1フレーム分の反動
        this.game.player.y -= Math.sin(baseAngle) * recoilForce * 0.016;
        
        console.log(`SuperShotgun: ${pelletsPerShot}発散弾発射 (角度: ${baseAngle.toFixed(2)})`);
    }
    
    /**
     * ショットガン専用マズルフラッシュ
     * @param {number} angle - 発射角度
     * @private
     */
    _createShotgunMuzzleFlash(angle) {
        if (this.game.particleSystem && this.game.particleSystem.createMuzzleFlash) {
            // 大きめのマズルフラッシュ
            this.game.particleSystem.createMuzzleFlash(
                this.game.player.x + Math.cos(angle) * 25,
                this.game.player.y + Math.sin(angle) * 25,
                angle,
                '#ffaa00' // オレンジ色のフラッシュ
            );
            
            // 追加の火花エフェクト（ショットガン特有）
            for (let i = 0; i < 8; i++) {
                const spreadAngle = angle + (Math.random() - 0.5) * 1.0; // ±30度の火花
                this.game.particleSystem.createParticle(
                    this.game.player.x + Math.cos(angle) * 30,
                    this.game.player.y + Math.sin(angle) * 30,
                    Math.cos(spreadAngle) * 200,
                    Math.sin(spreadAngle) * 200,
                    '#ff6600', // 火花色
                    300, // 短い寿命
                    { size: 2, friction: 0.95 }
                );
            }
        }
    }

    /**
     * 武器情報取得（UI用）
     * @returns {Object} UI表示用武器情報
     */
    getWeaponInfo() {
        const weapon = this.getCurrentWeapon();
        return {
            name: weapon.name,
            currentAmmo: weapon.limitedAmmo ? weapon.ammo : '∞',
            maxAmmo: weapon.limitedAmmo ? weapon.maxAmmo : '∞',
            isReloading: weapon.isReloading,
            weaponType: this.currentWeapon
        };
    }
    
    /**
     * 武器のアップグレード
     * @param {string} weaponKey - アップグレードする武器キー
     * @param {Object} upgrades - アップグレード内容
     */
    upgradeWeapon(weaponKey, upgrades) {
        if (this.weapons[weaponKey]) {
            Object.keys(upgrades).forEach(property => {
                if (this.weapons[weaponKey][property] !== undefined) {
                    this.weapons[weaponKey][property] = upgrades[property];
                }
            });
        }
    }
    
    /**
     * 特定武器へのアクセス
     * @param {string} weaponKey - 武器キー
     * @returns {Object} 武器オブジェクト
     */
    getWeapon(weaponKey) {
        return this.weapons[weaponKey];
    }
    
    /**
     * 武器の特定プロパティ取得
     * @param {string} weaponKey - 武器キー
     * @param {string} property - プロパティ名
     * @returns {any} プロパティ値
     */
    getWeaponProperty(weaponKey, property) {
        return this.weapons[weaponKey] ? this.weapons[weaponKey][property] : undefined;
    }
    
    /**
     * 武器の特定プロパティ設定
     * @param {string} weaponKey - 武器キー
     * @param {string} property - プロパティ名
     * @param {any} value - 設定値
     */
    setWeaponProperty(weaponKey, property, value) {
        if (this.weapons[weaponKey]) {
            this.weapons[weaponKey][property] = value;
        }
    }
    
    /**
     * 武器プロパティの乗算アップグレード
     * @param {string} weaponKey - 武器キー
     * @param {string} property - プロパティ名
     * @param {number} multiplier - 乗数
     */
    multiplyWeaponProperty(weaponKey, property, multiplier) {
        if (this.weapons[weaponKey] && typeof this.weapons[weaponKey][property] === 'number') {
            this.weapons[weaponKey][property] *= multiplier;
        }
    }
    
    /**
     * 全武器の状態取得（デバッグ用）
     * @returns {Object} 全武器の状態
     */
    getWeaponsState() {
        return {
            weapons: this.weapons,
            currentWeapon: this.currentWeapon,
            previousWeapon: this.previousWeapon
        };
    }
    
    /**
     * 武器システム完全リセット
     * ゲーム開始時に武器状態を初期化
     */
    reset() {
        console.log('WeaponSystem: 武器システムをリセット');
        
        // 武器状態を初期化
        this.currentWeapon = 'plasma';
        this.previousWeapon = 'plasma';
        this.baseWeapon = 'plasma'; // ベース武器も初期化
        
        // 全武器を初期状態にリセット
        Object.keys(this.weapons).forEach(weaponKey => {
            const weapon = this.weapons[weaponKey];
            
            // プラズマライフル（初期武器）の初期化
            if (weaponKey === 'plasma') {
                weapon.unlocked = true;
                weapon.ammo = 999; // 無限弾薬
                weapon.lastShot = 0;
                weapon.isReloading = false;
            }
            // 一時武器（ニュークランチャー等）の完全リセット
            else if (weapon.isTemporary) {
                weapon.unlocked = false;
                weapon.ammo = 0;
                weapon.lastShot = 0;
                weapon.isReloading = false;
            }
            // その他の武器は基本状態に戻す
            else {
                weapon.lastShot = 0;
                weapon.isReloading = false;
                // アンロック状態とアップグレードは保持
            }
        });
        
        console.log('WeaponSystem: リセット完了', {
            currentWeapon: this.currentWeapon,
            previousWeapon: this.previousWeapon,
            baseWeapon: this.baseWeapon,
            nukeUnlocked: this.weapons.nuke.unlocked,
            nukeAmmo: this.weapons.nuke.ammo
        });
    }
    
    /**
     * 武器が一時武器かチェック
     * @param {string} weaponKey - 武器キー
     * @returns {boolean} 一時武器フラグ
     */
    isTemporaryWeapon(weaponKey) {
        return this.weapons[weaponKey]?.isTemporary || false;
    }
    
    /**
     * 武器がピックアップ限定かチェック
     * @param {string} weaponKey - 武器キー
     * @returns {boolean} ピックアップ限定フラグ
     */
    isPickupOnlyWeapon(weaponKey) {
        return this.weapons[weaponKey]?.isPickupOnly || false;
    }
    
    /**
     * 武器が自動復帰対象かチェック
     * @param {string} weaponKey - 武器キー
     * @returns {boolean} 自動復帰フラグ
     */
    isAutoRevertWeapon(weaponKey) {
        return this.weapons[weaponKey]?.autoRevert || false;
    }
    
    /**
     * AudioSystem用武器タイプ取得
     * @param {Object} [weapon] - 武器オブジェクト（省略時は現在の武器）
     * @returns {string} AudioSystem用武器タイプ (plasma, nuke, superHoming, superShotgun)
     */
    getAudioWeaponType(weapon = null) {
        // 武器が指定されていない場合は現在の武器を使用
        const targetWeapon = weapon || this.getCurrentWeapon();
        
        // 武器の特性フラグからAudioSystem用タイプにマッピング
        if (targetWeapon.nuke) {
            return 'nuke';
        } else if (targetWeapon.superHoming) {
            return 'superHoming';
        } else if (targetWeapon.shotgun) {
            return 'superShotgun';
        } else {
            return 'plasma'; // デフォルト（通常武器）
        }
    }
    
    /**
     * 現在の武器のAudioSystem用タイプ取得（ショートカット）
     * @returns {string} AudioSystem用武器タイプ
     */
    getCurrentAudioWeaponType() {
        return this.getAudioWeaponType();
    }
    
    /**
     * 武器装備時の音響フィードバック
     * @param {string} weaponType - 装備した武器タイプ
     */
    playWeaponEquipSound(weaponType) {
        if (!this.game.audioSystem?.sounds?.pickup) return;
        
        try {
            // 武器別装備音の差別化
            switch (weaponType) {
                case 'nuke':
                    // ニュークは重厚な装備音
                    this.game.audioSystem.sounds.pickup();
                    setTimeout(() => {
                        if (this.game.audioSystem.sounds.damage) {
                            this.game.audioSystem.sounds.damage(); // 低音追加
                        }
                    }, 100);
                    break;
                    
                case 'superHoming':
                    // スーパーホーミングは電子的な装備音
                    this.game.audioSystem.sounds.pickup();
                    setTimeout(() => {
                        this.game.audioSystem.sounds.pickup(); // エコー効果
                    }, 80);
                    break;
                    
                case 'superShotgun':
                    // スーパーショットガンは迫力ある装備音
                    this.game.audioSystem.sounds.pickup();
                    setTimeout(() => {
                        if (this.game.audioSystem.sounds.reload) {
                            this.game.audioSystem.sounds.reload(); // メタリック音追加
                        }
                    }, 120);
                    break;
                    
                default:
                    // 通常武器
                    this.game.audioSystem.sounds.pickup();
            }
            
            // 武器装備ログ（開発環境のみ）
            if (window.location.hostname === 'localhost') {
                console.log(`🔫 Weapon equipped: ${weaponType} with audio feedback`);
            }
            
        } catch (error) {
            console.warn(`🎵 Weapon equip sound failed for ${weaponType}:`, error);
        }
    }
    
    /**
     * 全武器の射程を倍率で増加
     * @param {number} multiplier - 射程倍率 (例: 1.2 = 20%増加)
     */
    applyRangeMultiplier(multiplier) {
        Object.keys(this.weapons).forEach(weaponKey => {
            // 一時武器を除外
            if (!this.isTemporaryWeapon(weaponKey)) {
                this.multiplyWeaponProperty(weaponKey, 'range', multiplier);
                console.log(`WeaponSystem: Range multiplied for ${weaponKey}`, {
                    weapon: weaponKey,
                    newRange: this.weapons[weaponKey].range,
                    multiplier: multiplier
                });
            }
        });
    }
}