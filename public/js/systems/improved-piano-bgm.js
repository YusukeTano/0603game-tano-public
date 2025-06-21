/**
 * ImprovedPianoBGM - 改善されたピアノBGMシステム
 * 目的: より本物のピアノに近い音を実現
 */

export class ImprovedPianoBGM {
    constructor(audioSystem) {
        this.audioSystem = audioSystem;
        this.isInitialized = false;
        this.isPlaying = false;
        this.currentScene = null;
        
        // ピアノ風の音を作るための複数チャンネル
        this.pianoVoices = {
            main: null,       // メイン音
            harmonic1: null,  // 第1倍音
            harmonic2: null,  // 第2倍音
            attack: null      // アタック音
        };
        
        // Battle BGM専用タイマー（非同期競合対応）
        this.battleBGMTimer = null;
        
        console.log('🎹 ImprovedPianoBGM: コンストラクタ完了（非同期競合対応版）');
    }
    
    /**
     * 初期化
     */
    async initialize() {
        try {
            console.log('🎹 ImprovedPianoBGM: === 初期化開始 ===');
            
            // Tone.js確認
            if (typeof Tone === 'undefined') {
                throw new Error('Tone.js not available');
            }
            
            // AudioContext開始（サブシステム用安全チェック）
            if (Tone.context.state === 'suspended') {
                console.log('🎼 ImprovedPianoBGM: AudioContext suspended, attempting start...');
                await Tone.start();
            } else if (Tone.context.state === 'running') {
                console.log('🎼 ImprovedPianoBGM: AudioContext already running');
            }
            console.log('✅ AudioContext状態:', Tone.context.state);
            
            // ピアノ風音源を作成
            this.createPianoVoices();
            
            // テスト音
            this.playPianoTestSound();
            
            this.isInitialized = true;
            console.log('🎹 ImprovedPianoBGM: === 初期化完了 ===');
            
            return { success: true, message: 'ImprovedPianoBGM ready' };
            
        } catch (error) {
            console.error('❌ ImprovedPianoBGM: 初期化失敗', error);
            return { success: false, message: error.message };
        }
    }
    
    /**
     * ピアノ風音源を作成（複数の音を重ねて豊かな音色を実現）- 音響接続強化版
     */
    createPianoVoices() {
        console.log('🎹 [PIANO VOICES] ピアノ音源作成開始 - 音響接続強化版');
        
        try {
            // メイン音（基本となる音）- エラーハンドリング付き
            console.log('🎹 [MAIN] メインピアノボイス作成中...');
            this.pianoVoices.main = this.createRobustVoice('main', () => {
                return new Tone.PolySynth(Tone.Synth, {
                    maxPolyphony: 8,
                    voice: {
                        oscillator: {
                            type: 'fatsine',   // 太いサイン波
                            count: 3,          // 3つのオシレーター
                            spread: 30         // デチューンで厚み
                        },
                        envelope: {
                            attack: 0.002,     // 非常に速いアタック（ピアノの特徴）
                            decay: 2.0,        // ゆっくりとした減衰
                            sustain: 0.0,      // サステインなし（ピアノの特徴）
                            release: 2.0,      // 長いリリース
                            attackCurve: 'exponential',  // 自然なアタック
                            decayCurve: 'exponential'     // 自然な減衰
                        }
                    }
                });
            }, -8);
            
            // 第1倍音（明るさを追加）- エラーハンドリング付き
            console.log('🎹 [HARMONIC1] 第1倍音ピアノボイス作成中...');
            this.pianoVoices.harmonic1 = this.createRobustVoice('harmonic1', () => {
                return new Tone.Synth({
                    oscillator: {
                        type: 'sine'
                    },
                    envelope: {
                        attack: 0.001,
                        decay: 0.8,
                        sustain: 0.0,
                        release: 1.0
                    }
                });
            }, -20);
            
            // 第2倍音（金属的な響きを追加）- エラーハンドリング付き
            console.log('🎹 [HARMONIC2] 第2倍音ピアノボイス作成中...');
            this.pianoVoices.harmonic2 = this.createRobustVoice('harmonic2', () => {
                return new Tone.Synth({
                    oscillator: {
                        type: 'triangle'
                    },
                    envelope: {
                        attack: 0.001,
                        decay: 0.3,
                        sustain: 0.0,
                        release: 0.5
                    }
                });
            }, -25);
            
            // アタック音（打鍵のノイズ）- エラーハンドリング付き
            console.log('🎹 [ATTACK] アタック音ピアノボイス作成中...');
            this.pianoVoices.attack = this.createRobustVoice('attack', () => {
                return new Tone.NoiseSynth({
                    noise: {
                        type: 'white'
                    },
                    envelope: {
                        attack: 0.001,
                        decay: 0.01,
                        sustain: 0.0,
                        release: 0.01
                    }
                });
            }, -30);
            
            // 音響接続検証
            this.verifyAllAudioConnections();
            
            console.log('✅ [PIANO VOICES] ピアノ音源作成完了 - 音響接続強化版');
            
        } catch (error) {
            console.error('❌ [PIANO VOICES] ピアノ音源作成エラー:', error);
            throw error;
        }
    }
    
