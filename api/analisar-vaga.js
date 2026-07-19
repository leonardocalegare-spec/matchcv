import { normalizeRequestBody, validateCurriculoVagaInput } from './validators.js';
import { orchestrateAnalysis } from './analysisOrchestrator.js';
import { sendJson } from './shared/http.js';

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
      sendJson(res, validation.statusCode || 400, { error: validation.error });
      return;
    }

    const { curriculo, vaga, empresaManual, usarContextoPublico } = validation.data;
    const analysis = await orchestrateAnalysis(curriculo, vaga, empresaManual, { usarContextoPublico });

    sendJson(res, 200, analysis);
  } catch (error) {
    console.error('Falha ao analisar vaga:', error.message);
    sendJson(res, error.statusCode || 500, {
      error: error.message || 'Erro ao analisar a vaga. Tente novamente.',
    });
  }
}
