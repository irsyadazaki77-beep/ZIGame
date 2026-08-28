const CACHE_NAME = 'zi-game-v7';
const APP_SHELL = [
    './', './index.html', './profile.html', './settings.html', './404.html', './offline.html',
    './index-portal.css', './sidebar.css', './portal-page.css',
    './game-shared.css', './mobile-touch.js', './sounds.js', './sounds.js?v=3', './site-runtime.js', './site-runtime.js?v=2',
    './manifest.webmanifest', './favicon.svg', './styles.css', './app.js', './portal-page.js',
    './zi-final-polish.js', './polybridge3.css', './hyperlightdrifter.css', './zi-modern-ui.css', './zi-modern-ui.css?v=1',
    './assets/game-thumbs/2048.jpg', './assets/game-thumbs/babaisyou.jpg',
    './assets/game-thumbs/breakout.jpg', './assets/game-thumbs/colormatch.jpg',
    './assets/game-thumbs/dinorun.jpg', './assets/game-thumbs/flappy.jpg',
    './assets/game-thumbs/geometry.jpg', './assets/game-thumbs/gris.jpg',
    './assets/game-thumbs/hangman.jpg', './assets/game-thumbs/hyperlightdrifter.jpg',
    './assets/game-thumbs/katanazero.jpg', './assets/game-thumbs/ludo.jpg',
    './assets/game-thumbs/mathquiz.jpg', './assets/game-thumbs/memory.jpg',
    './assets/game-thumbs/minesweeper.jpg', './assets/game-thumbs/minimetro.jpg',
    './assets/game-thumbs/pacmaze.jpg', './assets/game-thumbs/polybridge3.jpg',
    './assets/game-thumbs/pong.jpg', './assets/game-thumbs/rps.jpg',
    './assets/game-thumbs/sayonarawildhearts.jpg', './assets/game-thumbs/simon.jpg',
    './assets/game-thumbs/snake.jpg', './assets/game-thumbs/spaceshooter.jpg',
    './assets/game-thumbs/superhot.jpg', './assets/game-thumbs/tetris.jpg',
    './assets/game-thumbs/thumper.jpg', './assets/game-thumbs/tictactoe.jpg',
    './assets/game-thumbs/vvvvvv.jpg', './assets/game-thumbs/whackamole.jpg',
    './assets/game-thumbs/wordle.jpg',
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

self.addEventListener('message', event => {
    if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
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
            .catch(() => caches.match(event.request, { ignoreSearch: true }).then(cached => {
                if (cached) return cached;
                if (event.request.mode === 'navigate') return caches.match('./offline.html');
                return new Response('', { status: 503, statusText: 'Offline' });
            }))
    );
});
