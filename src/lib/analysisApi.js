import { validateAnalysisPayload } from './analysisValidation';
import { runSemanticMatching } from './ats/semanticMatcher';
import { buildAtsAnalysis } from './ats/scoring';
import { analyzePlainTextDocument } from './ats/documentDiagnostics';

/**
 * Analisa uma vaga em relação ao currículo usando a API local do VagaClara.
 * @param {string} curriculo - Curriculo base do usuario.
 * @param {string} vaga - Texto da descricao da vaga.
 * @param {string} empresaManual - Nome da empresa inserido manualmente.
 * @returns {Promise<object>} Objeto estruturado com analise, score, curriculo otimizado e prep.
 */
export async function analisarVaga(
  curriculo,
  vaga,
  empresaManual = null,
  usarContextoPublico = false,
  documentDiagnostics = null,
  onProgress = () => {},
) {
  let response;
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 90000);

  try {
    response = await fetch('/api/analisar-vaga', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ curriculo, vaga, empresaManual, usarContextoPublico }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('A análise excedeu 90 segundos. Verifique se o Ollama está respondendo e tente novamente.');
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

  onProgress('Comparando requisitos por significado no seu navegador...');
  let semanticResult;
  try {
    semanticResult = await runSemanticMatching(
      curriculo,
      data.analise_aderencia.requisitos,
      onProgress,
    );
  } catch (error) {
    console.warn('Análise semântica local indisponível:', error.message);
    semanticResult = { status: 'unavailable', matches: [], model: null };
  }
  onProgress('Calculando a compatibilidade ATS explicada...');
  return buildAtsAnalysis(
    data,
    documentDiagnostics || analyzePlainTextDocument(curriculo),
    semanticResult,
  );
}
