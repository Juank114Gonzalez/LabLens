'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PublicInitiativeForm } from '@/features/submit/components/public-initiative-form';
import { SourceSelector } from '@/features/submit/components/source-selector';
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
  const presetSource = SOURCE_BY_QUERY[searchParams.get('source') ?? ''] ?? null;

  const [sourceType, setSourceType] = useState<SourceType | null>(presetSource);
  const [result, setResult] = useState<PublicSubmissionResult | null>(null);

  if (result) {
    return (
      <TriageResultScreen
        result={result}
        onSubmitAnother={() => {
          setResult(null);
          setSourceType(presetSource);
        }}
      />
    );
  }

  if (!sourceType) {
    return (
      <div className="space-y-6">
        <div className="space-y-1">
          <h1 className="font-heading text-2xl font-semibold">Envía tu iniciativa</h1>
          <p className="text-sm text-muted-foreground">
            El Comité Virtual la analiza y te dice a qué mesa de trabajo corresponde. No necesitas
            crear una cuenta.
          </p>
        </div>
        <SourceSelector value={sourceType} onSelect={setSourceType} />
      </div>
    );
  }

  return (
    <PublicInitiativeForm
      sourceType={sourceType}
      onBack={() => setSourceType(null)}
      onSubmitted={setResult}
    />
  );
}
