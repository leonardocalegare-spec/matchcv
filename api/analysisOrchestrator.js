import { analisarCurriculoComAgente } from './careerAgent.js';
import { runAnalysis } from './deterministicPipeline.js';

export async function orchestrateAnalysis(curriculo, vaga) {
  const deterministicAnalysis = await analisarCurriculoComAgente(curriculo, vaga);

  let response = {
    ...deterministicAnalysis,
    provider: 'deterministic-agent',
  };

  try {
    const llmAnalysis = await runAnalysis(curriculo, vaga);
    response = {
      ...response,
      llm_analysis: llmAnalysis,
      provider: 'deterministic-pipeline-ollama',
      provider_notice: 'Analise gerada com pipeline deterministico, pesquisa publica opcional e uma unica chamada ao Ollama local.',
    };
  } catch (error) {
    response.provider_notice = 'Ollama local indisponivel. A analise heuristica local foi exibida; instale e inicie o Ollama para receber os insights contextuais.';
  }

  return response;
}