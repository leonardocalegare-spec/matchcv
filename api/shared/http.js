import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

export const MAX_BODY_BYTES = 100 * 1024;

export function loadLocalEnv(envPath = path.resolve(process.cwd(), '.env')) {
  if (!existsSync(envPath)) return;

  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;

    const [key, ...valueParts] = trimmed.split('=');
    const value = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
    if (key && !process.env[key]) process.env[key] = value;
  }
}

export function readJsonBody(req, maxBytes = MAX_BODY_BYTES) {
  return new Promise((resolve, reject) => {
    let data = '';
    let tooLarge = false;

    req.on('data', (chunk) => {
      if (tooLarge) return;
      data += chunk;
      if (Buffer.byteLength(data) <= maxBytes) return;

      tooLarge = true;
      data = '';
      const error = new Error('Payload excede o limite permitido.');
      error.statusCode = 413;
      reject(error);
    });

    req.on('end', () => {
      if (tooLarge) return;
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch {
        const error = new Error('JSON inválido.');
        error.statusCode = 400;
        reject(error);
      }
    });

    req.on('error', reject);
  });
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export function sendRequestError(res, error) {
  sendJson(res, error.statusCode || 400, {
    error: error.message || 'Requisição inválida.',
  });
}
