'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { cn } from '@/lib/utils';

/**
 * Normaliza texto del LLM (markdown crudo, (1)(2), rótulos) a markdown legible.
 */
export function normalizeEvaluationProse(raw: string): string {
  let text = raw.trim();
  if (!text) return '';

  // Decisión en mayúsculas al inicio → título destacado
  text = text.replace(
    /^([A-ZÁÉÍÓÚÜÑ][A-ZÁÉÍÓÚÜÑ\s]{2,40})\.\s+/,
    (_match, decision: string) => `### ${decision.trim()}\n\n`,
  );

  // Rótulos frecuentes → subtítulos
  text = text.replace(
    /\*\*([^*]+?)\*\*\s*:/g,
    (_match, label: string) => `\n\n### ${label.trim()}\n\n`,
  );

  text = text.replace(
    /(^|[.!?]\s+|;\s*)((?:Puntos?\s+positivos?|Limitaciones?(?:\s+que\s+mitigan\s+score)?|Limitantes|Recomendación(?:\s+final)?|Factores?|Conclusión|Urgencia\s+y\s+impacto))\s*:\s*/gi,
    (_match, prefix: string, label: string) => `${prefix}\n\n### ${label.trim()}\n\n`,
  );

  // Numeración inline (1) (2) → lista markdown
  text = text.replace(/\s*\((\d+)\)\s+/g, '\n$1. ');

  // Separadores ; antes de ítems ya convertidos
  text = text.replace(/;\s*(?=\d+\.\s)/g, '\n');

  // Compactar saltos excesivos
  text = text.replace(/\n{3,}/g, '\n\n').trim();

  return text;
}

type EvaluationProseProps = {
  content: string;
  className?: string;
};

export function EvaluationProse({ content, className }: EvaluationProseProps) {
  const markdown = normalizeEvaluationProse(content);
  if (!markdown) return null;

  return (
    <div
      className={cn(
        'text-sm leading-relaxed text-foreground/90',
        '[&_h3]:mt-3 [&_h3]:mb-1.5 [&_h3]:font-heading [&_h3]:text-xs [&_h3]:font-semibold [&_h3]:uppercase [&_h3]:tracking-wide [&_h3]:text-muted-foreground',
        '[&_h3:first-child]:mt-0',
        '[&_p]:my-1.5 [&_p]:text-sm [&_p]:leading-relaxed',
        '[&_strong]:font-semibold [&_strong]:text-foreground',
        '[&_ol]:my-2 [&_ol]:list-decimal [&_ol]:space-y-1.5 [&_ol]:pl-5',
        '[&_ul]:my-2 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_ul]:pl-5',
        '[&_li]:leading-relaxed [&_li]:marker:text-muted-foreground',
        className,
      )}
    >
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
