import { normalizeRequestBody, validateCurriculoVagaInput } from './validators.js';
import { orchestrateAnalysis } from './analysisOrchestrator.js';

function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    sendJson(res, 405, { error: 'Metodo nao permitido.' });
    return;
  }

  try {
    const body = normalizeRequestBody(req.body);
    const validation = validateCurriculoVagaInput(body);

    if (!validation.valid) {
      sendJson(res, 400, { error: validation.error });
      return;
    }

    const { curriculo, vaga } = validation.data;
    const analysis = await orchestrateAnalysis(curriculo, vaga);

    sendJson(res, 200, analysis);
  } catch (error) {
    console.error('Falha ao analisar vaga:', error.message);
    sendJson(res, error.statusCode || 500, {
      error: error.message || 'Erro ao analisar a vaga. Tente novamente.',
    });
  }
}