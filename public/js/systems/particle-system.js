/**
 * ParticleSystem - パーティクル管理システム
 * エフェクト・パーティクル生成・更新・描画の一元管理
 */
export class ParticleSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持
        
        // パーティクル配列
        this.particles = [];
        
        console.log('ParticleSystem: パーティクルシステム初期化完了');
    }
    
    /**
     * パーティクルシステム更新処理
     * @param {number} deltaTime - フレーム時間
     */
    update(deltaTime) {
        this.updateParticles(deltaTime);
        this.cleanupExpiredParticles();
    }
    
    /**
     * パーティクル作成
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} vx - X方向速度
     * @param {number} vy - Y方向速度
     * @param {string} color - パーティクルカラー
     * @param {number} life - 寿命（ミリ秒）
     * @param {Object} options - 追加オプション
     */
    createParticle(x, y, vx, vy, color, life, options = {}) {
        const particle = {
            x: x,
            y: y,
            vx: vx,
            vy: vy,
            color: color,
            life: life,
            maxLife: life,
            size: options.size || 2,
            fade: options.fade !== false, // デフォルトでフェード有効
            gravity: options.gravity || 0,
            friction: options.friction || 0.98
        };
        
        this.particles.push(particle);
    }
    
    /**
     * 爆発エフェクト作成
     * @param {number} x - 爆発中心X座標
     * @param {number} y - 爆発中心Y座標
     * @param {number} count - パーティクル数
     * @param {string} color - パーティクルカラー
     * @param {number} speed - 初期速度
     * @param {number} life - 寿命
     */
    createExplosion(x, y, count = 8, color = '#ff6b6b', speed = 200, life = 500) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const velocityVariation = 0.5 + Math.random() * 0.5; // 速度にランダム性追加
            
            this.createParticle(
                x + (Math.random() - 0.5) * 10, // 少し位置をずらす
                y + (Math.random() - 0.5) * 10,
                Math.cos(angle) * speed * velocityVariation,
                Math.sin(angle) * speed * velocityVariation,
                color,
                life,
                {
                    size: 3 + Math.random() * 2,
                    friction: 0.95,
                    gravity: 0.2
                }
            );
        }
    }
    
    /**
     * ヒットエフェクト作成
     * @param {number} x - ヒット位置X座標
     * @param {number} y - ヒット位置Y座標
     * @param {string} color - エフェクトカラー
     */
    createHitEffect(x, y, color = '#ff6b6b') {
        this.createExplosion(x, y, 4, color, 150, 300);
    }
    
    /**
     * マズルフラッシュエフェクト作成
     * @param {number} x - 発射位置X座標
     * @param {number} y - 発射位置Y座標
     * @param {number} angle - 発射角度
     * @param {string} color - フラッシュカラー
     */
    createMuzzleFlash(x, y, angle, color = '#ffeb3b') {
        const flashLength = 25;
        const flashSpeed = 300;
        
        this.createParticle(
            x,
            y,
            Math.cos(angle) * flashSpeed,
            Math.sin(angle) * flashSpeed,
            color,
            100,
            {
                size: 4,
                friction: 0.9
            }
        );
        
        // 追加の散らばりエフェクト
        for (let i = 0; i < 3; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
            this.createParticle(
                x + Math.cos(angle) * flashLength,
                y + Math.sin(angle) * flashLength,
                Math.cos(spreadAngle) * flashSpeed * 0.5,
                Math.sin(spreadAngle) * flashSpeed * 0.5,
                color,
                150,
                {
                    size: 2,
                    friction: 0.92
                }
            );
        }
    }
    
    /**
     * アイテム収集エフェクト作成
     * @param {number} x - 収集位置X座標
     * @param {number} y - 収集位置Y座標
     * @param {string} type - アイテムタイプ ('health', 'speed', 'nuke')
     */
    createPickupEffect(x, y, type) {
        let color = '#00ff00'; // デフォルト: 緑（健康）
        
        switch (type) {
            case 'health':
                color = '#00ff00'; // 緑
                break;
            case 'speed':
                color = '#00bfff'; // 青
                break;
            case 'nuke':
                color = '#ff4500'; // オレンジ
                break;
        }
        
        // 輝きエフェクト
        for (let i = 0; i < 12; i++) {
            const angle = (Math.PI * 2 * i) / 12;
            this.createParticle(
                x,
                y,
                Math.cos(angle) * 100,
                Math.sin(angle) * 100,
                color,
                400,
                {
                    size: 3,
                    friction: 0.95
                }
            );
        }
    }
    
    /**
     * レベルアップエフェクト作成
     * @param {number} x - プレイヤーX座標
     * @param {number} y - プレイヤーY座標
     */
    createLevelUpEffect(x, y) {
        const colors = ['#ffd700', '#ffeb3b', '#fff200', '#ffff00'];
        
        // 外向きの光線エフェクト
        for (let i = 0; i < 16; i++) {
            const angle = (Math.PI * 2 * i) / 16;
            const color = colors[i % colors.length];
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * 200,
                Math.sin(angle) * 200,
                color,
                800,
                {
                    size: 4,
                    friction: 0.98
                }
            );
        }
        
        // 中心部の輝きエフェクト
        for (let i = 0; i < 8; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 20,
                y + (Math.random() - 0.5) * 20,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                '#ffffff',
                600,
                {
                    size: 2,
                    friction: 0.96
                }
            );
        }
    }
    
    /**
     * 全パーティクル更新処理
     * @param {number} deltaTime - フレーム時間
     * @private
     */
    updateParticles(deltaTime) {
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            
            // 位置更新
            particle.x += particle.vx * deltaTime;
            particle.y += particle.vy * deltaTime;
            
            // 重力適用
            if (particle.gravity) {
                particle.vy += particle.gravity * deltaTime * 60; // 60FPS基準
            }
            
            // 摩擦適用
            if (particle.friction) {
                particle.vx *= particle.friction;
                particle.vy *= particle.friction;
            }
            
            // 寿命減少
            particle.life -= deltaTime * 1000;
        }
    }
    
    /**
     * 期限切れパーティクル削除
     * @private
     */
    cleanupExpiredParticles() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 全パーティクル描画（RenderSystemから呼び出される）
     * @param {CanvasRenderingContext2D} ctx - 描画コンテキスト
     */
    render(ctx) {
        for (const particle of this.particles) {
            ctx.save();
            
            // フェード効果
            if (particle.fade) {
                const alpha = Math.max(0, particle.life / particle.maxLife);
                ctx.globalAlpha = alpha;
            }
            
            // パーティクル描画
            ctx.fillStyle = particle.color;
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            // グロー効果（オプション）
            if (particle.size > 3) {
                ctx.shadowBlur = particle.size * 2;
                ctx.shadowColor = particle.color;
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.size * 0.5, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
    }
    
    /**
     * 特定範囲のパーティクル削除
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @param {number} radius - 削除範囲半径
     */
    clearParticlesInRadius(x, y, radius) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            const distance = Math.sqrt(
                Math.pow(particle.x - x, 2) + Math.pow(particle.y - y, 2)
            );
            
            if (distance < radius) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    /**
     * 全パーティクル削除
     */
    clearAllParticles() {
        this.particles = [];
    }
    
    /**
     * パーティクル数取得
     * @returns {number} 現在のパーティクル数
     */
    getParticleCount() {
        return this.particles.length;
    }
    
    /**
     * ステージクリア完了エフェクト（StageSystem統合用）
     * @param {number} centerX - 中心X座標
     * @param {number} centerY - 中心Y座標
     */
    createStageCompleteEffect(centerX = 640, centerY = 360) {
        console.log('ParticleSystem: Creating stage complete effect');
        
        // 中央から放射状の豪華な花火エフェクト
        for (let i = 0; i < 50; i++) {
            const angle = (Math.PI * 2 * i) / 50;
            const speed = 200 + Math.random() * 150;
            
            this.createParticle(
                centerX,
                centerY,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                i % 4 === 0 ? '#FFD700' : // 金
                i % 4 === 1 ? '#FF6B6B' : // 赤
                i % 4 === 2 ? '#4ECDC4' : // 青緑
                '#A8E6CF', // 緑
                2000,
                { size: 4 + Math.random() * 4, gravity: 50 }
            );
        }
        
        // 中心の白い爆発
        for (let i = 0; i < 20; i++) {
            this.createParticle(
                centerX + (Math.random() - 0.5) * 50,
                centerY + (Math.random() - 0.5) * 50,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 100,
                '#FFFFFF',
                1500,
                { size: 6 + Math.random() * 6 }
            );
        }
        
        // 外周の星型エフェクト
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const radius = 150;
            
            this.createParticle(
                centerX + Math.cos(angle) * radius,
                centerY + Math.sin(angle) * radius,
                Math.cos(angle) * 50,
                Math.sin(angle) * 50,
                '#FFD700',
                3000,
                { size: 8, gravity: 20 }
            );
        }
    }

    /**
     * パーティクルシステムの状態取得（デバッグ用）
     * @returns {Object} パーティクルシステムの状態
     */
    getParticleSystemState() {
        return {
            particleCount: this.particles.length,
            particles: this.particles
        };
    }
}