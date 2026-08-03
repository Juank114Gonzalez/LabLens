'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { routes } from '@/config/routes';
import {
  deleteAttachment,
  registerInitiative,
  saveDraft,
  uploadAttachment,
} from '@/features/initiative/services/initiative.service';
import {
  draftFormSchema,
  initiativeFormSchema,
  type InitiativeFormValues,
} from '@/features/initiative/schemas/initiative-form.schema';
import { formatBytes, IMPACT_OPTIONS, URGENCY_OPTIONS } from '@/features/initiative/lib/status';
import type { Attachment, DomainInitiative } from '@/features/initiative/types';
import { useAuthStore } from '@/stores/auth.store';

const STEPS = [
  { id: 'general', label: 'General' },
  { id: 'solicitud', label: 'Solicitud' },
  { id: 'compuerta', label: 'Compuerta' },
  { id: 'contactos', label: 'Contactos' },
  { id: 'evidencias', label: 'Evidencias' },
  { id: 'confirmacion', label: 'Confirmación' },
] as const;

type Props = {
  initiative: DomainInitiative;
};

function toFormValues(initiative: DomainInitiative, userName: string): InitiativeFormValues {
  return {
    diligenciadoPor: initiative.diligenciadoPor || userName,
    fechaDiligenciamiento: initiative.fechaDiligenciamiento?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    expectativaSolucion: initiative.expectativaSolucion || '',
    nombre: initiative.nombre || '',
    areaProcesoImpactado: initiative.areaProcesoImpactado || '',
    areaInvolucrada: initiative.areaInvolucrada || '',
    urgencia: (initiative.urgencia as InitiativeFormValues['urgencia']) || 'Media',
    impacto: (initiative.impacto as InitiativeFormValues['impacto']) || 'Medio',
    necesidad: initiative.necesidad || '',
    porQueAhora: initiative.porQueAhora || '',
    paraQue: initiative.paraQue || '',
    comoSeResuelveHoy: initiative.comoSeResuelveHoy || '',
    companyContacts:
      initiative.companyContacts.length > 0
        ? initiative.companyContacts.map((c) => ({
            empresa: c.empresa,
            contacto: c.contacto,
            cargo: c.cargo,
            correo: c.correo,
            telefono: c.telefono,
          }))
        : [{ empresa: '', contacto: '', cargo: '', correo: '', telefono: '' }],
  };
}

