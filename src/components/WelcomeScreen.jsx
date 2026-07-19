import React from 'react';
import { ArrowRight, BriefcaseBusiness, FileSearch, ListChecks, Sparkles } from 'lucide-react';

export default function WelcomeScreen({ onContinue }) {
  return (
    <main className="welcome-shell">
      <div className="welcome-orb welcome-orb-one" />
      <div className="welcome-orb welcome-orb-two" />
      <section className="welcome-card">
        <div className="welcome-logo"><BriefcaseBusiness size={24} /></div>
        <span className="welcome-kicker"><Sparkles size={15} /> Sua candidatura começa com clareza</span>
        <h1>Bem-vindo ao Vaga Clara.</h1>
        <p>Compare seu currículo com a vaga, descubra como ele pode ser lido por sistemas ATS e receba um plano baseado em evidências reais.</p>

        <div className="welcome-steps">
          <div><FileSearch size={19} /><span><strong>Entenda</strong> o que a vaga realmente pede</span></div>
          <div><ListChecks size={19} /><span><strong>Priorize</strong> as evidências mais relevantes</span></div>
          <div><BriefcaseBusiness size={19} /><span><strong>Prepare-se</strong> para conversar com confiança</span></div>
        </div>

        <button type="button" className="welcome-cta" onClick={onContinue}>
          Começar minha análise <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
