import React, { useState } from 'react';
import { Clipboard, Copy, PenLine } from 'lucide-react';

const styles = {
  impacto: { label: 'Orientado a impacto', description: 'Destaca resultado e valor gerado.' },
  tecnico: { label: 'Técnico', description: 'Destaca a decisão e a execução.' },
  direto: { label: 'Direto', description: 'Prioriza clareza para leitura rápida.' },
};

export default function ReescritasCurriculo({ sugestoes }) {
  const [style, setStyle] = useState('impacto');
  const [copiedIndex, setCopiedIndex] = useState(null);

  if (!sugestoes?.length) return null;

  async function handleCopy(text, index) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      window.setTimeout(() => setCopiedIndex(null), 1800);
    } catch {
      setCopiedIndex(null);
    }
  }

  return (
    <section className="glass-panel reescritas" aria-labelledby="reescritas-title">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><PenLine size={15} /> Assistente de escrita</span>
          <h3 id="reescritas-title">Transforme evidências em bullets mais fortes</h3>
        </div>
      </div>

      <div className="writing-style-tabs" role="tablist" aria-label="Estilo de escrita">
        {Object.entries(styles).map(([key, item]) => (
          <button
            key={key}
            type="button"
            className={`writing-style-tab ${style === key ? 'is-active' : ''}`}
            onClick={() => setStyle(key)}
            role="tab"
            aria-selected={style === key}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="writing-style-description">{styles[style].description} Complete os trechos entre colchetes somente com fatos reais.</p>

      <div className="rewrite-list">
        {sugestoes.map((suggestion, index) => (
          <article className="rewrite-card" key={`${suggestion.skill}-${index}`}>
            <span className="rewrite-skill">{suggestion.skill}</span>
            <p className="rewrite-original"><Clipboard size={15} /> Evidência encontrada: “{suggestion.original}”</p>
            <div className="rewrite-suggestion">
              <p>{suggestion[style]}</p>
              <button type="button" className="copy-button" onClick={() => handleCopy(suggestion[style], index)}>
                <Copy size={15} /> {copiedIndex === index ? 'Copiado' : 'Copiar modelo'}
              </button>
            </div>
            <p className="rewrite-guidance">{suggestion.orientacao}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
