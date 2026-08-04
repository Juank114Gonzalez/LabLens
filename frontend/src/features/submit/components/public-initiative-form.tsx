'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getErrorMessage } from '@/api/errors';
import { SOURCE_LABELS, URGENCY_OPTIONS } from '@/features/initiative/lib/status';
import {
  publicInitiativeFormSchema,
  type PublicInitiativeFormValues,
} from '@/features/submit/schemas/public-initiative.schema';
import { submitPublicInitiative } from '@/features/submit/services/submit.service';
import type { PublicSubmissionResult, SourceType } from '@/features/submit/types';

type Props = {
  defaultSourceType: SourceType;
  onSubmitted: (result: PublicSubmissionResult) => void;
};

const SOURCE_HINTS: Record<SourceType, string> = {
  INTERNAL: 'Operaciones, Negocio, Riesgos, TI o Canales Digitales enviando una necesidad propia.',
  EXTERNAL_CONTRACTOR: 'Proveedores, aliados o contractors con acceso al Laboratorio Digital.',
  INTERNATIONAL_REFERENCE:
    'Un benchmark visto en un congreso, simposio o publicación que vale la pena replicar.',
};

const selectClassName =
  'flex h-9 w-full cursor-pointer rounded-lg border border-input bg-transparent px-3 text-sm';

function defaultValues(sourceType: SourceType): PublicInitiativeFormValues {
  return {
    sourceType,
    submitterName: '',
    submitterEmail: '',
    fechaDiligenciamiento: new Date().toISOString().slice(0, 10),
    expectativaSolucion: '',
    nombre: '',
    areaProcesoImpactado: '',
    areaInvolucrada: '',
    urgencia: 'Media',
    impacto: '',
    necesidad: '',
    porQueAhora: '',
    paraQue: '',
    comoSeResuelveHoy: '',
    referenceOrganization: '',
    referenceEvent: '',
    referenceLink: '',
    referenceRationale: '',
    companyContacts: [{ empresa: '', contacto: '', cargo: '', correo: '', telefono: '' }],
  };
}

