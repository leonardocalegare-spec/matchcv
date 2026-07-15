import React from 'react';
import ReescritasCurriculo from './ReescritasCurriculo';

export default function CurriculoOtimizado({ curriculo }) {
  if (!curriculo) return null;

  return (
    <div className="glass-panel curriculo-otimizado">
      <h3>Currículo otimizado pra essa vaga</h3>

      <section className="curriculo-section">
        <h4>Resumo sugerido</h4>
        <p className="resumo-executivo">{curriculo.resumo_executivo}</p>
      </section>

      {curriculo.bullets_sugeridos?.length > 0 && (
        <section className="curriculo-section">
          <h4>Bullets prontos para adaptar</h4>
          <ul className="experiencias-list">
            {curriculo.bullets_sugeridos.map((bullet, i) => (
              <li key={i}>{bullet}</li>
            ))}
          </ul>
        </section>
      )}

      <ReescritasCurriculo sugestoes={curriculo.reescritas_sugeridas} />

      {curriculo.experiencias_relevantes?.length > 0 && (
        <section className="curriculo-section">
          <h4>Evidências encontradas no currículo</h4>
          <ul className="experiencias-list">
            {curriculo.experiencias_relevantes.map((exp, i) => (
              <li key={i}>{exp}</li>
            ))}
          </ul>
        </section>
      )}

      {curriculo.acoes_prioritarias?.length > 0 && (
        <section className="curriculo-section">
          <h4>Ações prioritárias</h4>
          <ul className="experiencias-list">
            {curriculo.acoes_prioritarias.map((acao, i) => (
              <li key={i}>{acao}</li>
            ))}
          </ul>
        </section>
      )}

      {curriculo.skills_destacar?.length > 0 && (
        <section className="curriculo-section">
          <h4>Skills para destacar</h4>
          <div className="skills-tags">
            {curriculo.skills_destacar.map((s, i) => (
              <span key={i} className="skill-tag">{s}</span>
            ))}
          </div>
        </section>
      )}

      {curriculo.alertas_honestidade?.length > 0 && (
        <section className="curriculo-section honesty-box">
          <h4>Não inventar</h4>
          <ul className="experiencias-list">
            {curriculo.alertas_honestidade.map((alerta, i) => (
              <li key={i}>{alerta}</li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