    /**
     * 堅牢なボイス作成（新規）
     */
    createRobustVoice(voiceName, voiceFactory, defaultVolume) {
        try {
            console.log(`🔧 [VOICE CREATE] ${voiceName} 作成開始...`);
            
            // ボイス作成
            const voice = voiceFactory();
            
            // 音響接続
            voice.toDestination();
            console.log(`🔗 [VOICE CREATE] ${voiceName} Destination接続完了`);
            
            // 音量設定
            if (voice.volume) {
                voice.volume.value = defaultVolume;
                console.log(`🔊 [VOICE CREATE] ${voiceName} 音量設定: ${defaultVolume}dB`);
            }
            
            // 接続確認
            const isConnected = voice.connected !== false;
            console.log(`✅ [VOICE CREATE] ${voiceName} 作成完了 - 接続状態: ${isConnected}`);
            
            return voice;
            
        } catch (error) {
            console.error(`❌ [VOICE CREATE] ${voiceName} 作成エラー:`, error);
            
            // フォールバック: シンプルなSynthを作成
            console.log(`🔄 [VOICE FALLBACK] ${voiceName} フォールバック作成中...`);
            try {
                const fallbackVoice = new Tone.Synth().toDestination();
                fallbackVoice.volume.value = defaultVolume;
                console.log(`✅ [VOICE FALLBACK] ${voiceName} フォールバック完了`);
                return fallbackVoice;
            } catch (fallbackError) {
                console.error(`❌ [VOICE FALLBACK] ${voiceName} フォールバック失敗:`, fallbackError);
                return null;
            }
        }
    }
    
    /**
     * 全音響接続検証（新規）
     */
    verifyAllAudioConnections() {
        console.log('🔍 [AUDIO VERIFY] 全音響接続検証開始...');
        
        let allConnected = true;
        const connectionStatus = {};
        
        Object.entries(this.pianoVoices).forEach(([voiceName, voice]) => {
            if (voice) {
                const isConnected = voice.connected !== false;
                connectionStatus[voiceName] = isConnected;
                
                if (isConnected) {
                    console.log(`✅ [AUDIO VERIFY] ${voiceName}: 接続正常`);
                } else {
                    console.warn(`⚠️ [AUDIO VERIFY] ${voiceName}: 接続問題検出`);
                    allConnected = false;
                    
                    // 再接続試行
                    try {
                        voice.disconnect();
                        voice.toDestination();
                        console.log(`🔧 [AUDIO VERIFY] ${voiceName}: 再接続完了`);
                    } catch (error) {
                        console.error(`❌ [AUDIO VERIFY] ${voiceName}: 再接続失敗`, error);
                    }
                }
            } else {
                console.error(`❌ [AUDIO VERIFY] ${voiceName}: null/undefined`);
                connectionStatus[voiceName] = false;
                allConnected = false;
            }
        });
        
        if (allConnected) {
            console.log('✅ [AUDIO VERIFY] 全音響接続検証完了 - 全て正常');
        } else {
            console.warn('⚠️ [AUDIO VERIFY] 全音響接続検証完了 - 一部問題あり');
        }
        
        return connectionStatus;
    }
    
