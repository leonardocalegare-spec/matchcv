import React, { useState, useEffect } from 'react';
import { Briefcase, Send, Loader2 } from 'lucide-react';
import CurriculoInput from './components/CurriculoInput';
import VagaInput from './components/VagaInput';
import ResultadoVaga from './components/ResultadoVaga';
import CurriculoOtimizado from './components/CurriculoOtimizado';
import PrepEntrevista from './components/PrepEntrevista';
import DiagnosticoAderencia from './components/DiagnosticoAderencia';
import MatrizRequisitos from './components/MatrizRequisitos';
import { analisarVaga } from './lib/analysisApi';

const CURRICULO_STORAGE_KEY = 'matchcv_curriculo_base';

export default function App() {
  const [curriculo, setCurriculo] = useState('');
  const [vaga, setVaga] = useState('');
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);

  useEffect(() => {
    const salvo = localStorage.getItem(CURRICULO_STORAGE_KEY);
    if (salvo) setCurriculo(salvo);
  }, []);

  useEffect(() => {
    if (curriculo) {
      localStorage.setItem(CURRICULO_STORAGE_KEY, curriculo);
    } else {
      localStorage.removeItem(CURRICULO_STORAGE_KEY);
    }
  }, [curriculo]);

  async function handleAnalisar() {
    if (!curriculo.trim() || !vaga.trim()) {
      setErro('Preencha o currículo base e a descrição da vaga antes de analisar.');
      return;
    }

    setErro(null);
    setLoading(true);
    setResultado(null);

    try {
      const analise = await analisarVaga(curriculo, vaga);
      setResultado(analise);
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao analisar a vaga. Tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="logo-icon">
          <Briefcase size={20} />
        </div>
        <div>
          <h1>MatchCV</h1>
          <p className="subtitle">currículo sob medida pra cada vaga</p>
        </div>
      </header>

      <div className="inputs-grid">
        <CurriculoInput value={curriculo} onChange={setCurriculo} />
        <VagaInput value={vaga} onChange={setVaga} />
      </div>

      {erro && <div className="erro-banner" role="alert">{erro}</div>}

      <button
        onClick={handleAnalisar}
        disabled={loading}
        className="btn-analisar"
        type="button"
      >
        {loading ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
        {loading ? 'Analisando...' : 'Analisar vaga'}
      </button>

      {resultado && (
        <div className="resultado-wrapper" aria-live="polite">
          {resultado.provider_notice && (
            <div className="info-banner">{resultado.provider_notice}</div>
          )}
          <ResultadoVaga analise={resultado.vaga_analise} score={resultado.match_score} />
          <DiagnosticoAderencia meta={resultado.meta} score={resultado.match_score} />
          <MatrizRequisitos analise={resultado.analise_aderencia} />
          <CurriculoOtimizado curriculo={resultado.curriculo_otimizado} />
          <PrepEntrevista prep={resultado.prep_entrevista} />
        </div>
      )}

      <footer className="signature">
        <span>noumena labs</span>
        <span>leonardo henrique</span>
      </footer>
    </div>
  );
}
