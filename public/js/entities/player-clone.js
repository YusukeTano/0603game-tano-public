/**
 * PlayerClone - パイロットイン分身クラス
 * プレイヤーの分身を管理し、追従・射撃を行う
 */
export class PlayerClone {
    constructor(player, strength, formationPosition) {
        // 基本ポジション
        this.x = player.x;
        this.y = player.y;
        
        // 分身の能力（1～100の値）
        this.strength = Math.max(1, Math.min(100, strength)); // 1-100%でクランプ
        
        // 能力値計算
        this.size = this.strength / 100;              // 0.01～1.0（ユーザー仕様通り）
        this.damageMultiplier = this.strength / 100;   // 0.01～1.0 
        this.alpha = 0.6 + (this.strength / 100) * 0.4; // 0.6～1.0の透明度（バランス調整）
        
        // 編隊位置
        this.formationPosition = formationPosition; // {x, y}
        this.targetX = this.x;
        this.targetY = this.y;
        
        // 移動関連
        this.followSpeed = 0.8 + (this.strength / 100) * 0.2; // 0.8～1.0（より高速に追従）
        
        // 射撃関連
        this.lastShotTime = 0;
        this.shootCooldown = 200; // 200ms基本クールダウン（プレイヤーと同程度）
        
        // 視覚効果
        this.hue = 200 + (this.strength * 0.8); // 200～280（青→紫）
        this.pulsePhase = Math.random() * Math.PI * 2; // ランダム位相
        
        console.log(`PlayerClone: Created clone with ${this.strength}% strength`);
    }
    
    /**
     * 分身の更新処理
     * @param {number} deltaTime - フレーム時間
     * @param {Object} player - プレイヤーオブジェクト
     */
    update(deltaTime, player) {
        // 動的追従：プレイヤーの移動を考慮した目標位置計算
        const playerSpeed = Math.sqrt((player.x - (player.lastX || player.x))**2 + (player.y - (player.lastY || player.y))**2);
        
        if (playerSpeed > 1) {
            // プレイヤーが移動中：移動方向の後ろに追従
            const moveAngle = Math.atan2(player.y - (player.lastY || player.y), player.x - (player.lastX || player.x));
            const followDistance = 80; // 追従距離
            this.targetX = player.x - Math.cos(moveAngle) * followDistance + this.formationPosition.x * 0.5;
            this.targetY = player.y - Math.sin(moveAngle) * followDistance + this.formationPosition.y * 0.5;
        } else {
            // プレイヤーが停止中：編隊位置で警戒
            this.targetX = player.x + this.formationPosition.x;
            this.targetY = player.y + this.formationPosition.y;
        }
        
        // プレイヤーの前回位置を記録（次回計算用）
        player.lastX = player.x;
        player.lastY = player.y;
        
        // スムーズ追従移動
        this.x += (this.targetX - this.x) * this.followSpeed * deltaTime * 60;
        this.y += (this.targetY - this.y) * this.followSpeed * deltaTime * 60;
        
        // パルス効果更新
        this.pulsePhase += deltaTime * 4; // 1秒で約2.4回転
        
        // 射撃クールダウン更新（deltaTimeはすでに秒単位）
        if (this.lastShotTime > 0) {
            this.lastShotTime -= deltaTime * 1000; // ミリ秒換算
            this.lastShotTime = Math.max(0, this.lastShotTime);
        }
    }
    
    /**
     * 射撃可能かチェック
     * @returns {boolean} 射撃可能かどうか
     */
    canShoot() {
        // 射撃クールダウンの確認をより緩く
        return this.lastShotTime <= 0;
    }
    
    /**
     * 射撃実行
     * @param {number} angle - 射撃角度
     * @param {Object} weaponSystem - 武器システム
     * @param {Object} bulletSystem - 弾丸システム
     */
    shoot(angle, weaponSystem, bulletSystem) {
        if (!this.canShoot()) return;
        
        // 射撃クールダウン設定
        this.lastShotTime = this.shootCooldown;
        
        // 現在の武器取得
        const currentWeapon = weaponSystem.getCurrentWeapon();
        
        // 微細な角度ズレ（±3度）
        const angleOffset = (Math.random() - 0.5) * 0.1; // ±0.05ラジアン（約±3度）
        const finalAngle = angle + angleOffset;
        
        // 弾丸の基本速度とダメージ
        const bulletSpeed = 800; // 基本速度
        const baseDamage = currentWeapon.damage * this.damageMultiplier;
        
        // 分身用弾丸作成
        const cloneBullet = {
            x: this.x + Math.cos(finalAngle) * 15, // 分身から少し前方
            y: this.y + Math.sin(finalAngle) * 15,
            vx: Math.cos(finalAngle) * bulletSpeed,
            vy: Math.sin(finalAngle) * bulletSpeed,
            damage: baseDamage,
            range: currentWeapon.range * 0.8, // 少し短い射程
            distance: 0,
            size: 3 * this.size, // サイズに応じた弾丸サイズ
            color: `hsl(${this.hue}, 70%, 60%)`, // 分身色
            isCloneBullet: true, // 分身弾識別用
            ownerClone: this // 射撃した分身への参照
        };
        
        // 弾丸追加
        bulletSystem.addBullet(cloneBullet);
        
        console.log(`PlayerClone: Shot bullet with ${baseDamage.toFixed(1)} damage (${(this.damageMultiplier * 100).toFixed(0)}% strength)`);
    }
    
    /**
     * 描画用データ取得
     * @returns {Object} 描画用の分身データ
     */
    getRenderData() {
        const pulseIntensity = 1 + Math.sin(this.pulsePhase) * 0.2; // 0.8～1.2の変動
        
        return {
            x: this.x,
            y: this.y,
            size: this.size,
            alpha: this.alpha,
            hue: this.hue,
            strength: this.strength,
            pulseIntensity: pulseIntensity,
            color: `hsl(${this.hue}, 70%, ${50 + this.strength * 0.3}%)`,
            glowColor: `hsl(${this.hue}, 90%, 70%)`,
            shadowColor: `hsl(${this.hue}, 50%, 30%)`
        };
    }
    
    /**
     * 分身の距離チェック（プレイヤーから離れすぎた場合の処理）
     * @param {Object} player - プレイヤーオブジェクト
     * @returns {boolean} 有効な範囲内かどうか
     */
    isInValidRange(player) {
        const distance = Math.sqrt(
            (this.x - player.x) * (this.x - player.x) + 
            (this.y - player.y) * (this.y - player.y)
        );
        return distance < 200; // 200px以内
    }
    
    /**
     * 分身の強制リポジション（プレイヤーから離れすぎた場合）
     * @param {Object} player - プレイヤーオブジェクト
     */
    forceReposition(player) {
        this.x = player.x + this.formationPosition.x * 0.5;
        this.y = player.y + this.formationPosition.y * 0.5;
        console.log('PlayerClone: Force repositioned to player');
    }
}