    /**
     * ピアノテスト音
     */
    playPianoTestSound() {
        console.log('🔊 [TEST] ピアノテスト音再生');
        this.playPianoNote('C4', '4n');
    }
    
    /**
     * ピアノノートを再生（複数の音を重ねて再生）
     */
    playPianoNote(note, duration) {
        const frequency = Tone.Frequency(note).toFrequency();
        
        // メイン音
        if (this.pianoVoices.main) {
            this.pianoVoices.main.triggerAttackRelease(note, duration);
        }
        
        // 第1倍音（2倍の周波数）
        if (this.pianoVoices.harmonic1) {
            const harmonic1Note = Tone.Frequency(frequency * 2).toNote();
            this.pianoVoices.harmonic1.triggerAttackRelease(harmonic1Note, duration);
        }
        
        // 第2倍音（3倍の周波数）
        if (this.pianoVoices.harmonic2) {
            const harmonic2Note = Tone.Frequency(frequency * 3).toNote();
            this.pianoVoices.harmonic2.triggerAttackRelease(harmonic2Note, duration);
        }
        
        // アタック音（打鍵音）
        if (this.pianoVoices.attack) {
            this.pianoVoices.attack.triggerAttackRelease('16n');
        }
    }
    
    /**
     * BGM開始（強化版 - Battle BGM無音問題対応）
     */
    async startMusic(scene = 'menu') {
        try {
            console.log(`🎹 [BGM] ${scene} ピアノBGM開始 - 強化版実行`);
            
            // ステップ1: 確実な停止処理
            console.log(`🔄 [BGM] 前のBGM完全停止実行...`);
            this.stopMusic();
            
            // ステップ2: タイミング調整（非同期競合回避）
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // ステップ3: 音響接続確認
            console.log(`🔊 [BGM] 音響接続確認中...`);
            this.verifyAudioConnections();
            
            // ステップ4: 強制シーン状態設定
            console.log(`🎯 [BGM] シーン状態強制設定: ${scene}`);
            this.currentScene = scene;
            this.isPlaying = true;
            
            // ステップ5: シーン別BGM開始（詳細ログ付き）
            console.log(`🎵 [BGM] シーン別BGM開始処理: ${scene}`);
            
            if (scene === 'menu') {
                console.log(`🎵 [MENU] メニューBGM開始`);
                this.playImprovedMenuMusic();
            } else if (scene === 'character') {
                console.log(`👤 [CHARACTER] キャラクターBGM開始`);
                this.playCharacterSelectionMusic();
            } else if (scene === 'battle') {
                console.log(`⚔️ [BATTLE] バトルBGM開始 - 詳細実行`);
                
                // Battle BGM特別処理
                this.forceStartBattleBGM();
            } else {
                console.warn(`⚠️ [BGM] 未知のシーン: ${scene} - デフォルトでメニューBGM実行`);
                this.playImprovedMenuMusic();
            }
            
            // ステップ6: 状態確認
            console.log(`📊 [BGM] 最終状態確認:`);
            console.log(`🎯 Scene: ${this.currentScene}, Playing: ${this.isPlaying}`);
            
            console.log(`✅ [BGM] ${scene} ピアノBGM開始完了 - 強化版`);
            
        } catch (error) {
            console.error('❌ [BGM] 開始エラー:', error);
            console.error('📜 Stack trace:', error.stack);
        }
    }
    
