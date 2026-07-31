'use client';

import { Check, X } from 'lucide-react';
import { INITIATIVE_FIELD_META } from '@/config/initiative-fields';
import type { InitiativeData } from '@/types/initiative';
import { cn } from '@/lib/utils';

type AttributeChecklistProps = {
  data: InitiativeData;
  className?: string;
};

export function AttributeChecklist({ data, className }: AttributeChecklistProps) {
  return (
    <div className={cn('glass-panel rounded-2xl p-4', className)}>
      <p className="mb-3 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
        Atributos de la iniciativa
      </p>
      <ul className="space-y-2">
        {INITIATIVE_FIELD_META.map((field) => {
          const filled = Boolean(data[field.key]?.trim());
          return (
            <li
              key={field.key}
              className="flex items-start gap-2 text-sm"
              title={data[field.key] ?? undefined}
            >
              <span
                className={cn(
                  'mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full',
                  filled ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground',
                )}
                aria-hidden
              >
                {filled ? <Check className="size-3" /> : <X className="size-3" />}
              </span>
              <span className={cn(filled ? 'text-foreground' : 'text-muted-foreground')}>
                {field.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
