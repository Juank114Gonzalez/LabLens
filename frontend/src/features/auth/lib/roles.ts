import { routes } from '@/config/routes';
import type { UserRole } from '@/types/auth';

export function homeForRole(role: UserRole): string {
  if (role === 'ADMIN') return routes.admin;
  if (role === 'GENERATOR') return routes.dashboard;
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

export function canManageInitiatives(role: UserRole): boolean {
  return role === 'GENERATOR' || role === 'ADMIN';
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
  if (pathname.startsWith('/initiatives')) {
    return canManageInitiatives(role) || role === 'EVALUATOR';
  }
  return true;
}
