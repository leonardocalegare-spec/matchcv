/**
 * @typedef {{ companyName: string | null, stackKeywords: string[], seniority: string, requirements: string[] }} JobInfo
 * @typedef {{ available: boolean, summary: string, size: string, recentSignals: string[] }} CompanyContext
 * @typedef {{ available: boolean, insights: string[] }} MarketContext
 * @typedef {{ empresa_contexto: { resumo: string, porte: string, sinais_relevantes: string[] }, match_score: number, gaps_identificados: string[], dicas: Array<{ dica: string, motivo: string, fonte: 'mercado' | 'vaga' | 'empresa' }>, reformulacao_sugerida: string, faltando_no_curriculo: string[] }} LlmAnalysis
 */

const KNOWN_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'PostgreSQL',
  'MySQL', 'Docker', 'AWS', 'Azure', 'Figma', 'Excel', 'Power BI', 'Scrum', 'Kanban',
  'Git', 'GitHub', 'REST', 'HTML', 'CSS', 'Inteligência Artificial', 'Inglês',
];

function normalize(value) {
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function splitSentences(text) {
  return String(text).split(/\r?\n|[.;]/)
    .map((item) => item.replace(/^[-*•\s]+/, '').trim())
    .filter((item) => item.length > 8);
}

function includesTerm(text, term) {
  const normalizedText = normalize(text);
  const normalizedTerm = normalize(term);
  const escapedTerm = normalizedTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^a-z0-9])${escapedTerm}([^a-z0-9]|$)`).test(normalizedText);
}

function detectSeniority(jobText) {
  const normalized = normalize(jobText);
  if (/\bestagio\b|\bestagiario\b|\bintern\b/.test(normalized)) return 'estágio';
  if (/\bjunior\b|\bjr\b|\btrainee\b/.test(normalized)) return 'junior';
  if (/\bpleno\b|\bmid\b/.test(normalized)) return 'pleno';
  if (/\bsenior\b|\bsr\b|\blider\b|\blead\b|\bespecialista\b/.test(normalized)) return 'senior';
  return 'não identificado';
}

/** @param {string} jobText @returns {JobInfo} */
export function extractJobInfo(jobText) {
  const companyMatch = jobText.match(/(?:empresa|companhia|organiza[cç][aã]o)\s*[:-]\s*([^\n]+)/i);
  const companyName = companyMatch?.[1]?.trim() || null;
  const requirements = splitSentences(jobText)
    .filter((sentence) => /requisit|necess.rio|obrigat.rio|conhecimento|experi.ncia|desej.vel|diferencial/i.test(sentence))
    .slice(0, 8);

  return {
    companyName,
    stackKeywords: KNOWN_SKILLS.filter((skill) => includesTerm(jobText, skill)),
    seniority: detectSeniority(jobText),
    requirements,
  };
}

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`Consulta externa indisponível (${response.status}).`);
    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function cleanSearchText(value) {
  return String(value).replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

/** @param {string | null} companyName @returns {Promise<CompanyContext>} */
export async function fetchCompanyContext(companyName) {
  if (!companyName) return { available: false, summary: 'Indisponível', size: 'Indisponível', recentSignals: [] };

  try {
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(companyName)}&format=json&no_html=1&skip_disambig=1`;
    const data = await (await fetchWithTimeout(url)).json();
    const summary = cleanSearchText(data.AbstractText || data.Heading || '');
    const signals = (data.RelatedTopics || [])
      .flatMap((topic) => topic.Topics || [topic])
      .map((topic) => cleanSearchText(topic.Text))
      .filter(Boolean)
      .slice(0, 3);

    if (!summary && signals.length === 0) throw new Error('Sem contexto público confiável.');
    return { available: true, summary: summary || 'Resumo público não disponível.', size: 'Não identificado pela busca pública.', recentSignals: signals };
  } catch {
    return { available: false, summary: 'Indisponível', size: 'Indisponível', recentSignals: [] };
  }
}

/** @param {string[]} stackKeywords @param {string} seniority @returns {Promise<MarketContext>} */
export async function fetchMarketContext(stackKeywords, seniority) {
  if (stackKeywords.length === 0) return { available: false, insights: [] };

  try {
    const query = `${stackKeywords.slice(0, 3).join(' ')} ${seniority} vagas`;
    const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
    const data = await (await fetchWithTimeout(url)).json();
    const insights = [data.AbstractText, ...(data.RelatedTopics || []).flatMap((topic) => topic.Topics || [topic]).map((topic) => topic.Text)]
      .map(cleanSearchText)
      .filter(Boolean)
      .slice(0, 3);

    if (insights.length === 0) throw new Error('Sem insights de mercado confiáveis.');
    return { available: true, insights };
  } catch {
    return { available: false, insights: [] };
  }
}

