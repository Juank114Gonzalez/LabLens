import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .email('Ingresa un correo válido')
    .refine((val) => val.toLowerCase().endsWith('@achcolombia.com.co'), {
      message: 'Debe ser un correo con dominio @achcolombia.com.co',
    }),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
