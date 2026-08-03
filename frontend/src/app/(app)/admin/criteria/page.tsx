'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  DndContext,
  closestCenter,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  createCriteria,
  deleteCriteria,
  listCriteria,
  reorderCriteria,
  updateCriteria,
  type CriteriaItem,
} from '@/features/admin/services/admin.service';

export default function AdminCriteriaPage() {
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['admin-criteria'], queryFn: listCriteria });
  const [items, setItems] = useState<CriteriaItem[]>([]);
  const [editing, setEditing] = useState<CriteriaItem | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (query.data) setItems([...query.data].sort((a, b) => a.orden - b.orden));
  }, [query.data]);

  const sum = useMemo(
    () => items.filter((i) => i.activo).reduce((total, item) => total + item.peso, 0),
    [items],
  );

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const saveOrderMutation = useMutation({
    mutationFn: () =>
      reorderCriteria(
        items.map((item, index) => ({
          id: item.id,
          orden: index,
          peso: item.peso,
          activo: item.activo,
        })),
      ),
    onSuccess: () => {
      toast.success('Criterios guardados');
      void queryClient.invalidateQueries({ queryKey: ['admin-criteria'] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setItems((current) => {
      const oldIndex = current.findIndex((item) => item.id === active.id);
      const newIndex = current.findIndex((item) => item.id === over.id);
      return arrayMove(current, oldIndex, newIndex);
    });
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">Criterios de evaluación</h1>
          <p className="text-sm text-muted-foreground">
            Suma de pesos activos: <strong className={sum === 100 ? 'text-primary' : 'text-destructive'}>{sum}%</strong>
          </p>
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            Nuevo
          </Button>
          <Button
            type="button"
            disabled={sum !== 100 || saveOrderMutation.isPending}
            onClick={() => saveOrderMutation.mutate()}
          >
            Guardar orden y pesos
          </Button>
        </div>
      </div>

      {query.isLoading ? (
        <Skeleton className="h-48 w-full" />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {items.map((item, index) => (
                <SortableCriteriaCard
                  key={item.id}
                  item={item}
                  onChange={(patch) =>
                    setItems((current) =>
                      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
                    )
                  }
                  onEdit={() => setEditing(item)}
                  onDelete={() =>
                    void deleteCriteria(item.id)
                      .then(() => {
                        toast.success('Eliminado');
                        void queryClient.invalidateQueries({ queryKey: ['admin-criteria'] });
                      })
                      .catch((error: Error) => toast.error(error.message))
                  }
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      <CriteriaDialog
        open={creating}
        onOpenChange={setCreating}
        title="Nuevo criterio"
        initial={{
          nombre: '',
          descripcion: '',
          promptContext: '',
          peso: 0,
          activo: false,
          orden: items.length,
        }}
        onSubmit={async (values) => {
          await createCriteria(values);
          toast.success('Criterio creado (inactivo hasta ajustar pesos a 100%)');
          void queryClient.invalidateQueries({ queryKey: ['admin-criteria'] });
          setCreating(false);
        }}
      />

      <CriteriaDialog
        open={Boolean(editing)}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Editar criterio"
        initial={editing}
        onSubmit={async (values) => {
          if (!editing) return;
          await updateCriteria(editing.id, values);
          toast.success('Criterio actualizado');
          void queryClient.invalidateQueries({ queryKey: ['admin-criteria'] });
          setEditing(null);
        }}
      />
      </div>
    </div>
  );
}

function SortableCriteriaCard({
  item,
  onChange,
  onEdit,
  onDelete,
}: {
  item: CriteriaItem;
  onChange: (patch: Partial<CriteriaItem>) => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id });
  return (
    <Card
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className="border-border/70 shadow-none"
    >
      <CardHeader className="flex flex-row items-start gap-3 space-y-0">
        <button type="button" className="mt-1 text-muted-foreground" {...attributes} {...listeners}>
          <GripVertical className="size-4" />
        </button>
        <div className="min-w-0 flex-1">
          <CardTitle className="text-base">{item.nombre}</CardTitle>
          <p className="text-xs text-muted-foreground line-clamp-2">{item.descripcion}</p>
        </div>
        <div className="flex items-center gap-2">
          <Switch checked={item.activo} onCheckedChange={(activo) => onChange({ activo })} />
          <Button type="button" size="sm" variant="outline" onClick={onEdit}>
            Editar
          </Button>
          <Button type="button" size="icon-sm" variant="ghost" onClick={onDelete}>
            <Trash2 className="size-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Label className="text-xs">Peso: {item.peso}%</Label>
        <input
          type="range"
          min={0}
          max={100}
          value={item.peso}
          className="mt-2 w-full"
          onChange={(e) => onChange({ peso: Number(e.target.value) })}
        />
      </CardContent>
    </Card>
  );
}

function CriteriaDialog({
  open,
  onOpenChange,
  title,
  initial,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  initial: Omit<CriteriaItem, 'id'> | CriteriaItem | null;
  onSubmit: (values: Omit<CriteriaItem, 'id'>) => Promise<void>;
}) {
  const [values, setValues] = useState(initial);
  useEffect(() => setValues(initial), [initial]);
  if (!values) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label>Nombre</Label>
            <Input
              value={values.nombre}
              onChange={(e) => setValues({ ...values, nombre: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Descripción</Label>
            <Textarea
              value={values.descripcion}
              onChange={(e) => setValues({ ...values, descripcion: e.target.value })}
            />
          </div>
          <div className="space-y-1">
            <Label>Prompt context</Label>
            <Textarea
              value={values.promptContext}
              onChange={(e) => setValues({ ...values, promptContext: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={() =>
              void onSubmit({
                nombre: values.nombre,
                descripcion: values.descripcion,
                promptContext: values.promptContext,
                peso: values.peso,
                activo: values.activo,
                orden: values.orden,
              }).catch((error: Error) => toast.error(error.message))
            }
          >
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
