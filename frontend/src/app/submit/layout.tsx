import { branding } from '@/config/branding';
import { routes } from '@/config/routes';
import { Logo } from '@/shared/components/logo';

export default function SubmitLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-svh overflow-y-auto px-4 py-10">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative mx-auto w-full max-w-3xl space-y-8">
        <div className="space-y-2 text-center">
          <Logo href={routes.home} className="justify-center" />
          <p className="text-sm text-muted-foreground">{branding.description}</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
