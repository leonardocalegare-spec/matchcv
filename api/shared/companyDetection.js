export function detectCompany(vagaText, userCompanyName = null) {
  if (userCompanyName && userCompanyName.trim().length > 0) {
    return userCompanyName.trim();
  }

  const normalizedText = String(vagaText).replace(/\r/g, '');
  
  // Padrões de detecção expandidos
  const patterns = [
    /\bvaga\b[^\n.;]{2,80}?\s+(?:na|no)\s+([A-ZÀ-Ú][\wÀ-ú&.-]{1,40})/i,
    /(?:empresa|companhia|organiza[cç][aã]o)\s*[:-]\s*([^\n]+)/i,
    /(?:sobre a|somos a|somos o)\s+(?:empresa\s+)?([A-ZÀ-Ú][\wÀ-ú&.-]{1,40})/i,
    /junte-se\s+(?:à|a|ao)\s+([A-ZÀ-Ú][\wÀ-ú&.-]{1,40})/i,
    /trabalhe\s+(?:na|no|com a)\s+([A-ZÀ-Ú][\wÀ-ú&.-]{1,40})/i,
    /\b([A-ZÀ-Ú][\wÀ-ú&.-]{1,40})\s+(?:busca|procura|está contratando|é uma empresa)/i
  ];

  for (const pattern of patterns) {
    const match = normalizedText.match(pattern);
    if (match && match[1]) {
      const detected = match[1].trim().replace(/[.,;:]+$/, '');
      if (detected.length >= 2) return detected;
    }
  }

  // Fallback heurístico
  const lines = normalizedText.split('\n').map(l => l.trim()).filter(Boolean).slice(0, 3);
  for (const line of lines) {
    const lowerLine = line.toLowerCase();
    if (!lowerLine.includes('desenvolvedor') && !lowerLine.includes('analista') && !lowerLine.includes('vaga') && !lowerLine.includes('engenheiro') && !lowerLine.includes('estágio')) {
      const properNounMatch = line.match(/\b([A-ZÀ-Ú][\wÀ-ú&.-]{1,20}(?:\s+[A-ZÀ-Ú][\wÀ-ú&.-]{1,20}){0,2})\b/);
      if (properNounMatch && properNounMatch[1]) {
        return properNounMatch[1].trim();
      }
    }
  }

  return 'Empresa não identificada';
}
