'use client';

import { CheckCircle2, Clock, FlaskConical, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PublicSubmissionResult } from '@/features/submit/types';

const CLASSIFICATION_TONES: Record<string, string> = {
  'Innovación disruptiva': 'bg-primary/15 text-primary',
  'Innovación adyacente': 'bg-signal/20 text-signal',
  'Mejora incremental': 'bg-chart-2/20 text-chart-2',
  'Mejora de procesos': 'bg-chart-4/20 text-chart-4',
  'Solicitud operativa': 'bg-muted text-muted-foreground',
};

type Props = {
  result: PublicSubmissionResult;
  onSubmitAnother: () => void;
};

export function TriageResultScreen({ result, onSubmitAnother }: Props) {
  const { triage } = result;

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-3">
        <CheckCircle2 className="mt-0.5 size-6 shrink-0 text-primary" />
        <div>
          <h1 className="font-heading text-2xl font-semibold">Iniciativa recibida</h1>
          <p className="text-sm text-muted-foreground">{result.initiative.nombre}</p>
        </div>
      </div>

      {triage ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="secondary"
                className={cn(
                  'rounded-full border-0 px-3 py-1 text-xs font-medium',
                  CLASSIFICATION_TONES[triage.classification.nombre] ?? 'bg-accent',
                )}
              >
                {triage.classification.nombre}
              </Badge>
              <span className="text-xs text-muted-foreground">
                Confianza del análisis: {Math.round(triage.confidence * 100)}%
              </span>
            </div>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              {triage.isLabScope ? (
                <FlaskConical className="size-4 text-primary" />
              ) : (
                <Route className="size-4 text-muted-foreground" />
              )}
              {triage.isLabScope
                ? 'Se queda en el Laboratorio Digital'
                : `Enrutada a ${triage.workTable.nombre}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p>
              {triage.isLabScope
                ? 'Tu iniciativa fue recibida por el Laboratorio Digital y será evaluada por el equipo.'
                : `Tu iniciativa fue clasificada como ${triage.classification.nombre} y enviada al área de ${triage.workTable.nombre}.${
                    triage.notificationSent
                      ? ' Ya recibieron la información por correo.'
                      : ' El área la verá en su bandeja del Comité Virtual.'
                  }`}
            </p>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Por qué esta clasificación
              </p>
              <p className="text-muted-foreground">{triage.classificationReasoning}</p>
            </div>

            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                Por qué esta mesa de trabajo
              </p>
              <p className="text-muted-foreground">{triage.workTableReasoning}</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Clock className="size-4 text-muted-foreground" />
              Pendiente de clasificación
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Guardamos tu iniciativa, pero el análisis automático no pudo completarse en este
            momento. Un evaluador del Laboratorio Digital la revisará manualmente.
          </CardContent>
        </Card>
      )}

      <Button variant="outline" onClick={onSubmitAnother}>
        Enviar otra iniciativa
      </Button>
    </div>
  );
}
