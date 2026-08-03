'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  LogOut,
  MessageSquarePlus,
  Search,
  Settings,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { routes } from '@/config/routes';
import { useAuth } from '@/features/auth/hooks/use-auth';
import { ConversationItem } from '@/features/conversation/components/conversation-item';
import { useConversations } from '@/features/conversation/hooks/use-conversations';
import { Logo } from '@/shared/components/logo';
import {
  DATE_GROUP_LABELS,
  groupDateLabel,
  type DateGroup,
} from '@/shared/lib/dates';
import { useUiStore } from '@/stores/ui.store';

const GROUP_ORDER: DateGroup[] = ['today', 'yesterday', 'week', 'older'];

export function ConversationSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { data: items = [], isLoading } = useConversations();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const [query, setQuery] = useState('');

  const grouped = useMemo(() => {
    const filtered = items
      .filter((item) => {
        const q = query.trim().toLowerCase();
        if (!q) return true;
        return (
          item.title.toLowerCase().includes(q) ||
          item.preview.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));

    return GROUP_ORDER.map((group) => ({
      group,
      items: filtered.filter((item) => groupDateLabel(item.updatedAt) === group),
    })).filter((entry) => entry.items.length > 0);
  }, [items, query]);

  function handleRename(_id: string) {
    toast.message('Renombrar conversaciones estará disponible pronto');
  }

  function handleDelete(id: string) {
    toast.message('Eliminar conversaciones estará disponible pronto');
    if (pathname.includes(id)) {
      router.push(routes.dashboard);
    }
  }

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-r border-border/70 bg-sidebar text-sidebar-foreground">
      <div className="space-y-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <Logo compact className="min-w-0" />
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="size-8 lg:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            ×
          </Button>
        </div>

        <Button asChild className="w-full justify-start gap-2">
          <Link href={routes.chatNew} onClick={() => setSidebarOpen(false)}>
            <MessageSquarePlus className="size-4" />
            Nueva conversación
          </Link>
        </Button>

        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar conversaciones"
            className="h-9 bg-background/50 pl-9"
            aria-label="Buscar conversaciones"
          />
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-2 pb-3">
        {isLoading ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">Cargando conversaciones…</p>
        ) : grouped.length === 0 ? (
          <p className="px-3 py-6 text-sm text-muted-foreground">
            Aún no hay conversaciones. Crea la primera iniciativa.
          </p>
        ) : (
          grouped.map((section) => (
            <section key={section.group} className="mb-4">
              <h2 className="px-3 pb-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
                {DATE_GROUP_LABELS[section.group]}
              </h2>
              <div className="space-y-1">
                {section.items.map((item) => (
                  <ConversationItem
                    key={item.id}
                    item={item}
                    active={pathname.includes(item.id)}
                    onRename={handleRename}
                    onDelete={handleDelete}
                    onToggleFavorite={() =>
                      toast.message('Favoritos estará disponible pronto')
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <Separator />

      <div className="space-y-1 p-3">
        <Button asChild variant="ghost" className="w-full justify-start">
          <Link href={routes.dashboard}>
            <LayoutDashboard className="size-4" />
            Dashboard
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          className="w-full justify-start"
          onClick={() => toast.message('Configuración disponible en una próxima iteración')}
        >
          <Settings className="size-4" />
          Configuración
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start gap-3 px-2 py-2"
            >
              <Avatar size="sm">
                <AvatarFallback>
                  {(user?.name ?? 'U')
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium">{user?.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            <DropdownMenuLabel>Perfil</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>
              <LogOut className="size-3.5" />
              Cerrar sesión
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
