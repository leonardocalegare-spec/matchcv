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
      <p className="input-hint">{value.trim().length > 0 ? `${value.trim().length} caracteres da vaga` : 'Inclua requisitos, responsabilidades e senioridade para uma leitura melhor.'}</p>
    </div>
  );
}
