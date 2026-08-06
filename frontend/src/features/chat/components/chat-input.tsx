'use client';

import { useEffect, useRef } from 'react';
import { ArrowUp, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

type ChatInputProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  onStop?: () => void;
  isGenerating?: boolean;
  disabled?: boolean;
  placeholder?: string;
};

export function ChatInput({
  value,
  onChange,
  onSubmit,
  onStop,
  isGenerating = false,
  disabled = false,
  placeholder = 'Describe tu iniciativa o responde al Lente de Innovación…',
}: ChatInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    el.style.height = `${Math.min(el.scrollHeight, 180)}px`;
  }, [value]);

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (!isGenerating && value.trim()) {
        onSubmit();
      }
    }
  }

  return (
    <div className="border-t border-border/70 bg-background/80 p-4 backdrop-blur-xl">
      <div
        className={cn(
          'mx-auto flex max-w-3xl items-end gap-2 rounded-2xl border border-border/80 bg-card/80 p-2 shadow-sm',
        )}
      >
        <Textarea
          ref={ref}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isGenerating}
          rows={1}
          className="min-h-[44px] resize-none border-0 bg-transparent px-3 py-2.5 shadow-none focus-visible:ring-0"
          aria-label="Mensaje para el Lente de Innovación"
        />
        {isGenerating ? (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="mb-0.5 size-10 shrink-0 rounded-xl"
            onClick={onStop}
            aria-label="Detener generación"
          >
            <Square className="size-4 fill-current" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            className="mb-0.5 size-10 shrink-0 rounded-xl"
            onClick={onSubmit}
            disabled={disabled || !value.trim()}
            aria-label="Enviar mensaje"
          >
            <ArrowUp className="size-4" />
          </Button>
        )}
      </div>
      <p className="mx-auto mt-2 max-w-3xl px-1 text-center text-[11px] text-muted-foreground">
        Enter para enviar · Shift+Enter para nueva línea
      </p>
    </div>
  );
}
