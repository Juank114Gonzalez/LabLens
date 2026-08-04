'use client';

import { Building2, Globe2, Handshake } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SourceType } from '@/features/submit/types';

type Option = {
  value: SourceType;
  title: string;
  description: string;
  icon: LucideIcon;
};

const OPTIONS: Option[] = [
  {
    value: 'INTERNAL',
    title: 'Área interna de ACH',
    description:
      'Operaciones, Negocio, Riesgos, TI o Canales Digitales enviando una necesidad propia.',
    icon: Building2,
  },
  {
    value: 'EXTERNAL_CONTRACTOR',
    title: 'Organización externa',
    description: 'Proveedores, aliados o contractors con acceso al Laboratorio Digital.',
    icon: Handshake,
  },
  {
    value: 'INTERNATIONAL_REFERENCE',
    title: 'Referencia internacional',
    description:
      'Un benchmark visto en un congreso, simposio o publicación que vale la pena replicar.',
    icon: Globe2,
  },
];

type Props = {
  value: SourceType | null;
  onSelect: (value: SourceType) => void;
};

export function SourceSelector({ value, onSelect }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {OPTIONS.map((option) => {
        const Icon = option.icon;
        const selected = value === option.value;

        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelect(option.value)}
            aria-pressed={selected}
            className={cn(
              'flex h-full flex-col gap-3 rounded-2xl border border-border/70 p-5 text-left transition',
              'hover:border-primary/60 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              selected && 'border-primary bg-primary/5 ring-1 ring-primary/40',
            )}
          >
            <span
              className={cn(
                'inline-flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground',
                selected && 'bg-primary/15 text-primary',
              )}
            >
              <Icon className="size-5" />
            </span>
            <span className="font-heading text-base font-medium">{option.title}</span>
            <span className="text-sm text-muted-foreground">{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}

export const SOURCE_LABELS: Record<SourceType, string> = {
  INTERNAL: 'Área interna de ACH',
  EXTERNAL_CONTRACTOR: 'Organización externa',
  INTERNATIONAL_REFERENCE: 'Referencia internacional',
};
