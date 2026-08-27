import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFileSync(join(root, file), 'utf8');
const failures = [];

function assert(condition, message) {
    if (!condition) failures.push(message);
}

const portal = read('index.html');
const modernUi = read('zi-modern-ui.css');
const runtime = read('site-runtime.js');
const serviceWorker = read('sw.js');
const manifest = read('manifest.webmanifest');
let manifestData = null;
try { manifestData = JSON.parse(manifest); } catch (_) { }
const gamePages = readdirSync(root)
    .filter(file => file.endsWith('.html'))
    .filter(file => !['index.html', 'profile.html', 'settings.html', '404.html', 'offline.html'].includes(file))
    .filter(file => !file.includes('backup'));
const routes = [...new Set([...portal.matchAll(/href=["']([^"']+\.html)["']/gi)]
    .map(match => match[1])
    .filter(file => gamePages.includes(file)))];
const thumbFiles = readdirSync(join(root, 'assets', 'game-thumbs'))
    .filter(file => file.endsWith('.jpg'));

assert(portal.includes('data-page="portal"'), 'portal: missing data-page marker');
assert(portal.includes('id="searchInput"'), 'portal: search input is missing');
assert(portal.includes('id="favOnlyBtn"'), 'portal: favorite filter is missing');
assert(portal.includes('id="randomBtn"'), 'portal: random action is missing');
assert(portal.includes('id="cmdBtn"'), 'portal: command center is missing');
assert(portal.includes('class="mobile-quickbar"'), 'portal: mobile quickbar is missing');
assert(portal.includes('zi-modern-ui.css'), 'portal: modern UI layer is missing');
assert(portal.includes('id="music-player"'), 'portal: music player is missing');
assert(!portal.includes('soundhelix.com'), 'portal: external music URL should not be required');
assert(read('sounds.js').includes('setMusicVolume'), 'audio: procedural music volume control is missing');

assert(routes.length === gamePages.length, `portal: expected ${gamePages.length} unique game routes, found ${routes.length}`);
assert(thumbFiles.length === gamePages.length, `thumbnails: expected ${gamePages.length}, found ${thumbFiles.length}`);
for (const route of gamePages) {
    const key = route.replace(/\.html$/i, '');
    assert(existsSync(join(root, 'assets', 'game-thumbs', `${key}.jpg`)), `${route}: missing thumbnail`);
    assert(serviceWorker.includes(`./assets/game-thumbs/${key}.jpg`), `${route}: thumbnail missing from offline shell`);
    const source = read(route);
    assert(source.includes('mobile-touch.js'), `${route}: missing shared mobile runtime`);
}

assert(read('offline.html').includes('Coba lagi'), 'offline: retry action is missing');
assert(serviceWorker.includes("const CACHE_NAME = 'zi-game-v4'"), 'service worker cache version was not bumped');
assert(serviceWorker.includes("caches.match('./offline.html')"), 'service worker has no offline navigation fallback');
assert(runtime.includes('beforeinstallprompt'), 'runtime: install prompt is missing');
assert(runtime.includes('Versi baru ZI GAME siap dipakai.'), 'runtime: update notice is missing');
assert(runtime.includes('setupNavigationFeedback'), 'runtime: navigation feedback is missing');
assert(runtime.includes('setupConnectionStatus'), 'runtime: offline status is missing');
assert(manifest.includes('"shortcuts"'), 'manifest: PWA shortcuts are missing');
assert(Array.isArray(manifestData?.shortcuts) && manifestData.shortcuts.length >= 2, 'manifest: shortcuts are invalid');
assert(modernUi.includes('.zi-runtime-notice'), 'modern UI: runtime notice styling is missing');
assert(modernUi.includes('zi-navigation-progress'), 'modern UI: navigation progress styling is missing');
assert(modernUi.includes('content-visibility: auto'), 'modern UI: below-fold rendering optimization is missing');

if (process.env.ZI_GAME_BASE_URL) {
    const base = process.env.ZI_GAME_BASE_URL.replace(/\/$/, '');
    const checks = ['index.html', 'offline.html', ...gamePages, ...thumbFiles.map(file => `assets/game-thumbs/${file}`)];
    for (const path of checks) {
        try {
            const response = await fetch(`${base}/${path}`);
            assert(response.ok, `server: ${path} returned ${response.status}`);
        } catch (error) {
            failures.push(`server: ${path} request failed (${error.message})`);
        }
    }
}

if (failures.length) {
    console.error(`UI smoke failed (${failures.length}):\n- ${failures.join('\n- ')}`);
    process.exit(1);
}

console.log(`UI smoke passed: ${routes.length} game routes, ${thumbFiles.length} thumbnails, PWA/offline contract verified.`);
