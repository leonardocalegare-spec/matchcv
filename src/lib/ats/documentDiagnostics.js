const SECTION_PATTERNS = {
  contato: /(?:e-?mail|telefone|linkedin|github|whatsapp)/i,
  resumo: /(?:resumo|perfil|objetivo)\s*(?:profissional)?/i,
  experiencia: /(?:experi[eê]ncia|hist[oó]rico)\s*(?:profissional)?/i,
  formacao: /(?:forma[cç][aã]o|educa[cç][aã]o|gradua[cç][aã]o|acad[eê]mic)/i,
  competencias: /(?:compet[eê]ncias|habilidades|skills|conhecimentos)/i,
};

function clamp(value, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

function findSections(text) {
  return Object.fromEntries(Object.entries(SECTION_PATTERNS).map(([key, pattern]) => [key, pattern.test(text)]));
}

function buildDiagnostics({ text, pages = 1, source = 'text', items = [], possibleColumns = false }) {
  const cleanText = String(text || '').replace(/\s+/g, ' ').trim();
  const sections = findSections(cleanText);
  const sectionCount = Object.values(sections).filter(Boolean).length;
  const shortItems = items.filter((item) => String(item.str || '').trim().length <= 2).length;
  const fragmentationRatio = items.length > 0 ? shortItems / items.length : 0;
  const searchable = cleanText.length >= 80;
  const hasContact = /[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:\+?55\s*)?(?:\(?\d{2}\)?\s*)?\d{4,5}[-\s]?\d{4}/i.test(cleanText);
  const extractionConfidence = searchable
    ? clamp(Math.round(100 - (fragmentationRatio * 55) - (possibleColumns ? 10 : 0)))
    : 0;

  let score = 0;
  if (searchable) score += 35;
  score += extractionConfidence * 0.2;
  score += (sectionCount / Object.keys(SECTION_PATTERNS).length) * 25;
  if (hasContact) score += 10;
  if (pages > 0 && pages <= 4) score += 5;
  if (fragmentationRatio < 0.35) score += 5;
  if (possibleColumns) score -= 8;
  score = clamp(Math.round(score));

  const warnings = [];
  if (!searchable) warnings.push('O documento tem pouco texto pesquisável e pode ser um PDF escaneado.');
  if (possibleColumns) warnings.push('O arquivo pode usar múltiplas colunas; confirme se a ordem de leitura ficou correta.');
  if (fragmentationRatio >= 0.35) warnings.push('O texto foi extraído de forma fragmentada, o que pode dificultar a leitura automática.');
  if (!sections.experiencia) warnings.push('A seção de experiência profissional não foi identificada com clareza.');
  if (!sections.formacao) warnings.push('A seção de formação não foi identificada com clareza.');
  if (!hasContact) warnings.push('E-mail ou telefone não foram identificados no conteúdo analisado.');

  return {
    source,
    score,
    pages,
    searchable,
    has_contact: hasContact,
    possible_columns: possibleColumns,
    fragmentation_ratio: Number(fragmentationRatio.toFixed(2)),
    extraction_confidence: extractionConfidence,
    sections,
    warnings,
  };
}

export function analyzePlainTextDocument(text) {
  return buildDiagnostics({ text, source: 'text', pages: text?.trim() ? 1 : 0 });
}

export function analyzePdfDocument({ text, pages, items, possibleColumns }) {
  return buildDiagnostics({ text, pages, items, possibleColumns, source: 'pdf' });
}

export function detectPossibleColumns(pages) {
  return pages.some((page) => {
    const items = page.items.filter((item) => item.str.trim().length > 2);
    if (items.length < 12) return false;
    const middle = page.width / 2;
    const left = items.filter((item) => item.x < middle * 0.85).length;
    const right = items.filter((item) => item.x > middle * 1.05).length;
    return left >= 5 && right >= 5 && Math.min(left, right) / items.length >= 0.2;
  });
}
