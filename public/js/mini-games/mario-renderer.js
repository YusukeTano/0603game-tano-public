/**
 * MarioRenderer - マリオ風ミニゲーム描画システム
 * ドット絵風レンダリング・レトロ表現・エフェクト描画
 */
export class MarioRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // 描画設定
        this.pixelScale = 1;
        this.smoothing = false;
        
        // カラーパレット（8bitカラー風）
        this.colors = {
            // プレイヤー色
            mario: {
                body: '#FFB366',      // 肌色
                shirt: '#FF0000',     // 赤シャツ
                overalls: '#0066FF',  // 青オーバーオール
                hat: '#FF0000',       // 赤帽子
                shoes: '#654321'      // 茶色靴
            },
            
            // UI色
            coin: '#FFD700',         // 金色
            coinShadow: '#B8860B',   // 金影
            
            // プラットフォーム色
            brick: '#CD853F',        // レンガ
            brickShadow: '#A0522D',  // レンガ影
            grass: '#228B22',        // 草
            grassShadow: '#006400',  // 草影
            cloud: '#F0F8FF',        // 雲
            metal: '#708090',        // 金属
            
            // 敵色
            enemy: '#8B4513',        // 茶色
            enemyShadow: '#654321',  // 茶影
            
            // エフェクト色
            goal: '#FFD700',         // ゴール
            key: '#FFD700',          // キー
            sparkle: '#FFFFFF',      // スパークル
            hazard: '#FF4500',       // 危険
            
            // 背景色
            sky: '#87CEEB',          // 空色
            skyDark: '#4682B4'       // 暗い空
        };
        
        // キャンバス設定
        this.setupCanvas();
        
        console.log('🎨 MarioRenderer: Renderer initialized');
    }
    
    /**
     * キャンバス描画設定
     */
    setupCanvas() {
        // ピクセルパーフェクト設定
        this.ctx.imageSmoothingEnabled = this.smoothing;
        this.ctx.webkitImageSmoothingEnabled = this.smoothing;
        this.ctx.mozImageSmoothingEnabled = this.smoothing;
        this.ctx.msImageSmoothingEnabled = this.smoothing;
    }
    
    /**
     * 背景描画
     */
    renderBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.colors.sky);
        gradient.addColorStop(1, this.colors.skyDark);
        
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 雲の描画
        this.renderClouds();
        
        // 遠景の山
        this.renderMountains();
    }
    
    /**
     * 雲描画
     */
    renderClouds() {
        this.ctx.fillStyle = this.colors.cloud;
        
        // 静的な雲配置
        const clouds = [
            { x: 100, y: 100, size: 60 },
            { x: 400, y: 80, size: 80 },
            { x: 700, y: 120, size: 50 },
            { x: 1000, y: 90, size: 70 }
        ];
        
        clouds.forEach(cloud => {
            this.renderCloud(cloud.x, cloud.y, cloud.size);
        });
    }
    
    /**
     * 単一雲描画
     */
    renderCloud(x, y, size) {
        const radius = size / 4;
        
        this.ctx.beginPath();
        // 雲の形を円で近似
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.arc(x + radius, y, radius * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x - radius, y, radius * 0.8, 0, Math.PI * 2);
        this.ctx.arc(x, y - radius * 0.6, radius * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * 山描画
     */
    renderMountains() {
        this.ctx.fillStyle = '#4682B4';
        this.ctx.globalAlpha = 0.3;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, this.canvas.height);
        this.ctx.lineTo(200, 400);
        this.ctx.lineTo(400, 450);
        this.ctx.lineTo(600, 380);
        this.ctx.lineTo(800, 420);
        this.ctx.lineTo(1000, 350);
        this.ctx.lineTo(1280, 400);
        this.ctx.lineTo(1280, this.canvas.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * プレイヤー描画
     */
    renderPlayer(player) {
        if (!player.active) return;
        
        const animation = player.getAnimationInfo();
        const invincible = player.isInvincible();
        
        // 無敵中の点滅
        if (invincible && Math.floor(Date.now() / 100) % 2 === 0) {
            return;
        }
        
        this.ctx.save();
        
        // 向き調整
        if (animation.facing === 'left') {
            this.ctx.scale(-1, 1);
            this.ctx.translate(-player.x - player.width, 0);
        } else {
            this.ctx.translate(player.x, player.y);
        }
        
        if (animation.facing === 'right') {
            this.ctx.translate(-player.x, 0);
        }
        
        // プレイヤー本体描画
        this.renderMarioSprite(player, animation);
        
        this.ctx.restore();
    }
    
    /**
     * マリオスプライト描画
     */
    renderMarioSprite(player, animation) {
        const x = animation.facing === 'left' ? 0 : player.x;
        const y = player.y;
        
        if (animation.state === 'dead') {
            // 死亡状態
            this.ctx.fillStyle = this.colors.mario.body;
            this.ctx.fillRect(x + 2, y + 6, 12, 8);
            return;
        }
        
        // 帽子
        this.ctx.fillStyle = this.colors.mario.hat;
        this.ctx.fillRect(x + 2, y, 12, 6);
        
        // 頭
        this.ctx.fillStyle = this.colors.mario.body;
        this.ctx.fillRect(x + 4, y + 2, 8, 6);
        
        // シャツ
        this.ctx.fillStyle = this.colors.mario.shirt;
        this.ctx.fillRect(x + 3, y + 6, 10, 4);
        
        // オーバーオール
        this.ctx.fillStyle = this.colors.mario.overalls;
        this.ctx.fillRect(x + 2, y + 8, 12, 6);
        
        // 足（アニメーション）
        this.ctx.fillStyle = this.colors.mario.shoes;
        if (animation.state === 'running') {
            // 走りアニメーション
            const legOffset = animation.frame % 2 === 0 ? 0 : 1;
            this.ctx.fillRect(x + 2 + legOffset, y + 14, 4, 2);
            this.ctx.fillRect(x + 10 - legOffset, y + 14, 4, 2);
        } else {
            // 通常足
            this.ctx.fillRect(x + 3, y + 14, 4, 2);
            this.ctx.fillRect(x + 9, y + 14, 4, 2);
        }
        
        // 腕（ジャンプ時は上げる）
        this.ctx.fillStyle = this.colors.mario.body;
        if (animation.state === 'jumping') {
            this.ctx.fillRect(x + 1, y + 4, 2, 4);
            this.ctx.fillRect(x + 13, y + 4, 2, 4);
        } else {
            this.ctx.fillRect(x + 1, y + 7, 2, 3);
            this.ctx.fillRect(x + 13, y + 7, 2, 3);
        }
    }
    
    /**
     * コイン描画
     */
    renderCoin(coin) {
        if (!coin.active || coin.collected) return;
        
        const animation = coin.getAnimationInfo();
        const centerX = coin.x + coin.width / 2;
        const centerY = coin.y + coin.height / 2;
        
        this.ctx.save();
        this.ctx.translate(centerX, centerY);
        this.ctx.rotate(animation.rotation);
        
        // コイン本体（黄金色）
        this.ctx.fillStyle = this.colors.coin;
        this.ctx.fillRect(-6, -6, 12, 12);
        
        // コインの影
        this.ctx.fillStyle = this.colors.coinShadow;
        this.ctx.fillRect(-6, -4, 12, 2);
        
        // 中央の模様
        this.ctx.fillStyle = this.colors.coinShadow;
        this.ctx.fillRect(-2, -2, 4, 4);
        
        // グロー効果
        if (animation.glow > 0.5) {
            this.ctx.globalAlpha = (animation.glow - 0.5) * 2;
            this.ctx.fillStyle = '#FFFF00';
            this.ctx.fillRect(-8, -8, 16, 16);
            this.ctx.globalAlpha = 1;
        }
        
        this.ctx.restore();
    }
    
    /**
     * 敵描画
     */
    renderEnemy(enemy) {
        if (!enemy.active) return;
        
        const animation = enemy.getAnimationInfo();
        
        this.ctx.save();
        this.ctx.globalAlpha = animation.opacity || 1;
        
        if (animation.isDead) {
            // 死亡状態（平たくなる）
            this.ctx.fillStyle = this.colors.enemy;
            this.ctx.fillRect(enemy.x, enemy.y + enemy.height - 4, enemy.width, 4);
        } else {
            // 通常状態（クリボー風）
            this.ctx.fillStyle = this.colors.enemy;
            this.ctx.fillRect(enemy.x + 2, enemy.y, 12, 12);
            
            // 影
            this.ctx.fillStyle = this.colors.enemyShadow;
            this.ctx.fillRect(enemy.x + 2, enemy.y + 8, 12, 4);
            
            // 目（アニメーション）
            this.ctx.fillStyle = '#000000';
            const eyeOffset = animation.frame % 2;
            this.ctx.fillRect(enemy.x + 4 + eyeOffset, enemy.y + 3, 2, 2);
            this.ctx.fillRect(enemy.x + 10 + eyeOffset, enemy.y + 3, 2, 2);
            
            // 足
            this.ctx.fillStyle = this.colors.enemy;
            this.ctx.fillRect(enemy.x, enemy.y + 12, 4, 4);
            this.ctx.fillRect(enemy.x + 12, enemy.y + 12, 4, 4);
        }
        
        this.ctx.restore();
    }
    
    /**
     * プラットフォーム描画
     */
    renderPlatform(platform) {
        if (!platform.active) return;
        
        const color = this.colors[platform.style] || this.colors.brick;
        const shadowColor = this.colors[platform.style + 'Shadow'] || this.colors.brickShadow;
        
        // メイン部分
        this.ctx.fillStyle = color;
        this.ctx.fillRect(platform.x, platform.y, platform.width, platform.height);
        
        // 影・深み
        this.ctx.fillStyle = shadowColor;
        this.ctx.fillRect(platform.x, platform.y + platform.height - 4, platform.width, 4);
        
        // レンガ風の線
        if (platform.style === 'brick') {
            this.ctx.strokeStyle = shadowColor;
            this.ctx.lineWidth = 1;
            
            // 横線
            for (let y = platform.y + 10; y < platform.y + platform.height; y += 10) {
                this.ctx.beginPath();
                this.ctx.moveTo(platform.x, y);
                this.ctx.lineTo(platform.x + platform.width, y);
                this.ctx.stroke();
            }
            
            // 縦線（交互）
            let offset = 0;
            for (let x = platform.x + 15; x < platform.x + platform.width; x += 15) {
                this.ctx.beginPath();
                this.ctx.moveTo(x + offset, platform.y);
                this.ctx.lineTo(x + offset, platform.y + platform.height);
                this.ctx.stroke();
                offset = offset === 0 ? 7 : 0;
            }
        }
    }
    
    /**
     * ゴール描画
     */
    renderGoal(goal) {
        if (!goal.active) return;
        
        const animation = goal.getAnimationInfo();
        
        // ポール
        this.ctx.fillStyle = '#654321';
        this.ctx.fillRect(goal.x + 10, goal.y - 100, 4, 132);
        
        // 旗
        this.ctx.fillStyle = animation.reached ? '#00FF00' : this.colors.goal;
        const flagWidth = 20;
        const flagHeight = 15;
        
        this.ctx.save();
        this.ctx.translate(goal.x + 14, goal.y - 90);
        
        // 旗のはためき
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(flagWidth, 0);
        this.ctx.lineTo(flagWidth + (animation.waveOffset || 0), flagHeight / 2);
        this.ctx.lineTo(flagWidth, flagHeight);
        this.ctx.lineTo(0, flagHeight);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 旗の模様
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.fillRect(2, 2, 6, 6);
        this.ctx.fillRect(2, 7, 6, 6);
        
        this.ctx.restore();
        
        // ゴール達成エフェクト
        if (animation.glowing) {
            this.renderGoalEffect(goal);
        }
    }
    
    /**
     * ゴールエフェクト描画
     */
    renderGoalEffect(goal) {
        const time = Date.now() * 0.01;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time;
            const x = goal.x + 12 + Math.cos(angle) * 30;
            const y = goal.y - 40 + Math.sin(angle) * 20;
            
            this.ctx.fillStyle = `hsl(${(time * 10 + i * 45) % 360}, 100%, 50%)`;
            this.ctx.fillRect(x - 2, y - 2, 4, 4);
        }
    }
    
    /**
     * キー描画
     */
    renderKey(key) {
        if (!key.active || key.collected) return;
        
        const animation = key.getAnimationInfo();
        
        this.ctx.fillStyle = this.colors.key;
        
        // キー本体
        this.ctx.fillRect(key.x + 2, key.y + 2, 6, 10);
        this.ctx.fillRect(key.x + 8, key.y + 4, 2, 2);
        this.ctx.fillRect(key.x + 8, key.y + 7, 2, 2);
        
        // スパークル
        animation.sparkles.forEach(sparkle => {
            if (sparkle.life > 1) {
                this.ctx.fillStyle = this.colors.sparkle;
                this.ctx.fillRect(
                    key.x + sparkle.x - 1,
                    key.y + sparkle.y - 1,
                    2, 2
                );
            }
        });
    }
    
    /**
     * ハザード描画
     */
    renderHazard(hazard) {
        if (!hazard.active) return;
        
        const animation = hazard.getAnimationInfo();
        
        this.ctx.fillStyle = this.colors.hazard;
        
        switch (animation.type) {
            case 'spikes':
                // 棘の描画
                for (let x = hazard.x; x < hazard.x + hazard.width; x += 8) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(x, hazard.y + hazard.height);
                    this.ctx.lineTo(x + 4, hazard.y);
                    this.ctx.lineTo(x + 8, hazard.y + hazard.height);
                    this.ctx.closePath();
                    this.ctx.fill();
                }
                break;
                
            case 'lava':
                // 溶岩の描画
                this.ctx.fillRect(hazard.x, hazard.y, hazard.width, hazard.height);
                
                // 泡エフェクト
                if (animation.bubbleOffset) {
                    this.ctx.fillStyle = '#FF6500';
                    for (let i = 0; i < hazard.width / 20; i++) {
                        const bubbleX = hazard.x + i * 20 + 10;
                        const bubbleY = hazard.y + animation.bubbleOffset;
                        this.ctx.fillRect(bubbleX - 2, bubbleY - 2, 4, 4);
                    }
                }
                break;
        }
    }
    
    /**
     * UI描画
     */
    renderUI(gameState) {
        this.renderHUD(gameState);
        this.renderTimer(gameState);
    }
    
    /**
     * HUD描画
     */
    renderHUD(gameState) {
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = 'bold 16px monospace';
        this.ctx.textAlign = 'left';
        
        // コイン数
        this.ctx.fillText(`Coins: ${gameState.coins}/${gameState.requiredCoins}`, 10, 30);
        
        // 体力
        for (let i = 0; i < gameState.health; i++) {
            this.ctx.fillStyle = '#FF0000';
            this.ctx.fillRect(10 + i * 20, 40, 16, 16);
        }
    }
    
    /**
     * タイマー描画
     */
    renderTimer(gameState) {
        this.ctx.fillStyle = gameState.timeLeft < 10000 ? '#FF0000' : '#FFFFFF';
        this.ctx.font = 'bold 24px monospace';
        this.ctx.textAlign = 'center';
        
        const seconds = Math.ceil(gameState.timeLeft / 1000);
        this.ctx.fillText(`Time: ${seconds}`, this.canvas.width / 2, 40);
    }
    
    /**
     * 画面フェード
     */
    renderFade(alpha, color = '#000000') {
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * デバッグ情報描画
     */
    renderDebug(gameState) {
        if (!gameState.debug) return;
        
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        
        let y = this.canvas.height - 100;
        this.ctx.fillText(`Player: (${Math.floor(gameState.player.x)}, ${Math.floor(gameState.player.y)})`, 10, y += 15);
        this.ctx.fillText(`Velocity: (${gameState.player.velocityX.toFixed(1)}, ${gameState.player.velocityY.toFixed(1)})`, 10, y += 15);
        this.ctx.fillText(`On Ground: ${gameState.player.onGround}`, 10, y += 15);
        this.ctx.fillText(`State: ${gameState.player.animationState}`, 10, y += 15);
        this.ctx.fillText(`Entities: ${gameState.entities.length}`, 10, y += 15);
    }
    
    /**
     * 完全画面クリア
     */
    clear() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
}