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

function confidenceFor({ deterministicConfidence, documentDiagnostics, requirements }) {
  let points = deterministicConfidence === 'alta' ? 2 : deterministicConfidence === 'média' ? 1 : 0;
  if ((documentDiagnostics?.extraction_confidence ?? 0) >= 75) points += 1;
  const supported = requirements.filter((item) => item.status === 'comprovado').length;
  if (requirements.length >= 3 && supported / requirements.length >= 0.5) points += 1;
  if (points >= 4) return 'alta';
  if (points >= 2) return 'média';
  return 'baixa';
}

export function buildAtsAnalysis(analysis, documentDiagnostics) {
  const requirements = (analysis.analise_aderencia?.requisitos || []).map((item) => ({ ...item }));
  const mandatory = requirements.filter((item) => item.category === 'obrigatório');
  const desirable = requirements.filter((item) => item.category === 'desejável');
  const mandatoryScore = scoreRequirements(mandatory) ?? scoreRequirements(requirements) ?? 0;
  const desirableScore = scoreRequirements(desirable) ?? mandatoryScore;
  const requirementsScore = Math.round((mandatoryScore * 0.85) + (desirableScore * 0.15));
  const evidenceScore = Math.round(average(requirements, (item) => {
    if (item.status === 'comprovado') return Math.max(80, item.score || 0);
    if (item.status === 'parcial') return Math.max(45, item.score || 0);
    return 0;
  }) ?? 0);
  const seniorityRaw = analysis.match_score?.detalhamento?.adequacao_senioridade;
  const seniorityScore = seniorityRaw == null ? 65 : seniorityRaw;
  const detectedSkills = analysis.meta?.vaga_skills_detectadas?.length || 0;
  const commonSkills = analysis.meta?.skills_em_comum?.length || 0;
  const keywordScore = detectedSkills > 0 ? Math.round((commonSkills / detectedSkills) * 100) : mandatoryScore;
  const readabilityScore = documentDiagnostics?.score ?? 0;

  const factors = [
    { key: 'document_readability', label: 'Clareza e estrutura do documento', score: readabilityScore, weight: 20 },
    { key: 'requirements', label: 'Requisitos obrigatórios e desejáveis', score: requirementsScore, weight: 45 },
    { key: 'evidence_quality', label: 'Qualidade das evidências', score: evidenceScore, weight: 20 },
    { key: 'seniority', label: 'Adequação de senioridade', score: seniorityScore, weight: 10 },
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
    analysis_version: '3.0',
    analise_aderencia: { ...analysis.analise_aderencia, requisitos: finalRequirements, resumo: summary },
    ats_analysis: {
      label: 'Leitura de compatibilidade',
      overall_score: overallScore,
      job_match_score: jobMatchScore,
      document_readability: documentDiagnostics,
      factors,
      confidence: confidenceFor({
        deterministicConfidence: analysis.meta?.confianca_analise,
        documentDiagnostics,
        requirements: finalRequirements,
      }),
      disclaimer: 'Esta leitura organiza sinais que ajudam a entender a aderência do currículo. Ela não reproduz nem prevê a decisão de um sistema de recrutamento.',
    },
  };
}
