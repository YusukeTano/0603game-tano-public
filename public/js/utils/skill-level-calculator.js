/**
 * SkillLevelCalculator - スキルレベル計算ユーティリティ
 * 既存のスキル効果値から表示用レベルを計算する
 * 10%効果 = レベル1の基準で計算
 */
export class SkillLevelCalculator {
    constructor(game) {
        this.game = game;
        
        // スキル効果とレベルのマッピング設定
        this.skillMappings = {
            // 基本強化系 (10%刻み)
            damage: { baseEffect: 1.1, increment: 0.1 },       // 1.1 = Lv1, 1.2 = Lv2, 1.3 = Lv3
            fireRate: { baseEffect: 0.9, increment: -0.1 },    // 0.9 = Lv1, 0.8 = Lv2, 0.7 = Lv3
            bulletSize: { baseEffect: 1.1, increment: 0.1 },   // 1.1 = Lv1, 1.2 = Lv2, 1.3 = Lv3
            
            // 確率系スキル (10%刻み)
            piercing: { baseEffect: 0.1, increment: 0.1 },     // 0.1 = Lv1, 0.2 = Lv2, 0.3 = Lv3
            multiShot: { baseEffect: 0.1, increment: 0.1 },    // 0.1 = Lv1, 0.2 = Lv2, 0.3 = Lv3
            bounce: { baseEffect: 0.1, increment: 0.1 },       // 0.1 = Lv1, 0.2 = Lv2, 0.3 = Lv3
            
            // 特殊系
            homing: { baseEffect: 0.02, increment: 0.02 },     // 0.02 = Lv1
            range: { baseEffect: 1.05, increment: 0.05 }       // 1.05 = Lv1, 1.1 = Lv2
        };
        
        console.log('SkillLevelCalculator: スキルレベル計算システム初期化完了');
    }
    
    /**
     * スキルの現在レベルを取得
     * @param {string} skillType - スキルタイプ
     * @returns {number} 現在のレベル (0から開始)
     */
    getCurrentSkillLevel(skillType) {
        const player = this.game.player;
        const weapons = this.game.weaponSystem.weapons;
        
        switch(skillType) {
            case 'damage':
                return this._calculateDamageLevel();
                
            case 'fireRate':
                return this._calculateFireRateLevel();
                
            case 'bulletSize':
                return this._calculateBulletSizeLevel();
                
            case 'piercing':
                return Math.floor((player.piercingChance || 0) / this.skillMappings.piercing.increment);
                
            case 'multiShot':
                return Math.floor((player.multiShotChance || 0) / this.skillMappings.multiShot.increment);
                
            case 'bounce':
                return Math.floor((player.bounceChance || 0) / this.skillMappings.bounce.increment);
                
            case 'homing':
                return Math.floor((player.homingStrengthBonus || 0) / this.skillMappings.homing.increment);
                
            case 'range':
                return Math.floor(((player.currentRangeMultiplier || 1) - 1) / this.skillMappings.range.increment);
                
            default:
                return 0;
        }
    }
    
    /**
     * スキル名からスキルタイプを推定
     * @param {string} skillName - スキル名
     * @returns {string} スキルタイプ
     */
    getSkillTypeFromName(skillName) {
        if (skillName.includes('攻撃力強化')) return 'damage';
        if (skillName.includes('連射速度向上')) return 'fireRate';
        if (skillName.includes('弾の大きさ増加')) return 'bulletSize';
        if (skillName.includes('貫通性能')) return 'piercing';
        if (skillName.includes('マルチショット')) return 'multiShot';
        if (skillName.includes('反射性能')) return 'bounce';
        if (skillName.includes('ホーミング精度向上')) return 'homing';
        if (skillName.includes('射程距離延長')) return 'range';
        
        return 'unknown';
    }
    
    /**
     * 攻撃力レベル計算
     * @private
     * @returns {number} 現在の攻撃力レベル
     */
    _calculateDamageLevel() {
        const weapons = this.game.weaponSystem.weapons;
        const plasmaWeapon = weapons.plasma;
        
        if (!plasmaWeapon) return 0;
        
        // 基準ダメージから現在の倍率を計算
        const baseDamage = 25; // プラズマ武器の初期ダメージ
        const currentMultiplier = plasmaWeapon.damage / baseDamage;
        
        // 1.1倍 = レベル1、1.2倍 = レベル2、1.3倍 = レベル3
        return Math.floor((currentMultiplier - 1) / this.skillMappings.damage.increment);
    }
    
    /**
     * 連射速度レベル計算
     * @private
     * @returns {number} 現在の連射速度レベル
     */
    _calculateFireRateLevel() {
        const weapons = this.game.weaponSystem.weapons;
        const plasmaWeapon = weapons.plasma;
        
        if (!plasmaWeapon) return 0;
        
        // 基準射撃間隔から現在の倍率を計算
        const baseFireRate = 150; // プラズマ武器の初期射撃間隔
        const currentRatio = plasmaWeapon.fireRate / baseFireRate;
        
        // 0.9倍 = レベル1、0.8倍 = レベル2、0.7倍 = レベル3
        return Math.floor((this.skillMappings.fireRate.baseEffect - currentRatio) / Math.abs(this.skillMappings.fireRate.increment));
    }
    
    /**
     * 弾サイズレベル計算
     * @private
     * @returns {number} 現在の弾サイズレベル
     */
    _calculateBulletSizeLevel() {
        const player = this.game.player;
        const currentMultiplier = player.bulletSizeMultiplier || 1;
        
        // 1.1倍 = レベル1、1.2倍 = レベル2、1.3倍 = レベル3
        return Math.floor((currentMultiplier - 1) / this.skillMappings.bulletSize.increment);
    }
    
    /**
     * スキルレベル表示文字列を生成
     * @param {string} skillName - スキル名
     * @returns {string} レベル表示文字列
     */
    generateLevelDisplay(skillName) {
        const skillType = this.getSkillTypeFromName(skillName);
        const currentLevel = this.getCurrentSkillLevel(skillType);
        const nextLevel = currentLevel + 1;
        
        // 最大レベル制限
        const maxLevels = {
            damage: 3,
            fireRate: 3,
            bulletSize: 3,
            piercing: 3,
            multiShot: 3,
            bounce: 3,
            homing: 1,
            range: 10  // 射程は累積
        };
        
        const maxLevel = maxLevels[skillType] || 3;
        
        if (currentLevel >= maxLevel) {
            return `Lv.${currentLevel} (MAX)`;
        }
        
        return `Lv.${currentLevel} → Lv.${nextLevel}`;
    }
    
    /**
     * スキルレベル情報オブジェクトを取得
     * @param {string} skillName - スキル名
     * @returns {Object} レベル情報
     */
    getSkillLevelInfo(skillName) {
        const skillType = this.getSkillTypeFromName(skillName);
        const currentLevel = this.getCurrentSkillLevel(skillType);
        
        return {
            skillType,
            currentLevel,
            nextLevel: currentLevel + 1,
            display: this.generateLevelDisplay(skillName),
            isMaxLevel: currentLevel >= 3 // 基本的に最大レベル3
        };
    }
}