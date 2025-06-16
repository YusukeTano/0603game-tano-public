/**
 * コンボ弾丸色変更システム
 * コンボ数に応じて弾丸の色とサイズボーナスを管理
 */
export class ComboColorSystem {
    constructor() {
        // 統一カラーパレットに基づく5段階のコンボ色システム
        this.colorTable = [
            { min: 0,  max: 5,  color: '#FFFFFF', name: '白',   sizeBonus: 0   },  // 0-5コンボ
            { min: 6,  max: 11, color: '#4CAF50', name: '緑',   sizeBonus: 0.4 },  // 6-11コンボ (緑系)
            { min: 12, max: 17, color: '#2196F3', name: '青',   sizeBonus: 0.8 },  // 12-17コンボ (青系)
            { min: 18, max: 23, color: '#9C27B0', name: '紫',   sizeBonus: 1.2 },  // 18-23コンボ (紫系)
            { min: 24, max: 29, color: '#FF9800', name: '金色', sizeBonus: 1.6 }   // 24-29コンボ (金系)
        ];
        
        this.rainbowThreshold = 30;
        this.maxSizeBonus = 2.0; // 200%ボーナス
        this.rainbowHue = 0;
        this.lastRainbowUpdate = 0;
        this.rainbowUpdateInterval = 10; // 0.01秒間隔（より滑らかな変化）
    }

    /**
     * コンボ数から弾丸情報を取得
     * @param {number} comboCount - 現在のコンボ数
     * @returns {object} 弾丸の色・サイズ・エフェクト情報
     */
    getBulletInfo(comboCount) {
        if (comboCount >= this.rainbowThreshold) {
            return this._getRainbowBulletInfo();
        }

        // 通常の色テーブルから検索
        const colorData = this.colorTable.find(item => 
            comboCount >= item.min && comboCount <= item.max
        );

        if (!colorData) {
            // フォールバック：最初の色を返す
            return {
                color: this.colorTable[0].color,
                sizeMultiplier: 1 + this.colorTable[0].sizeBonus,
                glowIntensity: 0,
                hasSpecialEffect: false,
                isRainbow: false
            };
        }

        return {
            color: colorData.color,
            sizeMultiplier: 1 + colorData.sizeBonus,
            glowIntensity: this._calculateGlowIntensity(comboCount),
            hasSpecialEffect: comboCount >= 12, // 青以上で特殊エフェクト
            isRainbow: false
        };
    }

    /**
     * レインボー弾丸情報を取得
     * @returns {object} レインボー弾丸の情報
     */
    _getRainbowBulletInfo() {
        const now = Date.now();
        
        // 色相を時間ベースで更新
        if (now - this.lastRainbowUpdate >= this.rainbowUpdateInterval) {
            this.rainbowHue = (this.rainbowHue + 3.6) % 360; // 10秒で1周
            this.lastRainbowUpdate = now;
        }

        return {
            color: this._hsvToHex(this.rainbowHue, 100, 100),
            sizeMultiplier: 1 + this.maxSizeBonus,
            glowIntensity: 1.0, // 最大グロー
            hasSpecialEffect: true,
            isRainbow: true,
            rainbowHue: this.rainbowHue
        };
    }

    /**
     * グロー強度を計算
     * @param {number} comboCount - コンボ数
     * @returns {number} グロー強度 (0-1)
     */
    _calculateGlowIntensity(comboCount) {
        if (comboCount < 3) return 0;
        
        // 6コンボから徐々に強くなる（統一化に合わせて調整）
        const intensity = Math.min((comboCount - 6) / 24, 0.8); // 最大0.8
        return intensity;
    }

    /**
     * HSVからHEXに変換
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 彩度 (0-100)
     * @param {number} v - 明度 (0-100)
     * @returns {string} HEX色コード
     */
    _hsvToHex(h, s, v) {
        s /= 100;
        v /= 100;
        
        const c = v * s;
        const x = c * (1 - Math.abs((h / 60) % 2 - 1));
        const m = v - c;
        
        let r, g, b;
        
        if (h >= 0 && h < 60) {
            r = c; g = x; b = 0;
        } else if (h >= 60 && h < 120) {
            r = x; g = c; b = 0;
        } else if (h >= 120 && h < 180) {
            r = 0; g = c; b = x;
        } else if (h >= 180 && h < 240) {
            r = 0; g = x; b = c;
        } else if (h >= 240 && h < 300) {
            r = x; g = 0; b = c;
        } else {
            r = c; g = 0; b = x;
        }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }

    /**
     * コンボレベル名を取得
     * @param {number} comboCount - コンボ数
     * @returns {string} コンボレベル名
     */
    getComboLevelName(comboCount) {
        if (comboCount >= this.rainbowThreshold) {
            return 'レインボー';
        }

        const colorData = this.colorTable.find(item => 
            comboCount >= item.min && comboCount <= item.max
        );

        return colorData ? colorData.name : '白';
    }

    /**
     * 次のレベルまでのコンボ数を取得
     * @param {number} comboCount - 現在のコンボ数
     * @returns {number} 次のレベルまでの必要コンボ数
     */
    getComboToNextLevel(comboCount) {
        if (comboCount >= this.rainbowThreshold) {
            return 0; // 最大レベル到達
        }

        // 次の段階の最小値を見つける
        for (const item of this.colorTable) {
            if (comboCount < item.min) {
                return item.min - comboCount;
            }
        }

        // レインボーまでの距離
        return this.rainbowThreshold - comboCount;
    }
}