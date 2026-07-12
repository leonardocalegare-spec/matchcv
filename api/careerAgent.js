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

function scoreAnalysis({ vagaSkills, matchedSkills, missingSkills, level }) {
  const skillCoverage = vagaSkills.length > 0 ? matchedSkills.length / vagaSkills.length : 0.45;
  const gapPenalty = missingSkills.length * 4;
  const seniorityScore = SENIORITY_WEIGHT[level] ?? 70;
  const rawScore = (skillCoverage * 72) + (seniorityScore * 0.2) - gapPenalty + 8;

  return clamp(Math.round(rawScore), 0, 100);
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

function buildPriorityActions(matchedSkills, missingSkills, matchedEvidence) {
  const actions = [];
  const evidenceWithoutMetric = matchedEvidence
    .filter((item) => item.evidence && !hasMetric(item.evidence))
    .map((item) => item.skill);

  if (matchedSkills.length > 0) {
    actions.push(`Suba ${matchedSkills.slice(0, 4).join(', ')} para o resumo e para os primeiros bullets do currículo.`);
  }

  if (evidenceWithoutMetric.length > 0) {
    actions.push(`Adicione resultado mensurável onde possível para ${evidenceWithoutMetric.slice(0, 3).join(', ')}.`);
  }

  if (missingSkills.length > 0) {
    actions.push(`Não liste ${missingSkills.slice(0, 3).join(', ')} como skill se não houver evidência real; trate como plano de aprendizado ou gap.`);
  }

  actions.push('Reordene projetos/experiências para colocar primeiro o que mais conversa com a vaga.');

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
  const score = scoreAnalysis({ vagaSkills, matchedSkills, missingSkills, level });

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
    },
    curriculo_otimizado: {
      resumo_executivo: buildSummary(matchedSkills, missingSkills, level),
      experiencias_relevantes: buildRelevantExperiences(curriculo, matchedEvidence, missingSkills),
      bullets_sugeridos: buildSuggestedBullets(matchedEvidence, missingSkills, level),
      acoes_prioritarias: buildPriorityActions(matchedSkills, missingSkills, matchedEvidence),
      alertas_honestidade: buildHonestyAlerts(missingSkills, matchedEvidence),
      skills_destacar: matchedSkills,
    },
    prep_entrevista: {
      perguntas_esperadas: buildInterviewQuestions(matchedSkills, missingSkills, level),
      gaps_potenciais: buildGaps(missingSkills, requiredSentences, level),
    },
    provider: 'local-agent',
    provider_notice: 'Analise 100% local gerada pelo agente MatchCV. Nenhuma chave, API externa ou chamada de rede foi usada.',
    meta: {
      curriculo_skills_detectadas: curriculoSkills,
      vaga_skills_detectadas: vagaSkills,
      skills_em_comum: matchedSkills,
      skills_ausentes: missingSkills,
    },
  };
}
