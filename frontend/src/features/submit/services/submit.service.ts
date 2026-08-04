import { apiClient } from '@/api/client';
import type { PublicSubmissionPayload, PublicSubmissionResult } from '@/features/submit/types';

/**
 * Public intake. Sends no token and no cookies: the endpoint is stateless, which
 * keeps the unauthenticated surface free of any CSRF concern.
 */
export async function submitPublicInitiative(
  payload: PublicSubmissionPayload,
): Promise<PublicSubmissionResult> {
  return apiClient.post<PublicSubmissionResult>('/api/public/initiatives', payload, {
    auth: false,
    credentials: 'omit',
    skipRefresh: true,
    retry: 0,
  });
}
