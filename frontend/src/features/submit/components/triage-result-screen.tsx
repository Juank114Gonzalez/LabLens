'use client';

import { CheckCircle2, Clock, FlaskConical, Route } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { routes } from '@/config/routes';
import { Logo } from '@/shared/components/logo';
import { AchLogo } from '@/shared/components/ach-logo';
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
    /* Pantalla final del flujo público: trae su propio chrome porque
       `app/submit/layout.tsx` es un paso directo (el wizard se encarga del suyo). */
    <div className="relative min-h-svh px-5 pt-6 pb-12">
      <div className="lab-grid pointer-events-none fixed inset-0 opacity-30" />

      <div className="relative mx-auto w-full max-w-2xl space-y-6">
        <header className="flex items-center justify-between gap-3">
          <Logo href={routes.home} stacked subtitle="Envía tu iniciativa" />
          <AchLogo className="h-7 sm:h-8" />
        </header>

        <div className="flex items-start gap-3">
          <CheckCircle2 className="text-primary mt-0.5 size-6 shrink-0" />
          <div>
            <h1 className="font-heading text-2xl font-semibold">Iniciativa recibida</h1>
            <p className="text-muted-foreground text-sm">{result.initiative.nombre}</p>
          </div>
        </div>

        {triage?.needsReview ? (
          /* El modelo no pudo clasificar (texto sin contenido, o dudó demasiado).
             Se le dice al usuario qué faltó en vez de mostrarle una categoría
             inventada — y ninguna mesa de trabajo fue notificada. */
          <Card className="border-border/70 shadow-none">
            <CardHeader className="space-y-2">
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                <Clock className="size-4 text-warning" />
                Pendiente de revisión
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">
                No pudimos clasificar la iniciativa automáticamente, así que la revisará una
                persona del Laboratorio Digital antes de enrutarla.
              </p>
              {triage.reviewReason ? (
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                    Qué faltó
                  </p>
                  <p className="text-muted-foreground">{triage.reviewReason}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        ) : triage && triage.classification && triage.workTable ? (
          <Card className="border-border/70 shadow-none">
            <CardHeader className="space-y-3">
              {/* La confianza del triage es un dato interno: se sigue guardando en
                  `triageConfidence` y decidiendo con ella si la iniciativa va a
                  revisión, pero no se le muestra a quien envía — un porcentaje
                  sin contexto invita a discutir el número en vez de la respuesta. */}
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
              </div>
              <CardTitle className="flex items-center gap-2 text-base font-medium">
                {triage.isLabScope ? (
                  <FlaskConical className="text-primary size-4" />
                ) : (
                  <Route className="text-muted-foreground size-4" />
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
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
                  Por qué esta clasificación
                </p>
                <p className="text-muted-foreground">{triage.classificationReasoning}</p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground text-xs font-medium tracking-[0.14em] uppercase">
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
                <Clock className="text-muted-foreground size-4" />
                Pendiente de clasificación
              </CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground text-sm">
              Guardamos tu iniciativa, pero el análisis automático no pudo completarse en
              este momento. Un evaluador del Laboratorio Digital la revisará manualmente.
            </CardContent>
          </Card>
        )}

        <Button variant="outline" onClick={onSubmitAnother}>
          Enviar otra iniciativa
        </Button>
      </div>
    </div>
  );
}
