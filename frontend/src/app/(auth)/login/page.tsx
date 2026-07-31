import type { Metadata } from 'next';
import { LoginForm } from '@/features/auth/components/login-form';

export const metadata: Metadata = {
  title: 'Iniciar sesión',
};

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Entrar</h1>
        <p className="text-sm text-muted-foreground">
          Accede al Comité Virtual de Innovación.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
