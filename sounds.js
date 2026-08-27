/* ============================================
   ZI GAME — PROCEDURAL SOUND ENGINE
   Background music & SFX via Web Audio API
   No external files needed!
   ============================================ */

const SoundEngine = (() => {
    let ctx = null;
    let masterGain = null;
    let musicGain = null;
    let sfxGain = null;
    let muted = false;
    let musicPlaying = false;
    let musicNodes = [];
    let musicTimer = null;

    function init() {
        if (ctx) return;
        try {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            if (AudioContextClass) {
                ctx = new AudioContextClass();
                masterGain = ctx.createGain();
                masterGain.gain.value = 1.0;
                masterGain.connect(ctx.destination);

                musicGain = ctx.createGain();
                musicGain.gain.value = 1.0;
                musicGain.connect(masterGain);

                sfxGain = ctx.createGain();
                sfxGain.gain.value = 0.5;
                sfxGain.connect(masterGain);
            } else {
                console.warn('Web Audio API is not supported in this browser.');
                muted = true;
            }
        } catch (e) {
            console.error('Failed to initialize AudioContext:', e);
            muted = true;
        }
    }

    function ensureCtx() {
        if (!ctx) init();
        if (ctx && ctx.state === 'suspended') {
            try {
                ctx.resume();
            } catch (e) {
                console.error('Failed to resume AudioContext:', e);
            }
        }
    }

    // --- UTILITY: Play a note ---
    function playNote(freq, duration, type = 'sine', gainNode = sfxGain, vol = 0.3) {
        ensureCtx();
        if (!ctx) return null;
        try {
            const osc = ctx.createOscillator();
            const g = ctx.createGain();
            osc.type = type;
            osc.frequency.value = freq;
            g.gain.setValueAtTime(vol, ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
            osc.connect(g);
            g.connect(gainNode);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + duration);
            return osc;
        } catch (e) {
            console.error('Error playing note:', e);
            return null;
        }
    }

    // --- UTILITY: Play melody sequence ---
    function playMelody(notes, type, gainNode, vol, tempo) {
        ensureCtx();
        if (!ctx) return 0;
        try {
            let time = ctx.currentTime;
            notes.forEach(([freq, dur]) => {
                if (freq > 0) {
                    const osc = ctx.createOscillator();
                    const g = ctx.createGain();
                    osc.type = type;
                    osc.frequency.value = freq;
                    g.gain.setValueAtTime(vol, time);
                    g.gain.exponentialRampToValueAtTime(0.001, time + dur * tempo * 0.9);
                    osc.connect(g);
                    g.connect(gainNode);
                    osc.start(time);
                    osc.stop(time + dur * tempo);
                    musicNodes.push(osc);
                }
                time += dur * tempo;
            });
            return time - ctx.currentTime;
        } catch (e) {
            console.error('Error playing melody:', e);
            return 0;
        }
    }

    // ==========================================
    //  BACKGROUND MUSIC DEFINITIONS
    // ==========================================

    const musicDefs = {


        // Tic Tac Toe: Calm strategic ambient
        tictactoe() {
            const notes = [
                [523, 1], [659, 1], [784, 1], [659, 1],
                [587, 1], [698, 1], [880, 1], [698, 1],
                [523, 1], [784, 1], [1047, 1.5], [0, 0.5],
                [880, 1], [784, 1], [659, 1.5], [0, 0.5],
            ];
            return playMelody(notes, 'sine', musicGain, 0.12, 0.4);
        },

        // Snake: Retro 8-bit chase music
        snake() {
            const notes = [
                [330, 0.5], [392, 0.5], [440, 0.5], [523, 0.5],
                [440, 0.5], [392, 0.5], [330, 0.5], [294, 0.5],
                [262, 0.5], [294, 0.5], [330, 0.5], [392, 0.5],
                [330, 0.5], [294, 0.5], [262, 1], [0, 0.5],
                [392, 0.5], [440, 0.5], [523, 0.5], [587, 0.5],
                [523, 0.5], [440, 0.5], [392, 0.5], [330, 0.5],
                [294, 0.5], [330, 0.5], [392, 0.5], [330, 1],
                [0, 1],
            ];
            return playMelody(notes, 'square', musicGain, 0.08, 0.22);
        },

        // Pong: Classic arcade bounce beat
        pong() {
            const notes = [
                [440, 0.5], [0, 0.5], [554, 0.5], [0, 0.5],
                [659, 0.5], [0, 0.5], [554, 0.5], [0, 0.5],
                [440, 1], [0, 0.5], [330, 0.5], [440, 0.5],
                [0, 0.5], [554, 1], [0, 1],
                [659, 0.5], [0, 0.5], [554, 0.5], [0, 0.5],
                [440, 0.5], [0, 0.5], [330, 0.5], [0, 0.5],
                [262, 1], [0, 1],
            ];
            return playMelody(notes, 'square', musicGain, 0.07, 0.2);
        },

        // Memory: Gentle puzzle music
        memory() {
            const notes = [
                [523, 1.5], [659, 1], [784, 1.5], [0, 0.5],
                [698, 1], [659, 1], [523, 1.5], [0, 0.5],
                [440, 1.5], [523, 1], [659, 1.5], [0, 0.5],
                [587, 1], [523, 1], [440, 1.5], [0, 1],
            ];
            return playMelody(notes, 'sine', musicGain, 0.1, 0.35);
        },

        // Space Shooter: Epic sci-fi bass
        spaceshooter() {
            const notes = [
                [131, 1], [147, 1], [165, 1], [175, 1],
                [196, 1], [175, 1], [165, 1], [147, 1],
                [131, 1], [110, 1], [131, 1], [165, 1],
                [196, 2], [0, 1], [175, 1], [165, 1],
                [147, 2], [0, 1],
            ];
            return playMelody(notes, 'sawtooth', musicGain, 0.06, 0.25);
        },

        // Dino Run: Fast-paced running beat
        dinorun() {
            const notes = [
                [330, 0.25], [330, 0.25], [392, 0.25], [440, 0.25],
                [523, 0.5], [440, 0.25], [392, 0.25],
                [330, 0.25], [294, 0.25], [330, 0.25], [392, 0.25],
                [330, 0.5], [0, 0.5],
                [440, 0.25], [440, 0.25], [523, 0.25], [587, 0.25],
                [659, 0.5], [587, 0.25], [523, 0.25],
                [440, 0.25], [392, 0.25], [440, 0.5],
                [0, 0.5],
            ];
            return playMelody(notes, 'square', musicGain, 0.07, 0.18);
        },

        // Tetris: Classic Tetris-inspired melody (Korobeiniki-like)
        tetris() {
            const notes = [
                [659, 1], [494, 0.5], [523, 0.5], [587, 1], [523, 0.5], [494, 0.5],
                [440, 1], [440, 0.5], [523, 0.5], [659, 1], [587, 0.5], [523, 0.5],
                [494, 1], [494, 0.5], [523, 0.5], [587, 1], [659, 1],
                [523, 1], [440, 1], [440, 1], [0, 1],
                [587, 1], [698, 0.5], [880, 1], [784, 0.5], [698, 0.5],
                [659, 1.5], [523, 0.5], [659, 1], [587, 0.5], [523, 0.5],
                [494, 1], [494, 0.5], [523, 0.5], [587, 1], [659, 1],
                [523, 1], [440, 1], [440, 1], [0, 1],
            ];
            return playMelody(notes, 'square', musicGain, 0.08, 0.2);
        },

        // 2048: Calm ambient puzzle
        puzzle2048() {
            const notes = [
                [262, 2], [330, 2], [392, 2], [0, 1],
                [349, 2], [440, 2], [523, 2], [0, 1],
                [392, 2], [494, 2], [587, 2], [0, 1],
                [523, 2], [440, 2], [349, 2], [0, 1],
            ];
            return playMelody(notes, 'sine', musicGain, 0.08, 0.4);
        },

        // Flappy Bird: Light bouncy tune
        flappy() {
            const notes = [
                [523, 0.5], [587, 0.5], [659, 0.5], [784, 0.5],
                [659, 1], [523, 0.5], [0, 0.5],
                [587, 0.5], [659, 0.5], [784, 0.5], [880, 0.5],
                [784, 1], [659, 0.5], [0, 0.5],
                [880, 0.5], [784, 0.5], [659, 0.5], [523, 0.5],
                [587, 1], [0, 0.5], [523, 0.5],
                [440, 1.5], [0, 1],
            ];
            return playMelody(notes, 'triangle', musicGain, 0.12, 0.25);
        },

        // Pac-Maze: Classic arcade waka vibe
        pacmaze() {
            const notes = [
                [494, 0.25], [988, 0.25], [740, 0.25], [622, 0.25],
                [988, 0.5], [740, 0.75], [622, 0.25],
                [523, 0.25], [1047, 0.25], [784, 0.25], [659, 0.25],
                [1047, 0.5], [784, 0.75], [659, 0.25],
                [494, 0.25], [988, 0.25], [740, 0.25], [622, 0.25],
                [988, 0.5], [740, 0.75], [622, 0.25],
                [659, 0.5], [698, 0.5], [740, 0.5], [0, 0.5],
            ];
            return playMelody(notes, 'square', musicGain, 0.06, 0.22);
        },

        // Minesweeper: Tense suspenseful ambient
        minesweeper() {
            const notes = [
                [220, 2], [208, 2], [196, 2], [185, 2],
                [196, 2], [208, 2], [220, 2], [233, 2],
                [247, 2], [233, 2], [220, 2], [0, 2],
            ];
            return playMelody(notes, 'sine', musicGain, 0.1, 0.5);
        },

        // Ludo: Fun casual boardgame
        ludo() {
            const notes = [
                [523, 0.5], [523, 0.25], [587, 0.25], [659, 0.5], [587, 0.5],
                [523, 0.5], [440, 0.5], [392, 0.5], [440, 0.5],
                [523, 1], [0, 0.5],
                [659, 0.5], [659, 0.25], [698, 0.25], [784, 0.5], [698, 0.5],
                [659, 0.5], [587, 0.5], [523, 0.5], [587, 0.5],
                [659, 1], [0, 0.5],
            ];
            return playMelody(notes, 'triangle', musicGain, 0.1, 0.28);
        },

        // Hangman: Suspenseful slow
        hangman() {
            const notes = [[220, 2], [196, 2], [208, 2], [0, 1]];
            return playMelody(notes, 'sine', musicGain, 0.1, 0.5);
        },

        // Wordle (Word Guess): Gentle thinking
        wordle() {
            const notes = [[523, 1], [659, 1], [784, 1.5], [0, 0.5]];
            return playMelody(notes, 'sine', musicGain, 0.08, 0.4);
        },

        // RPS: Fast Showdown
        rps() {
            const notes = [[440, 0.5], [554, 0.5], [659, 0.5], [0, 0.5]];
            return playMelody(notes, 'sawtooth', musicGain, 0.06, 0.3);
        },

        // Breakout: Energetic pulse
        breakout() {
            const notes = [[330, 0.5], [392, 0.5], [440, 0.5], [523, 0.5], [440, 1], [0, 1]];
            return playMelody(notes, 'square', musicGain, 0.07, 0.18);
        },

        // Simon: Colorful patterns
        simon() {
            const notes = [[523, 1], [659, 1], [587, 1], [784, 1], [523, 2], [0, 1]];
            return playMelody(notes, 'triangle', musicGain, 0.1, 0.3);
        },

        // Whack-A-Mole: Frenetic
        whackamole() {
            const notes = [[880, 0.25], [784, 0.25], [880, 0.5], [0, 0.5], [1047, 0.5], [0, 0.5]];
            return playMelody(notes, 'square', musicGain, 0.08, 0.2);
        },

        // Math Quiz: Calm logic
        mathquiz() {
            const notes = [[440, 2], [523, 2], [659, 2], [0, 1]];
            return playMelody(notes, 'sine', musicGain, 0.1, 0.45);
        },

        // Color Match: Quirky
        colormatch() {
            const notes = [[392, 0.5], [523, 0.5], [659, 0.5], [523, 0.5], [440, 1], [0, 1]];
            return playMelody(notes, 'triangle', musicGain, 0.1, 0.25);
        },

        // Hyper Light Drifter: Dark synthwave intense beat
        hyperlightdrifter() {
            const notes = [
                [110, 0.25], [110, 0.25], [220, 0.5], [110, 0.25], [0, 0.25], [165, 0.5],
                [110, 0.25], [110, 0.25], [147, 0.5], [131, 0.5], [165, 0.5],
                [110, 0.25], [110, 0.25], [220, 0.5], [110, 0.25], [0, 0.25], [247, 0.5],
                [110, 0.25], [110, 0.25], [196, 0.5], [220, 0.5], [0, 0.5],
            ];
            return playMelody(notes, 'sawtooth', musicGain, 0.08, 0.3);
        },

        // Geometry Dash: Energetic upbeat
        geometry() {
            const notes = [
                [392, 0.25], [392, 0.25], [392, 0.5], [493, 0.5], [440, 0.5],
                [392, 0.25], [392, 0.25], [392, 0.5], [523, 0.5], [493, 0.5],
                [392, 0.25], [392, 0.25], [392, 0.5], [587, 0.5], [523, 0.5],
                [493, 0.5], [440, 0.5], [392, 1], [0, 0.5]
            ];
            return playMelody(notes, 'square', musicGain, 0.1, 0.2);
        },

        // Gris: Emotional, calm atmospheric
        gris() {
            const notes = [
                [349, 2], [440, 2], [523, 4], [0, 1],
                [329, 2], [440, 2], [523, 4], [0, 1],
                [293, 2], [349, 2], [440, 4], [0, 1]
            ];
            return playMelody(notes, 'sine', musicGain, 0.15, 0.45);
        },

        // Katana Zero: Gritty action synthwave
        katanazero() {
            const notes = [
                [110, 0.25], [0, 0.25], [110, 0.25], [146, 0.25], 
                [110, 0.25], [164, 0.25], [110, 0.25], [146, 0.25],
                [98, 0.25], [0, 0.25], [98, 0.25], [130, 0.25],
                [98, 0.25], [146, 0.25], [98, 0.25], [130, 0.25]
            ];
            return playMelody(notes, 'sawtooth', musicGain, 0.08, 0.25);
        },

        // Mini Metro: Minimalistic ambient
        minimetro() {
            const notes = [
                [523, 1], [0, 2], [659, 1], [0, 2], [440, 1], [0, 3],
                [587, 1], [0, 2], [784, 1], [0, 2], [523, 1.5], [0, 2]
            ];
            return playMelody(notes, 'sine', musicGain, 0.2, 0.4);
        },

        // Poly Bridge: Cheerful puzzle
        polybridge() {
            const notes = [
                [392, 0.5], [493, 0.5], [587, 0.5], [784, 1],
                [587, 0.5], [784, 0.5], [880, 1],
                [784, 0.5], [587, 0.5], [493, 0.5], [392, 1], [0, 1]
            ];
            return playMelody(notes, 'triangle', musicGain, 0.1, 0.35);
        },

        // Sayonara Wild Hearts: Pop vibrant rhythmic
        sayonarawildhearts() {
            const notes = [
                [523, 0.5], [659, 0.5], [784, 0.5], [1046, 0.5],
                [784, 0.5], [659, 0.5], [523, 1],
                [587, 0.5], [698, 0.5], [880, 0.5], [1174, 0.5],
                [880, 0.5], [698, 0.5], [587, 1], [0, 0.5]
            ];
            return playMelody(notes, 'square', musicGain, 0.08, 0.22);
        },

        // Superhot: Tense slow pulsating
        superhot() {
            const notes = [
                [130, 1.5], [0, 0.5], [130, 1.5], [0, 0.5],
                [146, 1], [130, 1], [0, 1]
            ];
            return playMelody(notes, 'sawtooth', musicGain, 0.1, 0.4);
        },

        // Thumper: Intense heavy rhythm
        thumper() {
            const notes = [
                [65, 0.25], [65, 0.25], [130, 0.5], [65, 0.25], [0, 0.25], [65, 0.5],
                [65, 0.25], [65, 0.25], [146, 0.5], [65, 0.25], [0, 0.25], [65, 0.5]
            ];
            return playMelody(notes, 'sawtooth', musicGain, 0.15, 0.25);
        },

        // VVVVVV: Energetic chiptune
        vvvvvv() {
            const notes = [
                [440, 0.25], [523, 0.25], [659, 0.25], [440, 0.25], [523, 0.25], [659, 0.25],
                [784, 0.5], [659, 0.5], [523, 0.5],
                [392, 0.25], [493, 0.25], [587, 0.25], [392, 0.25], [493, 0.25], [587, 0.25],
                [659, 0.5], [587, 0.5], [493, 0.5], [0, 0.5]
            ];
            return playMelody(notes, 'square', musicGain, 0.08, 0.18);
        },

        // Baba Is You: Cute thoughtful logic
        babaisyou() {
            const notes = [
                [392, 1], [523, 0.5], [659, 1.5], [0, 0.5],
                [587, 1], [493, 0.5], [392, 1.5], [0, 0.5],
                [440, 1], [523, 0.5], [698, 1.5], [0, 0.5],
                [659, 1], [523, 0.5], [392, 1.5], [0, 1]
            ];
            return playMelody(notes, 'sine', musicGain, 0.15, 0.3);
        },
    };

    // ==========================================
    //  SOUND EFFECTS
    // ==========================================

    const SFX = {
        // Generic positive action
        score() { ensureCtx(); playNote(880, 0.15, 'sine', sfxGain, 0.3); setTimeout(() => playNote(1108, 0.2, 'sine', sfxGain, 0.25), 100); },

        // Negative / hit
        hit() { ensureCtx(); playNote(200, 0.3, 'sawtooth', sfxGain, 0.2); playNote(150, 0.4, 'square', sfxGain, 0.15); },

        // Game over
        gameOver() {
            ensureCtx();
            [400, 350, 300, 200].forEach((f, i) => {
                setTimeout(() => playNote(f, 0.3, 'square', sfxGain, 0.2), i * 150);
            });
        },

        // Win / victory
        win() {
            ensureCtx();
            [523, 659, 784, 1047].forEach((f, i) => {
                setTimeout(() => playNote(f, 0.3, 'sine', sfxGain, 0.3), i * 120);
            });
        },

        // Click / place
        click() { ensureCtx(); playNote(600, 0.08, 'sine', sfxGain, 0.2); },

        // Move
        move() { ensureCtx(); playNote(440, 0.05, 'sine', sfxGain, 0.1); },

        // Eat / collect
        eat() { ensureCtx(); playNote(700, 0.1, 'triangle', sfxGain, 0.25); setTimeout(() => playNote(900, 0.12, 'triangle', sfxGain, 0.2), 60); },

        // Dice roll
        dice() {
            ensureCtx();
            for (let i = 0; i < 8; i++) {
                setTimeout(() => playNote(300 + Math.random() * 400, 0.05, 'square', sfxGain, 0.1), i * 60);
            }
        },

        // Flip card
        flip() { ensureCtx(); playNote(500, 0.1, 'sine', sfxGain, 0.15); },

        // Match found
        match() { ensureCtx(); playNote(784, 0.15, 'sine', sfxGain, 0.3); setTimeout(() => playNote(1047, 0.25, 'sine', sfxGain, 0.25), 120); },

        // Explosion
        explode() {
            ensureCtx();
            if (!ctx) return;
            try {
                const noise = ctx.createBufferSource();
                const buf = ctx.createBuffer(1, ctx.sampleRate * 0.3, ctx.sampleRate);
                const data = buf.getChannelData(0);
                for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
                noise.buffer = buf;
                const g = ctx.createGain();
                g.gain.setValueAtTime(0.2, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
                noise.connect(g);
                g.connect(sfxGain);
                noise.start();
            } catch (e) {
                console.error('Error in explode SFX:', e);
            }
        },

        // Line clear (Tetris)
        lineClear() {
            ensureCtx();
            [523, 659, 784, 1047, 1319].forEach((f, i) => {
                setTimeout(() => playNote(f, 0.15, 'square', sfxGain, 0.15), i * 50);
            });
        },

        // Jump
        jump() {
            ensureCtx();
            if (!ctx) return;
            try {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.15);
                g.gain.setValueAtTime(0.2, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
                osc.connect(g); g.connect(sfxGain);
                osc.start(); osc.stop(ctx.currentTime + 0.2);
            } catch (e) {
                console.error('Error in jump SFX:', e);
            }
        },

        // Shoot
        shoot() {
            ensureCtx();
            if (!ctx) return;
            try {
                const osc = ctx.createOscillator();
                const g = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(800, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);
                g.gain.setValueAtTime(0.15, ctx.currentTime);
                g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
                osc.connect(g); g.connect(sfxGain);
                osc.start(); osc.stop(ctx.currentTime + 0.1);
            } catch (e) {
                console.error('Error in shoot SFX:', e);
            }
        },
    };

    // ==========================================
    //  MUSIC CONTROL
    // ==========================================

    function startMusic(gameId) {
        ensureCtx();
        stopMusic();
        if (muted || !musicDefs[gameId]) return;
        musicPlaying = true;

        function loopMusic() {
            if (!musicPlaying || muted) return;
            const duration = musicDefs[gameId]();
            musicTimer = setTimeout(loopMusic, duration * 1000 + 500);
        }
        loopMusic();
    }

    function stopMusic() {
        musicPlaying = false;
        if (musicTimer) { clearTimeout(musicTimer); musicTimer = null; }
        musicNodes.forEach(n => { try { n.stop(); } catch (e) { } });
        musicNodes = [];
    }

    function setMusicVolume(value) {
        ensureCtx();
        const next = Math.max(0, Math.min(1, Number(value) || 0));
        if (musicGain) musicGain.gain.value = next;
        return next;
    }

    function toggleMute() {
        muted = !muted;
        if (muted) {
            masterGain && (masterGain.gain.value = 0);
            stopMusic();
        } else {
            masterGain && (masterGain.gain.value = 1.0);
        }
        try { window.localStorage.setItem('arcadeNexusMuted', muted ? '1' : '0'); } catch (_) { }
        return muted;
    }

    function isMuted() {
        return muted;
    }

    // Load mute state
    try { muted = window.localStorage.getItem('arcadeNexusMuted') === '1'; } catch (_) { }

    // ==========================================
    //  AUTO-INIT: Add mute button to page
    // ==========================================

    function createMuteButton() {
        const btn = document.createElement('button');
        btn.id = 'muteToggle';
        btn.innerHTML = muted ? '🔇' : '🔊';
        btn.title = 'Toggle Sound';
        btn.style.cssText = `
            position:fixed; bottom:20px; left:20px; z-index:9999;
            width:48px; height:48px; border-radius:50%;
            background:rgba(255,255,255,0.08); border:1px solid rgba(255,255,255,0.15);
            color:white; font-size:22px; cursor:pointer;
            backdrop-filter:blur(10px); transition:all 0.3s ease;
            display:flex; align-items:center; justify-content:center;
            box-shadow:0 4px 15px rgba(0,0,0,0.3);
        `;
        btn.addEventListener('mouseenter', () => { btn.style.background = 'rgba(255,255,255,0.15)'; btn.style.transform = 'scale(1.1)'; });
        btn.addEventListener('mouseleave', () => { btn.style.background = 'rgba(255,255,255,0.08)'; btn.style.transform = 'scale(1)'; });
        btn.addEventListener('click', () => {
            const nowMuted = toggleMute();
            btn.innerHTML = nowMuted ? '🔇' : '🔊';
            
            // Sync dengan audio player baru di index.html
            const bgmAudioHTML = document.getElementById('bgm-audio');
            if (bgmAudioHTML) bgmAudioHTML.muted = nowMuted;
            
            // Restart music if unmuting
            if (!nowMuted) {
                const gameId = detectGame();
                if (gameId) startMusic(gameId);
            }
        });
        document.body.appendChild(btn);
    }

    function detectGame() {
        let path = window.location.pathname.toLowerCase();
        let file = path.split('/').pop().replace('.html', '');
        if (file === '' || file === '/') file = 'index';
        const map = {
            'tictactoe': 'tictactoe', 'snake': 'snake', 'pong': 'pong',
            'memory': 'memory', 'spaceshooter': 'spaceshooter', 'dinorun': 'dinorun',
            'tetris': 'tetris', '2048': 'puzzle2048', 'flappy': 'flappy',
            'pacmaze': 'pacmaze', 'minesweeper': 'minesweeper', 'ludo': 'ludo',
            'hangman': 'hangman', 'wordle': 'wordle', 'rps': 'rps',
            'breakout': 'breakout', 'simon': 'simon', 'whackamole': 'whackamole',
            'mathquiz': 'mathquiz', 'colormatch': 'colormatch',
            'hyperlightdrifter': 'hyperlightdrifter', 'babaisyou': 'babaisyou',
            'geometry': 'geometry', 'gris': 'gris', 'katanazero': 'katanazero',
            'minimetro': 'minimetro', 'polybridge3': 'polybridge',
            'sayonarawildhearts': 'sayonarawildhearts', 'superhot': 'superhot',
            'thumper': 'thumper', 'vvvvvv': 'vvvvvv'
        };
        // Optional override from page/global scope:
        // window.ZI_BGM_MAP = { minimetro: 'gris', tetris: 'thumper' }
        const overrideMap = (window.ZI_BGM_MAP && typeof window.ZI_BGM_MAP === 'object') ? window.ZI_BGM_MAP : null;
        if (overrideMap && overrideMap[file]) return overrideMap[file];
        return map[file] || null;
    }

    function setupAutoSFX() {
        let lastClickAt = 0;
        let lastKeyAt = 0;

        const clickSelectors = 'button, a, [role="button"], .btn, .ctrl-btn, .back-btn, .cell, .card, canvas';

        document.addEventListener('pointerdown', (ev) => {
            if (muted) return;
            const now = performance.now();
            if (now - lastClickAt < 70) return;
            const target = ev.target;
            if (target && typeof target.closest === 'function' && target.closest(clickSelectors)) {
                lastClickAt = now;
                SFX.click();
            }
        });

        document.addEventListener('keydown', (ev) => {
            if (muted) return;
            const now = performance.now();
            if (now - lastKeyAt < 85) return;
            const key = ev.key;
            const controlKey = key === 'ArrowUp' || key === 'ArrowDown' || key === 'ArrowLeft' || key === 'ArrowRight' || key === ' ' || key === 'Enter';
            if (controlKey) {
                lastKeyAt = now;
                SFX.move();
            }
        });
    }

    // Auto-start on page load
    document.addEventListener('DOMContentLoaded', () => {
        createMuteButton();
        setupAutoSFX();
        
        // Sync state mute awal ke player baru
        const bgmAudioHTML = document.getElementById('bgm-audio');
        if (bgmAudioHTML) bgmAudioHTML.muted = muted;
        
        const gameId = detectGame();
        if (gameId) {
            // Start music on first user interaction (browser autoplay policy)
            const startOnce = () => {
                if (!muted) startMusic(gameId);
                document.removeEventListener('click', startOnce);
                document.removeEventListener('keydown', startOnce);
                document.removeEventListener('touchstart', startOnce);
            };
            document.addEventListener('click', startOnce);
            document.addEventListener('keydown', startOnce);
            document.addEventListener('touchstart', startOnce);
        }
    });

    return { init, startMusic, stopMusic, setMusicVolume, toggleMute, isMuted, SFX, detectGame };
})();

// Global shortcut
window.SoundEngine = SoundEngine;
window.SFX = SoundEngine.SFX;
