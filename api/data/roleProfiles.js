export const ROLE_PROFILES = [
  {
    id: 'tecnologia',
    label: 'Tecnologia e Engenharia',
    keywords: ['desenvolvedor', 'developer', 'engenheiro de software', 'frontend', 'backend', 'fullstack', 'mobile', 'devops', 'qa', 'programador', 'ti'],
    focus: 'entregas técnicas, decisões de arquitetura, qualidade e impacto do produto',
    interviewFocus: 'decisões técnicas, tradeoffs, qualidade, colaboração e impacto das entregas',
  },
  {
    id: 'dados',
    label: 'Dados e Analytics',
    keywords: ['analista de dados', 'cientista de dados', 'engenheiro de dados', 'data analyst', 'data scientist', 'business intelligence', 'bi'],
    focus: 'qualidade dos dados, análises, decisões apoiadas e impacto mensurável',
    interviewFocus: 'raciocínio analítico, qualidade dos dados, comunicação de insights e impacto no negócio',
  },
  {
    id: 'produto',
    label: 'Produto e Projetos',
    keywords: ['product manager', 'product owner', 'gerente de produto', 'analista de produto', 'coordenador de projetos', 'project manager', 'scrum master'],
    focus: 'descoberta, priorização, alinhamento entre áreas e resultados do produto',
    interviewFocus: 'priorização, descoberta, métricas, negociação e decisões com informações incompletas',
  },
  {
    id: 'design',
    label: 'Design e Experiência',
    keywords: ['ux designer', 'ui designer', 'product designer', 'designer', 'design gráfico', 'pesquisador ux', 'ux researcher'],
    focus: 'problema do usuário, processo de design, colaboração e efeito da solução',
    interviewFocus: 'processo, pesquisa, decisões de design, acessibilidade e aprendizado com usuários',
  },
  {
    id: 'marketing',
    label: 'Marketing e Conteúdo',
    keywords: ['marketing', 'social media', 'copywriter', 'conteúdo', 'growth', 'mídia paga', 'seo', 'comunicação'],
    focus: 'público, estratégia, canais, execução e resultados de campanha',
    interviewFocus: 'estratégia, entendimento de público, experimentação, canais e métricas',
  },
  {
    id: 'vendas',
    label: 'Vendas e Negócios',
    keywords: ['vendedor', 'executivo de contas', 'account executive', 'sdr', 'bdr', 'inside sales', 'representante comercial', 'consultor comercial'],
    focus: 'carteira, processo comercial, relacionamento, metas e receita gerada',
    interviewFocus: 'prospecção, qualificação, negociação, gestão de carteira e atingimento de metas',
  },
  {
    id: 'cliente',
    label: 'Atendimento e Sucesso do Cliente',
    keywords: ['customer success', 'customer experience', 'atendimento', 'suporte ao cliente', 'analista de suporte', 'sac', 'cx'],
    focus: 'jornada do cliente, resolução, relacionamento, retenção e qualidade do atendimento',
    interviewFocus: 'empatia, resolução de conflitos, priorização, retenção e comunicação com clientes',
  },
  {
    id: 'pessoas',
    label: 'Pessoas e Recursos Humanos',
    keywords: ['recursos humanos', 'rh', 'recrutador', 'recruiter', 'people', 'departamento pessoal', 'talent acquisition'],
    focus: 'processos de pessoas, experiência do colaborador, indicadores e impacto organizacional',
    interviewFocus: 'escuta, confidencialidade, processos, legislação, indicadores e experiência das pessoas',
  },
  {
    id: 'financeiro',
    label: 'Financeiro e Controladoria',
    keywords: ['financeiro', 'finanças', 'controladoria', 'contábil', 'contador', 'fiscal', 'tesouraria', 'fp&a'],
    focus: 'acurácia, controles, análise financeira, conformidade e apoio à decisão',
    interviewFocus: 'controles, precisão, análise, prazos, conformidade e decisões financeiras',
  },
  {
    id: 'operacoes',
    label: 'Operações e Administração',
    keywords: ['operações', 'operacional', 'administrativo', 'assistente administrativo', 'logística', 'compras', 'supply chain', 'processos'],
    focus: 'execução, melhoria de processos, produtividade, qualidade e cumprimento de prazos',
    interviewFocus: 'organização, melhoria contínua, indicadores, fornecedores, qualidade e gestão de prioridades',
  },
];

export const GENERAL_ROLE_PROFILE = {
  id: 'geral',
  label: 'Perfil profissional geral',
  focus: 'responsabilidades, contexto, ações realizadas e resultados comprováveis',
  interviewFocus: 'experiências relevantes, resolução de problemas, colaboração e resultados',
};

function normalize(value) {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function includesKeyword(text, keyword) {
  const escaped = normalize(keyword).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(text);
}

export function detectRoleProfile(jobText) {
  const normalized = normalize(jobText);
  const ranked = ROLE_PROFILES.map((profile) => ({
    profile,
    score: profile.keywords.reduce((total, keyword) => total + (includesKeyword(normalized, keyword) ? 1 : 0), 0),
  })).sort((first, second) => second.score - first.score);

  return ranked[0]?.score > 0 ? ranked[0].profile : GENERAL_ROLE_PROFILE;
}
