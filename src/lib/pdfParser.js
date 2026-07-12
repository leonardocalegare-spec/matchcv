import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export async function extrairTextoDePDF(file) {
  if (!file || file.type !== 'application/pdf') {
    throw new Error('Arquivo inválido. Envie um PDF.');
  }

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let textoCompleto = '';

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const textoPagina = content.items.map(item => item.str).join(' ');
    textoCompleto += textoPagina + '\n\n';
  }

  const textoLimpo = textoCompleto.trim();

  if (!textoLimpo) {
    throw new Error('Não foi possível extrair texto do PDF. Ele pode ser uma imagem escaneada.');
  }

  return textoLimpo;
}
