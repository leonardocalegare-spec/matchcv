import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCurriculoVagaInput } from '../api/validators.js';

test('normaliza a autorização de contexto público como booleano estrito', () => {
  const result = validateCurriculoVagaInput({ curriculo: 'CV', vaga: 'Vaga', usarContextoPublico: 'true' });
  assert.equal(result.valid, true);
  assert.equal(result.data.usarContextoPublico, false);
});

test('recusa conteúdo acima do limite', () => {
  const result = validateCurriculoVagaInput({ curriculo: 'a'.repeat(50001), vaga: 'Vaga' });
  assert.equal(result.valid, false);
  assert.equal(result.statusCode, 413);
});
