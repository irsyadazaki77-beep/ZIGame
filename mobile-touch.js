(function () {
    'use strict';

    const path = (location.pathname || '').toLowerCase();
    const isPortal = path.endsWith('/index.html') || path.endsWith('index.html') || path.endsWith('/');
    const isHtmlPage = path.endsWith('.html') || path.endsWith('/');
    const isGamePage = isHtmlPage && !isPortal;
    const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
    const narrowScreen = window.matchMedia && window.matchMedia('(max-width: 820px)').matches;
    const androidLike = /Android/i.test(navigator.userAgent || '');
    const touchDevice = coarsePointer || 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    const shouldOptimize = androidLike || touchDevice || narrowScreen;

    // Load the shared presentation layer for every game page after its
    // page-specific CSS. This lets the engines keep their own layout and
    // identity while the controls, stage, overlays, and responsive behavior
    // share one accessible visual system.
    if (isGamePage) {
        document.documentElement.classList.add('zi-modern-ui');
        document.body.classList.add('zi-modern-game');
        if (!document.querySelector('link[data-zi-modern-ui]')) {
            const modernUi = document.createElement('link');
            modernUi.rel = 'stylesheet';
            modernUi.href = 'zi-modern-ui.css?v=1';
            modernUi.dataset.ziModernUi = 'true';
            document.head.appendChild(modernUi);
        }
    }

    // Shared runtime is loaded from one place for every game page. It provides
    // safe recent-history migration, metadata, reduced-motion support and PWA
    // registration without changing any individual game's engine.
    if (!isPortal && !document.querySelector('script[src="site-runtime.js"]')) {
        const runtime = document.createElement('script');
        runtime.src = 'site-runtime.js?v=2';
        runtime.defer = true;
        document.head.appendChild(runtime);
    }

    function enhanceGameShell() {
        if (!isGamePage || document.documentElement.dataset.ziGameShell === 'ready') return;
        document.documentElement.dataset.ziGameShell = 'ready';

        let back = document.querySelector('a[href="index.html"], a[href="./index.html"]');
        if (!back) {
            back = document.createElement('a');
            back.href = 'index.html';
            back.className = 'zi-shared-back zi-injected-back';
            back.textContent = '← Portal';
            document.body.appendChild(back);
        } else {
            back.classList.add('zi-shared-back');
        }
        back.setAttribute('aria-label', 'Kembali ke portal ZI GAME');

        const focusableSelector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

        function visibleElement(element) {
            if (!element) return false;
            const style = window.getComputedStyle(element);
            return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0;
        }

        function findActionButton(pattern) {
            return Array.from(document.querySelectorAll('button, a')).find(element => {
                if (!visibleElement(element) || element === back) return false;
                const hint = `${element.id} ${element.className} ${element.textContent}`.toLowerCase();
                return pattern.test(hint);
            });
        }

        const pauseButton = findActionButton(/pause|jeda|resume|lanjutkan/);
        const restartButton = findActionButton(/restart|retry|mulai ulang|main lagi|coba lagi/);
        const pauseFunction = ['togglePause', 'pauseGame', 'togglePauseSimulation'].find(name => typeof window[name] === 'function');
        const restartFunction = ['restartGame', 'restartRun', 'startGame', 'newGame'].find(name => typeof window[name] === 'function');
        const gameTitle = document.querySelector('h1, .game-page-title, .page-title')?.textContent?.trim()
            || (document.title || 'Game').split('|')[0].trim();
        const help = document.createElement('div');
        help.className = 'zi-game-tools';
        help.innerHTML = `
            <div class="zi-game-tool-row">
                <button id="ziGamePauseToggle" class="zi-game-pause-toggle" type="button" hidden aria-pressed="false">Jeda</button>
                <button id="ziGameHelpToggle" class="zi-game-help-toggle" type="button" aria-expanded="false" aria-controls="ziGameHelp">Panduan</button>
            </div>
            <div id="ziGameHelp" class="zi-game-help" role="dialog" aria-modal="true" aria-labelledby="ziGameHelpTitle" aria-hidden="true" hidden>
                <div class="zi-game-help-card">
                    <p class="zi-game-help-kicker">ZI GAME / PLAY GUIDE</p>
                    <h2 id="ziGameHelpTitle"></h2>
                    <p class="zi-game-help-copy">Mulai dari tombol utama pada layar pembuka. Gunakan Arrow atau WASD bila tersedia, lalu tekan Space atau Enter untuk aksi utama.</p>
                    <p class="zi-game-help-copy">Di ponsel, gunakan tombol virtual atau swipe. Tekan Escape atau P bila game ini menyediakan jeda.</p>
                    <p class="zi-game-help-note"></p>
                    <div class="zi-game-help-actions"></div>
                    <button class="zi-game-help-close" type="button">Tutup panduan</button>
                </div>
            </div>
        `;
        document.body.appendChild(help);
        const helpToggle = help.querySelector('#ziGameHelpToggle');
        const pauseToggle = help.querySelector('#ziGamePauseToggle');
        const helpPanel = help.querySelector('#ziGameHelp');
        const helpClose = help.querySelector('.zi-game-help-close');
        const helpTitle = help.querySelector('#ziGameHelpTitle');
        const helpNote = help.querySelector('.zi-game-help-note');
        const helpActions = help.querySelector('.zi-game-help-actions');
        const status = document.createElement('div');
        status.id = 'ziGameStatus';
        status.className = 'zi-game-status';
        status.setAttribute('role', 'status');
        status.setAttribute('aria-live', 'polite');
        status.setAttribute('aria-atomic', 'true');
        document.body.appendChild(status);
        helpTitle.textContent = `${gameTitle} — Panduan cepat`;
        const existingHint = document.querySelector('.overlay-note, .instructions, .instruction, .controls-note')?.textContent?.replace(/\s+/g, ' ').trim();
        if (existingHint) helpNote.textContent = existingHint.slice(0, 220);
        else helpNote.remove();
        document.querySelectorAll('#score, #scoreValue, [data-score]').forEach(score => {
            score.setAttribute('aria-live', 'polite');
            score.setAttribute('aria-atomic', 'true');
        });

        const previousFocus = { element: null };
        const helpFocusable = () => Array.from(helpPanel.querySelectorAll(focusableSelector))
            .filter(item => visibleElement(item) && !item.hidden);
        const announce = message => {
            status.textContent = message;
            window.setTimeout(() => {
                if (status.textContent === message) status.textContent = '';
            }, 2600);
        };
        let sharedPaused = false;
        const syncPauseControl = paused => {
            sharedPaused = !!paused;
            pauseToggle.textContent = sharedPaused ? 'Lanjutkan' : 'Jeda';
            pauseToggle.setAttribute('aria-pressed', sharedPaused ? 'true' : 'false');
            pauseToggle.setAttribute('aria-label', sharedPaused ? 'Lanjutkan game' : 'Jeda game');
        };
        const closeHelp = () => {
            helpPanel.hidden = true;
            helpPanel.setAttribute('aria-hidden', 'true');
            helpToggle.setAttribute('aria-expanded', 'false');
            if (previousFocus.element?.isConnected) window.requestAnimationFrame(() => previousFocus.element.focus());
        };
        const openHelp = () => {
            previousFocus.element = document.activeElement !== document.body ? document.activeElement : null;
            helpPanel.hidden = false;
            helpPanel.setAttribute('aria-hidden', 'false');
            helpToggle.setAttribute('aria-expanded', 'true');
            window.requestAnimationFrame(() => helpClose.focus());
        };
        const addHelpAction = (label, callback) => {
            const button = document.createElement('button');
            button.className = 'zi-game-help-action';
            button.type = 'button';
            button.textContent = label;
            button.addEventListener('click', () => {
                callback();
                closeHelp();
                announce(`${label} dikirim.`);
            });
            helpActions.appendChild(button);
        };
        const invokeAction = action => {
            if (action === 'pause' && pauseButton) pauseButton.click();
            else if (action === 'pause' && pauseFunction) window[pauseFunction]();
            else if (action === 'restart' && restartButton) restartButton.click();
            else if (action === 'restart' && restartFunction) window[restartFunction]();
        };
        let pauseEventReceived = false;
        if (pauseButton || pauseFunction) {
            pauseToggle.hidden = false;
            syncPauseControl(false);
            const toggleSharedPause = () => {
                const previous = sharedPaused;
                pauseEventReceived = false;
                invokeAction('pause');
                // Newer engines publish their exact state synchronously. Older
                // engines do not, so only flip the control when no event arrived.
                if (sharedPaused === previous) {
                    syncPauseControl(!previous);
                    announce(sharedPaused ? 'Game dijeda.' : 'Game dilanjutkan.');
                } else if (!pauseEventReceived) {
                    announce(sharedPaused ? 'Game dijeda.' : 'Game dilanjutkan.');
                }
            };
            pauseToggle.addEventListener('click', () => {
                toggleSharedPause();
            });
            addHelpAction('Jeda / lanjutkan', () => {
                toggleSharedPause();
            });
        }
        if (restartButton || restartFunction) addHelpAction('Mulai ulang', () => invokeAction('restart'));
        else addHelpAction('Mulai ulang', () => window.location.reload());
        window.addEventListener('zi:gamepause', event => {
            pauseEventReceived = true;
            syncPauseControl(!!event.detail?.paused);
            announce(event.detail?.paused ? 'Game dijeda.' : 'Game dilanjutkan.');
        });
        helpToggle.addEventListener('click', () => {
            if (helpPanel.hidden) openHelp();
            else closeHelp();
        });
        helpClose.addEventListener('click', closeHelp);
        helpPanel.addEventListener('click', event => {
            if (event.target === helpPanel) closeHelp();
        });
        helpPanel.addEventListener('keydown', event => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closeHelp();
                return;
            }
            if (event.key !== 'Tab') return;
            const items = helpFocusable();
            if (!items.length) return;
            const first = items[0];
            const last = items[items.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        });

        const labelPatterns = [
            [/mute|sound|volume/i, 'Suara'],
            [/pause|resume/i, 'Pause atau lanjutkan'],
            [/restart|retry|reset/i, 'Mulai ulang'],
            [/start|play/i, 'Mulai game'],
            [/back|home|menu/i, 'Kembali ke portal'],
            [/close|cancel/i, 'Tutup'],
            [/up|top/i, 'Atas'],
            [/down|bottom/i, 'Bawah'],
            [/left/i, 'Kiri'],
            [/right/i, 'Kanan']
        ];

        document.querySelectorAll('button').forEach(button => {
            if (button.getAttribute('aria-label')) return;
            const text = button.textContent.trim();
            if (text && !/^[▲▼◄►←→↑↓✕×+−]+$/.test(text)) return;
            const hint = `${button.id} ${button.className} ${button.title}`;
            const match = labelPatterns.find(([pattern]) => pattern.test(hint));
            if (match) button.setAttribute('aria-label', match[1]);
            else if (text === '▲' || text === '↑') button.setAttribute('aria-label', 'Atas');
            else if (text === '▼' || text === '↓') button.setAttribute('aria-label', 'Bawah');
            else if (text === '◄' || text === '←') button.setAttribute('aria-label', 'Kiri');
            else if (text === '►' || text === '→') button.setAttribute('aria-label', 'Kanan');
        });

        document.querySelectorAll(
            '.overlay, .game-overlay, .overlay-screen, .screen, [id$="-screen"], [id$="Screen"], [id$="Overlay"], [id^="screen-"]:not(#screen-flash)'
        ).forEach(overlay => {
            overlay.setAttribute('role', 'dialog');
            overlay.setAttribute('aria-modal', 'true');
            const heading = overlay.querySelector(
                'h1, h2, h3, [role="heading"], .overlay-title, .ov-title, .big-title, .go-title, .result-title, .title-main, .menu-logo, .game-title'
            );
            if (heading) {
                if (!heading.id) heading.id = `zi-overlay-title-${Math.random().toString(36).slice(2, 8)}`;
                overlay.setAttribute('aria-labelledby', heading.id);
                overlay.removeAttribute('aria-label');
            } else {
                const fallbackLabel = overlay.textContent?.replace(/\s+/g, ' ').trim().slice(0, 100);
                overlay.setAttribute('aria-label', fallbackLabel || `${gameTitle} — layar game`);
            }
            let lastVisible = false;
            let returnFocus = null;
            const syncVisibility = () => {
                const style = window.getComputedStyle(overlay);
                const visible = style.display !== 'none'
                    && style.visibility !== 'hidden'
                    && style.pointerEvents !== 'none'
                    && !overlay.hidden
                    && !overlay.classList.contains('hidden');
                overlay.setAttribute('aria-hidden', visible ? 'false' : 'true');
                if (visible && !lastVisible) {
                    returnFocus = document.activeElement && document.activeElement !== document.body
                        ? document.activeElement
                        : null;
                    const first = overlay.querySelector(focusableSelector);
                    if (first && !overlay.contains(document.activeElement)) window.requestAnimationFrame(() => first.focus());
                } else if (!visible && lastVisible) {
                    const target = returnFocus && returnFocus.isConnected && !overlay.contains(returnFocus)
                        ? returnFocus
                        : document.querySelector('canvas, .game-area, .stage');
                    if (target) {
                        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
                        window.requestAnimationFrame(() => target.focus());
                    }
                    returnFocus = null;
                }
                lastVisible = visible;
            };
            syncVisibility();
            new MutationObserver(syncVisibility).observe(overlay, { attributes: true, attributeFilter: ['class', 'style', 'hidden'] });
            overlay.addEventListener('transitionend', syncVisibility);
            // Entrance animations can report opacity: 0 during the first
            // frame even though the screen is already the active game modal.
            // Re-sync after the animation so screen readers do not get stuck
            // with aria-hidden="true".
            overlay.addEventListener('animationend', syncVisibility);
            window.setTimeout(syncVisibility, 180);
            overlay.addEventListener('keydown', event => {
                if (event.key !== 'Tab' || overlay.getAttribute('aria-hidden') === 'true') return;
                const items = Array.from(overlay.querySelectorAll(focusableSelector)).filter(visibleElement);
                if (!items.length) return;
                const first = items[0];
                const last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            });
        });
    }

    if (!shouldOptimize) {
        ready(enhanceGameShell);
        return;
    }

    const keyData = {
        ArrowUp: { key: 'ArrowUp', code: 'ArrowUp', keyCode: 38 },
        ArrowDown: { key: 'ArrowDown', code: 'ArrowDown', keyCode: 40 },
        ArrowLeft: { key: 'ArrowLeft', code: 'ArrowLeft', keyCode: 37 },
        ArrowRight: { key: 'ArrowRight', code: 'ArrowRight', keyCode: 39 },
        Space: { key: ' ', code: 'Space', keyCode: 32 },
        Enter: { key: 'Enter', code: 'Enter', keyCode: 13 },
        Escape: { key: 'Escape', code: 'Escape', keyCode: 27 },
        KeyZ: { key: 'z', code: 'KeyZ', keyCode: 90 },
        KeyX: { key: 'x', code: 'KeyX', keyCode: 88 }
    };

    function ready(fn) {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', fn, { once: true });
        } else {
            fn();
        }
    }

    function tuneViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }

        viewport.setAttribute(
            'content',
            'width=device-width, initial-scale=1.0, viewport-fit=cover'
        );
    }

    function injectStyle() {
        if (document.getElementById('zi-android-lite-style')) return;

        const style = document.createElement('style');
        style.id = 'zi-android-lite-style';
        style.textContent = `
html {
    overscroll-behavior: none;
    -webkit-text-size-adjust: 100%;
}

html.zi-reduced-motion *,
html.zi-reduced-motion *::before,
html.zi-reduced-motion *::after {
    animation-duration: .01ms !important;
    animation-iteration-count: 1 !important;
    scroll-behavior: auto !important;
    transition-duration: .01ms !important;
}

body.zi-android-lite {
    cursor: auto !important;
    overscroll-behavior: none;
    -webkit-tap-highlight-color: rgba(0, 242, 254, 0.18);
    background-attachment: scroll !important;
}

body.zi-android-lite *,
body.zi-android-lite *::before,
body.zi-android-lite *::after {
    cursor: auto !important;
}

body.zi-android-lite button,
body.zi-android-lite a,
body.zi-android-lite input,
body.zi-android-lite select,
body.zi-android-lite textarea,
body.zi-android-lite [role="button"] {
    min-height: 44px;
    touch-action: manipulation;
}

body.zi-android-lite canvas {
    max-width: 100%;
    touch-action: none;
}

body.zi-android-lite #cur-dot,
body.zi-android-lite #cur-ring,
body.zi-android-lite .cursor,
body.zi-android-lite .custom-cursor {
    display: none !important;
}

body.zi-android-lite .orb,
body.zi-android-lite .orbs,
body.zi-android-lite .planet,
body.zi-android-lite .bg-grid,
body.zi-android-lite .float-particle,
body.zi-android-lite .meteor-shower,
body.zi-android-lite .aurora-ribbon,
body.zi-android-lite .nebula-band {
    opacity: 0 !important;
    visibility: hidden !important;
    animation: none !important;
}

body.zi-android-lite .bg-layer,
body.zi-android-lite .daylight-scene,
body.zi-android-lite .dark-cosmos {
    animation: none !important;
}

body.zi-portal-page #canvas {
    display: none !important;
}

body.zi-portal-page #music-player {
    left: 10px !important;
    right: 10px !important;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 10px) !important;
    width: auto !important;
    transform: none !important;
}

body.zi-game-page.zi-touch-ready {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 126px);
}

body.zi-native-controls {
    padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 18px);
}

body.zi-android-lite .game-topbar,
body.zi-android-lite .topbar,
body.zi-android-lite nav {
    padding-left: max(12px, env(safe-area-inset-left, 0px));
    padding-right: max(12px, env(safe-area-inset-right, 0px));
}

body.zi-android-lite .game-shell,
body.zi-android-lite .game-wrap,
body.zi-android-lite .container,
body.zi-android-lite .wrap {
    max-width: 100vw;
}

.zi-touch-ui {
    position: fixed;
    left: 0;
    right: 0;
    bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
    z-index: 10000;
    pointer-events: none;
}

.zi-touch-grid {
    display: flex;
    justify-content: space-between;
    align-items: flex-end;
    gap: 10px;
    width: min(720px, 96vw);
    margin: 0 auto;
}

.zi-touch-pad,
.zi-touch-actions {
    display: grid;
    gap: 7px;
    pointer-events: auto;
}

.zi-touch-pad {
    grid-template-columns: repeat(3, 52px);
    grid-template-rows: repeat(2, 52px);
}

.zi-touch-actions {
    grid-template-columns: repeat(2, 64px);
    grid-template-rows: repeat(2, 52px);
}

.zi-touch-btn {
    border: 1px solid rgba(255, 255, 255, 0.18);
    background: rgba(8, 12, 32, 0.62);
    color: #f6fbff;
    border-radius: 12px;
    font: 800 13px/1 Outfit, system-ui, sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    user-select: none;
    -webkit-user-select: none;
    touch-action: none;
    backdrop-filter: blur(8px);
    box-shadow: 0 8px 22px rgba(0, 0, 0, 0.18);
}

.zi-touch-btn:active,
.zi-touch-btn.zi-active {
    background: rgba(0, 242, 254, 0.24);
    border-color: rgba(0, 242, 254, 0.72);
    transform: scale(0.96);
}

.zi-touch-btn[data-code="ArrowUp"] { grid-column: 2; grid-row: 1; }
.zi-touch-btn[data-code="ArrowLeft"] { grid-column: 1; grid-row: 2; }
.zi-touch-btn[data-code="ArrowDown"] { grid-column: 2; grid-row: 2; }
.zi-touch-btn[data-code="ArrowRight"] { grid-column: 3; grid-row: 2; }

.zi-touch-help {
    position: fixed;
    top: calc(env(safe-area-inset-top, 0px) + 8px);
    left: 50%;
    transform: translateX(-50%);
    z-index: 10001;
    padding: 7px 11px;
    border-radius: 999px;
    font: 700 11px/1.2 Outfit, system-ui, sans-serif;
    color: rgba(255, 255, 255, 0.88);
    background: rgba(7, 10, 29, 0.64);
    border: 1px solid rgba(255, 255, 255, 0.16);
    backdrop-filter: blur(8px);
    pointer-events: none;
}

body.zi-page-hidden * {
    animation-play-state: paused !important;
}

@media (max-width: 420px) {
    .zi-touch-pad {
        grid-template-columns: repeat(3, 48px);
        grid-template-rows: repeat(2, 48px);
    }

    .zi-touch-actions {
        grid-template-columns: repeat(2, 58px);
        grid-template-rows: repeat(2, 48px);
    }

    .zi-touch-grid {
        width: 97vw;
    }
}

@media (max-height: 560px) {
    body.zi-game-page.zi-touch-ready {
        padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 104px);
    }

    .zi-touch-ui {
        transform: scale(0.88);
        transform-origin: bottom center;
    }
}
`;
        document.head.appendChild(style);
    }

    function markPage() {
        document.body.classList.add('zi-android-lite');
        document.body.classList.toggle('zi-game-page', isGamePage);
        document.body.classList.toggle('zi-portal-page', isPortal);
    }

    function hasNativeControls() {
        return !!document.querySelector([
            '.mobile-controls',
            '.touch-controls',
            '.tc-wrap',
            '.touchpad',
            '.touch-pad',
            '.touch-row',
            '#touch-controls',
            '#mobileControls',
            '#joyZone'
        ].join(','));
    }

    function makeKeyEvent(type, code) {
        const data = keyData[code] || { key: code, code: code, keyCode: 0 };
        const evt = new KeyboardEvent(type, {
            key: data.key,
            code: data.code,
            bubbles: true,
            cancelable: true
        });

        try {
            Object.defineProperty(evt, 'keyCode', { get: function () { return data.keyCode; } });
            Object.defineProperty(evt, 'which', { get: function () { return data.keyCode; } });
        } catch (_) {}

        return evt;
    }

    function emitKey(code, type) {
        document.dispatchEvent(makeKeyEvent(type, code));
        window.dispatchEvent(makeKeyEvent(type, code));
    }

    function tapKey(code, delay) {
        emitKey(code, 'keydown');
        window.setTimeout(function () {
            emitKey(code, 'keyup');
        }, delay || 64);
    }

    function shouldIgnoreTarget(target) {
        return !!(target && target.closest('input, textarea, select, button, a, [contenteditable], .zi-touch-ui'));
    }

    function buildTouchControls() {
        if (!isGamePage) return;

        const nativeControls = hasNativeControls();
        document.body.classList.toggle('zi-native-controls', nativeControls);
        if (nativeControls) return;

        document.body.classList.add('zi-touch-ready');

        const ui = document.createElement('div');
        ui.className = 'zi-touch-ui';
        ui.innerHTML = [
            '<div class="zi-touch-grid">',
            '  <div class="zi-touch-pad" aria-label="Kontrol arah">',
            '    <button class="zi-touch-btn" data-code="ArrowUp" type="button" aria-label="Atas">UP</button>',
            '    <button class="zi-touch-btn" data-code="ArrowLeft" type="button" aria-label="Kiri">LEFT</button>',
            '    <button class="zi-touch-btn" data-code="ArrowDown" type="button" aria-label="Bawah">DOWN</button>',
            '    <button class="zi-touch-btn" data-code="ArrowRight" type="button" aria-label="Kanan">RIGHT</button>',
            '  </div>',
            '  <div class="zi-touch-actions" aria-label="Kontrol aksi">',
            '    <button class="zi-touch-btn" data-code="Space" type="button" aria-label="Aksi utama">A</button>',
            '    <button class="zi-touch-btn" data-code="Enter" type="button" aria-label="Mulai">B</button>',
            '    <button class="zi-touch-btn" data-code="KeyZ" type="button" aria-label="Aksi Z">Z</button>',
            '    <button class="zi-touch-btn" data-code="Escape" type="button" aria-label="Pause">II</button>',
            '  </div>',
            '</div>'
        ].join('');

        ui.querySelectorAll('.zi-touch-btn').forEach(function (button) {
            const code = button.dataset.code;
            let active = false;

            function start(ev) {
                ev.preventDefault();
                if (active) return;
                active = true;
                button.classList.add('zi-active');
                emitKey(code, 'keydown');
            }

            function end(ev) {
                if (ev) ev.preventDefault();
                if (!active) return;
                active = false;
                button.classList.remove('zi-active');
                emitKey(code, 'keyup');
            }

            if (window.PointerEvent) {
                button.addEventListener('pointerdown', start);
                button.addEventListener('pointerup', end);
                button.addEventListener('pointercancel', end);
                button.addEventListener('pointerleave', end);
            } else {
                button.addEventListener('touchstart', start, { passive: false });
                button.addEventListener('touchend', end, { passive: false });
                button.addEventListener('touchcancel', end, { passive: false });
            }
        });

        document.body.appendChild(ui);
    }

    function bindGestures() {
        if (!isGamePage) return;

        let startX = 0;
        let startY = 0;
        let active = false;

        document.addEventListener('touchstart', function (ev) {
            if (!ev.touches || ev.touches.length !== 1) return;
            if (shouldIgnoreTarget(ev.target)) return;
            startX = ev.touches[0].clientX;
            startY = ev.touches[0].clientY;
            active = true;
        }, { passive: true });

        document.addEventListener('touchend', function (ev) {
            if (!active) return;
            active = false;
            if (!ev.changedTouches || ev.changedTouches.length !== 1) return;

            const endX = ev.changedTouches[0].clientX;
            const endY = ev.changedTouches[0].clientY;
            const dx = endX - startX;
            const dy = endY - startY;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);

            if (absX < 22 && absY < 22) {
                const target = document.elementFromPoint(endX, endY);
                if (shouldIgnoreTarget(target)) return;
                tapKey('Space', 48);
                tapKey('Enter', 64);
                const canvas = document.querySelector('canvas');
                if (canvas) {
                    canvas.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
                }
                return;
            }

            if (Math.max(absX, absY) < 28) return;
            tapKey(absX > absY ? (dx > 0 ? 'ArrowRight' : 'ArrowLeft') : (dy > 0 ? 'ArrowDown' : 'ArrowUp'), 70);
        }, { passive: true });
    }

    function preventDoubleTapZoom() {
        let lastTouchEnd = 0;
        document.addEventListener('touchend', function (event) {
            const now = Date.now();
            if (now - lastTouchEnd <= 280) {
                event.preventDefault();
            }
            lastTouchEnd = now;
        }, { passive: false });
    }

    function showHint() {
        if (!isGamePage || hasNativeControls()) return;

        const hint = document.createElement('div');
        hint.className = 'zi-touch-help';
        hint.textContent = 'Mode Android aktif: swipe, tap, atau tombol virtual';
        document.body.appendChild(hint);

        window.setTimeout(function () {
            if (hint.parentNode) hint.parentNode.removeChild(hint);
        }, 2400);
    }

    function pauseWhenHidden() {
        document.addEventListener('visibilitychange', function () {
            document.body.classList.toggle('zi-page-hidden', document.hidden);
        });
    }

    tuneViewport();
    injectStyle();

    ready(function () {
        markPage();
        enhanceGameShell();
        buildTouchControls();
        bindGestures();
        preventDoubleTapZoom();
        showHint();
        pauseWhenHidden();
    });
})();
