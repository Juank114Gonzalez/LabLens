'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { FileText, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/config/routes';
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

function fitTone(fit: number) {
  if (fit >= 80) return 'text-emerald-700';
  if (fit >= 60) return 'text-amber-700';
  return 'text-rose-700';
}

export function EvaluationResultPanel({
  evaluation,
  className,
}: EvaluationResultPanelProps) {
  const fit = evaluation.fit ?? 0;
  const bc = evaluation.businessCase;

  return (
    <div className={cn('space-y-4', className)}>
      <SectionCard title="Score general · Fit" delay={0.02}>
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className={cn('font-heading text-5xl font-semibold', fitTone(fit))}>{fit}</p>
            <p className="mt-1 text-xs text-muted-foreground">Escala 0–100 · inmutable</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">Prioridad {evaluation.priority ?? '—'}</p>
            <p className="mt-1 max-w-[220px] text-xs text-muted-foreground">
              {evaluation.priorityJustification}
            </p>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${Math.min(100, Math.max(0, fit))}%` }}
          />
        </div>
      </SectionCard>

      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.criteriaScores.map((item, index) => (
          <SectionCard key={item.criteriaId} title={item.nombre} delay={0.04 + index * 0.03}>
            <p className="font-heading text-2xl font-semibold">{item.score}</p>
            <p className="mt-1 text-xs text-muted-foreground">Peso {item.peso}%</p>
            <p className="mt-2 text-sm">{item.justification}</p>
          </SectionCard>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <SectionCard title="Clasificación" delay={0.2}>
          <p className="font-heading text-lg font-medium">
            {evaluation.classification?.nombre ?? '—'}
          </p>
          <p className="mt-1 text-muted-foreground">
            {evaluation.classification?.descripcion}
          </p>
          <p className="mt-3 text-sm">{evaluation.classification?.justification}</p>
        </SectionCard>
        <SectionCard title="Mesa sugerida" delay={0.23}>
          <p className="font-heading text-lg font-medium">
            {evaluation.workTable?.nombre ?? '—'}
          </p>
          <p className="mt-1 text-muted-foreground">{evaluation.workTable?.descripcion}</p>
          <p className="mt-3 text-sm">{evaluation.workTable?.justification}</p>
        </SectionCard>
      </div>

      {bc ? (
        <>
          <SectionCard title="Business Case · Resumen ejecutivo" delay={0.26}>
            <p>{bc.resumenEjecutivo}</p>
          </SectionCard>
          <SectionCard title="Objetivos de negocio" delay={0.28}>
            <ul className="list-disc space-y-1 pl-4">
              {bc.objetivosNegocio.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Beneficios estimados" delay={0.3}>
            <ul className="list-disc space-y-1 pl-4">
              {bc.beneficiosEstimados.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Riesgos principales" delay={0.32}>
            <ul className="list-disc space-y-1 pl-4">
              {bc.riesgosPrincipales.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="KPIs sugeridos" delay={0.34}>
            <ul className="list-disc space-y-1 pl-4">
              {bc.kpisSugeridos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Recomendación final" delay={0.36}>
            <p>{bc.recomendacionFinal}</p>
          </SectionCard>
        </>
      ) : null}

      <SectionCard title="Evidencias utilizadas" delay={0.38}>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Empresas</p>
            <ul className="space-y-1">
              {(evaluation.initiative?.companyContacts ?? []).map((contact) => (
                <li key={`${contact.empresa}-${contact.contacto}`}>
                  {contact.empresa} · {contact.contacto}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase text-muted-foreground">Archivos</p>
            <ul className="space-y-1">
              {(evaluation.initiative?.attachments ?? []).map((file) => (
                <li key={file.id}>
                  <a
                    href={file.secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    <FileText className="size-3.5" />
                    {file.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          {evaluation.initiative?.necesidad ? (
            <div>
              <p className="mb-1 text-xs uppercase text-muted-foreground">Información inicial</p>
              <p>{evaluation.initiative.necesidad}</p>
            </div>
          ) : null}
        </div>
      </SectionCard>

      <div className="flex flex-wrap gap-2 pt-2">
        {evaluation.conversationId ? (
          <Button asChild variant="outline">
            <Link href={routes.chat(evaluation.conversationId)}>
              <MessagesSquare className="size-4" />
              Ver entrevista
            </Link>
          </Button>
        ) : null}
        <Button type="button" variant="secondary" disabled title="Arquitectura preparada">
          Exportar PDF (próximamente)
        </Button>
        <Button type="button" variant="secondary" disabled title="Arquitectura preparada">
          Exportar Word (próximamente)
        </Button>
      </div>
    </div>
  );
}
