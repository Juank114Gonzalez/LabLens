'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicInitiativeForm } from '@/features/submit/components/public-initiative-form';
import { TriageResultScreen } from '@/features/submit/components/triage-result-screen';
import type { PublicSubmissionResult, SourceType } from '@/features/submit/types';

/** `?source=international` lets the Lab share a direct link or QR for benchmarks. */
const SOURCE_BY_QUERY: Record<string, SourceType> = {
  internal: 'INTERNAL',
  external: 'EXTERNAL_CONTRACTOR',
  international: 'INTERNATIONAL_REFERENCE',
};

export function SubmitFlow() {
  const searchParams = useSearchParams();
  const defaultSourceType =
    SOURCE_BY_QUERY[searchParams.get('source') ?? ''] ?? 'INTERNAL';

  const [result, setResult] = useState<PublicSubmissionResult | null>(null);

  if (result) {
    return <TriageResultScreen result={result} onSubmitAnother={() => setResult(null)} />;
  }

  return (
    <PublicInitiativeForm defaultSourceType={defaultSourceType} onSubmitted={setResult} />
  );
}