/** @param {string} resume @param {JobInfo} jobInfo @param {CompanyContext} companyContext @param {MarketContext} marketContext */
export function buildFinalPrompt(resume, jobInfo, companyContext, marketContext) {
  const instructions = [
    'Você é um revisor de currículo rigoroso. Responda somente JSON puro, sem markdown ou texto adicional.',
    'Retorne exatamente o schema solicitado.',
    'Não invente números, empresas, habilidades, experiências ou resultados fora do currículo original.',
    'Quando o currículo não comprovar uma informação, inclua-a em faltando_no_curriculo ou gaps_identificados.',
    'Cada dica deve ter motivo específico para esta vaga e fonte mercado, vaga ou empresa.',
    'Toda dica deve ser refletida em reformulacao_sugerida, e toda mudança na reformulacao_sugerida deve corresponder a uma dica.',
    'A reformulacao_sugerida deve usar somente fatos do currículo; use [preencher com fato real] quando faltar dado.',
  ].join(' ');
  const companyPrompt = companyContext.available ? JSON.stringify(companyContext) : 'contexto de empresa indisponível, não especule.';
  const marketPrompt = marketContext.available ? JSON.stringify(marketContext) : 'contexto de mercado indisponível, não especule.';

  return `${instructions}\n\nSCHEMA:\n{"empresa_contexto":{"resumo":"","porte":"","sinais_relevantes":[]},"match_score":0,"gaps_identificados":[],"dicas":[{"dica":"","motivo":"","fonte":"mercado|vaga|empresa"}],"reformulacao_sugerida":"","faltando_no_curriculo":[]}\n\nCURRÍCULO ORIGINAL:\n${resume}\n\nDADOS DA VAGA EXTRAÍDOS LOCALMENTE:\n${JSON.stringify(jobInfo)}\n\nCONTEXTO DA EMPRESA:\n${companyPrompt}\n\nCONTEXTO DE MERCADO:\n${marketPrompt}`;
}

function assertLlmSchema(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('O LLM não retornou um objeto JSON.');
  const company = value.empresa_contexto;
  const validCompany = company && typeof company === 'object' && typeof company.resumo === 'string' && typeof company.porte === 'string' && Array.isArray(company.sinais_relevantes);
  const validTips = Array.isArray(value.dicas) && value.dicas.every((tip) => (
    tip && typeof tip.dica === 'string' && typeof tip.motivo === 'string' && ['mercado', 'vaga', 'empresa'].includes(tip.fonte)
  ));

  if (!validCompany || !Number.isFinite(value.match_score) || value.match_score < 0 || value.match_score > 100 || !Array.isArray(value.gaps_identificados) || !validTips || typeof value.reformulacao_sugerida !== 'string' || !Array.isArray(value.faltando_no_curriculo)) {
    throw new Error('O LLM retornou um schema incompleto.');
  }
  return value;
}

/** @param {string} finalPrompt @returns {Promise<LlmAnalysis>} */
export async function callLLM(finalPrompt) {
  const baseUrl = (process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434').replace(/\/$/, '');
  const model = process.env.OLLAMA_MODEL || 'llama3.2:3b';
  const response = await fetchWithTimeout(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, prompt: finalPrompt, format: 'json', stream: false, options: { temperature: 0 } }),
  });
  const payload = await response.json();

  try {
    return assertLlmSchema(JSON.parse(payload.response));
  } catch (error) {
    throw new Error(error.message || 'A resposta do Ollama não contém JSON válido.');
  }
}

/** @param {string} resume @param {string} jobText @returns {Promise<LlmAnalysis>} */
export async function runAnalysis(resume, jobText) {
  const jobInfo = extractJobInfo(jobText);
  const companyContext = await fetchCompanyContext(jobInfo.companyName);
  const marketContext = await fetchMarketContext(jobInfo.stackKeywords, jobInfo.seniority);
  const finalPrompt = buildFinalPrompt(resume, jobInfo, companyContext, marketContext);
  return callLLM(finalPrompt);
}
