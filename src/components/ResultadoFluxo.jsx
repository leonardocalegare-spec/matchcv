import React, { useEffect, useRef } from 'react';
import { CheckCircle2, MessagesSquare, RotateCcw } from 'lucide-react';
import AtsOverview from './AtsOverview';
import PrepEntrevista from './PrepEntrevista';

export default function ResultadoFluxo({ resultado, onNovaAnalise }) {
  const pageRef = useRef(null);

  useEffect(() => {
    pageRef.current?.focus();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="results-flow">
      <div className="results-topbar">
        <button onClick={onNovaAnalise} className="text-button" type="button">
          <RotateCcw size={15} /> Nova análise
        </button>
        <span className="analysis-complete"><CheckCircle2 size={15} /> Análise concluída</span>
      </div>

      <main className="results-content" ref={pageRef} tabIndex={-1} aria-labelledby="results-title">
        <header className="results-heading">
          <p className="eyebrow">Resultado personalizado</p>
          <h2 id="results-title">Seu currículo diante desta vaga</h2>
          <p>Veja como o currículo responde ao que a vaga pede e use as orientações para chegar mais preparado à entrevista.</p>
        </header>

        <AtsOverview resultado={resultado} />

        <section className="interview-section" aria-labelledby="interview-section-title">
          <div className="interview-section-heading">
            <span className="interview-section-icon" aria-hidden="true"><MessagesSquare size={22} /></span>
            <div>
              <p className="eyebrow">Próximo passo</p>
              <h2 id="interview-section-title">Prepare-se para a entrevista</h2>
              <p>Perguntas e pontos de atenção gerados a partir da comparação entre seu currículo e a vaga.</p>
            </div>
          </div>
          <PrepEntrevista prep={resultado.prep_entrevista} />
        </section>
      </main>

      <div className="results-footer">
        <p>Quer avaliar outra oportunidade?</p>
        <button type="button" className="btn-secondary" onClick={onNovaAnalise}>
          <RotateCcw size={16} /> Fazer nova análise
        </button>
      </div>
    </div>
  );
}
