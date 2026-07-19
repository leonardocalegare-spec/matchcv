import React, { useRef, useState } from 'react';
import { extrairDocumentoDePDF } from '../lib/pdfParser';

export default function CurriculoInput({
  value,
  onChange,
  salvarCurriculo,
  onSalvarCurriculoChange,
  consentimentoAnalise,
  onConsentimentoChange,
}) {
  const fileInputRef = useRef(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Por favor, selecione um arquivo PDF.');
      return;
    }

    setUploadError('');
    setIsExtracting(true);

    try {
      const documento = await extrairDocumentoDePDF(file);
      onChange(documento.text, documento.diagnostics);
    } catch (error) {
      setUploadError(error.message || 'Falha ao extrair o texto do PDF.');
    } finally {
      setIsExtracting(false);
      // Reseta o input para permitir selecionar o mesmo arquivo novamente
      e.target.value = null;
    }
  };

  return (
    <div className="glass-panel">
      <div className="input-heading-row">
        <label htmlFor="curriculo" className="label input-heading-label">Seu Currículo Base</label>
        
        <div>
          <input 
            type="file" 
            accept=".pdf" 
            ref={fileInputRef} 
            onChange={handleFileUpload}
            className="visually-hidden"
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
      <p className="input-hint">{value.trim().length > 0 ? `${value.trim().length} caracteres prontos para analisar` : 'Inclua experiências, projetos, formação e resultados.'}</p>
      {uploadError && <p className="inline-error" role="alert">{uploadError}</p>}
      <label className="privacy-option">
        <input
          type="checkbox"
          checked={salvarCurriculo}
          onChange={(event) => onSalvarCurriculoChange(event.target.checked)}
        />
        Salvar este currículo somente neste navegador
      </label>
      <div className="privacy-consent">
        <label className="privacy-option">
          <input
            type="checkbox"
            checked={consentimentoAnalise}
            onChange={(event) => onConsentimentoChange(event.target.checked)}
          />
          Autorizo o processamento temporário do texto para gerar esta análise
        </label>
        <details>
          <summary>Como seus dados são usados</summary>
          <p>O PDF e a comparação semântica são processados no navegador. O texto é enviado à API da aplicação apenas durante a análise determinística e não é salvo em banco de dados. Informações públicas da empresa só são consultadas quando você autoriza na próxima etapa.</p>
        </details>
      </div>
    </div>
  );
}
