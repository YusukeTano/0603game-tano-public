/**
 * メインエントリーポイント
 * ゲームの初期化を担当
 */

import { ZombieSurvival } from '../game.js';

window.addEventListener('load', () => {
    // グローバルゲームインスタンスの作成
    window.game = new ZombieSurvival();
    
    console.log('Game initialized via main.js');
});