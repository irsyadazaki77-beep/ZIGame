import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join, dirname, extname } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const files = readdirSync(root, { withFileTypes: true });
const htmlFiles = files.filter(file => file.isFile() && file.name.endsWith('.html')).map(file => file.name);
const jsFiles = files.filter(file => file.isFile() && file.name.endsWith('.js')).map(file => file.name);
const errors = [];
const warnings = [];
const gameFiles = htmlFiles.filter(file => !['index.html', 'profile.html', 'settings.html', '404.html', 'offline.html'].includes(file) && !file.includes('backup'));

function report(condition, message) {
    if (!condition) errors.push(message);
}

for (const file of jsFiles) {
    const result = spawnSync(process.execPath, ['--check', join(root, file)], { encoding: 'utf8' });
    report(result.status === 0, `${file}: JavaScript syntax error\n${result.stderr || ''}`);
}

for (const file of htmlFiles) {
    const source = readFileSync(join(root, file), 'utf8');
    const inlineScripts = [...source.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)]
        .map(match => match[1].trim())
        .filter(Boolean);
    inlineScripts.forEach((script, index) => {
        const result = spawnSync(process.execPath, ['--check'], { input: script, encoding: 'utf8' });
        report(result.status === 0, `${file}: inline script ${index + 1} syntax error\n${result.stderr || ''}`);
    });
    // Only inspect real markup tags; template literals inside inline scripts can
    // contain `${href}` and are not static asset references.
    const htmlMarkup = source.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '');
    const markup = [...htmlMarkup.matchAll(/<(?:a|link|script|img|audio|source|video)[^>]*>/gi)].map(match => match[0]).join('\n');
    const references = [...markup.matchAll(/(?:href|src)\s*=\s*["']([^"']+)["']/gi)].map(match => match[1]);
    for (const reference of references) {
        if (!reference || reference.startsWith('#') || /^(https?:|mailto:|data:|javascript:)/i.test(reference)) continue;
        const clean = reference.split('#')[0].split('?')[0];
        if (clean && !existsSync(join(root, clean))) errors.push(`${file}: missing local asset ${reference}`);
    }
    report(/<title>\s*[^<]+<\/title>/i.test(source), `${file}: missing title`);
    report(/<meta\s+name=["']viewport["']/i.test(source), `${file}: missing viewport metadata`);
    if (file !== '404.html') report(/lang=["']id["']/i.test(source.slice(0, 300)), `${file}: missing lang="id"`);
}

const index = readFileSync(join(root, 'index.html'), 'utf8');
report(!index.includes('localhost:9999'), 'index.html: production debug beacon still present');
report((index.match(/class="game-card/g) || []).length >= 30, 'index.html: expected game cards are missing');
for (const game of gameFiles) {
    const source = readFileSync(join(root, game), 'utf8');
    report(source.includes('mobile-touch.js'), `${game}: missing mobile-touch.js`);
    if (!source.includes('site-runtime.js') && !source.includes('mobile-touch.js')) warnings.push(`${game}: shared runtime is missing`);
}

const duplicateLinks = [...index.matchAll(/href=["']([^"']+\.html)["']/gi)].map(match => match[1]);
const duplicates = [...new Set(duplicateLinks.filter((value, index, list) => list.indexOf(value) !== index))];
if (duplicates.length) warnings.push(`index.html: repeated catalog links (intentional featured cards): ${duplicates.join(', ')}`);

if (process.argv.includes('--js-only')) errors.splice(0, errors.length, ...errors.filter(error => /JavaScript syntax error/.test(error)));
if (warnings.length) console.warn(`Warnings (${warnings.length}):\n- ${warnings.join('\n- ')}`);
if (errors.length) {
    console.error(`Validation failed (${errors.length}):\n- ${errors.join('\n- ')}`);
    process.exit(1);
}
console.log(`Validation passed: ${htmlFiles.length} HTML pages, ${jsFiles.length} JavaScript files, ${gameFiles.length} playable game pages.`);
