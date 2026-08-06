'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowRight,
  Building2,
  ChevronDown,
  Info,
  Lightbulb,
  Paperclip,
  Plus,
  Target,
  Upload,
  User,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getErrorMessage } from '@/api/errors';
import { formatBytes, SOURCE_LABELS, URGENCY_OPTIONS } from '@/features/initiative/lib/status';
import {
  publicInitiativeFormSchema,
  type PublicInitiativeFormValues,
} from '@/features/submit/schemas/public-initiative.schema';
import { submitPublicInitiative } from '@/features/submit/services/submit.service';
import { routes } from '@/config/routes';
import type { PublicSubmissionResult, SourceType } from '@/features/submit/types';
import {
  SubmitWizardShell,
  TOTAL_STEPS,
} from '@/features/submit/components/submit-wizard-shell';
import { cn } from '@/lib/utils';

const ACCEPTED_EVIDENCE =
  '.pdf,.docx,.xlsx,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/** Espejo de ALLOWED_ATTACHMENT_MIME_TYPES en el backend (cloudinary.service.ts). */
const EVIDENCE_TYPES = ['PDF', 'DOCX', 'XLSX', 'PNG', 'JPG'] as const;

const MAX_EVIDENCE_FILES = 10;
const MAX_EVIDENCE_BYTES = 15 * 1024 * 1024;

/** Chips de "Áreas a involucrar". Se serializan a `areaInvolucrada` (texto, máx 255). */
const AREA_OPTIONS = [
  'Tecnología',
  'Operaciones',
  'Finanzas',
  'Legal',
  'Riesgo',
  'Innovación',
  'Tesorería',
  'Comercial',
] as const;

/**
 * El backend guarda `impacto` como texto libre (máx 500). El Figma lo convierte
 * en un select, así que fijamos aquí la escala; cámbiala si el Lab define otra.
 */
const IMPACT_OPTIONS = [
  'Alto — habilita ahorro, ingreso o mitigación de riesgo material para ACH',
  'Medio — mejora significativa en un proceso o área',
  'Bajo — mejora puntual o de conveniencia',
] as const;

const SOURCE_HINTS: Record<SourceType, string> = {
  INTERNAL: 'Operaciones, Negocio, Riesgos, TI o Canales Digitales enviando una necesidad propia.',
  EXTERNAL_CONTRACTOR: 'Proveedores, aliados o contractors con acceso al Laboratorio Digital.',
  INTERNATIONAL_REFERENCE:
    'Un benchmark visto en un congreso, simposio o publicación que vale la pena replicar.',
};

const STEP_TITLES = ['Quién envía', 'Solicitud', 'Compuerta mínima', 'Evidencias'] as const;

/** Qué valida cada paso antes de dejar avanzar. */
const STEP_FIELDS: FieldPath<PublicInitiativeFormValues>[][] = [
  ['sourceType', 'submitterName', 'submitterEmail', 'fechaDiligenciamiento', 'expectativaSolucion'],
  ['nombre', 'areaProcesoImpactado', 'areaInvolucrada', 'urgencia', 'impacto'],
  ['necesidad', 'porQueAhora', 'paraQue', 'comoSeResuelveHoy'],
  ['companyContacts'],
];

const REFERENCE_FIELDS: FieldPath<PublicInitiativeFormValues>[] = [
  'referenceOrganization',
  'referenceEvent',
  'referenceLink',
  'referenceRationale',
];

