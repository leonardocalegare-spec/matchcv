import React from 'react';

export default function ResultadoVaga({ analise, score }) {
  if (!analise || !score) return null;

  return (
    <div className="resultado-container">
      <div className="glass-panel score-panel">
        <div className="score-header">
          <div className="score-circle" aria-label={`${score.percentual}% de aderência`}>
            <span className="score-number">{score.percentual}%</span>
            <span className="score-label">Match</span>
          </div>
          <div className="score-info">
            <p className="eyebrow">Próxima decisão</p>
            <h3>{score.recomendacao}</h3>
            <p>{score.justificativa}</p>
          </div>
        </div>
      </div>

      <div className="glass-panel vaga-details">
        <h2>{analise.titulo} <span style={{fontWeight: 400, opacity: 0.8}}>na</span> {analise.empresa}</h2>
        <p className="nivel">Nível: {analise.nivel_experiencia}</p>

        <div className="requisitos-grid">
          <div className="req-block req-obrigatorio">
            <h3>Requisitos Obrigatórios</h3>
            <ul>
              {analise.requisitos_obrigatorios?.map((req, i) => (
                <li key={i}>{req}</li>
              ))}
            </ul>
          </div>

          <div className="req-block req-desejavel">
            <h3>Requisitos Desejáveis</h3>
            <ul>
              {analise.requisitos_desejaveis?.length > 0 ? (
                analise.requisitos_desejaveis.map((req, i) => (
                  <li key={i}>{req}</li>
                ))
              ) : (
                <li>Não listados</li>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
