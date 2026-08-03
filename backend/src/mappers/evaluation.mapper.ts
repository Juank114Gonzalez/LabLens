import type { Evaluation, IntelligentClassification, WorkTable } from '@prisma/client';
import type {
  BusinessCase,
  CriterionScore,
  EvaluationReadiness,
  EvaluationResultsPayload,
} from '../types/evaluation-domain.types.js';

export type EvaluationResultView = {
  id: string;
  status: string;
  readinessStatus: string;
  readiness: EvaluationReadiness | null;
  fit: number | null;
  priority: string | null;
  priorityJustification: string | null;
  criteriaScores: CriterionScore[];
  classification: {
    id: string;
    nombre: string;
    descripcion: string;
    justification: string | null;
  } | null;
  workTable: {
    id: string;
    nombre: string;
    descripcion: string;
    justification: string | null;
  } | null;
  businessCase: BusinessCase | null;
  recommendations: string[];
  configVersion: string | null;
  evaluatedAt: Date | null;
  createdAt: Date;
  initiative: {
    id: string;
    nombre: string;
    companyContacts: unknown[];
    attachments: unknown[];
    expectativaSolucion?: string | null;
    urgencia?: string | null;
    impacto?: string | null;
    necesidad?: string | null;
  } | null;
  conversationId: string | null;
  export: {
    pdf: 'planned';
    word: 'planned';
  };
};

function parseBusinessCase(raw: string | null): BusinessCase | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as BusinessCase;
  } catch {
    return null;
  }
}

function parseResults(raw: unknown): EvaluationResultsPayload | null {
  if (!raw || typeof raw !== 'object') return null;
  return raw as EvaluationResultsPayload;
}

export function toEvaluationResultView(
  evaluation: Evaluation & {
    classification?: IntelligentClassification | null;
    workTable?: WorkTable | null;
    conversation?: { id: string } | null;
    initiative?: {
      id: string;
      nombre: string;
      companyContacts?: unknown[];
      attachments?: unknown[];
      expectativaSolucion?: string | null;
      urgencia?: string | null;
      impacto?: string | null;
      necesidad?: string | null;
    } | null;
  },
): EvaluationResultView {
  const results = parseResults(evaluation.results);
  const businessCase = parseBusinessCase(evaluation.businessCase);
  const readiness =
    evaluation.readiness && typeof evaluation.readiness === 'object'
      ? (evaluation.readiness as EvaluationReadiness)
      : null;

  const classificationSnapshot =
    evaluation.classificationSnapshot &&
    typeof evaluation.classificationSnapshot === 'object'
      ? (evaluation.classificationSnapshot as {
          id?: string;
          nombre?: string;
          descripcion?: string;
        })
      : null;

  const workTableSnapshot =
    evaluation.workTableSnapshot && typeof evaluation.workTableSnapshot === 'object'
      ? (evaluation.workTableSnapshot as {
          id?: string;
          nombre?: string;
          descripcion?: string;
        })
      : null;

  return {
    id: evaluation.id,
    status: evaluation.status,
    readinessStatus: evaluation.readinessStatus,
    readiness,
    fit: results?.fit ?? null,
    priority: evaluation.priority ?? results?.priority ?? null,
    priorityJustification: results?.priorityJustification ?? null,
    criteriaScores: results?.criteriaScores ?? [],
    classification: evaluation.classification
      ? {
          id: evaluation.classification.id,
          nombre: evaluation.classification.nombre,
          descripcion: evaluation.classification.descripcion,
          justification: results?.classificationJustification ?? null,
        }
      : classificationSnapshot?.nombre
        ? {
            id: classificationSnapshot.id ?? '',
            nombre: classificationSnapshot.nombre,
            descripcion: classificationSnapshot.descripcion ?? '',
            justification: results?.classificationJustification ?? null,
          }
        : null,
    workTable: evaluation.workTable
      ? {
          id: evaluation.workTable.id,
          nombre: evaluation.workTable.nombre,
          descripcion: evaluation.workTable.descripcion,
          justification: results?.workTableJustification ?? null,
        }
      : workTableSnapshot?.nombre
        ? {
            id: workTableSnapshot.id ?? '',
            nombre: workTableSnapshot.nombre,
            descripcion: workTableSnapshot.descripcion ?? '',
            justification: results?.workTableJustification ?? null,
          }
        : null,
    businessCase,
    recommendations: Array.isArray(evaluation.recommendations)
      ? (evaluation.recommendations as string[])
      : [],
    configVersion: evaluation.configVersion,
    evaluatedAt: evaluation.evaluatedAt,
    createdAt: evaluation.createdAt,
    initiative: evaluation.initiative
      ? {
          id: evaluation.initiative.id,
          nombre: evaluation.initiative.nombre,
          companyContacts: evaluation.initiative.companyContacts ?? [],
          attachments: evaluation.initiative.attachments ?? [],
          expectativaSolucion: evaluation.initiative.expectativaSolucion,
          urgencia: evaluation.initiative.urgencia,
          impacto: evaluation.initiative.impacto,
          necesidad: evaluation.initiative.necesidad,
        }
      : null,
    conversationId: evaluation.conversation?.id ?? null,
    export: { pdf: 'planned', word: 'planned' },
  };
}
