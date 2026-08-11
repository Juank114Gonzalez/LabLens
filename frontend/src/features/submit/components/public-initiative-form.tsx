'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  useFieldArray,
  useForm,
  type FieldErrors,
  type FieldPath,
} from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  ArrowLeft,
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
  ['impactaA', 'productoRelacionado', 'beneficios', 'impacto'],
  ['tieneInteresado', 'companyContacts'],
];

const EMPTY_CONTACT = { empresa: '', contacto: '', cargo: '', correo: '', telefono: '' };

/** Campos de selección múltiple, todos guardados como arreglo de cadenas. */
type MultiSelectField = 'impactaA' | 'productoRelacionado' | 'beneficios';

/**
 * Áreas ordenadas alfabéticamente solo para mostrarlas. El catálogo conserva su
 * orden original para poder cotejarlo contra el validador del backend, y se
 * ordena aquí con `localeCompare` en español para que las tildes queden bien y
 * una nueva área entre en su sitio sin que nadie tenga que acordarse.
 */
const AREA_OPTIONS_SORTED = [...AREA_OPTIONS].sort((a, b) => a.localeCompare(b, 'es'));

/**
 * Bloquea el envío implícito del formulario con Enter.
 *
 * HTML envía el formulario cuando se pulsa Enter con el foco en un input —
 * incluidos los checkbox y radio ocultos de las opciones. Eso disparaba el
 * validador de envío desde un paso intermedio y mostraba "Revisa los campos
 * obligatorios antes de enviar" en medio del paso 3.
 *
 * El envío es siempre explícito con el botón, así que aquí Enter nunca debe
 * enviar. Sobre una casilla se convierte en lo que el usuario esperaba: la
 * marca, igual que la barra espaciadora.
 */
function blockImplicitSubmit(event: React.KeyboardEvent<HTMLFormElement>) {
  if (event.key !== 'Enter') return;

  const target = event.target as HTMLElement;
  // En un textarea Enter es un salto de línea y nunca envía: no se toca.
  if (target instanceof HTMLTextAreaElement) return;
  if (!(target instanceof HTMLInputElement)) return;

  event.preventDefault();
  if (target.type === 'checkbox' || target.type === 'radio') {
    target.click();
  }
}

type Props = {
  defaultSourceType: SourceType;
  onSubmitted: (result: PublicSubmissionResult) => void;
};

