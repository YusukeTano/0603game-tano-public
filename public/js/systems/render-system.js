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
        this.ctx.save();
        this.ctx.translate(this.game.player.x, this.game.player.y);
        this.ctx.rotate(this.game.player.angle);
        
        
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
                    this._renderAmmoPickup(renderData); // ニュークも弾薬タイプとして描画
                    break;
                case 'dash':
                    this._renderDashPickup(renderData);
                    break;
                case 'ammo':
                    this._renderAmmoPickup(renderData);
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
}