/**
 * ProgressionGenerator - コード進行・メロディ生成エンジン
 * 音楽理論に基づいたハーモニーとメロディの自動生成
 */
export class ProgressionGenerator {
    constructor() {
        this.scales = this.initializeScales();
        this.chordTemplates = this.initializeChordTemplates();
        this.progressionTemplates = this.initializeProgressionTemplates();
        
        console.log('🎼 ProgressionGenerator: Music theory engine initialized');
    }
    
    /**
     * スケール定義初期化
     */
    initializeScales() {
        return {
            // メジャースケール
            major: [0, 2, 4, 5, 7, 9, 11],
            // ナチュラルマイナースケール
            minor: [0, 2, 3, 5, 7, 8, 10],
            // ドリアンモード
            dorian: [0, 2, 3, 5, 7, 9, 10],
            // ミクソリディアンモード
            mixolydian: [0, 2, 4, 5, 7, 9, 10],
            // ペンタトニックメジャー
            pentatonic_major: [0, 2, 4, 7, 9],
            // ペンタトニックマイナー
            pentatonic_minor: [0, 3, 5, 7, 10],
            // ブルーススケール
            blues: [0, 3, 5, 6, 7, 10]
        };
    }
    
    /**
     * コードテンプレート初期化
     */
    initializeChordTemplates() {
        return {
            // 基本三和音
            major: [0, 4, 7],
            minor: [0, 3, 7],
            diminished: [0, 3, 6],
            augmented: [0, 4, 8],
            
            // セブンスコード
            major7: [0, 4, 7, 11],
            minor7: [0, 3, 7, 10],
            dominant7: [0, 4, 7, 10],
            minor7b5: [0, 3, 6, 10],
            
            // エクステンデッドコード
            add9: [0, 4, 7, 14],
            sus2: [0, 2, 7],
            sus4: [0, 5, 7],
            
            // パワーコード
            power: [0, 7],
            
            // その他
            sixth: [0, 4, 7, 9],
            minor6: [0, 3, 7, 9]
        };
    }
    
    /**
     * コード進行テンプレート初期化
     */
    initializeProgressionTemplates() {
        return {
            // ポップスの定番
            'vi-IV-I-V': [5, 3, 0, 4], // Am-F-C-G (in C major)
            'I-V-vi-IV': [0, 4, 5, 3], // C-G-Am-F
            'ii-V-I': [1, 4, 0],       // Dm-G-C
            
            // EDMでよく使われる
            'i-VII-VI-VII': [0, 6, 5, 6], // Am-G-F-G (in A minor)
            'i-VI-III-VII': [0, 5, 2, 6], // Am-F-C-G
            'i-v-VI-iv': [0, 4, 5, 3],    // Am-Em-F-Dm
            
            // テクノ・ハウス系
            'i-VII': [0, 6],              // Am-G
            'i-iv': [0, 3],               // Am-Dm
            'VI-VII': [5, 6],             // F-G
            
            // アンビエント系
            'I-iii-vi-IV': [0, 2, 5, 3], // C-Em-Am-F
            'vi-V-IV-V': [5, 4, 3, 4],   // Am-G-F-G
            
            // ハードスタイル系
            'i-VI-VII': [0, 5, 6],        // Am-F-G
            'i-III-VII': [0, 2, 6],       // Am-C-G
            
            // トランス系
            'i-v-VI-VII': [0, 4, 5, 6],   // Am-Em-F-G
            'VI-VII-i': [5, 6, 0]         // F-G-Am
        };
    }
    
    /**
     * キーのルートノート取得
     * @param {string} key - キー名 ('C', 'Am', etc.)
     * @returns {number} MIDI番号
     */
    getKeyRoot(key) {
        const noteMap = {
            'C': 0, 'C#': 1, 'Db': 1, 'D': 2, 'D#': 3, 'Eb': 3,
            'E': 4, 'F': 5, 'F#': 6, 'Gb': 6, 'G': 7, 'G#': 8,
            'Ab': 8, 'A': 9, 'A#': 10, 'Bb': 10, 'B': 11
        };
        
        // マイナーキーの処理
        let rootNote = key;
        let isMinor = false;
        
        if (key.includes('m') && !key.includes('maj')) {
            rootNote = key.replace('m', '');
            isMinor = true;
        }
        
        return {
            root: noteMap[rootNote] || 0,
            isMinor: isMinor
        };
    }
    
