'use client';

import { motion } from 'motion/react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type CompletionCardProps = {
  completion: number;
  className?: string;
};

export function CompletionCard({ completion, className }: CompletionCardProps) {
  const blocks = 10;
  const filled = Math.round((completion / 100) * blocks);

  return (
    <div className={cn('glass-panel space-y-4 rounded-2xl p-4', className)}>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
            Completitud
          </p>
          <p className="mt-1 font-heading text-3xl font-semibold tabular-nums text-primary">
            {completion}%
          </p>
        </div>
        <p className="max-w-[9rem] text-right text-xs text-muted-foreground">
          Umbral de evaluación: 85%
        </p>
      </div>

      <div className="flex gap-1" aria-hidden>
        {Array.from({ length: blocks }).map((_, index) => (
          <motion.span
            key={index}
            initial={false}
            animate={{
              backgroundColor:
                index < filled ? 'var(--color-primary)' : 'color-mix(in oklab, var(--color-muted) 80%, transparent)',
            }}
            className="h-2.5 flex-1 rounded-sm"
          />
        ))}
      </div>

      <Progress value={completion} className="h-1.5" />
    </div>
  );
}
