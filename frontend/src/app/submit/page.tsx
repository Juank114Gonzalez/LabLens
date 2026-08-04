import { Suspense } from 'react';
import type { Metadata } from 'next';
import { SubmitFlow } from '@/features/submit/components/submit-flow';

export const metadata: Metadata = {
  title: 'Enviar una iniciativa',
  description:
    'Envía una iniciativa al Comité Virtual de Innovación del Laboratorio Digital de ACH.',
};

export default function SubmitPage() {
  return (
    <Suspense fallback={null}>
      <SubmitFlow />
    </Suspense>
  );
}
