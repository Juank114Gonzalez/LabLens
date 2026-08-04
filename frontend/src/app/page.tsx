import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight, LogIn } from 'lucide-react';
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { Logo } from '@/shared/components/logo';

export const metadata: Metadata = {
  title: branding.tagline,
  description: branding.description,
};

export default function HomePage() {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-2xl space-y-10 text-center">
        <div className="space-y-3">
          <Logo href={routes.home} className="justify-center" />
          <h1 className="font-heading text-3xl font-semibold sm:text-4xl">{branding.tagline}</h1>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground sm:text-base">
            Envía una iniciativa y recibe en minutos su clasificación y la mesa de trabajo
            responsable. Sin comités, sin esperas de semanas.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Link
            href={routes.submit}
            className="flex flex-col gap-2 rounded-2xl border border-border/70 p-6 text-left transition hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <ArrowRight className="size-5" />
            </span>
            <span className="font-heading text-lg font-medium">Enviar una iniciativa</span>
            <span className="text-sm text-muted-foreground">
              Para áreas de ACH, organizaciones externas y referencias internacionales. No requiere
              cuenta.
            </span>
          </Link>

          <Link
            href={routes.login}
            className="flex flex-col gap-2 rounded-2xl border border-border/70 p-6 text-left transition hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <LogIn className="size-5" />
            </span>
            <span className="font-heading text-lg font-medium">Iniciar sesión</span>
            <span className="text-sm text-muted-foreground">
              Acceso para evaluadores y administradores del Laboratorio Digital.
            </span>
          </Link>
        </div>
      </div>
    </div>
  );
}
