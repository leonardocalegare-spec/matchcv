import React from 'react';

export default function PrepEntrevista({ prep }) {
  if (!prep) return null;

  return (
    <div className="glass-panel prep-entrevista">
      <h3>Dicas para a entrevista</h3>

      <div className="perguntas-list">
        {prep.perguntas_esperadas?.map((p, i) => (
          <div key={i} className="pergunta-block">
            <p className="pergunta">{p.pergunta}</p>
            <p className="dica-resposta">{p.dica_resposta}</p>
          </div>
        ))}
      </div>

      {prep.gaps_potenciais?.length > 0 && (
        <div className="gaps-section">
          <h4>Pontos de atenção</h4>
          <ul className="gaps-list">
            {prep.gaps_potenciais.map((g, i) => (
              <li key={i}>{g}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
