import { env } from '@/config/env';
import { ApiClientError } from '@/api/errors';
import type { ApiResponse } from '@/types/api';
import type { PublicSubmissionPayload, PublicSubmissionResult } from '@/features/submit/types';

/**
 * Public intake. Sends no token and no cookies. When there are evidence files,
 * uses multipart (`payload` JSON + `files`); otherwise plain JSON.
 */
export async function submitPublicInitiative(
  payload: PublicSubmissionPayload,
  files: File[] = [],
): Promise<PublicSubmissionResult> {
  const headers: Record<string, string> = { Accept: 'application/json' };
  let body: BodyInit;

  if (files.length > 0) {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    for (const file of files) {
      form.append('files', file);
    }
    body = form;
  } else {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(payload);
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/public/initiatives`, {
    method: 'POST',
    headers,
    credentials: 'omit',
    body,
  });

  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const result = (isJson ? await response.json() : null) as ApiResponse<PublicSubmissionResult> | null;

  if (!response.ok || !result?.success) {
    throw new ApiClientError(
      result?.message ?? `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return result.data;
}
