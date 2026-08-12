'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { FileText, MessagesSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { routes } from '@/config/routes';
import { EvaluationProse } from '@/features/evaluation/components/evaluation-prose';
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

/*
 * Tonos del Fit sobre los tokens del tema, no sobre la paleta cruda de Tailwind.
 * Con `emerald`/`amber`/`rose` fijos, el panel no seguía el rebranding ni se
 * adapta si el tema cambia; `--success` y `--warning` existían justo para esto.
 */
function fitTone(fit: number) {
  if (fit >= 80) return 'text-success';
  if (fit >= 60) return 'text-signal';
  return 'text-destructive';
}

function barTone(fit: number) {
  if (fit >= 80) return 'bg-success';
  if (fit >= 60) return 'bg-signal';
  return 'bg-destructive';
}

/**
 * Una fila del contraste. `null` no es un desacierto: significa que el triage
 * mandó la iniciativa a revisión manual en vez de arriesgar una clasificación,
 * y contarlo como error castigaría justo la conducta prudente.
 */
function ComparisonRow({
  label,
  coincide,
  triageValue,
}: {
  label: string;
  coincide: boolean | null;
  triageValue: string | null;
}) {
  const estado =
    coincide === null
      ? { texto: 'El triage no clasificó · quedó en revisión manual', tono: 'text-muted-foreground' }
      : coincide
        ? { texto: `Coincide · ${triageValue}`, tono: 'text-success' }
        : { texto: `Difiere · el triage dijo "${triageValue}"`, tono: 'text-signal' };

  return (
    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      <span className={cn('text-sm font-medium', estado.tono)}>{estado.texto}</span>
    </div>
  );
}

