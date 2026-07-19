import { detectCompany } from './shared/companyDetection.js';
import { detectRoleProfile } from './data/roleProfiles.js';
import {
  ACTION_VERBS,
  ALL_SKILLS,
  ALL_SYNONYMS,
  DESIRABLE_MARKERS,
  REQUIREMENT_MARKERS,
  RESPONSIBILITY_MARKERS,
  SENIORITY_ORDER,
} from './analysis/lexicon.js';

function normalize(value) {
  return String(value)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function splitLines(text) {
  return String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

function splitSentences(text) {
  return String(text)
    .split(/\r?\n|[.;]/)
    .map((item) => item.replace(/^[-*•\s]+/, '').trim())
    .filter((item) => item.length > 8);
}

function titleCaseSkill(skill) {
  const normalized = normalize(skill);
  const matchedSkill = ALL_SKILLS.find((skill) => skill.synonyms.includes(normalized));
  return matchedSkill ? matchedSkill.label : skill;
}

function includesTerm(text, term) {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`).test(normalizedText);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSkills(text) {
  return unique(ALL_SYNONYMS
    .filter((synonym) => includesTerm(text, synonym))
    .map(titleCaseSkill));
}

function detectLevel(vagaText) {
  const normalized = normalize(vagaText);

  if (/\bestagio\b|\bestagiario\b|\bintern\b|primeira experiencia|sem experiencia/.test(normalized)) return 'estágio';
  if (/\bsenior\b|\bsr\b|\blider\b|\blead\b|\bespecialista\b|liderou equipe|arquitetura|mentor|(?:4|5|6|7|8|9|10)\+?\s*anos/.test(normalized)) return 'senior';
  if (/\bpleno\b|\bmid\b|(?:2|3)\+?\s*anos/.test(normalized)) return 'pleno';
  if (/\bjunior\b|\bjr\b|\btrainee\b/.test(normalized)) return 'junior';

  return 'não identificado';
}

function detectResumeLevel(curriculoText) {
  const normalized = normalize(curriculoText);
  const years = [...normalized.matchAll(/(\d{1,2})\+?\s*anos?\s+(?:de\s+)?experiencia/g)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  const maxYears = years.length > 0 ? Math.max(...years) : null;

  if (/\bsenior\b|\bsr\b|\btech lead\b|\blider(?:ei|anca|ança)?\b|\bespecialista\b/.test(normalized) || maxYears >= 5) return 'senior';
  if (/\bpleno\b|\bmid(?:-level)?\b/.test(normalized) || maxYears >= 2) return 'pleno';
  if (/\bjunior\b|\bjr\b|\btrainee\b/.test(normalized)) return 'junior';
  if (/\bestagio\b|\bestagiario\b|\bintern\b/.test(normalized)) return 'estágio';
  return null;
}

function calculateSeniorityAlignment(jobLevel, resumeLevel) {
  if (!resumeLevel || !(jobLevel in SENIORITY_ORDER)) return null;
  const difference = SENIORITY_ORDER[resumeLevel] - SENIORITY_ORDER[jobLevel];
  if (difference >= 0) return 100;
  if (difference === -1) return 60;
  return 20;
}

function detectTitle(vaga) {
  const candidates = unique([...splitLines(vaga), ...splitSentences(vaga)]);
  const titleLine = candidates.find((line) => {
    const normalized = normalize(line);
    return line.length >= 6 && line.length <= 90 && (
      normalized.includes('vaga') ||
      normalized.includes('estagio') ||
      normalized.includes('desenvolvedor') ||
      normalized.includes('analista') ||
      normalized.includes('assistente') ||
      normalized.includes('suporte') ||
      normalized.includes('ti')
    );
  });

  const fallback = candidates.find((line) => line.length < 90);
  const detected = titleLine || fallback;
  if (!detected) return 'Vaga analisada';

  return detected
    .replace(/^vaga\s*(?:(?:para|de)\b)?\s*[:-]?\s*/i, '')
    .replace(/\s+(?:na|no)\s+[A-ZÀ-Ú][\wÀ-ú&.-]*(?:\s+[A-ZÀ-Ú][\wÀ-ú&.-]*){0,2}.*$/, '')
    .trim() || 'Vaga analisada';
}

// detectCompany was moved to companyDetection.js

function sentenceHasAnyMarker(sentence, markers) {
  const normalized = normalize(sentence);
  return markers.some((marker) => normalized.includes(normalize(marker)));
}

function extractRequirementSentences(vaga, desirable = false) {
  const sentences = splitSentences(vaga);
  const markers = desirable ? DESIRABLE_MARKERS : REQUIREMENT_MARKERS;
  const ignoredMarkers = desirable ? [] : DESIRABLE_MARKERS;

  return unique(sentences.filter((sentence) => (
    sentenceHasAnyMarker(sentence, markers) &&
    !sentenceHasAnyMarker(sentence, ignoredMarkers)
  ))).slice(0, 8);
}

function extractResponsibilities(vaga) {
  return unique(splitSentences(vaga).filter((sentence) => (
    sentenceHasAnyMarker(sentence, RESPONSIBILITY_MARKERS) ||
    /^(planejar|desenvolver|analisar|gerenciar|coordenar|atender|acompanhar|executar|criar|implementar|realizar|apoiar|garantir|conduzir|controlar)\b/i.test(sentence)
  ))).slice(0, 6);
}

function inferRequirementsFromSkills(skills) {
  return skills.map((skill) => `Conhecimento em ${skill}`);
}

function findEvidence(curriculo, skills) {
  const sentences = splitSentences(curriculo);

  return skills.map((skill) => {
    // Find matching synonyms for this skill label
    const skillData = ALL_SKILLS.find((item) => item.label === skill);
    const searchTerms = skillData ? skillData.synonyms : [skill];

    const evidenceIndex = sentences.findIndex((sentence) =>
      searchTerms.some((term) => includesTerm(sentence, term))
    );
    let evidence = evidenceIndex >= 0 ? sentences[evidenceIndex] : null;
    const nextSentence = evidenceIndex >= 0 ? sentences[evidenceIndex + 1] : null;
    if (evidence && !hasMetric(evidence) && nextSentence && hasMetric(nextSentence)) {
      evidence = `${evidence}. ${nextSentence}`;
    }

    let score = 0;
    if (evidence) {
      score += 50;
      if (hasActionVerb(evidence)) score += 25;
      if (hasMetric(evidence)) score += 25;
    }

    return {
      skill,
      evidence: evidence || null,
      score
    };
  });
}

function hasMetric(sentence) {
  return /(?:\b\d+(?:[.,]\d+)?\s*(?:%|por cento|mil|milhão|milhões|hora|horas|dia|dias|semana|semanas|mês|meses|ano|anos|usuário|usuários|cliente|clientes|projeto|projetos)?\b)|(?:R\$\s*\d+)/i.test(sentence);
}

function hasActionVerb(sentence) {
  const normalized = normalize(sentence);
  return ACTION_VERBS.some((verb) => normalized.includes(verb));
}

function evidenceLevel(evidence) {
  if (!evidence) return 'ausente';
  const action = hasActionVerb(evidence);
  const measurable = hasMetric(evidence);
  if (action && measurable) return 'mensurável';
  if (action) return 'aplicação';
  return 'menção';
}

function isCriticalRequirement(skill, vaga) {
  const title = detectTitle(vaga);
  const lines = splitLines(vaga).slice(0, 5);
  const firstLines = lines.join(' ');

  if (includesTerm(title, skill) || includesTerm(firstLines, skill)) {
    return true;
  }

  const skillData = ALL_SKILLS.find((item) => item.label === skill);
  const searchTerms = skillData ? skillData.synonyms : [skill];
  const normalizedVaga = normalize(vaga);
  let count = 0;

  for (const term of searchTerms) {
    const regex = new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalize(term))}([^a-z0-9]|$)`, 'g');
    const matches = normalizedVaga.match(regex);
    if (matches) {
      count += matches.length;
    }
  }

  return count >= 3;
}

