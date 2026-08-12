'use client';

import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { routes } from '@/config/routes';
import type { EvaluationSummary } from '@/features/initiative/types';
import {
  evaluationStatusLabel,
  evaluationStatusTone,
  triageDisagreement,
} from '@/features/evaluation/lib/status';
import { cn } from '@/lib/utils';
import { formatShortDate } from '@/shared/lib/dates';
import { EmptyState } from '@/shared/components/empty-state';

function fitFromResults(results: unknown): string {
  if (results && typeof results === 'object' && 'fit' in results) {
    return String((results as { fit: unknown }).fit);
  }
  return '—';
}

function criteriaVersion(snapshot: unknown): string {
  if (Array.isArray(snapshot)) return `v${snapshot.length} criterios`;
  if (snapshot && typeof snapshot === 'object') return 'Snapshot guardado';
  return '—';
}

type EvaluationsTableProps = {
  items: EvaluationSummary[];
  canDelete?: boolean;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
};

export function EvaluationsTable({
  items,
  canDelete = false,
  onDelete,
  isDeleting,
}: EvaluationsTableProps) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Sin evaluaciones"
        description="Cuando un gestor evalúe esta iniciativa, aparecerán aquí."
      />
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Fecha</TableHead>
          <TableHead>Versión de criterios</TableHead>
          <TableHead>Evaluador</TableHead>
          <TableHead>Fit</TableHead>
          <TableHead>Clasificación</TableHead>
          <TableHead>Mesa sugerida</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Acción</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{formatShortDate(item.evaluatedAt ?? item.createdAt)}</TableCell>
            <TableCell>{criteriaVersion(item.criteriaSnapshot)}</TableCell>
            <TableCell>{item.evaluator?.name ?? '—'}</TableCell>
            <TableCell>{fitFromResults(item.results)}</TableCell>
            <TableCell>
              {item.classification?.nombre ??
                (item.classificationSnapshot &&
                typeof item.classificationSnapshot === 'object' &&
                'nombre' in item.classificationSnapshot
                  ? String((item.classificationSnapshot as { nombre: string }).nombre)
                  : '—')}
            </TableCell>
            <TableCell>
              {item.workTable?.nombre ??
                (item.workTableSnapshot &&
                typeof item.workTableSnapshot === 'object' &&
                'nombre' in item.workTableSnapshot
                  ? String((item.workTableSnapshot as { nombre: string }).nombre)
                  : '—')}
            </TableCell>
            <TableCell>
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge
                  variant="secondary"
                  className={cn('border-0', evaluationStatusTone(item.status))}
                >
                  {evaluationStatusLabel(item.status)}
                </Badge>
                {/* El desacuerdo entre triage y pipeline no es un error: es la
                    señal de que el caso es ambiguo y merece una segunda mirada. */}
                {(() => {
                  const d = triageDisagreement(item.results);
                  if (!d) return null;
                  const que = [d.clasificacion && 'clasificación', d.mesa && 'mesa']
                    .filter(Boolean)
                    .join(' y ');
                  return (
                    <Badge
                      variant="secondary"
                      className="border-0 bg-signal/20 text-signal"
                      title={`El triage y la evaluación difieren en ${que}`}
                    >
                      Revisar
                    </Badge>
                  );
                })()}
              </div>
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1">
                <Button asChild size="sm" variant="outline">
                  <Link href={routes.evaluation(item.id)}>Ver</Link>
                </Button>
                {canDelete ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="ghost"
                    className="text-destructive hover:text-destructive"
                    disabled={isDeleting}
                    onClick={() => onDelete?.(item.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                ) : null}
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
