import test from 'node:test';
import assert from 'node:assert/strict';
import { validateCurriculoVagaInput } from '../api/validators.js';

test('mantém apenas currículo e vaga no contrato validado', () => {
  const result = validateCurriculoVagaInput({ curriculo: 'CV', vaga: 'Vaga', usarContextoPublico: 'true' });
  assert.equal(result.valid, true);
  assert.deepEqual(result.data, { curriculo: 'CV', vaga: 'Vaga' });
});

test('recusa conteúdo acima do limite', () => {
  const result = validateCurriculoVagaInput({ curriculo: 'a'.repeat(50001), vaga: 'Vaga' });
  assert.equal(result.valid, false);
  assert.equal(result.statusCode, 413);
});
