import test from 'node:test';
import assert from 'node:assert/strict';
import { analisarCurriculoComAgente } from '../api/careerAgent.js';

test('reconhece aplicação real mesmo quando o currículo não traz números', () => {
  const result = analisarCurriculoComAgente(
    'Desenvolvi interfaces em React para o portal interno da equipe.',
    'Vaga de Desenvolvedor. Requisito obrigatório: experiência com React.',
  );
  const requirement = result.analise_aderencia.requisitos.find((item) => item.skill === 'React');
  assert.equal(requirement.status, 'comprovado');
  assert.equal(requirement.evidence_level, 'aplicação');
});

test('não trata palavras genéricas como projeto ou cliente como resultado mensurável', () => {
  const result = analisarCurriculoComAgente(
    'Conhecimento em React adquirido em projetos pessoais.',
    'Vaga de Desenvolvedor. Requisito obrigatório: experiência com React.',
  );
  const requirement = result.analise_aderencia.requisitos.find((item) => item.skill === 'React');
  assert.equal(requirement.status, 'parcial');
  assert.equal(requirement.evidence_level, 'menção');
});

test('compara senioridade do currículo com a vaga sem penalizar vagas seniores por padrão', () => {
  const result = analisarCurriculoComAgente(
    'Desenvolvedor Senior com 6 anos de experiência. Desenvolvi aplicações React para clientes.',
    'Vaga Desenvolvedor Senior. Requisito obrigatório: experiência com React.',
  );

  assert.equal(result.match_score.detalhamento.adequacao_senioridade, 100);
  assert.equal(result.match_score.detalhamento.senioridade_curriculo, 'senior');
});

test('não inventa adequação de senioridade quando o currículo não oferece evidência', () => {
  const result = analisarCurriculoComAgente(
    'Desenvolvi uma aplicação React para um projeto acadêmico.',
    'Vaga Desenvolvedor Pleno. Requisito obrigatório: React.',
  );

  assert.equal(result.match_score.detalhamento.adequacao_senioridade, null);
});

test('inclui requisitos textuais que não são skills no mapa de aderência', () => {
  const result = analisarCurriculoComAgente(
    'Formação em Tecnologia da Informação. Desenvolvi projetos acadêmicos.',
    'Vaga de Analista. Formação superior em Tecnologia da Informação é requisito obrigatório.',
  );

  assert.ok(result.analise_aderencia.requisitos.some((item) => item.kind === 'requisito_textual'));
});

test('extrai título e empresa de uma descrição corrida de vaga', () => {
  const result = analisarCurriculoComAgente(
    'Desenvolvedor Pleno com experiência em React.',
    'Vaga Desenvolvedor Front-end Pleno na Acme. Requisito obrigatório: React.',
  );

  assert.equal(result.vaga_analise.titulo, 'Desenvolvedor Front-end Pleno');
  assert.equal(result.vaga_analise.empresa, 'Acme');
});

test('associa resultado mensurável da frase seguinte à evidência', () => {
  const result = analisarCurriculoComAgente(
    'Planejei campanhas de mídia paga e otimizei SEO. Aumentei em 20% os leads qualificados.',
    'Vaga Analista de Marketing. Requisitos obrigatórios: mídia paga e SEO.',
  );

  const marketingEvidence = result.analise_aderencia.requisitos.find((item) => item.skill === 'Mídia Paga');
  assert.equal(marketingEvidence.status, 'comprovado');
  assert.match(marketingEvidence.evidence, /20%/);
});
