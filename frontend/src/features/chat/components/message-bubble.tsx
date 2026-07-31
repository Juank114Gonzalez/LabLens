'use client';

import { useState } from 'react';
import { Check, Copy, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { MarkdownContent } from '@/features/chat/components/markdown-content';
import type { ConversationMessage } from '@/types/conversation';
import { cn } from '@/lib/utils';

type MessageBubbleProps = {
  message: ConversationMessage;
  onRegenerate?: () => void;
  showActions?: boolean;
};

export function MessageBubble({
  message,
  onRegenerate,
  showActions = false,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';

  async function handleCopy() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success('Respuesta copiada');
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn('flex w-full', isUser ? 'justify-end' : 'justify-start')}
    >
      <div className={cn('max-w-[min(720px,92%)] space-y-2', isUser ? 'items-end' : 'items-start')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
            isUser
              ? 'bg-primary text-primary-foreground'
              : 'glass-panel text-foreground',
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <MarkdownContent content={message.content} />
          )}
        </div>

        {!isUser && showActions ? (
          <div className="flex items-center gap-1 pl-1">
            <Button
              type="button"
              size="sm"
              variant="ghost"
              className="h-8 px-2 text-muted-foreground"
              onClick={handleCopy}
              aria-label="Copiar respuesta"
            >
              {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
            </Button>
            {onRegenerate ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-8 px-2 text-muted-foreground"
                onClick={onRegenerate}
                aria-label="Regenerar respuesta"
              >
                <RefreshCw className="size-3.5" />
              </Button>
            ) : null}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
