'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '@/api/errors';
import {
  getConversation,
  sendMessage,
} from '@/features/conversation/services/conversation.service';
import { useSimulatedStream } from '@/features/chat/hooks/use-simulated-stream';
import {
  createListItemFromConversation,
  useConversationMetaStore,
} from '@/stores/conversation-meta.store';
import type { ConversationMessage, MessageTurnResult } from '@/types/conversation';

export function useChatSession(conversationId: string) {
  const queryClient = useQueryClient();
  const upsert = useConversationMetaStore((state) => state.upsert);
  const touch = useConversationMetaStore((state) => state.touch);
  const [draft, setDraft] = useState('');
  const [localMessages, setLocalMessages] = useState<ConversationMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);
  const lastUserMessageRef = useRef<string>('');
  const stream = useSimulatedStream();

  const conversationQuery = useQuery({
    queryKey: ['conversation', conversationId],
    queryFn: () => getConversation(conversationId),
  });

  useEffect(() => {
    if (!conversationQuery.data) return;

    const data = conversationQuery.data;
    setLocalMessages(data.messages ?? []);
    upsert(
      createListItemFromConversation({
        id: data.id,
        title: data.initiativeData.title ?? undefined,
        status: data.status,
        completion: data.completion,
        preview: data.messages?.at(-1)?.content,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      }),
    );
  }, [conversationQuery.data, upsert]);

  const mutation = useMutation({
    mutationFn: async (message: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      return sendMessage(conversationId, message, controller.signal);
    },
    onMutate: async (message) => {
      lastUserMessageRef.current = message;
      const optimistic: ConversationMessage = {
        id: `temp-user-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, optimistic]);
      setDraft('');
    },
    onSuccess: (result: MessageTurnResult) => {
      stream.start(result.reply);

      const assistantMessage: ConversationMessage = {
        id: `temp-assistant-${Date.now()}`,
        role: 'assistant',
        content: result.reply,
        createdAt: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, assistantMessage]);

      touch(conversationId, {
        completion: result.completion,
        status: result.status,
        preview: result.reply,
        title:
          result.type === 'collecting'
            ? result.initiativeData.title ?? undefined
            : undefined,
      });

      void queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, 'No se pudo enviar el mensaje'));
    },
  });

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort();
    stream.stop();
  }, [stream]);

  const regenerate = useCallback(() => {
    if (!lastUserMessageRef.current || mutation.isPending) return;
    setLocalMessages((prev) => {
      const next = [...prev];
      if (next.at(-1)?.role === 'assistant') next.pop();
      if (next.at(-1)?.role === 'user') next.pop();
      return next;
    });
    mutation.mutate(lastUserMessageRef.current);
  }, [mutation]);

  const displayMessages = useMemo(() => {
    if (!stream.isStreaming || !stream.streamedText) {
      return localMessages;
    }

    const cloned = [...localMessages];
    const last = cloned.at(-1);
    if (last?.role === 'assistant') {
      cloned[cloned.length - 1] = { ...last, content: stream.streamedText };
    }
    return cloned;
  }, [localMessages, stream.isStreaming, stream.streamedText]);

  return {
    conversation: conversationQuery.data,
    messages: displayMessages,
    draft,
    setDraft,
    send: () => {
      const value = draft.trim();
      if (!value || mutation.isPending) return;
      mutation.mutate(value);
    },
    isLoading: conversationQuery.isLoading,
    isError: conversationQuery.isError,
    error: conversationQuery.error,
    refetch: conversationQuery.refetch,
    isGenerating: mutation.isPending || stream.isStreaming,
    stopGeneration,
    regenerate,
  };
}
