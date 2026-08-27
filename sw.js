const CACHE_NAME = 'zi-game-v2';
const APP_SHELL = [
    './', './index.html', './profile.html', './settings.html', './404.html',
    './index-portal.css', './sidebar.css', './zi-final-polish.css', './portal-page.css',
    './game-shared.css', './mobile-touch.js', './sounds.js', './site-runtime.js',
    './manifest.webmanifest', './favicon.svg', './styles.css', './app.js',
    './polybridge3.css', './hyperlightdrifter.css', './zi-accessibility.css',
    './2048.html', './babaisyou.html', './breakout.html', './colormatch.html',
    './dinorun.html', './flappy.html', './geometry.html', './gris.html',
    './hangman.html', './hyperlightdrifter.html', './katanazero.html', './ludo.html',
    './mathquiz.html', './memory.html', './minesweeper.html', './minimetro.html',
    './pacmaze.html', './polybridge3.html', './pong.html', './rps.html',
    './sayonarawildhearts.html', './simon.html', './snake.html', './spaceshooter.html',
    './superhot.html', './tetris.html', './thumper.html', './tictactoe.html',
    './vvvvvv.html', './whackamole.html', './wordle.html'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
    event.respondWith(
        fetch(event.request)
            .then(response => {
                const copy = response.clone();
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
                return response;
            })
            .catch(() => caches.match(event.request).then(cached => {
                if (cached) return cached;
                if (event.request.mode === 'navigate') return caches.match('./404.html');
                return new Response('', { status: 503, statusText: 'Offline' });
            }))
    );
});
