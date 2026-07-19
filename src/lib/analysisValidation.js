const REQUIRED_TOP_LEVEL_KEYS = [
  'vaga_analise',
  'match_score',
  'curriculo_otimizado',
  'prep_entrevista',
  'analise_aderencia',
];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function hasString(value, key) {
  return typeof value?.[key] === 'string' && value[key].trim().length > 0;
}

function hasArray(value, key) {
  return Array.isArray(value?.[key]);
}

export function validateAnalysisPayload(payload) {
  if (!isObject(payload)) {
    return { valid: false, message: 'A resposta da analise veio vazia ou invalida.' };
  }

  const missingTopLevelKey = REQUIRED_TOP_LEVEL_KEYS.find((key) => !isObject(payload[key]));
  if (missingTopLevelKey) {
    return { valid: false, message: `A resposta da analise nao contem "${missingTopLevelKey}".` };
  }

  const { vaga_analise: vagaAnalise, match_score: matchScore } = payload;
  const {
    curriculo_otimizado: curriculoOtimizado,
    prep_entrevista: prepEntrevista,
    analise_aderencia: analiseAderencia,
  } = payload;

  if (
    !hasString(vagaAnalise, 'titulo') ||
    !hasString(vagaAnalise, 'empresa') ||
    !hasArray(vagaAnalise, 'requisitos_obrigatorios') ||
    !hasArray(vagaAnalise, 'requisitos_desejaveis') ||
    !hasArray(vagaAnalise, 'responsabilidades') ||
    !hasString(vagaAnalise, 'familia_cargo_label') ||
    !hasString(vagaAnalise, 'nivel_experiencia')
  ) {
    return { valid: false, message: 'A analise da vaga veio incompleta.' };
  }

  if (
    typeof matchScore.percentual !== 'number' ||
    !hasString(matchScore, 'recomendacao') ||
    !hasString(matchScore, 'justificativa')
  ) {
    return { valid: false, message: 'O score de match veio incompleto.' };
  }

  if (
    !hasString(curriculoOtimizado, 'resumo_executivo') ||
    !hasArray(curriculoOtimizado, 'experiencias_relevantes') ||
    !hasArray(curriculoOtimizado, 'skills_destacar') ||
    !hasArray(curriculoOtimizado, 'bullets_sugeridos') ||
    !hasArray(curriculoOtimizado, 'reescritas_sugeridas') ||
    !hasArray(curriculoOtimizado, 'acoes_prioritarias') ||
    !hasArray(curriculoOtimizado, 'alertas_honestidade')
  ) {
    return { valid: false, message: 'O curriculo otimizado veio incompleto.' };
  }

  if (
    !hasArray(prepEntrevista, 'perguntas_esperadas') ||
    !hasArray(prepEntrevista, 'gaps_potenciais')
  ) {
    return { valid: false, message: 'A preparacao de entrevista veio incompleta.' };
  }

  if (!hasArray(analiseAderencia, 'requisitos') || !isObject(analiseAderencia.resumo)) {
    return { valid: false, message: 'A matriz de aderencia veio incompleta.' };
  }

  if (payload.llm_analysis) {
    const llm = payload.llm_analysis;
    const validTips = Array.isArray(llm.dicas) && llm.dicas.every((tip) => (
      isObject(tip) && hasString(tip, 'dica') && hasString(tip, 'motivo') && ['mercado', 'vaga', 'empresa'].includes(tip.fonte)
    ));
    if (!isObject(llm) || !validTips || !hasString(llm, 'reformulacao_sugerida') || !hasArray(llm, 'faltando_no_curriculo')) {
      return { valid: false, message: 'O complemento do Ollama veio incompleto.' };
    }
  }

  if (payload.ats_analysis) {
    const ats = payload.ats_analysis;
    if (
      typeof ats.overall_score !== 'number' ||
      typeof ats.job_match_score !== 'number' ||
      !Array.isArray(ats.factors) ||
      !isObject(ats.document_readability)
    ) {
      return { valid: false, message: 'A análise ATS veio incompleta.' };
    }
  }

  return { valid: true, message: null };
}
