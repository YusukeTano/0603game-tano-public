/**
 * メインエントリーポイント
 * ゲームの初期化を担当
 */

import { ZombieSurvival, setGlobalGameInstance } from '../game.js';

window.addEventListener('load', async () => {
    console.log('Window loaded, initializing game...');
    
    // ゲームインスタンス作成
    const game = new ZombieSurvival();
    
    // グローバル参照設定（デバッグ用）
    setGlobalGameInstance(game);
    
    // ゲーム初期化
    try {
        await game.init();
        console.log('Game initialized successfully via main.js');
    } catch (error) {
        console.error('Game initialization failed:', error);
        console.error('Error stack:', error.stack);
    }
});