function buildRequirementMatrix(vagaSkills, matchedEvidence, desirableSentences, vaga) {
  const desirableText = desirableSentences.join(' ');

  return vagaSkills.map((skill, index) => {
    const evidenceObj = matchedEvidence.find((item) => item.skill === skill);
    const evidence = evidenceObj?.evidence || null;
    const category = includesTerm(desirableText, skill) ? 'desejável' : 'obrigatório';
    const isCritical = category === 'obrigatório' && isCriticalRequirement(skill, vaga);

    const level = evidenceLevel(evidence);
    const status = level === 'aplicação' || level === 'mensurável' ? 'comprovado' : level === 'menção' ? 'parcial' : 'ausente';
    const score = evidenceObj?.score || 0;

    const recommendation = status === 'ausente'
      ? `Se houver experiência real, inclua um projeto, curso ou entrega que comprove ${skill}.`
      : status === 'parcial'
        ? `Explique onde você usou ${skill}, o que fez e qual mudança isso gerou. Inclua números somente se puder confirmá-los.`
        : level === 'mensurável'
          ? `Mantenha esta evidência em destaque: ela mostra ação e resultado de forma clara.`
          : `Mantenha esta experiência visível e, se houver um resultado concreto, acrescente-o sem exagerar.`;

    return {
      id: `skill-${index + 1}`,
      skill,
      source_text: skill,
      category,
      status,
      evidence,
      evidence_level: level,
      recommendation,
      isCritical,
      score,
    };
  });
}

