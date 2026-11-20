// A tiny static server for app/ (Node 22, standard library only), so an
// entry can be tried locally without a build step: `node serve.ts` serves
// app/ on http://localhost:8080. It sends the MIME types an offline web app
// needs, refuses any path outside app/, and otherwise does nothing clever:
// this is a development convenience, not a web server for the internet.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./app', import.meta.url)));
const args = process.argv.slice(2);
const portIndex = args.indexOf('--port');
const requested = portIndex === -1 ? 8080 : Number(args[portIndex + 1]);
const port = Number.isInteger(requested) && requested > 0 && requested < 65536 ? requested : 8080;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.otf': 'font/otf',
  '.bin': 'application/octet-stream',
  '.wasm': 'application/wasm',
  '.txt': 'text/plain; charset=utf-8',
};

const server = createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const rel = normalize(decodeURIComponent(url.pathname)).replace(/^[/\\]+/, '');
  const file = join(root, rel);
  if (!file.startsWith(root + sep) && file !== root) {
    res.writeHead(403);
    res.end('forbidden');
    return;
  }
  let path = file;
  try {
    if (statSync(path).isDirectory()) path = join(path, 'index.html');
  } catch (_) {
    res.writeHead(404);
    res.end('not found');
    return;
  }
  res.writeHead(200, { 'content-type': MIME[extname(path)] ?? 'application/octet-stream' });
  createReadStream(path).pipe(res);
});

server.listen(port, () => {
  console.log(`NEON TIDE served at http://localhost:${port}/`);
});
