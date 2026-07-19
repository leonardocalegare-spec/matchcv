import { analisarCurriculoComAgente } from './careerAgent.js';
import { extractJobInfo, fetchCompanyContext, fetchMarketContext, buildFinalPrompt, callLLM } from './deterministicPipeline.js';

export async function orchestrateAnalysis(curriculo, vaga, empresaManual = null, options = {}) {
  const usarContextoPublico = options.usarContextoPublico === true;
  const deterministicAnalysis = await analisarCurriculoComAgente(curriculo, vaga, empresaManual);

  let response = {
    ...deterministicAnalysis,
    provider: 'deterministic-agent',
  };

  const jobInfo = extractJobInfo(vaga, empresaManual);
  let companyContext = { available: false, summary: 'Indisponível', size: 'Indisponível', recentSignals: [] };
  let marketContext = { available: false, insights: [] };

  if (usarContextoPublico) {
    companyContext = await fetchCompanyContext(jobInfo.companyName);
    marketContext = await fetchMarketContext(jobInfo.stackKeywords, jobInfo.seniority);

    response.empresa_pesquisa = {
      disponivel: companyContext.available,
      nome_detectado: jobInfo.companyName,
      resumo: companyContext.summary,
      porte: companyContext.size,
      sinais_relevantes: companyContext.recentSignals,
      fonte: companyContext.source,
    };
  } else {
    response.empresa_pesquisa = {
      disponivel: false,
      nome_detectado: jobInfo.companyName,
      resumo: 'Consulta pública não autorizada.',
      porte: 'Indisponível',
      sinais_relevantes: []
    };
  }

  try {
    const finalPrompt = buildFinalPrompt(curriculo, jobInfo, companyContext, marketContext);
    const llmAnalysis = await callLLM(finalPrompt);

    response = {
      ...response,
      llm_analysis: llmAnalysis,
      provider: 'deterministic-pipeline-ollama',
      provider_notice: usarContextoPublico
        ? 'Análise local complementada pelo Ollama e por consultas públicas autorizadas.'
        : 'Análise local complementada pelo Ollama. Nenhuma consulta pública foi realizada.',
    };
  } catch {
    response.provider_notice = usarContextoPublico
      ? 'Análise heurística local concluída. Consultas públicas autorizadas foram tentadas; o Ollama não respondeu.'
      : 'Análise heurística 100% local concluída. O Ollama não respondeu e nenhuma consulta pública foi realizada.';
  }

  if (response.empresa_pesquisa?.disponivel) {
    response.prep_entrevista.perguntas_esperadas.push({
      pergunta: `O que você sabe sobre a ${response.empresa_pesquisa.nome_detectado}?`,
      dica_resposta: `Pesquisa pública encontrada: ${response.empresa_pesquisa.resumo} — leve isso para a entrevista para mostrar interesse genuíno na empresa, além dos pontos técnicos.`,
    });
  }

  return response;
}
