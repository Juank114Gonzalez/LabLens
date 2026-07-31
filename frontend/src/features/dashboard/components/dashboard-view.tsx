'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, FlaskConical, MessagesSquare, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { EmptyState } from '@/shared/components/empty-state';
import { StatusBadge } from '@/shared/components/status-badge';
import { formatShortDate } from '@/shared/lib/dates';
import { useConversationMetaStore } from '@/stores/conversation-meta.store';
import { useAuthStore } from '@/stores/auth.store';

export function DashboardView() {
  const user = useAuthStore((state) => state.user);
  const items = useConversationMetaStore((state) => state.items);

  const recent = [...items]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 6);
  const evaluations = recent.filter((item) => item.status === 'COMPLETED');

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-6 sm:p-8">
      <motion.section
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/50 p-6 sm:p-8"
      >
        <div className="lab-grid pointer-events-none absolute inset-0 opacity-40" />
        <div className="relative max-w-2xl space-y-3">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">
            {branding.organization}
          </p>
          <h1 className="font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Hola {user?.name?.split(' ')[0] ?? 'innovador'}, bienvenido al Comité Virtual
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            LabLens entrevista, estructura y evalúa iniciativas. Aquí construyes el caso —
            no solo chateas.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg" className="rounded-xl">
              <Link href={routes.chatNew}>
                Nueva iniciativa
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="rounded-xl">
              <Link href={routes.evaluations}>Ver evaluaciones</Link>
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="grid gap-4 md:grid-cols-3">
        {[
          {
            title: 'Mis iniciativas',
            value: String(items.length),
            icon: FlaskConical,
            hint: 'Conversaciones activas o finalizadas',
          },
          {
            title: 'Mis conversaciones',
            value: String(items.length),
            icon: MessagesSquare,
            hint: 'Historial local sincronizado con el backend al abrir',
          },
          {
            title: 'Evaluaciones',
            value: String(evaluations.length),
            icon: Sparkles,
            hint: 'Solo aparecen cuando LabLens completa el análisis',
          },
        ].map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index }}
          >
            <Card className="border-border/70 bg-card/60 shadow-none">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className="size-4 text-primary" />
              </CardHeader>
              <CardContent>
                <p className="font-heading text-3xl font-semibold">{card.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{card.hint}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 bg-card/60 shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.length === 0 ? (
              <EmptyState
                title="Sin actividad todavía"
                description="Crea una iniciativa para iniciar la entrevista con LabLens."
                action={
                  <Button asChild>
                    <Link href={routes.chatNew}>Nueva iniciativa</Link>
                  </Button>
                }
              />
            ) : (
              recent.map((item) => (
                <Link
                  key={item.id}
                  href={routes.chat(item.id)}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/60 px-3 py-3 transition-colors hover:bg-accent/40"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {formatShortDate(item.updatedAt)} · {item.completion}%
                    </p>
                  </div>
                  <StatusBadge status={item.status} />
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60 shadow-none">
          <CardHeader>
            <CardTitle className="font-heading text-lg">Evaluaciones recientes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {evaluations.length === 0 ? (
              <EmptyState
                title="Aún no hay evaluaciones"
                description="Cuando una conversación alcance suficiente información, verás aquí el resultado."
              />
            ) : (
              evaluations.map((item) => (
                <Link
                  key={item.id}
                  href={routes.evaluation(item.id)}
                  className="block rounded-xl border border-border/60 px-3 py-3 transition-colors hover:bg-accent/40"
                >
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Finalizada · {formatShortDate(item.updatedAt)}
                  </p>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
