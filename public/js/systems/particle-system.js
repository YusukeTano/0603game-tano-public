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
        // 特殊武器の場合は専用エフェクトを呼び出し
        if (type === 'nuke') {
            this.createNukeDropEffect(x, y);
            return;
        } else if (type === 'superHoming') {
            this.createSuperHomingDropEffect(x, y);
            return;
        } else if (type === 'superShotgun') {
            this.createSuperShotgunDropEffect(x, y);
            return;
        }
        
        let color = '#00ff00'; // デフォルト: 緑（健康）
        
        switch (type) {
            case 'health':
                color = '#00ff00'; // 緑
                break;
            case 'speed':
                color = '#00bfff'; // 青
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
     * ニューク専用ドロップエフェクト（超派手バージョン）
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     */
    createNukeDropEffect(x, y) {
        console.log('ParticleSystem: Creating epic nuke drop effect');
        
        // 第1段階: 衝撃波エフェクト
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const speed = 300 + Math.random() * 200;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff8800', // オレンジ
                1200,
                {
                    size: 6 + Math.random() * 4,
                    friction: 0.92,
                    gravity: 30
                }
            );
        }
        
        // 第2段階: 放射性エフェクト（黄色）
        for (let i = 0; i < 18; i++) {
            const angle = (Math.PI * 2 * i) / 18;
            const speed = 200 + Math.random() * 150;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffff00', // 黄色
                1000,
                {
                    size: 4 + Math.random() * 3,
                    friction: 0.94
                }
            );
        }
        
        // 第3段階: 中心部の爆発（白色）
        for (let i = 0; i < 30; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 40,
                y + (Math.random() - 0.5) * 40,
                (Math.random() - 0.5) * 400,
                (Math.random() - 0.5) * 400,
                '#ffffff',
                800,
                {
                    size: 8 + Math.random() * 6,
                    friction: 0.90
                }
            );
        }
        
        // 第4段階: 火花エフェクト（赤色）
        for (let i = 0; i < 40; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 100 + Math.random() * 300;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ff4400', // 赤オレンジ
                1500,
                {
                    size: 2 + Math.random() * 3,
                    friction: 0.96,
                    gravity: 80
                }
            );
        }
        
        // 第5段階: 遅延爆発エフェクト（時間差）
        setTimeout(() => {
            for (let i = 0; i < 15; i++) {
                const angle = (Math.PI * 2 * i) / 15;
                const distance = 80 + Math.random() * 60;
                
                this.createParticle(
                    x + Math.cos(angle) * distance,
                    y + Math.sin(angle) * distance,
                    Math.cos(angle) * 150,
                    Math.sin(angle) * 150,
                    '#ffaa00', // 明るいオレンジ
                    1000,
                    {
                        size: 5 + Math.random() * 4,
                        friction: 0.93
                    }
                );
            }
        }, 200);
        
        // 第6段階: 核エフェクト（青白い光）
        setTimeout(() => {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                
                this.createParticle(
                    x,
                    y,
                    Math.cos(angle) * 250,
                    Math.sin(angle) * 250,
                    '#aaffff', // 青白
                    2000,
                    {
                        size: 3 + Math.random() * 2,
                        friction: 0.98
                    }
                );
            }
        }, 400);
    }
    
    /**
     * スーパーホーミングガン専用ドロップエフェクト（レインボー＆ターゲティング）
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     */
    createSuperHomingDropEffect(x, y) {
        console.log('ParticleSystem: Creating epic super homing drop effect');
        
        // 第1段階: ホーミング軌道エフェクト（螺旋状）
        for (let i = 0; i < 36; i++) {
            const angle = (Math.PI * 2 * i) / 36;
            const spiralRadius = 50 + (i / 36) * 100;
            const speed = 150 + Math.random() * 100;
            
            // HSL色相で虹色
            const hue = (i / 36) * 360;
            
            this.createParticle(
                x + Math.cos(angle) * spiralRadius,
                y + Math.sin(angle) * spiralRadius,
                Math.cos(angle + Math.PI/2) * speed,
                Math.sin(angle + Math.PI/2) * speed,
                `hsl(${hue}, 100%, 60%)`,
                1500,
                {
                    size: 4 + Math.random() * 2,
                    friction: 0.94
                }
            );
        }
        
        // 第2段階: ターゲットマーカー（複数箇所）
        for (let i = 0; i < 8; i++) {
            const angle = (Math.PI * 2 * i) / 8;
            const distance = 120 + Math.random() * 80;
            const markerX = x + Math.cos(angle) * distance;
            const markerY = y + Math.sin(angle) * distance;
            
            // ターゲットマーカー用パーティクル（十字状）
            for (let j = 0; j < 4; j++) {
                const crossAngle = (Math.PI * j) / 2;
                this.createParticle(
                    markerX,
                    markerY,
                    Math.cos(crossAngle) * 80,
                    Math.sin(crossAngle) * 80,
                    '#00ffff', // シアン
                    1200,
                    {
                        size: 3,
                        friction: 0.96
                    }
                );
            }
        }
        
        // 第3段階: 電磁波エフェクト（中心から放射）
        for (let i = 0; i < 24; i++) {
            const angle = (Math.PI * 2 * i) / 24;
            const speed = 200 + Math.random() * 150;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffffff', // 白い電磁波
                1000,
                {
                    size: 2 + Math.random() * 2,
                    friction: 0.92
                }
            );
        }
        
        // 第4段階: キラキラ星エフェクト（長時間）
        for (let i = 0; i < 30; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 60,
                y + (Math.random() - 0.5) * 60,
                (Math.random() - 0.5) * 300,
                (Math.random() - 0.5) * 300,
                '#ffff00', // 金色
                2000,
                {
                    size: 1 + Math.random() * 3,
                    friction: 0.98,
                    gravity: 20
                }
            );
        }
        
        // 第5段階: 遅延ターゲット追尾エフェクト
        setTimeout(() => {
            for (let i = 0; i < 12; i++) {
                const angle = (Math.PI * 2 * i) / 12;
                const distance = 80;
                
                this.createParticle(
                    x + Math.cos(angle) * distance,
                    y + Math.sin(angle) * distance,
                    Math.cos(angle + Math.PI) * 120, // 中心に向かう
                    Math.sin(angle + Math.PI) * 120,
                    '#ff00ff', // マゼンタ
                    1500,
                    {
                        size: 4,
                        friction: 0.90
                    }
                );
            }
        }, 300);
        
        // 第6段階: オーラエフェクト（青・紫・ピンク）
        setTimeout(() => {
            const auraColors = ['#0088ff', '#8800ff', '#ff0088'];
            
            for (let i = 0; i < 18; i++) {
                const angle = (Math.PI * 2 * i) / 18;
                const color = auraColors[i % auraColors.length];
                
                this.createParticle(
                    x,
                    y,
                    Math.cos(angle) * 100,
                    Math.sin(angle) * 100,
                    color,
                    2500,
                    {
                        size: 3 + Math.random() * 3,
                        friction: 0.99
                    }
                );
            }
        }, 600);
        
        // 第7段階: フィナーレ追尾コンバージェンス
        setTimeout(() => {
            for (let i = 0; i < 20; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 200 + Math.random() * 100;
                
                this.createParticle(
                    x + Math.cos(angle) * distance,
                    y + Math.sin(angle) * distance,
                    Math.cos(angle + Math.PI) * 180, // 中心に収束
                    Math.sin(angle + Math.PI) * 180,
                    '#00ffff', // シアン
                    1800,
                    {
                        size: 2 + Math.random() * 4,
                        friction: 0.88
                    }
                );
            }
        }, 900);
    }
    
    /**
     * スーパーショットガン専用ドロップエフェクト（爆発系・重厚感）
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     */
    createSuperShotgunDropEffect(x, y) {
        console.log('ParticleSystem: Creating epic super shotgun drop effect');
        
        // 第1段階: 二連爆発（ショットガンらしさ）
        for (let barrel = 0; barrel < 2; barrel++) {
            const barrelAngle = barrel * Math.PI / 6; // 30度ずらし
            
            setTimeout(() => {
                // バレル爆発
                for (let i = 0; i < 18; i++) {
                    const angle = (Math.PI * 2 * i) / 18 + barrelAngle;
                    const speed = 250 + Math.random() * 150;
                    
                    this.createParticle(
                        x + Math.cos(barrelAngle) * 20,
                        y + Math.sin(barrelAngle) * 20,
                        Math.cos(angle) * speed,
                        Math.sin(angle) * speed,
                        '#ff6600', // オレンジ
                        1000 + barrel * 200,
                        {
                            size: 5 + Math.random() * 3,
                            friction: 0.91,
                            gravity: 40
                        }
                    );
                }
            }, barrel * 100);
        }
        
        // 第2段階: 散弾群エフェクト（小さな弾丸群）
        for (let i = 0; i < 25; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 180 + Math.random() * 120;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffaa44', // 黄オレンジ
                1200,
                {
                    size: 2 + Math.random() * 2,
                    friction: 0.93,
                    gravity: 60
                }
            );
        }
        
        // 第3段階: 中央爆発（メイン）
        for (let i = 0; i < 20; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 30,
                y + (Math.random() - 0.5) * 30,
                (Math.random() - 0.5) * 350,
                (Math.random() - 0.5) * 350,
                '#ff4400',
                900,
                {
                    size: 6 + Math.random() * 4,
                    friction: 0.89
                }
            );
        }
        
        // 第4段階: 火花・スパーク（ショットガンらしい金属感）
        for (let i = 0; i < 35; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 120 + Math.random() * 200;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffff88', // 黄色い火花
                800,
                {
                    size: 1 + Math.random() * 2,
                    friction: 0.94,
                    gravity: 120
                }
            );
        }
        
        // 第5段階: 遅延シェルケース（薬莢排出）
        setTimeout(() => {
            for (let i = 0; i < 8; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = 60 + Math.random() * 40;
                
                this.createParticle(
                    x + Math.cos(angle) * distance,
                    y + Math.sin(angle) * distance,
                    Math.cos(angle) * 100,
                    Math.sin(angle) * 100,
                    '#cc8800', // ブラス色
                    1500,
                    {
                        size: 3 + Math.random() * 2,
                        friction: 0.95,
                        gravity: 80
                    }
                );
            }
        }, 150);
        
        // 第6段階: 煙エフェクト（重厚感）
        setTimeout(() => {
            for (let i = 0; i < 12; i++) {
                const angle = Math.random() * Math.PI * 2;
                
                this.createParticle(
                    x,
                    y,
                    Math.cos(angle) * 80,
                    Math.sin(angle) * 80,
                    '#888888', // グレー煙
                    2500,
                    {
                        size: 4 + Math.random() * 6,
                        friction: 0.98,
                        gravity: 10
                    }
                );
            }
        }, 200);
        
        // 第7段階: 低周波震動エフェクト（画面揺れ表現）
        setTimeout(() => {
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI * 2 * i) / 6;
                
                this.createParticle(
                    x,
                    y,
                    Math.cos(angle) * 50,
                    Math.sin(angle) * 50,
                    '#ff8800', // 低周波オレンジ
                    3000,
                    {
                        size: 8 + Math.random() * 4,
                        friction: 0.99
                    }
                );
            }
        }, 300);
        
        // 第8段階: フィナーレ爆風（威圧感）
        setTimeout(() => {
            const windColors = ['#ff6600', '#ff8800', '#ffaa44'];
            
            for (let i = 0; i < 15; i++) {
                const angle = (Math.PI * 2 * i) / 15;
                const color = windColors[i % windColors.length];
                
                this.createParticle(
                    x,
                    y,
                    Math.cos(angle) * 200,
                    Math.sin(angle) * 200,
                    color,
                    2000,
                    {
                        size: 2 + Math.random() * 3,
                        friction: 0.96
                    }
                );
            }
        }, 500);
    }
    
    /**
     * 壁反射エフェクト作成（スーパーショットガン専用）
     * @param {number} x - 反射位置X座標
     * @param {number} y - 反射位置Y座標
     */
    createWallBounceEffect(x, y) {
        // 火花エフェクト（短時間・高速）
        for (let i = 0; i < 8; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 150 + Math.random() * 100;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ffaa00', // オレンジ火花
                200,
                {
                    size: 1 + Math.random() * 2,
                    friction: 0.92,
                    gravity: 100
                }
            );
        }
        
        // 衝撃波リング
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI * 2 * i) / 6;
            
            this.createParticle(
                x,
                y,
                Math.cos(angle) * 80,
                Math.sin(angle) * 80,
                '#ff6600', // 衝撃波オレンジ
                300,
                {
                    size: 2,
                    friction: 0.95
                }
            );
        }
        
        // 中心の小爆発
        for (let i = 0; i < 4; i++) {
            this.createParticle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                (Math.random() - 0.5) * 120,
                (Math.random() - 0.5) * 120,
                '#ffffff', // 白い爆発
                250,
                {
                    size: 3 + Math.random() * 2,
                    friction: 0.89
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