(function () {
    'use strict';

    const $ = (selector, root = document) => root.querySelector(selector);
    const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

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
            const value = JSON.parse(localStorage.getItem(key) || '');
            return value == null ? fallback : value;
        } catch (error) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
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
        const fav = new Set(readJSON(keys.favorites, []));
        return gameCatalog.filter(([href, title]) => fav.has(title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || fav.has(title.toLowerCase()) || fav.has(href));
    }

    function applyTheme() {
        document.body.classList.toggle('light', localStorage.getItem(keys.theme) === 'light');
    }

    function initProfilePage() {
        if (!document.body.matches('[data-page="profile"]')) return;
        const profile = currentProfile();
        const actions = readJSON(keys.actions, {});
        const recent = readJSON(keys.recent, []);
        const favs = favoriteCards();
        const achievements = readJSON(keys.achievements, []);
        const needed = xpNeeded(profile.level || 1);
        const xp = profile.xp || 0;
        const pct = Math.max(0, Math.min(100, (xp / needed) * 100));

        setText('profileName', localStorage.getItem('ziGame:playerName') || 'Neon Pilot');
        setText('profileLevel', `LV ${profile.level || 1}`);
        setText('profileXp', `${xp} / ${needed} XP`);
        setText('profileStreak', `${profile.streak || 1} hari`);
        setText('statFavorites', favs.length);
        setText('statRecent', recent.length);
        setText('statAchievements', achievements.length);
        setText('statPlayed', actions.played || 0);
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
            notes: $('#settingNotes')
        };

        if (controls.playerName) controls.playerName.value = localStorage.getItem('ziGame:playerName') || 'Neon Pilot';
        if (controls.theme) controls.theme.value = localStorage.getItem(keys.theme) || 'dark';
        if (controls.view) controls.view.value = localStorage.getItem(keys.view) || 'grid';
        if (controls.density) controls.density.value = localStorage.getItem(keys.density) || 'cozy';
        if (controls.motion) controls.motion.checked = localStorage.getItem(keys.motion) === 'reduced';
        if (controls.accent) controls.accent.value = sidePrefs.accent || 'violet';
        if (controls.focus) controls.focus.checked = sidePrefs.focus === true || sidePrefs.focus === 'true';
        if (controls.autoHide) controls.autoHide.checked = sidePrefs.autoHide === true || sidePrefs.autoHide === 'true';
        if (controls.compactSidebar) controls.compactSidebar.checked = sidePrefs.compact === true || sidePrefs.compact === 'true';
        if (controls.volume) controls.volume.value = localStorage.getItem(keys.volume) || '0.3';
        if (controls.notes) controls.notes.value = localStorage.getItem(keys.notes) || '';

        $('#saveSettings')?.addEventListener('click', () => {
            const nextPrefs = readJSON(keys.sidePrefs, {});
            localStorage.setItem('ziGame:playerName', controls.playerName?.value.trim() || 'Neon Pilot');
            localStorage.setItem(keys.theme, controls.theme?.value || 'dark');
            localStorage.setItem(keys.view, controls.view?.value || 'grid');
            localStorage.setItem(keys.density, controls.density?.value || 'cozy');
            localStorage.setItem(keys.motion, controls.motion?.checked ? 'reduced' : 'full');
            localStorage.setItem(keys.volume, controls.volume?.value || '0.3');
            localStorage.setItem(keys.notes, controls.notes?.value || '');
            nextPrefs.accent = controls.accent?.value || 'violet';
            nextPrefs.focus = !!controls.focus?.checked;
            nextPrefs.autoHide = !!controls.autoHide?.checked;
            nextPrefs.compact = !!controls.compactSidebar?.checked;
            writeJSON(keys.sidePrefs, nextPrefs);
            applyTheme();
            toast('Pengaturan tersimpan.');
        });

        $('#resetFilters')?.addEventListener('click', () => {
            localStorage.removeItem(keys.lastFilter);
            localStorage.removeItem(keys.lastSort);
            toast('Filter dan sort direset.');
        });

        $('#clearRecent')?.addEventListener('click', () => {
            localStorage.removeItem(keys.recent);
            toast('Riwayat dimainkan dihapus.');
        });

        $('#clearFavorites')?.addEventListener('click', () => {
            localStorage.removeItem(keys.favorites);
            toast('Favorite dikosongkan.');
        });

        $('#resetProfile')?.addEventListener('click', () => {
            writeJSON(keys.profile, { xp: 0, level: 1, streak: 1, lastVisit: '' });
            localStorage.removeItem(keys.actions);
            toast('Progress profil direset.');
        });

        controls.theme?.addEventListener('change', () => {
            localStorage.setItem(keys.theme, controls.theme.value);
            applyTheme();
        });
    }

    applyTheme();
    initProfilePage();
    initSettingsPage();
})();
