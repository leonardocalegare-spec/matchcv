import http from 'node:http';
import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import analisarVagaHandler from './analisar-vaga.js';
import { loadLocalEnv, readJsonBody, sendRequestError } from './shared/http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '..', 'dist');
const PORT = Number(process.env.PORT || 8787);
const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
};

function serveStatic(req, res) {
  const pathname = decodeURIComponent(new URL(req.url, 'http://127.0.0.1').pathname);
  const requestedPath = pathname === '/' ? '/index.html' : pathname;
  let filePath = path.resolve(DIST_DIR, `.${requestedPath}`);

  const relativePath = path.relative(DIST_DIR, filePath);
  const isOutsideDist = relativePath.startsWith('..') || path.isAbsolute(relativePath);
  if (isOutsideDist || !existsSync(filePath)) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  if (!existsSync(filePath)) {
    res.statusCode = 503;
    res.end('Build não encontrado. Execute npm run build.');
    return;
  }

  res.setHeader('Content-Type', MIME_TYPES[path.extname(filePath)] || 'application/octet-stream');
  res.end(readFileSync(filePath));
}

loadLocalEnv(path.resolve(DIST_DIR, '..', '.env'));

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  const isAnalysis = pathname === '/api/analisar-vaga';
  if (!isAnalysis) {
    serveStatic(req, res);
    return;
  }

  try {
    req.body = req.method === 'POST' ? await readJsonBody(req) : {};
    await analisarVagaHandler(req, res);
  } catch (error) {
    sendRequestError(res, error);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`VagaClara rodando em http://127.0.0.1:${PORT}`);
});
