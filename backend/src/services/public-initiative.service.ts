import { InitiativeStatus } from '@prisma/client';
import { createAttachment } from '../repositories/attachment.repository.js';
import { createInitiative } from '../repositories/domain-initiative.repository.js';
import type { PublicInitiativeDto } from '../validators/public-initiative.validator.js';
import { uploadAttachmentBuffer } from './cloudinary.service.js';
import { runTriage, type TriageResult } from './triage.service.js';

export type PublicSubmissionResult = {
  initiative: {
    id: string;
    nombre: string;
    status: InitiativeStatus;
    sourceType: PublicInitiativeDto['sourceType'];
  };
  triage: TriageResult | null;
};

/**
 * Entry point for the three intake channels. No session involved: the initiative is
 * stored as REGISTERED and triaged in the same request so the submitter sees where
 * their idea was routed before leaving the page.
 */
export async function submitPublicInitiative(
  input: PublicInitiativeDto,
  files: Express.Multer.File[] = [],
): Promise<PublicSubmissionResult> {
  const { companyContacts, ...fields } = input;

  const initiative = await createInitiative({
    userId: null,
    data: {
      ...fields,
      fechaDiligenciamiento: fields.fechaDiligenciamiento ?? new Date(),
      status: InitiativeStatus.REGISTERED,
    },
    companyContacts,
  });

  for (const file of files) {
    const uploaded = await uploadAttachmentBuffer({
      buffer: file.buffer,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
    await createAttachment({
      initiativeId: initiative.id,
      ...uploaded,
    });
  }

  let triage: TriageResult | null = null;

  try {
    triage = await runTriage(initiative.id);
  } catch (error) {
    // A failed triage must not discard the submission: it stays REGISTERED and an
    // evaluator can classify it manually from the Lab inbox.
    console.error('[PublicInitiativeService] Triage failed', error);
  }

  return {
    initiative: {
      id: initiative.id,
      nombre: initiative.nombre,
      status: triage?.status ?? initiative.status,
      sourceType: initiative.sourceType,
    },
    triage,
  };
}
