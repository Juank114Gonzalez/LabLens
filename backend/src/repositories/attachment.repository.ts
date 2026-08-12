import { prisma } from '../services/prisma.service.js';
import { AppError } from '../utils/AppError.js';

export async function createAttachment(input: {
  initiativeId: string;
  publicId: string;
  secureUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
}) {
  return prisma.attachment.create({ data: input });
}

export async function listAttachmentsByInitiative(initiativeId: string) {
  return prisma.attachment.findMany({
    where: { initiativeId },
    orderBy: { createdAt: 'desc' },
  });
}

export async function getAttachmentOrThrow(id: string) {
  const attachment = await prisma.attachment.findUnique({ where: { id } });
  if (!attachment) {
    throw new AppError('Attachment not found', 404);
  }
  return attachment;
}

export async function deleteAttachment(id: string) {
  await prisma.attachment.delete({ where: { id } });
}

/**
 * Cuántas filas apuntan al mismo archivo de Cloudinary.
 *
 * Al copiar una iniciativa, la copia reutiliza el mismo `publicId` en vez de
 * volver a subir el archivo. Por eso borrar un adjunto ya no puede destruir el
 * asset sin más: habría que comprobar antes que no queda nadie más usándolo.
 */
export async function countAttachmentsWithPublicId(publicId: string) {
  return prisma.attachment.count({ where: { publicId } });
}
