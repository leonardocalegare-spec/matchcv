import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { readJsonBody, sendJson, sendRequestError } from '../api/shared/http.js';

function requestFrom(body) {
  return Readable.from(body ? [body] : []);
}

function responseSpy() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(value = '') {
      this.body = value;
    },
  };
}

test('converte o corpo JSON e aceita requisição vazia', async () => {
  assert.deepEqual(await readJsonBody(requestFrom('{"vaga":"Produto"}')), { vaga: 'Produto' });
  assert.deepEqual(await readJsonBody(requestFrom('')), {});
});

test('rejeita JSON inválido com status 400', async () => {
  await assert.rejects(
    readJsonBody(requestFrom('{invalido}')),
    (error) => error.statusCode === 400 && error.message === 'JSON inválido.',
  );
});

test('rejeita payload acima do limite configurado', async () => {
  await assert.rejects(
    readJsonBody(requestFrom('123456'), 5),
    (error) => error.statusCode === 413,
  );
});

test('padroniza respostas JSON e erros HTTP', () => {
  const success = responseSpy();
  sendJson(success, 201, { ok: true });
  assert.equal(success.statusCode, 201);
  assert.equal(success.headers['Content-Type'], 'application/json; charset=utf-8');
  assert.deepEqual(JSON.parse(success.body), { ok: true });

  const failure = responseSpy();
  const error = new Error('Entrada recusada.');
  error.statusCode = 422;
  sendRequestError(failure, error);
  assert.equal(failure.statusCode, 422);
  assert.deepEqual(JSON.parse(failure.body), { error: 'Entrada recusada.' });
});
