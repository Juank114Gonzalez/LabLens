'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ConversationListItem, ConversationStatus } from '@/types/conversation';

type ConversationMetaState = {
  items: ConversationListItem[];
  upsert: (item: ConversationListItem) => void;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  touch: (
    id: string,
    patch: Partial<Pick<ConversationListItem, 'preview' | 'completion' | 'status' | 'title'>>,
  ) => void;
};

export const useConversationMetaStore = create<ConversationMetaState>()(
  persist(
    (set) => ({
      items: [],
      upsert: (item) =>
        set((state) => {
          const exists = state.items.some((entry) => entry.id === item.id);
          if (!exists) {
            return { items: [item, ...state.items] };
          }
          return {
            items: state.items.map((entry) =>
              entry.id === item.id ? { ...entry, ...item } : entry,
            ),
          };
        }),
      rename: (id, title) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.id === id ? { ...entry, title, updatedAt: new Date().toISOString() } : entry,
          ),
        })),
      remove: (id) =>
        set((state) => ({
          items: state.items.filter((entry) => entry.id !== id),
        })),
      toggleFavorite: (id) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.id === id ? { ...entry, favorite: !entry.favorite } : entry,
          ),
        })),
      touch: (id, patch) =>
        set((state) => ({
          items: state.items.map((entry) =>
            entry.id === id
              ? { ...entry, ...patch, updatedAt: new Date().toISOString() }
              : entry,
          ),
        })),
    }),
    { name: 'lablens-conversation-meta' },
  ),
);

export function createListItemFromConversation(input: {
  id: string;
  title?: string;
  status: ConversationStatus;
  completion: number;
  preview?: string;
  createdAt: string;
  updatedAt: string;
}): ConversationListItem {
  return {
    id: input.id,
    title: input.title?.trim() || 'Nueva iniciativa',
    status: input.status,
    completion: input.completion,
    favorite: false,
    preview: input.preview ?? 'Conversación recién creada',
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
