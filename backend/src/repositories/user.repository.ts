import type { User } from '@prisma/client';
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
}): Promise<User> {
  return prisma.user.create({
    data: {
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash: input.passwordHash,
    },
  });
}
