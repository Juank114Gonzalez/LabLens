'use client';

import Link from 'next/link';
import { MoreHorizontal, Pencil, Star, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { routes } from '@/config/routes';
import { formatShortDate } from '@/shared/lib/dates';
import type { ConversationListItem } from '@/types/conversation';
import { cn } from '@/lib/utils';

type ConversationItemProps = {
  item: ConversationListItem;
  active?: boolean;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
};

export function ConversationItem({
  item,
  active,
  onRename,
  onDelete,
  onToggleFavorite,
}: ConversationItemProps) {
  return (
    <div
      className={cn(
        'group relative rounded-xl border border-transparent transition-colors',
        active ? 'border-border bg-sidebar-accent' : 'hover:bg-sidebar-accent/60',
      )}
    >
      <Link
        href={routes.chat(item.id)}
        className="block px-3 py-2.5 pr-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="flex items-center gap-2">
          {item.favorite ? (
            <Star className="size-3.5 fill-signal text-signal" aria-label="Favorita" />
          ) : null}
          <p className="truncate text-sm font-medium">{item.title}</p>
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{item.preview}</p>
        <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground/80">
          {item.completion}% · {formatShortDate(item.updatedAt)}
        </p>
      </Link>

      <div className="absolute right-1 top-1.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="size-7"
              aria-label="Opciones de conversación"
            >
              <MoreHorizontal className="size-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onToggleFavorite(item.id)}>
              <Star className="size-3.5" />
              {item.favorite ? 'Quitar favorito' : 'Marcar favorito'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onRename(item.id)}>
              <Pencil className="size-3.5" />
              Renombrar
            </DropdownMenuItem>
            <DropdownMenuItem variant="destructive" onClick={() => onDelete(item.id)}>
              <Trash2 className="size-3.5" />
              Eliminar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