    /**
     * 音響接続確認（新規）
     */
    verifyAudioConnections() {
        console.log(`🔊 [AUDIO CHECK] ピアノボイス接続確認...`);
        
        Object.entries(this.pianoVoices).forEach(([voiceName, voice]) => {
            if (voice) {
                console.log(`✅ [AUDIO CHECK] ${voiceName}: connected=${voice.connected}`);
                
                // 接続が切れている場合は再接続
                if (!voice.connected) {
                    console.log(`🔧 [AUDIO FIX] ${voiceName}を再接続中...`);
                    try {
                        voice.disconnect();
                        voice.toDestination();
                        console.log(`✅ [AUDIO FIX] ${voiceName}再接続完了`);
                    } catch (error) {
                        console.warn(`⚠️ [AUDIO FIX] ${voiceName}再接続失敗:`, error);
                    }
                }
            } else {
                console.warn(`⚠️ [AUDIO CHECK] ${voiceName}: null/undefined`);
            }
        });
    }
    
    /**
     * Battle BGM強制開始（新規）
     */
    forceStartBattleBGM() {
        console.log(`⚔️ [BATTLE FORCE] バトルBGM強制開始実行...`);
        
        // 二重チェック: 状態確認
        if (this.currentScene !== 'battle' || !this.isPlaying) {
            console.log(`🔧 [BATTLE FORCE] 状態修正: scene=${this.currentScene}→battle, playing=${this.isPlaying}→true`);
            this.currentScene = 'battle';
            this.isPlaying = true;
        }
        
        // Battle BGM専用音量強制設定
        console.log(`🔊 [BATTLE FORCE] Battle BGM専用音量設定実行...`);
        this.forceBattleVolumeSettings();
        
        // メソッド存在確認
        if (typeof this.playImprovedBattleMusic !== 'function') {
            console.error(`❌ [BATTLE FORCE] playImprovedBattleMusic method not found`);
            return;
        }
        
        // 強制実行
        console.log(`⚔️ [BATTLE FORCE] playImprovedBattleMusic実行...`);
        this.playImprovedBattleMusic();
        
        // 1秒後に状態確認
        setTimeout(() => {
            console.log(`📊 [BATTLE FORCE] 1秒後状態: scene=${this.currentScene}, playing=${this.isPlaying}`);
            this.verifyBattleBGMStatus();
        }, 1000);
    }
    
    /**
     * Battle BGM専用音量強制設定（新規）
     */
    forceBattleVolumeSettings() {
        console.log(`🔊 [BATTLE VOLUME] Battle BGM専用音量設定開始...`);
        
        // 基本音量計算（Battle BGMは少し大きめに）
        let volume = 1.0;
        try {
            if (this.audioSystem && typeof this.audioSystem.getCalculatedVolume === 'function') {
                volume = this.audioSystem.getCalculatedVolume('bgm', 1.0);
                console.log(`🔊 [BATTLE VOLUME] システム音量取得: ${volume}`);
            } else {
                console.log(`🔊 [BATTLE VOLUME] システム音量取得不可 - デフォルト使用: ${volume}`);
            }
        } catch (error) {
            console.warn(`⚠️ [BATTLE VOLUME] 音量取得エラー - デフォルト使用:`, error);
        }
        
        // Battle BGM用のボリューム調整（20%ブースト）
        const battleBoost = 1.2;
        const dbBase = -15 + (volume * battleBoost * 15);  // Battle BGMは-15dB to 3dB range
        
        console.log(`🔊 [BATTLE VOLUME] Battle BGM用音量設定: dbBase=${dbBase.toFixed(2)}dB`);
        
        // 各ピアノボイスに音量設定
        Object.entries(this.pianoVoices).forEach(([voiceName, voice]) => {
            if (voice && voice.volume) {
                let voiceVolume;
                switch (voiceName) {
                    case 'main':
                        voiceVolume = dbBase + 10;  // メイン音は特に大きく
                        break;
                    case 'harmonic1':
                        voiceVolume = dbBase + 2;   // 第1倍音
                        break;
                    case 'harmonic2':
                        voiceVolume = dbBase - 3;   // 第2倍音
                        break;
                    case 'attack':
                        voiceVolume = dbBase - 8;   // アタック音
                        break;
                    default:
                        voiceVolume = dbBase;
                }
                
                voice.volume.value = voiceVolume;
                console.log(`🔊 [BATTLE VOLUME] ${voiceName}: ${voiceVolume.toFixed(2)}dB`);
            } else {
                console.warn(`⚠️ [BATTLE VOLUME] ${voiceName}: 音量設定不可（voice未定義）`);
            }
        });
        
        console.log(`✅ [BATTLE VOLUME] Battle BGM専用音量設定完了`);
    }
    
