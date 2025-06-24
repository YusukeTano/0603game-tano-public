/**
 * TutorialConfig - チュートリアルシステム設定
 * ステージ1-2のチュートリアル、ステージ3以降の本格ゲーム設定
 */
export const TutorialConfig = {
    // チュートリアルステージ設定
    TUTORIAL_STAGES: {
        1: {
            name: '基本チュートリアル',
            enemySpawnLimit: 5,          // 最大敵数
            allowedEnemyTypes: ['normal'], // 通常敵のみ
            experienceMultiplier: 3.0,    // 経験値3倍
            maxLevel: 5,                  // レベル5までブースト
            description: '基本操作を習得'
        },
        2: {
            name: '応用チュートリアル', 
            enemySpawnLimit: 15,         // 最大敵数
            allowedEnemyTypes: ['normal', 'fast'], // 通常+高速敵
            experienceMultiplier: 2.0,    // 経験値2倍
            maxLevel: 10,                 // レベル10までブースト
            description: '敵タイプと戦術習得'
        }
    },

    // 本格ゲーム開始ステージ
    REAL_GAME_START_STAGE: 3,

    // チュートリアル判定
    isTutorialStage(stage) {
        return stage <= 2;
    },

    // チュートリアル設定取得
    getTutorialConfig(stage) {
        return this.TUTORIAL_STAGES[stage] || null;
    },

    // 敵スポーン上限取得
    getEnemySpawnLimit(stage) {
        if (this.isTutorialStage(stage)) {
            return this.TUTORIAL_STAGES[stage]?.enemySpawnLimit || -1;
        }
        return -1; // 無制限
    },

    // 経験値倍率取得
    getExperienceMultiplier(stage, playerLevel) {
        if (!this.isTutorialStage(stage)) return 1.0;
        
        const config = this.TUTORIAL_STAGES[stage];
        if (!config) return 1.0;
        
        // 指定レベル未満なら倍率適用
        if (playerLevel < config.maxLevel) {
            return config.experienceMultiplier;
        }
        
        return 1.0; // 標準倍率
    },

    // 許可される敵タイプ取得
    getAllowedEnemyTypes(stage, wave) {
        if (!this.isTutorialStage(stage)) {
            return null; // 制限なし（既存ロジック使用）
        }
        
        const config = this.TUTORIAL_STAGES[stage];
        if (!config) return ['normal'];
        
        // ステージ2の場合、ウェーブ2以降で高速敵追加
        if (stage === 2) {
            const waveInStage = ((wave - 1) % 4) + 1; // 1-4
            if (waveInStage >= 2) {
                return config.allowedEnemyTypes;
            } else {
                return ['normal']; // ウェーブ1は通常敵のみ
            }
        }
        
        return config.allowedEnemyTypes;
    },

    // ゲーム難易度ステージ変換 (ステージ3 = 難易度レベル1)
    getGameplayStage(displayStage) {
        return Math.max(displayStage - 2, 1);
    },

    // ゲーム難易度ウェーブ変換 (ウェーブ9 = 難易度ウェーブ1)
    getGameplayWave(wave) {
        return Math.max(wave - 8, 1);
    },

    // チュートリアル完了判定
    isTutorialCompleted(stage) {
        return stage > 2;
    },

    // デバッグ情報取得
    getDebugInfo(stage, wave, playerLevel) {
        return {
            isTutorial: this.isTutorialStage(stage),
            config: this.getTutorialConfig(stage),
            spawnLimit: this.getEnemySpawnLimit(stage),
            expMultiplier: this.getExperienceMultiplier(stage, playerLevel),
            allowedEnemies: this.getAllowedEnemyTypes(stage, wave),
            gameplayStage: this.getGameplayStage(stage),
            gameplayWave: this.getGameplayWave(wave)
        };
    }
};

// グローバルアクセス用（デバッグ）
if (typeof window !== 'undefined') {
    window.TutorialConfig = TutorialConfig;
}