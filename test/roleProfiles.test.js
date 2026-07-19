import test from 'node:test';
import assert from 'node:assert/strict';
import { detectRoleProfile } from '../api/data/roleProfiles.js';
import { analisarCurriculoComAgente } from '../api/careerAgent.js';

const roleCases = [
  ['Product Manager responsável pelo roadmap e discovery', 'produto'],
  ['Analista de Marketing com SEO e mídia paga', 'marketing'],
  ['Executivo de Contas responsável por CRM e negociação', 'vendas'],
  ['Analista de Recursos Humanos com recrutamento e seleção', 'pessoas'],
  ['Analista Financeiro de fluxo de caixa e controladoria', 'financeiro'],
  ['Product Designer com pesquisa de usuários e prototipação', 'design'],
];

for (const [description, expected] of roleCases) {
  test(`classifica a família ${expected}`, () => {
    assert.equal(detectRoleProfile(description).id, expected);
  });
}

test('adapta o resumo e as perguntas à família do cargo', () => {
  const result = analisarCurriculoComAgente(
    'Gerenciei CRM, prospectei clientes e negociei contratos com metas mensais.',
    'Vaga Executivo de Contas. Requisito obrigatório: experiência com CRM e negociação.',
  );

  assert.equal(result.vaga_analise.familia_cargo, 'vendas');
  assert.match(result.curriculo_otimizado.resumo_executivo, /Vendas e Negócios/);
  assert.ok(result.prep_entrevista.perguntas_esperadas.some((item) => /prospecção|negociação|carteira/i.test(item.pergunta)));
});
