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
            range: { baseEffect: 1.05, increment: 0.05 },      // 1.05 = Lv1, 1.1 = Lv2
            itemAttraction: { baseEffect: 1.25, increment: 0.25 }, // 1.25 = Lv1(+25%), 1.5 = Lv2(+50%)
            luck: { baseEffect: 1.15, increment: 0.15 }        // 1.15 = Lv1(+15%), 1.30 = Lv2(+30%) - 2段階成長対応
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
        
        // スキル取得レベルシステムから直接取得
        if (player.skillLevels && player.skillLevels[skillType] !== undefined) {
            return player.skillLevels[skillType];
        }
        
        return 0;
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
        if (skillName.includes('アイテム吸引') || skillName.includes('磁力')) return 'itemAttraction';
        if (skillName.includes('運') || skillName.includes('幸運') || skillName.includes('運命')) return 'luck';
        
        return 'unknown';
    }
    
    
    /**
     * スキルレベル表示文字列を生成
     * @param {string} skillName - スキル名
     * @param {string} rarity - アップグレードのレアリティ
     * @returns {string} レベル表示文字列
     */
    generateLevelDisplay(skillName, rarity = 'common') {
        const skillType = this.getSkillTypeFromName(skillName);
        const currentLevel = this.getCurrentSkillLevel(skillType);
        
        // レアリティに応じたレベル加算値
        const rarityLevelGain = {
            common: 1,      // 10%効果 = +1レベル
            uncommon: 2,    // 20%効果 = +2レベル
            rare: 3,        // 30%効果 = +3レベル
            epic: 3,        // 30%効果 = +3レベル
            legendary: 2    // 20%効果 = +2レベル
        };
        
        const levelGain = rarityLevelGain[rarity] || 1;
        const nextLevel = currentLevel + levelGain;
        
        // デバッグログ追加
        console.log(`SkillLevelCalculator: ${skillName} (${skillType}) - Current: ${currentLevel}, Next: ${nextLevel} (+${levelGain})`);
        
        // 正しい順序で表示（現在レベル → 次レベル）
        return `Lv.${currentLevel} → Lv.${nextLevel}`;
    }
    
    /**
     * スキルレベル情報オブジェクトを取得
     * @param {string} skillName - スキル名
     * @param {string} rarity - アップグレードのレアリティ
     * @returns {Object} レベル情報
     */
    getSkillLevelInfo(skillName, rarity = 'common') {
        const skillType = this.getSkillTypeFromName(skillName);
        const currentLevel = this.getCurrentSkillLevel(skillType);
        
        // レアリティに応じたレベル加算値
        const rarityLevelGain = {
            common: 1,
            uncommon: 2,
            rare: 3,
            epic: 3,
            legendary: 2
        };
        
        const levelGain = rarityLevelGain[rarity] || 1;
        
        return {
            skillType,
            currentLevel,
            nextLevel: currentLevel + levelGain,
            display: this.generateLevelDisplay(skillName, rarity),
            levelGain: levelGain
        };
    }
}