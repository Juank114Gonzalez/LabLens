'use client';

import { use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Copy, Download, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import { EvaluationsTable } from '@/features/initiative/components/evaluations-table';
import { deleteEvaluation } from '@/features/evaluation/services/evaluation.service';
import {
  copyInitiative,
  deleteInitiative,
  downloadEvidencesZip,
  getInitiative,
  retriageInitiative,
} from '@/features/initiative/services/initiative.service';
import { formatBytes, INITIATIVE_STATUS_LABELS } from '@/features/initiative/lib/status';
import { cn } from '@/lib/utils';
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

  const copyMutation = useMutation({
    mutationFn: () => copyInitiative(id),
    onSuccess: (copia) => {
      toast.success('Copia creada como borrador');
      void queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      router.push(routes.initiativeEdit(copia.id));
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleCopy(nombre: string) {
    const ok = await confirm({
      title: 'Copiar iniciativa',
      description: `Se creará un borrador editable a partir de "${nombre || 'Sin nombre'}", con sus contactos y evidencias pero sin la clasificación. El original no se modifica.`,
      confirmLabel: 'Crear copia',
    });
    if (ok) copyMutation.mutate();
  }

  const retriageMutation = useMutation({
    mutationFn: () => retriageInitiative(id),
    onSuccess: (r) => {
      toast.success(
        r.needsReview
          ? 'Quedó en revisión manual'
          : `Clasificada como ${r.classification?.nombre ?? '—'}`,
      );
      void queryClient.invalidateQueries({ queryKey: ['initiative', id] });
      void queryClient.invalidateQueries({ queryKey: ['initiatives'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleRetriage() {
    const ok = await confirm({
      title: 'Reclasificar iniciativa',
      description:
        'Vuelve a correr el triage sobre el mismo contenido y reemplaza la clasificación y la mesa actuales. No modifica lo que escribió quien la envió.',
      confirmLabel: 'Reclasificar',
    });
    if (ok) retriageMutation.mutate();
  }

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

  const hasScopeAndValue =
    data.impactaA.length > 0 ||
    data.productoRelacionado.length > 0 ||
    data.beneficios.length > 0 ||
    data.tieneInteresado !== null ||
    Boolean(data.impacto.trim());

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
          {/* Copiar es la única vía para modificar una iniciativa ya clasificada,
              así que el botón vive junto a las demás acciones de la ficha y no
              solo en el listado. */}
          <Button
            type="button"
            variant="outline"
            disabled={copyMutation.isPending}
            onClick={() => void handleCopy(data.nombre)}
          >
            <Copy className="size-4" />
            Copiar
          </Button>
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

      {/*
        Las secciones siguen el orden en que la persona respondió el formulario
        público —quién envía, la iniciativa, alcance y valor, interesados— en vez
        del orden interno del modelo. Quien revisa la ficha lee lo mismo que se
        escribió, en la misma secuencia. Los campos que solo diligencia el
        formulario interno van al final, en su propio bloque.
      */}
      {/* El resultado del triage no se veía en ninguna parte de la ficha: había
          que volver al listado para saber cómo se había clasificado y por qué. */}
      {data.status !== 'DRAFT' ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
            <CardTitle>Clasificación automática</CardTitle>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={retriageMutation.isPending}
              onClick={() => void handleRetriage()}
            >
              <RefreshCw
                className={cn('size-3.5', retriageMutation.isPending && 'animate-spin')}
              />
              {data.triagedAt ? 'Reclasificar' : 'Clasificar'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {!data.triagedAt ? (
              <p className="text-muted-foreground">
                Todavía no ha pasado por el triage.
              </p>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Clasificación
                    </p>
                    <p className="mt-1 font-medium">
                      {data.triageClassification?.nombre ?? 'Sin clasificar'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Mesa asignada
                    </p>
                    <p className="mt-1 font-medium">
                      {data.triageWorkTable?.nombre ?? '—'}
                    </p>
                  </div>
                </div>

                {data.triageReasoning ? (
                  <div className="border-t border-border/60 pt-3">
                    <p className="mb-1 text-xs uppercase tracking-wide text-muted-foreground">
                      {data.triageClassification ? 'Razonamiento' : 'Por qué quedó en revisión'}
                    </p>
                    <p className="whitespace-pre-wrap">{data.triageReasoning}</p>
                  </div>
                ) : null}

                <p className="text-xs text-muted-foreground">
                  {formatShortDate(data.triagedAt)}
                  {data.triageConfidence !== null
                    ? ` · confianza ${data.triageConfidence.toFixed(2)}`
                    : ''}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      ) : null}

      <FieldSection
        title="Quién envía"
        items={[
          ['Área del solicitante', data.areaSolicitante],
          ['Correo', data.submitterEmail ?? ''],
        ]}
      />

      <FieldSection
        title="La iniciativa"
        items={[
          ['¿Qué problema, dolor u oportunidad busca resolver?', data.necesidad],
          ['Solución propuesta', data.solucionPropuesta],
        ]}
      />

      {hasScopeAndValue ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Alcance y valor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <TagList label="¿A quién impacta?" values={data.impactaA} />
            <TagList label="Productos relacionados" values={data.productoRelacionado} />
            <TagList label="Beneficios esperados" values={data.beneficios} />
            {data.impacto.trim() ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Estimación cuantitativa del impacto
                </p>
                <p className="mt-1 whitespace-pre-wrap">{data.impacto}</p>
              </div>
            ) : null}
            {data.tieneInteresado !== null ? (
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  ¿Existe cliente, aliado o área interesada?
                </p>
                <p className="mt-1">{data.tieneInteresado ? 'Sí' : 'No'}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {/* Solo el formulario interno diligencia esto; para el canal público la
          tarjeta entera desaparece. */}
      <FieldSection
        title="Compuerta mínima"
        items={[
          ['Expectativa de solución', data.expectativaSolucion],
          ['Área impactada', data.areaProcesoImpactado],
          ['Área involucrada', data.areaInvolucrada],
          ['Urgencia', data.urgencia],
          ['¿Por qué ahora?', data.porQueAhora],
          ['¿Para qué?', data.paraQue],
          ['¿Cómo se resuelve hoy?', data.comoSeResuelveHoy],
        ]}
      />

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Empresas / Contactos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.companyContacts.length === 0 ? (
            <p className="text-muted-foreground">Sin contactos registrados.</p>
          ) : (
            data.companyContacts.map((c) => (
              <div key={`${c.correo}-${c.empresa}`} className="rounded-xl border border-border/60 px-3 py-2">
                <p className="font-medium">{c.empresa} — {c.contacto}</p>
                <p className="text-muted-foreground">
                  {c.cargo} · {c.correo} · {c.telefono}
                </p>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Evidencias</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {data.attachments.length === 0 ? (
            <p className="text-muted-foreground">Sin evidencias adjuntas.</p>
          ) : null}
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

/**
 * Los campos de selección múltiple se guardan como arreglo, así que se pintan
 * como etiquetas y no como una cadena separada por comas: se leen de un vistazo
 * y coinciden con cómo se eligieron en el formulario.
 */
function TagList({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) return null;

  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {values.map((value) => (
          <span
            key={value}
            className="rounded-lg border border-primary/40 bg-primary/15 px-2 py-0.5 text-xs font-medium text-lab"
          >
            {value}
          </span>
        ))}
      </div>
    </div>
  );
}

/**
 * Sección de campos que se oculta cuando ninguno tiene contenido, y que dentro
 * solo pinta los que sí lo tienen.
 *
 * Los dos formularios llenan mitades distintas del modelo: el público no
 * pregunta urgencia, área impactada, por qué ahora, para qué ni cómo se resuelve
 * hoy, y el interno no pregunta nada del bloque de alcance. Pintar el modelo
 * completo llenaba la ficha de guiones que parecían respuestas sin diligenciar
 * cuando en realidad esas preguntas no se hicieron nunca por ese canal.
 */
function FieldSection({ title, items }: { title: string; items: Array<[string, string]> }) {
  const filled = items.filter(([, value]) => value?.trim());
  if (filled.length === 0) return null;

  return (
    <Card className="border-border/70 shadow-none">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        <div className="grid gap-4 sm:grid-cols-2">
          {filled.map(([label, value]) => (
            // Las respuestas de texto largo ocupan el ancho completo. En media
            // columna quedaban en una tira estrecha de doce líneas junto a un
            // hueco vacío, que es justo lo que hacía ilegible la ficha.
            <div key={label} className={value.length > 90 ? 'sm:col-span-2' : undefined}>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
              <p className="mt-1 whitespace-pre-wrap">{value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
