import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const skillsPath = path.resolve(currentDirectory, '..', 'data', 'skills.json');
const skillsData = JSON.parse(fs.readFileSync(skillsPath, 'utf8'));

export const ALL_SKILLS = Object.values(skillsData).flat();
export const ALL_SYNONYMS = ALL_SKILLS.flatMap((skill) => skill.synonyms);

export const REQUIREMENT_MARKERS = [
  'requisito', 'necessario', 'necessário', 'obrigatorio', 'obrigatório',
  'conhecimento', 'experiencia', 'experiência', 'vivencia', 'vivência',
  'dominio', 'domínio', 'formacao', 'formação', 'cursando', 'superior',
];

export const DESIRABLE_MARKERS = [
  'desejavel', 'desejável', 'diferencial', 'plus', 'nice to have',
  'sera um diferencial', 'será um diferencial',
];

export const RESPONSIBILITY_MARKERS = [
  'responsabilidade', 'responsabilidades', 'atividade', 'atividades', 'dia a dia',
  'atuará', 'atuara', 'será responsável', 'sera responsavel', 'principais desafios',
];

export const ACTION_VERBS = [
  'desenvolvi', 'criei', 'implementei', 'automatizei', 'construi', 'liderei', 'participei',
  'analisei', 'otimizei', 'integrei', 'documentei', 'planejei', 'coordenei', 'gerenciei',
  'negociei', 'vendi', 'prospectei', 'atendi', 'resolvi', 'reduzi', 'aumentei', 'melhorei',
  'organizei', 'controlei', 'acompanhei', 'recrutei', 'selecionei', 'pesquisei', 'desenhei',
  'facilitei', 'priorizei', 'entreguei', 'conciliei', 'auditei', 'capacitei', 'treinei',
];

export const SENIORITY_ORDER = Object.freeze({
  estágio: 0,
  junior: 1,
  pleno: 2,
  senior: 3,
});
