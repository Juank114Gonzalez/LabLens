'use client';

import { ArrowLeft, Check } from 'lucide-react';
import { Logo } from '@/shared/components/logo';
import { AchLogo } from '@/shared/components/ach-logo';
import { routes } from '@/config/routes';
import { cn } from '@/lib/utils';

export const WIZARD_STEPS = ['Quién', 'Solicitud', 'Compuerta', 'Evidencias'] as const;

export const TOTAL_STEPS = WIZARD_STEPS.length;

type Props = {
  /** 1-indexado, para que coincida con el "Paso N de 4" que ve el usuario. */
  step: number;
  title: string;
  onBack: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
};

export function SubmitWizardShell({ step, title, onBack, children, footer }: Props) {
  return (
    <div className="relative min-h-svh">
      <div className="lab-grid pointer-events-none fixed inset-0 opacity-30" />

      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-5 py-3">
          <button
            type="button"
            onClick={onBack}
            aria-label={step === 1 ? 'Volver al inicio' : 'Volver al paso anterior'}
            className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-4" />
          </button>
          <Logo href={routes.home} stacked subtitle="Envía tu iniciativa" />
          <AchLogo className="ml-auto h-7 sm:h-8" />
        </div>

        <div className="mx-auto w-full max-w-2xl px-5 pb-4">
          <Stepper current={step} />
        </div>
      </header>

      <main className="relative mx-auto w-full max-w-2xl px-5 pb-40 pt-7">
        <div className="mb-6 space-y-1">
          <h1 className="font-heading text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="text-sm text-muted-foreground">
            Paso {step} de {TOTAL_STEPS}
          </p>
        </div>
        {children}
      </main>

      {footer ? (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-background/90 backdrop-blur-xl">
          <div className="mx-auto w-full max-w-2xl px-5 py-3">{footer}</div>
        </div>
      ) : null}
    </div>
  );
}

function Stepper({ current }: { current: number }) {
  return (
    <ol className="flex items-start" aria-label="Progreso del formulario">
      {WIZARD_STEPS.map((label, index) => {
        const stepNumber = index + 1;
        const isDone = stepNumber < current;
        const isCurrent = stepNumber === current;

        return (
          <li
            key={label}
            className={cn('flex flex-col items-center', index > 0 && 'flex-1')}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <div className={cn('flex items-center', index > 0 && 'w-full')}>
              {index > 0 ? (
                <span
                  aria-hidden
                  className={cn(
                    'h-px flex-1 transition-colors',
                    isDone || isCurrent ? 'bg-primary/70' : 'bg-border',
                  )}
                />
              ) : null}
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors',
                  isCurrent && 'border-primary bg-primary text-primary-foreground',
                  // El estado "hecho" pesa más que el pendiente: en un wizard de
                  // 4 pasos el avance es la información principal.
                  isDone && 'border-primary/70 bg-primary/20 text-lab',
                  !isCurrent && !isDone && 'border-border bg-card text-muted-foreground',
                )}
              >
                {isDone ? <Check className="size-4" /> : stepNumber}
              </span>
            </div>
            <span
              className={cn(
                'mt-1.5 text-[11px] font-medium transition-colors',
                isCurrent ? 'text-lab' : 'text-muted-foreground',
              )}
            >
              {label}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
