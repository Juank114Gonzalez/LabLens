import { Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import {
  createUser,
  deleteUser,
  findUserByEmail,
  findUserById,
  listUsers,
  updateUser,
  updateUserRole,
} from '../repositories/user.repository.js';
import type {
  CreateUserAdminDto,
  UpdateUserAdminDto,
} from '../validators/user-admin.validator.js';
import { AppError } from '../utils/AppError.js';

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: Role;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function listUsersAdmin() {
  return listUsers();
}

export async function createUserAdmin(input: CreateUserAdminDto) {
  const existing = await findUserByEmail(input.email);
  if (existing) {
    throw new AppError('Email already registered', 409);
  }

  const passwordHash = await bcrypt.hash(input.password, 10);
  return toPublicUser(
    await createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
    }),
  );
}

export async function getUserAdmin(id: string) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return toPublicUser(user);
}

export async function changeUserRole(id: string, role: Role, actorId: string) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }

  if (user.id === actorId && role !== Role.ADMIN) {
    throw new AppError('Cannot demote your own admin role', 400);
  }

  return toPublicUser(await updateUserRole(id, role));
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

  if (input.isActive === false && user.id === actorId) {
    throw new AppError('Cannot deactivate your own account', 400);
  }

  const passwordHash = input.password
    ? await bcrypt.hash(input.password, 10)
    : undefined;

  return toPublicUser(
    await updateUser(id, {
      name: input.name,
      email: input.email,
      role: input.role,
      isActive: input.isActive,
      passwordHash,
    }),
  );
}

/** Placeholder for future email-based password reset. */
export async function requestPasswordResetPlaceholder(id: string) {
  const user = await findUserById(id);
  if (!user) {
    throw new AppError('User not found', 404);
  }
  return {
    ok: true,
    message: 'Reset de contraseña pendiente de integración (placeholder)',
    email: user.email,
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