    /**
     * コード進行生成
     * @param {string} key - キー
     * @param {string} progressionType - 進行タイプ
     * @returns {Array} コード進行
     */
    generateProgression(key, progressionType = 'vi-IV-I-V') {
        const keyInfo = this.getKeyRoot(key);
        const scale = keyInfo.isMinor ? this.scales.minor : this.scales.major;
        const template = this.progressionTemplates[progressionType] || this.progressionTemplates['vi-IV-I-V'];
        
        return template.map(degree => {
            const rootNote = (keyInfo.root + scale[degree]) % 12;
            const chordType = this.getChordTypeForDegree(degree, keyInfo.isMinor);
            return this.buildChord(rootNote, chordType);
        });
    }
    
    /**
     * 度数に対応するコードタイプ取得
     * @param {number} degree - 度数 (0-6)
     * @param {boolean} isMinor - マイナーキーかどうか
     * @returns {string} コードタイプ
     */
    getChordTypeForDegree(degree, isMinor) {
        if (isMinor) {
            const minorChordTypes = ['minor', 'diminished', 'major', 'minor', 'minor', 'major', 'major'];
            return minorChordTypes[degree] || 'minor';
        } else {
            const majorChordTypes = ['major', 'minor', 'minor', 'major', 'major', 'minor', 'diminished'];
            return majorChordTypes[degree] || 'major';
        }
    }
    
    /**
     * コード構築
     * @param {number} root - ルートノート
     * @param {string} chordType - コードタイプ
     * @param {number} octave - オクターブ
     * @returns {Array} 周波数配列
     */
    buildChord(root, chordType, octave = 4) {
        const template = this.chordTemplates[chordType] || this.chordTemplates.major;
        const baseFreq = this.midiToFrequency(root + octave * 12);
        
        return template.map(interval => {
            const noteNumber = root + interval;
            return this.midiToFrequency(noteNumber + octave * 12);
        });
    }
    
    /**
     * メロディ生成
     * @param {string} key - キー
     * @param {Array} progression - コード進行
     * @param {number} measures - 小節数
     * @param {string} style - スタイル
     * @returns {Array} メロディ配列
     */
    generateMelody(key, progression, measures = 4, style = 'stepwise') {
        const keyInfo = this.getKeyRoot(key);
        const scale = keyInfo.isMinor ? this.scales.minor : this.scales.major;
        const scaleNotes = scale.map(interval => (keyInfo.root + interval) % 12);
        
        const melody = [];
        let currentNote = scaleNotes[Math.floor(scaleNotes.length / 2)]; // スケールの中央から開始
        
        const notesPerMeasure = 8; // 8分音符基準
        const totalNotes = measures * notesPerMeasure;
        
        for (let i = 0; i < totalNotes; i++) {
            const chordIndex = Math.floor(i / notesPerMeasure) % progression.length;
            const chord = progression[chordIndex];
            
            switch (style) {
                case 'stepwise':
                    currentNote = this.generateStepwiseNote(currentNote, scaleNotes);
                    break;
                case 'chordal':
                    currentNote = this.generateChordalNote(chord);
                    break;
                case 'arpeggiated':
                    currentNote = chord[i % chord.length];
                    break;
                case 'random':
                    currentNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
                    break;
                default:
                    currentNote = this.generateStepwiseNote(currentNote, scaleNotes);
            }
            
            const octave = 5; // メロディオクターブ
            const frequency = this.midiToFrequency(currentNote + octave * 12);
            const duration = 0.25; // 8分音符
            
            melody.push({
                frequency: frequency,
                duration: duration,
                time: i * duration,
                note: currentNote
            });
        }
        
        return melody;
    }
    
