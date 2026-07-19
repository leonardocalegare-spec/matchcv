import http from 'node:http';
import { loadLocalEnv, readJsonBody, sendRequestError } from './shared/http.js';

const PORT = Number(process.env.API_PORT || 8787);

loadLocalEnv();
const { default: handler } = await import('./analisar-vaga.js');

const server = http.createServer(async (req, res) => {
  const pathname = new URL(req.url, 'http://127.0.0.1').pathname;
  const isAnalysis = pathname === '/api/analisar-vaga';
  if (!isAnalysis) {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  try {
    req.body = req.method === 'POST' ? await readJsonBody(req) : {};
    await handler(req, res);
  } catch (error) {
    sendRequestError(res, error);
  }
});

server.listen(PORT, () => {
  console.log(`VagaClara API dev server running at http://127.0.0.1:${PORT}`);
});
