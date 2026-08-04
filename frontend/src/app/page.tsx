import Link from 'next/link';
import type { Metadata } from 'next';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

        {/* One primary action. Sign-in is back-office access, not an equal choice. */}
        <div className="space-y-3">
          <Button
            asChild
            size="lg"
            className="h-auto w-full max-w-lg rounded-2xl px-8 py-5 text-base sm:text-lg"
          >
            <Link href={routes.submit}>
              Enviar sugerencia de iniciativa
              <ArrowRight className="size-5" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground">
            Para áreas de ACH, organizaciones externas y referencias internacionales. No requiere
            cuenta.
          </p>
        </div>

        <div className="border-t border-border/60 pt-6">
          <p className="text-sm text-muted-foreground">
            ¿Evaluador o administrador del Laboratorio Digital?{' '}
            <Link
              href={routes.login}
              className="font-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