    /**
     * 段階的メロディノート生成
     * @param {number} currentNote - 現在のノート
     * @param {Array} scaleNotes - スケールノート配列
     * @returns {number} 次のノート
     */
    generateStepwiseNote(currentNote, scaleNotes) {
        const currentIndex = scaleNotes.indexOf(currentNote);
        const direction = Math.random() < 0.5 ? -1 : 1;
        const step = Math.random() < 0.7 ? 1 : 2; // 70%の確率で1度、30%で2度
        
        let nextIndex = currentIndex + (direction * step);
        
        // スケール範囲内に収める
        if (nextIndex < 0) nextIndex = 0;
        if (nextIndex >= scaleNotes.length) nextIndex = scaleNotes.length - 1;
        
        return scaleNotes[nextIndex];
    }
    
    /**
     * コード音に基づくメロディノート生成
     * @param {Array} chord - コード配列
     * @returns {number} ノート
     */
    generateChordalNote(chord) {
        // コードノートを MIDI番号に変換
        const chordMidi = chord.map(freq => this.frequencyToMidi(freq));
        return chordMidi[Math.floor(Math.random() * chordMidi.length)];
    }
    
    /**
     * ベースライン生成
     * @param {Array} progression - コード進行
     * @param {string} pattern - パターン
     * @returns {Array} ベースライン
     */
    generateBassline(progression, pattern = 'root') {
        const bassline = [];
        
        progression.forEach((chord, index) => {
            const root = chord[0]; // コードのルート音
            const fifth = chord.length > 2 ? chord[2] : root * Math.pow(2, 7/12); // 5度
            
            switch (pattern) {
                case 'root':
                    bassline.push({
                        frequency: root / 4, // 1オクターブ下
                        duration: 1.0,
                        time: index * 1.0
                    });
                    break;
                    
                case 'root_fifth':
                    bassline.push({
                        frequency: root / 4,
                        duration: 0.5,
                        time: index * 1.0
                    });
                    bassline.push({
                        frequency: fifth / 4,
                        duration: 0.5,
                        time: index * 1.0 + 0.5
                    });
                    break;
                    
                case 'walking':
                    // ウォーキングベース（簡略版）
                    const walkingNotes = this.generateWalkingBass(progression, index);
                    bassline.push(...walkingNotes);
                    break;
                    
                default:
                    bassline.push({
                        frequency: root / 4,
                        duration: 1.0,
                        time: index * 1.0
                    });
            }
        });
        
        return bassline;
    }
    
    /**
     * ウォーキングベース生成
     * @param {Array} progression - コード進行
     * @param {number} chordIndex - コードインデックス
     * @returns {Array} ベースノート配列
     */
    generateWalkingBass(progression, chordIndex) {
        const currentChord = progression[chordIndex];
        const nextChord = progression[(chordIndex + 1) % progression.length];
        
        const currentRoot = currentChord[0];
        const nextRoot = nextChord[0];
        
        // 簡単なウォーキングライン生成
        const notes = [];
        const quarterNotes = 4; // 4分音符4つ
        
        for (let i = 0; i < quarterNotes; i++) {
            let frequency;
            
            if (i === 0) {
                frequency = currentRoot / 4; // ルート音
            } else if (i === 3) {
                // 次のコードへのアプローチノート
                const approach = this.getApproachNote(currentRoot, nextRoot);
                frequency = approach / 4;
            } else {
                // コードトーンまたは経過音
                frequency = currentChord[i % currentChord.length] / 4;
            }
            
            notes.push({
                frequency: frequency,
                duration: 0.25,
                time: chordIndex * 1.0 + i * 0.25
            });
        }
        
        return notes;
    }
    
