'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Download, Eye, FileStack } from 'lucide-react';
import { toast } from 'sonner';
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
import { canAccessAdmin, canManageInitiatives } from '@/features/auth/lib/roles';
import {
  downloadEvidencesZip,
  listInitiatives,
} from '@/features/initiative/services/initiative.service';
import { INITIATIVE_STATUS_LABELS } from '@/features/initiative/lib/status';
import type { InitiativeStatus } from '@/features/initiative/types';
import { EmptyState } from '@/shared/components/empty-state';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

const STAT_KEYS: InitiativeStatus[] = [
  'REGISTERED',
  'UNDER_REVIEW',
  'EVALUATED',
  'APPROVED',
  'REJECTED',
];

export function DashboardView() {
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const query = useQuery({
    queryKey: ['initiatives'],
    queryFn: listInitiatives,
    enabled: Boolean(role && (canManageInitiatives(role) || role === 'EVALUATOR')),
  });

  const items = query.data ?? [];
  const counts: Record<'total' | InitiativeStatus, number> = {
    total: items.length,
    DRAFT: items.filter((i) => i.status === 'DRAFT').length,
    REGISTERED: 0,
    TRIAGED_LAB: 0,
    TRIAGED_EXTERNAL: 0,
    UNDER_REVIEW: 0,
    EVALUATED: 0,
    APPROVED: 0,
    REJECTED: 0,
    ARCHIVED: 0,
  };
  for (const key of STAT_KEYS) {
    counts[key] = items.filter((i) => i.status === key).length;
  }

  if (role && canAccessAdmin(role)) {
    return (
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6 sm:p-8">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Administración LabLens</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gestiona usuarios, criterios, clasificaciones y mesas de trabajo.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { href: routes.adminUsers, title: 'Usuarios' },
            { href: routes.adminCriteria, title: 'Criterios' },
            { href: routes.adminClassifications, title: 'Clasificaciones' },
            { href: routes.adminWorkTables, title: 'Mesas de trabajo' },
          ].map((card) => (
            <Card key={card.href} className="border-border/70 bg-card/60 shadow-none">
              <CardHeader>
                <CardTitle className="font-heading text-lg">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline">
                  <Link href={card.href}>
                    Abrir
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 sm:p-8">
      <section className="rounded-3xl border border-border/70 bg-card/50 p-6 sm:p-8">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
          {branding.organization}
        </p>
        <h1 className="mt-2 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
          Hola {user?.name?.split(' ')[0] ?? 'innovador'}
        </h1>
        <p className="mt-2 max-w-xl text-sm text-muted-foreground">
          Registra iniciativas de negocio y consulta su estado y evaluaciones.
        </p>
        {role && canManageInitiatives(role) ? (
          <Button asChild className="mt-4 rounded-xl" size="lg">
            <Link href={routes.initiativeNew}>
              Nueva iniciativa
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : null}
      </section>

      <section className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: 'Total', value: counts.total },
          { label: 'Registradas', value: counts.REGISTERED },
          { label: 'En evaluación', value: counts.UNDER_REVIEW },
          { label: 'Evaluadas', value: counts.EVALUATED },
          { label: 'Aprobadas', value: counts.APPROVED },
          { label: 'Rechazadas', value: counts.REJECTED },
        ].map((stat) => (
          <Card key={stat.label} className="border-border/70 bg-card/60 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-2xl font-semibold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-border/70 bg-card/60 shadow-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-heading text-lg">Mis iniciativas</CardTitle>
          <Button asChild variant="outline" size="sm">
            <Link href={routes.initiatives}>Ver todas</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {query.isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : items.length === 0 ? (
            <EmptyState
              title="Sin iniciativas"
              description="Crea tu primera iniciativa para comenzar."
              action={
                <Button asChild>
                  <Link href={routes.initiativeNew}>Nueva iniciativa</Link>
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
                {items.slice(0, 10).map((item) => {
                  const lastEval = item.evaluations?.[0];
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.nombre || 'Sin nombre'}
                      </TableCell>
                      <TableCell>{item.areaProcesoImpactado || '—'}</TableCell>
                      <TableCell>{item.urgencia || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {INITIATIVE_STATUS_LABELS[item.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatShortDate(item.createdAt)}</TableCell>
                      <TableCell>
                        {lastEval
                          ? formatShortDate(lastEval.evaluatedAt ?? lastEval.createdAt)
                          : '—'}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button asChild size="icon-sm" variant="ghost">
                            <Link href={routes.initiative(item.id)} title="Ver detalle">
                              <Eye className="size-3.5" />
                            </Link>
                          </Button>
                          <Button asChild size="icon-sm" variant="ghost">
                            <Link
                              href={routes.initiativeEvaluations(item.id)}
                              title="Ver evaluaciones"
                            >
                              <FileStack className="size-3.5" />
                            </Link>
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            title="Descargar evidencias"
                            onClick={() => {
                              void downloadEvidencesZip(item.id).catch((error: Error) =>
                                toast.error(error.message),
                              );
                            }}
                          >
                            <Download className="size-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
