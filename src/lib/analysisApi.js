import { validateAnalysisPayload } from './analysisValidation';

/**
 * Analisa uma vaga em relacao ao curriculo usando a API local do MatchCV.
 * @param {string} curriculo - Curriculo base do usuario.
 * @param {string} vaga - Texto da descricao da vaga.
 * @returns {Promise<object>} Objeto estruturado com analise, score, curriculo otimizado e prep.
 */
export async function analisarVaga(curriculo, vaga) {
  let response;

  try {
    response = await fetch('/api/analisar-vaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculo, vaga })
    });
  } catch {
    throw new Error('Nao foi possivel conectar com a API local. Reinicie o servidor com npm run dev e tente novamente.');
  }

  const contentType = response.headers.get('content-type') || '';
  const data = contentType.includes('application/json') ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new Error(data?.error || 'Erro ao analisar a vaga. Tente novamente.');
  }

  const validation = validateAnalysisPayload(data);
  if (!validation.valid) {
    throw new Error(validation.message);
  }

  return data;
}
