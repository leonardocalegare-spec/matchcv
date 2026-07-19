import { pipeline } from '@huggingface/transformers';

const MODEL_ID = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
let extractorPromise;

function getExtractor() {
  if (!extractorPromise) {
    extractorPromise = pipeline('feature-extraction', MODEL_ID, {
      dtype: 'q8',
      progress_callback: (progress) => self.postMessage({ type: 'progress', progress }),
    });
  }
  return extractorPromise;
}

function dot(first, second) {
  let total = 0;
  for (let index = 0; index < first.length; index += 1) total += first[index] * second[index];
  return total;
}

self.onmessage = async (event) => {
  const { id, requirements, segments } = event.data;
  try {
    const extractor = await getExtractor();
    const texts = [...requirements.map((item) => item.text), ...segments];
    const tensor = await extractor(texts, { pooling: 'mean', normalize: true });
    const vectors = tensor.tolist();
    const requirementVectors = vectors.slice(0, requirements.length);
    const segmentVectors = vectors.slice(requirements.length);
    const matches = requirements.map((requirement, requirementIndex) => {
      let bestIndex = -1;
      let similarity = -1;
      let secondBestSimilarity = -1;
      for (let segmentIndex = 0; segmentIndex < segmentVectors.length; segmentIndex += 1) {
        const current = dot(requirementVectors[requirementIndex], segmentVectors[segmentIndex]);
        if (current > similarity) {
          secondBestSimilarity = similarity;
          similarity = current;
          bestIndex = segmentIndex;
        } else if (current > secondBestSimilarity) {
          secondBestSimilarity = current;
        }
      }
      return {
        key: requirement.key,
        similarity: Number(Math.max(0, similarity).toFixed(4)),
        margin: Number(Math.max(0, similarity - secondBestSimilarity).toFixed(4)),
        evidence: bestIndex >= 0 ? segments[bestIndex] : null,
      };
    });
    self.postMessage({ type: 'result', id, matches, model: MODEL_ID });
  } catch (error) {
    self.postMessage({ type: 'error', id, error: error.message || 'Falha na análise semântica.' });
  }
};
