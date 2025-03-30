export class SoundSystem {
    constructor() {
        this.sounds = {};
        this.music = {};
        this.muted = false;
        this.musicMuted = false;
        this.currentTrack = null;
        this.musicVolume = 0.3; // Lower default volume for background music
        this.soundVolume = 0.5; // Regular volume for sound effects
        this.alarmInterval = null;
        this.speechSynth = window.speechSynthesis;
        this.voices = [];
        
        // Load voices when they're available
        if (this.speechSynth) {
            // In some browsers, voices load asynchronously
            this.speechSynth.onvoiceschanged = () => {
                this.voices = this.speechSynth.getVoices();
            };
            // Try to load voices immediately as well
            this.voices = this.speechSynth.getVoices();
        }

        // Add demotivating quips for the manager
        this.demotivatingQuips = [
            "That's coming out of your pay.",
            "My five-year-old could do better than that.",
            "This is why we can't have nice things.",
            "I'm not angry, just disappointed.",
            "Is this really your best effort?",
            "The quota isn't going to meet itself.",
            "Numbers don't grow on trees, you know.",
            "Another failure? What a surprise.",
            "Your performance review isn't looking good.",
            "The sun is getting impatient.",
            "Try hitting the nodes, not missing them.",
            "Maybe this job isn't for you.",
            "Do I need to replace you with an intern?",
            "Mediocrity at its finest.",
            "This factory doesn't run on excuses."
        ];

        // Track recently used quips to avoid repetition
        this.recentQuips = [];
        this.maxRecentQuips = 5; // Don't repeat any of the last 5 quips

        this.initializeSounds();
        this.initializeMusic();
    }

    initializeSounds() {
        // Create audio elements for different game sounds
        this.createSound('launch', 'swoosh', 'audio/launch.mp3');
        this.createSound('peg_hit', 'click', 'audio/peg_hit.mp3');
        this.createSound('number_hit', 'coin', 'audio/number_hit.mp3');
        this.createSound('day_complete', 'success', 'audio/day_complete.mp3');
        this.createSound('game_over', 'explosion', 'audio/game_over.mp3');
        this.createSound('synergy', 'powerup', 'audio/synergy.mp3');
        this.createSound('special_node', 'special', 'audio/special_node.mp3');
        this.createSound('achievement', 'achievement', 'audio/achievement.mp3');
        this.createSound('alarm', 'alarm', 'audio/alarm.mp3');
        
        // Create fallback audio for testing when files aren't available
        this.createFallbackAudio();
    }
    
    initializeMusic() {
        // Create background music tracks
        this.createMusicTrack('main_theme', 'audio/music/main_theme.mp3');
        this.createMusicTrack('gameplay', 'audio/music/gameplay.mp3');
        this.createMusicTrack('shop', 'audio/music/shop.mp3');
        this.createMusicTrack('game_over', 'audio/music/game_over.mp3');
    }

    createSound(id, type, src) {
        const audio = new Audio();
        
        // Try to load the audio file
        audio.src = src;
        audio.volume = this.soundVolume;
        audio.preload = 'auto';
        
        // Store in our collection
        this.sounds[id] = audio;
        
        // Handle loading errors by setting up fallback oscillator sounds
        audio.addEventListener('error', () => {
            console.log(`Audio file not found for ${id}, using fallback sound`);
            this.sounds[id].fallback = true;
        });
    }
    
    createMusicTrack(id, src) {
        const audio = new Audio();
        audio.src = src;
        audio.volume = this.musicVolume;
        audio.loop = true;
        
        // Store in our music collection
        this.music[id] = audio;
        
        // Handle loading errors
        audio.addEventListener('error', () => {
            console.log(`Music track not found: ${id}, will use fallback music`);
            this.music[id].fallback = true;
        });
    }

    createFallbackAudio() {
        // Create AudioContext for fallback sounds
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
        } catch (e) {
            console.warn('Web Audio API not supported in this browser');
        }
    }

    playSound(id) {
        if (this.muted || !this.sounds[id]) return;
        
        // If we have the audio file, play it normally
        if (!this.sounds[id].fallback) {
            const sound = this.sounds[id].cloneNode();
            sound.volume = this.sounds[id].volume;
            
            sound.play().catch(e => {
                console.log('Sound playback prevented:', e);
                this.playFallbackSound(id);
            });
        }
        // Otherwise use the fallback oscillator sound
        else {
            this.playFallbackSound(id);
        }
    }
    
    playMusic(trackId) {
        // If we're already playing this track, don't restart it
        if (this.currentTrack === trackId) return;
        
        // Stop any currently playing music
        this.stopMusic();
        
        // If music is muted or track doesn't exist, don't play
        if (this.musicMuted || !this.music[trackId]) return;
        
        // Set current track
        this.currentTrack = trackId;
        
        // Play the music track or fallback
        if (!this.music[trackId].fallback) {
            this.music[trackId].currentTime = 0;
            this.music[trackId].play().catch(e => {
                console.log('Music playback prevented:', e);
                this.generateFallbackMusic(trackId);
            });
        } else {
            this.generateFallbackMusic(trackId);
        }
    }
    
    stopMusic() {
        // Stop all music tracks
        Object.values(this.music).forEach(track => {
            if (track instanceof Audio) {
                track.pause();
                track.currentTime = 0;
            }
        });
        
        // Stop any fallback music
        if (this.fallbackMusicInterval) {
            clearInterval(this.fallbackMusicInterval);
            this.fallbackMusicInterval = null;
        }
        
        this.currentTrack = null;
    }
    
    toggleMusic() {
        this.musicMuted = !this.musicMuted;
        
        if (this.musicMuted) {
            this.stopMusic();
        } else if (this.currentTrack) {
            // Resume current track if there is one
            this.playMusic(this.currentTrack);
        }
        
        return this.musicMuted;
    }
    
    toggleMute() {
        this.muted = !this.muted;
        return this.muted;
    }
    
    setMusicVolume(volume) {
        this.musicVolume = Math.max(0, Math.min(1, volume));
        Object.values(this.music).forEach(track => {
            if (track instanceof Audio) {
                track.volume = this.musicVolume;
            }
        });
    }

    setVolume(id, volume) {
        if (this.sounds[id]) {
            this.sounds[id].volume = Math.max(0, Math.min(1, volume));
        }
    }
    
    playFallbackSound(id) {
        if (!this.audioContext) return;
        
        // Create oscillator for fallback sounds
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Configure sound based on type
        switch(id) {
            case 'launch':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                gainNode.gain.value = 0.3;
                break;
            
            case 'peg_hit':
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(300, this.audioContext.currentTime + 0.1);
                gainNode.gain.value = 0.2;
                break;
            
            case 'number_hit':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.3);
                gainNode.gain.value = 0.3;
                break;
                
            case 'day_complete':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(1320, this.audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(1760, this.audioContext.currentTime + 0.4);
                gainNode.gain.value = 0.3;
                break;
                
            case 'game_over':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(110, this.audioContext.currentTime + 1.0);
                gainNode.gain.value = 0.3;
                break;
                
            case 'synergy':
            case 'special_node':
            case 'achievement':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
                oscillator.frequency.setValueAtTime(1320, this.audioContext.currentTime + 0.2);
                gainNode.gain.value = 0.3;
                break;
                
            case 'alarm':
                oscillator.type = 'square';
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime + 0.2);
                oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.4);
                gainNode.gain.value = 0.4; // Louder for alarm
                break;
                
            default:
                oscillator.type = 'sine';
                oscillator.frequency.value = 440;
                gainNode.gain.value = 0.2;
        }
        
        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        
        // Stop after a short duration
        const duration = id === 'game_over' ? 1.0 : 0.3;
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    generateFallbackMusic(trackId) {
        // Clear any existing fallback music
        if (this.fallbackMusicInterval) {
            clearInterval(this.fallbackMusicInterval);
        }
        
        if (!this.audioContext) {
            try {
                window.AudioContext = window.AudioContext || window.webkitAudioContext;
                this.audioContext = new AudioContext();
            } catch (e) {
                console.warn('Web Audio API not supported in this browser');
                return;
            }
        }
        
        // Define synth wave patterns for different tracks
        const patterns = {
            main_theme: [
                { note: 'C4', duration: 0.2, type: 'sawtooth' },
                { note: 'E4', duration: 0.2, type: 'sawtooth' },
                { note: 'G4', duration: 0.2, type: 'sawtooth' },
                { note: 'B4', duration: 0.2, type: 'sawtooth' },
                { note: 'C5', duration: 0.4, type: 'sawtooth' },
                { note: 'B4', duration: 0.2, type: 'sawtooth' },
                { note: 'G4', duration: 0.2, type: 'sawtooth' },
                { note: 'E4', duration: 0.2, type: 'sawtooth' }
            ],
            gameplay: [
                { note: 'G3', duration: 0.1, type: 'square' },
                { note: 'C4', duration: 0.1, type: 'square' },
                { note: 'D4', duration: 0.1, type: 'square' },
                { note: 'F4', duration: 0.2, type: 'square' },
                { note: 'G4', duration: 0.2, type: 'square' },
                { note: 'F4', duration: 0.1, type: 'square' },
                { note: 'D4', duration: 0.1, type: 'square' },
                { note: 'C4', duration: 0.1, type: 'square' }
            ],
            shop: [
                { note: 'E4', duration: 0.3, type: 'sine' },
                { note: 'A4', duration: 0.3, type: 'sine' },
                { note: 'B4', duration: 0.3, type: 'sine' },
                { note: 'C5', duration: 0.6, type: 'sine' },
                { note: 'B4', duration: 0.3, type: 'sine' },
                { note: 'A4', duration: 0.3, type: 'sine' }
            ],
            game_over: [
                { note: 'A3', duration: 0.4, type: 'triangle' },
                { note: 'F3', duration: 0.4, type: 'triangle' },
                { note: 'D3', duration: 0.4, type: 'triangle' },
                { note: 'C3', duration: 0.8, type: 'triangle' }
            ]
        };
        
        // Use default pattern if the requested track pattern doesn't exist
        const pattern = patterns[trackId] || patterns.main_theme;
        
        // Create a sequence player for the pattern
        let noteIndex = 0;
        this.fallbackMusicInterval = setInterval(() => {
            if (this.musicMuted) return;
            
            const noteData = pattern[noteIndex];
            this.playMusicNote(noteData.note, noteData.duration, noteData.type);
            
            // Move to next note in pattern
            noteIndex = (noteIndex + 1) % pattern.length;
        }, 400); // Notes every 400ms for a retro arcade feel
    }
    
    playMusicNote(noteName, duration, type = 'sine') {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Map note names to frequencies (basic implementation)
        const noteFrequencies = {
            'C3': 130.81, 'D3': 146.83, 'E3': 164.81, 'F3': 174.61, 
            'G3': 196.00, 'A3': 220.00, 'B3': 246.94,
            'C4': 261.63, 'D4': 293.66, 'E4': 329.63, 'F4': 349.23, 
            'G4': 392.00, 'A4': 440.00, 'B4': 493.88,
            'C5': 523.25, 'D5': 587.33, 'E5': 659.26, 'F5': 698.46, 
            'G5': 783.99, 'A5': 880.00, 'B5': 987.77
        };
        
        // Set oscillator properties
        oscillator.type = type;
        oscillator.frequency.value = noteFrequencies[noteName] || 440;
        
        // Set volume and envelope
        gainNode.gain.value = this.musicVolume * 0.3;
        gainNode.gain.setValueAtTime(this.musicVolume * 0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);
        
        // Connect and play
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    startAlarm() {
        // Clear any existing alarm
        this.stopAlarm();
        
        // Play alarm sound repeatedly
        this.playSound('alarm');
        this.alarmInterval = setInterval(() => {
            if (!this.muted) {
                this.playSound('alarm');
            }
        }, 1000); // Repeat every second
    }
    
    stopAlarm() {
        if (this.alarmInterval) {
            clearInterval(this.alarmInterval);
            this.alarmInterval = null;
        }
    }

    speakMessage(message, options = {}) {
        if (!this.speechSynth) return;
        
        // Cancel any current speech
        this.speechSynth.cancel();
        
        // Don't speak if muted
        if (this.muted) return;
        
        const utterance = new SpeechSynthesisUtterance(message);
        
        // Set voice properties for a synthetic/robotic sound
        utterance.rate = options.rate || 0.9;  // Slightly slower for emphasis
        utterance.pitch = options.pitch || 0.5; // Lower pitch for ominous effect
        utterance.volume = options.volume || 1.0;
        
        // Choose a more robotic-sounding voice if available
        if (this.voices.length > 0) {
            // Try to find a good voice for this effect
            const preferredVoice = this.voices.find(v => 
                v.name.includes('Microsoft') || v.name.includes('Google'));
            
            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }
        }
        
        // Speak the message
        this.speechSynth.speak(utterance);
    }
    
    speakGameOverMessage() {
        this.speakMessage("Nice going, you ruined the world.", {
            rate: 0.85,
            pitch: 0.3,
            volume: 1.0
        });
    }

    speakDemotivatingQuip() {
        if (!this.speechSynth || this.muted) return;
        
        // Filter out recently used quips to avoid repetition
        const availableQuips = this.demotivatingQuips.filter(
            quip => !this.recentQuips.includes(quip)
        );
        
        // If we've used all quips, reset the recent list but keep the last one to avoid immediate repetition
        if (availableQuips.length === 0) {
            const lastQuip = this.recentQuips[this.recentQuips.length - 1];
            this.recentQuips = [lastQuip];
            
            // Now all quips except the last one are available
            const availableQuips = this.demotivatingQuips.filter(
                quip => quip !== lastQuip
            );
        }
        
        // Choose a random quip from available ones
        const quip = availableQuips[Math.floor(Math.random() * availableQuips.length)];
        
        // Add to recent quips
        this.recentQuips.push(quip);
        
        // Keep only the most recent quips up to maxRecentQuips
        if (this.recentQuips.length > this.maxRecentQuips) {
            this.recentQuips.shift(); // Remove oldest quip
        }
        
        this.speakMessage(quip, {
            rate: 0.9,
            pitch: 0.4,
            volume: 0.9
        });
    }
}
