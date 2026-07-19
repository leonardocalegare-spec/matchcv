let worker;
let requestCounter = 0;

function splitResume(text) {
  return String(text)
    .split(/\r?\n|(?<=[.!?;])\s+/)
    .map((item) => item.replace(/^[-*•\s]+/, '').trim())
    .filter((item) => item.length >= 18 && item.length <= 500)
    .slice(0, 80);
}

function requirementKey(item, index) {
  return `${item.category || 'geral'}:${item.skill || index}`;
}

export function runSemanticMatching(curriculo, requirements, onProgress = () => {}) {
  const segments = splitResume(curriculo);
  if (segments.length === 0 || requirements.length === 0) {
    return Promise.resolve({ matches: [], model: null, status: 'skipped' });
  }
  if (!worker) worker = new Worker(new URL('../../workers/semanticAnalysis.worker.js', import.meta.url), { type: 'module' });
  requestCounter += 1;
  const id = requestCounter;
  const payloadRequirements = requirements.map((item, index) => ({
    key: requirementKey(item, index),
    text: item.skill,
  }));

  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      worker.removeEventListener('message', handleMessage);
      reject(new Error('A análise semântica excedeu o tempo disponível.'));
    }, 180000);

    function handleMessage(event) {
      if (event.data.type === 'progress') {
        const progress = event.data.progress;
        const percent = Number.isFinite(progress?.progress) ? Math.round(progress.progress) : null;
        onProgress(percent == null ? 'Carregando inteligência semântica local...' : `Carregando modelo local: ${percent}%`);
        return;
      }
      if (event.data.id !== id) return;
      window.clearTimeout(timeout);
      worker.removeEventListener('message', handleMessage);
      if (event.data.type === 'error') reject(new Error(event.data.error));
      else resolve({ matches: event.data.matches, model: event.data.model, status: 'completed' });
    }

    worker.addEventListener('message', handleMessage);
    worker.postMessage({ id, requirements: payloadRequirements, segments });
  });
}
