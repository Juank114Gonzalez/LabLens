'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronDown, Search, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { routes } from '@/config/routes';
import {
  deleteEvaluation,
  listEvaluations,
} from '@/features/evaluation/services/evaluation.service';
import { NewEvaluationDialog } from '@/features/evaluation/components/new-evaluation-dialog';
import { evaluationStatusLabel, readinessLabel } from '@/features/evaluation/lib/status';
import { useConfirmDialog } from '@/shared/components/confirm-dialog';
import { EmptyState } from '@/shared/components/empty-state';
import { useAuthStore } from '@/stores/auth.store';

/** Coincidencia laxa: sin tildes, sin mayúsculas — "Tesoreria" encuentra "Tesorería". */
function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

export default function EvaluationsPage() {
  const queryClient = useQueryClient();
  const isAdmin = useAuthStore((state) => state.user?.role) === 'ADMIN';
  const { confirm, dialog: confirmDialog } = useConfirmDialog();
  const query = useQuery({
    queryKey: ['evaluations'],
    queryFn: listEvaluations,
  });

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [evaluator, setEvaluator] = useState('');

  const items = useMemo(() => query.data ?? [], [query.data]);

  // Las opciones se derivan de los datos en vez de fijarse a mano: así nunca se
  // ofrece un filtro que no devuelve nada, ni se queda corto si el backend
  // agrega un estado nuevo.
  // Se filtra por el valor crudo del enum pero se muestra su etiqueta, y se
  // ordena por la etiqueta: alfabético en inglés no le sirve a nadie aquí.
  const statusOptions = useMemo(
    () =>
      [...new Set(items.map((item) => item.status))]
        .map((value) => ({ value, label: evaluationStatusLabel(value) }))
        .sort((a, b) => a.label.localeCompare(b.label, 'es')),
    [items],
  );
  const evaluatorOptions = useMemo(
    () =>
      [...new Set(items.flatMap((item) => (item.evaluator ? [item.evaluator.name] : [])))]
        .sort((a, b) => a.localeCompare(b, 'es'))
        .map((value) => ({ value, label: value })),
    [items],
  );

  const filtered = useMemo(() => {
    const needle = normalize(search.trim());

    return items.filter((item) => {
      if (status && item.status !== status) return false;
      if (evaluator && item.evaluator?.name !== evaluator) return false;
      if (!needle) return true;

      // La búsqueda libre cubre lo que alguien recuerda de memoria — incluida la
      // etiqueta en español, porque es lo que ve en pantalla: escribir
      // "completada" debe encontrar las que están en COMPLETED.
      const haystack = [
        item.initiative.nombre,
        item.evaluator?.name ?? '',
        evaluationStatusLabel(item.status),
      ];
      return haystack.some((field) => normalize(field).includes(needle));
    });
  }, [items, search, status, evaluator]);

  const hasFilters = Boolean(search || status || evaluator);

  function clearFilters() {
    setSearch('');
    setStatus('');
    setEvaluator('');
  }

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteEvaluation(id),
    onSuccess: () => {
      toast.success('Evaluación eliminada');
      void queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  async function handleDelete(id: string, nombre: string) {
    const ok = await confirm({
      title: 'Eliminar evaluación',
      description: `¿Eliminar la evaluación de "${nombre || 'Iniciativa'}"? Se borrará también su conversación.`,
      confirmLabel: 'Eliminar',
      variant: 'destructive',
    });
    if (ok) deleteMutation.mutate(id);
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-heading text-3xl font-semibold">Evaluaciones</h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Cada evaluación es inmutable y tiene una conversación asociada.
              {isAdmin ? ' Como admin puedes eliminarlas.' : ''}
            </p>
          </div>
          <NewEvaluationDialog
            trigger={<Button type="button">Nueva evaluación</Button>}
          />
        </div>

        {query.isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : !items.length ? (
          <EmptyState
            title="Aún no hay evaluaciones"
            description="Selecciona una iniciativa registrada para iniciar la entrevista con el Lente de Innovación."
            action={
              <NewEvaluationDialog
                trigger={<Button type="button">Seleccionar iniciativa</Button>}
              />
            }
          />
        ) : (
          <>
            <div className="border-border/70 space-y-3 rounded-xl border p-3">
              <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
                <div className="relative">
                  <Search
                    aria-hidden
                    className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Buscar por iniciativa o evaluador"
                    aria-label="Buscar evaluaciones"
                    className="h-9 pl-9"
                  />
                </div>

                <FilterSelect
                  value={status}
                  onChange={setStatus}
                  ariaLabel="Filtrar por estado"
                  placeholder="Todos los estados"
                  options={statusOptions}
                />

                {/* Solo tiene sentido si hay más de un evaluador con trabajo. */}
                {evaluatorOptions.length > 1 ? (
                  <FilterSelect
                    value={evaluator}
                    onChange={setEvaluator}
                    ariaLabel="Filtrar por evaluador"
                    placeholder="Todos los evaluadores"
                    options={evaluatorOptions}
                  />
                ) : null}
              </div>

              {hasFilters ? (
                <div className="flex items-center justify-between gap-3">
                  <p className="text-muted-foreground text-xs" aria-live="polite">
                    {filtered.length} de {items.length}{' '}
                    {items.length === 1 ? 'evaluación' : 'evaluaciones'}
                  </p>
                  <Button type="button" size="sm" variant="ghost" onClick={clearFilters}>
                    <X className="size-3.5" />
                    Limpiar filtros
                  </Button>
                </div>
              ) : null}
            </div>

            {filtered.length === 0 ? (
              <EmptyState
                title="Ningún resultado"
                description="Ninguna evaluación coincide con los filtros aplicados."
                action={
                  <Button type="button" variant="outline" onClick={clearFilters}>
                    Limpiar filtros
                  </Button>
                }
              />
            ) : (
              <ul className="space-y-2">
                {filtered.map((item) => {
                  const href =
                    item.status === 'COMPLETED'
                      ? routes.evaluation(item.id)
                      : item.conversation
                        ? routes.chat(item.conversation.id)
                        : routes.evaluation(item.id);

                  return (
                    <li
                      key={item.id}
                      className="border-border/70 hover:bg-muted/40 flex items-stretch gap-2 rounded-xl border transition"
                    >
                      <Link href={href} className="min-w-0 flex-1 px-4 py-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="font-medium">
                              {item.initiative.nombre || 'Iniciativa'}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {evaluationStatusLabel(item.status)}
                              {item.readinessStatus
                                ? ` · ${readinessLabel(item.readinessStatus)}`
                                : ''}
                              {item.evaluator ? ` · ${item.evaluator.name}` : ''}
                            </p>
                          </div>
                          <p className="text-muted-foreground text-xs">
                            {new Date(item.updatedAt ?? item.createdAt).toLocaleString(
                              'es-CO',
                            )}
                          </p>
                        </div>
                      </Link>
                      {isAdmin ? (
                        <div className="flex items-center pr-3">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={deleteMutation.isPending}
                            onClick={() =>
                              void handleDelete(item.id, item.initiative.nombre)
                            }
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}
          </>
        )}
        {confirmDialog}
      </div>
    </div>
  );
}

/** `select` nativo con la piel de `Input`. El valor vacío significa "sin filtrar". */
function FilterSelect({
  value,
  onChange,
  options,
  placeholder,
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  /** El `value` es el valor crudo del enum; el `label` es lo que ve el usuario. */
  options: ReadonlyArray<{ value: string; label: string }>;
  placeholder: string;
  ariaLabel: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="border-input focus-visible:border-ring focus-visible:ring-ring/40 h-9 w-full cursor-pointer appearance-none rounded-lg border bg-transparent pr-8 pl-3 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none sm:w-auto"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2"
      />
    </div>
  );
}
