import { analisarCurriculoComAgente } from './careerAgent.js';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function normalizeBody(body) {
  if (typeof body === 'string') {
    return JSON.parse(body);
  }

  return body ?? {};
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  let body;
  try {
    body = normalizeBody(req.body);
  } catch {
    sendJson(res, 400, { error: 'JSON invalido.' });
    return;
  }

  const curriculo = typeof body.curriculo === 'string' ? body.curriculo.trim() : '';
  const vaga = typeof body.vaga === 'string' ? body.vaga.trim() : '';

  if (!curriculo || !vaga) {
    sendJson(res, 400, { error: 'Preencha o curriculo base e a descricao da vaga.' });
    return;
  }

  try {
    const analysis = analisarCurriculoComAgente(curriculo, vaga);
    sendJson(res, 200, analysis);
  } catch (error) {
    console.error('Falha ao analisar vaga:', error.details || error);
    sendJson(res, error.statusCode || 500, {
      error: error.message || 'Erro ao analisar a vaga. Tente novamente.',
    });
  }
}
