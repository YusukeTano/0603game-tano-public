#!/usr/bin/env node

/**
 * Claude MCP クライアント
 * MCPサーバーと通信してリアルタイムデバッグを実行
 */

const WebSocket = require('ws');
const fetch = require('node-fetch');

class ClaudeMCPClient {
    constructor() {
        this.ws = null;
        this.httpBaseUrl = 'http://localhost:3001';
        this.wsUrl = 'ws://localhost:3002';
        this.messageId = 0;
        this.pendingRequests = new Map();
    }

    async connect() {
        console.log('🔌 MCPサーバーに接続中...');
        
        return new Promise((resolve, reject) => {
            this.ws = new WebSocket(this.wsUrl);
            
            this.ws.on('open', () => {
                console.log('✅ WebSocket接続成功');
                resolve();
            });
            
            this.ws.on('error', (error) => {
                console.error('❌ WebSocket接続エラー:', error);
                reject(error);
            });
            
            this.ws.on('message', (data) => {
                this.handleServerMessage(JSON.parse(data.toString()));
            });
            
            this.ws.on('close', () => {
                console.log('🔌 WebSocket切断');
            });
        });
    }

    handleServerMessage(message) {
        console.log('📨 サーバーからのメッセージ:', message.type);
        
        switch (message.type) {
            case 'console':
                console.log(`🖥️  [${message.level}] ${message.text}`);
                break;
                
            case 'error':
                console.error(`❌ ゲームエラー: ${message.message}`);
                break;
                
            case 'monitoring':
                this.handleMonitoringData(message);
                break;
                
            case 'success':
            case 'result':
            case 'state':
                if (message.id && this.pendingRequests.has(message.id)) {
                    const resolver = this.pendingRequests.get(message.id);
                    resolver(message);
                    this.pendingRequests.delete(message.id);
                }
                break;
        }
    }

    handleMonitoringData(data) {
        const { gameState, debugInfo } = data;
        
        // 重要な状態変化のみログ出力
        if (gameState && gameState.virtualSticks) {
            const move = gameState.virtualSticks.move;
            const aim = gameState.virtualSticks.aim;
            
            if (move.active || aim.shooting) {
                console.log(`🎮 ゲーム状態: 移動=${move.active ? `(${move.x.toFixed(2)}, ${move.y.toFixed(2)})` : '停止'}, 射撃=${aim.shooting ? 'ON' : 'OFF'}`);
            }
        }
        
        // デバッグ情報の変化もログ
        if (debugInfo && debugInfo['debug-touch'] && debugInfo['debug-touch'] !== '-') {
            console.log(`👆 タッチ検出: ${debugInfo['debug-touch']}`);
        }
    }

    async sendMessage(type, data = {}) {
        const id = ++this.messageId;
        const message = { type, id, ...data };
        
        return new Promise((resolve, reject) => {
            this.pendingRequests.set(id, resolve);
            this.ws.send(JSON.stringify(message));
            
            // 10秒でタイムアウト
            setTimeout(() => {
                if (this.pendingRequests.has(id)) {
                    this.pendingRequests.delete(id);
                    reject(new Error('Request timeout'));
                }
            }, 10000);
        });
    }

    async httpRequest(endpoint, method = 'GET', body = null) {
        const url = `${this.httpBaseUrl}${endpoint}`;
        const options = {
            method,
            headers: { 'Content-Type': 'application/json' }
        };
        
        if (body) {
            options.body = JSON.stringify(body);
        }
        
        const response = await fetch(url, options);
        return await response.json();
    }

    // 高レベルAPI
    async getGameState() {
        const response = await this.httpRequest('/api/game-state');
        return response.data;
    }

    async getDebugInfo() {
        const response = await this.httpRequest('/api/debug-info');
        return response.data;
    }

    async sendTouch(x, y, type = 'tap') {
        return await this.httpRequest('/api/touch', 'POST', { x, y, type });
    }

    async executeScript(code) {
        const response = await this.httpRequest('/api/execute', 'POST', { code });
        return response.result;
    }

    async takeScreenshot() {
        const response = await fetch(`${this.httpBaseUrl}/api/screenshot`);
        return await response.buffer();
    }

    async startMonitoring() {
        return await this.sendMessage('startMonitoring');
    }

    async stopMonitoring() {
        return await this.sendMessage('stopMonitoring');
    }

