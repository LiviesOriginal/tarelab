import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const buildDirectory = resolve(import.meta.dirname, '../climb');
const html = await readFile(resolve(buildDirectory, 'index.html'), 'utf8');
const manifest = JSON.parse(
  await readFile(resolve(buildDirectory, 'manifest.webmanifest'), 'utf8')
);
const files = await readdir(buildDirectory);
const serviceWorker = await readFile(resolve(buildDirectory, 'sw.js'), 'utf8');

assert.match(html, /id="root"/, 'the Climb React mount point must be in the built page');
assert.match(html, /\/climb\/assets\/.+\.js/, 'the built page must load its Vite bundle');
assert.match(html, /manifest\.webmanifest/, 'the built page must link its PWA manifest');
assert.match(html, /registerSW\.js/, 'the built page must register its service worker');
assert.match(html, /html, body \{ margin: 0; height: 100%; background: #161228;/);
assert.match(html, /#root \{ min-height: 100%; \}/);
assert.equal(manifest.start_url, '/climb/');
assert.equal(manifest.scope, '/climb/');
assert.equal(manifest.display, 'standalone');
assert.ok(manifest.icons.some((icon) => icon.src === 'icon.svg'));
assert.ok(files.includes('sw.js'), 'the PWA service worker must be emitted');
assert.ok(files.includes('icon.svg'), 'the app icon must be emitted');
assert.match(serviceWorker, /precacheAndRoute/);
assert.match(serviceWorker, /assets\/index-/);
assert.match(serviceWorker, /createHandlerBoundToURL\("index\.html"\)/);

const redirects = await readFile(resolve(import.meta.dirname, '../_redirects'), 'utf8');
assert.match(redirects, /^\/climb \/climb\/ 301$/m);

console.log('Climb build, PWA manifest, service worker, icon, and /climb redirect verified.');