export function EvaluationResultPanel({
  evaluation,
  className,
}: EvaluationResultPanelProps) {
  const fit = evaluation.fit ?? 0;
  const bc = evaluation.businessCase;
  const tc = evaluation.triageComparison;

  return (
    <div className={cn('space-y-4', className)}>
      <SectionCard title="Score general · Fit" delay={0.02}>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="space-y-2">
            <p className={cn('font-heading text-5xl font-semibold leading-none', fitTone(fit))}>
              {fit}
            </p>
            <p className="text-xs text-muted-foreground">Escala 0–100 · inmutable</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Prioridad</p>
            <p className="font-heading text-xl font-semibold">
              {evaluation.priority ?? '—'}
            </p>
          </div>
        </div>
        <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', barTone(fit))}
            style={{ width: `${Math.min(100, Math.max(0, fit))}%` }}
          />
        </div>
      </SectionCard>

      {/*
        El orden va de lo general a lo específico: primero el veredicto, luego el
        argumento en prosa, después a dónde se enruta, qué se evaluó, y solo al
        final el desglose criterio por criterio y la trazabilidad. Quien abre esta
        pantalla casi siempre quiere el número y el porqué, no las seis fichas.
      */}
      {bc ? (
        <>
          <SectionCard title="Resumen ejecutivo" delay={0.05}>
            <EvaluationProse content={bc.resumenEjecutivo} />
          </SectionCard>
          <SectionCard title="Recomendación final" delay={0.08}>
            <EvaluationProse content={bc.recomendacionFinal} />
          </SectionCard>
        </>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <SectionCard title="Clasificación" delay={0.2}>
          <p className="font-heading text-lg font-medium">
            {evaluation.classification?.nombre ?? '—'}
          </p>
          {evaluation.classification?.descripcion ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {evaluation.classification.descripcion}
            </p>
          ) : null}
          {evaluation.classification?.justification ? (
            <div className="mt-3 border-t border-border/60 pt-3">
              <EvaluationProse content={evaluation.classification.justification} />
            </div>
          ) : null}
        </SectionCard>
        <SectionCard title="Mesa sugerida" delay={0.23}>
          <p className="font-heading text-lg font-medium">
            {evaluation.workTable?.nombre ?? '—'}
          </p>
          {evaluation.workTable?.descripcion ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {evaluation.workTable.descripcion}
            </p>
          ) : null}
          {evaluation.workTable?.justification ? (
            <div className="mt-3 border-t border-border/60 pt-3">
              <EvaluationProse content={evaluation.workTable.justification} />
            </div>
          ) : null}
        </SectionCard>
      </div>

      {/* La iniciativa de la que nació esta evaluación, con enlace a su ficha
          completa. Sin esto había que recordar de dónde venía el dictamen. */}
      {evaluation.initiative ? (
        <SectionCard title="Iniciativa evaluada" delay={0.24}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <p className="font-heading text-lg font-medium">
              {evaluation.initiative.nombre || 'Sin nombre'}
            </p>
            <Button asChild size="sm" variant="outline">
              <Link href={routes.initiative(evaluation.initiative.id)}>
                <FileText className="size-3.5" />
                Ver iniciativa
              </Link>
            </Button>
          </div>
          {evaluation.initiative.necesidad ? (
            <div className="mt-3 border-t border-border/60 pt-3">
              <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                Problema planteado
              </p>
              <EvaluationProse content={evaluation.initiative.necesidad} />
            </div>
          ) : null}
        </SectionCard>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {evaluation.criteriaScores.map((item, index) => (
          <SectionCard key={item.criteriaId} title={item.nombre} delay={0.26 + index * 0.02}>
            <p className="font-heading text-2xl font-semibold">{item.score}</p>
            <p className="mt-1 text-xs text-muted-foreground">Peso {item.peso}%</p>
            <div className="mt-3">
              <EvaluationProse content={item.justification} />
            </div>
          </SectionCard>
        ))}
      </div>

      {/* El detalle del business case. El resumen y la recomendación ya salieron
          arriba, junto al score: son la lectura de un minuto. */}
      {bc ? (
        <>
          <SectionCard title="Objetivos de negocio" delay={0.28}>
            <ul className="list-disc space-y-1.5 pl-5">
              {bc.objetivosNegocio.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Beneficios estimados" delay={0.3}>
            <ul className="list-disc space-y-1.5 pl-5">
              {bc.beneficiosEstimados.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="Riesgos principales" delay={0.32}>
            <ul className="list-disc space-y-1.5 pl-5">
              {bc.riesgosPrincipales.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard title="KPIs sugeridos" delay={0.34}>
            <ul className="list-disc space-y-1.5 pl-5">
              {bc.kpisSugeridos.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </SectionCard>
        </>
      ) : null}

      {/* Con qué reglas se produjo este número. Sin esto, un Fit de 75 no se
          puede comparar con otro de hace dos meses: puede que los pesos ni
          siquiera fueran los mismos. */}
      <SectionCard title="Configuración usada" delay={0.36}>
        <div className="flex flex-wrap items-baseline gap-x-2">
          {evaluation.criteriaVersion ? (
            <>
              <span className="font-heading text-lg font-medium">
                Versión {evaluation.criteriaVersion.numero}
              </span>
              <span className="text-xs text-muted-foreground">
                vigente desde{' '}
                {new Date(evaluation.criteriaVersion.createdAt).toLocaleDateString('es-CO')}
              </span>
            </>
          ) : (
            <span className="text-sm text-muted-foreground">
              Sin versión registrada (anterior al historial)
            </span>
          )}
        </div>

        <ul className="mt-3 space-y-1.5 border-t border-border/60 pt-3">
          {evaluation.criteriaScores.map((item) => (
            <li key={item.criteriaId} className="flex items-baseline justify-between gap-3">
              <span>{item.nombre}</span>
              <span className="tabular-nums text-muted-foreground">{item.peso}%</span>
            </li>
          ))}
        </ul>

        <p className="mt-3 text-xs text-muted-foreground">
          Estos pesos quedaron congelados al abrir la evaluación. Cambiarlos hoy no altera
          este resultado.
        </p>
      </SectionCard>

      {tc?.huboTriage ? (
        <SectionCard title="Contraste con el triage inicial" delay={0.38}>
          <p className="text-xs text-muted-foreground">
            El triage clasificó esta iniciativa al recibirla, sin ver esta evaluación. La
            evaluación tampoco vio el triage: son dos dictámenes independientes.
          </p>
          <div className="mt-3 space-y-2">
            <ComparisonRow
              label="Clasificación"
              coincide={tc.clasificacionCoincide}
              triageValue={tc.triageClassificationNombre}
            />
            <ComparisonRow
              label="Mesa"
              coincide={tc.mesaCoincide}
              triageValue={tc.triageWorkTableNombre}
            />
          </div>
          {tc.triageConfidence !== null ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Confianza declarada por el triage: {tc.triageConfidence.toFixed(2)}
            </p>
          ) : null}
        </SectionCard>
      ) : null}

      <SectionCard title="Evidencias utilizadas" delay={0.4}>
        <div className="space-y-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Empresas
            </p>
            <ul className="space-y-1">
              {(evaluation.initiative?.companyContacts ?? []).map((contact) => (
                <li key={`${contact.empresa}-${contact.contacto}`}>
                  {contact.empresa} · {contact.contacto}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
              Archivos
            </p>
            <ul className="space-y-1">
              {(evaluation.initiative?.attachments ?? []).map((file) => (
                <li key={file.id}>
                  <a
                    href={file.secureUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex cursor-pointer items-center gap-1 text-primary hover:underline"
                  >
                    <FileText className="size-3.5" />
                    {file.originalName}
                  </a>
                </li>
              ))}
            </ul>
          </div>
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
