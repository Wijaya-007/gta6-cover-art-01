// VICE HEAT — tiny static server for local development and screenshots.
// Serves the app/ directory offline on 127.0.0.1. Run: `node serve.ts`
// (or `node serve.ts --port 8081`). No dependencies, Node 22 stdlib only.
// Rebuild #11: same server, kept for the Playwright screenshot runner.

import { createServer } from 'node:http';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { extname, join, normalize, resolve } from 'node:path';

const MIME: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
};

const args = process.argv.slice(2);
const portIdx = args.indexOf('--port');
const port = portIdx >= 0 ? Number(args[portIdx + 1]) || 8081 : 8081;
const root = resolve('app');

const server = createServer((req, res) => {
  const url = new URL(req.url || '/', 'http://127.0.0.1');
  let path = decodeURIComponent(url.pathname);
  if (path === '/') path = '/index.html';
  const file = normalize(join(root, path));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('not found\n');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(file).toLowerCase()] || 'application/octet-stream' });
  res.end(readFileSync(file));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`VICE HEAT studio at http://127.0.0.1:${port}/`);
});
