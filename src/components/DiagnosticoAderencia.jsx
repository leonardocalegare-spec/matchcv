import React from 'react';
import { BarChart3, CheckCircle2, CircleAlert, SearchCheck } from 'lucide-react';

const confidenceLabel = {
  alta: 'Alta',
  'média': 'Média',
  baixa: 'Baixa',
};

function Metric({ label, value, detail }) {
  return (
    <div className="metric-card">
      <span className="metric-value">{value}</span>
      <span className="metric-label">{label}</span>
      {detail && <span className="metric-detail">{detail}</span>}
    </div>
  );
}

export default function DiagnosticoAderencia({ meta, score }) {
  if (!meta || !score) return null;

  const skillsEmComum = meta.skills_em_comum ?? [];
  const skillsAusentes = meta.skills_ausentes ?? [];
  const detalhamento = score.detalhamento ?? {};

  return (
    <section className="glass-panel diagnostico" aria-labelledby="diagnostico-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><BarChart3 size={15} /> Diagnóstico</span>
          <h3 id="diagnostico-title">Leitura da aderência</h3>
        </div>
        <span className={`confidence confidence-${meta.confianca_analise ?? 'baixa'}`}>
          Confiança {confidenceLabel[meta.confianca_analise] ?? 'Baixa'}
        </span>
      </div>

      <div className="metrics-grid">
        <Metric label="Cobertura de skills" value={`${detalhamento.cobertura_skills ?? 0}%`} detail="requisitos identificados" />
        <Metric label="Requisitos obrigatórios" value={`${detalhamento.cobertura_obrigatorios ?? 0}%`} detail="cobertura ponderada" />
        <Metric label="Aderência de senioridade" value={`${detalhamento.adequacao_senioridade ?? 0}%`} detail="sinal da vaga" />
      </div>

      <div className="diagnostico-grid">
        <div className="skills-column positive-column">
          <h4><CheckCircle2 size={17} /> Pontos já comprovados</h4>
          {skillsEmComum.length > 0 ? (
            <div className="skills-tags">
              {skillsEmComum.map((skill) => <span key={skill} className="skill-tag skill-tag-positive">{skill}</span>)}
            </div>
          ) : <p className="empty-state">Nenhuma skill em comum foi identificada com segurança.</p>}
        </div>
        <div className="skills-column gap-column">
          <h4><CircleAlert size={17} /> Lacunas a investigar</h4>
          {skillsAusentes.length > 0 ? (
            <div className="skills-tags">
              {skillsAusentes.map((skill) => <span key={skill} className="skill-tag skill-tag-gap">{skill}</span>)}
            </div>
          ) : <p className="empty-state">Não há lacunas técnicas explícitas entre as skills detectadas.</p>}
        </div>
      </div>

      <p className="analysis-note"><SearchCheck size={16} /> Indicadores calculados localmente a partir de skills, evidências textuais e senioridade citadas na vaga.</p>
    </section>
  );
}
