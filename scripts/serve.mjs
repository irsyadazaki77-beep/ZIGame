import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(join(fileURLToPath(new URL('.', import.meta.url)), '..'));
const port = Number(process.env.PORT || 4173);
const mime = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.jpg': 'image/jpeg',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.webmanifest': 'application/manifest+json; charset=utf-8'
};

function safePath(urlPath) {
    let pathname;
    try { pathname = decodeURIComponent(urlPath.split('?')[0].split('#')[0]); } catch (_) { return ''; }
    if (!pathname || pathname === '/') pathname = '/index.html';
    const candidate = resolve(root, `.${pathname}`);
    const rel = relative(root, candidate);
    return rel && !rel.startsWith('..') && !rel.includes(`..${process.platform === 'win32' ? '\\' : '/'}`)
        ? candidate
        : '';
}

const server = createServer((request, response) => {
    const file = safePath(request.url || '/');
    if (!file || !existsSync(file) || !statSync(file).isFile()) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
    }
    response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': mime[extname(file).toLowerCase()] || 'application/octet-stream'
    });
    createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
    console.log(`ZI GAME test server listening on http://127.0.0.1:${port}`);
});
