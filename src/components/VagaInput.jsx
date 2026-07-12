import React from 'react';

export default function VagaInput({ value, onChange }) {
  return (
    <div className="glass-panel">
      <label htmlFor="vaga" className="label">Descrição da Vaga</label>
      <textarea
        id="vaga"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cole a descrição completa da vaga que você quer analisar..."
      />
    </div>
  );
}