    /**
     * アプローチノート取得
     * @param {number} fromNote - 開始ノート
     * @param {number} toNote - 目標ノート
     * @returns {number} アプローチノート
     */
    getApproachNote(fromNote, toNote) {
        const fromMidi = this.frequencyToMidi(fromNote);
        const toMidi = this.frequencyToMidi(toNote);
        
        // 半音下からのアプローチ
        if (toMidi > fromMidi) {
            return this.midiToFrequency(toMidi - 1);
        } else {
            return this.midiToFrequency(toMidi + 1);
        }
    }
    
    /**
     * アルペジオパターン生成
     * @param {Array} chord - コード
     * @param {string} pattern - パターン
     * @param {number} octaves - オクターブ数
     * @returns {Array} アルペジオ配列
     */
    generateArpeggio(chord, pattern = 'up', octaves = 2) {
        const arpeggio = [];
        let notes = [];
        
        // 複数オクターブに展開
        for (let oct = 0; oct < octaves; oct++) {
            chord.forEach(freq => {
                notes.push(freq * Math.pow(2, oct));
            });
        }
        
        switch (pattern) {
            case 'up':
                // 上行
                notes.forEach((freq, index) => {
                    arpeggio.push({
                        frequency: freq,
                        duration: 0.25,
                        time: index * 0.25
                    });
                });
                break;
                
            case 'down':
                // 下行
                notes.reverse().forEach((freq, index) => {
                    arpeggio.push({
                        frequency: freq,
                        duration: 0.25,
                        time: index * 0.25
                    });
                });
                break;
                
            case 'up_down':
                // 上行後下行
                notes.forEach((freq, index) => {
                    arpeggio.push({
                        frequency: freq,
                        duration: 0.125,
                        time: index * 0.125
                    });
                });
                notes.reverse().slice(1, -1).forEach((freq, index) => {
                    arpeggio.push({
                        frequency: freq,
                        duration: 0.125,
                        time: (notes.length + index) * 0.125
                    });
                });
                break;
                
            case 'random':
                // ランダム順序
                const shuffled = [...notes].sort(() => Math.random() - 0.5);
                shuffled.forEach((freq, index) => {
                    arpeggio.push({
                        frequency: freq,
                        duration: 0.25,
                        time: index * 0.25
                    });
                });
                break;
        }
        
        return arpeggio;
    }
    
    /**
     * MIDI番号から周波数に変換
     * @param {number} midiNote - MIDI番号
     * @returns {number} 周波数
     */
    midiToFrequency(midiNote) {
        return 440 * Math.pow(2, (midiNote - 69) / 12);
    }
    
    /**
     * 周波数からMIDI番号に変換
     * @param {number} frequency - 周波数
     * @returns {number} MIDI番号
     */
    frequencyToMidi(frequency) {
        return Math.round(69 + 12 * Math.log2(frequency / 440));
    }
    
    /**
     * スケール取得
     * @param {string} key - キー
     * @param {string} scaleType - スケールタイプ
     * @param {number} octave - オクターブ
     * @returns {Array} 周波数配列
     */
    getScale(key, scaleType = 'major', octave = 4) {
        const keyInfo = this.getKeyRoot(key);
        const scale = this.scales[scaleType] || this.scales.major;
        
        return scale.map(interval => {
            const noteNumber = keyInfo.root + interval + octave * 12;
            return this.midiToFrequency(noteNumber);
        });
    }
    
    /**
     * コード名取得
     * @param {number} root - ルートノート
     * @param {string} chordType - コードタイプ
     * @returns {string} コード名
     */
    getChordName(root, chordType) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootName = noteNames[root % 12];
        
        const typeNames = {
            'major': '',
            'minor': 'm',
            'diminished': 'dim',
            'augmented': 'aug',
            'major7': 'maj7',
            'minor7': 'm7',
            'dominant7': '7',
            'minor7b5': 'm7b5',
            'add9': 'add9',
            'sus2': 'sus2',
            'sus4': 'sus4',
            'power': '5',
            'sixth': '6',
            'minor6': 'm6'
        };
        
        return rootName + (typeNames[chordType] || '');
    }
}