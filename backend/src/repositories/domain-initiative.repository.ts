import { InitiativeStatus, type Prisma, type SourceType } from '@prisma/client';
import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

const initiativeInclude = {
  companyContacts: true,
  attachments: true,
  user: {
    select: { id: true, name: true, email: true },
  },
  triageClassification: { select: { id: true, nombre: true } },
  triageWorkTable: { select: { id: true, nombre: true, notificationEmail: true } },
  evaluations: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      evaluator: { select: { id: true, name: true, email: true } },
      classification: { select: { id: true, nombre: true } },
      workTable: { select: { id: true, nombre: true } },
    },
  },
} satisfies Prisma.InitiativeInclude;

type InitiativeScalarCreateInput = Omit<
  Prisma.InitiativeUncheckedCreateInput,
  'id' | 'userId' | 'companyContacts' | 'attachments' | 'evaluations'
>;

export async function createInitiative(input: {
  userId?: string | null;
  data?: InitiativeScalarCreateInput;
  companyContacts?: Array<{
    empresa: string;
    contacto: string;
    cargo: string;
    correo: string;
    telefono: string;
  }>;
}) {
  return prisma.initiative.create({
    data: {
      ...input.data,
      userId: input.userId ?? null,
      status: input.data?.status ?? InitiativeStatus.DRAFT,
      companyContacts: input.companyContacts?.length
        ? { create: input.companyContacts }
        : undefined,
    },
    include: initiativeInclude,
  });
}

export type InitiativeFilters = {
  status?: InitiativeStatus[];
  sourceType?: SourceType[];
  triageClassificationId?: string;
  triageWorkTableId?: string;
  from?: Date;
  to?: Date;
  search?: string;
};

