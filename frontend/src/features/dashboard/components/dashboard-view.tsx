'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { ShareBar } from '@/features/dashboard/components/charts/share-bar';
import { StatTile } from '@/features/dashboard/components/charts/stat-tile';
import { TrendLines } from '@/features/dashboard/components/charts/trend-lines';
import { colorForClassification } from '@/features/dashboard/lib/viz';
import { getInitiativeStats } from '@/features/dashboard/services/stats.service';
import { listInitiatives } from '@/features/initiative/services/initiative.service';
import { EmptyState } from '@/shared/components/empty-state';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

export function DashboardView() {
  const user = useAuthStore((state) => state.user);

  const stats = useQuery({
    queryKey: ['initiative-stats'],
    queryFn: getInitiativeStats,
  });

  const inbox = useQuery({
    queryKey: ['initiatives', { status: ['TRIAGED_LAB'] }],
    queryFn: () => listInitiatives({ status: ['TRIAGED_LAB'] }),
  });

  const data = stats.data;
  const delta = data ? data.currentWindow - data.previousWindow : 0;
  const inboxItems = (inbox.data ?? []).slice(0, 5);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 sm:p-8">
      <section className="border-border/70 bg-card/50 rounded-3xl border p-6 sm:p-8">
        <p className="text-primary text-xs font-medium tracking-[0.2em] uppercase">
          {branding.organization}
        </p>
        <h1 className="font-heading mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          Hola {user?.name?.split(' ')[0] ?? 'evaluador'}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-xl text-sm">
          Estado del portafolio de iniciativas: qué llega, cómo se está clasificando y qué
          espera evaluación en el Laboratorio.
        </p>
        <Button asChild className="mt-4 rounded-xl" size="lg">
          <Link href={routes.inbox}>
            Ir a la bandeja del Lab
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </section>

      {stats.isLoading || !data ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Iniciativas recibidas"
            value={data.total}
            hint="Histórico completo"
          />
          <StatTile
            label={`Últimos ${data.windowDays} días`}
            value={data.currentWindow}
            delta={{ value: delta, period: `vs. ${data.windowDays} días previos` }}
          />
          <StatTile
            label="En bandeja del Lab"
            value={data.labInboxPending}
            hint="Esperando evaluación completa"
          />
          <StatTile
            label="Clasificadas por el triage"
            value={data.byClassification.reduce((sum, item) => sum + item.count, 0)}
            hint="Con categoría asignada automáticamente"
          />
        </section>
      )}

      {/* Una sola columna desde que se ocultó la tarjeta de canal: con
          `lg:grid-cols-2` la clasificación quedaba a media pantalla y el resto
          vacío. Volver a dos columnas si el canal regresa. */}
      <section className="grid gap-4">
        <Card className="border-border/70 bg-card/60 shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg">
              Distribución por clasificación
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.isLoading || !data ? (
              <Skeleton className="h-32 w-full" />
            ) : (
              <ShareBar
                segments={data.byClassification.map((item) => ({
                  key: item.id,
                  label: item.nombre,
                  value: item.count,
                  color: colorForClassification(item.nombre),
                }))}
                emptyLabel="Todavía ninguna iniciativa pasó por el triage."
              />
            )}
          </CardContent>
        </Card>

        {/* Tarjeta «Canal de origen» oculta: el formulario público dejó de
            preguntar el canal, así que todo entra como INTERNAL y la gráfica
            sería una sola barra. `data.bySource` sigue llegando de la API. */}
      </section>

      <Card className="border-border/70 bg-card/60 shadow-none">
        <CardHeader>
          <CardTitle className="font-heading text-lg">
            Iniciativas recibidas por día
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.isLoading || !data ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <TrendLines points={data.timeline} />
          )}
        </CardContent>
      </Card>

      <Card className="border-border/70 bg-card/60 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">
            Últimas en la bandeja del Lab
          </CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.inbox}>Ver bandeja</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {inbox.isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : inboxItems.length === 0 ? (
            <EmptyState
              title="Bandeja vacía"
              description="No hay iniciativas disruptivas o adyacentes esperando evaluación."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Clasificación</TableHead>
                  <TableHead>Triage</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {inboxItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.nombre || 'Sin nombre'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {item.triageClassification?.nombre ?? 'Sin clasificar'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.triagedAt ? formatShortDate(item.triagedAt) : '—'}
                    </TableCell>
                    <TableCell>
                      <Button asChild size="sm" variant="outline">
                        <Link href={routes.initiative(item.id)}>Evaluar</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
