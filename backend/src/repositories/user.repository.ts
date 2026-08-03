import type { Role, User } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';

export async function findUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

export async function findUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { id } });
}

export async function createUser(input: {
  name: string;
  email: string;
  passwordHash: string;
  role?: Role;
}): Promise<User> {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
      role: input.role,
    },
  });
}

export async function listUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
    },
  });
}

export async function updateUserRole(id: string, role: Role): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: { role },
  });
}

export async function updateUser(
  id: string,
  data: {
    name?: string;
    email?: string;
    passwordHash?: string;
    role?: Role;
    isActive?: boolean;
  },
): Promise<User> {
  return prisma.user.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
      ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
      ...(data.role !== undefined ? { role: data.role } : {}),
      ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
    },
  });
}

export async function deleteUser(id: string): Promise<void> {
  await prisma.user.delete({ where: { id } });
}
