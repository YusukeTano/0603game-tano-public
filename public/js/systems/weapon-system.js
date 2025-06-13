/**
 * WeaponSystem - 武器管理システム
 * 武器切り替え・弾丸生成・武器アップグレードの一元管理
 */
export class WeaponSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // 武器設定定義
        this.weapons = {
            plasma: {
                name: 'プラズマライフル',
                damage: 25,
                fireRate: 150,
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
            }
        };
        
        this.currentWeapon = 'plasma';
        this.previousWeapon = 'plasma'; // 弾薬切れ時の戻り先武器
        
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
        
        // InputSystemから射撃入力を取得（統一API使用）
        wantToShoot = this.game.inputSystem.getShootingInput();
        
        // デバッグログ（問題特定用）
        if (wantToShoot) {
            console.log('🔫 WeaponSystem shooting:', {
                isMobile: this.game.inputSystem.isMobile,
                shootingInput: wantToShoot,
                aimState: this.game.inputSystem.state.virtualSticks.aim,
                weapon: this.currentWeapon
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
            // 左クリック制限弾薬武器が弾切れの場合、前の武器に戻る
            if (weaponKey === this.currentWeapon) {
                this.currentWeapon = this.previousWeapon;
                // ニューク武器をリセット
                if (weaponKey === 'nuke') {
                    this.weapons.nuke.unlocked = false;
                    this.weapons.nuke.ammo = 0;
                }
            }
            return;
        }
        
        // 弾薬消費
        if (weapon.limitedAmmo) {
            weapon.ammo--;
        }
        weapon.lastShot = Date.now();
        
        // 射撃音再生
        if (this.game.audioSystem.sounds.shoot) {
            this.game.audioSystem.sounds.shoot();
        }
        
        // ニューク武器の特別処理
        if (weapon.nuke) {
            this._createNukeBullet(weapon);
            return; // ニューク武器は特別処理で終了
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
            size: 8
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
        
        const baseBulletSize = 4;
        const bulletSizeMultiplier = this.game.player.bulletSizeMultiplier || 1;
        const bulletSize = baseBulletSize * bulletSizeMultiplier;
        
        const bullet = {
            x: this.game.player.x + Math.cos(this.game.player.angle) * 25,
            y: this.game.player.y + Math.sin(this.game.player.angle) * 25,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            damage: weapon.damage,
            range: weapon.range,
            distance: 0,
            weaponType: weaponKey,
            size: bulletSize
        };
        
        // プレイヤーのスキル効果を弾丸に適用
        this._applyPlayerSkillsToBullet(bullet);
        
        // マルチショットの処理（新仕様：真っ直ぐ弾固定 + 扇状ランダム追加弾）
        const multiShotChance = this.game.player.multiShotChance || 0;
        
        // 弾数計算: 確定弾数 + 確率弾数
        const guaranteedShots = Math.floor(multiShotChance / 100); // 100%ごとに確定弾+1
        const remainingChance = multiShotChance % 100;             // 端数確率
        const bonusShot = Math.random() * 100 < remainingChance ? 1 : 0;
        const totalAdditionalShots = guaranteedShots + bonusShot;
        
        const baseAngle = this.game.player.angle;
        
        // 1発目: 真っ直ぐ弾（常に固定）
        const straightBullet = {
            ...bullet,
            vx: Math.cos(baseAngle + spread) * bulletSpeed,
            vy: Math.sin(baseAngle + spread) * bulletSpeed
        };
        this.game.bulletSystem.addBullet(straightBullet);
        
        // 追加弾: 扇状ランダム発射
        for (let i = 0; i < totalAdditionalShots; i++) {
            const randomSpread = (Math.random() * 1.0 - 0.5); // ±0.5ラジアン（約±28.6度）
            const finalAngle = baseAngle + spread + randomSpread;
            
            const additionalBullet = {
                ...bullet,
                vx: Math.cos(finalAngle) * bulletSpeed,
                vy: Math.sin(finalAngle) * bulletSpeed
            };
            
            this.game.bulletSystem.addBullet(additionalBullet);
        }
        
        // マズルフラッシュ
        this._createMuzzleFlash(weaponKey, weapon);
    }
    
    /**
     * プレイヤースキルを弾丸に適用
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _applyPlayerSkillsToBullet(bullet) {
        // 確率貫通（多段階対応）
        if (this.game.player.piercingChance) {
            bullet.piercingChance = this.game.player.piercingChance;
            // 多段階貫通プロパティを設定
            bullet.piercesRemaining = Math.floor(this.game.player.piercingChance / 100);
            bullet.bonusPierceChance = this.game.player.piercingChance % 100;
        }
        
        // 確率反射（多段階対応）
        if (this.game.player.bounceChance) {
            bullet.bounceChance = this.game.player.bounceChance;
            // 多段階反射プロパティを設定
            bullet.bouncesRemaining = Math.floor(this.game.player.bounceChance / 100);
            bullet.bonusBounceChance = this.game.player.bounceChance % 100;
            bullet.hasUsedBonusBounce = false;
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
        // 重要: 既にニュークランチャーを装備している場合、previousWeaponを上書きしない
        if (this.currentWeapon !== 'nuke') {
            this.previousWeapon = this.currentWeapon; // 現在の武器を記録
            console.log('WeaponSystem: ニュークランチャー装備', {
                previous: this.previousWeapon,
                current: 'nuke'
            });
        } else {
            console.log('WeaponSystem: ニュークランチャー弾薬補充', {
                previous: this.previousWeapon,
                current: this.currentWeapon,
                remainingAmmo: this.weapons.nuke.ammo
            });
        }
        
        this.currentWeapon = 'nuke';
        this.weapons.nuke.ammo = 5; // 5発設定（リセット）
        this.weapons.nuke.unlocked = true;
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