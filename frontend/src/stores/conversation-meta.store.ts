'use client';

import { create } from 'zustand';
import type { ConversationListItem, ConversationStatus } from '@/types/conversation';

type ConversationMetaState = {
  items: ConversationListItem[];
  setItems: (items: ConversationListItem[]) => void;
  upsert: (item: ConversationListItem) => void;
  rename: (id: string, title: string) => void;
  remove: (id: string) => void;
  toggleFavorite: (id: string) => void;
  touch: (
    id: string,
    patch: Partial<Pick<ConversationListItem, 'preview' | 'completion' | 'status' | 'title'>>,
  ) => void;
  clear: () => void;
};

export const useConversationMetaStore = create<ConversationMetaState>((set) => ({
  items: [],
  setItems: (items) => set({ items }),
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
  clear: () => set({ items: [] }),
}));

export function createListItemFromConversation(input: {
  id: string;
  title?: string | null;
  status: ConversationStatus;
  completion: number;
  preview?: string;
  initiativeId?: string | null;
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
    initiativeId: input.initiativeId ?? null,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
  };
}
