import { validateAnalysisPayload } from './analysisValidation';
import { buildAtsAnalysis } from './ats/scoring';
import { analyzePlainTextDocument } from './ats/documentDiagnostics';

/**
 * Analisa uma vaga em relação ao currículo usando a API local do VagaClara.
 * @param {string} curriculo - Curriculo base do usuario.
 * @param {string} vaga - Texto da descricao da vaga.
 * @returns {Promise<object>} Objeto estruturado com análise e orientações.
 */
export async function analisarVaga(
  curriculo,
  vaga,
  documentDiagnostics = null,
  onProgress = () => {},
) {
  let response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 30000);

  try {
    response = await fetch('/api/analisar-vaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculo, vaga }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('A análise demorou mais do que o esperado. Tente novamente.');
    }
    throw new Error('Não foi possível conectar com a API local. Reinicie o servidor e tente novamente.');
  } finally {
    window.clearTimeout(timeout);
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

  onProgress('Organizando requisitos e evidências...');
  return buildAtsAnalysis(
    data,
    documentDiagnostics || analyzePlainTextDocument(curriculo),
  );
}