    // 包括的なタッチテスト
    async runComprehensiveTouchTest() {
        console.log('🧪 包括的タッチテスト開始...');
        
        try {
            // 1. 初期状態確認
            console.log('📊 初期状態確認...');
            const initialState = await this.getGameState();
            const initialDebug = await this.getDebugInfo();
            
            console.log('初期ゲーム状態:', {
                isMobile: initialState.isMobile,
                gameState: initialState.gameState,
                virtualSticks: initialState.virtualSticks
            });
            console.log('初期デバッグ情報:', initialDebug);
            
            // 2. 監視開始
            console.log('👁️ リアルタイム監視開始...');
            await this.startMonitoring();
            
            // 3. 左半分タッチテスト
            console.log('👆 左半分タッチテスト（移動）...');
            await this.sendTouch(150, 400, 'down'); // タッチ開始
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const leftTouchState = await this.getGameState();
            console.log('左タッチ後の状態:', leftTouchState.virtualSticks);
            
            await this.sendTouch(200, 450, 'move'); // ドラッグ
            await new Promise(resolve => setTimeout(resolve, 200));
            
            await this.sendTouch(200, 450, 'up'); // タッチ終了
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 4. 右半分タッチテスト
            console.log('👆 右半分タッチテスト（射撃）...');
            await this.sendTouch(300, 400, 'down'); // タッチ開始
            await new Promise(resolve => setTimeout(resolve, 200));
            
            const rightTouchState = await this.getGameState();
            console.log('右タッチ後の状態:', rightTouchState.virtualSticks);
            
            await this.sendTouch(300, 400, 'up'); // タッチ終了
            await new Promise(resolve => setTimeout(resolve, 500));
            
            // 5. JavaScript直接実行テスト
            console.log('⚡ JavaScript直接実行テスト...');
            const jsResult = await this.executeScript(`
                // virtualSticksを直接操作
                if (window.game) {
                    const before = {
                        move: { ...window.game.virtualSticks.move },
                        aim: { ...window.game.virtualSticks.aim }
                    };
                    
                    // 強制的に移動状態に設定
                    window.game.virtualSticks.move.x = 0.5;
                    window.game.virtualSticks.move.y = 0.3;
                    window.game.virtualSticks.move.active = true;
                    
                    // 強制的に射撃状態に設定
                    window.game.virtualSticks.aim.shooting = true;
                    
                    // デバッグ表示を強制更新
                    if (window.game.forceUpdateMobileDebugDisplay) {
                        window.game.forceUpdateMobileDebugDisplay();
                    }
                    
                    const after = {
                        move: { ...window.game.virtualSticks.move },
                        aim: { ...window.game.virtualSticks.aim }
                    };
                    
                    return { before, after, success: true };
                } else {
                    return { error: 'Game object not found' };
                }
            `);
            
            console.log('JavaScript実行結果:', jsResult);
            
            // 6. 最終状態確認
            await new Promise(resolve => setTimeout(resolve, 1000));
            const finalState = await this.getGameState();
            const finalDebug = await this.getDebugInfo();
            
            console.log('最終ゲーム状態:', finalState.virtualSticks);
            console.log('最終デバッグ情報:', finalDebug);
            
            // 7. 監視停止
            await this.stopMonitoring();
            
            console.log('✅ 包括的タッチテスト完了');
            
            return {
                initialState,
                leftTouchState,
                rightTouchState,
                jsResult,
                finalState,
                finalDebug
            };
            
        } catch (error) {
            console.error('❌ タッチテストエラー:', error);
            return { error: error.message };
        }
    }

    async runDiagnostics() {
        console.log('🔍 診断テスト実行...');
        
        try {
            // システム診断
            const diagnostics = await this.executeScript(`
                const diagnostics = {
                    timestamp: Date.now(),
                    location: window.location.href,
                    userAgent: navigator.userAgent,
                    touchSupport: 'ontouchstart' in window,
                    pointerSupport: !!window.PointerEvent,
                    gameObject: !!window.game,
                    canvas: !!document.getElementById('game-canvas'),
                    debugInfo: !!document.getElementById('debug-info'),
                    screenControls: !!document.querySelector('.screen-controls')
                };
                
                if (window.game) {
                    diagnostics.gameDetails = {
                        gameState: window.game.gameState,
                        isMobile: window.game.isMobile,
                        baseWidth: window.game.baseWidth,
                        gameScale: window.game.gameScale,
                        virtualSticks: window.game.virtualSticks
                    };
                    
                    // Canvas 情報
                    const canvas = document.getElementById('game-canvas');
                    if (canvas) {
                        const rect = canvas.getBoundingClientRect();
                        diagnostics.canvasInfo = {
                            width: canvas.width,
                            height: canvas.height,
                            clientWidth: canvas.clientWidth,
                            clientHeight: canvas.clientHeight,
                            boundingRect: {
                                x: rect.x,
                                y: rect.y,
                                width: rect.width,
                                height: rect.height
                            }
                        };
                    }
                }
                
                return diagnostics;
            `);
            
            console.log('🔍 システム診断結果:');
            console.log(JSON.stringify(diagnostics, null, 2));
            
            return diagnostics;
            
        } catch (error) {
            console.error('❌ 診断エラー:', error);
            return { error: error.message };
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// メイン実行
async function main() {
    const client = new ClaudeMCPClient();
    
    try {
        await client.connect();
        
        console.log('🎯 Claude MCP Client 開始...');
        
        // 診断テスト
        await client.runDiagnostics();
        
        // 包括的タッチテスト
        const testResults = await client.runComprehensiveTouchTest();
        
        console.log('\\n📋 テスト結果サマリー:');
        console.log('========================');
        if (testResults.error) {
            console.log('❌ テスト失敗:', testResults.error);
        } else {
            console.log('✅ テスト完了');
            console.log('初期状態:', testResults.initialState?.virtualSticks);
            console.log('JavaScript直接操作:', testResults.jsResult?.success ? '成功' : '失敗');
            console.log('最終状態:', testResults.finalState?.virtualSticks);
        }
        
        console.log('\\n⏳ 5秒後にクライアントを終了します...');
        setTimeout(() => {
            client.disconnect();
            process.exit(0);
        }, 5000);
        
    } catch (error) {
        console.error('❌ クライアントエラー:', error);
        client.disconnect();
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = ClaudeMCPClient;