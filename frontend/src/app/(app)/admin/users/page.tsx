'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  deleteUser,
  listUsers,
  resetPassword,
  updateUser,
  updateUserRole,
  type AdminUser,
} from '@/features/admin/services/admin.service';
import type { UserRole } from '@/types/auth';
import { formatShortDate } from '@/shared/lib/dates';
import { useAuthStore } from '@/stores/auth.store';

const ROLES: UserRole[] = ['GENERATOR', 'EVALUATOR', 'ADMIN'];

export default function AdminUsersPage() {
  const queryClient = useQueryClient();
  const currentUserId = useAuthStore((state) => state.user?.id);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const query = useQuery({ queryKey: ['admin-users'], queryFn: listUsers });

  const filtered = useMemo(() => {
    const items = query.data ?? [];
    return items.filter((user) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [query.data, search, roleFilter]);

  const roleMutation = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) => updateUserRole(id, role),
    onSuccess: () => {
      toast.success('Rol actualizado');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      updateUser(id, { isActive }),
    onSuccess: () => {
      toast.success('Estado actualizado');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      toast.success('Usuario eliminado');
      void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="mx-auto flex h-full min-h-0 w-full max-w-6xl flex-col gap-6 overflow-y-auto p-6 sm:p-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Administra roles, acceso y eliminaciones.</p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          className="max-w-xs"
          placeholder="Buscar nombre o correo"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="h-9 rounded-lg border border-input bg-transparent px-3 text-sm"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="ALL">Todos los roles</option>
          {ROLES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Correo</TableHead>
              <TableHead>Rol</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Creado</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((user: AdminUser) => (
              <TableRow key={user.id}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  <select
                    className="h-8 rounded-md border border-input bg-transparent px-2 text-sm"
                    value={user.role}
                    onChange={(e) =>
                      roleMutation.mutate({ id: user.id, role: e.target.value as UserRole })
                    }
                  >
                    {ROLES.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={user.isActive}
                      onCheckedChange={(isActive) =>
                        activeMutation.mutate({ id: user.id, isActive })
                      }
                    />
                    <Badge variant="secondary">{user.isActive ? 'Activo' : 'Inactivo'}</Badge>
                  </div>
                </TableCell>
                <TableCell>{formatShortDate(user.createdAt)}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        void resetPassword(user.id)
                          .then((result) => toast.message(result.message))
                          .catch((error: Error) => toast.error(error.message))
                      }
                    >
                      Resetear contraseña
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={user.id === currentUserId || deleteMutation.isPending}
                      onClick={() => {
                        if (user.id === currentUserId) return;
                        const ok = window.confirm(
                          `¿Eliminar al usuario ${user.name}? Se borrarán también sus iniciativas asociadas.`,
                        );
                        if (ok) deleteMutation.mutate(user.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                      Eliminar
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
