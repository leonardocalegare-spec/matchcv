import React, { useState, useEffect, useRef } from 'react';
import { Briefcase, Send, Loader2, ChevronRight } from 'lucide-react';
import CurriculoInput from './components/CurriculoInput';
import VagaInput from './components/VagaInput';
import StepIndicator from './components/StepIndicator';
import ResultadoFluxo from './components/ResultadoFluxo';
import { analisarVaga } from './lib/analysisApi';
import { analyzePlainTextDocument } from './lib/ats/documentDiagnostics';
import WelcomeScreen from './components/WelcomeScreen';

const CURRICULO_STORAGE_KEY = 'vagaclara_curriculo_base';
const SALVAR_CURRICULO_KEY = 'vagaclara_salvar_curriculo';
const LEGACY_CURRICULO_STORAGE_KEY = 'matchcv_curriculo_base';
const LEGACY_SALVAR_CURRICULO_KEY = 'matchcv_salvar_curriculo';

export default function App() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [step, setStep] = useState(1); // 1: Currículo, 2: Vaga, 3: Resultados
  const [curriculo, setCurriculo] = useState('');
  const [vaga, setVaga] = useState('');
  const [salvarCurriculo, setSalvarCurriculo] = useState(false);
  const [consentimentoAnalise, setConsentimentoAnalise] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erro, setErro] = useState(null);
  const [analysisProgress, setAnalysisProgress] = useState('');
  const [documentAnalysis, setDocumentAnalysis] = useState(() => analyzePlainTextDocument(''));
  const resultRef = useRef(null);

  useEffect(() => {
    if (step === 3 && resultado) resultRef.current?.focus();
  }, [step, resultado]);

  useEffect(() => {
    const permitirSalvar = localStorage.getItem(SALVAR_CURRICULO_KEY) === 'true' || localStorage.getItem(LEGACY_SALVAR_CURRICULO_KEY) === 'true';
    setSalvarCurriculo(permitirSalvar);
    if (permitirSalvar) {
      const salvo = localStorage.getItem(CURRICULO_STORAGE_KEY) || localStorage.getItem(LEGACY_CURRICULO_STORAGE_KEY);
      if (salvo) setCurriculo(salvo);
    }
    localStorage.removeItem(LEGACY_CURRICULO_STORAGE_KEY);
    localStorage.removeItem(LEGACY_SALVAR_CURRICULO_KEY);
  }, []);

  useEffect(() => {
    localStorage.setItem(SALVAR_CURRICULO_KEY, String(salvarCurriculo));
    if (salvarCurriculo && curriculo) {
      localStorage.setItem(CURRICULO_STORAGE_KEY, curriculo);
    } else {
      localStorage.removeItem(CURRICULO_STORAGE_KEY);
    }
  }, [curriculo, salvarCurriculo]);

  function handleProximoPasso() {
    if (!curriculo.trim()) {
      setErro('Preencha o currículo antes de continuar.');
      return;
    }
    if (!consentimentoAnalise) {
      setErro('Confirme o processamento temporário do currículo para continuar.');
      return;
    }
    setErro(null);
    setStep(2);
  }

  function handleCurriculoChange(nextValue, nextDocumentAnalysis = null) {
    setCurriculo(nextValue);
    setDocumentAnalysis(nextDocumentAnalysis || analyzePlainTextDocument(nextValue));
  }

  async function handleAnalisar() {
    if (!curriculo.trim() || !vaga.trim()) {
      setErro('Preencha o currículo base e a descrição da vaga antes de analisar.');
      return;
    }

    setErro(null);
    setLoading(true);
    setResultado(null);
    setAnalysisProgress('Lendo currículo e requisitos...');

    try {
      const analise = await analisarVaga(
        curriculo,
        vaga,
        documentAnalysis,
        setAnalysisProgress,
      );
      setResultado(analise);
      setStep(3);
    } catch (err) {
      console.error(err);
      setErro(err.message || 'Erro ao analisar a vaga. Tente novamente.');
    } finally {
      setLoading(false);
      setAnalysisProgress('');
    }
  }

  function handleVoltar() {
    if (step > 1) {
      setStep(step - 1);
      setResultado(null);
      setErro(null);
    }
  }

  if (showWelcome) return <WelcomeScreen onContinue={() => setShowWelcome(false)} />;

  return (
    <div className="app-container app-enter">
      <header className="app-header">
        <div className="app-brand">
          <div className="logo-icon">
            <Briefcase size={20} />
          </div>
          <div>
            <h1>Vaga Clara</h1>
            <p className="subtitle">clareza para adaptar e se preparar</p>
          </div>
        </div>
        <span className="privacy-chip">Privado por padrão</span>
      </header>

      {/* Indicador de passos */}
      {step < 3 && <StepIndicator currentStep={step} />}

      {/* Passo 1: Currículo */}
      {step >= 1 && (
        <div className={`step-container ${step === 1 ? 'step-active' : 'step-hidden'}`}>
          <CurriculoInput
            value={curriculo}
            onChange={handleCurriculoChange}
            salvarCurriculo={salvarCurriculo}
            onSalvarCurriculoChange={setSalvarCurriculo}
            consentimentoAnalise={consentimentoAnalise}
            onConsentimentoChange={setConsentimentoAnalise}
          />
          {curriculo.trim().length === 0 && (
            <p className="step-hint">⬆️ Cole seu currículo ou importe um PDF para começar</p>
          )}

          {erro && step === 1 && <div className="erro-banner" role="alert">{erro}</div>}

          {curriculo.trim().length > 0 && (
            <div className="step-actions">
              <button
                onClick={handleProximoPasso}
                className="btn-analisar"
                type="button"
              >
                Próximo <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Passo 2: Vaga */}
      {step >= 2 && (
        <div className={`step-container ${step === 2 ? 'step-active' : 'step-hidden'}`}>
          <VagaInput value={vaga} onChange={setVaga} />
          {vaga.trim().length === 0 && (
            <p className="step-hint">⬆️ Cole a descrição da vaga</p>
          )}

          {erro && step === 2 && <div className="erro-banner" role="alert">{erro}</div>}

          <div className="step-actions">
            <button
              onClick={handleVoltar}
              className="btn-secondary"
              type="button"
            >
              ← Voltar
            </button>
            <button
              onClick={handleAnalisar}
              disabled={loading || !vaga.trim()}
              className="btn-analisar"
              type="button"
            >
              {loading ? <Loader2 className="spin" size={16} /> : <Send size={16} />}
              {loading ? 'Analisando...' : 'Analisar vaga'}
            </button>
          </div>
          {loading && analysisProgress && <p className="analysis-progress" role="status">{analysisProgress}</p>}
        </div>
      )}

      {/* Passo 3: Resultados */}
      {resultado && step === 3 && (
        <div className="step-container step-active">
          <div className="resultado-wrapper" aria-live="polite" ref={resultRef} tabIndex={-1}>
            <ResultadoFluxo resultado={resultado} onNovaAnalise={handleVoltar} />
          </div>
        </div>
      )}

      <footer className="signature">
        <span>noumena labs</span>
        <span>leonardo henrique</span>
      </footer>
    </div>
  );
}