function buildFilterWhere(filters: InitiativeFilters = {}): Prisma.InitiativeWhereInput {
  const where: Prisma.InitiativeWhereInput = {};

  if (filters.status?.length) {
    where.status = { in: filters.status };
  }
  if (filters.sourceType?.length) {
    where.sourceType = { in: filters.sourceType };
  }
  if (filters.triageClassificationId) {
    where.triageClassificationId = filters.triageClassificationId;
  }
  if (filters.triageWorkTableId) {
    where.triageWorkTableId = filters.triageWorkTableId;
  }
  if (filters.from || filters.to) {
    where.createdAt = {
      ...(filters.from ? { gte: filters.from } : {}),
      ...(filters.to ? { lte: filters.to } : {}),
    };
  }
  if (filters.search) {
    where.OR = [
      { nombre: { contains: filters.search, mode: 'insensitive' } },
      { areaProcesoImpactado: { contains: filters.search, mode: 'insensitive' } },
      { necesidad: { contains: filters.search, mode: 'insensitive' } },
      { diligenciadoPor: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

export async function listInitiatives(options: {
  userId?: string;
  isAdmin: boolean;
  filters?: InitiativeFilters;
}) {
  const scope: Prisma.InitiativeWhereInput = options.isAdmin
    ? {}
    : { userId: options.userId };

  return prisma.initiative.findMany({
    where: { ...scope, ...buildFilterWhere(options.filters) },
    orderBy: { updatedAt: 'desc' },
    include: initiativeInclude,
  });
}

const DASHBOARD_WINDOW_DAYS = 30;

function daysAgo(days: number): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days);
  return date;
}

export async function getInitiativeStats() {
  const windowStart = daysAgo(DASHBOARD_WINDOW_DAYS);
  const previousWindowStart = daysAgo(DASHBOARD_WINDOW_DAYS * 2);

  const [total, currentWindow, previousWindow, byStatus, bySource, byClassification] =
    await Promise.all([
      prisma.initiative.count(),
      prisma.initiative.count({ where: { createdAt: { gte: windowStart } } }),
      prisma.initiative.count({
        where: { createdAt: { gte: previousWindowStart, lt: windowStart } },
      }),
      prisma.initiative.groupBy({ by: ['status'], _count: { _all: true } }),
      prisma.initiative.groupBy({ by: ['sourceType'], _count: { _all: true } }),
      prisma.initiative.groupBy({
        by: ['triageClassificationId'],
        _count: { _all: true },
        where: { triageClassificationId: { not: null } },
      }),
    ]);

  const classifications = await prisma.intelligentClassification.findMany({
    select: { id: true, nombre: true },
  });
  const classificationName = new Map(classifications.map((item) => [item.id, item.nombre]));

  // The timeline needs one row per initiative to bucket by day and by routing outcome,
  // which groupBy cannot express in a single query.
  const recent = await prisma.initiative.findMany({
    where: { createdAt: { gte: windowStart } },
    select: { createdAt: true, status: true },
    orderBy: { createdAt: 'asc' },
  });

  const buckets = new Map<string, { lab: number; external: number; pending: number }>();
  for (let offset = DASHBOARD_WINDOW_DAYS - 1; offset >= 0; offset -= 1) {
    buckets.set(daysAgo(offset).toISOString().slice(0, 10), {
      lab: 0,
      external: 0,
      pending: 0,
    });
  }

  for (const item of recent) {
    const key = item.createdAt.toISOString().slice(0, 10);
    const bucket = buckets.get(key);
    if (!bucket) {
      continue;
    }
    if (item.status === InitiativeStatus.TRIAGED_EXTERNAL) {
      bucket.external += 1;
    } else if (item.status === InitiativeStatus.TRIAGED_LAB) {
      bucket.lab += 1;
    } else {
      bucket.pending += 1;
    }
  }

  return {
    total,
    currentWindow,
    previousWindow,
    windowDays: DASHBOARD_WINDOW_DAYS,
    labInboxPending:
      byStatus.find((item) => item.status === InitiativeStatus.TRIAGED_LAB)?._count._all ?? 0,
    byStatus: byStatus.map((item) => ({
      status: item.status,
      count: item._count._all,
    })),
    bySource: bySource.map((item) => ({
      sourceType: item.sourceType,
      count: item._count._all,
    })),
    byClassification: byClassification.map((item) => ({
      id: item.triageClassificationId as string,
      nombre: classificationName.get(item.triageClassificationId as string) ?? 'Sin clasificar',
      count: item._count._all,
    })),
    timeline: [...buckets.entries()].map(([date, value]) => ({ date, ...value })),
  };
}

export async function findInitiativeById(id: string) {
  return prisma.initiative.findUnique({
    where: { id },
    include: initiativeInclude,
  });
}

export async function getInitiativeOrThrow(
  id: string,
  options: {
    userId?: string;
    isAdmin: boolean;
  },
) {
  const initiative = await findInitiativeById(id);
  if (!initiative) {
    throw new AppError('Initiative not found', 404);
  }
  if (!options.isAdmin && initiative.userId !== options.userId) {
    throw new AppError('Initiative not found', 404);
  }
  return initiative;
}

export async function updateInitiative(
  id: string,
  data: Prisma.InitiativeUpdateInput,
) {
  return prisma.initiative.update({
    where: { id },
    data,
    include: initiativeInclude,
  });
}

export async function applyTriageResult(
  id: string,
  data: {
    status: InitiativeStatus;
    // Nulos cuando el triage manda la iniciativa a revisión manual: no hay
    // clasificación que guardar, pero sí razonamiento y confianza.
    triageClassificationId: string | null;
    triageWorkTableId: string | null;
    triageReasoning: string;
    triageConfidence: number;
    triagedAt: Date;
  },
) {
  return prisma.initiative.update({
    where: { id },
    data,
    include: initiativeInclude,
  });
}

export async function markNotificationSent(id: string, sentAt: Date) {
  await prisma.initiative.update({
    where: { id },
    data: { notificationSentAt: sentAt },
  });
}

export async function replaceCompanyContacts(
  initiativeId: string,
  contacts: Array<{
    empresa: string;
    contacto: string;
    cargo: string;
    correo: string;
    telefono: string;
  }>,
) {
  await prisma.$transaction([
    prisma.companyContact.deleteMany({ where: { initiativeId } }),
    prisma.companyContact.createMany({
      data: contacts.map((contact) => ({ ...contact, initiativeId })),
    }),
  ]);
}

export async function deleteInitiative(id: string) {
  await prisma.initiative.delete({ where: { id } });
}
