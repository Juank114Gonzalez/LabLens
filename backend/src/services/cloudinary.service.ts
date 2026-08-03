import { Readable } from 'node:stream';
import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const ALLOWED_ATTACHMENT_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'image/png',
  'image/jpeg',
]);

export type UploadedFile = {
  publicId: string;
  secureUrl: string;
  originalName: string;
  mimeType: string;
  size: number;
};

export async function uploadAttachmentBuffer(input: {
  buffer: Buffer;
  originalName: string;
  mimeType: string;
  size: number;
}): Promise<UploadedFile> {
  if (!ALLOWED_ATTACHMENT_MIME_TYPES.has(input.mimeType)) {
    throw new AppError(
      'Unsupported file type. Allowed: PDF, DOCX, XLSX, PNG, JPG, JPEG',
      400,
    );
  }

  try {
    const result = await new Promise<{
      public_id: string;
      secure_url: string;
      bytes: number;
    }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: env.CLOUDINARY_FOLDER,
          resource_type: 'auto',
          use_filename: true,
          unique_filename: true,
        },
        (error, uploadResult) => {
          if (error || !uploadResult) {
            reject(error ?? new Error('Cloudinary upload failed'));
            return;
          }
          resolve({
            public_id: uploadResult.public_id,
            secure_url: uploadResult.secure_url,
            bytes: uploadResult.bytes,
          });
        },
      );

      Readable.from(input.buffer).pipe(stream);
    });

    return {
      publicId: result.public_id,
      secureUrl: result.secure_url,
      originalName: input.originalName,
      mimeType: input.mimeType,
      size: input.size || result.bytes,
    };
  } catch {
    throw new AppError('Failed to upload file to Cloudinary', 502);
  }
}

export async function deleteCloudinaryAsset(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
  } catch {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch {
      // Best-effort cleanup; DB row may still be removed by caller.
    }
  }
}
