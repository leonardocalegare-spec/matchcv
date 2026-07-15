const TECH_SKILLS = [
  'javascript',
  'typescript',
  'react',
  'node',
  'node.js',
  'python',
  'java',
  'sql',
  'postgresql',
  'mysql',
  'html',
  'css',
  'git',
  'github',
  'api',
  'rest',
  'docker',
  'aws',
  'azure',
  'figma',
  'excel',
  'power bi',
  'scrum',
  'kanban',
  'automacao',
  'automação',
  'logica',
  'lógica',
  'programacao',
  'programação',
  'inteligencia artificial',
  'inteligência artificial',
  'ia',
];

const SOFT_SKILLS = [
  'comunicacao',
  'comunicação',
  'trabalho em equipe',
  'colaboracao',
  'colaboração',
  'organizacao',
  'organização',
  'proatividade',
  'aprendizado',
  'resolucao de problemas',
  'resolução de problemas',
  'analitico',
  'analítico',
];

const LANGUAGE_SKILLS = [
  'ingles',
  'inglês',
  'espanhol',
  'portugues',
  'português',
];

const REQUIREMENT_MARKERS = [
  'requisito',
  'necessario',
  'necessário',
  'obrigatorio',
  'obrigatório',
  'conhecimento',
  'experiencia',
  'experiência',
  'vivencia',
  'vivência',
  'dominio',
  'domínio',
  'formacao',
  'formação',
  'cursando',
  'superior',
];

const DESIRABLE_MARKERS = [
  'desejavel',
  'desejável',
  'diferencial',
  'plus',
  'nice to have',
  'sera um diferencial',
  'será um diferencial',
];

const SENIORITY_WEIGHT = {
  estágio: 100,
  junior: 85,
  pleno: 45,
  senior: 20,
};

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
  const labels = {
    javascript: 'JavaScript',
    typescript: 'TypeScript',
    react: 'React',
    node: 'Node.js',
    'node.js': 'Node.js',
    python: 'Python',
    java: 'Java',
    sql: 'SQL',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
    html: 'HTML',
    css: 'CSS',
    git: 'Git',
    github: 'GitHub',
    api: 'APIs',
    rest: 'REST',
    docker: 'Docker',
    aws: 'AWS',
    azure: 'Azure',
    figma: 'Figma',
    excel: 'Excel',
    'power bi': 'Power BI',
    scrum: 'Scrum',
    kanban: 'Kanban',
    automacao: 'Automação',
    logica: 'Lógica de programação',
    programacao: 'Programação',
    'inteligencia artificial': 'Inteligência Artificial',
    ia: 'IA',
    ingles: 'Inglês',
    espanhol: 'Espanhol',
    portugues: 'Português',
  };

  return labels[normalized] || skill;
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
  return unique([...TECH_SKILLS, ...SOFT_SKILLS, ...LANGUAGE_SKILLS]
    .filter((skill) => includesTerm(text, skill))
    .map(titleCaseSkill));
}

function detectLevel(vagaText) {
  const normalized = normalize(vagaText);

  if (/\bestagio\b|\bestagiario\b|\bintern\b/.test(normalized)) return 'estágio';
  if (/\bjunior\b|\bjr\b|\btrainee\b/.test(normalized)) return 'junior';
  if (/\bpleno\b|\bmid\b/.test(normalized)) return 'pleno';
  if (/\bsenior\b|\bsr\b|\blider\b|\blead\b|\bespecialista\b/.test(normalized)) return 'senior';

  return 'junior';
}

