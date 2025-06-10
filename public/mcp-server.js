#!/usr/bin/env node

/**
 * MCP (Model Context Protocol) サーバー
 * Claudeがリアルタイムでブラウザを制御・監視できるサーバー
 */

const WebSocket = require('ws');
const puppeteer = require('puppeteer');
const express = require('express');
const cors = require('cors');

class MCPGameDebugServer {
    constructor() {
        this.browser = null;
        this.page = null;
        this.wsServer = null;
        this.httpServer = null;
        this.clients = new Set();
        this.gameState = {};
        this.isMonitoring = false;
    }

    async initialize() {
        console.log('🚀 MCP Debug Server を初期化中...');
        
        // Express サーバー設定
        const app = express();
        app.use(cors());
        app.use(express.json());
        
        // REST API エンドポイント
        this.setupRestAPI(app);
        
        // HTTP サーバー起動
        this.httpServer = app.listen(3001, () => {
            console.log('🌐 HTTP API サーバー: http://localhost:3001');
        });
        
        // WebSocket サーバー設定
        this.wsServer = new WebSocket.Server({ 
            port: 3002,
            perMessageDeflate: false 
        });
        
        this.wsServer.on('connection', (ws) => {
            console.log('🔌 Claude が接続しました');
            this.clients.add(ws);
            
            ws.on('message', async (message) => {
                await this.handleClaudeMessage(ws, JSON.parse(message.toString()));
            });
            
            ws.on('close', () => {
                console.log('🔌 Claude が切断しました');
                this.clients.delete(ws);
            });
        });
        
        console.log('📡 WebSocket サーバー: ws://localhost:3002');
        
        // Puppeteer ブラウザ起動
        await this.initializeBrowser();
        
        console.log('✅ MCP Debug Server 初期化完了');
    }
    
    async initializeBrowser() {
        console.log('🌐 ブラウザを起動中...');
        
        this.browser = await puppeteer.launch({
            headless: false,
            devtools: true,
            args: [
                '--enable-touch-events',
                '--enable-features=TouchpadAndWheelScrollLatching',
                '--disable-web-security',
                '--disable-features=VizDisplayCompositor'
            ]
        });
        
        this.page = await this.browser.newPage();
        
        // iPhone 12 Pro エミュレーション
        await this.page.emulate({
            name: 'iPhone 12 Pro',
            userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
            viewport: {
                width: 390,
                height: 844,
                deviceScaleFactor: 3,
                isMobile: true,
                hasTouch: true,
                isLandscape: false
            }
        });
        
        // コンソール監視
        this.page.on('console', (msg) => {
            const logData = {
                type: 'console',
                level: msg.type(),
                text: msg.text(),
                timestamp: Date.now()
            };
            this.broadcastToClients(logData);
        });
        
        // エラー監視
        this.page.on('error', (error) => {
            const errorData = {
                type: 'error',
                message: error.message,
                stack: error.stack,
                timestamp: Date.now()
            };
            this.broadcastToClients(errorData);
        });
        
        console.log('✅ ブラウザ初期化完了');
    }
    
