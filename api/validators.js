export function validateCurriculoVagaInput(body) {
  const curriculo = typeof body.curriculo === 'string' ? body.curriculo.trim() : '';
  const vaga = typeof body.vaga === 'string' ? body.vaga.trim() : '';
  const empresaManual = typeof body.empresaManual === 'string' ? body.empresaManual.trim() : null;
  const usarContextoPublico = body.usarContextoPublico === true;

  if (!curriculo || !vaga) {
    return {
      valid: false,
      error: 'Preencha o curriculo base e a descricao da vaga.',
    };
  }

  if (curriculo.length > 50000 || vaga.length > 30000 || (empresaManual?.length ?? 0) > 120) {
    return {
      valid: false,
      error: 'O conteúdo enviado excede o limite permitido.',
      statusCode: 413,
    };
  }

  return {
    valid: true,
    data: { curriculo, vaga, empresaManual, usarContextoPublico },
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
