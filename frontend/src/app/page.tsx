import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { AchLogo } from '@/shared/components/ach-logo';
import { HeroNetwork } from '@/features/submit/components/hero-network';

export const metadata: Metadata = {
  title: branding.tagline,
  description: branding.description,
};

export default function HomePage() {
  return (
    <div className="relative flex min-h-svh flex-col overflow-hidden px-5 pb-12 pt-6">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-40" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-linear-to-t from-background to-transparent"
      />

      {/* La marca institucional abre la página, así que va más grande que en el
          resto del producto (donde `AchLogo` usa su h-8 por defecto). */}
      <header className="relative flex justify-center">
        <AchLogo className="h-12 sm:h-14" />
      </header>

      <main className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 py-10 text-center">
        <div className="space-y-5">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 text-sm font-medium">
            <span aria-hidden className="size-1.5 rounded-full bg-lab" />
            Lente de <span className="-ml-1 text-lab">Innovación</span>
          </span>

          <h1 className="font-heading text-4xl font-semibold leading-tight tracking-tight text-balance sm:text-5xl">
            Comité Virtual del <span className="text-lab">Laboratorio Digital</span>
          </h1>

          <p className="text-base text-muted-foreground">
            ¡Cuéntanos tu idea y ayúdanos a innovar!
          </p>
        </div>

        <HeroNetwork className="w-full max-w-sm" />

        {/* Una sola acción principal. El acceso de evaluadores es back-office,
            no una alternativa equivalente. */}
        <div className="w-full space-y-3">
          <Button
            asChild
            size="lg"
            className="cta-glow h-auto w-full rounded-2xl py-5 text-base font-semibold"
          >
            <Link href={routes.submit}>
              Dar mi idea
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">Para áreas de ACH Colombia.</p>
        </div>

        <div className="w-full border-t border-border pt-6">
          <p className="text-sm text-muted-foreground">
            ¿Evaluador o administrador del Laboratorio Digital?
          </p>
          <Link
            href={routes.login}
            className="mt-1.5 inline-flex items-center gap-1.5 rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Iniciar sesión
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </main>
    </div>
  );
}
