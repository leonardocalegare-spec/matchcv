import React from 'react';

export default function VagaInput({ value, onChange, empresaManual, setEmpresaManual, usarContextoPublico, setUsarContextoPublico }) {
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

      <div className="company-input-group">
        <label htmlFor="empresaManual" className="label">Nome da Empresa (opcional)</label>
        <input
          id="empresaManual"
          type="text"
          value={empresaManual}
          onChange={(e) => setEmpresaManual(e.target.value)}
          placeholder="Ex: Nubank, Itaú..."
        />
        <p className="input-hint">Preencha caso a detecção automática falhe.</p>
        <label className="privacy-option">
          <input
            type="checkbox"
            checked={usarContextoPublico}
            onChange={(event) => setUsarContextoPublico(event.target.checked)}
          />
          Buscar automaticamente informações públicas sobre a empresa
        </label>
        <p className="input-hint">A busca usa apenas o nome da empresa. Seu currículo não é enviado aos provedores de pesquisa.</p>
      </div>
    </div>
  );
}
