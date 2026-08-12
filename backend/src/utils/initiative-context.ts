import type { findInitiativeById } from '../repositories/domain-initiative.repository.js';

export type InitiativeWithRelations = NonNullable<
  Awaited<ReturnType<typeof findInitiativeById>>
>;

export type InitiativeContextOptions = {
  /**
   * Incluye `id` y `status`. El triage los omite a propósito: su prompt le pide
   * al modelo devolver uuids del catálogo de clasificaciones, y tener a mano
   * otro uuid sin relación invita a que lo copie.
   */
  includeIdentity?: boolean;
  /**
   * `summary` manda solo empresa y cargo; `full` la ficha completa. El triage usa
   * el resumen porque decide una categoría, no necesita datos de contacto.
   */
  contacts?: 'summary' | 'full';
  includeAttachments?: boolean;
};

/** Descarta cadenas vacías, nulos e indefinidos para que `JSON.stringify` los omita. */
function omitEmpty<T>(value: T | '' | null | undefined): T | undefined {
  return value === '' || value === null || value === undefined ? undefined : value;
}

function omitEmptyList<T>(value: T[]): T[] | undefined {
  return value.length > 0 ? value : undefined;
}

/**
 * Serializa una iniciativa para mandársela a un modelo.
 *
 * Fuente única a propósito. Antes había dos copias —una en el triage y otra en el
 * pipeline de evaluación— y al ampliar el formulario público solo se actualizó la
 * del triage. El pipeline quedó puntuando iniciativas del canal público sin ver la
 * solución propuesta, a quién impactan, sobre qué producto ni qué beneficio
 * esperan, porque esos campos ni siquiera se serializaban.
 *
 * Los dos formularios (público e interno) llenan subconjuntos distintos del
 * modelo, así que se omite todo lo vacío: mandarle al modelo una decena de
 * cadenas en blanco solo mete ruido.
 */
export function buildInitiativeContext(
  initiative: InitiativeWithRelations,
  options: InitiativeContextOptions = {},
): string {
  const { includeIdentity = false, contacts = 'summary', includeAttachments = false } = options;

  const contactList =
    contacts === 'full'
      ? initiative.companyContacts.map((contact) => ({
          empresa: contact.empresa,
          contacto: contact.contacto,
          cargo: contact.cargo,
          correo: contact.correo,
          telefono: contact.telefono,
        }))
      : initiative.companyContacts.map((contact) => ({
          empresa: contact.empresa,
          cargo: contact.cargo,
        }));

  return JSON.stringify(
    {
      id: includeIdentity ? initiative.id : undefined,
      status: includeIdentity ? initiative.status : undefined,

      // Núcleo: siempre presente en ambos formularios.
      nombre: initiative.nombre,
      necesidad: initiative.necesidad,
      canalDeOrigen: initiative.sourceType,

      // Formulario público.
      areaDelSolicitante: omitEmpty(initiative.areaSolicitante),
      solucionPropuesta: omitEmpty(initiative.solucionPropuesta),
      impactaPrincipalmenteA: omitEmptyList(initiative.impactaA),
      productosRelacionados: omitEmptyList(initiative.productoRelacionado),
      beneficiosEsperados: omitEmptyList(initiative.beneficios),
      tieneInteresado: initiative.tieneInteresado ?? undefined,

      // Formulario interno (compuerta mínima del enunciado).
      expectativaSolucion: omitEmpty(initiative.expectativaSolucion),
      areaProcesoImpactado: omitEmpty(initiative.areaProcesoImpactado),
      areaInvolucrada: omitEmpty(initiative.areaInvolucrada),
      urgencia: omitEmpty(initiative.urgencia),
      impacto: omitEmpty(initiative.impacto),
      porQueAhora: omitEmpty(initiative.porQueAhora),
      paraQue: omitEmpty(initiative.paraQue),
      comoSeResuelveHoy: omitEmpty(initiative.comoSeResuelveHoy),

      referenciaInternacional: initiative.referenceOrganization
        ? {
            organizacion: initiative.referenceOrganization,
            evento: initiative.referenceEvent,
            link: initiative.referenceLink,
            porQueEsRelevante: initiative.referenceRationale,
          }
        : undefined,

      empresasQueReportanElDolor: omitEmptyList(contactList),

      adjuntos: includeAttachments
        ? omitEmptyList(
            initiative.attachments.map((item) => ({
              originalName: item.originalName,
              mimeType: item.mimeType,
            })),
          )
        : undefined,
    },
    null,
    2,
  );
}