    /**
     * Battle BGM状態検証（新規）
     */
    verifyBattleBGMStatus() {
        console.log(`📊 [BATTLE VERIFY] Battle BGM状態検証開始...`);
        
        console.log(`🎯 Scene: ${this.currentScene}`);
        console.log(`🎵 Playing: ${this.isPlaying}`);
        console.log(`🎹 Initialized: ${this.isInitialized}`);
        
        // ピアノボイス状態確認
        Object.entries(this.pianoVoices).forEach(([voiceName, voice]) => {
            if (voice) {
                console.log(`🎹 ${voiceName}: connected=${voice.connected}, volume=${voice.volume ? voice.volume.value.toFixed(2) + 'dB' : 'N/A'}`);
            } else {
                console.warn(`⚠️ ${voiceName}: undefined`);
            }
        });
        
        // テスト音再生で実際の音響確認
        console.log(`🔊 [BATTLE VERIFY] テスト音再生...`);
        if (this.pianoVoices.main) {
            try {
                this.pianoVoices.main.triggerAttackRelease('C4', '8n');
                console.log(`✅ [BATTLE VERIFY] テスト音再生成功`);
            } catch (error) {
                console.error(`❌ [BATTLE VERIFY] テスト音再生失敗:`, error);
            }
        }
        
        console.log(`📊 [BATTLE VERIFY] Battle BGM状態検証完了`);
    }
    
    /**
     * 改善されたメニューBGM（美しいピアノ曲）
     */
    playImprovedMenuMusic() {
        console.log('🎹 [MENU] 改善されたピアノメニューBGM開始');
        
        // FF Prelude風の美しいアルペジオ進行
        const sequence = [
            // 第1フレーズ：神秘的な上昇アルペジオ
            { note: 'C4', duration: '8n', time: 0 },
            { note: 'E4', duration: '8n', time: 0.5 },
            { note: 'G4', duration: '8n', time: 1 },
            { note: 'C5', duration: '4n', time: 1.5 },
            
            // 第2フレーズ：美しい下降
            { note: 'B4', duration: '8n', time: 2.5 },
            { note: 'G4', duration: '8n', time: 3 },
            { note: 'E4', duration: '8n', time: 3.5 },
            { note: 'C4', duration: '4n', time: 4 },
            
            // 第3フレーズ：和音の展開
            { note: 'F4', duration: '8n', time: 5 },
            { note: 'A4', duration: '8n', time: 5.5 },
            { note: 'C5', duration: '8n', time: 6 },
            { note: 'F5', duration: '4n', time: 6.5 },
            
            // 第4フレーズ：美しい終結
            { note: 'E5', duration: '8n', time: 7.5 },
            { note: 'C5', duration: '8n', time: 8 },
            { note: 'G4', duration: '8n', time: 8.5 },
            { note: 'C4', duration: '2n', time: 9 }  // 最後は長めに
        ];
        
        const playSequence = () => {
            if (!this.isPlaying || this.currentScene !== 'menu') {
                return;
            }
            
            sequence.forEach(({ note, duration, time }) => {
                setTimeout(() => {
                    if (this.isPlaying && this.currentScene === 'menu') {
                        this.playPianoNote(note, duration);
                        console.log(`🎵 [MENU PIANO] ${note} (${duration})`);
                    }
                }, time * 500);  // 500ms = 1拍
            });
            
            // 10.5秒後にループ
            setTimeout(playSequence, 10500);
        };
        
        // 開始
        playSequence();
    }
    
