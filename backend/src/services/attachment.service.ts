import { InitiativeStatus, Role } from '@prisma/client';
import { createRequire } from 'node:module';
import { PassThrough } from 'node:stream';

const require = createRequire(import.meta.url);
// archiver ships CJS; cast keeps NodeNext + strict TS happy
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const archiver = require('archiver') as any;
import {
  createAttachment,
  countAttachmentsWithPublicId,
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
  if (initiative.status !== InitiativeStatus.DRAFT) {
    throw new AppError('Solo se pueden adjuntar evidencias en borrador', 409);
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
  const initiative = await assertInitiativeAccess(attachment.initiativeId, actor);
  if (initiative.status !== InitiativeStatus.DRAFT) {
    throw new AppError('Solo se pueden eliminar evidencias en borrador', 409);
  }
  // El archivo en Cloudinary solo se destruye si esta era la última fila que lo
  // usaba. Las copias de una iniciativa comparten `publicId` con el original en
  // vez de duplicar la subida, así que destruirlo a ciegas al borrar una copia
  // dejaría al original con un enlace roto a su propia evidencia.
  const enUso = await countAttachmentsWithPublicId(attachment.publicId);
  if (enUso <= 1) {
    await deleteCloudinaryAsset(attachment.publicId);
  }

  await deleteAttachment(id);
}

export async function downloadAttachmentsZip(
  initiativeId: string,
  actor: { id: string; role: Role },
): Promise<{ stream: PassThrough; filename: string }> {
  const initiative = await assertInitiativeAccess(initiativeId, actor);
  const attachments = await listAttachmentsByInitiative(initiativeId);

  if (attachments.length === 0) {
    throw new AppError('No hay evidencias para descargar', 404);
  }

  const archive = archiver('zip', { zlib: { level: 9 } });
  const stream = new PassThrough();
  archive.pipe(stream);

  for (const item of attachments) {
    const response = await fetch(item.secureUrl);
    if (!response.ok || !response.body) {
      continue;
    }
    const buffer = Buffer.from(await response.arrayBuffer());
    archive.append(buffer, { name: item.originalName });
  }

  void archive.finalize();

  const safeName = (initiative.nombre || 'iniciativa').replace(/[^\w-]+/g, '_');
  return {
    stream,
    filename: `evidencias-${safeName}.zip`,
  };
}
