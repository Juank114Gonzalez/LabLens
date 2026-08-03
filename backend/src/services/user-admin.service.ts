import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser,
  updateUserRole,
} from '../repositories/user.repository.js';
import type { UpdateUserAdminDto } from '../validators/user-admin.validator.js';
import { AppError } from '../utils/AppError.js';

export async function listUsersAdmin() {
  return listUsers();
}

export async function getUserAdmin(id: string) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function changeUserRole(id: string, role: Role, actorId: string) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.id === actorId && role !== Role.ADMIN) {
    throw new AppError('Cannot demote your own admin role', 400);
  }

  const updated = await updateUserRole(id, role);
  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function updateUserAdmin(
  id: string,
  input: UpdateUserAdminDto,
  actorId: string,
) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (input.email && input.email.toLowerCase() !== user.email) {
    const existing = await findUserByEmail(input.email);
    if (existing) {
      throw new AppError('Email already registered', 409);
    }
  }

  if (input.role && user.id === actorId && input.role !== Role.ADMIN) {
    throw new AppError('Cannot demote your own admin role', 400);
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 10)
    : undefined;

  const updated = await updateUser(id, {
    name: input.name,
    email: input.email,
    role: input.role,
    passwordHash,
  });

  return {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    role: updated.role,
    createdAt: updated.createdAt,
    updatedAt: updated.updatedAt,
  };
}

export async function deleteUserAdmin(id: string, actorId: string) {
  if (id === actorId) {
    throw new AppError('Cannot delete your own account', 400);
  }
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  await deleteUser(id);
}