export function PublicInitiativeForm({ defaultSourceType, onSubmitted }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  /** Paso más avanzado alcanzado; habilita saltar hacia adelante en el stepper. */
  const [furthestStep, setFurthestStep] = useState(1);
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
      tieneInteresado: undefined,
      companyContacts: [],
    },
    mode: 'onBlur',
  });

  const contacts = useFieldArray({ control: form.control, name: 'companyContacts' });
  const errors = form.formState.errors;
  const tieneInteresado = form.watch('tieneInteresado');
  const impactaA = form.watch('impactaA');
  const productoRelacionado = form.watch('productoRelacionado');
  const beneficios = form.watch('beneficios');

  /**
   * Las multiselecciones son controladas en vez de `register` sobre varios
   * checkbox con el mismo `name`.
   *
   * Ese mecanismo de react-hook-form guarda un arreglo de refs a los inputs, y
   * aquí los pasos se montan y desmontan al navegar: al volver a un paso las
   * refs quedan obsoletas y la selección se pierde o se duplica. Derivar el
   * `checked` del valor del formulario elimina ese estado intermedio.
   */
  function toggleValue(field: MultiSelectField, option: string) {
    const current = (form.getValues(field) ?? []) as string[];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];

    // El cast es necesario porque `PathValue` de react-hook-form no puede
    // expresar la unión de los tres campos. En runtime es correcto: las opciones
    // salen de los mismos catálogos que valida el esquema.
    form.setValue(field, next as never, {
      shouldDirty: true,
      // Solo revalida si el campo ya mostró error, para no marcar en rojo
      // mientras el usuario todavía está eligiendo.
      shouldValidate: Boolean(form.formState.errors[field]),
    });
  }

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

  function goToStep(target: number) {
    setStep(target);
    setFurthestStep((current) => Math.max(current, target));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function goNext() {
    const valid = await form.trigger(STEP_FIELDS[step - 1], { shouldFocus: true });
    if (!valid) {
      toast.error('Revisa los campos marcados antes de continuar');
      return;
    }
    goToStep(Math.min(step + 1, TOTAL_STEPS));
  }

  function goBack() {
    if (step === 1) {
      router.push(routes.home);
      return;
    }
    // Volver nunca valida: el usuario puede retroceder con el paso a medias.
    goToStep(step - 1);
  }

  /**
   * Salto directo desde el stepper. Hacia atrás siempre se permite; hacia
   * adelante solo a pasos ya visitados, y validando el actual primero, para que
   * nadie se salte preguntas obligatorias usando el indicador como atajo.
   */
  async function jumpToStep(target: number) {
    if (target === step) return;
    if (target < step) {
      goToStep(target);
      return;
    }
    if (target > furthestStep) return;

    const valid = await form.trigger(STEP_FIELDS[step - 1], { shouldFocus: true });
    if (!valid) {
      toast.error('Revisa los campos marcados antes de continuar');
      return;
    }
    goToStep(target);
  }

  /**
   * Al enviar se valida el formulario completo, y el campo que falla puede estar
   * en un paso que ya no se ve. Se navega hasta él en vez de dejar al usuario
   * con un aviso y sin pista de dónde está el problema.
   */
  function onInvalid(fieldErrors: FieldErrors<PublicInitiativeFormValues>) {
    const firstBadStep = STEP_FIELDS.findIndex((fields) =>
      fields.some((field) => Boolean(fieldErrors[field as keyof typeof fieldErrors])),
    );

    if (firstBadStep >= 0 && firstBadStep + 1 !== step) {
      goToStep(firstBadStep + 1);
      toast.error(`Falta responder algo en el paso ${firstBadStep + 1}`);
      return;
    }

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

    // Al responder "No" se descartan las fichas que hayan quedado de un "Sí"
    // previo. El esquema ya no las valida, pero dejarlas ensucia el envío.
    if (!value) contacts.replace([]);
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

  const footer = (
    <div className="flex items-center gap-2">
      {/* "Atrás" siempre visible, incluso en el paso 1, donde sale del formulario:
          la flecha de la cabecera es fácil de no ver en móvil. */}
      <Button
        type="button"
        size="lg"
        variant="secondary"
        onClick={goBack}
        disabled={submitting}
        className="h-12 shrink-0 rounded-xl px-4 text-base font-medium"
      >
        <ArrowLeft className="size-4" />
        Atrás
      </Button>

      {/*
        Ambos botones son `type="button"` y llevan `key` distinta a propósito.

        Con `type="submit"` en el último paso, React reutilizaba el mismo nodo
        del DOM al pasar del paso 3 al 4 y solo le cambiaba el `type`. Como
        `goNext` es asíncrono, ese cambio llegaba antes de que el navegador
        resolviera la acción por defecto del clic, y el clic de "Continuar"
        terminaba enviando el formulario al aterrizar en el paso final.

        Enviando por `onClick` no queda ningún botón de submit, y la `key`
        distinta obliga a React a montar un nodo nuevo en vez de reciclarlo.
      */}
      {step < TOTAL_STEPS ? (
        <Button
          key="wizard-next"
          type="button"
          size="lg"
          onClick={goNext}
          className="cta-glow h-12 flex-1 rounded-xl text-base font-semibold"
        >
          Continuar
          <ArrowRight className="size-4" />
        </Button>
      ) : (
        <Button
          key="wizard-submit"
          type="button"
          size="lg"
          disabled={submitting}
          onClick={form.handleSubmit(onSubmit, onInvalid)}
          className="cta-glow h-12 flex-1 rounded-xl text-base font-semibold"
        >
          {submitting ? 'Analizando iniciativa…' : 'Enviar iniciativa'}
          {!submitting ? <ArrowRight className="size-4" /> : null}
        </Button>
      )}
    </div>
  );

  return (
    <SubmitWizardShell
      step={step}
      title={STEP_TITLES[step - 1]}
      onBack={goBack}
      furthestStep={furthestStep}
      onStepSelect={jumpToStep}
      footer={footer}
    >
      <form
        id="public-initiative-form"
        className="space-y-5"
        onSubmit={form.handleSubmit(onSubmit, onInvalid)}
        onKeyDown={blockImplicitSubmit}
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
                {AREA_OPTIONS_SORTED.map((option) => (
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
                      checked={impactaA.includes(option)}
                      onChange={() => toggleValue('impactaA', option)}
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
                      checked={productoRelacionado.includes(option)}
                      onChange={() => toggleValue('productoRelacionado', option)}
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
                      checked={beneficios.includes(option)}
                      onChange={() => toggleValue('beneficios', option)}
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
            </SectionCard>
          </>
        ) : null}

        {step === 4 ? (
          <>
            <SectionCard icon={Building2} title="Interesados">
              <Field
                index={11}
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
                      {/* Cada campo pinta su propio error: sin esto el envío se
                          bloqueaba con un aviso y nada marcado en pantalla. */}
                      <div className="grid gap-2 sm:grid-cols-2">
                        <ContactField
                          error={errors.companyContacts?.[index]?.empresa?.message}
                        >
                          <TextInput
                            placeholder="Empresa o área"
                            aria-label="Empresa o área"
                            {...form.register(`companyContacts.${index}.empresa`)}
                          />
                        </ContactField>
                        <ContactField
                          error={errors.companyContacts?.[index]?.contacto?.message}
                        >
                          <TextInput
                            placeholder="Contacto"
                            aria-label="Contacto"
                            {...form.register(`companyContacts.${index}.contacto`)}
                          />
                        </ContactField>
                        <ContactField
                          error={errors.companyContacts?.[index]?.cargo?.message}
                        >
                          <TextInput
                            placeholder="Cargo"
                            aria-label="Cargo"
                            {...form.register(`companyContacts.${index}.cargo`)}
                          />
                        </ContactField>
                        <ContactField
                          error={errors.companyContacts?.[index]?.correo?.message}
                        >
                          <TextInput
                            type="email"
                            placeholder="Correo"
                            aria-label="Correo"
                            {...form.register(`companyContacts.${index}.correo`)}
                          />
                        </ContactField>
                        <ContactField
                          className="sm:col-span-2"
                          error={errors.companyContacts?.[index]?.telefono?.message}
                        >
                          <TextInput
                            placeholder="Teléfono"
                            aria-label="Teléfono"
                            {...form.register(`companyContacts.${index}.telefono`)}
                          />
                        </ContactField>
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
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
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
}: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & { label: string }) {
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

function ContactField({
  error,
  className,
  children,
}: {
  error?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('space-y-1', className)}>
      {children}
      {error ? <p className="text-destructive text-xs">{error}</p> : null}
    </div>
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
