/**
 * メインエントリーポイント
 * ゲームの初期化を担当
 */

import { ZombieSurvival, setGlobalGameInstance } from '../game.js';

window.addEventListener('load', () => {
    // ゲームインスタンス作成
    const game = new ZombieSurvival();
    
    // グローバル参照設定（デバッグ用）
    setGlobalGameInstance(game);
    
    console.log('Game initialized via main.js');
});