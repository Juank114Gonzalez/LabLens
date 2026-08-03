import { z } from 'zod';
import { companyContactSchema } from './initiative.validator.js';

export const createCompanyContactSchema = companyContactSchema.extend({
  initiativeId: z.string().uuid(),
});

export const updateCompanyContactSchema = companyContactSchema.partial();

export const companyContactIdParamsSchema = z.object({
  id: z.string().uuid('id must be a valid UUID'),
});

export type CreateCompanyContactDto = z.infer<typeof createCompanyContactSchema>;
export type UpdateCompanyContactDto = z.infer<typeof updateCompanyContactSchema>;
export type CompanyContactIdParamsDto = z.infer<typeof companyContactIdParamsSchema>;
