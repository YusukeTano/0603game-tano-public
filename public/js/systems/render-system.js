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
}