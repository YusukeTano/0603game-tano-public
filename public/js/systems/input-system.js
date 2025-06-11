/**
 * InputSystem - Input State Object パターン
 * 安全で段階的な入力システム分離
 */
export class InputSystem {
    constructor(game) {
        this.game = game; // ゲームへの参照を保持（canvas、gameState等のアクセス用）
        
        // 入力状態を一元管理
        this.state = {
            keys: {},
            mouse: { x: 0, y: 0, down: false },
            virtualSticks: {
                move: { x: 0, y: 0, active: false },
                aim: { x: 0, y: 0, active: false, shooting: false }
            }
        };
        
        // デバイス判定
        this.isMobile = this.detectMobile();
        
        // 初期化
        this.init();
    }
    
    /**
     * 初期化
     */
    init() {
        console.log('InputSystem: Input State Object pattern initialized');
        // 現時点では基盤のみ作成、イベントリスナーは段階的に移行
    }
    
    /**
     * 入力状態の取得（メインAPI）
     * 常に最新の状態オブジェクトを返す
     */
    getInputState() {
        return this.state;
    }
    
    /**
     * 便利メソッド：キー押下判定
     */
    isKeyPressed(keyCode) {
        return !!this.state.keys[keyCode];
    }
    
    /**
     * 便利メソッド：マウス位置取得
     */
    getMousePosition() {
        return { x: this.state.mouse.x, y: this.state.mouse.y };
    }
    
    /**
     * 便利メソッド：マウスクリック判定
     */
    isMouseDown() {
        return this.state.mouse.down;
    }
    
    /**
     * 便利メソッド：移動入力の取得
     */
    getMovementInput() {
        let moveX = 0, moveY = 0;
        
        if (this.isMobile) {
            if (this.state.virtualSticks.move.active) {
                moveX = this.state.virtualSticks.move.x;
                moveY = this.state.virtualSticks.move.y;
            }
        } else {
            if (this.state.keys['KeyW'] || this.state.keys['ArrowUp']) moveY -= 1;
            if (this.state.keys['KeyS'] || this.state.keys['ArrowDown']) moveY += 1;
            if (this.state.keys['KeyA'] || this.state.keys['ArrowLeft']) moveX -= 1;
            if (this.state.keys['KeyD'] || this.state.keys['ArrowRight']) moveX += 1;
        }
        
        return { x: moveX, y: moveY };
    }
    
    /**
     * 便利メソッド：照準入力の取得
     */
    getAimInput() {
        if (this.isMobile) {
            if (this.state.virtualSticks.aim.active) {
                return {
                    angle: Math.atan2(this.state.virtualSticks.aim.y, this.state.virtualSticks.aim.x),
                    active: true
                };
            }
            return { angle: 0, active: false };
        } else {
            const dx = this.state.mouse.x - this.game.player.x;
            const dy = this.state.mouse.y - this.game.player.y;
            return {
                angle: Math.atan2(dy, dx),
                active: true
            };
        }
    }
    
    /**
     * 便利メソッド：射撃入力の取得
     */
    getShootingInput() {
        if (this.isMobile && this.state.virtualSticks.aim) {
            return this.state.virtualSticks.aim.shooting;
        } else {
            return this.state.mouse.down;
        }
    }
    
    /**
     * モバイルデバイス検出
     */
    detectMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        
        // 1. 確実なモバイルデバイス判定（最優先）
        const isAppleMobile = /iphone|ipad|ipod/i.test(userAgent);
        const isAndroid = /android/i.test(userAgent);
        const isMobileUA = /webos|blackberry|iemobile|opera mini/i.test(userAgent);
        
        // 2. タッチ機能の判定
        const hasTouchPoints = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
        const hasTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints > 0;
        
        // 3. 真のPCデバイス判定（除外条件）
        const hasHoverCapability = window.matchMedia('(hover: hover)').matches;
        const hasFinePointer = window.matchMedia('(pointer: fine)').matches;
        const isProbablyPC = hasHoverCapability && hasFinePointer && !hasTouchPoints;
        
        // 4. 画面サイズベースの判定（改善版）
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const maxDimension = Math.max(screenWidth, screenHeight);
        const minDimension = Math.min(screenWidth, screenHeight);
        
        // モバイル画面サイズの判定（より厳密）
        const isMobileSize = maxDimension <= 1024 && minDimension <= 768;
        const isTabletSize = maxDimension <= 1366 && minDimension <= 1024 && (isAppleMobile || isAndroid);
        
        console.log('InputSystem Mobile detection:', {
            userAgent: userAgent.substring(0, 50) + '...',
            isAppleMobile,
            isAndroid,
            isMobileUA,
            hasTouchPoints,
            hasTouch,
            hasHoverCapability,
            hasFinePointer,
            isProbablyPC,
            dimensions: `${screenWidth}x${screenHeight}`,
            maxDimension,
            minDimension,
            isMobileSize,
            isTabletSize
        });
        
        // 5. 最終判定（優先順位付き）
        let isMobile = false;
        let reason = '';
        
        // 確実なモバイルデバイスは常にモバイル扱い
        if (isAppleMobile || isAndroid || isMobileUA) {
            isMobile = true;
            reason = 'Definite mobile device (UA)';
        }
        // 確実なPCデバイスは常にPC扱い（条件を緩和）
        else if (isProbablyPC) {
            isMobile = false;
            reason = 'Definite PC device (hover+fine pointer)';
        }
        // 大画面デバイスは PC扱い（ホバー機能がなくても）
        else if (maxDimension > 1366 && !hasTouchPoints) {
            isMobile = false;
            reason = 'Large screen without touch';
        }
        // タブレットサイズのタッチデバイス
        else if (isTabletSize && hasTouchPoints) {
            isMobile = true;
            reason = 'Tablet with touch';
        }
        // モバイルサイズ画面
        else if (isMobileSize) {
            isMobile = true;
            reason = 'Mobile screen size';
        }
        // タッチ機能のあるデバイス（中サイズ画面）
        else if (hasTouchPoints && maxDimension <= 1366) {
            isMobile = true;
            reason = 'Touch-enabled device (medium screen)';
        }
        // その他はPC扱い
        else {
            isMobile = false;
            reason = 'Default PC classification';
        }
        
        console.log(`InputSystem → Final decision: ${isMobile ? 'MOBILE' : 'DESKTOP'} (${reason})`);
        return isMobile;
    }
    
    /**
     * デバッグ情報の取得
     */
    getDebugInfo() {
        return {
            isMobile: this.isMobile,
            keysPressed: Object.keys(this.state.keys).filter(key => this.state.keys[key]),
            mousePosition: this.state.mouse,
            virtualSticks: this.state.virtualSticks
        };
    }
}