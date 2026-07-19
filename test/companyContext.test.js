import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchCompanyContext } from '../api/deterministicPipeline.js';

test('usa Wikipedia automaticamente quando Google não está configurado', async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GOOGLE_SEARCH_API_KEY;
  const originalEngine = process.env.GOOGLE_SEARCH_ENGINE_ID;
  delete process.env.GOOGLE_SEARCH_API_KEY;
  delete process.env.GOOGLE_SEARCH_ENGINE_ID;

  globalThis.fetch = async (url) => {
    assert.match(String(url), /wikipedia\.org/);
    return {
      ok: true,
      json: async () => ({
        query: {
          pages: {
            1: { title: 'Acme', extract: 'Acme é uma empresa de tecnologia.', fullurl: 'https://pt.wikipedia.org/wiki/Acme' },
          },
        },
      }),
    };
  };

  try {
    const context = await fetchCompanyContext('Acme');
    assert.equal(context.source, 'Wikipédia');
    assert.match(context.summary, /empresa de tecnologia/);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GOOGLE_SEARCH_API_KEY;
    else process.env.GOOGLE_SEARCH_API_KEY = originalKey;
    if (originalEngine === undefined) delete process.env.GOOGLE_SEARCH_ENGINE_ID;
    else process.env.GOOGLE_SEARCH_ENGINE_ID = originalEngine;
  }
});
