import test from 'node:test';
import assert from 'node:assert/strict';
import { buildAtsAnalysis } from '../src/lib/ats/scoring.js';
import { analyzePlainTextDocument } from '../src/lib/ats/documentDiagnostics.js';

function baseAnalysis(status = 'ausente') {
  return {
    match_score: { detalhamento: { adequacao_senioridade: 100 } },
    meta: {
      confianca_analise: 'média',
      vaga_skills_detectadas: ['Liderança'],
      skills_em_comum: [],
    },
    analise_aderencia: {
      requisitos: [{ skill: 'Liderança de equipe', category: 'obrigatório', status, score: 0, evidence: null, recommendation: 'Reforce.' }],
      resumo: { comprovados: 0, parciais: 0, ausentes: 1 },
    },
  };
}

test('mantém a leitura de compatibilidade dentro da faixa de 0 a 100', () => {
  const result = buildAtsAnalysis(
    baseAnalysis('comprovado'),
    analyzePlainTextDocument('Nome nome@email.com. Experiência profissional. Formação. Competências. Resumo profissional.'),
  );

  assert.equal(result.analysis_version, '3.0');
  assert.ok(result.ats_analysis.overall_score >= 0 && result.ats_analysis.overall_score <= 100);
  assert.equal(result.ats_analysis.label, 'Leitura de compatibilidade');
});

test('mantém requisito ausente quando não há evidência', () => {
  const result = buildAtsAnalysis(
    baseAnalysis('ausente'),
    analyzePlainTextDocument('Coordenei cinco pessoas em entregas multidisciplinares. E-mail: pessoa@exemplo.com.'),
  );

  const requirement = result.analise_aderencia.requisitos[0];
  assert.equal(requirement.status, 'ausente');
  assert.equal(requirement.evidence, null);
});

test('diagnóstico de texto alerta quando faltam seções e contato', () => {
  const diagnostics = analyzePlainTextDocument('Texto curto sem estrutura suficiente para um currículo completo.');
  assert.equal(diagnostics.has_contact, false);
  assert.ok(diagnostics.warnings.length > 0);
});
