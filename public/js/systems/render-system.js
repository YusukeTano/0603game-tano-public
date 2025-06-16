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
     * ドット絵風草原地面描画
     * @private
     */
    _renderDetailedGround() {
        const camera = this.game.camera;
        
        // ドット絵風タイルシステム
        this._renderPixelArtGround(camera);
    }
    
    /**
     * ドット絵風地面タイル描画
     * @private
     */
    _renderPixelArtGround(camera) {
        const tileSize = 16; // 16x16ピクセルタイル
        
        // ドット絵風カラーパレット
        const grassTiles = {
            base: '#4CAF50',      // 基本草色
            dark: '#388E3C',      // 濃い草色  
            light: '#66BB6A',     // 明るい草色
            dirt: '#8D6E63'       // 土色
        };
        
        // 画面に表示される範囲を計算
        const startTileX = Math.floor((camera.x - 100) / tileSize);
        const startTileY = Math.floor((camera.y - 100) / tileSize);
        const endTileX = Math.ceil((camera.x + this.baseWidth + 100) / tileSize);
        const endTileY = Math.ceil((camera.y + this.baseHeight + 100) / tileSize);
        
        // タイルマップ描画
        for (let tileX = startTileX; tileX < endTileX; tileX++) {
            for (let tileY = startTileY; tileY < endTileY; tileY++) {
                const pixelX = tileX * tileSize;
                const pixelY = tileY * tileSize;
                
                // 疑似ランダムでタイル種類決定（位置ベース）
                const tileType = this._getTileType(tileX, tileY);
                
                // タイル描画
                this.ctx.fillStyle = grassTiles[tileType];
                this.ctx.fillRect(pixelX, pixelY, tileSize, tileSize);
                
                // ドット絵風ディテール追加
                this._renderTileDetails(pixelX, pixelY, tileSize, tileType);
            }
        }
    }
    
    /**
     * タイル種類決定（疑似ランダム）
     * @private
     */
    _getTileType(x, y) {
        // 固定シードによる疑似ランダム
        const seed = (x * 17 + y * 31) % 100;
        
        if (seed < 70) return 'base';      // 70% 基本草
        if (seed < 85) return 'dark';      // 15% 濃い草
        if (seed < 95) return 'light';     // 10% 明るい草
        return 'dirt';                     // 5% 土
    }
    
    /**
     * タイル内ドット絵ディテール描画
     * @private
     */
    _renderTileDetails(x, y, size, tileType) {
        const pixelSize = 2; // 小さなピクセルサイズ
        
        switch (tileType) {
            case 'base':
                this._renderGrassPixels(x, y, size, pixelSize);
                break;
            case 'dark':
                this._renderDarkGrassPixels(x, y, size, pixelSize);
                break;
            case 'light':
                this._renderLightGrassPixels(x, y, size, pixelSize);
                break;
            case 'dirt':
                this._renderDirtPixels(x, y, size, pixelSize);
                break;
        }
    }
    
    /**
     * 基本草ピクセル描画
     * @private
     */
    _renderGrassPixels(x, y, size, pixelSize) {
        // 草のドット絵パターン
        const grassPattern = [
            [0, 0, 1, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [0, 0, 1, 0, 0, 1, 0, 0],
            [0, 1, 0, 0, 0, 0, 1, 0],
            [0, 0, 0, 1, 1, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 1]
        ];
        
        this.ctx.fillStyle = '#2E7D32'; // 濃い緑でアクセント
        this._drawPixelPattern(x, y, grassPattern, pixelSize);
    }
    
    /**
     * 濃い草ピクセル描画
     * @private
     */
    _renderDarkGrassPixels(x, y, size, pixelSize) {
        const darkPattern = [
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 1, 1, 0, 0, 1],
            [1, 0, 1, 0, 1, 0, 1, 0],
            [0, 0, 0, 1, 0, 0, 0, 0],
            [1, 0, 0, 0, 0, 0, 1, 0],
            [0, 1, 0, 1, 1, 0, 0, 1]
        ];
        
        this.ctx.fillStyle = '#1B5E20'; // さらに濃い緑
        this._drawPixelPattern(x, y, darkPattern, pixelSize);
    }
    
    /**
     * 明るい草ピクセル描画
     * @private
     */
    _renderLightGrassPixels(x, y, size, pixelSize) {
        const lightPattern = [
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 1],
            [0, 1, 0, 1, 0, 1, 0, 1],
            [1, 0, 0, 0, 0, 0, 1, 0],
            [0, 0, 1, 0, 0, 1, 0, 0],
            [1, 0, 0, 0, 0, 0, 0, 1]
        ];
        
        this.ctx.fillStyle = '#81C784'; // 明るい緑
        this._drawPixelPattern(x, y, lightPattern, pixelSize);
    }
    
    /**
     * 土ピクセル描画
     * @private
     */
    _renderDirtPixels(x, y, size, pixelSize) {
        const dirtPattern = [
            [1, 1, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1, 1, 0, 1],
            [0, 1, 1, 1, 0, 1, 1, 0],
            [1, 0, 1, 1, 1, 0, 1, 1],
            [1, 1, 0, 1, 1, 0, 1, 1],
            [1, 0, 1, 0, 1, 1, 0, 1],
            [0, 1, 1, 1, 0, 1, 1, 0],
            [1, 0, 1, 1, 1, 0, 1, 1]
        ];
        
        this.ctx.fillStyle = '#5D4037'; // 濃い土色
        this._drawPixelPattern(x, y, dirtPattern, pixelSize);
    }
    
    /**
     * ピクセルパターン描画ヘルパー
     * @private
     */
    _drawPixelPattern(x, y, pattern, pixelSize) {
        pattern.forEach((row, py) => {
            row.forEach((pixel, px) => {
                if (pixel) {
                    this.ctx.fillRect(
                        x + px * pixelSize, 
                        y + py * pixelSize, 
                        pixelSize, 
                        pixelSize
                    );
                }
            });
        });
    }
    
    /**
     * 控えめな草原バリエーション描画
     * @private
     */
    _renderSubtleGrassVariation(startX, startY, width, height) {
        // より濃い草色でたまに大きなパッチを描画
        this.ctx.fillStyle = 'rgba(76, 175, 80, 0.3)'; // より濃い緑
        
        // 大きな控えめなパッチ（少数）
        const patchCount = 8;
        for (let i = 0; i < patchCount; i++) {
            const x = startX + ((i * 241) % (width - 100));
            const y = startY + ((i * 367) % (height - 100));
            const radius = 40 + ((i * 17) % 30);
            
            this.ctx.globalAlpha = 0.3;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // より明るいハイライト（さらに少数）
        this.ctx.fillStyle = 'rgba(139, 195, 74, 0.2)'; // 明るい緑
        for (let i = 0; i < 5; i++) {
            const x = startX + ((i * 179) % (width - 80));
            const y = startY + ((i * 431) % (height - 80));
            const radius = 25 + ((i * 13) % 20);
            
            this.ctx.globalAlpha = 0.2;
            this.ctx.beginPath();
            this.ctx.arc(x, y, radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1; // アルファをリセット
    }
    
    /**
     * 土の斑点描画
     * @private
     */
    _renderSoilPatches(startX, startY, width, height) {
        const soilColors = [
            'rgba(139, 69, 19, 0.3)',   // Saddle Brown
            'rgba(160, 82, 45, 0.4)',   // Sienna
            'rgba(205, 133, 63, 0.2)',  // Peru
            'rgba(222, 184, 135, 0.3)'  // Burlywood
        ];
        
        for (let i = 0; i < 25; i++) {
            const x = startX + Math.random() * width;
            const y = startY + Math.random() * height;
            const patchSize = 15 + Math.random() * 25;
            const colorIndex = Math.floor(Math.random() * soilColors.length);
            
            this.ctx.fillStyle = soilColors[colorIndex];
            
            // 不規則な土のパッチ
            this.ctx.beginPath();
            this.ctx.arc(x, y, patchSize, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 周辺に小さな土の粒
            for (let j = 0; j < 5; j++) {
                const dotX = x + (Math.random() - 0.5) * patchSize * 1.5;
                const dotY = y + (Math.random() - 0.5) * patchSize * 1.5;
                const dotSize = 1 + Math.random() * 3;
                
                this.ctx.beginPath();
                this.ctx.arc(dotX, dotY, dotSize, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }
    
    /**
     * 小石描画
     * @private
     */
    _renderSmallRocks(startX, startY, width, height) {
        const rockColors = [
            'rgba(105, 105, 105, 0.8)', // Dim Gray
            'rgba(119, 136, 153, 0.7)', // Light Slate Gray
            'rgba(112, 128, 144, 0.6)', // Slate Gray
            'rgba(169, 169, 169, 0.5)'  // Dark Gray
        ];
        
        for (let i = 0; i < 40; i++) {
            const x = startX + Math.random() * width;
            const y = startY + Math.random() * height;
            const rockSize = 2 + Math.random() * 6;
            const colorIndex = Math.floor(Math.random() * rockColors.length);
            
            this.ctx.fillStyle = rockColors[colorIndex];
            
            // 楕円形の石
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(Math.random() * Math.PI);
            this.ctx.beginPath();
            this.ctx.ellipse(0, 0, rockSize, rockSize * 0.7, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // ハイライト効果
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            this.ctx.beginPath();
            this.ctx.ellipse(-rockSize * 0.3, -rockSize * 0.3, rockSize * 0.3, rockSize * 0.2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
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
     * ドット絵風樹木描画
     * @private
     */
    _renderTree(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        
        // ピクセルアート風樹木パターン
        this._renderPixelArtTree(element);
        
        this.ctx.restore();
    }
    
    /**
     * ピクセルアート樹木描画
     * @private
     */
    _renderPixelArtTree(element) {
        const pixelSize = 4; // 4x4ピクセル
        
        // 樹木のドット絵パターン（16x20の樹木）
        const treePattern = [
            // 樹冠部分（上から8行）
            [0, 0, 0, 2, 2, 2, 2, 0, 0, 0],      // 0
            [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],      // 1
            [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],      // 2
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],      // 3
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],      // 4
            [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],      // 5
            [0, 2, 2, 2, 2, 2, 2, 2, 2, 0],      // 6
            [0, 0, 2, 2, 2, 2, 2, 2, 0, 0],      // 7
            // 幹部分（下から8行）
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 8
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 9
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 10
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 11
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 12
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 13
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],      // 14
            [0, 0, 0, 0, 1, 1, 0, 0, 0, 0]       // 15
        ];
        
        // カラーパレット
        const colors = {
            0: null,           // 透明
            1: '#8D6E63',      // 幹（茶色）
            2: '#4CAF50'       // 葉（緑色）
        };
        
        // パターン描画
        treePattern.forEach((row, py) => {
            row.forEach((colorIndex, px) => {
                if (colorIndex && colors[colorIndex]) {
                    this.ctx.fillStyle = colors[colorIndex];
                    this.ctx.fillRect(
                        (px - 5) * pixelSize,  // 中央寄せ
                        (py - 8) * pixelSize,  // 上寄せ
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    /**
     * 自然道描画 - 草原テーマ  
     * @private
     */
    _renderNaturalPath(element) {
        this.ctx.strokeStyle = element.color;
        this.ctx.lineWidth = element.width;
        this.ctx.lineCap = 'round';
        
        // メイン道路
        this.ctx.beginPath();
        this.ctx.moveTo(element.x, element.y);
        
        // カーブした道を描画
        const endX = element.x + Math.cos(element.angle) * element.length;
        const endY = element.y + Math.sin(element.angle) * element.length;
        const controlX = element.x + Math.cos(element.angle) * element.length * 0.5 + element.curvature * element.length;
        const controlY = element.y + Math.sin(element.angle) * element.length * 0.5;
        
        this.ctx.quadraticCurveTo(controlX, controlY, endX, endY);
        this.ctx.stroke();
        
        // 草の端っこ描画
        if (element.grassEdges) {
            this.ctx.strokeStyle = 'rgba(107, 142, 35, 0.4)';
            this.ctx.lineWidth = 2;
            
            // 道の両側に草
            for (let t = 0; t <= 1; t += 0.1) {
                const pathX = element.x + Math.cos(element.angle) * element.length * t + element.curvature * element.length * t * (1-t);
                const pathY = element.y + Math.sin(element.angle) * element.length * t;
                
                // 左側の草
                const leftX = pathX + Math.cos(element.angle + Math.PI/2) * (element.width/2 + 5);
                const leftY = pathY + Math.sin(element.angle + Math.PI/2) * (element.width/2 + 5);
                this.ctx.beginPath();
                this.ctx.moveTo(leftX, leftY);
                this.ctx.lineTo(leftX + (Math.random() - 0.5) * 8, leftY - 5 - Math.random() * 8);
                this.ctx.stroke();
                
                // 右側の草
                const rightX = pathX + Math.cos(element.angle - Math.PI/2) * (element.width/2 + 5);
                const rightY = pathY + Math.sin(element.angle - Math.PI/2) * (element.width/2 + 5);
                this.ctx.beginPath();
                this.ctx.moveTo(rightX, rightY);
                this.ctx.lineTo(rightX + (Math.random() - 0.5) * 8, rightY - 5 - Math.random() * 8);
                this.ctx.stroke();
            }
        }
    }
    
    /**
     * 草むら描画 - 草原テーマ
     * @private  
     */
    _renderGrassPatch(element) {
        const time = Date.now() * 0.001;
        element.windPhase += element.windSpeed * 0.01;
        
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        
        // メイン草地
        this.ctx.fillStyle = element.primaryColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, element.radius, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 草の描画
        const grassCount = Math.floor(element.radius * element.density);
        for (let i = 0; i < grassCount; i++) {
            const angle = (i / grassCount) * Math.PI * 2;
            const distance = Math.random() * element.radius;
            const grassX = Math.cos(angle) * distance;
            const grassY = Math.sin(angle) * distance;
            const grassHeight = 8 + Math.random() * 15;
            
            // 風の影響
            const windEffect = Math.sin(time * element.windSpeed + element.windPhase + angle) * 3;
            
            this.ctx.strokeStyle = element.primaryColor;
            this.ctx.lineWidth = 1 + Math.random();
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(grassX, grassY);
            this.ctx.lineTo(grassX + windEffect, grassY - grassHeight);
            this.ctx.stroke();
        }
        
        // 花やアクセント要素
        if (element.patchType === 'wildflowers') {
            const flowerCount = Math.floor(element.radius * 0.1);
            for (let i = 0; i < flowerCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * element.radius * 0.8;
                const flowerX = Math.cos(angle) * distance;
                const flowerY = Math.sin(angle) * distance;
                
                this.ctx.fillStyle = element.accentColor;
                this.ctx.beginPath();
                this.ctx.arc(flowerX, flowerY, 2 + Math.random() * 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 花びら
                for (let p = 0; p < 5; p++) {
                    const petalAngle = (p / 5) * Math.PI * 2;
                    const petalX = flowerX + Math.cos(petalAngle) * 3;
                    const petalY = flowerY + Math.sin(petalAngle) * 3;
                    
                    this.ctx.fillStyle = element.accentColor;
                    this.ctx.beginPath();
                    this.ctx.arc(petalX, petalY, 1, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
        }
        
        this.ctx.restore();
    }
    
    /**
     * 障害物描画（大岩・木の根・切り株）
     * @private
     */
    _renderObstacle(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        this.ctx.rotate(element.rotation);
        
        // 影を先に描画
        this.ctx.fillStyle = element.shadowColor;
        this.ctx.beginPath();
        this.ctx.ellipse(element.size * 0.2, element.size * 0.2, element.size * 0.9, element.size * 0.5, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = element.color;
        
        switch (element.obstacleType) {
            case 'large_rock':
                this._renderLargeRock(element);
                break;
            case 'tree_root':
                this._renderTreeRoot(element);
                break;
            case 'stump':
                this._renderStump(element);
                break;
        }
        
        this.ctx.restore();
    }
    
    /**
     * ピクセルアート岩描画
     * @private
     */
    _renderLargeRock(element) {
        const pixelSize = 3;
        
        // 岩のドット絵パターン（8x6の岩）
        const rockPattern = [
            [0, 0, 1, 1, 1, 1, 0, 0],
            [0, 1, 1, 2, 2, 1, 1, 0],
            [1, 1, 2, 2, 2, 2, 1, 1],
            [1, 2, 2, 3, 3, 2, 2, 1],
            [1, 1, 2, 2, 2, 2, 1, 1],
            [0, 1, 1, 1, 1, 1, 1, 0]
        ];
        
        // 岩カラーパレット
        const rockColors = {
            0: null,           // 透明
            1: '#757575',      // 岩の輪郭
            2: '#9E9E9E',      // 岩の基本色
            3: '#BDBDBD'       // ハイライト
        };
        
        // パターン描画
        rockPattern.forEach((row, py) => {
            row.forEach((colorIndex, px) => {
                if (colorIndex && rockColors[colorIndex]) {
                    this.ctx.fillStyle = rockColors[colorIndex];
                    this.ctx.fillRect(
                        (px - 4) * pixelSize,
                        (py - 3) * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    /**
     * 木の根描画
     * @private
     */
    _renderTreeRoot(element) {
        // メイン根部
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, element.size, element.size * 0.6, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 根の突起部分
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const length = element.size * (0.5 + Math.random() * 0.8);
            const width = element.size * 0.2;
            const startX = Math.cos(angle) * element.size * 0.5;
            const startY = Math.sin(angle) * element.size * 0.3;
            const endX = Math.cos(angle) * length;
            const endY = Math.sin(angle) * length * 0.6;
            
            this.ctx.strokeStyle = element.color;
            this.ctx.lineWidth = width;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
        }
        
        // 根の結び目
        for (let i = 0; i < 3; i++) {
            const knotX = (Math.random() - 0.5) * element.size;
            const knotY = (Math.random() - 0.5) * element.size * 0.5;
            const knotSize = element.size * 0.15;
            
            this.ctx.fillStyle = 'rgba(80, 50, 20, 0.6)'; // darker wood
            this.ctx.beginPath();
            this.ctx.arc(knotX, knotY, knotSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }
    
    /**
     * 切り株描画
     * @private
     */
    _renderStump(element) {
        // 切り株本体
        this.ctx.beginPath();
        this.ctx.ellipse(0, 0, element.size, element.size * 0.9, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 年輪表現
        for (let ring = 1; ring <= 3; ring++) {
            const ringRadius = element.size * (ring / 4);
            this.ctx.strokeStyle = 'rgba(80, 50, 20, 0.4)';
            this.ctx.lineWidth = 1;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 中央の切り跡
        this.ctx.fillStyle = 'rgba(60, 40, 20, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, element.size * 0.15, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 切り株の側面（立体感）
        this.ctx.fillStyle = 'rgba(100, 60, 30, 0.6)';
        this.ctx.fillRect(-element.size, 0, element.size * 2, element.size * 0.3);
    }
    
    /**
     * 花クラスター描画
     * @private
     */
    _renderFlowerCluster(element) {
        this.ctx.save();
        this.ctx.translate(element.x, element.y);
        
        // 花クラスターの基盤となる葉っぱ
        this.ctx.fillStyle = 'rgba(34, 139, 34, 0.6)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, element.radius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 個別の花を描画
        for (let i = 0; i < element.flowerCount; i++) {
            const angle = (i / element.flowerCount) * Math.PI * 2 + element.bloomPhase;
            const distance = Math.random() * element.radius * 0.8;
            const flowerX = Math.cos(angle) * distance;
            const flowerY = Math.sin(angle) * distance;
            
            this.ctx.save();
            this.ctx.translate(flowerX, flowerY);
            
            switch (element.flowerType) {
                case 'daisies':
                    this._renderDaisy(element);
                    break;
                case 'dandelions':
                    this._renderDandelion(element);
                    break;
                case 'violets':
                    this._renderViolet(element);
                    break;
                case 'poppies':
                    this._renderPoppy(element);
                    break;
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }
    
    /**
     * ピクセルアート花描画
     * @private
     */
    _renderDaisy(element) {
        const pixelSize = 2;
        
        // 花のドット絵パターン（5x5の花）
        const flowerPattern = [
            [0, 1, 1, 1, 0],
            [1, 1, 2, 1, 1],
            [1, 2, 2, 2, 1],
            [1, 1, 2, 1, 1],
            [0, 1, 1, 1, 0]
        ];
        
        // 花カラーパレット
        const flowerColors = {
            0: null,           // 透明
            1: '#FFFFFF',      // 花びら（白）
            2: '#FFEB3B'       // 中心（黄色）
        };
        
        // パターン描画
        flowerPattern.forEach((row, py) => {
            row.forEach((colorIndex, px) => {
                if (colorIndex && flowerColors[colorIndex]) {
                    this.ctx.fillStyle = flowerColors[colorIndex];
                    this.ctx.fillRect(
                        (px - 2) * pixelSize,
                        (py - 2) * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    /**
     * ピクセルアートタンポポ描画
     * @private
     */
    _renderDandelion(element) {
        const pixelSize = 2;
        
        // タンポポのドット絵パターン（3x3の花）
        const dandelionPattern = [
            [1, 1, 1],
            [1, 2, 1],
            [1, 1, 1]
        ];
        
        // タンポポカラーパレット
        const dandelionColors = {
            0: null,           // 透明
            1: '#FFEB3B',      // 外側（黄色）
            2: '#FF9800'       // 中心（オレンジ）
        };
        
        // パターン描画
        dandelionPattern.forEach((row, py) => {
            row.forEach((colorIndex, px) => {
                if (colorIndex && dandelionColors[colorIndex]) {
                    this.ctx.fillStyle = dandelionColors[colorIndex];
                    this.ctx.fillRect(
                        (px - 1) * pixelSize,
                        (py - 1) * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    /**
     * スミレ花描画
     * @private
     */
    _renderViolet(element) {
        // 5枚の花びら（スミレの特徴的な形）
        this.ctx.fillStyle = element.primaryColor;
        
        // 上の2枚の花びら
        for (let i = 0; i < 2; i++) {
            const angle = -Math.PI * 0.7 + i * Math.PI * 0.4;
            this.ctx.save();
            this.ctx.rotate(angle);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -2, 1.5, 2.5, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 側面の2枚の花びら
        for (let i = 0; i < 2; i++) {
            const angle = -Math.PI * 0.3 + i * Math.PI * 0.6;
            this.ctx.save();
            this.ctx.rotate(angle);
            this.ctx.beginPath();
            this.ctx.ellipse(0, -1.5, 1.2, 2, 0, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 下の大きな花びら
        this.ctx.beginPath();
        this.ctx.ellipse(0, 1, 2, 3, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 中心の模様
        this.ctx.fillStyle = element.centerColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 0.8, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * ポピー花描画
     * @private
     */
    _renderPoppy(element) {
        const petalCount = 4;
        const petalSize = 4;
        
        // 大きくて丸い花びら
        this.ctx.fillStyle = element.primaryColor;
        for (let i = 0; i < petalCount; i++) {
            const angle = (i / petalCount) * Math.PI * 2;
            const petalX = Math.cos(angle) * petalSize * 0.3;
            const petalY = Math.sin(angle) * petalSize * 0.3;
            
            this.ctx.save();
            this.ctx.translate(petalX, petalY);
            this.ctx.beginPath();
            this.ctx.arc(0, 0, petalSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
        
        // 花の中心（黒い部分）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 花粉の黄色い点
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const dotX = Math.cos(angle) * 1;
            const dotY = Math.sin(angle) * 1;
            
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.6)';
            this.ctx.beginPath();
            this.ctx.arc(dotX, dotY, 0.5, 0, Math.PI * 2);
            this.ctx.fill();
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
     * ピクセルアート蝶々描画
     * @private
     */
    _renderButterfly(particle, time) {
        const pixelSize = 2;
        
        // 蝶々のドット絵パターン（5x3の蝶々）
        const butterflyPattern = [
            [1, 0, 2, 0, 1],
            [1, 1, 2, 1, 1],
            [1, 0, 2, 0, 1]
        ];
        
        // 蝶々カラーパレット
        const butterflyColors = {
            0: null,           // 透明
            1: particle.color, // 羽色
            2: '#333333'       // 胴体（黒）
        };
        
        // パターン描画
        butterflyPattern.forEach((row, py) => {
            row.forEach((colorIndex, px) => {
                if (colorIndex && butterflyColors[colorIndex]) {
                    this.ctx.fillStyle = butterflyColors[colorIndex];
                    this.ctx.fillRect(
                        (px - 2) * pixelSize,
                        (py - 1) * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            });
        });
    }
    
    /**
     * ピクセルアート葉っぱ描画
     * @private
     */
    _renderFloatingLeaf(particle, time) {
        // シンプルな3x3葉っぱピクセル
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(-2, -2, 4, 4);
        this.ctx.fillRect(-1, -3, 2, 2);
        this.ctx.fillRect(-1, 1, 2, 2);
    }
    
    /**
     * ピクセルアート花粉描画
     * @private
     */
    _renderPollen(particle) {
        // シンプルな2x2黄色ピクセル
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(-1, -1, 2, 2);
    }
    
    /**
     * ピクセルアート種子描画 
     * @private
     */
    _renderSeed(particle, time) {
        // シンプルな1x2茶色ピクセル
        this.ctx.fillStyle = particle.color;
        this.ctx.fillRect(-1, -1, 2, 3);
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
     * 蝶々の移動パターン
     * @private
     */
    _updateButterflyMovement(particle, deltaTime) {
        const time = Date.now() * 0.001;
        
        // ランダムな飛行パターン + 緩やかな上昇傾向
        particle.vx += (Math.random() - 0.5) * 30 * deltaTime;
        particle.vy += (Math.random() - 0.7) * 20 * deltaTime; // 若干上昇傾向
        
        // 速度制限
        particle.vx = Math.max(-15, Math.min(15, particle.vx));
        particle.vy = Math.max(-10, Math.min(10, particle.vy));
        
        // 蝶々らしい波状飛行
        particle.x += particle.vx * deltaTime + Math.sin(time * 3 + particle.animationPhase) * 5 * deltaTime;
        particle.y += particle.vy * deltaTime + Math.cos(time * 2 + particle.animationPhase) * 3 * deltaTime;
    }
    
    /**
     * 葉っぱの移動パターン
     * @private
     */
    _updateLeafMovement(particle, deltaTime) {
        const time = Date.now() * 0.001;
        
        // 風による横移動 + ゆっくり落下
        particle.vx += Math.sin(time * 0.8 + particle.animationPhase) * 10 * deltaTime;
        particle.vy = Math.abs(particle.vy) + 5; // 重力効果
        
        // 回転しながら落下
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // 速度減衰
        particle.vx *= 0.98;
    }
    
    /**
     * 花粉の移動パターン
     * @private
     */
    _updatePollenMovement(particle, deltaTime) {
        const time = Date.now() * 0.001;
        
        // 軽やかに舞い上がる
        particle.vy -= 20 * deltaTime; // 上昇力
        particle.vx += Math.sin(time * 1.5 + particle.animationPhase) * 15 * deltaTime;
        
        // ブラウン運動風
        particle.vx += (Math.random() - 0.5) * 25 * deltaTime;
        particle.vy += (Math.random() - 0.5) * 25 * deltaTime;
        
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // 速度減衰
        particle.vx *= 0.95;
        particle.vy *= 0.95;
    }
    
    /**
     * 種子の移動パターン
     * @private
     */
    _updateSeedMovement(particle, deltaTime) {
        const time = Date.now() * 0.001;
        
        // タンポポの綿毛のような動き
        particle.vy -= 8 * deltaTime; // 軽い上昇
        particle.vx += Math.sin(time * 0.7 + particle.animationPhase) * 12 * deltaTime;
        
        // 回転しながら浮遊
        particle.x += particle.vx * deltaTime;
        particle.y += particle.vy * deltaTime;
        
        // 緩やかな減衰
        particle.vx *= 0.99;
        particle.vy *= 0.99;
    }
    
    /**
     * パーティクルのリスポーン処理
     * @private
     */
    _respawnParticle(particle) {
        // 新しい位置に再配置
        particle.x = this.game.camera.x + Math.random() * this.baseWidth;
        particle.y = this.game.camera.y + Math.random() * this.baseHeight;
        
        // タイプ別初期速度設定
        switch (particle.particleType) {
            case 'butterfly':
                particle.vx = (Math.random() - 0.5) * 10;
                particle.vy = (Math.random() - 0.5) * 8;
                break;
            case 'leaf':
                particle.vx = (Math.random() - 0.5) * 6;
                particle.vy = Math.random() * 3;
                break;
            case 'pollen':
                particle.vx = (Math.random() - 0.5) * 4;
                particle.vy = -Math.random() * 5;
                break;
            case 'seed':
                particle.vx = (Math.random() - 0.5) * 5;
                particle.vy = -Math.random() * 3;
                break;
            default:
                particle.vx = (Math.random() - 0.5) * 8;
                particle.vy = (Math.random() - 0.5) * 8;
        }
        
        particle.life = particle.maxLife;
        particle.animationPhase = Math.random() * Math.PI * 2;
    }
    
    /**
     * 弾丸描画メイン処理
     */
    renderBullets() {
        this.game.bulletSystem.getBullets().forEach(bullet => {
            this.ctx.save();
            this.ctx.translate(bullet.x, bullet.y);
            
            if (bullet.enemyBullet) {
                this._renderEnemyBullet();
            } else if (bullet.nuke) {
                this._renderNukeBullet(bullet);
            } else if (bullet.superHoming) {
                this._renderSuperHomingBullet(bullet);
            } else if (bullet.laser) {
                this._renderLaserBullet();
            } else if (bullet.weaponType === 'sniper') {
                this._renderSniperBullet();
            } else if (bullet.weaponType === 'superShotgun') {
                this._renderSuperShotgunBullet(bullet);
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
    _renderNukeBullet(bullet) {
        // ニューク弾 - 巨大な火の玉（コンボ色対応）
        const size = bullet?.size || 6;
        
        // コンボ色情報取得（デフォルト値付き）
        const comboColor = bullet?.comboColor || '#ff6600';
        const glowIntensity = bullet?.comboGlowIntensity || 0;
        const hasSpecialEffect = bullet?.comboHasSpecialEffect || false;
        const isRainbow = bullet?.comboIsRainbow || false;
        
        // レインボー効果の場合、動的に色を更新
        let currentColor = comboColor;
        if (isRainbow && bullet?.comboRainbowHue !== undefined) {
            currentColor = this._hsvToHex(bullet.comboRainbowHue, 100, 100);
        }
        
        // グロー効果
        const baseGlow = 15;
        const comboGlow = Math.floor(baseGlow + (glowIntensity * 20)); // 最大35まで
        this.ctx.shadowColor = currentColor;
        this.ctx.shadowBlur = comboGlow;
        
        // メイン弾丸色
        this.ctx.fillStyle = currentColor;
        this.ctx.strokeStyle = this._adjustColorBrightness(currentColor, -0.3);
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の輝き
        this.ctx.fillStyle = this._adjustColorBrightness(currentColor, 0.4);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 特殊エフェクト（9コンボ以上）
        if (hasSpecialEffect) {
            this._renderBulletSpecialEffect(currentColor, size * 2, isRainbow);
        }
        
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
        // 通常弾（プラズマ弾）- コンボ色対応
        const size = bullet.size || 4;
        
        // コンボ色情報取得（デフォルト値付き）
        const comboColor = bullet.comboColor || '#00ccff';
        const glowIntensity = bullet.comboGlowIntensity || 0;
        const hasSpecialEffect = bullet.comboHasSpecialEffect || false;
        const isRainbow = bullet.comboIsRainbow || false;
        
        // デバッグログ（初回のみ）
        if (!this._debugLogged && comboColor !== '#00ccff') {
            console.log('[RenderSystem] 弾丸色情報:', {
                comboColor,
                glowIntensity,
                hasSpecialEffect,
                isRainbow,
                bulletProperties: Object.keys(bullet).filter(key => key.includes('combo'))
            });
            this._debugLogged = true;
        }
        
        // レインボー効果の場合、動的に色を更新
        let currentColor = comboColor;
        if (isRainbow && bullet.comboRainbowHue !== undefined) {
            currentColor = this._hsvToHex(bullet.comboRainbowHue, 100, 100);
        }
        
        // グロー効果
        const baseGlow = 6;
        const comboGlow = Math.floor(baseGlow + (glowIntensity * 15)); // 最大21まで
        this.ctx.shadowColor = currentColor;
        this.ctx.shadowBlur = comboGlow;
        
        // メイン弾丸色
        this.ctx.fillStyle = currentColor;
        this.ctx.strokeStyle = this._adjustColorBrightness(currentColor, -0.3);
        this.ctx.lineWidth = 1;
        
        // プラズマ球
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の輝き
        this.ctx.fillStyle = this._adjustColorBrightness(currentColor, 0.4);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 特殊エフェクト（9コンボ以上）
        if (hasSpecialEffect) {
            this._renderBulletSpecialEffect(currentColor, size, isRainbow);
        }
        
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * スーパーホーミング弾描画（超派手エフェクト付き）
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _renderSuperHomingBullet(bullet) {
        // スーパーホーミング弾（コンボ色対応）
        const size = bullet.size || 5;
        
        // コンボ色情報取得（デフォルト値付き）
        const comboColor = bullet.comboColor || '#00ffff';
        const glowIntensity = bullet.comboGlowIntensity || 0;
        const hasSpecialEffect = bullet.comboHasSpecialEffect || false;
        const isRainbow = bullet.comboIsRainbow || false;
        
        // レインボー効果の場合、動的に色を更新
        let currentColor = comboColor;
        if (isRainbow && bullet.comboRainbowHue !== undefined) {
            currentColor = this._hsvToHex(bullet.comboRainbowHue, 100, 100);
        }
        
        // グロー効果
        const baseGlow = 10;
        const comboGlow = Math.floor(baseGlow + (glowIntensity * 20)); // 最大30まで
        this.ctx.shadowColor = currentColor;
        this.ctx.shadowBlur = comboGlow;
        
        // 弾丸本体
        this.ctx.fillStyle = currentColor;
        this.ctx.strokeStyle = this._adjustColorBrightness(currentColor, -0.3);
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の輝き
        this.ctx.fillStyle = this._adjustColorBrightness(currentColor, 0.4);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 特殊エフェクト（9コンボ以上）
        if (hasSpecialEffect) {
            this._renderBulletSpecialEffect(currentColor, size * 1.5, isRainbow);
        }
        
        this.ctx.shadowBlur = 0;
        
        // ターゲット線描画を削除（黄色の線を非表示）
        // if (renderData.isTracking && renderData.targetEnemy) {
        //     this._renderTargetLine(bullet, renderData.targetEnemy);
        // }
        
    }
    
    /**
     * スーパーホーミング弾のトレイル軌跡描画
     * @param {Object} renderData - 描画データ
     * @private
     */
    _renderSuperHomingTrail(renderData) {
        if (!renderData.trail || renderData.trail.length < 2) return;
        
        // トレイル線の描画
        this.ctx.strokeStyle = renderData.color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        
        for (let i = 1; i < renderData.trail.length; i++) {
            const prev = renderData.trail[i - 1];
            const curr = renderData.trail[i];
            
            // 透明度を軌跡の古さに応じて設定
            this.ctx.globalAlpha = curr.alpha * 0.8;
            this.ctx.lineWidth = 3 * curr.alpha;
            
            this.ctx.beginPath();
            this.ctx.moveTo(prev.x - renderData.x, prev.y - renderData.y);
            this.ctx.lineTo(curr.x - renderData.x, curr.y - renderData.y);
            this.ctx.stroke();
        }
        
        // トレイル粒子エフェクト
        renderData.trail.forEach((point, index) => {
            if (index % 2 === 0) { // 2個に1個描画
                this.ctx.globalAlpha = point.alpha * 0.6;
                this.ctx.fillStyle = '#aaffff';
                this.ctx.beginPath();
                this.ctx.arc(point.x - renderData.x, point.y - renderData.y, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * ターゲット線描画
     * @param {Object} bullet - 弾丸オブジェクト
     * @param {Object} target - 追尾対象
     * @private
     */
    _renderTargetLine(bullet, target) {
        const dx = target.x - bullet.x;
        const dy = target.y - bullet.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 0) {
            // 細い追尾線
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1;
            this.ctx.globalAlpha = 0.5;
            this.ctx.setLineDash([5, 5]); // 点線
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(dx, dy);
            this.ctx.stroke();
            
            this.ctx.setLineDash([]); // 点線リセット
            this.ctx.globalAlpha = 1.0;
        }
    }
    
    /**
     * スーパーショットガン弾丸描画（小さな火花付き散弾）
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _renderSuperShotgunBullet(bullet) {
        const time = Date.now() * 0.001;
        
        // コンボ色情報取得（デフォルト値付き）
        const comboColor = bullet.comboColor || '#ff8800';
        const glowIntensity = bullet.comboGlowIntensity || 0;
        const hasSpecialEffect = bullet.comboHasSpecialEffect || false;
        const isRainbow = bullet.comboIsRainbow || false;
        
        // レインボー効果の場合、動的に色を更新
        let currentColor = comboColor;
        if (isRainbow && bullet.comboRainbowHue !== undefined) {
            currentColor = this._hsvToHex(bullet.comboRainbowHue, 100, 100);
        }
        
        // 火花エフェクト（軽量版）
        if (Math.random() < 0.3 || hasSpecialEffect) {
            this._drawBulletSparks(time, currentColor);
        }
        
        // メイン弾丸（小さめ）
        const size = bullet.size || 3;
        
        // グロー効果
        const baseGlow = 8;
        const comboGlow = Math.floor(baseGlow + (glowIntensity * 15)); // 最大23まで
        this.ctx.shadowColor = currentColor;
        this.ctx.shadowBlur = comboGlow;
        
        // 弾丸コア
        this.ctx.fillStyle = currentColor;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 内側ハイライト
        this.ctx.fillStyle = this._adjustColorBrightness(currentColor, 0.2);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 中心ホワイトコア
        this.ctx.fillStyle = this._adjustColorBrightness(currentColor, 0.6);
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 特殊エフェクト（9コンボ以上）
        if (hasSpecialEffect) {
            this._renderBulletSpecialEffect(currentColor, size * 1.2, isRainbow);
        }
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 弾丸用火花エフェクト（軽量版）
     * @private
     */
    _drawBulletSparks(time, color = '#ffff88') {
        const sparkCount = 3; // 軽量化
        
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 5;
            const sparkX = Math.cos(angle) * distance;
            const sparkY = Math.sin(angle) * distance;
            
            // 小さな火花線（コンボ色対応）
            this.ctx.strokeStyle = this._adjustColorBrightness(color, 0.3);
            this.ctx.lineWidth = 0.5;
            this.ctx.globalAlpha = 0.7;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(sparkX, sparkY);
            this.ctx.lineTo(
                sparkX + Math.cos(angle + Math.PI) * 2,
                sparkY + Math.sin(angle + Math.PI) * 2
            );
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1;
    }

    /**
     * スーパーホーミング弾のコア描画
     * @param {Object} renderData - 描画データ
     * @private
     */
    _renderSuperHomingCore(renderData) {
        // 回転エフェクト適用
        this.ctx.rotate(renderData.rotation);
        
        // パルス光エフェクト
        this.ctx.shadowColor = renderData.color;
        this.ctx.shadowBlur = 15 * renderData.glowIntensity;
        
        // パルススケール適用
        this.ctx.scale(renderData.pulseScale, renderData.pulseScale);
        
        // 外側の光る輪
        this.ctx.fillStyle = '#44ffff';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, renderData.size + 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // メインコア
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = renderData.color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, renderData.size, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の明るいコア
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, renderData.size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 回転リング
        this.ctx.strokeStyle = '#aaffff';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, renderData.size + 1, 0, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.globalAlpha = 1.0;
        this.ctx.shadowBlur = 0;
    }
    
    /**
     * 電撃エフェクト描画
     * @param {Object} renderData - 描画データ
     * @private
     */
    _renderElectricEffects(renderData) {
        // 電撃エフェクト（4方向）
        this.ctx.strokeStyle = '#ffff88';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.7 * renderData.glowIntensity;
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2 + renderData.rotation * 0.5;
            const length = (renderData.size + 3) * (0.8 + 0.4 * Math.sin(renderData.rotation * 3 + i));
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(
                Math.cos(angle) * length,
                Math.sin(angle) * length
            );
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    
    /**
     * 軽量版マルチショット弾のトレイル更新
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _updateSimpleMultiShotTrail(bullet) {
        if (!bullet.trail) bullet.trail = [];
        
        // シンプルなトレイル
        bullet.trail.push({ x: bullet.x, y: bullet.y, alpha: 1.0 });
        
        // 長さ制限
        if (bullet.trail.length > 5) {
            bullet.trail.shift();
        }
        
        // 透明度減衰
        bullet.trail.forEach((point, index) => {
            point.alpha = (index + 1) / bullet.trail.length * 0.6;
        });
    }
    
    
    /**
     * マルチショット弾のトレイル描画
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _renderMultiShotTrail(bullet) {
        if (!bullet.trail || bullet.trail.length < 2) return;
        
        this.ctx.strokeStyle = bullet.color;
        this.ctx.lineWidth = 4;
        this.ctx.lineCap = 'round';
        
        for (let i = 1; i < bullet.trail.length; i++) {
            const prev = bullet.trail[i - 1];
            const curr = bullet.trail[i];
            
            this.ctx.globalAlpha = curr.alpha * 0.6;
            this.ctx.lineWidth = 4 * curr.alpha;
            
            this.ctx.beginPath();
            this.ctx.moveTo(prev.x, prev.y);
            this.ctx.lineTo(curr.x, curr.y);
            this.ctx.stroke();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * マルチショット弾のコア描画
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _renderMultiShotCore(bullet) {
        const time = Date.now() * 0.001;
        const pulseScale = 1.0 + 0.2 * Math.sin(time * 10); // 高速パルス
        
        // 発光エフェクト
        this.ctx.shadowColor = bullet.color;
        this.ctx.shadowBlur = 15 * pulseScale;
        
        // ダイヤモンド形弾丸
        const size = bullet.size * pulseScale;
        
        // グラデーション
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, size);
        gradient.addColorStop(0, '#ffffff');
        gradient.addColorStop(0.5, bullet.color);
        gradient.addColorStop(1, 'rgba(255, 0, 255, 0)');
        
        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        // ダイヤモンド描画
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);     // 上
        this.ctx.lineTo(size * 0.7, 0);      // 右
        this.ctx.lineTo(0, size);      // 下
        this.ctx.lineTo(-size * 0.7, 0);     // 左
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 中央コア
        this.ctx.fillStyle = '#ffffff';
        this.ctx.globalAlpha = 0.8;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * マルチショット弾のスパークエフェクト
     * @param {Object} bullet - 弾丸オブジェクト
     * @private
     */
    _renderMultiShotSparks(bullet) {
        const sparkCount = 3;
        
        this.ctx.fillStyle = bullet.color;
        this.ctx.globalAlpha = 0.7;
        
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 8 + Math.random() * 12;
            const sparkX = Math.cos(angle) * distance;
            const sparkY = Math.sin(angle) * distance;
            const sparkSize = 1 + Math.random() * 2;
            
            this.ctx.beginPath();
            this.ctx.arc(sparkX, sparkY, sparkSize, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        this.ctx.globalAlpha = 1.0;
    }
    
    /**
     * 敵描画メイン処理（Enemyクラス対応）
     */
    renderEnemies() {
        this.game.enemies.forEach(enemy => {
            // Enemyクラスの場合は描画データを取得
            const renderData = enemy.getRenderData ? enemy.getRenderData() : enemy;
            
            this.ctx.save();
            this.ctx.translate(renderData.x, renderData.y);
            
            // 敵タイプ別の描画
            if (renderData.type === 'boss') {
                this._renderBossEnemy(renderData);
            } else {
                this._renderNormalEnemy(renderData);
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * ボス敵描画
     * @private
     */
    _renderBossEnemy(renderData) {
        const enemy = renderData; // レガシー互換性
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
     * 通常敵描画（Enemyクラス対応）
     * @private
     */
    _renderNormalEnemy(renderData) {
        const enemy = renderData; // レガシー互換性
        if (renderData.type === 'fast') {
            this._renderFastEnemy();
        } else if (renderData.type === 'tank') {
            this._renderTankEnemy();
        } else if (renderData.type === 'shooter') {
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
        const player = this.game.player;
        const characterType = player.characterType || 'ray';
        
        // キャラクター別描画分岐
        switch (characterType) {
            case 'luna':
                this.renderCharacterLuna(player);
                break;
            case 'aurum':
                this.renderCharacterAurum(player);
                break;
            case 'ray':
            default:
                this.renderCharacterRay(player);
                break;
        }
    }
    
    /**
     * レイキャラクター描画（既存デザイン）
     * @param {Object} player - プレイヤーオブジェクト
     */
    renderCharacterRay(player) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);
        this.ctx.rotate(player.angle);
        
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
        this.ctx.fillStyle = '#ff6600';
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
     * ルナキャラクター描画（可愛い丸型＋ハート）
     * @param {Object} player - プレイヤーオブジェクト
     */
    renderCharacterLuna(player) {
        this.ctx.save();
        
        // 浮遊オフセット適用
        const floatOffset = player._floatOffset || 0;
        this.ctx.translate(player.x, player.y + floatOffset);
        
        // 本体（円形）
        const radius = player.width / 2;
        
        // グラデーション背景
        const gradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, '#FFF0F5'); // 中心部薄いピンク
        gradient.addColorStop(1, '#FFB6C1'); // 外側淡いピンク
        
        this.ctx.fillStyle = gradient;
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 衛星ハート（軌道型）
        this._renderLunaSatelliteHearts(player);
        
        // キラキラエフェクト（周囲）
        this._renderLunaSparkles(player);
        
        // オートターゲット線（デバッグ用）- ルナ用に削除
        // if (player.autoTarget) {
        //     this._renderAutoTargetLine(player);
        // }
        
        this.ctx.restore();
    }
    
    /**
     * オーラムキャラクター描画（六角形＋オーラ）
     * @param {Object} player - プレイヤーオブジェクト
     */
    renderCharacterAurum(player) {
        this.ctx.save();
        this.ctx.translate(player.x, player.y);
        
        // レインボーモード判定
        const isRainbowMode = player._isRainbowMode || false;
        const rainbowHue = player._rainbowHue || 0;
        const auraIntensity = player._auraIntensity || 1;
        
        // 外側オーラ描画
        this._renderAurumAura(player, isRainbowMode, rainbowHue, auraIntensity);
        
        // 本体（六角形）
        const size = player.width / 2;
        
        this.ctx.save();
        this.ctx.rotate(player.angle);
        
        // 六角形の色決定
        let bodyColor = '#FFD700'; // 基本金色
        if (isRainbowMode) {
            bodyColor = `hsl(${rainbowHue}, 100%, 60%)`;
        }
        
        // メタリック効果（複数レイヤー）
        this._renderHexagonWithMetallic(size, bodyColor, isRainbowMode);
        
        this.ctx.restore();
        
        // 回転パーティクル軌道
        this._renderAurumParticleOrbit(player, isRainbowMode, rainbowHue);
        
        this.ctx.restore();
    }
    
    /**
     * ハート形状描画ヘルパー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} size - サイズ
     * @param {string} color - 色
     * @private
     */
    _drawHeart(x, y, size, color) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.scale(size / 10, size / 10);
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(0, 3);
        this.ctx.bezierCurveTo(-5, -2, -10, 1, 0, 10);
        this.ctx.bezierCurveTo(10, 1, 5, -2, 0, 3);
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    /**
     * ルナ衛星ハート描画
     * @param {Object} player - プレイヤーオブジェクト
     * @private
     */
    _renderLunaSatelliteHearts(player) {
        const time = Date.now() * 0.001; // 秒単位
        
        // 3つの衛星ハート設定
        const satellites = [
            { angle: time * 2, distance: 18, size: 1.5, color: '#FF1493' },
            { angle: -time * 2.5 + Math.PI * 2/3, distance: 15, size: 1.2, color: '#FF69B4' },
            { angle: time * 1.8 + Math.PI * 4/3, distance: 20, size: 1.3, color: '#FF1493' }
        ];
        
        satellites.forEach(satellite => {
            const x = Math.cos(satellite.angle) * satellite.distance;
            const y = Math.sin(satellite.angle) * satellite.distance;
            
            this.ctx.save();
            this.ctx.translate(x, y);
            
            // ハート形状描画
            this._drawHeart(0, 0, satellite.size, satellite.color);
            
            this.ctx.restore();
        });
    }
    
    /**
     * ルナキラキラエフェクト
     * @param {Object} player - プレイヤーオブジェクト
     * @private
     */
    _renderLunaSparkles(player) {
        const sparkleTime = (Date.now() * 0.003) % (Math.PI * 2);
        const sparklePositions = [
            { angle: 0, distance: 12 },
            { angle: Math.PI * 0.5, distance: 15 },
            { angle: Math.PI, distance: 12 },
            { angle: Math.PI * 1.5, distance: 15 }
        ];
        
        sparklePositions.forEach((sparkle, i) => {
            const phase = sparkleTime + (i * Math.PI * 0.5);
            const alpha = (Math.sin(phase) + 1) * 0.5;
            
            if (alpha > 0.3) {
                const x = Math.cos(sparkle.angle) * sparkle.distance;
                const y = Math.sin(sparkle.angle) * sparkle.distance;
                
                this.ctx.save();
                this.ctx.globalAlpha = alpha;
                this.ctx.fillStyle = i % 2 === 0 ? '#FFD700' : '#FF69B4';
                
                this.ctx.beginPath();
                this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.restore();
            }
        });
    }
    
    /**
     * オートターゲット線描画
     * @param {Object} player - プレイヤーオブジェクト
     * @private
     */
    _renderAutoTargetLine(player) {
        const target = player.autoTarget;
        if (!target) return;
        
        this.ctx.save();
        this.ctx.strokeStyle = '#FF69B4';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.5;
        this.ctx.setLineDash([3, 3]);
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.lineTo(target.x - player.x, target.y - player.y);
        this.ctx.stroke();
        
        this.ctx.restore();
    }
    
    /**
     * オーラムオーラ描画
     * @param {Object} player - プレイヤーオブジェクト
     * @param {boolean} isRainbowMode - レインボーモード
     * @param {number} rainbowHue - レインボー色相
     * @param {number} intensity - 強度
     * @private
     */
    _renderAurumAura(player, isRainbowMode, rainbowHue, intensity) {
        const auraRotation = player._auraRotation || 0;
        const auraPulse = player._auraPulse || 0;
        
        // 外側オーラ
        this.ctx.save();
        this.ctx.rotate(auraRotation);
        
        const outerRadius = 35 * intensity;
        const outerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, outerRadius);
        
        if (isRainbowMode) {
            outerGradient.addColorStop(0, `hsla(${rainbowHue}, 100%, 60%, 0.3)`);
            outerGradient.addColorStop(1, `hsla(${rainbowHue}, 100%, 40%, 0)`);
        } else {
            outerGradient.addColorStop(0, 'rgba(255, 165, 0, 0.3)');
            outerGradient.addColorStop(1, 'rgba(255, 165, 0, 0)');
        }
        
        this.ctx.fillStyle = outerGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, outerRadius, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
        
        // 内側オーラ（パルス）
        const innerRadius = (25 + Math.sin(auraPulse) * 5) * intensity;
        const innerGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, innerRadius);
        
        if (isRainbowMode) {
            innerGradient.addColorStop(0, `hsla(${(rainbowHue + 60) % 360}, 100%, 70%, 0.6)`);
            innerGradient.addColorStop(1, `hsla(${(rainbowHue + 60) % 360}, 100%, 50%, 0)`);
        } else {
            innerGradient.addColorStop(0, 'rgba(255, 255, 0, 0.6)');
            innerGradient.addColorStop(1, 'rgba(255, 255, 0, 0)');
        }
        
        this.ctx.fillStyle = innerGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, innerRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    /**
     * メタリック六角形描画
     * @param {number} size - サイズ
     * @param {string} color - 基本色
     * @param {boolean} isRainbow - レインボーモード
     * @private
     */
    _renderHexagonWithMetallic(size, color, isRainbow) {
        // 六角形パス生成
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            const x = Math.cos(angle) * size;
            const y = Math.sin(angle) * size;
            
            if (i === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        }
        this.ctx.closePath();
        
        // メイン色塗り
        this.ctx.fillStyle = color;
        this.ctx.fill();
        
        // メタリック効果（面ごとの明暗）
        this.ctx.save();
        this.ctx.clip(); // 六角形内に制限
        
        for (let i = 0; i < 6; i++) {
            const angle1 = (i * Math.PI) / 3;
            const angle2 = ((i + 1) * Math.PI) / 3;
            
            const brightness = 0.7 + 0.3 * Math.sin(angle1 + Date.now() * 0.001);
            const faceColor = isRainbow ? 
                `hsla(${(i * 60) % 360}, 100%, ${brightness * 60}%, 0.8)` :
                `rgba(255, 215, 0, ${brightness * 0.5})`;
            
            this.ctx.fillStyle = faceColor;
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(Math.cos(angle1) * size, Math.sin(angle1) * size);
            this.ctx.lineTo(Math.cos(angle2) * size, Math.sin(angle2) * size);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // 境界線
        this.ctx.strokeStyle = isRainbow ? '#ffffff' : '#FFA500';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();
    }
    
    /**
     * オーラムパーティクル軌道描画
     * @param {Object} player - プレイヤーオブジェクト
     * @param {boolean} isRainbowMode - レインボーモード
     * @param {number} rainbowHue - レインボー色相
     * @private
     */
    _renderAurumParticleOrbit(player, isRainbowMode, rainbowHue) {
        const auraRotation = player._auraRotation || 0;
        const particleCount = 8;
        const orbitRadius = 25;
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (i / particleCount) * Math.PI * 2 + auraRotation;
            const x = Math.cos(angle) * orbitRadius;
            const y = Math.sin(angle) * orbitRadius;
            
            const particleColor = isRainbowMode ?
                `hsl(${(rainbowHue + i * 45) % 360}, 100%, 70%)` :
                '#FFD700';
            
            this.ctx.save();
            this.ctx.globalAlpha = 0.8;
            this.ctx.fillStyle = particleColor;
            
            this.ctx.beginPath();
            this.ctx.arc(x, y, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.restore();
        }
    }
    
    
    
    
    
    /**
     * アイテム描画メイン処理
     */
    renderPickups() {
        this.game.pickupSystem.getPickups().forEach(pickup => {
            // Pickupクラスから描画データを取得
            const renderData = pickup.getRenderData ? pickup.getRenderData() : pickup;
            
            this.ctx.save();
            this.ctx.translate(renderData.x, renderData.y);
            
            // 透明度とスケールを適用
            if (renderData.alpha !== undefined) {
                this.ctx.globalAlpha = renderData.alpha;
            }
            if (renderData.pulseScale !== undefined) {
                this.ctx.scale(renderData.pulseScale, renderData.pulseScale);
            }
            
            switch (renderData.type) {
                case 'health':
                    this._renderHealthPickup(renderData);
                    break;
                case 'speed':
                    this._renderSpeedPickup(renderData);
                    break;
                case 'nuke':
                    this._renderNukePickup(renderData); // ニューク専用の派手な描画
                    break;
                case 'superHoming':
                    this._renderSuperHomingPickup(renderData); // スーパーホーミングガン専用の派手な描画
                    break;
                case 'superMultiShot':
                    this._renderSuperMultiShotPickup(renderData); // スーパーマルチショット専用の派手な描画
                    break;
                case 'superShotgun':
                    this._renderSuperShotgunPickup(renderData); // スーパーショットガン専用の派手な描画
                    break;
                case 'dash':
                    this._renderDashPickup(renderData);
                    break;
                case 'ammo':
                    this._renderAmmoPickup(renderData);
                    break;
                case 'range':
                    this._renderRangePickup(renderData);
                    break;
                default:
                    this._renderGenericPickup(renderData);
                    break;
            }
            
            this.ctx.restore();
        });
    }
    
    /**
     * 体力アイテム描画
     * @private
     */
    _renderHealthPickup(renderData = {}) {
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
    _renderSpeedPickup(renderData = {}) {
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
    _renderDashPickup(renderData = {}) {
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
    _renderAmmoPickup(renderData = {}) {
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
     * 射程アイテム描画（十字準星デザイン）
     * @private
     */
    _renderRangePickup(renderData = {}) {
        const time = Date.now() * 0.001;
        
        // パルスエフェクト
        const pulseScale = 1.0 + Math.sin(time * 4) * 0.1;
        this.ctx.scale(pulseScale, pulseScale);
        
        // グローエフェクト
        this.ctx.shadowColor = '#4fc3f7';
        this.ctx.shadowBlur = 12 + Math.sin(time * 6) * 4;
        
        // 外側リング（ターゲットスコープ）
        this.ctx.strokeStyle = '#4fc3f7';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 12, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 中間リング
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.7;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.stroke();
        this.ctx.globalAlpha = 1.0;
        
        // 十字準星（メイン）
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        
        // 横線（中央に隙間）
        this.ctx.beginPath();
        this.ctx.moveTo(-10, 0);
        this.ctx.lineTo(-3, 0);
        this.ctx.moveTo(3, 0);
        this.ctx.lineTo(10, 0);
        this.ctx.stroke();
        
        // 縦線（中央に隙間）
        this.ctx.beginPath();
        this.ctx.moveTo(0, -10);
        this.ctx.lineTo(0, -3);
        this.ctx.moveTo(0, 3);
        this.ctx.lineTo(0, 10);
        this.ctx.stroke();
        
        // 中央ドット（精密照準点）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 8;
        this.ctx.shadowColor = '#4fc3f7';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 4隅の照準マーク
        this.ctx.strokeStyle = '#4fc3f7';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        
        const corners = [
            { x: -6, y: -6, angles: [0, Math.PI/2] },      // 左上
            { x: 6, y: -6, angles: [Math.PI/2, Math.PI] }, // 右上
            { x: 6, y: 6, angles: [Math.PI, 3*Math.PI/2] }, // 右下
            { x: -6, y: 6, angles: [3*Math.PI/2, 2*Math.PI] } // 左下
        ];
        
        corners.forEach(corner => {
            this.ctx.beginPath();
            this.ctx.arc(corner.x, corner.y, 3, corner.angles[0], corner.angles[1]);
            this.ctx.stroke();
        });
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1.0;
        this.ctx.lineCap = 'butt';
    }
    
    /**
     * ニュークアイテム描画（派手なエフェクト付き）
     * @private
     */
    _renderNukePickup(renderData = {}) {
        const time = Date.now() * 0.001;
        
        // 回転エフェクト
        const rotation = time * 2; // 2 rad/sec で回転
        this.ctx.rotate(rotation);
        
        // 光るエフェクト（強力なグロー）
        this.ctx.shadowColor = '#ff8800';
        this.ctx.shadowBlur = 25 + Math.sin(time * 6) * 8; // パルス光
        
        // 外側の光る輪
        this.ctx.fillStyle = '#ffaa00';
        this.ctx.globalAlpha = 0.6 + Math.sin(time * 4) * 0.3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 15 + Math.sin(time * 5) * 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // リセット
        this.ctx.globalAlpha = 1;
        this.ctx.shadowBlur = 15;
        
        // メイン形状（放射性マーク風の三角形）
        this.ctx.fillStyle = '#ff8800';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -12);
        this.ctx.lineTo(10, 8);
        this.ctx.lineTo(-10, 8);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の危険マーク（2つの小三角形）
        this.ctx.fillStyle = '#ffffff';
        this.ctx.shadowBlur = 5;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -8);
        this.ctx.lineTo(5, 2);
        this.ctx.lineTo(-5, 2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 中央の核マーク
        this.ctx.fillStyle = '#ff4400';
        this.ctx.beginPath();
        this.ctx.arc(0, -2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 放射線エフェクト（回転する線）
        this.ctx.strokeStyle = '#ffff00';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8 + Math.sin(time * 8) * 0.2;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x1 = Math.cos(angle) * 8;
            const y1 = Math.sin(angle) * 8;
            const x2 = Math.cos(angle) * 12;
            const y2 = Math.sin(angle) * 12;
            
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
        }
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * スーパーホーミングガンアイテム描画（超派手なエフェクト付き）
     * @private
     */
    _renderSuperHomingPickup(renderData = {}) {
        const time = Date.now() * 0.001;
        
        // 二重回転エフェクト
        const fastRotation = time * 4;     // 外側高速回転
        const slowRotation = -time * 1.5;  // 内側逆回転
        
        // レインボーグロー
        const hue = (time * 100) % 360;    // 色相回転
        this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        this.ctx.shadowBlur = 30 + Math.sin(time * 8) * 10; // 強力パルス光
        
        // 外側ターゲットリング（高速回転）
        this.ctx.save();
        this.ctx.rotate(fastRotation);
        this.ctx.strokeStyle = `hsl(${hue}, 100%, 70%)`;
        this.ctx.lineWidth = 4;
        this.ctx.globalAlpha = 0.8;
        
        // 3重ターゲットリング
        for (let i = 0; i < 3; i++) {
            const radius = 18 + i * 8;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // クロスヘア
            this.ctx.beginPath();
            this.ctx.moveTo(-radius, 0);
            this.ctx.lineTo(radius, 0);
            this.ctx.moveTo(0, -radius);
            this.ctx.lineTo(0, radius);
            this.ctx.stroke();
        }
        this.ctx.restore();
        
        // 中間層電子軌道エフェクト（逆回転）
        this.ctx.save();
        this.ctx.rotate(slowRotation);
        this.ctx.strokeStyle = `hsl(${(hue + 120) % 360}, 100%, 80%)`;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.9;
        
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const x1 = Math.cos(angle) * 12;
            const y1 = Math.sin(angle) * 12;
            const x2 = Math.cos(angle) * 20;
            const y2 = Math.sin(angle) * 20;
            
            // 電子軌道線
            this.ctx.beginPath();
            this.ctx.moveTo(x1, y1);
            this.ctx.lineTo(x2, y2);
            this.ctx.stroke();
            
            // 電子ドット
            this.ctx.fillStyle = `hsl(${(hue + 240) % 360}, 100%, 90%)`;
            this.ctx.beginPath();
            this.ctx.arc(x2, y2, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.restore();
        
        // 中央のホーミングオーブ
        this.ctx.shadowBlur = 20;
        this.ctx.shadowColor = `hsl(${hue}, 100%, 60%)`;
        
        // オーブベース
        this.ctx.fillStyle = `hsl(${hue}, 100%, 30%)`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 10, 0, Math.PI * 2);
        this.ctx.fill();
        
        // オーブ中心
        this.ctx.fillStyle = `hsl(${hue}, 100%, 90%)`;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();
        
        // オーブコア
        this.ctx.fillStyle = '#ffffff';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 追尾レーザーエフェクト（8方向）
        this.ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`;
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.6 + Math.sin(time * 12) * 0.4;
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2 + time * 3;
            const length = 15 + Math.sin(time * 6 + i) * 5;
            
            this.ctx.beginPath();
            this.ctx.moveTo(0, 0);
            this.ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length);
            this.ctx.stroke();
        }
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * スーパーマルチショットアイテム描画（超派手なエフェクト付き）
     * @private
     */
    _renderSuperMultiShotPickup(renderData = {}) {
        const time = Date.now() * 0.001;
        
        // Y軸3D回転効果
        const rotationY = time * 2;
        const perspective = Math.cos(rotationY) * 0.8 + 0.2; // 0.2-1.0の範囲
        
        // 呼吸アニメーション（弾頭の開閉）
        const breathScale = 1.0 + Math.sin(time * 3) * 0.3;
        
        // マゼンタグラデーション発光
        const pulseIntensity = 0.7 + 0.3 * Math.sin(time * 6);
        this.ctx.shadowColor = '#ff00ff';
        this.ctx.shadowBlur = 25 * pulseIntensity;
        
        // 9つの弾頭を扇状に配置
        const bulletCount = 9;
        const maxSpread = 25; // 最大拡散距離
        
        for (let i = 0; i < bulletCount; i++) {
            const angle = ((i - 4) / 4) * 30 * Math.PI / 180; // -30度から+30度
            const spread = maxSpread * breathScale;
            
            // 3D効果を適用した位置計算
            const bulletX = Math.cos(angle) * spread * perspective;
            const bulletY = Math.sin(angle) * spread;
            
            // 弾頭のサイズ（中央ほど大きく）
            const bulletSize = 3 + Math.abs(i - 4) * 0.5;
            
            // 弾頭描画（ダイヤモンド形状）
            this._drawDiamondBullet(bulletX, bulletY, bulletSize, '#ff00ff', '#ffffff');
        }
        
        // 中央のコア（回転するプラズマ球）
        this.ctx.save();
        this.ctx.rotate(time * 4);
        
        // プラズマコア
        const coreGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, 12);
        coreGradient.addColorStop(0, '#ffffff');
        coreGradient.addColorStop(0.3, '#ff00ff');
        coreGradient.addColorStop(0.7, '#cc00cc');
        coreGradient.addColorStop(1, 'rgba(204, 0, 204, 0)');
        
        this.ctx.fillStyle = coreGradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        // コア周りの回転リング
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.8;
        
        for (let ring = 0; ring < 2; ring++) {
            const radius = 12 + ring * 6;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        this.ctx.restore();
        
        // ランダム電撃エフェクト（30%確率）
        if (Math.random() < 0.3) {
            this._drawMultiShotLightning(bulletCount, maxSpread * breathScale, perspective);
        }
        
        // 外周オーラ
        this.ctx.strokeStyle = 'rgba(255, 0, 255, 0.3)';
        this.ctx.lineWidth = 3;
        this.ctx.globalAlpha = pulseIntensity;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * スーパーショットガンアイテム描画（二連銃身・火花エフェクト付き）
     * @private
     */
    _renderSuperShotgunPickup(renderData = {}) {
        const time = Date.now() * 0.001;
        
        // 縦軸回転効果
        const rotationZ = time * 1.5;
        const wobbleX = Math.sin(time * 2) * 2; // 横揺れ
        
        // 発光パルス（オレンジ・赤系）
        const pulseIntensity = 0.8 + 0.2 * Math.sin(time * 4);
        this.ctx.shadowColor = '#ff6600';
        this.ctx.shadowBlur = 30 * pulseIntensity;
        
        this.ctx.save();
        this.ctx.rotate(rotationZ);
        this.ctx.translate(wobbleX, 0);
        
        // 二連銃身描画
        const barrelLength = 20;
        const barrelWidth = 3;
        const barrelSpacing = 6;
        
        // 左銃身
        this.ctx.fillStyle = '#444444';
        this.ctx.fillRect(-barrelLength/2, -barrelSpacing/2 - barrelWidth/2, barrelLength, barrelWidth);
        
        // 右銃身
        this.ctx.fillRect(-barrelLength/2, barrelSpacing/2 - barrelWidth/2, barrelLength, barrelWidth);
        
        // 銃身先端のグロー（火花エフェクト）
        this.ctx.fillStyle = '#ff8800';
        this.ctx.beginPath();
        this.ctx.arc(barrelLength/2, -barrelSpacing/2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(barrelLength/2, barrelSpacing/2, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        // グリップ部分
        this.ctx.fillStyle = '#8B4513'; // 木目調
        this.ctx.fillRect(-barrelLength/2 - 8, -4, 12, 8);
        
        // トリガーガード
        this.ctx.strokeStyle = '#555555';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(-barrelLength/2 - 2, 2, 6, Math.PI, Math.PI * 2);
        this.ctx.stroke();
        
        this.ctx.restore();
        
        // 散弾エフェクト（周囲の小さな弾丸群）
        const pelletCount = 12;
        const spreadRadius = 25;
        
        for (let i = 0; i < pelletCount; i++) {
            const angle = (i / pelletCount) * Math.PI * 2 + time;
            const distance = spreadRadius + Math.sin(time * 3 + i) * 5;
            
            const pelletX = Math.cos(angle) * distance;
            const pelletY = Math.sin(angle) * distance;
            
            // 散弾の描画
            this.ctx.fillStyle = '#ff6600';
            this.ctx.globalAlpha = 0.7 + 0.3 * Math.sin(time * 4 + i);
            this.ctx.beginPath();
            this.ctx.arc(pelletX, pelletY, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        // 火花エフェクト（ランダム）
        if (Math.random() < 0.4) {
            this._drawShotgunSparks(time);
        }
        
        // 外周オーラ（爆発系）
        this.ctx.globalAlpha = 0.4;
        this.ctx.strokeStyle = '#ff4400';
        this.ctx.lineWidth = 4;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 35, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // 内周リング
        this.ctx.globalAlpha = 0.6;
        this.ctx.strokeStyle = '#ffaa00';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 28, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // エフェクトリセット
        this.ctx.shadowBlur = 0;
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * ショットガン火花エフェクト描画
     * @private
     */
    _drawShotgunSparks(time) {
        const sparkCount = 8;
        
        for (let i = 0; i < sparkCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 15;
            const sparkX = Math.cos(angle) * distance;
            const sparkY = Math.sin(angle) * distance;
            
            // 火花線
            this.ctx.strokeStyle = '#ffff00';
            this.ctx.lineWidth = 1 + Math.random();
            this.ctx.globalAlpha = 0.8;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(sparkX, sparkY);
            this.ctx.lineTo(
                sparkX + Math.cos(angle + Math.PI) * (3 + Math.random() * 5),
                sparkY + Math.sin(angle + Math.PI) * (3 + Math.random() * 5)
            );
            this.ctx.stroke();
        }
    }

    /**
     * ダイヤモンド形弾頭描画ヘルパー
     * @private
     */
    _drawDiamondBullet(x, y, size, color, highlightColor) {
        this.ctx.save();
        this.ctx.translate(x, y);
        
        // ダイヤモンド形状
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = highlightColor;
        this.ctx.lineWidth = 1;
        
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size);     // 上
        this.ctx.lineTo(size, 0);      // 右
        this.ctx.lineTo(0, size);      // 下
        this.ctx.lineTo(-size, 0);     // 左
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 中央ハイライト
        this.ctx.fillStyle = highlightColor;
        this.ctx.globalAlpha = 0.6;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalAlpha = 1;
        
        this.ctx.restore();
    }
    
    /**
     * マルチショット用電撃エフェクト
     * @private
     */
    _drawMultiShotLightning(bulletCount, spread, perspective) {
        this.ctx.strokeStyle = '#ff00ff';
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.7;
        
        // 2-3本のランダム電撃
        const lightningCount = 2 + Math.floor(Math.random() * 2);
        
        for (let i = 0; i < lightningCount; i++) {
            const fromIndex = Math.floor(Math.random() * bulletCount);
            const toIndex = Math.floor(Math.random() * bulletCount);
            
            if (fromIndex !== toIndex) {
                const fromAngle = ((fromIndex - 4) / 4) * 30 * Math.PI / 180;
                const toAngle = ((toIndex - 4) / 4) * 30 * Math.PI / 180;
                
                const fromX = Math.cos(fromAngle) * spread * perspective;
                const fromY = Math.sin(fromAngle) * spread;
                const toX = Math.cos(toAngle) * spread * perspective;
                const toY = Math.sin(toAngle) * spread;
                
                // ジグザグ電撃
                this._drawZigzagLightning(fromX, fromY, toX, toY, 3);
            }
        }
        
        this.ctx.globalAlpha = 1;
    }
    
    /**
     * ジグザグ電撃描画ヘルパー
     * @private
     */
    _drawZigzagLightning(x1, y1, x2, y2, segments) {
        this.ctx.beginPath();
        this.ctx.moveTo(x1, y1);
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // ランダムオフセット
            const offsetX = (Math.random() - 0.5) * 8;
            const offsetY = (Math.random() - 0.5) * 8;
            
            this.ctx.lineTo(x + offsetX, y + offsetY);
        }
        
        this.ctx.lineTo(x2, y2);
        this.ctx.stroke();
    }
    
    /**
     * 汎用アイテム描画
     * @private
     */
    _renderGenericPickup(renderData = {}) {
        // 汎用アイテム - 基本的な円形
        const color = renderData.color || '#ffffff';
        this.ctx.fillStyle = color;
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 2;
        
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();
        
        // 発光エフェクト
        if (renderData.glowIntensity !== undefined) {
            this.ctx.shadowColor = color;
            this.ctx.shadowBlur = 10 * renderData.glowIntensity;
            this.ctx.beginPath();
            this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.shadowBlur = 0;
        }
    }
    
    /**
     * パーティクル描画（ParticleSystemに移行）
     */
    renderParticles() {
        this.game.particleSystem.render(this.ctx);
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
    
    /**
     * HSVからHEXに変換（コンボレインボー用）
     * @param {number} h - 色相 (0-360)
     * @param {number} s - 彩度 (0-100)
     * @param {number} v - 明度 (0-100)
     * @returns {string} HEX色コード
     * @private
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
     * 色の明度を調整（コンボエフェクト用）
     * @param {string} color - HEX色コード
     * @param {number} factor - 調整係数 (-1.0 ～ 1.0)
     * @returns {string} 調整後HEX色コード
     * @private
     */
    _adjustColorBrightness(color, factor) {
        const hex = color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        const adjust = (value) => {
            if (factor > 0) {
                return Math.min(255, Math.round(value + (255 - value) * factor));
            } else {
                return Math.max(0, Math.round(value + value * factor));
            }
        };
        
        const newR = adjust(r);
        const newG = adjust(g);
        const newB = adjust(b);
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }
    
    /**
     * 弾丸特殊エフェクト描画（9コンボ以上）
     * @param {string} color - 基本色
     * @param {number} size - エフェクトサイズ
     * @param {boolean} isRainbow - レインボーエフェクト
     * @private
     */
    _renderBulletSpecialEffect(color, size, isRainbow = false) {
        const time = Date.now() * 0.01;
        
        // オーラリング
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.globalAlpha = 0.6;
        
        const ringRadius = size + Math.sin(time) * 3;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, ringRadius, 0, Math.PI * 2);
        this.ctx.stroke();
        
        // レインボー時は追加の輝きエフェクト
        if (isRainbow) {
            for (let i = 0; i < 3; i++) {
                const sparkAngle = (time + i * 120) * Math.PI / 180;
                const sparkRadius = size + 5;
                const sparkX = Math.cos(sparkAngle) * sparkRadius;
                const sparkY = Math.sin(sparkAngle) * sparkRadius;
                
                this.ctx.fillStyle = color;
                this.ctx.globalAlpha = 0.8;
                this.ctx.beginPath();
                this.ctx.arc(sparkX, sparkY, 1, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        this.ctx.globalAlpha = 1.0;
    }
}