type Props = {
  defaultSourceType: SourceType;
  onSubmitted: (result: PublicSubmissionResult) => void;
};

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
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PublicInitiativeFormValues>({
    resolver: zodResolver(publicInitiativeFormSchema) as never,
    defaultValues: defaultValues(defaultSourceType),
    mode: 'onBlur',
  });

  const sourceType = form.watch('sourceType');
  const isReference = sourceType === 'INTERNATIONAL_REFERENCE';

  const contacts = useFieldArray({ control: form.control, name: 'companyContacts' });
  const errors = form.formState.errors;

  const selectedAreas = (form.watch('areaInvolucrada') ?? '')
    .split(',')
    .map((area) => area.trim())
    .filter(Boolean);

  function toggleArea(area: string) {
    const next = selectedAreas.includes(area)
      ? selectedAreas.filter((item) => item !== area)
      : [...selectedAreas, area];
    form.setValue('areaInvolucrada', next.join(', '), {
      shouldValidate: form.formState.isSubmitted,
      shouldDirty: true,
    });
  }

  function addEvidence(fileList: FileList | null) {
    if (!fileList?.length) return;

    const next = [...evidenceFiles];
    for (const file of Array.from(fileList)) {
      if (next.length >= MAX_EVIDENCE_FILES) {
        toast.error(`Máximo ${MAX_EVIDENCE_FILES} evidencias`);
        break;
      }
      if (file.size > MAX_EVIDENCE_BYTES) {
        toast.error(`${file.name} supera 15 MB`);
        continue;
      }
      if (next.some((item) => item.name === file.name && item.size === file.size)) {
        continue;
      }
      next.push(file);
    }
    setEvidenceFiles(next);
  }

  async function goNext() {
    const fields = [...STEP_FIELDS[step - 1]];
    // El bloque de referencia internacional vive en el paso 1 y solo aplica a ese canal.
    if (step === 1 && isReference) fields.push(...REFERENCE_FIELDS);

    const valid = await form.trigger(fields, { shouldFocus: true });
    if (!valid) {
      toast.error('Revisa los campos marcados antes de continuar');
      return;
    }
    setStep((current) => Math.min(current + 1, TOTAL_STEPS));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function goBack() {
    if (step === 1) {
      router.push(routes.home);
      return;
    }
    setStep((current) => current - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function onSubmit(values: PublicInitiativeFormValues) {
    setSubmitting(true);
    try {
      const result = await submitPublicInitiative(
        {
          ...values,
          diligenciadoPor: values.submitterName,
          fechaDiligenciamiento: new Date(values.fechaDiligenciamiento).toISOString(),
          referenceOrganization: isReference ? values.referenceOrganization : undefined,
          referenceEvent: isReference ? values.referenceEvent : undefined,
          referenceLink: values.referenceLink || undefined,
          referenceRationale: isReference ? values.referenceRationale : undefined,
        },
        evidenceFiles,
      );
      onSubmitted(result);
    } catch (error) {
      toast.error(getErrorMessage(error, 'No se pudo enviar la iniciativa'));
    } finally {
      setSubmitting(false);
    }
  }

  const footer =
    step < TOTAL_STEPS ? (
      <Button
        type="button"
        size="lg"
        onClick={goNext}
        className="cta-glow h-12 w-full rounded-xl text-base font-semibold"
      >
        Continuar
        <ArrowRight className="size-4" />
      </Button>
    ) : (
      <Button
        type="submit"
        form="public-initiative-form"
        size="lg"
        disabled={submitting}
        className="cta-glow h-12 w-full rounded-xl text-base font-semibold"
      >
        {submitting ? 'Analizando iniciativa…' : 'Enviar iniciativa'}
        {!submitting ? <ArrowRight className="size-4" /> : null}
      </Button>
    );

  return (
    <SubmitWizardShell step={step} title={STEP_TITLES[step - 1]} onBack={goBack} footer={footer}>
      <form
        id="public-initiative-form"
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit, () =>
          toast.error('Revisa los campos obligatorios antes de enviar'),
        )}
      >
        {step === 1 ? (
          <>
            <SectionCard icon={User} title="Quién envía">
              <Field label="Canal de origen" error={errors.sourceType?.message}>
                <SelectControl {...form.register('sourceType')}>
                  {(Object.keys(SOURCE_LABELS) as SourceType[]).map((source) => (
                    <option key={source} value={source}>
                      {SOURCE_LABELS[source]}
                    </option>
                  ))}
                </SelectControl>
                <p className="text-xs text-muted-foreground">{SOURCE_HINTS[sourceType]}</p>
              </Field>

              <Field label="Tu nombre" error={errors.submitterName?.message}>
                <TextInput
                  placeholder="Escribe tu nombre completo"
                  {...form.register('submitterName')}
                />
              </Field>

              <Field label="Tu correo" error={errors.submitterEmail?.message}>
                <TextInput
                  type="email"
                  placeholder="nombre@empresa.com"
                  {...form.register('submitterEmail')}
                />
              </Field>

              <Field label="Fecha de diligenciamiento" error={errors.fechaDiligenciamiento?.message}>
                <TextInput type="date" {...form.register('fechaDiligenciamiento')} />
              </Field>

              <Field label="Expectativa de la solución" error={errors.expectativaSolucion?.message}>
                <LongText
                  rows={4}
                  placeholder="Describe qué esperas lograr con esta iniciativa."
                  {...form.register('expectativaSolucion')}
                />
              </Field>
            </SectionCard>

            {isReference ? (
              <SectionCard icon={Target} title="Referencia internacional">
                <Field label="Organización" error={errors.referenceOrganization?.message}>
                  <TextInput
                    placeholder="SWIFT, Pix, FedNow…"
                    {...form.register('referenceOrganization')}
                  />
                </Field>
                <Field label="Evento o congreso" error={errors.referenceEvent?.message}>
                  <TextInput
                    placeholder="Sibos 2026, Money20/20…"
                    {...form.register('referenceEvent')}
                  />
                </Field>
                <Field label="Enlace" error={errors.referenceLink?.message}>
                  <TextInput placeholder="https://…" {...form.register('referenceLink')} />
                </Field>
                <Field
                  label="¿Por qué es un benchmark relevante para ACH?"
                  error={errors.referenceRationale?.message}
                >
                  <LongText rows={3} {...form.register('referenceRationale')} />
                </Field>
              </SectionCard>
            ) : null}
          </>
        ) : null}

        {step === 2 ? (
          <SectionCard icon={Lightbulb} title="Solicitud" tone="signal">
            <Field label="Nombre de la iniciativa" error={errors.nombre?.message}>
              <TextInput
                placeholder="Escribe un nombre corto para la iniciativa."
                {...form.register('nombre')}
              />
            </Field>

            <Field label="Área / proceso impactado" error={errors.areaProcesoImpactado?.message}>
              <TextInput
                placeholder="Ej: Operaciones, Tesorería, Tecnología"
                {...form.register('areaProcesoImpactado')}
              />
            </Field>

            <Field label="Áreas a involucrar" error={errors.areaInvolucrada?.message}>
              {/* El valor real es el string de `areaInvolucrada`; los chips solo lo editan. */}
              <input type="hidden" {...form.register('areaInvolucrada')} />
              <div className="flex flex-wrap gap-2 rounded-xl border border-border bg-secondary/40 p-3">
                {AREA_OPTIONS.map((area) => {
                  const active = selectedAreas.includes(area);
                  return (
                    <button
                      key={area}
                      type="button"
                      onClick={() => toggleArea(area)}
                      aria-pressed={active}
                      className={cn(
                        'inline-flex items-center gap-1 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-primary bg-primary/20 text-lab'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground',
                      )}
                    >
                      {active ? <X className="size-3" /> : <Plus className="size-3" />}
                      {area}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field label="Urgencia" error={errors.urgencia?.message}>
              <SelectControl {...form.register('urgencia')}>
                {URGENCY_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectControl>
            </Field>

            <Field label="Impacto" error={errors.impacto?.message}>
              <SelectControl {...form.register('impacto')}>
                <option value="">Selecciona el impacto esperado</option>
                {IMPACT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectControl>
            </Field>
          </SectionCard>
        ) : null}

        {step === 3 ? (
          <SectionCard icon={Target} title="Compuerta mínima">
            <Field
              label="¿Qué necesita?"
              hint="Dolor, necesidad u oportunidad"
              error={errors.necesidad?.message}
            >
              <LongText
                rows={3}
                placeholder="Describe el problema, necesidad o la oportunidad identificada."
                {...form.register('necesidad')}
              />
            </Field>

            <Field
              label="¿Por qué ahora?"
              hint="Urgencia y contexto actual"
              error={errors.porQueAhora?.message}
            >
              <LongText
                rows={3}
                placeholder="Explica la razón de urgencia o el momento oportuno para esta iniciativa."
                {...form.register('porQueAhora')}
              />
            </Field>

            <Field
              label="¿Para qué?"
              hint="Resultado esperado"
              error={errors.paraQue?.message}
            >
              <LongText
                rows={3}
                placeholder="Describe el resultado esperado o el estado futuro deseado."
                {...form.register('paraQue')}
              />
            </Field>

            <Field
              label="¿Cómo se resuelve hoy?"
              hint="Solución actual"
              error={errors.comoSeResuelveHoy?.message}
            >
              <LongText
                rows={3}
                placeholder="Describe cómo se maneja actualmente este problema o necesidad."
                {...form.register('comoSeResuelveHoy')}
              />
            </Field>
          </SectionCard>
        ) : null}

        {step === 4 ? (
          <>
            <SectionCard
              icon={Building2}
              title="Empresas y contactos"
              description="Empresas o contactos que reportan el dolor"
            >
              {contacts.fields.map((field, index) => (
                <div
                  key={field.id}
                  className="space-y-2 rounded-xl border border-border bg-secondary/30 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                      Contacto {index + 1}
                    </span>
                    {contacts.fields.length > 1 ? (
                      <button
                        type="button"
                        aria-label={`Quitar contacto ${index + 1}`}
                        onClick={() => contacts.remove(index)}
                        className="inline-flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" />
                      </button>
                    ) : null}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <TextInput
                      placeholder="Empresa"
                      aria-label="Empresa"
                      {...form.register(`companyContacts.${index}.empresa`)}
                    />
                    <TextInput
                      placeholder="Contacto"
                      aria-label="Contacto"
                      {...form.register(`companyContacts.${index}.contacto`)}
                    />
                    <TextInput
                      placeholder="Cargo"
                      aria-label="Cargo"
                      {...form.register(`companyContacts.${index}.cargo`)}
                    />
                    <TextInput
                      type="email"
                      placeholder="Correo"
                      aria-label="Correo"
                      {...form.register(`companyContacts.${index}.correo`)}
                    />
                    <TextInput
                      placeholder="Teléfono"
                      aria-label="Teléfono"
                      className="sm:col-span-2"
                      {...form.register(`companyContacts.${index}.telefono`)}
                    />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  contacts.append({ empresa: '', contacto: '', cargo: '', correo: '', telefono: '' })
                }
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-primary/50 py-3 text-sm font-medium text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Plus className="size-4" />
                Agregar contacto
              </button>

              {errors.companyContacts?.message ? (
                <p className="text-xs text-destructive">{errors.companyContacts.message}</p>
              ) : null}
            </SectionCard>

            <SectionCard icon={Paperclip} title="Evidencias">
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  addEvidence(event.dataTransfer.files);
                }}
                className={cn(
                  'flex flex-col items-center gap-3 rounded-xl border border-dashed px-4 py-7 text-center transition-colors',
                  dragging ? 'border-primary bg-primary/10' : 'border-border bg-secondary/25',
                )}
              >
                <Upload className="size-6 text-primary" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Arrastra archivos aquí</p>
                  <p className="text-xs text-muted-foreground">o haz clic para seleccionar</p>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Subir evidencias
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept={ACCEPTED_EVIDENCE}
                  multiple
                  onChange={(event) => {
                    addEvidence(event.target.files);
                    event.target.value = '';
                  }}
                />
                <div className="flex flex-wrap justify-center gap-1.5">
                  {EVIDENCE_TYPES.map((type) => (
                    <span
                      key={type}
                      className="rounded-md border border-border bg-card px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Opcional · máximo {MAX_EVIDENCE_FILES} archivos de 15 MB cada uno
                </p>
              </div>

              {evidenceFiles.length > 0 ? (
                <ul className="space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-border bg-secondary/30 px-3 py-2"
                    >
                      <Paperclip className="size-4 shrink-0 text-primary" />
                      <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Quitar ${file.name}`}
                        onClick={() =>
                          setEvidenceFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              {/* Solo para canales no-benchmark: en INTERNATIONAL_REFERENCE el mismo
                  campo `referenceLink` ya se usa (paso 1) para el enlace del referente,
                  así que los dos usos nunca coinciden en una misma solicitud. */}
              {!isReference ? (
                <Field
                  label="Evidencias adicionales"
                  hint="Links, referencias o fuentes externas de soporte (opcional)"
                  error={errors.referenceLink?.message}
                >
                  <TextInput placeholder="https://…" {...form.register('referenceLink')} />
                </Field>
              ) : null}
            </SectionCard>

            <div className="flex items-start gap-3 rounded-xl border border-border bg-secondary/30 p-4">
              <span className="mt-0.5 inline-flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Info className="size-4" />
              </span>
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Consentimiento de uso de datos</p>
                <p className="text-xs text-muted-foreground">
                  La información proporcionada será utilizada por el Laboratorio Digital de ACH para
                  clasificar y evaluar esta iniciativa.
                </p>
              </div>
            </div>
          </>
        ) : null}
      </form>
    </SubmitWizardShell>
  );
}

function SectionCard({
  icon: Icon,
  title,
  description,
  tone = 'primary',
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  tone?: 'primary' | 'signal';
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card/70 p-4 backdrop-blur-xl sm:p-5">
      <header className="mb-4 flex items-center gap-3">
        <span
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-xl',
            tone === 'signal' ? 'bg-signal/15 text-signal' : 'bg-primary/15 text-primary',
          )}
        >
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="font-heading text-lg font-semibold leading-tight">{title}</h2>
          {description ? (
            <p className="text-xs text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="space-y-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-foreground/75">
          {label}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

/**
 * El `Input` compartido es h-8 porque el back-office lo usa dentro de tablas
 * densas. El flujo público es de una sola columna en móvil y pide controles más
 * altos, así que los revisten aquí en vez de cambiar el componente global.
 */
function TextInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return <Input className={cn('h-11 rounded-xl bg-secondary/40 px-3', className)} {...props} />;
}

function LongText({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea className={cn('rounded-xl bg-secondary/40 px-3 py-2.5', className)} {...props} />
  );
}

/** `select` nativo con la misma piel que `TextInput`, más el chevron del diseño. */
function SelectControl({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'flex h-11 w-full cursor-pointer appearance-none rounded-xl border border-input bg-secondary/40 px-3 pr-9 text-sm text-foreground transition-colors focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}