    setupRestAPI(app) {
        // ゲーム状態取得
        app.get('/api/game-state', async (req, res) => {
            try {
                const state = await this.getGameState();
                res.json({ success: true, data: state });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // デバッグ情報取得
        app.get('/api/debug-info', async (req, res) => {
            try {
                const debugInfo = await this.getDebugInfo();
                res.json({ success: true, data: debugInfo });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // タッチイベント送信
        app.post('/api/touch', async (req, res) => {
            try {
                const { x, y, type } = req.body;
                await this.sendTouchEvent(x, y, type);
                res.json({ success: true });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // JavaScript 実行
        app.post('/api/execute', async (req, res) => {
            try {
                const { code } = req.body;
                const result = await this.executeJavaScript(code);
                res.json({ success: true, result });
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
        
        // スクリーンショット取得
        app.get('/api/screenshot', async (req, res) => {
            try {
                const screenshot = await this.page.screenshot({ 
                    type: 'png',
                    fullPage: false 
                });
                res.set('Content-Type', 'image/png');
                res.send(screenshot);
            } catch (error) {
                res.status(500).json({ success: false, error: error.message });
            }
        });
    }
    
    async handleClaudeMessage(ws, message) {
        console.log('📨 Claude からのメッセージ:', message.type);
        
        try {
            switch (message.type) {
                case 'navigate':
                    await this.page.goto(message.url);
                    ws.send(JSON.stringify({ type: 'success', id: message.id }));
                    break;
                    
                case 'click':
                    await this.page.click(message.selector);
                    ws.send(JSON.stringify({ type: 'success', id: message.id }));
                    break;
                    
                case 'touch':
                    await this.sendTouchEvent(message.x, message.y, message.touchType);
                    ws.send(JSON.stringify({ type: 'success', id: message.id }));
                    break;
                    
                case 'execute':
                    const result = await this.executeJavaScript(message.code);
                    ws.send(JSON.stringify({ 
                        type: 'result', 
                        id: message.id, 
                        result 
                    }));
                    break;
                    
                case 'getState':
                    const state = await this.getGameState();
                    ws.send(JSON.stringify({ 
                        type: 'state', 
                        id: message.id, 
                        state 
                    }));
                    break;
                    
                case 'startMonitoring':
                    this.startRealTimeMonitoring();
                    ws.send(JSON.stringify({ type: 'success', id: message.id }));
                    break;
                    
                case 'stopMonitoring':
                    this.stopRealTimeMonitoring();
                    ws.send(JSON.stringify({ type: 'success', id: message.id }));
                    break;
                    
                default:
                    ws.send(JSON.stringify({ 
                        type: 'error', 
                        id: message.id, 
                        error: 'Unknown message type' 
                    }));
            }
        } catch (error) {
            ws.send(JSON.stringify({ 
                type: 'error', 
                id: message.id, 
                error: error.message 
            }));
        }
    }
    
    async sendTouchEvent(x, y, type = 'tap') {
        console.log(`👆 タッチイベント送信: (${x}, ${y}) type: ${type}`);
        
        switch (type) {
            case 'tap':
                await this.page.touchscreen.tap(x, y);
                break;
                
            case 'down':
                await this.page.evaluate((x, y) => {
                    const canvas = document.getElementById('game-canvas');
                    if (canvas) {
                        const event = new PointerEvent('pointerdown', {
                            pointerId: 1,
                            clientX: x,
                            clientY: y,
                            bubbles: true,
                            cancelable: true
                        });
                        canvas.dispatchEvent(event);
                    }
                }, x, y);
                break;
                
            case 'move':
                await this.page.evaluate((x, y) => {
                    const canvas = document.getElementById('game-canvas');
                    if (canvas) {
                        const event = new PointerEvent('pointermove', {
                            pointerId: 1,
                            clientX: x,
                            clientY: y,
                            bubbles: true,
                            cancelable: true
                        });
                        canvas.dispatchEvent(event);
                    }
                }, x, y);
                break;
                
            case 'up':
                await this.page.evaluate((x, y) => {
                    const canvas = document.getElementById('game-canvas');
                    if (canvas) {
                        const event = new PointerEvent('pointerup', {
                            pointerId: 1,
                            clientX: x,
                            clientY: y,
                            bubbles: true,
                            cancelable: true
                        });
                        canvas.dispatchEvent(event);
                    }
                }, x, y);
                break;
        }
    }
    
    async executeJavaScript(code) {
        console.log('⚡ JavaScript実行:', code.substring(0, 100) + '...');
        return await this.page.evaluate(code);
    }
    
    async getGameState() {
        return await this.page.evaluate(() => {
            // ゲーム状態を取得
            if (window.game || window.zombieSurvival) {
                const game = window.game || window.zombieSurvival;
                return {
                    gameState: game.gameState,
                    player: game.player ? {
                        x: game.player.x,
                        y: game.player.y,
                        health: game.player.health,
                        angle: game.player.angle
                    } : null,
                    virtualSticks: game.virtualSticks,
                    isMobile: game.isMobile,
                    enemies: game.enemies ? game.enemies.length : 0,
                    bullets: game.bullets ? game.bullets.length : 0
                };
            }
            return { error: 'Game not found' };
        });
    }
    
    async getDebugInfo() {
        return await this.page.evaluate(() => {
            const debugInfo = {};
            ['debug-touch', 'debug-base', 'debug-scale', 'debug-move', 'debug-aim', 'debug-mobile'].forEach(id => {
                const element = document.getElementById(id);
                debugInfo[id] = element ? element.textContent : null;
            });
            return debugInfo;
        });
    }
    
    startRealTimeMonitoring() {
        if (this.isMonitoring) return;
        
        console.log('👁️ リアルタイム監視開始');
        this.isMonitoring = true;
        
        // 500ms間隔でゲーム状態を監視
        this.monitoringInterval = setInterval(async () => {
            try {
                const state = await this.getGameState();
                const debugInfo = await this.getDebugInfo();
                
                this.broadcastToClients({
                    type: 'monitoring',
                    gameState: state,
                    debugInfo: debugInfo,
                    timestamp: Date.now()
                });
            } catch (error) {
                console.error('監視エラー:', error);
            }
        }, 500);
    }
    
    stopRealTimeMonitoring() {
        if (!this.isMonitoring) return;
        
        console.log('👁️ リアルタイム監視停止');
        this.isMonitoring = false;
        
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }
    
    broadcastToClients(data) {
        const message = JSON.stringify(data);
        this.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
    
    async navigateToGame() {
        console.log('🎮 ゲームページに移動...');
        await this.page.goto('http://localhost:8080');
        
        // ゲーム開始
        await this.page.waitForSelector('#start-game-btn');
        await this.page.evaluate(() => {
            document.getElementById('start-game-btn').click();
        });
        
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('✅ ゲーム開始完了');
    }
    
    async cleanup() {
        console.log('🧹 MCP Server をクリーンアップ中...');
        
        this.stopRealTimeMonitoring();
        
        if (this.browser) {
            await this.browser.close();
        }
        
        if (this.wsServer) {
            this.wsServer.close();
        }
        
        if (this.httpServer) {
            this.httpServer.close();
        }
        
        console.log('✅ クリーンアップ完了');
    }
}

// メイン実行
async function main() {
    const server = new MCPGameDebugServer();
    
    try {
        await server.initialize();
        await server.navigateToGame();
        
        console.log('\\n🎯 MCP Debug Server が稼働中...');
        console.log('📡 WebSocket: ws://localhost:3002');
        console.log('🌐 HTTP API: http://localhost:3001');
        console.log('\\nClaudeはこれらのエンドポイントを使用してリアルタイムデバッグが可能です。');
        
        // Ctrl+C でクリーンアップ
        process.on('SIGINT', async () => {
            console.log('\\n🛑 終了信号を受信...');
            await server.cleanup();
            process.exit(0);
        });
        
    } catch (error) {
        console.error('❌ MCP Server エラー:', error);
        await server.cleanup();
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = MCPGameDebugServer;