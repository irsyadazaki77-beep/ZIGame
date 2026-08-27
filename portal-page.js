(function () {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

    function storageGet(key, fallback = '') {
        try { return window.localStorage.getItem(key) ?? fallback; } catch (_) { return fallback; }
    }

    function storageSet(key, value) {
        try { window.localStorage.setItem(key, value); } catch (_) { }
    }

    function storageRemove(key) {
        try { window.localStorage.removeItem(key); } catch (_) { }
    }

    const keys = {
        profile: 'ziGame:profile',
        recent: 'ziGame:recent',
        favorites: 'ziGame:favorites',
        achievements: 'ziGame:achievements',
        actions: 'ziGame:actions',
        theme: 'ziGame:theme',
        view: 'ziGame:viewmode',
        density: 'ziGame:density',
        motion: 'ziGame:motion',
        sidePrefs: 'ziGame:sidebarPrefs',
        notes: 'ziGame:sidebarNotes',
        volume: 'ziGame:musicVolume',
        sfxVolume: 'ziGame:sfxVolume',
        lastFilter: 'ziGame:lastFilter',
        lastSort: 'ziGame:lastSort'
    };

    const gameCatalog = [
        ['hyperlightdrifter.html', 'Hyper Light Drifter', 'action'],
        ['geometry.html', 'Neon Dash', 'arcade'],
        ['tictactoe.html', 'Tic Tac Toe', 'strategy'],
        ['pong.html', 'Neon Pong', 'arcade'],
        ['memory.html', 'Memory Match', 'puzzle'],
        ['spaceshooter.html', 'Space Shooter', 'action'],
        ['dinorun.html', 'Dino Run', 'arcade'],
        ['tetris.html', 'Tetris Drop', 'puzzle'],
        ['2048.html', '2048 Puzzle', 'puzzle'],
        ['flappy.html', 'Flappy Bird', 'arcade'],
        ['pacmaze.html', 'Pac-Maze', 'arcade'],
        ['minesweeper.html', 'Minesweeper', 'strategy'],
        ['ludo.html', 'Ludo King', 'strategy'],
        ['hangman.html', 'Hangman', 'puzzle'],
        ['wordle.html', 'Word Guess', 'puzzle'],
        ['rps.html', 'Rock Paper Scissors', 'arcade'],
        ['breakout.html', 'Breakout Neon', 'action'],
        ['simon.html', 'Simon Says', 'puzzle'],
        ['whackamole.html', 'Whack A Mole', 'action'],
        ['mathquiz.html', 'Math Quiz', 'puzzle'],
        ['colormatch.html', 'Color Match', 'arcade'],
        ['snake.html', 'Snake Xenzia', 'arcade'],
        ['sayonarawildhearts.html', 'Sayonara Wild Hearts', 'rhythm'],
        ['babaisyou.html', 'Baba Is You', 'puzzle'],
        ['thumper.html', 'Thumper', 'rhythm'],
        ['superhot.html', 'Superhot', 'action'],
        ['katanazero.html', 'Katana Zero', 'action'],
        ['minimetro.html', 'Mini Metro', 'strategy'],
        ['gris.html', 'Gris', 'platformer'],
        ['polybridge3.html', 'Poly Bridge 3', 'simulation'],
        ['vvvvvv.html', 'VVVVVV', 'platformer']
    ];

    function readJSON(key, fallback) {
        try {
            const value = JSON.parse(storageGet(key));
            return value == null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        storageSet(key, JSON.stringify(value));
    }

    function setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    function toast(message) {
        const old = $('.toast');
        if (old) old.remove();
        const el = document.createElement('div');
        el.className = 'toast';
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
        el.setAttribute('aria-atomic', 'true');
        el.textContent = message;
        document.body.appendChild(el);
        window.setTimeout(() => el.remove(), 2200);
    }

    function xpNeeded(level) {
        return 120 + (level - 1) * 70;
    }

    function currentProfile() {
        return readJSON(keys.profile, { xp: 0, level: 1, streak: 1, lastVisit: '' });
    }

    function favoriteCards() {
        const raw = readJSON(keys.favorites, []);
        const fav = new Set(Array.isArray(raw) ? raw : []);
        return gameCatalog.filter(([href, title]) => fav.has(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || fav.has(title.toLowerCase()) || fav.has(href));
    }

    function recentItems() {
        const raw = readJSON(keys.recent, []);
        const clean = window.ZIGameRuntime?.cleanRecent
            ? window.ZIGameRuntime.cleanRecent(raw)
            : (Array.isArray(raw) ? raw.filter(item => item && typeof item.href === 'string' && typeof item.title === 'string').slice(0, 8) : []);
        return clean.filter(item => gameCatalog.some(([href]) => href === item.href));
    }

    function applyTheme() {
        document.body.classList.toggle('light', storageGet(keys.theme) === 'light');
    }

    function initProfilePage() {
        if (!document.body.matches('[data-page="profile"]')) return;
        const profile = currentProfile();
        const actions = readJSON(keys.actions, {});
        const recent = recentItems();
        const favs = favoriteCards();
        const achievements = readJSON(keys.achievements, []);
        const arcadeStats = readJSON('arcadeNexusStats', {});
        const needed = xpNeeded(profile.level || 1);
        const xp = profile.xp || 0;
        const pct = Math.max(0, Math.min(100, (xp / needed) * 100));

        setText('profileName', storageGet('ziGame:playerName') || 'Neon Pilot');
        setText('profileLevel', `LV ${profile.level || 1}`);
        setText('profileXp', `${xp} / ${needed} XP`);
        setText('profileStreak', `${profile.streak || 1} hari`);
        setText('statFavorites', favs.length);
        setText('statRecent', recent.length);
        setText('statAchievements', achievements.length);
        setText('statPlayed', actions.played || 0);
        setText('statTotalScore', Number(arcadeStats.totalScore) || 0);
        setText('statGamesPlayed', Number(arcadeStats.gamesPlayed) || 0);
        const fill = $('#profileXpFill');
        if (fill) fill.style.width = `${pct}%`;

        const favoriteList = $('#favoriteList');
        if (favoriteList) {
            favoriteList.innerHTML = favs.length ? favs.slice(0, 8).map(([href, title, cat]) => `
                <a class="list-item" href="${href}">
                    <span><strong>${title}</strong><small>${cat}</small></span>
                    <span class="pill">Main</span>
                </a>
            `).join('') : '<div class="list-item"><span><strong>Belum ada favorite</strong><small>Tambahkan dari halaman utama.</small></span></div>';
        }

        const recentList = $('#recentListPage');
        if (recentList) {
            recentList.innerHTML = recent.length ? recent.slice(0, 8).map(item => `
                <a class="list-item" href="${item.href}">
                    <span><strong>${item.title}</strong><small>Terakhir dimainkan</small></span>
                    <span class="pill">Lanjut</span>
                </a>
            `).join('') : '<div class="list-item"><span><strong>Riwayat kosong</strong><small>Mainkan game untuk mengisi daftar ini.</small></span></div>';
        }

        const achievementList = $('#achievementListPage');
        if (achievementList) {
            const catalog = [
                ['first-favorite', 'First Pick'],
                ['collector-5', 'Collector x5'],
                ['random-first', 'Chaos Player'],
                ['command-open', 'Command Pilot'],
                ['five-plays', 'Arcade Warmup'],
                ['final-polish', 'Portal Ready']
            ];
            achievementList.innerHTML = catalog.map(([id, title]) => `
                <div class="list-item">
                    <span><strong>${title}</strong><small>${achievements.includes(id) ? 'Unlocked' : 'Belum terbuka'}</small></span>
                    <span class="pill">${achievements.includes(id) ? 'OK' : 'LOCK'}</span>
                </div>
            `).join('');
        }
    }

    function initSettingsPage() {
        if (!document.body.matches('[data-page="settings"]')) return;
        const sidePrefs = readJSON(keys.sidePrefs, {});
        const controls = {
            playerName: $('#playerName'),
            theme: $('#settingTheme'),
            view: $('#settingView'),
            density: $('#settingDensity'),
            motion: $('#settingMotion'),
            accent: $('#settingAccent'),
            focus: $('#settingFocus'),
            autoHide: $('#settingAutoHide'),
            compactSidebar: $('#settingCompactSidebar'),
            volume: $('#settingVolume'),
            sfxVolume: $('#settingSfxVolume'),
            notes: $('#settingNotes')
        };

        if (controls.playerName) controls.playerName.value = storageGet('ziGame:playerName') || 'Neon Pilot';
        if (controls.theme) controls.theme.value = storageGet(keys.theme) || 'dark';
        if (controls.view) controls.view.value = storageGet(keys.view) || 'grid';
        if (controls.density) controls.density.value = storageGet(keys.density) || 'cozy';
        if (controls.motion) controls.motion.checked = storageGet(keys.motion) === 'reduced';
        if (controls.accent) controls.accent.value = sidePrefs.accent || 'violet';
        if (controls.focus) controls.focus.checked = sidePrefs.focus === true || sidePrefs.focus === 'true';
        if (controls.autoHide) controls.autoHide.checked = sidePrefs.autoHide === true || sidePrefs.autoHide === 'true';
        if (controls.compactSidebar) controls.compactSidebar.checked = sidePrefs.compact === true || sidePrefs.compact === 'true';
        if (controls.volume) controls.volume.value = storageGet(keys.volume) || '0.3';
        if (controls.sfxVolume) controls.sfxVolume.value = storageGet(keys.sfxVolume) || '0.5';
        if (controls.notes) controls.notes.value = storageGet(keys.notes);

        const volumeLabels = [
            [controls.volume, $('#settingVolumeValue')],
            [controls.sfxVolume, $('#settingSfxVolumeValue')]
        ];
        volumeLabels.forEach(([control, output]) => {
            if (!control || !output) return;
            const sync = () => { output.textContent = `${Math.round(Number(control.value) * 100)}%`; };
            control.addEventListener('input', sync);
            sync();
        });

        $('#saveSettings')?.addEventListener('click', () => {
            const nextPrefs = readJSON(keys.sidePrefs, {});
            storageSet('ziGame:playerName', controls.playerName?.value.trim().slice(0, 28) || 'Neon Pilot');
            storageSet(keys.theme, controls.theme?.value || 'dark');
            storageSet(keys.view, controls.view?.value || 'grid');
            storageSet(keys.density, controls.density?.value || 'cozy');
            storageSet(keys.motion, controls.motion?.checked ? 'reduced' : 'full');
            storageSet(keys.volume, controls.volume?.value || '0.3');
            storageSet(keys.sfxVolume, controls.sfxVolume?.value || '0.5');
            storageSet(keys.notes, controls.notes?.value || '');
            nextPrefs.accent = controls.accent?.value || 'violet';
            nextPrefs.focus = !!controls.focus?.checked;
            nextPrefs.autoHide = !!controls.autoHide?.checked;
            nextPrefs.compact = !!controls.compactSidebar?.checked;
            writeJSON(keys.sidePrefs, nextPrefs);
            applyTheme();
            toast('Pengaturan tersimpan.');
        });

        $('#resetFilters')?.addEventListener('click', () => {
            storageRemove(keys.lastFilter); storageRemove(keys.lastSort);
            toast('Filter dan sort direset.');
        });

        $('#clearRecent')?.addEventListener('click', () => {
            if (!window.confirm('Hapus seluruh riwayat game dari browser ini?')) return;
            storageRemove(keys.recent);
            toast('Riwayat dimainkan dihapus.');
        });

        $('#clearFavorites')?.addEventListener('click', () => {
            if (!window.confirm('Hapus semua game favorit dari browser ini?')) return;
            storageRemove(keys.favorites);
            toast('Favorite dikosongkan.');
        });

        $('#resetProfile')?.addEventListener('click', () => {
            if (!window.confirm('Reset semua XP, achievement, dan statistik profil?')) return;
            writeJSON(keys.profile, { xp: 0, level: 1, streak: 1, lastVisit: '' });
            storageRemove(keys.actions);
            storageRemove('arcadeNexusStats');
            toast('Progress profil direset.');
        });

        controls.theme?.addEventListener('change', () => {
            storageSet(keys.theme, controls.theme.value);
            applyTheme();
        });
    }

    applyTheme();
    initProfilePage();
    initSettingsPage();
})();
