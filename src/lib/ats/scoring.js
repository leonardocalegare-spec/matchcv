const STATUS_VALUE = { comprovado: 1, parcial: 0.6, ausente: 0 };

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function average(items, selector) {
  if (items.length === 0) return null;
  return items.reduce((total, item) => total + selector(item), 0) / items.length;
}

function scoreRequirements(items) {
  const result = average(items, (item) => STATUS_VALUE[item.status] ?? 0);
  return result == null ? null : Math.round(result * 100);
}

function mergeSemanticEvidence(requirements, matches) {
  const matchesByKey = new Map(matches.map((item) => [item.key, item]));
  return requirements.map((requirement, index) => {
    const key = `${requirement.category || 'geral'}:${requirement.skill || index}`;
    const semantic = matchesByKey.get(key);
    if (!semantic) return { ...requirement, semantic_similarity: null, semantic_evidence: null };
    const strongSemanticMatch = semantic.similarity >= 0.72;
    const canAddPartialEvidence = requirement.status === 'ausente' && strongSemanticMatch;
    return {
      ...requirement,
      status_original: requirement.status,
      status: canAddPartialEvidence ? 'parcial' : requirement.status,
      evidence: canAddPartialEvidence ? semantic.evidence : requirement.evidence,
      semantic_similarity: Math.round(semantic.similarity * 100),
      semantic_evidence: semantic.evidence,
      semantic_contribution: canAddPartialEvidence,
      recommendation: canAddPartialEvidence
        ? 'A IA encontrou uma evidência semanticamente relacionada. Revise o trecho e torne a relação explícita sem adicionar fatos novos.'
        : requirement.recommendation,
    };
  });
}

function confidenceFor({ deterministicConfidence, semanticStatus, documentDiagnostics }) {
  let points = deterministicConfidence === 'alta' ? 2 : deterministicConfidence === 'média' ? 1 : 0;
  if (semanticStatus === 'completed') points += 1;
  if ((documentDiagnostics?.extraction_confidence ?? 0) >= 75) points += 1;
  if (points >= 4) return 'alta';
  if (points >= 2) return 'média';
  return 'baixa';
}

export function buildAtsAnalysis(analysis, documentDiagnostics, semanticResult) {
  const requirements = mergeSemanticEvidence(
    analysis.analise_aderencia?.requisitos || [],
    semanticResult?.matches || [],
  );
  const mandatory = requirements.filter((item) => item.category === 'obrigatório');
  const desirable = requirements.filter((item) => item.category === 'desejável');
  const mandatoryScore = scoreRequirements(mandatory) ?? scoreRequirements(requirements) ?? 0;
  const desirableScore = scoreRequirements(desirable) ?? mandatoryScore;
  const requirementsScore = Math.round((mandatoryScore * 0.85) + (desirableScore * 0.15));
  const evidenceScore = Math.round(average(requirements, (item) => {
    if (item.status === 'comprovado') return Math.max(80, item.score || 0);
    if (item.status === 'parcial') return item.semantic_contribution ? 55 : Math.max(45, item.score || 0);
    return 0;
  }) ?? 0);
  const seniorityRaw = analysis.match_score?.detalhamento?.adequacao_senioridade;
  const seniorityScore = seniorityRaw == null ? 65 : seniorityRaw;
  const detectedSkills = analysis.meta?.vaga_skills_detectadas?.length || 0;
  const commonSkills = analysis.meta?.skills_em_comum?.length || 0;
  const keywordScore = detectedSkills > 0 ? Math.round((commonSkills / detectedSkills) * 100) : mandatoryScore;
  const readabilityScore = documentDiagnostics?.score ?? 0;

  const factors = [
    { key: 'document_readability', label: 'Leitura técnica do documento', score: readabilityScore, weight: 20 },
    { key: 'requirements', label: 'Requisitos obrigatórios e desejáveis', score: requirementsScore, weight: 35 },
    { key: 'semantic_match', label: 'Correspondência semântica', score: semanticResult?.status === 'completed' ? Math.round(average(semanticResult.matches, (item) => item.similarity * 100) ?? 0) : mandatoryScore, weight: 20 },
    { key: 'evidence_quality', label: 'Qualidade das evidências', score: evidenceScore, weight: 15 },
    { key: 'seniority', label: 'Adequação de senioridade', score: seniorityScore, weight: 5 },
    { key: 'keyword_findability', label: 'Palavras-chave encontráveis', score: keywordScore, weight: 5 },
  ];
  const overallScore = clamp(Math.round(factors.reduce((total, factor) => total + (factor.score * factor.weight / 100), 0)));
  const jobFactors = factors.filter((factor) => factor.key !== 'document_readability');
  const jobWeight = jobFactors.reduce((total, factor) => total + factor.weight, 0);
  const jobMatchScore = clamp(Math.round(jobFactors.reduce((total, factor) => total + factor.score * factor.weight, 0) / jobWeight));

  const finalRequirements = requirements.map((item) => ({ ...item }));
  const summary = {
    comprovados: finalRequirements.filter((item) => item.status === 'comprovado').length,
    parciais: finalRequirements.filter((item) => item.status === 'parcial').length,
    ausentes: finalRequirements.filter((item) => item.status === 'ausente').length,
  };

  return {
    ...analysis,
    analysis_version: '2.0',
    analise_aderencia: { ...analysis.analise_aderencia, requisitos: finalRequirements, resumo: summary },
    ats_analysis: {
      label: 'Compatibilidade ATS estimada',
      overall_score: overallScore,
      job_match_score: jobMatchScore,
      document_readability: documentDiagnostics,
      factors,
      confidence: confidenceFor({
        deterministicConfidence: analysis.meta?.confianca_analise,
        semanticStatus: semanticResult?.status,
        documentDiagnostics,
      }),
      disclaimer: 'Esta é uma estimativa explicada. Sistemas ATS usam regras diferentes e não existe uma pontuação universal.',
    },
    semantic_analysis: {
      status: semanticResult?.status || 'unavailable',
      model: semanticResult?.model || null,
      processed_locally: true,
      matches: semanticResult?.matches || [],
      notice: semanticResult?.status === 'completed'
        ? 'A correspondência semântica foi executada localmente no navegador.'
        : 'A camada semântica não ficou disponível; o resultado determinístico foi preservado.',
    },
  };
}