function detectTitle(vaga) {
  const lines = splitLines(vaga);
  const titleLine = lines.find((line) => {
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

  return titleLine || lines.find((line) => line.length < 90) || 'Vaga analisada';
}

function detectCompany(vaga) {
  const companyMatch = vaga.match(/(?:empresa|companhia|organiza[cç][aã]o)\s*[:-]\s*([^\n]+)/i);
  return companyMatch?.[1]?.trim() || 'Empresa nao identificada';
}

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

function inferRequirementsFromSkills(skills) {
  return skills.map((skill) => `Conhecimento em ${skill}`);
}

function findEvidence(curriculo, skills) {
  const sentences = splitSentences(curriculo);

  return skills.map((skill) => {
    const evidence = sentences.find((sentence) => includesTerm(sentence, skill));
    return {
      skill,
      evidence: evidence || null,
    };
  });
}

function hasMetric(sentence) {
  return /\d+|%|por cento|usuarios|usuários|clientes|projetos|horas|dias|semanas|meses/i.test(sentence);
}

function hasActionVerb(sentence) {
  const normalized = normalize(sentence);
  return [
    'desenvolvi',
    'criei',
    'implementei',
    'automatizei',
    'construi',
    'liderei',
    'participei',
    'analisei',
    'otimizei',
    'integrei',
    'documentei',
  ].some((verb) => normalized.includes(verb));
}

function buildRequirementMatrix(vagaSkills, matchedEvidence, desirableSentences) {
  const desirableText = desirableSentences.join(' ');

  return vagaSkills.map((skill) => {
    const evidence = matchedEvidence.find((item) => item.skill === skill)?.evidence || null;
    const category = includesTerm(desirableText, skill) ? 'desejável' : 'obrigatório';
    const hasStrongEvidence = evidence && hasActionVerb(evidence) && hasMetric(evidence);
    const status = !evidence ? 'ausente' : hasStrongEvidence ? 'comprovado' : 'parcial';

    const recommendation = status === 'ausente'
      ? `Se houver experiência real, inclua um projeto, curso ou entrega que comprove ${skill}.`
      : status === 'parcial'
        ? `Reescreva a evidência de ${skill} com ação, contexto e impacto mensurável.`
        : `Destaque ${skill} no resumo e em um dos primeiros bullets do currículo.`;

    return { skill, category, status, evidence, recommendation };
  });
}

function averageCoverage(requirements) {
  if (requirements.length === 0) return 0;

  const valueByStatus = { comprovado: 1, parcial: 0.6, ausente: 0 };
  return requirements.reduce((total, item) => total + valueByStatus[item.status], 0) / requirements.length;
}

function buildScoreBreakdown({ requirements, level }) {
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
  const seniorityScore = SENIORITY_WEIGHT[level] ?? 70;
  const rawScore = (skillCoverage * 65) + (evidenceCoverage * 20) + (seniorityScore * 0.15);

  return {
    percentual: clamp(Math.round(rawScore), 0, 100),
    cobertura_skills: Math.round(skillCoverage * 100),
    cobertura_evidencias: Math.round(evidenceCoverage * 100),
    adequacao_senioridade: seniorityScore,
    cobertura_obrigatorios: Math.round(mandatoryCoverage * 100),
    cobertura_desejaveis: Math.round(desirableCoverage * 100),
  };
}

function buildConfidence(vagaSkills, requiredSentences) {
  if (vagaSkills.length >= 4 && requiredSentences.length >= 2) return 'alta';
  if (vagaSkills.length >= 2 || requiredSentences.length >= 1) return 'média';
  return 'baixa';
}

function recommendationForScore(score) {
  if (score >= 80) return 'CANDIDATAR';
  if (score >= 50) return 'CONSIDERAR';
  return 'PULAR';
}

function buildSummary(matchedSkills, missingSkills, level) {
  if (matchedSkills.length === 0) {
    return `Perfil com aderencia baixa para uma vaga de nivel ${level}. Antes de candidatar, deixe mais explicitas as tecnologias, projetos e resultados relacionados aos requisitos da vaga.`;
  }

  const strengths = matchedSkills.slice(0, 5).join(', ');
  const gapText = missingSkills.length > 0
    ? ` Ainda precisa reforcar ${missingSkills.slice(0, 3).join(', ')}.`
    : ' Os principais requisitos tecnicos detectados aparecem no curriculo.';

  return `Perfil com evidencias em ${strengths}, com aderencia relevante para uma vaga de nivel ${level}.${gapText}`;
}

function buildRelevantExperiences(curriculo, matchedEvidence, missingSkills) {
  const evidenceBullets = matchedEvidence
    .filter((item) => item.evidence)
    .slice(0, 5)
    .map((item) => `Evidência para ${item.skill}: ${item.evidence}`);

  if (evidenceBullets.length >= 3) {
    return evidenceBullets;
  }

  const genericBullets = [
    'Adicionar bullets com problema, acao, tecnologia usada e resultado mensuravel.',
    'Priorizar projetos que comprovem aderencia direta aos requisitos tecnicos da vaga.',
  ];

  if (missingSkills.length > 0) {
    genericBullets.push(`Criar ou destacar evidencia real relacionada a ${missingSkills.slice(0, 3).join(', ')}.`);
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

      return `${actionHint}, reescreva este ponto para destacar ${item.skill}, contexto do projeto e decisão técnica, ${metricHint}: "${item.evidence}"`;
    });

  const gapBullet = missingSkills.length > 0
    ? [`Se houver experiência real, adicione um bullet específico conectando ${missingSkills.slice(0, 2).join(' e ')} a projeto, curso ou entrega prática.`]
    : [];

  const seniorityBullet = level === 'estágio' || level === 'junior'
    ? ['Inclua um bullet de aprendizado aplicado: tecnologia estudada, projeto construído e problema resolvido.']
    : ['Inclua um bullet de autonomia: problema complexo, decisão tomada, tradeoff e resultado obtido.'];

  return unique([...bulletsFromEvidence, ...gapBullet, ...seniorityBullet]).slice(0, 5);
}

function buildWritingSuggestions(matchedEvidence) {
  return matchedEvidence
    .filter((item) => item.evidence)
    .slice(0, 4)
    .map((item) => ({
      skill: item.skill,
      original: item.evidence,
      impacto: `Entreguei [solução real] com ${item.skill} para [objetivo do projeto], gerando [resultado mensurável real].`,
      tecnico: `Utilizei ${item.skill} para [entrega real], aplicando [decisão técnica real] e garantindo [resultado observável].`,
      direto: `Atuei com ${item.skill} em [projeto ou experiência real], contribuindo para [resultado real].`,
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
    .map((item) => `A skill ${item.skill} foi detectada, mas sem frase forte de evidência. Reforce com contexto real.`);

  return unique([...alerts, ...weakEvidence]).slice(0, 5);
}

function buildInterviewQuestions(matchedSkills, missingSkills, level) {
  const questions = [
    {
      pergunta: 'Qual projeto do seu curriculo melhor comprova aderencia a esta vaga?',
      dica_resposta: matchedSkills.length > 0
        ? `Escolha um projeto com ${matchedSkills.slice(0, 3).join(', ')} e explique contexto, decisao tecnica e resultado.`
        : 'Escolha um projeto real e conecte explicitamente suas atividades aos requisitos da vaga.',
    },
    {
      pergunta: 'Como voce aprende e aplica tecnologias novas quando encontra um requisito que ainda nao domina?',
      dica_resposta: missingSkills.length > 0
        ? `Use ${missingSkills[0]} como exemplo: seja honesto sobre o gap e mostre um plano pratico de estudo/aplicacao.`
        : 'Mostre um exemplo real de aprendizado rapido e aplicacao em projeto.',
    },
    {
      pergunta: `Por que voce faz sentido para uma posicao de nivel ${level}?`,
      dica_resposta: 'Conecte senioridade, autonomia, base tecnica e exemplos reais sem exagerar experiencia.',
    },
  ];

  return questions.slice(0, 4);
}

function buildGaps(missingSkills, requiredSentences, level) {
  const skillGaps = missingSkills.map((skill) => (
    `A vaga menciona ${skill}, mas isso nao aparece claramente no curriculo. Inclua apenas se houver evidencia real.`
  ));

  const seniorityGap = ['pleno', 'senior'].includes(level)
    ? [`A vaga parece ser de nivel ${level}; valide se sua experiencia comprovada sustenta esse nivel antes de investir tempo.`]
    : [];

  const evidenceGap = requiredSentences.length === 0
    ? ['A descricao da vaga tem poucos requisitos estruturados; revise manualmente para nao depender apenas da extracao automatica.']
    : [];

  return unique([...skillGaps, ...seniorityGap, ...evidenceGap]).slice(0, 6);
}

function buildJustification(score, matchedSkills, missingSkills, level) {
  const recommendation = recommendationForScore(score);
  const matched = matchedSkills.length > 0 ? matchedSkills.join(', ') : 'nenhuma skill tecnica detectada em comum';
  const missing = missingSkills.length > 0 ? missingSkills.join(', ') : 'sem gaps tecnicos explicitos detectados';

  return `${recommendation}: score local baseado em cobertura de skills, evidencias textuais e senioridade (${level}). Pontos fortes: ${matched}. Pontos a reforcar: ${missing}.`;
}

export function analisarCurriculoComAgente(curriculo, vaga) {
  const level = detectLevel(vaga);
  const curriculoSkills = extractSkills(curriculo);
  const vagaSkills = extractSkills(vaga);
  const matchedSkills = vagaSkills.filter((skill) => curriculoSkills.includes(skill));
  const missingSkills = vagaSkills.filter((skill) => !curriculoSkills.includes(skill));
  const requiredSentences = extractRequirementSentences(vaga, false);
  const desirableSentences = extractRequirementSentences(vaga, true);
  const matchedEvidence = findEvidence(curriculo, matchedSkills);
  const requirements = buildRequirementMatrix(vagaSkills, matchedEvidence, desirableSentences);
  const scoreDetails = buildScoreBreakdown({ requirements, level });
  const score = scoreDetails.percentual;

  return {
    vaga_analise: {
      titulo: detectTitle(vaga),
      empresa: detectCompany(vaga),
      requisitos_obrigatorios: requiredSentences.length > 0
        ? requiredSentences
        : inferRequirementsFromSkills(vagaSkills),
      requisitos_desejaveis: desirableSentences,
      nivel_experiencia: level,
    },
    match_score: {
      percentual: score,
      recomendacao: recommendationForScore(score),
      justificativa: buildJustification(score, matchedSkills, missingSkills, level),
      detalhamento: scoreDetails,
    },
    curriculo_otimizado: {
      resumo_executivo: buildSummary(matchedSkills, missingSkills, level),
      experiencias_relevantes: buildRelevantExperiences(curriculo, matchedEvidence, missingSkills),
      bullets_sugeridos: buildSuggestedBullets(matchedEvidence, missingSkills, level),
      reescritas_sugeridas: buildWritingSuggestions(matchedEvidence),
      acoes_prioritarias: buildPriorityActions(requirements),
      alertas_honestidade: buildHonestyAlerts(missingSkills, matchedEvidence),
      skills_destacar: matchedSkills,
    },
    prep_entrevista: {
      perguntas_esperadas: buildInterviewQuestions(matchedSkills, missingSkills, level),
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
    provider_notice: 'Analise 100% local gerada pelo agente MatchCV. Nenhuma chave, API externa ou chamada de rede foi usada.',
    meta: {
      curriculo_skills_detectadas: curriculoSkills,
      vaga_skills_detectadas: vagaSkills,
      skills_em_comum: matchedSkills,
      skills_ausentes: missingSkills,
      evidencias_encontradas: matchedEvidence.filter((item) => item.evidence).length,
      confianca_analise: buildConfidence(vagaSkills, requiredSentences),
    },
  };
}
