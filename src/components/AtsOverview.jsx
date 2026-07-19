import React from 'react';
import { AlertTriangle, BrainCircuit, CheckCircle2, FileSearch, Gauge, ShieldCheck } from 'lucide-react';

const confidenceLabel = { alta: 'Alta', 'média': 'Média', baixa: 'Baixa' };
const requirementStatusLabel = { comprovado: 'Há evidência', parcial: 'Precisa ficar mais claro', ausente: 'Não aparece no currículo' };

function ScoreCard({ icon: Icon, label, value, detail }) {
  return (
    <div className="ats-score-card">
      <span className="ats-score-icon"><Icon size={19} /></span>
      <div><span>{label}</span><strong>{value}%</strong><small>{detail}</small></div>
    </div>
  );
}

export default function AtsOverview({ resultado }) {
  const ats = resultado?.ats_analysis;
  if (!ats) return null;
  const document = ats.document_readability || {};
  const semanticAvailable = resultado.semantic_analysis?.status === 'completed';
  const priorities = resultado.curriculo_otimizado?.acoes_prioritarias?.slice(0, 3) || [];
  const requirements = resultado.analise_aderencia?.requisitos?.slice(0, 6) || [];

  return (
    <div className="ats-overview">
      <section className="glass-panel ats-hero" aria-labelledby="ats-title">
        <div className="ats-hero-copy">
          <span className="eyebrow"><Gauge size={15} /> Análise ATS v{resultado.analysis_version}</span>
          <h3 id="ats-title">{ats.label}</h3>
          <p>{ats.disclaimer}</p>
          <div className="ats-trust-row">
            <span><ShieldCheck size={15} /> Confiança {confidenceLabel[ats.confidence] || 'Baixa'}</span>
            <span><BrainCircuit size={15} /> {semanticAvailable ? 'Leitura por contexto disponível' : 'Comparação direta disponível'}</span>
          </div>
        </div>
        <div className="ats-main-score" aria-label={`${ats.overall_score}% de compatibilidade ATS estimada`}>
          <strong>{ats.overall_score}%</strong>
          <span>estimativa ATS</span>
        </div>
      </section>

      <div className="ats-score-grid">
        <ScoreCard icon={FileSearch} label="Leitura do arquivo" value={document.score || 0} detail="estrutura e extração" />
        <ScoreCard icon={BrainCircuit} label="Aderência à vaga" value={ats.job_match_score || 0} detail="requisitos e evidências" />
      </div>

      <section className="glass-panel ats-breakdown">
        <div className="section-heading compact-heading"><div><p className="eyebrow">Como calculamos</p><h3>Composição da estimativa</h3></div></div>
        <div className="ats-factors">
          {ats.factors.map((factor) => (
            <div className="ats-factor" key={factor.key}>
              <div><span>{factor.label}</span><small>peso {factor.weight}%</small><strong>{factor.score}%</strong></div>
              <span className="metric-track" aria-hidden="true"><span style={{ width: `${factor.score}%` }} /></span>
            </div>
          ))}
        </div>
      </section>

      {requirements.length > 0 && (
        <section className="glass-panel evidence-review" aria-labelledby="evidence-review-title">
          <div className="section-heading compact-heading">
            <div>
              <p className="eyebrow">O que encontramos</p>
              <h3 id="evidence-review-title">Requisitos e sinais no seu currículo</h3>
              <p className="section-intro">Cada item mostra o que a vaga pede, o trecho encontrado e o que vale ajustar. Uma sugestão por contexto nunca é tratada como experiência comprovada.</p>
            </div>
          </div>
          <div className="evidence-review-list">
            {requirements.map((requirement) => (
              <article className={`evidence-review-item is-${requirement.status}`} key={requirement.id || `${requirement.category}-${requirement.skill}`}>
                <div className="evidence-review-heading">
                  <strong>{requirement.skill}</strong>
                  <span>{requirementStatusLabel[requirement.status] || 'Revisar'}</span>
                </div>
                {requirement.evidence && <p><b>No currículo:</b> “{requirement.evidence}”</p>}
                {!requirement.evidence && requirement.semantic_evidence && <p><b>Trecho parecido para você conferir:</b> “{requirement.semantic_evidence}”</p>}
                <p className="evidence-review-action">{requirement.recommendation}</p>
              </article>
            ))}
          </div>
        </section>
      )}

      <div className="ats-summary-grid">
        <section className="glass-panel">
          <div className="section-heading compact-heading"><div><p className="eyebrow">Leitura técnica</p><h3>Seu documento</h3></div></div>
          <ul className="ats-check-list">
            <li className={document.searchable ? 'is-ok' : 'is-warning'}>{document.searchable ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />} Texto pesquisável</li>
            <li className={document.has_contact ? 'is-ok' : 'is-warning'}>{document.has_contact ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />} Contato identificável</li>
            <li className={!document.possible_columns ? 'is-ok' : 'is-warning'}>{!document.possible_columns ? <CheckCircle2 size={17} /> : <AlertTriangle size={17} />} Ordem de leitura</li>
          </ul>
          {document.warnings?.length > 0 && <div className="ats-warnings">{document.warnings.map((warning) => <p key={warning}><AlertTriangle size={15} /> {warning}</p>)}</div>}
        </section>

        <section className="glass-panel">
          <div className="section-heading compact-heading"><div><p className="eyebrow">Maior impacto</p><h3>Comece por aqui</h3></div></div>
          <ol className="ats-priorities">{priorities.map((priority) => <li key={priority}>{priority}</li>)}</ol>
        </section>
      </div>
    </div>
  );
}