    /**
     * Character専用BGM（より明るいメロディー）
     */
    playCharacterSelectionMusic() {
        console.log('🎹 [CHARACTER] キャラクター選択ピアノBGM開始');
        
        // より明るく、希望に満ちたメロディー
        const sequence = [
            // 第1フレーズ：希望の上昇
            { note: 'G4', duration: '8n', time: 0 },
            { note: 'C5', duration: '8n', time: 0.5 },
            { note: 'E5', duration: '8n', time: 1 },
            { note: 'G5', duration: '4n', time: 1.5 },
            
            // 第2フレーズ：優雅な展開
            { note: 'F5', duration: '8n', time: 2.5 },
            { note: 'E5', duration: '8n', time: 3 },
            { note: 'D5', duration: '8n', time: 3.5 },
            { note: 'C5', duration: '4n', time: 4 },
            
            // 第3フレーズ：勇気ある進行
            { note: 'D5', duration: '8n', time: 5 },
            { note: 'E5', duration: '8n', time: 5.5 },
            { note: 'F5', duration: '8n', time: 6 },
            { note: 'G5', duration: '4n', time: 6.5 },
            
            // 第4フレーズ：壮大な終結
            { note: 'A5', duration: '8n', time: 7.5 },
            { note: 'G5', duration: '8n', time: 8 },
            { note: 'E5', duration: '8n', time: 8.5 },
            { note: 'C5', duration: '2n', time: 9 }
        ];
        
        const playSequence = () => {
            if (!this.isPlaying || this.currentScene !== 'character') {
                return;
            }
            
            sequence.forEach(({ note, duration, time }) => {
                setTimeout(() => {
                    if (this.isPlaying && this.currentScene === 'character') {
                        this.playPianoNote(note, duration);
                        console.log(`🎵 [CHARACTER PIANO] ${note} (${duration})`);
                    }
                }, time * 550);  // 550ms = 1拍（少し速め）
            });
            
            // 10秒後にループ
            setTimeout(playSequence, 11000);
        };
        
        // 開始
        playSequence();
    }
    
