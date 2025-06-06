import { AUDIO_CONFIG } from '../config/gameConfig.js';

export class AudioManager {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.musicGain = null;
        this.sfxGain = null;
        this.musicTimeoutId = null;
    }
    
    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            if (this.context.state === 'suspended') {
                this.context.resume();
            }
            
            this.masterGain = this.context.createGain();
            this.masterGain.gain.value = AUDIO_CONFIG.MASTER_VOLUME;
            this.masterGain.connect(this.context.destination);

            this.musicGain = this.context.createGain();
            this.musicGain.gain.value = AUDIO_CONFIG.MUSIC_VOLUME;
            this.musicGain.connect(this.masterGain);

            this.sfxGain = this.context.createGain();
            this.sfxGain.gain.value = AUDIO_CONFIG.SFX_VOLUME;
            this.sfxGain.connect(this.masterGain);

            if (this.context.state === 'running') {
                // Ready to play audio
            } else {
                this.context.addEventListener('statechange', () => {
                    if (this.context.state === 'running') {
                        // Audio context is now ready
                    }
                });
            }
        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }
    
    playSound(type, frequency = 440, duration = 0.1) {
        if (!this.context || this.context.state !== 'running') return;
        
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        
        switch(type) {
            case 'hit':
                osc.type = 'square';
                osc.frequency.value = frequency;
                gain.gain.setValueAtTime(0.3, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
                break;
            case 'pickup':
                osc.type = 'sine';
                osc.frequency.setValueAtTime(frequency, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(frequency * 2, this.context.currentTime + duration);
                gain.gain.setValueAtTime(0.2, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
                break;
            case 'levelup':
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(frequency, this.context.currentTime);
                osc.frequency.exponentialRampToValueAtTime(frequency * 4, this.context.currentTime + duration);
                gain.gain.setValueAtTime(0.4, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.001, this.context.currentTime + duration);
                break;
        }
        
        osc.connect(gain);
        gain.connect(this.sfxGain);
        osc.start();
        osc.stop(this.context.currentTime + duration);
    }
    
    generateMusic(playerLevel, feverMode, gameRunning, gamePaused) {
        if (!this.context || this.context.state !== 'running' || !gameRunning) return;
        
        const now = this.context.currentTime;
        const levelIntensity = Math.min(playerLevel / 10, 1);
        const tempo = AUDIO_CONFIG.BASE_TEMPO + (levelIntensity * AUDIO_CONFIG.TEMPO_INCREASE_PER_LEVEL);
        const barDuration = (60 / tempo) * 4;

        this.createBass(now, barDuration, levelIntensity, playerLevel, feverMode);
        this.createDrums(now, barDuration, levelIntensity, playerLevel);
        
        if (playerLevel > 2 || feverMode) {
            this.createHiHats(now, barDuration);
        }
        
        if (feverMode || playerLevel > 4) {
            this.createMelody(now, barDuration, feverMode);
        }
        
        if (playerLevel > 5) {
            this.createSnare(now, barDuration);
        }

        const schedulingDelay = Math.max(1000, barDuration * 800);
        if (gameRunning && this.context && !gamePaused) {
            clearTimeout(this.musicTimeoutId);
            this.musicTimeoutId = setTimeout(() => {
                if (gameRunning && this.context && this.context.state === 'running' && !gamePaused) {
                    this.generateMusic(playerLevel, feverMode, gameRunning, gamePaused);
                }
            }, schedulingDelay);
        }
    }
    
    createBass(now, barDuration, levelIntensity, playerLevel, feverMode) {
        const bassPatterns = [
            [55, 55, 82.5, 55],
            [55, 82.5, 55, 82.5],
            [55, 82.5, 110, 82.5],
            [55, 110, 82.5, 110],
        ];
        const patternIndex = Math.min(Math.floor((playerLevel - 1) / 2), bassPatterns.length - 1);
        const bassFreqs = feverMode ? [55, 82.5, 110, 82.5, 55, 110, 82.5, 110] : bassPatterns[patternIndex];
        
        for (let i = 0; i < bassFreqs.length; i++) {
            const bass = this.context.createOscillator();
            const bassGain = this.context.createGain();
            bass.type = levelIntensity > 0.5 ? 'square' : 'sawtooth';
            bass.frequency.value = bassFreqs[i % bassFreqs.length];
            bassGain.gain.value = 0.4 + (levelIntensity * 0.2);
            bassGain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * barDuration / bassFreqs.length);
            bass.connect(bassGain);
            bassGain.connect(this.musicGain);
            bass.start(now + i * barDuration / bassFreqs.length);
            bass.stop(now + (i + 1) * barDuration / bassFreqs.length);
        }
    }
    
    createDrums(now, barDuration, levelIntensity, playerLevel) {
        const kickPattern = playerLevel > 5 ? 8 : 4;
        for (let i = 0; i < kickPattern; i++) {
            const kick = this.context.createOscillator();
            const kickGain = this.context.createGain();
            kick.type = 'sine';
            kick.frequency.setValueAtTime(60, now + i * barDuration / kickPattern);
            kick.frequency.exponentialRampToValueAtTime(30, now + i * barDuration / kickPattern + 0.1);
            kickGain.gain.setValueAtTime(0.6 + (levelIntensity * 0.2), now + i * barDuration / kickPattern);
            kickGain.gain.exponentialRampToValueAtTime(0.001, now + i * barDuration / kickPattern + 0.1);
            kick.connect(kickGain);
            kickGain.connect(this.musicGain);
            kick.start(now + i * barDuration / kickPattern);
            kick.stop(now + i * barDuration / kickPattern + 0.2);
        }
    }
    
    createHiHats(now, barDuration) {
        const hihatPattern = 8;
        for (let i = 0; i < hihatPattern; i++) {
            const hihat = this.context.createOscillator();
            const hihatGain = this.context.createGain();
            const hihatFilter = this.context.createBiquadFilter();
            hihatFilter.type = 'highpass';
            hihatFilter.frequency.value = 8000;
            hihat.type = 'square';
            hihat.frequency.value = 1000;
            hihatGain.gain.setValueAtTime(0.08, now + i * barDuration / hihatPattern);
            hihatGain.gain.exponentialRampToValueAtTime(0.001, now + i * barDuration / hihatPattern + 0.02);
            hihat.connect(hihatFilter);
            hihatFilter.connect(hihatGain);
            hihatGain.connect(this.musicGain);
            hihat.start(now + i * barDuration / hihatPattern);
            hihat.stop(now + i * barDuration / hihatPattern + 0.02);
        }
    }
    
    createMelody(now, barDuration, feverMode) {
        const baseNotes = [220, 261.5, 329.5, 392, 440, 523, 659, 784];
        const noteCount = 8;
        
        for (let i = 0; i < noteCount; i++) {
            const melody = this.context.createOscillator();
            const melodyGain = this.context.createGain();
            
            melody.type = 'triangle';
            melody.frequency.value = baseNotes[i % baseNotes.length];
            
            const volume = feverMode ? 0.25 : 0.15;
            melodyGain.gain.setValueAtTime(volume, now + i * barDuration / noteCount);
            melodyGain.gain.exponentialRampToValueAtTime(0.001, now + (i + 1) * barDuration / noteCount);
            
            melody.connect(melodyGain);
            melodyGain.connect(this.musicGain);
            melody.start(now + i * barDuration / noteCount);
            melody.stop(now + (i + 1) * barDuration / noteCount);
        }
    }
    
    createSnare(now, barDuration) {
        for (let i = 1; i < 4; i += 2) {
            const snare = this.context.createOscillator();
            const snareGain = this.context.createGain();
            const snareFilter = this.context.createBiquadFilter();
            
            snareFilter.type = 'highpass';
            snareFilter.frequency.value = 200;
            snare.type = 'square';
            snare.frequency.value = 200;
            
            snareGain.gain.setValueAtTime(0.25, now + i * barDuration / 4);
            snareGain.gain.exponentialRampToValueAtTime(0.001, now + i * barDuration / 4 + 0.05);
            
            snare.connect(snareFilter);
            snareFilter.connect(snareGain);
            snareGain.connect(this.musicGain);
            snare.start(now + i * barDuration / 4);
            snare.stop(now + i * barDuration / 4 + 0.05);
        }
    }
    
    stopMusic() {
        if (this.musicTimeoutId) {
            clearTimeout(this.musicTimeoutId);
            this.musicTimeoutId = null;
        }
    }
}