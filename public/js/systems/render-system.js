/**
 * RenderSystem - 描画管理システム
 * Canvas描画処理の一元管理
 */
export class RenderSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        this.ctx = game.ctx; // Canvas描画コンテキスト
        this.canvas = game.canvas; // Canvas要素
        
        // 描画設定（デフォルト値を設定、後でgame側から更新される）
        this.baseWidth = game.baseWidth || 1280;
        this.baseHeight = game.baseHeight || 720;
        
        console.log('RenderSystem: 描画システム初期化完了');
    }
    
    /**
     * 背景描画メイン処理
     */
    renderBackground() {
        this.ctx.save();
        
        // カメラオフセットを適用
        this.ctx.translate(-this.game.camera.x, -this.game.camera.y);
        
        this.game.backgroundElements.forEach(element => {
            this.ctx.globalAlpha = 1;
            
            switch (element.type) {
                case 'building':
                    this._renderBuilding(element);
                    break;
                    
                case 'crack':
                    this._renderCrack(element);
                    break;
                    
                case 'vegetation':
                    this._renderVegetation(element);
                    break;
            }
        });
        
        // 背景パーティクル描画
        this._renderBackgroundParticles();
        
        this.ctx.restore();
    }
    
    /**
     * 建物描画
     * @private
     */
    _renderBuilding(element) {
        this.ctx.fillStyle = element.color;
        this.ctx.fillRect(element.x, element.y, element.width, element.height);
        
        // 窓と破損部分
        if (element.broken) {
            // 破損した窓
            this.ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 4; j++) {
                    if (Math.random() > 0.3) { // 一部の窓だけ描画
                        this.ctx.fillRect(
                            element.x + 15 + i * (element.width / 3),
                            element.y + 30 + j * (element.height / 5),
                            20, 25
                        );
                    }
                }
            }
            // 破損エフェクト
            this.ctx.fillStyle = 'rgba(60, 60, 60, 0.4)';
            this.ctx.fillRect(element.x, element.y + element.height * 0.7, element.width, element.height * 0.3);
        } else {
            // 通常の窓
            this.ctx.fillStyle = 'rgba(40, 45, 50, 0.5)';
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 5; j++) {
                    this.ctx.fillRect(
                        element.x + 10 + i * (element.width / 4),
                        element.y + 20 + j * (element.height / 6),
                        15, 20
                    );
                }
            }
        }
    }
    
    /**
     * ひび割れ描画
     * @private
     */
    _renderCrack(element) {
        this.ctx.strokeStyle = element.color;
        this.ctx.lineWidth = element.width;
        this.ctx.lineCap = 'round';
        
        this.ctx.beginPath();
        this.ctx.moveTo(element.x, element.y);
        this.ctx.lineTo(
            element.x + Math.cos(element.angle) * element.length,
            element.y + Math.sin(element.angle) * element.length
        );
        this.ctx.stroke();
        
        // 分岐ひび割れ
        for (let i = 0; i < 2; i++) {
            const branchAngle = element.angle + (Math.random() - 0.5) * Math.PI / 2;
            const branchLength = element.length * (0.3 + Math.random() * 0.4);
            const startX = element.x + Math.cos(element.angle) * element.length * (0.3 + i * 0.4);
            const startY = element.y + Math.sin(element.angle) * element.length * (0.3 + i * 0.4);
            
            this.ctx.lineWidth = element.width * 0.6;
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(
                startX + Math.cos(branchAngle) * branchLength,
                startY + Math.sin(branchAngle) * branchLength
            );
            this.ctx.stroke();
        }
    }
    
    /**
     * 植物描画
     * @private
     */
    _renderVegetation(element) {
        this.ctx.fillStyle = element.color;
        
        if (element.type2 === 'bush') {
            // 茂み
            this.ctx.beginPath();
            this.ctx.arc(element.x, element.y, element.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 追加の茂み部分
            for (let i = 0; i < 3; i++) {
                const offsetX = (Math.random() - 0.5) * element.size;
                const offsetY = (Math.random() - 0.5) * element.size * 0.5;
                const subSize = element.size * (0.5 + Math.random() * 0.3);
                
                this.ctx.beginPath();
                this.ctx.arc(element.x + offsetX, element.y + offsetY, subSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        } else {
            // 草
            for (let i = 0; i < 5; i++) {
                const bladeX = element.x + (Math.random() - 0.5) * element.size;
                const bladeY = element.y + (Math.random() - 0.5) * element.size * 0.3;
                const bladeHeight = element.size * (0.8 + Math.random() * 0.4);
                
                this.ctx.lineWidth = 2;
                this.ctx.strokeStyle = element.color;
                this.ctx.lineCap = 'round';
                
                this.ctx.beginPath();
                this.ctx.moveTo(bladeX, bladeY);
                this.ctx.lineTo(bladeX + (Math.random() - 0.5) * 5, bladeY - bladeHeight);
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * 背景パーティクル描画
     * @private
     */
    _renderBackgroundParticles() {
        this.game.backgroundParticles.forEach(particle => {
            this.ctx.globalAlpha = particle.alpha * (particle.life / particle.maxLife);
            this.ctx.fillStyle = particle.color;
            
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        this.ctx.globalAlpha = 1; // アルファ値をリセット
    }
    
    /**
     * 背景パーティクル更新処理
     */
    updateBackgroundParticles(deltaTime) {
        for (let i = this.game.backgroundParticles.length - 1; i >= 0; i--) {
            const particle = this.game.backgroundParticles[i];
            
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            particle.life -= deltaTime * 1000;
            
            // 画面外に出たら再配置
            const screenLeft = this.game.camera.x - 100;
            const screenRight = this.game.camera.x + this.baseWidth + 100;
            const screenTop = this.game.camera.y - 100;
            const screenBottom = this.game.camera.y + this.baseHeight + 100;
            
            if (particle.x < screenLeft || particle.x > screenRight || 
                particle.y < screenTop || particle.y > screenBottom || 
                particle.life <= 0) {
                
                // 新しい位置に再配置
                particle.x = this.game.camera.x + Math.random() * this.baseWidth;
                particle.y = this.game.camera.y + Math.random() * this.baseHeight;
                particle.vx = (Math.random() - 0.5) * 20;
                particle.vy = (Math.random() - 0.5) * 20;
                particle.life = particle.maxLife;
            }
        }
    }
    
    /**
     * 弾丸描画メイン処理
     */
    renderBullets() {
        this.game.bullets.forEach(bullet => {
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            
            if (bullet.enemyBullet) {
                this._renderEnemyBullet();
            } else if (bullet.nuke) {
                this._renderNukeBullet();
            } else if (bullet.laser) {
                this._renderLaserBullet();
            } else if (bullet.weaponType === 'sniper') {
                this._renderSniperBullet();
            } else {
                this._renderPlasmaBullet(bullet);
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * 敵弾描画
     * @private
     */
    _renderEnemyBullet() {
        // 敵の弾 - 赤いエネルギー球
        this.ctx.shadowColor = '#ff0000';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#ff4444';
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * ニューク弾描画
     * @private
     */
    _renderNukeBullet() {
        // ニューク弾 - 巨大な火の玉
        this.ctx.shadowColor = '#ff4400';
        this.ctx.shadowBlur = 15;
        this.ctx.fillStyle = '#ff6600';
        this.ctx.strokeStyle = '#ff0000';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の輝き
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * レーザー弾描画
     * @private
     */
    _renderLaserBullet() {
        // レーザー弾 - 緑のエネルギービーム
        this.ctx.shadowColor = '#00ff88';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#00ffaa';
        this.ctx.strokeStyle = '#00ff88';
        this.ctx.lineWidth = 1;
        
        // レーザービーム（楕円）
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, 8, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * スナイパー弾描画
     * @private
     */
    _renderSniperBullet() {
        // スナイパー弾 - 高速弾丸の軌跡
        this.ctx.shadowColor = '#ffaa00';
        this.ctx.shadowBlur = 5;
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.strokeStyle = '#ff8800';
        this.ctx.lineWidth = 1;
        
        // 弾丸本体
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 軌跡
        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.fillRect(-6, -1, 8, 2);
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * プラズマ弾描画
     * @private
     */
    _renderPlasmaBullet(bullet) {
        // 通常弾（プラズマ弾）
        const size = bullet.size || 4;
        this.ctx.shadowColor = '#00aaff';
        this.ctx.shadowBlur = 6;
        this.ctx.fillStyle = '#00ccff';
        this.ctx.strokeStyle = '#0088cc';
        this.ctx.lineWidth = 1;
        
        // プラズマ球
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の輝き
        this.ctx.fillStyle = '#88ddff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 敵描画メイン処理
     */
    renderEnemies() {
        this.game.enemies.forEach(enemy => {
            this.ctx.save();
            this.ctx.translate(enemy.x, enemy.y);
            
            // 敵タイプ別の描画
            if (enemy.type === 'boss') {
                this._renderBossEnemy(enemy);
            } else {
                this._renderNormalEnemy(enemy);
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * ボス敵描画
     * @private
     */
    _renderBossEnemy(enemy) {
        // ボス - 巨大なドラゴン型
        this.ctx.fillStyle = '#8B0000';
        this.ctx.strokeStyle = '#FF0000';
        this.ctx.lineWidth = 3;
        
        // 本体（楕円）
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, enemy.width/2, enemy.height/2, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 翼
        this.ctx.fillStyle = '#660000';
        this.ctx.beginPath();
        this.ctx.ellipse(-20, -10, 15, 8, -0.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.ellipse(-20, 10, 15, 8, 0.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 目（発光）
        this.ctx.shadowColor = '#FF0000';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#FF4444';
        this.ctx.beginPath();
        this.ctx.arc(-10, -8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(-10, 8, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
        
        // 体力バー（ボス用）
        this._renderBossHealthBar(enemy);
    }
    
    /**
     * 通常敵描画
     * @private
     */
    _renderNormalEnemy(enemy) {
        if (enemy.type === 'fast') {
            this._renderFastEnemy();
        } else if (enemy.type === 'tank') {
            this._renderTankEnemy();
        } else if (enemy.type === 'shooter') {
            this._renderShooterEnemy();
        } else {
            this._renderZombieEnemy();
        }
        
        // 体力バー（通常敵用）
        this._renderEnemyHealthBar(enemy);
    }
    
    /**
     * 高速敵描画（スパイダー型）
     * @private
     */
    _renderFastEnemy() {
        this.ctx.fillStyle = '#ff1744';
        this.ctx.strokeStyle = '#ff5722';
        this.ctx.lineWidth = 2;
        
        // 本体
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 脚（8本）
        this.ctx.strokeStyle = '#ff1744';
        this.ctx.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(Math.cos(angle) * 8, Math.sin(angle) * 8);
            this.ctx.lineTo(Math.cos(angle) * 16, Math.sin(angle) * 16);
            this.ctx.stroke();
        }
    }
    
    /**
     * タンク敵描画（装甲クリーチャー）
     * @private
     */
    _renderTankEnemy() {
        this.ctx.fillStyle = '#37474f';
        this.ctx.strokeStyle = '#263238';
        this.ctx.lineWidth = 3;
        
        // 装甲板（重なり合う六角形）
        this.ctx.beginPath();
        this.ctx.moveTo(12, 0);
        this.ctx.lineTo(6, -10);
        this.ctx.lineTo(-6, -10);
        this.ctx.lineTo(-12, 0);
        this.ctx.lineTo(-6, 10);
        this.ctx.lineTo(6, 10);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 装甲の継ぎ目
        this.ctx.strokeStyle = '#455a64';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(-12, 0);
        this.ctx.lineTo(12, 0);
        this.ctx.moveTo(-6, -10);
        this.ctx.lineTo(6, 10);
        this.ctx.moveTo(6, -10);
        this.ctx.lineTo(-6, 10);
        this.ctx.stroke();
    }
    
    /**
     * シューター敵描画（エイリアン型）
     * @private
     */
    _renderShooterEnemy() {
        this.ctx.fillStyle = '#673ab7';
        this.ctx.strokeStyle = '#9c27b0';
        this.ctx.lineWidth = 2;
        
        // 頭部
        this.ctx.beginPath();
        this.ctx.ellipse(0, -2, 10, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 胴体
        this.ctx.fillStyle = '#512da8';
        this.ctx.beginPath();
        this.ctx.ellipse(0, 4, 8, 6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 発光する目
        this.ctx.shadowColor = '#e91e63';
        this.ctx.shadowBlur = 8;
        this.ctx.fillStyle = '#ff4081';
        this.ctx.beginPath();
        this.ctx.arc(-3, -3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(3, -3, 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * ゾンビ敵描画（通常敵）
     * @private
     */
    _renderZombieEnemy() {
        this.ctx.fillStyle = '#388e3c';
        this.ctx.strokeStyle = '#2e7d32';
        this.ctx.lineWidth = 2;
        
        // 頭
        this.ctx.beginPath();
        this.ctx.arc(0, -4, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 胴体
        this.ctx.fillRect(-6, 0, 12, 10);
        this.ctx.strokeRect(-6, 0, 12, 10);
        
        // 赤い目
        this.ctx.fillStyle = '#f44336';
        this.ctx.beginPath();
        this.ctx.arc(-2, -4, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(2, -4, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * ボス体力バー描画
     * @private
     */
    _renderBossHealthBar(enemy) {
        const healthPercent = enemy.health / enemy.maxHealth;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-40, -45, 80, 8);
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
        this.ctx.fillRect(-40, -45, 80 * healthPercent, 8);
    }
    
    /**
     * 通常敵体力バー描画
     * @private
     */
    _renderEnemyHealthBar(enemy) {
        const healthPercent = enemy.health / enemy.maxHealth;
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(-15, -25, 30, 4);
        this.ctx.fillStyle = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffaa00' : '#ff0000';
        this.ctx.fillRect(-15, -25, 30 * healthPercent, 4);
    }
    
    /**
     * プレイヤー描画メイン処理
     */
    renderPlayer() {
        this.ctx.save();
        this.ctx.translate(this.game.player.x, this.game.player.y);
        this.ctx.rotate(this.game.player.angle);
        
        // ダッシュ効果表示
        if (this.game.player.dashActive) {
            this.ctx.shadowColor = '#00ff88';
            this.ctx.shadowBlur = 25;
            this.ctx.strokeStyle = '#00ff88';
            this.ctx.lineWidth = 3;
            this.ctx.globalAlpha = 0.6;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 18, 0, Math.PI * 2);
            this.ctx.stroke();
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = 1;
        }
        
        // 戦闘機本体（三角形ベース）
        this.ctx.fillStyle = '#00ff88';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // メイン船体
        this.ctx.beginPath();
        this.ctx.moveTo(15, 0); // 先端
        this.ctx.lineTo(-8, -6); // 左翼
        this.ctx.lineTo(-5, -3); // 左後部
        this.ctx.lineTo(-5, 3); // 右後部
        this.ctx.lineTo(-8, 6); // 右翼
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // コックピット
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(3, 0, 2.5, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エンジン排気エフェクト
        this.ctx.fillStyle = this.game.player.dashActive ? '#ffff00' : '#ff6600';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.moveTo(-5, -2);
        this.ctx.lineTo(-12, -1);
        this.ctx.lineTo(-12, 1);
        this.ctx.lineTo(-5, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 翼の装飾
        this.ctx.fillStyle = '#00cc66';
        this.ctx.globalAlpha = 1;
        this.ctx.fillRect(5, -1, 8, 2);
        
        this.ctx.restore();
    }
    
    /**
     * アイテム描画メイン処理
     */
    renderPickups() {
        this.game.pickups.forEach(pickup => {
            this.ctx.save();
            this.ctx.translate(pickup.x, pickup.y);
            
            switch (pickup.type) {
                case 'health':
                    this._renderHealthPickup();
                    break;
                case 'speed':
                    this._renderSpeedPickup();
                    break;
                case 'dash':
                    this._renderDashPickup();
                    break;
                case 'ammo':
                    this._renderAmmoPickup();
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * 体力アイテム描画
     * @private
     */
    _renderHealthPickup() {
        // 体力アイテム - 緑のクリスタル（シンプル版）
        this.ctx.fillStyle = '#00ff66';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(8, 0);
        this.ctx.lineTo(0, 12);
        this.ctx.lineTo(-8, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 十字マーク
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(-1, -6, 2, 12);
        this.ctx.fillRect(-6, -1, 12, 2);
    }
    
    /**
     * スピードアイテム描画
     * @private
     */
    _renderSpeedPickup() {
        // 速度アイテム - 青い六角形（シンプル版）
        this.ctx.fillStyle = '#0088ff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(10, 0);
        this.ctx.lineTo(5, -8);
        this.ctx.lineTo(-5, -8);
        this.ctx.lineTo(-10, 0);
        this.ctx.lineTo(-5, 8);
        this.ctx.lineTo(5, 8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 稲妻マーク
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(-2, -6);
        this.ctx.lineTo(2, -6);
        this.ctx.lineTo(-1, 0);
        this.ctx.lineTo(3, 0);
        this.ctx.lineTo(-2, 6);
        this.ctx.lineTo(1, 2);
        this.ctx.lineTo(-3, 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * ダッシュアイテム描画
     * @private
     */
    _renderDashPickup() {
        // ダッシュアイテム - 青いダイヤモンド
        this.ctx.fillStyle = '#00ccff';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(7, 0);
        this.ctx.lineTo(0, 10);
        this.ctx.lineTo(-7, 0);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
    }
    
    /**
     * 弾薬アイテム描画
     * @private
     */
    _renderAmmoPickup() {
        // 弾薬アイテム - オレンジ三角形
        this.ctx.fillStyle = '#ff8800';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(8, 6);
        this.ctx.lineTo(-8, 6);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の装飾
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.moveTo(0, -6);
        this.ctx.lineTo(4, 2);
        this.ctx.lineTo(-4, 2);
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    /**
     * パーティクル描画
     */
    renderParticles() {
        this.game.particles.forEach(particle => {
            const alpha = particle.life / particle.maxLife;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillStyle = particle.color;
            this.ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
        });
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * UI エフェクト描画（ダメージ、警告など）
     */
    renderUIEffects() {
        // ダメージ画面フラッシュ効果
        if (this.game.damageEffects && this.game.damageEffects.screenFlash > 0) {
            this.ctx.fillStyle = `rgba(255, 0, 0, ${this.game.damageEffects.screenFlash * 0.5})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 低体力時の警告表示
        const healthPercent = this.game.player.health / this.game.player.maxHealth;
        if (healthPercent < 0.3) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.3 + 0.7;
            this.ctx.strokeStyle = `rgba(255, 0, 0, ${pulse * healthPercent})`;
            this.ctx.lineWidth = 8;
            this.ctx.strokeRect(10, 10, this.canvas.width - 20, this.canvas.height - 20);
        }
    }
}