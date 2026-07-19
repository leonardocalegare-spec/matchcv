import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import { analyzePdfDocument, detectPossibleColumns } from './ats/documentDiagnostics';

export async function extrairDocumentoDePDF(file) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Arquivo inválido. Envie um PDF.');
  }

  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const pages = [];
  const allItems = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1 });
    const items = content.items.map((item) => ({
      str: item.str,
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
      width: item.width || 0,
      height: item.height || 0,
      page: i,
    }));
    const lines = new Map();
    for (const item of items) {
      const lineKey = Math.round(item.y / 3) * 3;
      if (!lines.has(lineKey)) lines.set(lineKey, []);
      lines.get(lineKey).push(item);
    }
    const text = [...lines.entries()]
      .sort(([first], [second]) => second - first)
      .map(([, lineItems]) => lineItems.sort((first, second) => first.x - second.x).map((item) => item.str).join(' '))
      .join('\n');
    pages.push({ page: i, width: viewport.width, height: viewport.height, items, text });
    allItems.push(...items);
  }

  const textoLimpo = pages.map((page) => page.text).join('\n\n').trim();

  if (!textoLimpo) {
    throw new Error('Não foi possível extrair texto do PDF. Ele pode ser uma imagem escaneada.');
  }

  return {
    text: textoLimpo,
    pages,
    diagnostics: analyzePdfDocument({
      text: textoLimpo,
      pages: pdf.numPages,
      items: allItems,
      possibleColumns: detectPossibleColumns(pages),
    }),
  };
}

export async function extrairTextoDePDF(file) {
  return (await extrairDocumentoDePDF(file)).text;
}