    /**
     * 改善されたバトルBGM（力強いピアノバトル曲）- 非同期競合対応版
     */
    playImprovedBattleMusic() {
        console.log('⚔️ [BATTLE] 改善されたピアノバトルBGM開始 - 非同期競合対応版');
        
        // Battle BGM専用タイマーをクリア（既存のタイマーとの競合回避）
        if (this.battleBGMTimer) {
            console.log('🔄 [BATTLE] 既存バトルBGMタイマークリア');
            clearTimeout(this.battleBGMTimer);
            this.battleBGMTimer = null;
        }
        
        // 力強く緊迫感のあるバトルメロディー
        const sequence = [
            // 第1フレーズ：戦闘開始の呼び声
            { note: 'C3', duration: '8n', time: 0 },
            { note: 'C4', duration: '16n', time: 0.2 },
            { note: 'E4', duration: '16n', time: 0.4 },
            { note: 'G4', duration: '8n', time: 0.6 },
            
            // 第2フレーズ：激しい攻防
            { note: 'F3', duration: '8n', time: 0.8 },
            { note: 'F4', duration: '16n', time: 1.0 },
            { note: 'A4', duration: '16n', time: 1.2 },
            { note: 'C5', duration: '8n', time: 1.4 },
            
            // 第3フレーズ：クライマックス
            { note: 'G3', duration: '8n', time: 1.6 },
            { note: 'G4', duration: '16n', time: 1.8 },
            { note: 'B4', duration: '16n', time: 2.0 },
            { note: 'D5', duration: '8n', time: 2.2 },
            
            // 第4フレーズ：勝利の予感
            { note: 'E5', duration: '16n', time: 2.4 },
            { note: 'D5', duration: '16n', time: 2.6 },
            { note: 'C5', duration: '8n', time: 2.8 },
            { note: 'G4', duration: '4n', time: 3.0 }
        ];
        
        // Battle BGM専用の堅牢なシーケンサー
        const playBattleSequence = async () => {
            // 二重チェック：確実な状態確認
            if (!this.isPlaying || this.currentScene !== 'battle') {
                console.log('⚔️ [BATTLE] BGM停止条件検出 - isPlaying:', this.isPlaying, 'scene:', this.currentScene);
                return false;
            }
            
            console.log('⚔️ [BATTLE] バトルシークエンス開始 - 堅牢版');
            
            try {
                // 音響再生確認
                if (!this.pianoVoices.main) {
                    console.error('❌ [BATTLE] メインピアノボイス未初期化');
                    return false;
                }
                
                // シーケンスの各ノートを確実に再生
                for (const { note, duration, time } of sequence) {
                    await new Promise(resolve => {
                        setTimeout(() => {
                            // フレーム毎の状態チェック
                            if (this.isPlaying && this.currentScene === 'battle') {
                                try {
                                    this.playPianoNote(note, duration);
                                    console.log(`⚔️ [BATTLE PIANO] ${note} (${duration}) - 確実再生`);
                                } catch (error) {
                                    console.error(`❌ [BATTLE PIANO] ${note} 再生エラー:`, error);
                                }
                            }
                            resolve();
                        }, time * 500);  // 500ms基準（バトルは速め）
                    });
                    
                    // 各ノート間で状態確認
                    if (!this.isPlaying || this.currentScene !== 'battle') {
                        console.log('⚔️ [BATTLE] 途中停止検出');
                        return false;
                    }
                }
                
                console.log('⚔️ [BATTLE] シーケンス完了');
                return true;
                
            } catch (error) {
                console.error('❌ [BATTLE] シーケンス実行エラー:', error);
                return false;
            }
        };
        
        // 堅牢なループ機構
        const battleLoop = async () => {
            const success = await playBattleSequence();
            
            if (success && this.isPlaying && this.currentScene === 'battle') {
                console.log('⚔️ [BATTLE] 次のループをスケジュール...');
                this.battleBGMTimer = setTimeout(() => {
                    if (this.isPlaying && this.currentScene === 'battle') {
                        console.log('⚔️ [BATTLE] ループ再開');
                        battleLoop();
                    } else {
                        console.log('⚔️ [BATTLE] ループ停止 - isPlaying:', this.isPlaying, 'scene:', this.currentScene);
                    }
                }, 1000);  // 1秒間隔でループ
            } else {
                console.log('⚔️ [BATTLE] バトルBGMループ終了');
            }
        };
        
        // 最初のシーケンス開始
        console.log('⚔️ [BATTLE] 初回シーケンス開始...');
        battleLoop();
    }
    
    /**
     * BGM停止（強化版 - 非同期競合対応）
     */
    stopMusic() {
        console.log('⏹ [BGM] 停止 - 強化版');
        this.isPlaying = false;
        this.currentScene = null;
        
        // Battle BGM専用タイマーをクリア
        if (this.battleBGMTimer) {
            console.log('🔄 [BGM STOP] Battle BGMタイマークリア');
            clearTimeout(this.battleBGMTimer);
            this.battleBGMTimer = null;
        }
        
        // すべての音源をリリース
        Object.values(this.pianoVoices).forEach(voice => {
            if (voice && typeof voice.releaseAll === 'function') {
                voice.releaseAll();
            }
        });
        
        console.log('✅ [BGM STOP] 全BGM停止完了');
    }
    
    /**
     * 音量更新
     */
    updateVolume() {
        const volume = this.audioSystem.getCalculatedVolume('bgm', 1.0);
        const dbBase = -20 + (volume * 15);  // -20dB to -5dB range
        
        if (this.pianoVoices.main) {
            this.pianoVoices.main.volume.value = dbBase + 12;  // メイン音は大きめ
        }
        if (this.pianoVoices.harmonic1) {
            this.pianoVoices.harmonic1.volume.value = dbBase;  // 第1倍音
        }
        if (this.pianoVoices.harmonic2) {
            this.pianoVoices.harmonic2.volume.value = dbBase - 5;  // 第2倍音は控えめ
        }
        if (this.pianoVoices.attack) {
            this.pianoVoices.attack.volume.value = dbBase - 10;  // アタック音は小さく
        }
    }
}