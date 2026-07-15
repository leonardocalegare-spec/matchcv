export function validateCurriculoVagaInput(body) {
  const curriculo = typeof body.curriculo === 'string' ? body.curriculo.trim() : '';
  const vaga = typeof body.vaga === 'string' ? body.vaga.trim() : '';

  if (!curriculo || !vaga) {
    return {
      valid: false,
      error: 'Preencha o curriculo base e a descricao da vaga.',
    };
  }

  return {
    valid: true,
    data: { curriculo, vaga },
  };
}

export function normalizeRequestBody(body) {
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      throw new Error('JSON invalido.');
    }
  }

  return body ?? {};
}