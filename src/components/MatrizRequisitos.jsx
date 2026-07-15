import React from 'react';
import { CheckCircle2, CircleAlert, CircleDashed, ListChecks } from 'lucide-react';

const statusConfig = {
  comprovado: { label: 'Comprovado', icon: CheckCircle2 },
  parcial: { label: 'Evidência parcial', icon: CircleDashed },
  ausente: { label: 'Sem evidência', icon: CircleAlert },
};

export default function MatrizRequisitos({ analise }) {
  if (!analise?.requisitos?.length) return null;

  return (
    <section className="glass-panel matriz-requisitos" aria-labelledby="matriz-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><ListChecks size={15} /> Mapa de requisitos</span>
          <h3 id="matriz-title">O que a vaga pede e o currículo prova</h3>
        </div>
        <div className="matrix-summary" aria-label="Resumo da aderência">
          <span className="summary-confirmed">{analise.resumo.comprovados} comprovados</span>
          <span>{analise.resumo.parciais} parciais</span>
          <span className="summary-missing">{analise.resumo.ausentes} sem evidência</span>
        </div>
      </div>

      <div className="requirements-list">
        {analise.requisitos.map((requirement) => {
          const config = statusConfig[requirement.status] ?? statusConfig.ausente;
          const Icon = config.icon;

          return (
            <article className={`requirement-row requirement-${requirement.status}`} key={`${requirement.category}-${requirement.skill}`}>
              <div className="requirement-status"><Icon size={19} aria-hidden="true" /></div>
              <div className="requirement-main">
                <div className="requirement-title">
                  <h4>{requirement.skill}</h4>
                  <span className={`requirement-category category-${requirement.category}`}>{requirement.category}</span>
                </div>
                <p className="requirement-evidence">
                  {requirement.evidence ? `No currículo: “${requirement.evidence}”` : 'Não foi encontrada uma evidência textual no currículo.'}
                </p>
                <p className="requirement-action">{requirement.recommendation}</p>
              </div>
              <span className={`requirement-badge badge-${requirement.status}`}>{config.label}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
