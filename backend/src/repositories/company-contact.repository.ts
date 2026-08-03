import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function createCompanyContact(input: {
  initiativeId: string;
  empresa: string;
  contacto: string;
  cargo: string;
  correo: string;
  telefono: string;
}) {
  return prisma.companyContact.create({ data: input });
}

export async function listCompanyContactsByInitiative(initiativeId: string) {
  return prisma.companyContact.findMany({
    where: { initiativeId },
    orderBy: { createdAt: 'asc' },
  });
}

export async function getCompanyContactOrThrow(id: string) {
  const contact = await prisma.companyContact.findUnique({ where: { id } });
  if (!contact) {
    throw new AppError('Company contact not found', 404);
  }
  return contact;
}

export async function updateCompanyContact(
  id: string,
  data: Partial<{
    empresa: string;
    contacto: string;
    cargo: string;
    correo: string;
    telefono: string;
  }>,
) {
  return prisma.companyContact.update({ where: { id }, data });
}

export async function deleteCompanyContact(id: string) {
  await prisma.companyContact.delete({ where: { id } });
}
