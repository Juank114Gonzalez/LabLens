'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { routes } from '@/config/routes';
import { conversationsQueryKey } from '@/features/conversation/hooks/use-conversations';
import { startEvaluation } from '@/features/conversation/services/conversation.service';
import { listInitiatives } from '@/features/initiative/services/initiative.service';
import { cn } from '@/lib/utils';

type StartMode = 'interview' | 'direct';

/**
 * Creación de evaluaciones. Vive dentro de la página de Evaluaciones en vez de
 * ser una ruta aparte: elegir la iniciativa es el primer paso del mismo flujo,
 * no un destino propio, y tenerlo como página separada obligaba a navegar ida y
 * vuelta para algo que se resuelve en dos clics.
 */
export function NewEvaluationDialog({ trigger }: { trigger: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState('');

  // Solo se piden las iniciativas al abrir: antes esta lista se cargaba al
  // entrar a una página que existía únicamente para mostrarla.
  const initiativesQuery = useQuery({
    queryKey: ['initiatives', 'for-evaluation'],
    queryFn: () => listInitiatives(),
    enabled: open,
  });

  const eligible = (initiativesQuery.data ?? []).filter(
    (item) => item.status !== 'ARCHIVED',
  );

  const startMutation = useMutation({
    mutationFn: (mode: StartMode) => startEvaluation(selectedId, mode),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: conversationsQueryKey });
      await queryClient.invalidateQueries({ queryKey: ['evaluations'] });
      setOpen(false);

      if (result.mode === 'direct' && result.evaluation?.id) {
        toast.success('Evaluación generada');
        router.push(routes.evaluation(result.evaluation.id));
        return;
      }

      toast.success('Entrevista iniciada');
      router.push(routes.chat(result.conversationId));
    },
    onError: (error) => toast.error(getErrorMessage(error, 'No se pudo iniciar')),
  });

  function onOpenChange(next: boolean) {
    // Cerrar descarta la selección: reabrir con una iniciativa ya marcada de una
    // sesión anterior invita a arrancar la evaluación equivocada.
    if (!next) setSelectedId('');
    setOpen(next);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Nueva evaluación</DialogTitle>
          <DialogDescription>
            Evalúa de una vez con los datos que ya tiene la iniciativa, o inicia una
            entrevista para enriquecer el contexto y evaluar después.
          </DialogDescription>
        </DialogHeader>

        {initiativesQuery.isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : eligible.length === 0 ? (
          <div className="border-border bg-secondary/30 space-y-3 rounded-xl border px-4 py-6 text-center">
            <p className="text-sm font-medium">No hay iniciativas disponibles</p>
            <p className="text-muted-foreground text-xs">
              Registra una iniciativa para poder entrevistarla o evaluarla.
            </p>
            <Button asChild variant="secondary" size="sm">
              <Link href={routes.initiativeNew} onClick={() => setOpen(false)}>
                Crear iniciativa
              </Link>
            </Button>
          </div>
        ) : (
          <ul className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {eligible.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  aria-pressed={selectedId === item.id}
                  className={cn(
                    'focus-visible:ring-ring w-full rounded-xl border px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none',
                    selectedId === item.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border/70 hover:bg-muted/40',
                  )}
                >
                  <p className="text-sm font-medium">{item.nombre || 'Sin nombre'}</p>
                  <p className="text-muted-foreground text-xs">
                    {item.status} · {item.areaProcesoImpactado || 'Sin área'}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}

        {eligible.length > 0 ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="button"
              className="flex-1"
              disabled={!selectedId || startMutation.isPending}
              onClick={() => startMutation.mutate('interview')}
            >
              {startMutation.isPending && startMutation.variables === 'interview'
                ? 'Iniciando entrevista…'
                : 'Iniciar entrevista'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              disabled={!selectedId || startMutation.isPending}
              onClick={() => startMutation.mutate('direct')}
            >
              {startMutation.isPending && startMutation.variables === 'direct'
                ? 'Evaluando…'
                : 'Evaluar ahora'}
            </Button>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
