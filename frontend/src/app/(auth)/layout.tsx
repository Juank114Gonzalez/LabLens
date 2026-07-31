import { Logo } from '@/shared/components/logo';
import { branding } from '@/config/branding';
import { routes } from '@/config/routes';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-svh items-center justify-center px-4 py-10">
      <div className="lab-grid pointer-events-none absolute inset-0 opacity-30" />
      <div className="relative w-full max-w-md space-y-8">
        <div className="space-y-3 text-center">
          <Logo href={routes.login} className="justify-center" />
          <p className="text-sm text-muted-foreground">{branding.description}</p>
        </div>
        <div className="glass-panel rounded-3xl p-6 sm:p-8">{children}</div>
      </div>
    </div>
  );
}
