(function () {
    'use strict';

    const RECENT_KEY = 'ziGame:recent';
    const ACTIONS_KEY = 'ziGame:actions';
    const STORAGE_VERSION = 'ziGame:storageVersion';
    const STORAGE_VERSION_VALUE = '2';

    function readJSON(key, fallback) {
        try {
            const raw = window.localStorage.getItem(key);
            if (!raw) return fallback;
            const value = JSON.parse(raw);
            return value == null ? fallback : value;
        } catch (_) {
            return fallback;
        }
    }

    function writeJSON(key, value) {
        try {
            window.localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (_) {
            return false;
        }
    }

    function sameOriginHtml(value) {
        if (typeof value !== 'string' || !value) return '';
        try {
            const url = new URL(value, window.location.href);
            if (url.origin !== window.location.origin) return '';
            const path = url.pathname.split('/').pop() || '';
            return /^[a-z0-9_-]+\.html$/i.test(path) ? path : '';
        } catch (_) {
            return '';
        }
    }

    function cleanRecent(value) {
        if (!Array.isArray(value)) return [];
        const result = [];
        const seen = new Set();
        value.forEach(item => {
            if (!item || typeof item !== 'object') return;
            const href = sameOriginHtml(item.href);
            const title = typeof item.title === 'string' ? item.title.trim().slice(0, 80) : '';
            if (!href || !title || seen.has(href)) return;
            seen.add(href);
            result.push({ href, title, at: Number.isFinite(Number(item.at)) ? Number(item.at) : Date.now() });
        });
        return result.slice(0, 8);
    }

    function getRecent() {
        const recent = cleanRecent(readJSON(RECENT_KEY, []));
        writeJSON(RECENT_KEY, recent);
        return recent;
    }

    function recordGameVisit() {
        const file = sameOriginHtml(window.location.pathname.split('/').pop() || '');
        if (!file || /^(index|profile|settings|404)\.html$/i.test(file) || /backup/i.test(file)) return;

        const title = (document.title || file.replace(/\.html$/i, ''))
            .split('|')[0]
            .trim()
            .slice(0, 80);
        if (!title) return;

        const recent = getRecent().filter(item => item.href !== file);
        recent.unshift({ href: file, title, at: Date.now() });
        writeJSON(RECENT_KEY, recent.slice(0, 6));

        const dayKey = new Date().toISOString().slice(0, 10);
        const actions = readJSON(ACTIONS_KEY, {});
        if (!actions[dayKey] || typeof actions[dayKey] !== 'object') {
            actions[dayKey] = { favorites: 0, random: 0, played: 0, commands: 0 };
        }
        // The portal counts a click as a play; direct visits still remain visible in history.
        actions[dayKey].played = Math.max(0, Number(actions[dayKey].played) || 0);
        writeJSON(ACTIONS_KEY, actions);
    }

    function applyMotionPreference() {
        let saved = '';
        try { saved = window.localStorage.getItem('ziGame:motion') || ''; } catch (_) { }
        const reduced = saved === 'reduced'
            || (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
        document.documentElement.classList.toggle('zi-reduced-motion', reduced);
    }

    function addProgressiveMetadata() {
        const file = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
        if (file === 'index.html' || file === '') return;
        if (!document.querySelector('link[rel="icon"]')) {
            const icon = document.createElement('link');
            icon.rel = 'icon';
            icon.href = 'favicon.svg';
            icon.type = 'image/svg+xml';
            document.head.appendChild(icon);
        }
        if (!document.querySelector('meta[name="theme-color"]')) {
            const theme = document.createElement('meta');
            theme.name = 'theme-color';
            theme.content = '#090d1d';
            document.head.appendChild(theme);
        }
        if (!document.querySelector('link[rel="manifest"]')) {
            const manifest = document.createElement('link');
            manifest.rel = 'manifest';
            manifest.href = 'manifest.webmanifest';
            document.head.appendChild(manifest);
        }
        if (!document.querySelector('meta[name="description"]')) {
            const description = document.createElement('meta');
            description.name = 'description';
            description.content = `${(document.title || 'ZI GAME').split('|')[0].trim()} — game HTML5 gratis dari ZI GAME.`;
            document.head.appendChild(description);
        }
    }

    function registerServiceWorker() {
        if (!('serviceWorker' in window.navigator) || window.location.protocol === 'file:') return;
        window.navigator.serviceWorker.register(new URL('sw.js', window.location.href)).catch(() => {
            // Offline support is progressive enhancement; gameplay must continue if registration fails.
        });
    }

    function migrateStorage() {
        try {
            if (window.localStorage.getItem(STORAGE_VERSION) !== STORAGE_VERSION_VALUE) {
                writeJSON(RECENT_KEY, cleanRecent(readJSON(RECENT_KEY, [])));
                window.localStorage.setItem(STORAGE_VERSION, STORAGE_VERSION_VALUE);
            }
        } catch (_) { }
    }

    window.ZIGameRuntime = Object.freeze({
        readJSON,
        writeJSON,
        cleanRecent,
        getRecent,
        recordGameVisit,
        sameOriginHtml
    });

    document.documentElement.dataset.ziRuntime = 'ready';
    migrateStorage();
    applyMotionPreference();
    addProgressiveMetadata();
    registerServiceWorker();
    recordGameVisit();
})();
