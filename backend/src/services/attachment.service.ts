import { Role } from '@prisma/client';
import {
  createAttachment,
  deleteAttachment,
  getAttachmentOrThrow,
  listAttachmentsByInitiative,
} from '../repositories/attachment.repository.js';
import { getInitiativeOrThrow } from '../repositories/domain-initiative.repository.js';
import {
  deleteCloudinaryAsset,
  uploadAttachmentBuffer,
} from './cloudinary.service.js';
import { AppError } from '../utils/AppError.js';

async function assertInitiativeAccess(
  initiativeId: string,
  actor: { id: string; role: Role },
) {
  return getInitiativeOrThrow(initiativeId, {
    userId: actor.id,
    isAdmin: actor.role === Role.ADMIN || actor.role === Role.EVALUATOR,
  });
}

export async function uploadAttachmentForInitiative(
  initiativeId: string,
  actor: { id: string; role: Role },
  file: Express.Multer.File,
) {
  const initiative = await assertInitiativeAccess(initiativeId, actor);
  if (actor.role === Role.GENERATOR && initiative.userId !== actor.id) {
    throw new AppError('Initiative not found', 404);
  }

  const uploaded = await uploadAttachmentBuffer({
    buffer: file.buffer,
    originalName: file.originalname,
    mimeType: file.mimetype,
    size: file.size,
  });

  return createAttachment({
    initiativeId,
    ...uploaded,
  });
}

export async function listAttachmentsForInitiative(
  initiativeId: string,
  actor: { id: string; role: Role },
) {
  await assertInitiativeAccess(initiativeId, actor);
  return listAttachmentsByInitiative(initiativeId);
}

export async function deleteAttachmentForActor(
  id: string,
  actor: { id: string; role: Role },
) {
  const attachment = await getAttachmentOrThrow(id);
  await assertInitiativeAccess(attachment.initiativeId, actor);
  await deleteCloudinaryAsset(attachment.publicId);
  await deleteAttachment(id);
}
