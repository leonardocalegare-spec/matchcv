import test from 'node:test';
import assert from 'node:assert/strict';
import { orchestrateAnalysis } from '../api/analysisOrchestrator.js';

test('não realiza consulta pública sem autorização e expõe o complemento do Ollama', async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  let ollamaBody;
  globalThis.fetch = async (url, options = {}) => {
    calls.push(String(url));
    ollamaBody = JSON.parse(options.body);
    return {
      ok: true,
      json: async () => ({
        response: JSON.stringify({
          empresa_contexto: { resumo: 'Indisponível', porte: 'Indisponível', sinais_relevantes: [] },
          gaps_identificados: [],
          dicas: [{ requirement_id: 'job-1', dica: 'Destaque React', motivo: 'A vaga solicita React', fonte: 'vaga' }],
          reformulacao_sugerida: 'Desenvolvi uma aplicação React.',
          faltando_no_curriculo: [],
        }),
      }),
    };
  };

  try {
    const result = await orchestrateAnalysis(
      'Desenvolvi uma aplicação React.',
      'Vaga Desenvolvedor Junior. Requisito obrigatório: React.',
      null,
      { usarContextoPublico: false },
    );

    assert.equal(calls.length, 1);
    assert.match(calls[0], /127\.0\.0\.1:11434/);
    assert.equal(result.llm_analysis.dicas[0].fonte, 'vaga');
    assert.doesNotMatch(ollamaBody.prompt, /"match_score"/);
    assert.match(result.provider_notice, /Nenhuma consulta pública/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
