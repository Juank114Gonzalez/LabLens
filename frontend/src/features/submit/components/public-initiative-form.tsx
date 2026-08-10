'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, type FieldPath } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowRight,
  Building2,
  Check,
  ChevronDown,
  Gauge,
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
import { formatBytes } from '@/features/initiative/lib/status';
import {
  AREA_OPTIONS,
  BENEFIT_OPTIONS,
  IMPACT_TARGETS,
  RELATED_PRODUCTS,
  URGENCY_LEVELS,
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

const STEP_TITLES = [
  'Quién envía',
  'La iniciativa',
  'Alcance y valor',
  'Interesados y evidencias',
] as const;

/** Qué valida cada paso antes de dejar avanzar. */
const STEP_FIELDS: FieldPath<PublicInitiativeFormValues>[][] = [
  ['submitterName', 'areaSolicitante', 'submitterEmail'],
  ['nombre', 'necesidad', 'solucionPropuesta'],
  ['impactaA', 'productoRelacionado', 'beneficios', 'impacto', 'urgencia'],
  ['tieneInteresado', 'companyContacts'],
];

const EMPTY_CONTACT = { empresa: '', contacto: '', cargo: '', correo: '', telefono: '' };

type Props = {
  defaultSourceType: SourceType;
  onSubmitted: (result: PublicSubmissionResult) => void;
};

export function PublicInitiativeForm({ defaultSourceType, onSubmitted }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [evidenceFiles, setEvidenceFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<PublicInitiativeFormValues>({
    resolver: zodResolver(publicInitiativeFormSchema) as never,
    defaultValues: {
      sourceType: defaultSourceType,
      submitterName: '',
      areaSolicitante: undefined,
      submitterEmail: '',
      nombre: '',
      necesidad: '',
      solucionPropuesta: '',
      // Las de opción cerrada arrancan sin selección: forzar un default
      // sesgaría las respuestas hacia la primera opción de la lista.
      impactaA: [],
      productoRelacionado: [],
      beneficios: [],
      impacto: '',
      urgencia: undefined,
      tieneInteresado: undefined,
      companyContacts: [],
    },
    mode: 'onBlur',
  });

  const contacts = useFieldArray({ control: form.control, name: 'companyContacts' });
  const errors = form.formState.errors;
  const tieneInteresado = form.watch('tieneInteresado');

  // Al responder "Sí" se abre una primera ficha de contacto, para que el campo
  // no quede como una sección vacía que el usuario tenga que descubrir.
  // Se depende de `append` (estable) y del conteo, no del objeto del fieldArray,
  // que se recrea en cada render.
  const { append: appendContact } = contacts;
  const contactCount = contacts.fields.length;

  useEffect(() => {
    if (tieneInteresado === true && contactCount === 0) {
      appendContact(EMPTY_CONTACT);
    }
  }, [tieneInteresado, contactCount, appendContact]);

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
    const valid = await form.trigger(STEP_FIELDS[step - 1], { shouldFocus: true });
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

  function onInvalid() {
    toast.error('Revisa los campos obligatorios antes de enviar');
  }

  /**
   * El envío es siempre explícito, nunca automático: en el paso final el usuario
   * todavía puede adjuntar evidencias o corregir respuestas, y enviar solo con
   * marcar una opción le quitaría esa oportunidad sin avisar.
   *
   * Se maneja controlado en vez de con `register` para guardar un booleano real
   * y no la cadena "true"/"false" que entrega el radio.
   */
  function answerInteresado(value: boolean) {
    form.setValue('tieneInteresado', value, { shouldValidate: true, shouldDirty: true });
  }

  async function onSubmit(values: PublicInitiativeFormValues) {
    setSubmitting(true);
    try {
      const result = await submitPublicInitiative(
        {
          ...values,
          impacto: values.impacto || undefined,
          companyContacts: values.tieneInteresado ? values.companyContacts : [],
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
    <SubmitWizardShell
      step={step}
      title={STEP_TITLES[step - 1]}
      onBack={goBack}
      footer={footer}
    >
      <form
        id="public-initiative-form"
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
      >
        {step === 1 ? (
          <SectionCard icon={User} title="Quién envía">
            <Field
              index={1}
              label="Nombre completo"
              required
              error={errors.submitterName?.message}
            >
              <TextInput
                placeholder="Escriba su respuesta"
                {...form.register('submitterName')}
              />
            </Field>

            <Field
              index={2}
              label="Área"
              required
              error={errors.areaSolicitante?.message}
            >
              <SelectControl defaultValue="" {...form.register('areaSolicitante')}>
                <option value="" disabled>
                  Selecciona tu área
                </option>
                {AREA_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </SelectControl>
            </Field>

            <Field
              index={3}
              label="Correo electrónico"
              required
              error={errors.submitterEmail?.message}
            >
              <TextInput
                type="email"
                placeholder="nombre@achcolombia.com"
                {...form.register('submitterEmail')}
              />
            </Field>
          </SectionCard>
        ) : null}

        {step === 2 ? (
          <SectionCard icon={Lightbulb} title="La iniciativa" tone="signal">
            <Field
              index={4}
              label="Nombre de la iniciativa"
              required
              error={errors.nombre?.message}
            >
              <TextInput
                placeholder="Escriba su respuesta"
                {...form.register('nombre')}
              />
            </Field>

            <Field
              index={5}
              label="¿Qué problema, dolor u oportunidad busca resolver?"
              required
              error={errors.necesidad?.message}
            >
              <LongText
                rows={4}
                placeholder="Escriba su respuesta"
                {...form.register('necesidad')}
              />
            </Field>

            <Field
              index={6}
              label="Describe brevemente la solución propuesta"
              required
              error={errors.solucionPropuesta?.message}
            >
              <LongText
                rows={4}
                placeholder="Escriba su respuesta"
                {...form.register('solucionPropuesta')}
              />
            </Field>
          </SectionCard>
        ) : null}

        {step === 3 ? (
          <>
            <SectionCard icon={Target} title="Alcance">
              <Field
                index={7}
                label="¿A quién impacta principalmente?"
                hint="Puedes escoger más de uno."
                required
                error={errors.impactaA?.message}
              >
                <div className="space-y-2">
                  {IMPACT_TARGETS.map((option) => (
                    <MultiChoiceOption
                      key={option}
                      label={option}
                      value={option}
                      {...form.register('impactaA')}
                    />
                  ))}
                </div>
              </Field>

              <Field
                index={8}
                label="¿Está relacionada con algún producto actual?"
                hint="Puedes escoger más de uno."
                required
                error={errors.productoRelacionado?.message}
              >
                <div className="space-y-2">
                  {RELATED_PRODUCTS.map((option) => (
                    <MultiChoiceOption
                      key={option}
                      label={option}
                      value={option}
                      {...form.register('productoRelacionado')}
                    />
                  ))}
                </div>
              </Field>
            </SectionCard>

            <SectionCard icon={Gauge} title="Valor esperado">
              <Field
                index={9}
                label="¿Qué beneficio podría generar?"
                hint="Puedes escoger más de uno."
                error={errors.beneficios?.message}
              >
                <div className="flex flex-wrap gap-2">
                  {BENEFIT_OPTIONS.map((option) => (
                    <MultiChoiceChip
                      key={option}
                      label={option}
                      value={option}
                      {...form.register('beneficios')}
                    />
                  ))}
                </div>
              </Field>

              <Field
                index={10}
                label="¿La iniciativa cuenta con una estimación cuantitativa de su impacto?"
                hint="Por ejemplo: número de personas o clientes beneficiados, ingresos potenciales, ahorros esperados o reducción de costos."
                error={errors.impacto?.message}
              >
                <LongText
                  rows={3}
                  placeholder="Escriba su respuesta"
                  {...form.register('impacto')}
                />
              </Field>

              <Field
                index={11}
                label="¿Qué tan urgente consideras esta iniciativa?"
                required
                error={errors.urgencia?.message}
              >
                <div className="space-y-2">
                  {URGENCY_LEVELS.map((option) => (
                    <ChoiceOption
                      key={option}
                      label={option}
                      value={option}
                      {...form.register('urgencia')}
                    />
                  ))}
                </div>
              </Field>
            </SectionCard>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <SectionCard icon={Building2} title="Interesados">
              <Field
                index={12}
                label="¿Existe algún cliente, aliado o área interesada?"
                required
                error={errors.tieneInteresado?.message}
              >
                <div className="space-y-2">
                  <ChoiceOption
                    name="tieneInteresado"
                    label="Sí"
                    value="true"
                    checked={tieneInteresado === true}
                    onChange={() => answerInteresado(true)}
                  />
                  <ChoiceOption
                    name="tieneInteresado"
                    label="No"
                    value="false"
                    checked={tieneInteresado === false}
                    onChange={() => answerInteresado(false)}
                  />
                </div>
              </Field>

              {tieneInteresado === true ? (
                <div className="border-border space-y-3 border-t pt-4">
                  <p className="text-muted-foreground text-xs">
                    Cuéntanos quién es, para que la mesa de trabajo pueda contactarlo.
                  </p>

                  {contacts.fields.map((field, index) => (
                    <div
                      key={field.id}
                      className="border-border bg-secondary/30 space-y-2 rounded-xl border p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground text-[11px] font-semibold tracking-[0.14em] uppercase">
                          Contacto {index + 1}
                        </span>
                        {contacts.fields.length > 1 ? (
                          <button
                            type="button"
                            aria-label={`Quitar contacto ${index + 1}`}
                            onClick={() => contacts.remove(index)}
                            className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus-visible:ring-ring inline-flex size-7 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                          >
                            <X className="size-3.5" />
                          </button>
                        ) : null}
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2">
                        <TextInput
                          placeholder="Empresa o área"
                          aria-label="Empresa o área"
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
                    onClick={() => contacts.append(EMPTY_CONTACT)}
                    className="border-primary/50 text-primary hover:bg-primary/10 focus-visible:ring-ring inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed py-3 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:outline-none"
                  >
                    <Plus className="size-4" />
                    Agregar contacto
                  </button>

                  {errors.companyContacts?.message ? (
                    <p className="text-destructive text-xs">
                      {errors.companyContacts.message}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </SectionCard>

            <SectionCard icon={Paperclip} title="Evidencias" description="Opcional">
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
                  dragging
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-secondary/25',
                )}
              >
                <Upload className="text-primary size-6" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold">Arrastra archivos aquí</p>
                  <p className="text-muted-foreground text-xs">
                    o haz clic para seleccionar
                  </p>
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
                      className="border-border bg-card text-muted-foreground rounded-md border px-2 py-0.5 text-[10px] font-semibold tracking-wide"
                    >
                      {type}
                    </span>
                  ))}
                </div>
                <p className="text-muted-foreground text-xs">
                  Máximo {MAX_EVIDENCE_FILES} archivos de 15 MB cada uno
                </p>
              </div>

              {evidenceFiles.length > 0 ? (
                <ul className="space-y-2">
                  {evidenceFiles.map((file, index) => (
                    <li
                      key={`${file.name}-${file.size}-${index}`}
                      className="border-border bg-secondary/30 flex items-center gap-3 rounded-xl border px-3 py-2"
                    >
                      <Paperclip className="text-primary size-4 shrink-0" />
                      <span className="min-w-0 flex-1 truncate text-sm">{file.name}</span>
                      <span className="text-muted-foreground shrink-0 text-xs">
                        {formatBytes(file.size)}
                      </span>
                      <button
                        type="button"
                        aria-label={`Quitar ${file.name}`}
                        onClick={() =>
                          setEvidenceFiles((prev) => prev.filter((_, i) => i !== index))
                        }
                        className="text-muted-foreground hover:bg-destructive/15 hover:text-destructive focus-visible:ring-ring inline-flex size-7 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:ring-2 focus-visible:outline-none"
                      >
                        <X className="size-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </SectionCard>
          </>
        ) : null}
      </form>
    </SubmitWizardShell>
  );
}

/** Opción única. Radio nativo para no perder navegación con flechas ni lectores. */
const ChoiceOption = function ChoiceOption({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      className={cn(
        'border-border bg-secondary/30 hover:border-primary/50 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
        'has-checked:border-primary has-checked:bg-primary/10',
        'has-focus-visible:ring-ring has-focus-visible:ring-2',
        className,
      )}
    >
      <input type="radio" className="peer sr-only" {...props} />
      <span className="border-muted-foreground/60 peer-checked:border-primary peer-checked:bg-primary flex size-4 shrink-0 items-center justify-center rounded-full border">
        <span className="bg-primary-foreground size-1.5 rounded-full opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  );
};

/**
 * Selección múltiple en formato de fila, para opciones con etiquetas largas.
 * Varios checkbox con el mismo `name` — react-hook-form los agrupa en un array.
 */
const MultiChoiceOption = function MultiChoiceOption({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      className={cn(
        'border-border bg-secondary/30 hover:border-primary/50 flex cursor-pointer items-center gap-3 rounded-xl border px-3 py-2.5 text-sm transition-colors',
        'has-checked:border-primary has-checked:bg-primary/10',
        'has-focus-visible:ring-ring has-focus-visible:ring-2',
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <span className="border-muted-foreground/60 peer-checked:border-primary peer-checked:bg-primary flex size-4 shrink-0 items-center justify-center rounded border">
        <Check className="text-primary-foreground size-3 opacity-0 peer-checked:opacity-100" />
      </span>
      {label}
    </label>
  );
};

/** `select` nativo con la piel de `TextInput`, más el chevron del diseño. */
function SelectControl({
  className,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <select
        className={cn(
          'border-input bg-secondary/40 text-foreground focus-visible:border-primary focus-visible:ring-ring/40 flex h-11 w-full cursor-pointer appearance-none rounded-xl border px-3 pr-9 text-sm transition-colors focus-visible:ring-2 focus-visible:outline-none',
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2"
      />
    </div>
  );
}

/** Selección múltiple compacta, para catálogos de etiquetas cortas. */
const MultiChoiceChip = function MultiChoiceChip({
  label,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label
      className={cn(
        'border-border bg-card text-muted-foreground hover:border-primary/50 hover:text-foreground inline-flex cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
        'has-checked:border-primary has-checked:bg-primary/20 has-checked:text-lab',
        'has-focus-visible:ring-ring has-focus-visible:ring-2',
        className,
      )}
    >
      <input type="checkbox" className="peer sr-only" {...props} />
      <Check className="size-3 opacity-0 peer-checked:opacity-100" />
      {label}
    </label>
  );
};

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
    <section className="border-border bg-card/70 rounded-2xl border p-4 backdrop-blur-xl sm:p-5">
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
          <h2 className="font-heading text-lg leading-tight font-semibold">{title}</h2>
          {description ? (
            <p className="text-muted-foreground text-xs">{description}</p>
          ) : null}
        </div>
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

function Field({
  index,
  label,
  hint,
  required = false,
  error,
  children,
}: {
  /** Número de pregunta del formulario original, para que ambos se puedan cotejar. */
  index: number;
  label: string;
  hint?: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="space-y-1">
        <p className="text-foreground text-sm font-medium">
          <span className="text-muted-foreground">{index}.</span> {label}
          {required ? (
            <span className="text-destructive" aria-hidden>
              {' '}
              *
            </span>
          ) : null}
          {required ? <span className="sr-only"> (obligatorio)</span> : null}
        </p>
        {hint ? <p className="text-muted-foreground text-xs">{hint}</p> : null}
      </div>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
  );
}

/**
 * El `Input` compartido es h-8 porque el back-office lo usa dentro de tablas
 * densas. El flujo público es de una sola columna en móvil y pide controles más
 * altos, así que los revisten aquí en vez de cambiar el componente global.
 */
function TextInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <Input className={cn('bg-secondary/40 h-11 rounded-xl px-3', className)} {...props} />
  );
}

function LongText({ className, ...props }: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      className={cn('bg-secondary/40 rounded-xl px-3 py-2.5', className)}
      {...props}
    />
  );
}
