'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Eye, FileStack, Pencil, Trash2 } from 'lucide-react';
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
import { InitiativeFiltersBar } from '@/features/initiative/components/initiative-filters';
import {
  deleteInitiative,
  downloadEvidencesZip,
  listInitiatives,
  type InitiativeFilters,
} from '@/features/initiative/services/initiative.service';
import { INITIATIVE_STATUS_LABELS, SOURCE_LABELS } from '@/features/initiative/lib/status';
import { EmptyState } from '@/shared/components/empty-state';
import { ScrollablePage } from '@/shared/components/scrollable-page';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

export default function InitiativesPage() {
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === 'ADMIN';
  const [filters, setFilters] = useState<InitiativeFilters>({});
  const query = useQuery({
    queryKey: ['initiatives', filters],
    queryFn: () => listInitiatives(filters),
  });
  const items = query.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteInitiative(id),
    onSuccess: () => {
      toast.success('Iniciativa eliminada');
      void queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function canDelete(status: string) {
    return isAdmin || status === 'DRAFT';
  }

  return (
    <ScrollablePage className="p-6 sm:p-8" contentClassName="max-w-6xl flex flex-col gap-6">
      <>
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Todas las iniciativas</h1>
            <p className="text-sm text-muted-foreground">
              Incluye lo enrutado fuera del Lab, para auditar la precisión del triage.
            </p>
          </div>
          <Button asChild>
            <Link href={routes.initiativeNew}>Nueva iniciativa</Link>
          </Button>
        </div>

        <InitiativeFiltersBar value={filters} onChange={setFilters} />

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
                <TableHead>Canal</TableHead>
                <TableHead>Clasificación</TableHead>
                <TableHead>Mesa asignada</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.nombre || 'Sin nombre'}</TableCell>
                  <TableCell>{SOURCE_LABELS[item.sourceType]}</TableCell>
                  <TableCell>{item.triageClassification?.nombre ?? '—'}</TableCell>
                  <TableCell>{item.triageWorkTable?.nombre ?? '—'}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{INITIATIVE_STATUS_LABELS[item.status]}</Badge>
                  </TableCell>
                  <TableCell>{formatShortDate(item.createdAt)}</TableCell>
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
                          void downloadEvidencesZip(item.id).catch((e: Error) =>
                            toast.error(e.message),
                          )
                        }
                      >
                        <Download className="size-3.5" />
                      </Button>
                      {canDelete(item.status) ? (
                        <Button
                          type="button"
                          size="icon-sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          disabled={deleteMutation.isPending}
                          onClick={() => {
                            const ok = window.confirm(
                              `¿Eliminar la iniciativa "${item.nombre || 'Sin nombre'}"? También se eliminarán sus evaluaciones y evidencias.`,
                            );
                            if (ok) deleteMutation.mutate(item.id);
                          }}
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
        )}
      </>
    </ScrollablePage>
  );
}
