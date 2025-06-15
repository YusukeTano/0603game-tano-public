/**
 * PickupSystem - アイテム管理システム
 * アイテムの生成、収集、効果適用を統合管理
 */
import { Pickup } from '../entities/pickup.js';

export class PickupSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照
        
        // アイテム配列
        this.pickups = [];
        
        console.log('PickupSystem: アイテム管理システム初期化完了');
    }
    
    /**
     * アイテムシステムの更新
     * @param {number} deltaTime - フレーム間隔
     */
    update(deltaTime) {
        // Pickupクラスを使用して各アイテムを更新
        for (let i = this.pickups.length - 1; i >= 0; i--) {
            const pickup = this.pickups[i];
            
            // Pickupクラスのupdate処理
            const shouldRemove = pickup.update(deltaTime, this.game);
            
            if (shouldRemove) {
                this.pickups.splice(i, 1);
            }
        }
    }
    
    /**
     * アイテム収集処理（レガシー互換性用）
     * @param {Object} pickup - 収集するアイテム
     * @param {number} index - アイテムの配列インデックス
     */
    collectPickup(pickup, index) {
        // Pickupクラスのcollectメソッドを使用
        if (pickup.collect) {
            pickup.collect(this.game);
        } else {
            // レガシー処理（オブジェクト形式のアイテム用）
            if (pickup.type === 'health') {
                this.game.player.increaseMaxHealth(10);
            } else if (pickup.type === 'speed') {
                this.game.player.increaseSpeed(5);
            } else if (pickup.type === 'nuke') {
                this.game.weaponSystem.equipNukeLauncher();
                if (this.game.audioSystem.sounds.pickupNuke) {
                    this.game.audioSystem.sounds.pickupNuke();
                } else if (this.game.audioSystem.sounds.pickupAmmo) {
                    this.game.audioSystem.sounds.pickupAmmo();
                }
            } else if (pickup.type === 'superHoming') {
                this.game.weaponSystem.equipSuperHomingGun();
                if (this.game.audioSystem.sounds.pickupSuperHoming) {
                    this.game.audioSystem.sounds.pickupSuperHoming();
                } else if (this.game.audioSystem.sounds.pickupAmmo) {
                    this.game.audioSystem.sounds.pickupAmmo();
                }
            }
        }
        
        // アイテムを配列から削除
        this.pickups.splice(index, 1);
    }
    
    /**
     * アイテム生成（敵撃破時・Enemyクラス対応）
     * @param {Enemy|Object} enemy - 撃破された敵インスタンスまたはオブジェクト
     */
    createPickupsFromEnemy(enemy) {
        console.log('PickupSystem: createPickupsFromEnemy called', {
            enemyType: enemy.type,
            enemyX: enemy.x,
            enemyY: enemy.y
        });
        
        // アイテムドロップ（敵タイプによって変化）
        let dropCount = 1;
        let dropRate = 1.0; // 🔧 デバッグ用: 100%確定ドロップ
        
        if (enemy.type === 'boss') {
            dropCount = 5; // ボスは5個
            dropRate = 1.0; // 確定ドロップ
        } else if (enemy.type === 'tank') {
            dropCount = 2; // タンクは2個
            dropRate = 1.0; // 🔧 デバッグ用: 100%確定ドロップ
        }
        
        console.log('PickupSystem: drop settings', {
            dropCount,
            dropRate,
            enemyType: enemy.type
        });
        
        let actualDropCount = 0;
        for (let d = 0; d < dropCount; d++) {
            const randomValue = Math.random();
            console.log(`PickupSystem: drop attempt ${d + 1}/${dropCount}, random: ${randomValue}, dropRate: ${dropRate}, willDrop: ${randomValue < dropRate}`);
            
            if (randomValue < dropRate) {
                const itemType = Math.random();
                let type;
                if (itemType < 0.003) {
                    type = 'nuke'; // 0.3%確率でニュークランチャー
                } else if (itemType < 0.006) {
                    type = 'superHoming'; // 0.3%確率でスーパーホーミングガン
                } else if (itemType < 0.009) {
                    type = 'superShotgun'; // 0.3%確率でスーパーショットガン
                } else if (itemType < 0.509) {
                    type = 'health'; // 50%確率で体力増加 (0.009-0.509 = 50%)
                } else if (itemType < 0.759) {
                    type = 'range'; // 25%確率で射程増加 (0.509-0.759 = 25%)
                } else {
                    type = 'speed'; // 24.1%確率で移動速度増加 (0.759-1.0 = 24.1%)
                }
                
                const x = enemy.x + (Math.random() - 0.5) * 40;
                const y = enemy.y + (Math.random() - 0.5) * 40;
                this.addPickup(x, y, type);
                actualDropCount++;
                console.log(`PickupSystem: item dropped - type: ${type}, x: ${x}, y: ${y}`);
            }
        }
        
        console.log(`PickupSystem: total items dropped: ${actualDropCount}/${dropCount}`);
    }
    
    /**
     * 個別アイテム生成（Pickupクラス使用）
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {string} type - アイテムタイプ ('health' | 'speed' | 'nuke')
     * @param {number} value - アイテム値（オプション）
     */
    addPickup(x, y, type, value = undefined) {
        console.log(`PickupSystem: addPickup called - type: ${type}, x: ${x}, y: ${y}, value: ${value}`);
        
        let pickup;
        
        switch (type) {
            case 'health':
                pickup = Pickup.createHealthPickup(x, y, value || 10);
                break;
            case 'speed':
                pickup = Pickup.createSpeedPickup(x, y, value || 5);
                break;
            case 'range':
                pickup = Pickup.createRangePickup(x, y, value || 1.05);
                break;
            case 'nuke':
                pickup = Pickup.createNukePickup(x, y, value || 5);
                break;
            case 'superHoming':
                pickup = Pickup.createSuperHomingPickup(x, y, value || 25);
                break;
            case 'superShotgun':
                pickup = Pickup.createSuperShotgunPickup(x, y, value || 15);
                break;
            default:
                pickup = new Pickup(x, y, type, { value: value });
                break;
        }
        
        this.pickups.push(pickup);
        
        // 超レア武器ドロップ時の特殊エフェクト
        if (type === 'nuke') {
            // 特殊効果音再生
            if (this.game.audioSystem.sounds.pickupNuke) {
                this.game.audioSystem.sounds.pickupNuke();
            }
            
            // 派手なパーティクルエフェクト
            if (this.game.particleSystem.createNukeDropEffect) {
                this.game.particleSystem.createNukeDropEffect(x, y);
            }
            
            console.log(`PickupSystem: EPIC NUKE DROP! Special effects triggered at ${x}, ${y}`);
        } else if (type === 'superHoming') {
            // スーパーホーミングガン専用効果音再生
            if (this.game.audioSystem.sounds.pickupSuperHoming) {
                this.game.audioSystem.sounds.pickupSuperHoming();
            }
            
            // 派手なパーティクルエフェクト
            if (this.game.particleSystem.createSuperHomingDropEffect) {
                this.game.particleSystem.createSuperHomingDropEffect(x, y);
            }
            
            console.log(`PickupSystem: EPIC SUPER HOMING DROP! Special effects triggered at ${x}, ${y}`);
        } else if (type === 'superShotgun') {
            // スーパーショットガン専用効果音再生
            if (this.game.audioSystem.sounds.pickupSuperShotgun) {
                this.game.audioSystem.sounds.pickupSuperShotgun();
            }
            
            // 派手なパーティクルエフェクト
            if (this.game.particleSystem.createSuperShotgunDropEffect) {
                this.game.particleSystem.createSuperShotgunDropEffect(x, y);
            }
            
            console.log(`PickupSystem: EPIC SUPER SHOTGUN DROP! Special effects triggered at ${x}, ${y}`);
        }
        
        console.log(`PickupSystem: pickup added to array, total pickups: ${this.pickups.length}`);
        return pickup;
    }
    
    /**
     * レガシーサポート用のcreatePickup
     * @param {number} x - X座標
     * @param {number} y - Y座標  
     * @param {string} type - アイテムタイプ
     * @param {number} value - アイテム値（オプション）
     */
    createPickup(x, y, type, value = undefined) {
        return this.addPickup(x, y, type, value);
    }
    
    /**
     * アイテム配列の取得
     * @returns {Array} アイテム配列
     */
    getPickups() {
        return this.pickups;
    }
    
    /**
     * アイテム配列のクリア（ゲームリセット時）
     */
    clearPickups() {
        this.pickups = [];
    }
    
    /**
     * アイテム統計取得
     * @returns {Object} アイテム統計情報
     */
    getStats() {
        return {
            totalPickups: this.pickups.length,
            healthPickups: this.pickups.filter(p => p.type === 'health').length,
            speedPickups: this.pickups.filter(p => p.type === 'speed').length,
            nukePickups: this.pickups.filter(p => p.type === 'nuke').length
        };
    }
    
    /**
     * アイテムタイプの説明取得
     * @param {string} type - アイテムタイプ
     * @returns {string} アイテムの説明
     */
    getPickupDescription(type) {
        const descriptions = {
            'health': '体力上限を10増加させる緑のクリスタル',
            'speed': '移動速度を5増加させる青い稲妻',
            'nuke': '強力なニュークランチャーを5発装備する放射性三角形'
        };
        return descriptions[type] || '不明なアイテム';
    }
}