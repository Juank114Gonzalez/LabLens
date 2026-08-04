'use client';

import { useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/api/errors';
import {
  IMPACT_OPTIONS,
  SOURCE_LABELS,
  URGENCY_OPTIONS,
} from '@/features/initiative/lib/status';
import {
  publicInitiativeFormSchema,
  type PublicInitiativeFormValues,
} from '@/features/submit/schemas/public-initiative.schema';
import { submitPublicInitiative } from '@/features/submit/services/submit.service';
import type { PublicSubmissionResult, SourceType } from '@/features/submit/types';

type Props = {
  sourceType: SourceType;
  onBack: () => void;
  onSubmitted: (result: PublicSubmissionResult) => void;
};

function defaultValues(sourceType: SourceType): PublicInitiativeFormValues {
  return {
    sourceType,
    submitterName: '',
    submitterEmail: '',
    diligenciadoPor: '',
    fechaDiligenciamiento: new Date().toISOString().slice(0, 10),
    expectativaSolucion: '',
    nombre: '',
    areaProcesoImpactado: '',
    areaInvolucrada: '',
    urgencia: 'Media',
    impacto: 'Medio',
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

export function PublicInitiativeForm({ sourceType, onBack, onSubmitted }: Props) {
  const [submitting, setSubmitting] = useState(false);
  const isReference = sourceType === 'INTERNATIONAL_REFERENCE';

  const form = useForm<PublicInitiativeFormValues>({
    resolver: zodResolver(publicInitiativeFormSchema) as never,
    defaultValues: defaultValues(sourceType),
    mode: 'onBlur',
  });

  const contacts = useFieldArray({ control: form.control, name: 'companyContacts' });
  const errors = form.formState.errors;

  async function onSubmit(values: PublicInitiativeFormValues) {
    setSubmitting(true);
    try {
      const result = await submitPublicInitiative({
        ...values,
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
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Canal seleccionado
          </p>
          <p className="font-heading text-lg font-medium">{SOURCE_LABELS[sourceType]}</p>
        </div>
        <Button type="button" variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="size-4" />
          Cambiar canal
        </Button>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardHeader>
          <CardTitle>Quién envía</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Field label="Tu nombre" error={errors.submitterName?.message}>
            <Input {...form.register('submitterName')} />
          </Field>
          <Field label="Tu correo" error={errors.submitterEmail?.message}>
            <Input type="email" {...form.register('submitterEmail')} />
          </Field>
          <Field label="Diligenciado por" error={errors.diligenciadoPor?.message}>
            <Input {...form.register('diligenciadoPor')} />
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Urgencia" error={errors.urgencia?.message}>
              <select className={selectClassName} {...form.register('urgencia')}>
                {URGENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Impacto" error={errors.impacto?.message}>
              <select className={selectClassName} {...form.register('impacto')}>
                {IMPACT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
        <CardContent className="space-y-4">
          {contacts.fields.map((field, index) => (
            <div
              key={field.id}
              className="grid gap-3 rounded-xl border border-border/60 p-4 sm:grid-cols-2"
            >
              <Field
                label="Empresa / persona"
                error={errors.companyContacts?.[index]?.empresa?.message}
              >
                <Input {...form.register(`companyContacts.${index}.empresa`)} />
              </Field>
              <Field
                label="Contacto"
                error={errors.companyContacts?.[index]?.contacto?.message}
              >
                <Input {...form.register(`companyContacts.${index}.contacto`)} />
              </Field>
              <Field label="Cargo / rol" error={errors.companyContacts?.[index]?.cargo?.message}>
                <Input {...form.register(`companyContacts.${index}.cargo`)} />
              </Field>
              <Field label="Correo" error={errors.companyContacts?.[index]?.correo?.message}>
                <Input type="email" {...form.register(`companyContacts.${index}.correo`)} />
              </Field>
              <Field label="Teléfono" error={errors.companyContacts?.[index]?.telefono?.message}>
                <Input {...form.register(`companyContacts.${index}.telefono`)} />
              </Field>
              {contacts.fields.length > 1 ? (
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => contacts.remove(index)}
                  >
                    <Trash2 className="size-4" />
                    Quitar
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {errors.companyContacts?.message ? (
            <p className="text-xs text-destructive">{errors.companyContacts.message}</p>
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

const selectClassName =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm';