export function InitiativeFormWizard({ initiative }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const locked = initiative.status !== 'DRAFT';
  const [step, setStep] = useState<string>('general');
  const [attachments, setAttachments] = useState<Attachment[]>(initiative.attachments ?? []);
  const [saving, setSaving] = useState(false);
  const [registering, setRegistering] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const skipFirst = useRef(true);

  const form = useForm<InitiativeFormValues>({
    // Draft allows empty fields; full validation runs on register.
    resolver: zodResolver(draftFormSchema) as never,
    defaultValues: toFormValues(initiative, user?.name ?? ''),
    mode: 'onChange',
  });

  const contacts = useFieldArray({ control: form.control, name: 'companyContacts' });
  const values = form.watch();

  const payload = useMemo(
    () => ({
      ...values,
      fechaDiligenciamiento: values.fechaDiligenciamiento
        ? new Date(values.fechaDiligenciamiento).toISOString()
        : undefined,
      companyContacts: values.companyContacts.filter(
        (c) => c.empresa || c.contacto || c.correo,
      ),
    }),
    [values],
  );

  useEffect(() => {
    if (locked) return;
    if (skipFirst.current) {
      skipFirst.current = false;
      return;
    }
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSaving(true);
      void saveDraft(initiative.id, payload)
        .then(() => queryClient.invalidateQueries({ queryKey: ['initiatives'] }))
        .catch((error: Error) => toast.error(error.message || 'No se pudo guardar'))
        .finally(() => setSaving(false));
    }, 1500);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [payload, initiative.id, locked, queryClient]);

  async function handleRegister() {
    const parsed = initiativeFormSchema.safeParse(values);
    if (!parsed.success) {
      toast.error('Completa todos los campos obligatorios antes de registrar');
      setStep('general');
      return;
    }
    if (attachments.length === 0) {
      toast.error('Debes adjuntar al menos una evidencia');
      setStep('evidencias');
      return;
    }
    setRegistering(true);
    try {
      await saveDraft(initiative.id, payload);
      await registerInitiative(initiative.id);
      toast.success('Iniciativa registrada');
      await queryClient.invalidateQueries({ queryKey: ['initiatives'] });
      router.replace(routes.initiative(initiative.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo registrar');
    } finally {
      setRegistering(false);
    }
  }

  async function onUpload(fileList: FileList | null) {
    if (!fileList?.length || locked) return;
    try {
      for (const file of Array.from(fileList)) {
        const uploaded = await uploadAttachment(initiative.id, file);
        setAttachments((prev) => [uploaded, ...prev]);
      }
      toast.success('Archivo subido');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al subir');
    }
  }

  async function onDeleteAttachment(id: string) {
    try {
      await deleteAttachment(id);
      setAttachments((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'No se pudo eliminar');
    }
  }

  return (
    <div className="h-full min-h-0 overflow-y-auto p-6 sm:p-8">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">
            {locked ? 'Iniciativa (solo lectura)' : 'Nueva iniciativa'}
          </h1>
          <p className="text-sm text-muted-foreground">
            {saving ? 'Guardando borrador…' : locked ? 'Registrada — no editable' : 'Autoguardado activo'}
          </p>
        </div>
      </div>

      <Tabs value={step} onValueChange={setStep}>
        <TabsList className="flex h-auto w-full flex-wrap justify-start gap-1">
          {STEPS.map((item) => (
            <TabsTrigger key={item.id} value={item.id}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle>Información general</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Diligenciado por" error={form.formState.errors.diligenciadoPor?.message}>
                <Input disabled={locked} {...form.register('diligenciadoPor')} />
              </Field>
              <Field label="Fecha" error={form.formState.errors.fechaDiligenciamiento?.message}>
                <Input type="date" disabled={locked} {...form.register('fechaDiligenciamiento')} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Expectativa de solución" error={form.formState.errors.expectativaSolucion?.message}>
                  <Textarea rows={5} disabled={locked} {...form.register('expectativaSolucion')} />
                </Field>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="solicitud" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle>Solicitud</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre" error={form.formState.errors.nombre?.message}>
                <Input disabled={locked} {...form.register('nombre')} />
              </Field>
              <Field label="Área / proceso impactado">
                <Input disabled={locked} {...form.register('areaProcesoImpactado')} />
              </Field>
              <Field label="Área involucrada">
                <Input disabled={locked} {...form.register('areaInvolucrada')} />
              </Field>
              <Field label="Urgencia">
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  disabled={locked}
                  {...form.register('urgencia')}
                >
                  {URGENCY_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Impacto">
                <select
                  className="flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm"
                  disabled={locked}
                  {...form.register('impacto')}
                >
                  {IMPACT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </Field>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compuerta" className="mt-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle>Compuerta mínima</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {(
                [
                  ['necesidad', '¿Qué necesita?'],
                  ['porQueAhora', '¿Por qué ahora?'],
                  ['paraQue', '¿Para qué?'],
                  ['comoSeResuelveHoy', '¿Cómo se resuelve hoy?'],
                ] as const
              ).map(([name, label]) => (
                <Field key={name} label={label}>
                  <Textarea rows={3} disabled={locked} {...form.register(name)} />
                </Field>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contactos" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-lg font-medium">Empresas / Contactos</h2>
            {!locked ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  contacts.append({
                    empresa: '',
                    contacto: '',
                    cargo: '',
                    correo: '',
                    telefono: '',
                  })
                }
              >
                <Plus className="size-4" />
                Agregar fila
              </Button>
            ) : null}
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.fields.map((field, index) => (
                <TableRow key={field.id}>
                  {(['empresa', 'contacto', 'cargo', 'correo', 'telefono'] as const).map((key) => (
                    <TableCell key={key}>
                      <Input disabled={locked} {...form.register(`companyContacts.${index}.${key}`)} />
                    </TableCell>
                  ))}
                  <TableCell>
                    {!locked ? (
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => contacts.remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4 space-y-3">
          {!locked ? (
            <Label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/80 px-4 py-6 text-sm">
              <Upload className="size-4" />
              Subir PDF, DOCX, XLSX, PNG o JPG
              <input
                type="file"
                className="hidden"
                accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,image/*"
                multiple
                onChange={(event) => void onUpload(event.target.files)}
              />
            </Label>
          ) : null}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Peso</TableHead>
                <TableHead>Vista previa</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {attachments.map((file) => (
                <TableRow key={file.id}>
                  <TableCell>{file.originalName}</TableCell>
                  <TableCell>{file.mimeType}</TableCell>
                  <TableCell>{formatBytes(file.size)}</TableCell>
                  <TableCell>
                    {file.mimeType.startsWith('image/') ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={file.secureUrl} alt="" className="h-12 rounded object-cover" />
                    ) : (
                      <a className="text-primary underline" href={file.secureUrl} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    )}
                  </TableCell>
                  <TableCell>
                    {!locked ? (
                      <Button type="button" size="icon-sm" variant="ghost" onClick={() => void onDeleteAttachment(file.id)}>
                        <Trash2 className="size-3.5" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="confirmacion" className="mt-4 space-y-4">
          <Card className="border-border/70 shadow-none">
            <CardHeader>
              <CardTitle>Resumen</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Nombre:</strong> {values.nombre || '—'}</p>
              <p><strong>Área impactada:</strong> {values.areaProcesoImpactado || '—'}</p>
              <p><strong>Urgencia / Impacto:</strong> {values.urgencia} / {values.impacto}</p>
              <p><strong>Contactos:</strong> {values.companyContacts.length}</p>
              <p><strong>Evidencias:</strong> {attachments.length}</p>
              <p className="text-muted-foreground">{values.expectativaSolucion}</p>
            </CardContent>
          </Card>
          {!locked ? (
            <Button size="lg" disabled={registering} onClick={() => void handleRegister()}>
              {registering ? 'Registrando…' : 'Registrar iniciativa'}
            </Button>
          ) : null}
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
