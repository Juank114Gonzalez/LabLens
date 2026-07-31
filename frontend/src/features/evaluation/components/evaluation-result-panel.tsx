'use client';

import { motion } from 'motion/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { EvaluationResult } from '@/types/evaluation';
import { cn } from '@/lib/utils';

type EvaluationResultPanelProps = {
  evaluation: EvaluationResult;
  className?: string;
};

function SectionCard({
  title,
  children,
  delay = 0,
}: {
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.28 }}
    >
      <Card className="border-border/70 bg-card/70 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="font-heading text-sm font-medium tracking-wide text-muted-foreground">
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm leading-relaxed">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function classifyFit(fit: number): string {
  if (fit >= 85) return 'Alta prioridad';
  if (fit >= 70) return 'Candidata sólida';
  if (fit >= 55) return 'Requiere maduración';
  return 'Baja prioridad actual';
}

export function EvaluationResultPanel({
  evaluation,
  className,
}: EvaluationResultPanelProps) {
  return (
    <div className={cn('space-y-3', className)}>
      <SectionCard title="Resumen ejecutivo" delay={0.02}>
        <p>{evaluation.summary}</p>
      </SectionCard>

      <div className="grid grid-cols-2 gap-3">
        <SectionCard title="Score / Fit" delay={0.05}>
          <p className="font-heading text-3xl font-semibold text-primary">{evaluation.fit}%</p>
          <p className="mt-1 text-xs text-muted-foreground">{classifyFit(evaluation.fit)}</p>
        </SectionCard>
        <SectionCard title="Clasificación" delay={0.08}>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li>Impacto: {evaluation.scores.impact}</li>
            <li>Datos: {evaluation.scores.data}</li>
            <li>Complejidad: {evaluation.scores.complexity}</li>
            <li>Alineación: {evaluation.scores.alignment}</li>
          </ul>
        </SectionCard>
      </div>

      <SectionCard title="Business Case / Ficha técnica" delay={0.11}>
        <p className="whitespace-pre-wrap">{evaluation.technicalSheet}</p>
      </SectionCard>

      <SectionCard title="Fortalezas" delay={0.14}>
        <ul className="list-disc space-y-1 pl-4">
          {evaluation.strengths.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Debilidades" delay={0.17}>
        <ul className="list-disc space-y-1 pl-4">
          {evaluation.weaknesses.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Recomendaciones" delay={0.2}>
        <ul className="list-disc space-y-1 pl-4">
          {evaluation.recommendations.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </SectionCard>

      {evaluation.similarInitiatives.length > 0 ? (
        <SectionCard title="Ruta sugerida / iniciativas similares" delay={0.23}>
          <ul className="space-y-2">
            {evaluation.similarInitiatives.map((item) => (
              <li key={item.title} className="rounded-xl bg-muted/50 px-3 py-2">
                <p className="font-medium">{item.title}</p>
                <p className="text-xs text-muted-foreground">
                  {item.status} · Fit {item.fit}% · {item.reason}
                </p>
              </li>
            ))}
          </ul>
        </SectionCard>
      ) : null}
    </div>
  );
}
