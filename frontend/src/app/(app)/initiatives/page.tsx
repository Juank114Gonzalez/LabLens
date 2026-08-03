'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Download, Eye, FileStack, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { routes } from '@/config/routes';
import {
  downloadEvidencesZip,
  listInitiatives,
} from '@/features/initiative/services/initiative.service';
import { INITIATIVE_STATUS_LABELS } from '@/features/initiative/lib/status';
import { EmptyState } from '@/shared/components/empty-state';
import { formatShortDate } from '@/shared/lib/dates';

export default function InitiativesPage() {
  const query = useQuery({ queryKey: ['initiatives'], queryFn: listInitiatives });
  const items = query.data ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Mis iniciativas</h1>
          <p className="text-sm text-muted-foreground">Consulta el estado de tus registros.</p>
        </div>
        <Button asChild>
          <Link href={routes.initiativeNew}>Nueva iniciativa</Link>
        </Button>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : items.length === 0 ? (
        <EmptyState
          title="Aún no hay iniciativas"
          description="Registra la primera para el Innovation Lab."
          action={
            <Button asChild>
              <Link href={routes.initiativeNew}>Crear</Link>
            </Button>
          }
        />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Área impactada</TableHead>
              <TableHead>Urgencia</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Fecha</TableHead>
              <TableHead>Última evaluación</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nombre || 'Sin nombre'}</TableCell>
                <TableCell>{item.areaProcesoImpactado || '—'}</TableCell>
                <TableCell>{item.urgencia || '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{INITIATIVE_STATUS_LABELS[item.status]}</Badge>
                </TableCell>
                <TableCell>{formatShortDate(item.createdAt)}</TableCell>
                <TableCell>
                  {item.evaluations?.[0]
                    ? formatShortDate(item.evaluations[0].evaluatedAt ?? item.evaluations[0].createdAt)
                    : '—'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button asChild size="icon-sm" variant="ghost">
                      <Link href={routes.initiative(item.id)}>
                        <Eye className="size-3.5" />
                      </Link>
                    </Button>
                    {item.status === 'DRAFT' ? (
                      <Button asChild size="icon-sm" variant="ghost">
                        <Link href={routes.initiativeEdit(item.id)}>
                          <Pencil className="size-3.5" />
                        </Link>
                      </Button>
                    ) : null}
                    <Button asChild size="icon-sm" variant="ghost">
                      <Link href={routes.initiativeEvaluations(item.id)}>
                        <FileStack className="size-3.5" />
                      </Link>
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        void downloadEvidencesZip(item.id).catch((e: Error) => toast.error(e.message))
                      }
                    >
                      <Download className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
