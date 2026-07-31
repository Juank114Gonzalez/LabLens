import type { Metadata } from 'next';
import { RegisterForm } from '@/features/auth/components/register-form';

export const metadata: Metadata = {
  title: 'Crear cuenta',
};

export default function RegisterPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Crear cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Únete para estructurar y evaluar iniciativas con LabLens.
        </p>
      </div>
      <RegisterForm />
    </div>
  );
}
