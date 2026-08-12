'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, Eye, FileStack, Pencil, RefreshCw, Trash2 } from 'lucide-react';
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
  copyInitiative,
  deleteInitiative,
  downloadEvidencesZip,
  listInitiatives,
  runTriageSweep,
  type InitiativeFilters,
} from '@/features/initiative/services/initiative.service';
import {
  INITIATIVE_STATUS_LABELS,
  initiativeStatusTone,
} from '@/features/initiative/lib/status';
import { cn } from '@/lib/utils';
import { useConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { ScrollablePage } from '@/shared/components/scrollable-page';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

export default function InitiativesPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === 'ADMIN';
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
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

  const copyMutation = useMutation({
    mutationFn: (id: string) => copyInitiative(id),
    onSuccess: (copia) => {
      toast.success('Copia creada como borrador');
      void queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      // Se abre el editor de la copia: copiar sin editar no tiene sentido, y es
      // lo único que se puede hacer con ella que no se podía con el original.
      router.push(routes.initiativeEdit(copia.id));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const sweepMutation = useMutation({
    mutationFn: (alcance: 'pendientes' | 'todas') => runTriageSweep(alcance),
    onSuccess: (r) => {
      toast.success(
        r.total === 0
          ? 'No había iniciativas por clasificar'
          : `${r.triadas} de ${r.total} clasificadas${r.fallidas ? ` · ${r.fallidas} fallaron` : ''}`,
      );
      void queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleSweep(alcance: 'pendientes' | 'todas') {
    // Reclasificar todo sobreescribe dictámenes que ya se comunicaron a las
    // áreas, así que esa rama sí pide confirmación explícita.
    if (alcance === 'todas') {
      const ok = await confirm({
        title: 'Reclasificar todas las iniciativas',
        description:
          'Vuelve a correr el triage sobre todo el histórico y sobreescribe las clasificaciones actuales, incluidas las que ya se enrutaron a un área. Puede tardar varios minutos.',
        confirmLabel: 'Reclasificar todo',
        variant: 'destructive',
      });
      if (!ok) return;
    }
    sweepMutation.mutate(alcance);
  }

  async function handleCopy(id: string, nombre: string) {
    const ok = await confirm({
      title: 'Copiar iniciativa',
      description: `Se creará un borrador editable a partir de "${nombre || 'Sin nombre'}", con sus contactos y evidencias pero sin la clasificación. El original no se modifica.`,
      confirmLabel: 'Crear copia',
    });
    if (ok) copyMutation.mutate(id);
  }

  async function handleDelete(id: string, nombre: string) {
    const ok = await confirm({
      title: 'Eliminar iniciativa',
      description: `¿Eliminar la iniciativa "${nombre || 'Sin nombre'}"? También se eliminarán sus evaluaciones y evidencias.`,
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(id);
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
          <div className="flex flex-wrap gap-2">
            {isAdmin ? (
              <>
                <Button
                  type="button"
                  variant="outline"
                  disabled={sweepMutation.isPending}
                  onClick={() => void handleSweep('pendientes')}
                  title="Clasifica las iniciativas que nunca pasaron por triage"
                >
                  <RefreshCw
                    className={cn('size-4', sweepMutation.isPending && 'animate-spin')}
                  />
                  Clasificar pendientes
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  disabled={sweepMutation.isPending}
                  onClick={() => void handleSweep('todas')}
                  title="Vuelve a clasificar todo el histórico"
                >
                  Reclasificar todo
                </Button>
              </>
            ) : null}
            <Button asChild>
              <Link href={routes.initiativeNew}>Nueva iniciativa</Link>
            </Button>
          </div>
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
                  <TableCell className="font-medium">
                    <span className="flex items-center gap-2">
                      {item.nombre || 'Sin nombre'}
                      {item.copiedFromId ? (
                        <Badge
                          variant="secondary"
                          className="border-0 bg-muted text-muted-foreground"
                          title="Es copia de otra iniciativa"
                        >
                          Copia
                        </Badge>
                      ) : null}
                    </span>
                  </TableCell>
                  <TableCell>{item.triageClassification?.nombre ?? '—'}</TableCell>
                  <TableCell>{item.triageWorkTable?.nombre ?? '—'}</TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={cn('border-0', initiativeStatusTone(item.status))}
                    >
                      {INITIATIVE_STATUS_LABELS[item.status]}
                    </Badge>
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
                      {/* Copiar es la única vía para modificar algo ya clasificado:
                          el original queda como registro de lo que se envió. */}
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        title="Copiar como borrador editable"
                        disabled={copyMutation.isPending}
                        onClick={() => void handleCopy(item.id, item.nombre)}
                      >
                        <Copy className="size-3.5" />
                      </Button>
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
                          onClick={() => void handleDelete(item.id, item.nombre)}
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
        {confirmDialog}
      </>
    </ScrollablePage>
  );
}
