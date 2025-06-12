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
                if (this.game.audioSystem.sounds.pickupAmmo) {
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
                if (itemType < 0.02) {
                    type = 'nuke'; // 2%確率でニュークランチャー
                } else if (itemType < 0.27) {
                    type = 'health'; // 25%確率で体力増加 (0.02-0.27 = 25%)
                } else if (itemType < 0.52) {
                    type = 'range'; // 25%確率で射程増加 (0.27-0.52 = 25%)
                } else {
                    type = 'speed'; // 48%確率で移動速度増加 (0.52-1.0 = 48%)
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
                pickup = Pickup.createRangePickup(x, y, value || 1.2);
                break;
            case 'nuke':
                pickup = Pickup.createNukePickup(x, y, value || 5);
                break;
            case 'dash':
                pickup = Pickup.createDashPickup(x, y, value || 1);
                break;
            case 'ammo':
                pickup = Pickup.createAmmoPickup(x, y, value || 10);
                break;
            default:
                pickup = new Pickup(x, y, type, { value: value });
                break;
        }
        
        this.pickups.push(pickup);
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