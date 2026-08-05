'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/features/auth/hooks/use-auth';
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/types/auth.schema';

export function LoginForm() {
  const { login, loginWithMicrosoft, isLoggingIn } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <motion.form
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-5"
      onSubmit={form.handleSubmit((values) => login(values))}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="email">Correo</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          {...form.register('email')}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Contraseña</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          {...form.register('password')}
        />
        {form.formState.errors.password ? (
          <p className="text-xs text-destructive">
            {form.formState.errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" className="w-full" disabled={isLoggingIn}>
        {isLoggingIn ? 'Entrando…' : 'Entrar al Comité'}
      </Button>

      <div className="relative flex py-1 items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="flex-shrink mx-4 text-[10px] text-muted-foreground uppercase tracking-wider">O</span>
        <div className="flex-grow border-t border-border"></div>
      </div>

      <Button
        type="button"
        variant="outline"
        className="w-full gap-2 border-border/80 hover:bg-accent"
        disabled={isLoggingIn}
        onClick={() => loginWithMicrosoft()}
      >
        <svg className="h-4 w-4 shrink-0" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 0H11V11H0V0Z" fill="#F25022"/>
          <path d="M12 0H23V11H12V0Z" fill="#7FBA00"/>
          <path d="M0 12H11V23H0V12Z" fill="#00A4EF"/>
          <path d="M12 12H23V23H12V12Z" fill="#FFB900"/>
        </svg>
        Entrar con Microsoft
      </Button>
    </motion.form>
  );
}

