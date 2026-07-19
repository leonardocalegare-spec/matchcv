import React from 'react';
import { FileText, Briefcase, CheckCircle2 } from 'lucide-react';

export default function StepIndicator({ currentStep }) {
  const steps = [
    { number: 1, label: 'Currículo', icon: FileText },
    { number: 2, label: 'Vaga', icon: Briefcase },
  ];

  return (
    <nav className="step-indicator" aria-label="Etapas da análise">
      {steps.map((step, index) => {
        const Icon = step.icon;
        const isActive = step.number === currentStep;
        const isCompleted = step.number < currentStep;

        return (
          <React.Fragment key={step.number}>
            <div
              className={`step-item ${isActive ? 'step-item-active' : ''} ${isCompleted ? 'step-item-completed' : ''}`}
              aria-current={isActive ? 'step' : undefined}
            >
              <div className="step-badge">
                {isCompleted ? (
                  <CheckCircle2 size={20} />
                ) : (
                  <Icon size={20} />
                )}
              </div>
              <span className="step-label">{step.label}</span>
            </div>

            {index < steps.length - 1 && (
              <div className={`step-line ${isCompleted ? 'step-line-completed' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
