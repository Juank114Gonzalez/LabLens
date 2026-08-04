'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { EvaluationsTable } from '@/features/initiative/components/evaluations-table';
import { deleteEvaluation } from '@/features/evaluation/services/evaluation.service';
import {
  deleteInitiative,
  downloadEvidencesZip,
  getInitiative,
} from '@/features/initiative/services/initiative.service';
import { formatBytes, INITIATIVE_STATUS_LABELS } from '@/features/initiative/lib/status';
import { useConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

type Props = { params: Promise<{ id: string }> };

export default function InitiativeDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const role = useAuthStore((state) => state.user?.role);
  const isAdmin = role === 'ADMIN';
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const query = useQuery({
    queryKey: ['initiative', id],
    queryFn: () => getInitiative(id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteInitiative(id),
    onSuccess: () => {
      toast.success('Iniciativa eliminada');
      void queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      router.replace(routes.initiatives);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteEvaluationMutation = useMutation({
    mutationFn: (evaluationId: string) => deleteEvaluation(evaluationId),
    onSuccess: () => {
      toast.success('Evaluación eliminada');
      void queryClient.invalidateQueries({ queryKey: ['initiative', id] });
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleDeleteInitiative(nombre: string) {
    const ok = await confirm({
      title: 'Eliminar iniciativa',
      description: `¿Eliminar la iniciativa "${nombre || 'Sin nombre'}"? También se eliminarán sus evaluaciones y evidencias.`,
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate();
  }

  async function handleDeleteEvaluation(evaluationId: string) {
    const ok = await confirm({
      title: 'Eliminar evaluación',
      description: '¿Eliminar esta evaluación? Se borrará también su conversación.',
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteEvaluationMutation.mutate(evaluationId);
  }

  if (query.isLoading) {
    return (
      <div className="h-full min-h-0 overflow-y-auto p-8">
        <div className="space-y-3">
          <Skeleton className="h-10 w-72" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  const data = query.data;
  if (!data) {
    return (
      <div className="flex h-full min-h-0 items-center justify-center overflow-y-auto p-8">
        <EmptyState title="Iniciativa no encontrada" description="No tienes acceso o no existe." />
      </div>
    );
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-3xl font-semibold">{data.nombre || 'Sin nombre'}</h1>
            <Badge>{INITIATIVE_STATUS_LABELS[data.status]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.user?.name ?? data.diligenciadoPor} · {formatShortDate(data.fechaDiligenciamiento)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.status === 'DRAFT' ? (
            <Button asChild variant="outline">
              <Link href={routes.initiativeEdit(data.id)}>Continuar borrador</Link>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              void downloadEvidencesZip(data.id).catch((e: Error) => toast.error(e.message))
            }
          >
            <Download className="size-4" />
            Evidencias
          </Button>
          {isAdmin || data.status === 'DRAFT' ? (
            <Button
              type="button"
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={() => void handleDeleteInitiative(data.nombre)}
            >
              <Trash2 className="size-4" />
              Eliminar
            </Button>
          ) : null}
        </div>
      </div>

      <Section title="Expectativa de solución">{data.expectativaSolucion}</Section>
      <Section title="Solicitud">
        <Grid
          items={[
            ['Área impactada', data.areaProcesoImpactado],
            ['Área involucrada', data.areaInvolucrada],
            ['Urgencia', data.urgencia],
            ['Impacto', data.impacto],
          ]}
        />
      </Section>
      <Section title="Compuerta mínima">
        <Grid
          items={[
            ['¿Qué necesita?', data.necesidad],
            ['¿Por qué ahora?', data.porQueAhora],
            ['¿Para qué?', data.paraQue],
            ['¿Cómo se resuelve hoy?', data.comoSeResuelveHoy],
          ]}
        />
      </Section>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Empresas / Contactos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.companyContacts.map((c) => (
            <div key={`${c.correo}-${c.empresa}`} className="rounded-xl border border-border/60 px-3 py-2">
              <p className="font-medium">{c.empresa} — {c.contacto}</p>
              <p className="text-muted-foreground">
                {c.cargo} · {c.correo} · {c.telefono}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Evidencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.attachments.map((file) => (
            <a
              key={file.id}
              href={file.secureUrl}
              target="_blank"
              rel="noreferrer"
              className="block rounded-xl border border-border/60 px-3 py-2 hover:bg-accent/40"
            >
              {file.originalName} · {formatBytes(file.size)}
            </a>
          ))}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Evaluaciones</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={routes.initiativeEvaluations(data.id)}>Ver historial</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <EvaluationsTable
            items={data.evaluations ?? []}
            canDelete={isAdmin}
            isDeleting={deleteEvaluationMutation.isPending}
            onDelete={(evaluationId) => void handleDeleteEvaluation(evaluationId)}
          />
        </CardContent>
      </Card>
      </div>
      {confirmDialog}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm whitespace-pre-wrap">{children}</CardContent>
    </Card>
  );
}

function Grid({ items }: { items: Array<[string, string]> }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map(([label, value]) => (
        <div key={label}>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
          <p className="mt-1 whitespace-pre-wrap">{value || '—'}</p>
        </div>
      ))}
    </div>
  );
}
