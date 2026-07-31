'use client';

import { useEffect, useRef } from 'react';
import { FlaskConical, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChatInput } from '@/features/chat/components/chat-input';
import { MessageBubble } from '@/features/chat/components/message-bubble';
import { TypingIndicator } from '@/features/chat/components/typing-indicator';
import { useChatSession } from '@/features/chat/hooks/use-chat-session';
import { EmptyState } from '@/shared/components/empty-state';
import { StatusBadge } from '@/shared/components/status-badge';

type ChatWindowProps = {
  conversationId: string;
};

export function ChatWindow({ conversationId }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const {
    conversation,
    messages,
    draft,
    setDraft,
    send,
    isLoading,
    isError,
    refetch,
    isGenerating,
    stopGeneration,
    regenerate,
  } = useChatSession(conversationId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  if (isLoading) {
    return (
      <div className="flex h-full flex-col gap-4 p-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-24 w-2/3" />
        <Skeleton className="ml-auto h-20 w-1/2" />
        <Skeleton className="h-28 w-3/4" />
      </div>
    );
  }

  if (isError || !conversation) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          icon={RotateCcw}
          title="No se pudo cargar la conversación"
          description="Verifica que el backend esté en ejecución y reintenta."
          action={
            <Button type="button" onClick={() => void refetch()}>
              Reintentar
            </Button>
          }
        />
      </div>
    );
  }

  const completed = conversation.status === 'COMPLETED';

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between border-b border-border/70 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <p className="truncate font-heading text-base font-medium sm:text-lg">
            {conversation.initiativeData.title || 'Nueva iniciativa'}
          </p>
          <p className="text-xs text-muted-foreground">
            Comité Virtual · entrevista guiada por LabLens
          </p>
        </div>
        <StatusBadge status={conversation.status} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-5">
          {messages.length === 0 ? (
            <EmptyState
              icon={FlaskConical}
              title="LabLens está listo para entrevistarte"
              description="Cuéntale tu idea. No evaluará todavía: primero reunirá el contexto necesario."
              className="border-0 bg-transparent py-16"
            />
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                showActions={
                  message.role === 'assistant' && index === messages.length - 1 && !isGenerating
                }
                onRegenerate={
                  message.role === 'assistant' && index === messages.length - 1
                    ? regenerate
                    : undefined
                }
              />
            ))
          )}

          {isGenerating && messages.at(-1)?.role === 'user' ? <TypingIndicator /> : null}
          <div ref={bottomRef} />
        </div>
      </div>

      <ChatInput
        value={draft}
        onChange={setDraft}
        onSubmit={send}
        onStop={stopGeneration}
        isGenerating={isGenerating}
        disabled={completed}
        placeholder={
          completed
            ? 'Esta conversación ya fue evaluada. Consulta el panel derecho.'
            : 'Describe tu iniciativa o responde a LabLens…'
        }
      />
    </div>
  );
}
