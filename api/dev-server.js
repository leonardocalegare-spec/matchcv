import http from 'node:http';
import { existsSync, readFileSync } from 'node:fs';

const PORT = Number(process.env.API_PORT || 8787);

function loadLocalEnv() {
  if (!existsSync('.env')) {
    return;
  }

  const lines = readFileSync('.env', 'utf8').split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) {
      continue;
    }

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');

    if (key && !process.env[key]) {
      process.env[key] = value;
    }
  }
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';

    req.on('data', (chunk) => {
      data += chunk;
    });

    req.on('end', () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

loadLocalEnv();
const { default: handler } = await import('./analisar-vaga.js');

const server = http.createServer(async (req, res) => {
  if (req.url !== '/api/analisar-vaga') {
    res.statusCode = 404;
    res.end('Not found');
    return;
  }

  try {
    req.body = await readJsonBody(req);
    await handler(req, res);
  } catch {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ error: 'JSON invalido.' }));
  }
});

server.listen(PORT, () => {
  console.log(`MatchCV API dev server running at http://127.0.0.1:${PORT}`);
});
