import React, { useRef, useState } from 'react';
import { extrairTextoDePDF } from '../lib/pdfParser';

export default function CurriculoInput({ value, onChange }) {
  const fileInputRef = useRef(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Por favor, selecione um arquivo PDF.');
      return;
    }

    setIsExtracting(true);

    try {
      const textoExtraido = await extrairTextoDePDF(file);
      onChange(textoExtraido);
    } catch (error) {
      alert(error.message || 'Falha ao extrair o texto do PDF.');
    } finally {
      setIsExtracting(false);
      // Reseta o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = null;
    }
  };

  return (
    <div className="glass-panel">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
        <label htmlFor="curriculo" className="label" style={{ marginBottom: 0 }}>Seu Currículo Base</label>
        
        <div>
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            style={{ display: 'none' }}
            id="pdf-upload"
          />
          <button 
            type="button" 
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="btn-secondary"
          >
            {isExtracting ? 'Extraindo...' : 'Importar PDF'}
          </button>
        </div>
      </div>
      
      <textarea
        id="curriculo"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Cole todo o seu currículo atual aqui (texto, markdown, etc) ou importe de um PDF..."
      />
    </div>
  );
}
