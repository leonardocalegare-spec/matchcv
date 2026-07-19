import React from 'react';
import { AlertTriangle, Lightbulb, MessageCircleQuestion } from 'lucide-react';

export default function PrepEntrevista({ prep }) {
  if (!prep) return null;

  const questions = prep.perguntas_esperadas || [];
  const attentionPoints = prep.gaps_potenciais || [];

  return (
    <div className="prep-entrevista">
      {questions.length > 0 ? (
        <div className="perguntas-list">
          {questions.map((item, index) => (
            <article key={`${item.pergunta}-${index}`} className="pergunta-block">
              <div className="question-heading">
                <span className="question-number" aria-hidden="true">{index + 1}</span>
                <div>
                  <span className="question-label"><MessageCircleQuestion size={14} /> Pergunta provável</span>
                  <h3 className="pergunta">{item.pergunta}</h3>
                </div>
              </div>
              <div className="answer-guidance">
                <span><Lightbulb size={16} /> Como se preparar</span>
                <p className="dica-resposta">{item.dica_resposta}</p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="interview-empty">
          Não foi possível identificar perguntas específicas com segurança nesta análise.
        </div>
      )}

      {attentionPoints.length > 0 && (
        <section className="gaps-section" aria-labelledby="attention-title">
          <div className="attention-heading">
            <AlertTriangle size={19} />
            <div>
              <h3 id="attention-title">Pontos para preparar com antecedência</h3>
              <p>Use exemplos reais da sua trajetória e não afirme experiências que você ainda não possui.</p>
            </div>
          </div>
          <ul className="gaps-list">
            {attentionPoints.map((point, index) => <li key={`${point}-${index}`}>{point}</li>)}
          </ul>
        </section>
      )}
    </div>
  );
}
