'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { CatalogItem } from '@/features/admin/services/admin.service';

type Props = {
  title: string;
  description: string;
  queryKey: string;
  list: () => Promise<CatalogItem[]>;
  create: (body: Omit<CatalogItem, 'id'>) => Promise<CatalogItem>;
  update: (id: string, body: Partial<CatalogItem>) => Promise<CatalogItem>;
  remove: (id: string) => Promise<unknown>;
};

const empty = { nombre: '', descripcion: '', promptContext: '', activo: true };

export function CatalogAdminPage({
  title,
  description,
  queryKey,
  list,
  create,
  update,
  remove,
}: Props) {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: [queryKey], queryFn: list });
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [form, setForm] = useState(empty);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editing) return update(editing.id, form);
      return create(form);
    },
    onSuccess: () => {
      toast.success('Guardado');
      setOpen(false);
      setEditing(null);
      setForm(empty);
      void queryClient.invalidateQueries({ queryKey: [queryKey] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm(empty);
            setOpen(true);
          }}
        >
          <Plus className="size-4" />
          Nuevo
        </Button>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Descripción</TableHead>
              <TableHead>Activo</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(query.data ?? []).map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.nombre}</TableCell>
                <TableCell className="max-w-md truncate text-muted-foreground">
                  {item.descripcion}
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{item.activo ? 'Activo' : 'Inactivo'}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditing(item);
                        setForm({
                          nombre: item.nombre,
                          descripcion: item.descripcion,
                          promptContext: item.promptContext,
                          activo: item.activo,
                        });
                        setOpen(true);
                      }}
                    >
                      Editar
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() =>
                        void remove(item.id)
                          .then(() => {
                            toast.success('Eliminado');
                            void queryClient.invalidateQueries({ queryKey: [queryKey] });
                          })
                          .catch((error: Error) => toast.error(error.message))
                      }
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar' : 'Crear'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Descripción</Label>
              <Textarea
                value={form.descripcion}
                onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              />
            </div>
            <div className="space-y-1">
              <Label>Prompt context</Label>
              <Textarea
                value={form.promptContext}
                onChange={(e) => setForm({ ...form, promptContext: e.target.value })}
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={form.activo}
                onCheckedChange={(activo) => setForm({ ...form, activo })}
              />
              <Label>Activo</Label>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