function buildTextRequirementMatrix(requiredSentences, desirableSentences, curriculo, vagaSkills) {
  const stopwords = new Set([
    'para', 'com', 'que', 'uma', 'por', 'dos', 'das', 'nos', 'nas', 'requisito', 'requisitos',
    'necessario', 'necessaria', 'obrigatorio', 'obrigatoria', 'desejavel', 'diferencial',
    'conhecimento', 'experiencia', 'vivencia', 'ter', 'ser', 'em', 'de', 'do', 'da', 'e', 'ou',
  ]);
  const normalizedResume = normalize(curriculo);

  return [...requiredSentences.map((text) => ({ text, category: 'obrigatório' })),
    ...desirableSentences.map((text) => ({ text, category: 'desejável' }))]
    .filter(({ text }) => !vagaSkills.some((skill) => includesTerm(text, skill)))
    .slice(0, 6)
    .map(({ text, category }, index) => {
      const keywords = unique(normalize(text).match(/[a-z0-9+#.]{3,}/g) || [])
        .filter((word) => !stopwords.has(word))
        .slice(0, 8);
      const matchedKeywords = keywords.filter((word) => includesTerm(normalizedResume, word));
      const evidence = splitSentences(curriculo).find((sentence) => (
        matchedKeywords.filter((word) => includesTerm(sentence, word)).length >= Math.min(2, keywords.length)
      )) || null;
      const coverage = keywords.length > 0 ? matchedKeywords.length / keywords.length : 0;
      const status = evidence && coverage >= 0.6 ? 'comprovado' : coverage > 0 ? 'parcial' : 'ausente';
      const recommendation = status === 'ausente'
        ? 'Inclua este requisito somente se houver formação, experiência ou disponibilidade real que o comprove.'
        : status === 'parcial'
          ? 'Torne esta evidência explícita no currículo, preservando apenas fatos verificáveis.'
          : 'Mantenha esta evidência em posição visível no currículo.';

      return {
        id: `text-${index + 1}`,
        skill: text.length > 110 ? `${text.slice(0, 107)}...` : text,
        source_text: text,
        category,
        status,
        evidence,
        evidence_level: evidence ? (hasActionVerb(evidence) ? 'aplicação' : 'menção') : 'ausente',
        recommendation,
        isCritical: category === 'obrigatório',
        score: Math.round(coverage * 100),
        kind: 'requisito_textual',
      };
    });
}

function averageCoverage(requirements) {
  if (requirements.length === 0) return 0;

  const valueByStatus = { comprovado: 1, parcial: 0.6, ausente: 0 };
  let totalWeight = 0;
  let weightedScore = 0;

  for (const item of requirements) {
    const weight = item.isCritical ? 2 : 1;
    totalWeight += weight;
    weightedScore += valueByStatus[item.status] * weight;
  }

  return totalWeight > 0 ? weightedScore / totalWeight : 0;
}

function buildScoreBreakdown({ requirements, level, resumeLevel }) {
  const mandatoryRequirements = requirements.filter((item) => item.category === 'obrigatório');
  const desirableRequirements = requirements.filter((item) => item.category === 'desejável');
  const mandatoryCoverage = averageCoverage(mandatoryRequirements);
  const desirableCoverage = averageCoverage(desirableRequirements);
  const skillCoverage = mandatoryRequirements.length > 0
    ? (mandatoryCoverage * 0.8) + (desirableRequirements.length > 0 ? desirableCoverage * 0.2 : 0)
    : desirableCoverage;
  const evidenceCoverage = requirements.length > 0
    ? requirements.filter((item) => item.status === 'comprovado').length / requirements.length
    : 0;
  const seniorityScore = calculateSeniorityAlignment(level, resumeLevel);
  const rawScore = seniorityScore === null
    ? (skillCoverage * 75) + (evidenceCoverage * 25)
    : (skillCoverage * 65) + (evidenceCoverage * 20) + (seniorityScore * 0.15);

  return {
    percentual: clamp(Math.round(rawScore), 0, 100),
    cobertura_skills: Math.round(skillCoverage * 100),
    cobertura_evidencias: Math.round(evidenceCoverage * 100),
    adequacao_senioridade: seniorityScore,
    senioridade_curriculo: resumeLevel,
    cobertura_obrigatorios: Math.round(mandatoryCoverage * 100),
    cobertura_desejaveis: Math.round(desirableCoverage * 100),
  };
}

function buildConfidence(vagaSkills, requiredSentences) {
  if (vagaSkills.length >= 4 && requiredSentences.length >= 2) return 'alta';
  if (vagaSkills.length >= 2 || requiredSentences.length >= 1) return 'média';
  return 'baixa';
}

function buildScoreNarrative(score) {
  if (score < 50) {
    return 'Seu currículo ainda deixa vários pontos importantes da vaga sem resposta. Isso não encerra suas chances: use a análise para decidir o que pode ser explicado melhor e o que ainda precisa ser desenvolvido.';
  }
  if (score < 80) {
    return 'Seu currículo já conversa com uma boa parte da vaga. Antes de se candidatar, vale deixar mais visíveis as experiências que comprovam os requisitos principais.';
  }
  return 'Seu currículo já comprova a maior parte dos requisitos desta vaga. Reforce os pontos abaixo para deixar isso ainda mais evidente no processo seletivo.';
}

function recommendationForScore(score) {
  if (score >= 80) return 'CANDIDATAR';
  if (score >= 50) return 'CONSIDERAR';
  return 'FORTALECER';
}

function buildSummary(matchedSkills, missingSkills, level, roleProfile) {
  if (matchedSkills.length === 0) {
    return `O currículo ainda apresenta poucas evidências claras para uma posição de nível ${level} em ${roleProfile.label}. Reforce ${roleProfile.focus}, sempre usando fatos reais.`;
  }

  const strengths = matchedSkills.slice(0, 5).join(', ');
  const gapText = missingSkills.length > 0
    ? ` Ainda precisa reforçar ${missingSkills.slice(0, 3).join(', ')}.`
    : ' As principais competências detectadas aparecem no currículo.';

  return `Perfil com evidências em ${strengths} para uma oportunidade de nível ${level} em ${roleProfile.label}.${gapText}`;
}

function buildRelevantExperiences(curriculo, matchedEvidence, missingSkills, roleProfile) {
  const evidenceBullets = matchedEvidence
    .filter((item) => item.evidence)
    .slice(0, 5)
    .map((item) => `Evidência para ${item.skill}: ${item.evidence}`);

  if (evidenceBullets.length >= 3) {
    return evidenceBullets;
  }

  const genericBullets = [
    `Conte primeiro as experiências que mais se aproximam do trabalho em ${roleProfile.label}. Em cada uma, explique a situação, o que você fez e o resultado.`,
    'Coloque no início do currículo as experiências que respondem diretamente ao que a vaga pede.',
  ];

  if (missingSkills.length > 0) {
    genericBullets.push(`Se você já teve contato real com ${missingSkills.slice(0, 3).join(', ')}, mostre onde isso aconteceu. Caso contrário, não inclua apenas para combinar com a vaga.`);
  }

  return unique([...evidenceBullets, ...genericBullets]).slice(0, 5);
}

function buildSuggestedBullets(matchedEvidence, missingSkills, level) {
  const bulletsFromEvidence = matchedEvidence
    .filter((item) => item.evidence)
    .slice(0, 4)
    .map((item) => {
      const metricHint = hasMetric(item.evidence)
        ? 'mantendo o resultado mensurável já citado'
        : 'incluindo impacto mensurável se você tiver esse dado';
      const actionHint = hasActionVerb(item.evidence)
        ? 'preservando o verbo de ação'
        : 'começando com um verbo de ação forte';

      return `${actionHint}, deixe mais claro como você usou ${item.skill}, em qual situação e o que mudou depois, ${metricHint}. Trecho de partida: "${item.evidence}"`;
    });

  const gapBullet = missingSkills.length > 0
    ? [`Se for verdade na sua trajetória, mostre onde você aplicou ${missingSkills.slice(0, 2).join(' e ')} — em trabalho, projeto ou curso. Se ainda não aplicou, trate como ponto de desenvolvimento.`]
    : [];

  const seniorityBullet = level === 'estágio' || level === 'junior'
    ? ['Mostre um aprendizado colocado em prática: o que você estudou, o que construiu e qual problema conseguiu resolver.']
    : ['Escolha um exemplo em que você tomou uma decisão importante, explique as alternativas consideradas e o resultado alcançado.'];

  return unique([...bulletsFromEvidence, ...gapBullet, ...seniorityBullet]).slice(0, 5);
}

function buildWritingSuggestions(matchedEvidence, roleProfile) {
  return matchedEvidence
    .filter((item) => item.evidence)
    .slice(0, 4)
    .map((item) => ({
      skill: item.skill,
      original: item.evidence,
      impacto: `Contribuí com ${item.skill} em [contexto real], realizando [ação comprovável] e gerando [resultado real].`,
      tecnico: `Apliquei ${item.skill} em [situação real], seguindo [método ou processo real] para alcançar [resultado observável].`,
      direto: `Atuei com ${item.skill} em [experiência real], com foco em ${roleProfile.focus}.`,
      orientacao: hasMetric(item.evidence)
        ? 'O texto já menciona um resultado. Preserve o dado ao completar o modelo.'
        : 'Inclua uma métrica apenas se ela estiver documentada ou puder ser confirmada por você.',
    }));
}

function buildPriorityActions(requirements) {
  const order = { ausente: 0, parcial: 1, comprovado: 2 };
  const actions = [...requirements]
    .sort((first, second) => {
      const priorityDifference = order[first.status] - order[second.status];
      return priorityDifference || (first.category === 'obrigatório' ? -1 : 1);
    })
    .map((item) => item.recommendation);

  actions.push('Reordene projetos e experiências para posicionar primeiro as evidências mais relevantes para a vaga.');

  return unique(actions).slice(0, 5);
}

function buildHonestyAlerts(missingSkills, matchedEvidence) {
  const alerts = missingSkills.map((skill) => (
    `Não declare domínio em ${skill} se isso não estiver sustentado por projeto, curso, experiência ou entrega concreta.`
  ));

  const weakEvidence = matchedEvidence
    .filter((item) => !item.evidence)
    .map((item) => `${item.skill} aparece como relevante, mas ainda falta um exemplo claro no currículo. Só acrescente essa informação se puder ligá-la a uma experiência real.`);

  return unique([...alerts, ...weakEvidence]).slice(0, 5);
}

function buildInterviewQuestions(matchedSkills, missingSkills, level, roleProfile) {
  const questions = [
    {
      pergunta: 'Qual experiência do seu currículo melhor comprova aderência a esta vaga?',
      dica_resposta: matchedSkills.length > 0
        ? `Escolha uma experiência com ${matchedSkills.slice(0, 3).join(', ')} e explique contexto, ação, método e resultado.`
        : 'Escolha uma experiência real e conecte explicitamente suas atividades aos requisitos da vaga.',
    },
    {
      pergunta: 'Como você aprende e aplica uma competência nova quando encontra um requisito que ainda não domina?',
      dica_resposta: missingSkills.length > 0
        ? `Use ${missingSkills[0]} como exemplo: seja honesto sobre a lacuna e mostre um plano prático de aprendizado e aplicação.`
        : 'Mostre um exemplo real de aprendizado rápido e aplicação no trabalho.',
    },
    {
      pergunta: `Por que você faz sentido para uma posição de nível ${level}?`,
      dica_resposta: 'Conecte senioridade, autonomia, competências relevantes e exemplos reais sem exagerar experiência.',
    },
    {
      pergunta: `Conte uma situação que demonstre ${roleProfile.interviewFocus}.`,
      dica_resposta: 'Estruture a resposta em contexto, responsabilidade, ação e resultado. Se não houver métrica, descreva uma mudança observável.',
    },
  ];

  return questions.slice(0, 4);
}

function buildGaps(missingSkills, requiredSentences, level) {
  const skillGaps = missingSkills.map((skill) => (
    `A vaga menciona ${skill}, mas isso não aparece claramente no currículo. Inclua apenas se houver evidência real.`
  ));

  const seniorityGap = ['pleno', 'senior'].includes(level)
    ? [`A vaga parece ser de nível ${level}; valide se sua experiência comprovada sustenta esse nível antes de investir tempo.`]
    : [];

  const evidenceGap = requiredSentences.length === 0
    ? ['A descrição da vaga tem poucos requisitos estruturados; revise manualmente para não depender apenas da extração automática.']
    : [];

  return unique([...skillGaps, ...seniorityGap, ...evidenceGap]).slice(0, 6);
}

function buildJustification(score, matchedSkills, missingSkills, level) {
  const recommendation = recommendationForScore(score);
  const matched = matchedSkills.length > 0 ? matchedSkills.join(', ') : 'nenhuma competência explícita detectada em comum';
  const missing = missingSkills.length > 0 ? missingSkills.join(', ') : 'sem lacunas explícitas detectadas';

  return `${recommendation}: esta estimativa considera o que a vaga pede, o que seu currículo consegue comprovar e a senioridade identificada (${level}). Hoje, os pontos mais claros são ${matched}. Vale revisar ${missing}.`;
}

export function analisarCurriculoComAgente(curriculo, vaga) {
  const level = detectLevel(vaga);
  const roleProfile = detectRoleProfile(vaga);
  const resumeLevel = detectResumeLevel(curriculo);
  const curriculoSkills = extractSkills(curriculo);
  const vagaSkills = extractSkills(vaga);
  const matchedSkills = vagaSkills.filter((skill) => curriculoSkills.includes(skill));
  const missingSkills = vagaSkills.filter((skill) => !curriculoSkills.includes(skill));
  const requiredSentences = extractRequirementSentences(vaga, false);
  const desirableSentences = extractRequirementSentences(vaga, true);
  const responsibilities = extractResponsibilities(vaga);
  const matchedEvidence = findEvidence(curriculo, matchedSkills);
  const skillRequirements = buildRequirementMatrix(vagaSkills, matchedEvidence, desirableSentences, vaga);
  const textRequirements = buildTextRequirementMatrix(requiredSentences, desirableSentences, curriculo, vagaSkills);
  const requirements = [...skillRequirements, ...textRequirements];
  const scoreDetails = buildScoreBreakdown({ requirements, level, resumeLevel });
  const score = scoreDetails.percentual;

  return {
    vaga_analise: {
      titulo: detectTitle(vaga),
      empresa: detectCompany(vaga),
      requisitos_obrigatorios: requiredSentences.length > 0
        ? requiredSentences
        : inferRequirementsFromSkills(vagaSkills),
      requisitos_desejaveis: desirableSentences,
      responsabilidades: responsibilities,
      nivel_experiencia: level,
      familia_cargo: roleProfile.id,
      familia_cargo_label: roleProfile.label,
      foco_cargo: roleProfile.focus,
    },
    match_score: {
      percentual: score,
      recomendacao: recommendationForScore(score),
      justificativa: buildJustification(score, matchedSkills, missingSkills, level),
      detalhamento: scoreDetails,
      leitura_amigavel: buildScoreNarrative(score),
    },
    curriculo_otimizado: {
      resumo_executivo: buildSummary(matchedSkills, missingSkills, level, roleProfile),
      experiencias_relevantes: buildRelevantExperiences(curriculo, matchedEvidence, missingSkills, roleProfile),
      bullets_sugeridos: buildSuggestedBullets(matchedEvidence, missingSkills, level),
      reescritas_sugeridas: buildWritingSuggestions(matchedEvidence, roleProfile),
      acoes_prioritarias: buildPriorityActions(requirements),
      alertas_honestidade: buildHonestyAlerts(missingSkills, matchedEvidence),
      skills_destacar: matchedSkills,
    },
    prep_entrevista: {
      perguntas_esperadas: buildInterviewQuestions(matchedSkills, missingSkills, level, roleProfile),
      gaps_potenciais: buildGaps(missingSkills, requiredSentences, level),
    },
    analise_aderencia: {
      requisitos: requirements,
      resumo: {
        comprovados: requirements.filter((item) => item.status === 'comprovado').length,
        parciais: requirements.filter((item) => item.status === 'parcial').length,
        ausentes: requirements.filter((item) => item.status === 'ausente').length,
      },
    },
    provider: 'local-agent',
    provider_notice: 'Análise local gerada pelo agente VagaClara.',
    meta: {
      curriculo_skills_detectadas: curriculoSkills,
      vaga_skills_detectadas: vagaSkills,
      skills_em_comum: matchedSkills,
      skills_ausentes: missingSkills,
      evidencias_encontradas: matchedEvidence.filter((item) => item.evidence).length,
      confianca_analise: buildConfidence(vagaSkills, requiredSentences),
      senioridade_curriculo_detectada: resumeLevel,
      familia_cargo: roleProfile.id,
    },
  };
}
