import { routes } from '@/config/routes';
import type { UserRole } from '@/types/auth';

/** El rol viaja como identificador interno; solo se traduce al mostrarlo. */
export const ROLE_LABELS: Record<UserRole, string> = {
  EVALUATOR: 'Evaluador',
  ADMIN: 'Administrador',
};

export function roleLabel(role: string | undefined): string {
  if (!role) return '';
  return ROLE_LABELS[role as UserRole] ?? role;
}

export function homeForRole(role: UserRole): string {
  if (role === 'ADMIN') return routes.admin;
  return routes.dashboard;
}

export function canAccessChat(role: UserRole): boolean {
  return role === 'EVALUATOR' || role === 'ADMIN';
}

export function canAccessEvaluations(role: UserRole): boolean {
  return role === 'EVALUATOR' || role === 'ADMIN';
}

export function canAccessAdmin(role: UserRole): boolean {
  return role === 'ADMIN';
}

/** Both remaining roles work initiatives; only admins delete beyond drafts. */
export function canManageInitiatives(role: UserRole): boolean {
  return role === 'EVALUATOR' || role === 'ADMIN';
}

export function isPathAllowedForRole(pathname: string, role: UserRole): boolean {
  if (pathname.startsWith('/admin')) {
    return canAccessAdmin(role);
  }
  if (pathname.startsWith('/chat')) {
    return canAccessChat(role);
  }
  if (pathname.startsWith('/evaluations')) {
    return canAccessEvaluations(role);
  }
  return true;
}