export function PublicInitiativeForm({ defaultSourceType, onSubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PublicInitiativeFormValues>({
    resolver: zodResolver(publicInitiativeFormSchema) as never,
    defaultValues: defaultValues(defaultSourceType),
    mode: 'onBlur',
  });

  const sourceType = form.watch('sourceType');
  const isReference = sourceType === 'INTERNATIONAL_REFERENCE';

  const contacts = useFieldArray({ control: form.control, name: 'companyContacts' });
  const errors = form.formState.errors;

  async function onSubmit(values: PublicInitiativeFormValues) {
    setSubmitting(true);
    try {
      const result = await submitPublicInitiative({
        ...values,
        diligenciadoPor: values.submitterName,
        fechaDiligenciamiento: new Date(values.fechaDiligenciamiento).toISOString(),
        referenceOrganization: isReference ? values.referenceOrganization : undefined,
        referenceEvent: isReference ? values.referenceEvent : undefined,
        referenceLink: isReference ? values.referenceLink : undefined,
        referenceRationale: isReference ? values.referenceRationale : undefined,
      });
      onSubmitted(result);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo enviar la iniciativa'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      className="space-y-6"
      onSubmit={form.handleSubmit(onSubmit, () =>
        toast.error('Revisa los campos obligatorios antes de enviar'),
      )}
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold">Envía tu iniciativa</h1>
        <p className="text-sm text-muted-foreground">
          El Comité Virtual la analiza y te dice a qué mesa de trabajo corresponde. No necesitas
          crear una cuenta.
        </p>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Quién envía</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Field label="Canal de origen" error={errors.sourceType?.message}>
              <select className={selectClassName} {...form.register('sourceType')}>
                {(Object.keys(SOURCE_LABELS) as SourceType[]).map((source) => (
                  <option key={source} value={source}>
                    {SOURCE_LABELS[source]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">{SOURCE_HINTS[sourceType]}</p>
            </Field>
          </div>
          <Field label="Tu nombre" error={errors.submitterName?.message}>
            <Input
              placeholder="Quien diligencia este formulario"
              {...form.register('submitterName')}
            />
          </Field>
          <Field label="Tu correo" error={errors.submitterEmail?.message}>
            <Input type="email" {...form.register('submitterEmail')} />
          </Field>
          <Field label="Fecha de diligenciamiento" error={errors.fechaDiligenciamiento?.message}>
            <Input type="date" {...form.register('fechaDiligenciamiento')} />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Expectativa de la solución" error={errors.expectativaSolucion?.message}>
              <Textarea rows={4} {...form.register('expectativaSolucion')} />
            </Field>
          </div>
        </CardContent>
      </Card>

      {isReference ? (
        <Card className="border-border/70 shadow-none">
          <CardHeader>
            <CardTitle>Referencia internacional</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <Field label="Organización" error={errors.referenceOrganization?.message}>
              <Input placeholder="SWIFT, Pix, FedNow…" {...form.register('referenceOrganization')} />
            </Field>
            <Field label="Evento o congreso" error={errors.referenceEvent?.message}>
              <Input placeholder="Sibos 2026, Money20/20…" {...form.register('referenceEvent')} />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Enlace" error={errors.referenceLink?.message}>
                <Input placeholder="https://…" {...form.register('referenceLink')} />
              </Field>
            </div>
            <div className="sm:col-span-2">
              <Field
                label="¿Por qué es un benchmark relevante para ACH?"
                error={errors.referenceRationale?.message}
              >
                <Textarea rows={3} {...form.register('referenceRationale')} />
              </Field>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Solicitud</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Nombre de la iniciativa" error={errors.nombre?.message}>
            <Input {...form.register('nombre')} />
          </Field>
          <Field label="Área / proceso impactado" error={errors.areaProcesoImpactado?.message}>
            <Input {...form.register('areaProcesoImpactado')} />
          </Field>
          <Field label="Áreas a involucrar" error={errors.areaInvolucrada?.message}>
            <Input {...form.register('areaInvolucrada')} />
          </Field>
          <Field label="Urgencia" error={errors.urgencia?.message}>
            <select className={selectClassName} {...form.register('urgencia')}>
              {URGENCY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>
          <div className="sm:col-span-2">
            <Field label="Impacto" error={errors.impacto?.message}>
              <Textarea
                rows={2}
                placeholder="Describe el impacto esperado (negocio, usuarios, operación…)"
                {...form.register('impacto')}
              />
            </Field>
          </div>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Compuerta mínima</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Field label="¿Qué necesita? (dolor o necesidad común)" error={errors.necesidad?.message}>
            <Textarea rows={3} {...form.register('necesidad')} />
          </Field>
          <Field label="¿Por qué ahora?" error={errors.porQueAhora?.message}>
            <Textarea rows={3} {...form.register('porQueAhora')} />
          </Field>
          <Field label="¿Para qué? (resultado esperado)" error={errors.paraQue?.message}>
            <Textarea rows={3} {...form.register('paraQue')} />
          </Field>
          <Field label="¿Cómo se resuelve hoy?" error={errors.comoSeResuelveHoy?.message}>
            <Textarea rows={3} {...form.register('comoSeResuelveHoy')} />
          </Field>
        </CardContent>
      </Card>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle>Empresas o contactos que reportan el dolor</CardTitle>
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
            Agregar
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Correo</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {contacts.fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell>
                    <Input
                      placeholder="Empresa"
                      aria-label="Empresa"
                      {...form.register(`companyContacts.${index}.empresa`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Contacto"
                      aria-label="Contacto"
                      {...form.register(`companyContacts.${index}.contacto`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Cargo"
                      aria-label="Cargo"
                      {...form.register(`companyContacts.${index}.cargo`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="email"
                      placeholder="Correo"
                      aria-label="Correo"
                      {...form.register(`companyContacts.${index}.correo`)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      placeholder="Teléfono"
                      aria-label="Teléfono"
                      {...form.register(`companyContacts.${index}.telefono`)}
                    />
                  </TableCell>
                  <TableCell>
                    {contacts.fields.length > 1 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Quitar contacto"
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
          {errors.companyContacts?.message ? (
            <p className="mt-2 text-xs text-destructive">{errors.companyContacts.message}</p>
          ) : null}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Al enviar, el Comité Virtual clasifica tu iniciativa y te muestra a qué mesa fue enrutada.
        </p>
        <Button type="submit" size="lg" disabled={submitting}>
          {submitting ? 'Analizando iniciativa…' : 'Enviar iniciativa'}
        </Button>
      </div>
    </form>
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
