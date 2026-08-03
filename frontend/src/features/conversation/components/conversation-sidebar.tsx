'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ClipboardList,
  FilePlus2,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings2,
  Shield,
  Table2,
  Tags,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  canAccessAdmin,
  canAccessChat,
  canAccessEvaluations,
  canManageInitiatives,
} from '@/features/auth/lib/roles';
import { Logo } from '@/shared/components/logo';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function ConversationSidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const role = user?.role;

  const items: NavItem[] = [];

  if (role) {
    items.push({ href: routes.dashboard, label: 'Dashboard', icon: LayoutDashboard });

    if (canManageInitiatives(role)) {
      items.push(
        { href: routes.initiatives, label: 'Mis iniciativas', icon: ClipboardList },
        { href: routes.initiativeNew, label: 'Nueva iniciativa', icon: FilePlus2 },
      );
    }

    if (canAccessEvaluations(role)) {
      items.push({ href: routes.evaluations, label: 'Evaluaciones', icon: MessageSquare });
    }

    if (canAccessChat(role) && role === 'EVALUATOR') {
      items.push({ href: routes.chatNew, label: 'Chat LabLens', icon: MessageSquare });
    }

    if (canAccessAdmin(role)) {
      items.push(
        { href: routes.adminUsers, label: 'Usuarios', icon: Users },
        { href: routes.adminCriteria, label: 'Criterios', icon: Settings2 },
        { href: routes.adminClassifications, label: 'Clasificaciones', icon: Tags },
        { href: routes.adminWorkTables, label: 'Mesas de trabajo', icon: Table2 },
      );
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
        {role === 'ADMIN' ? (
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <Shield className="size-3.5" /> Panel de administración
          </p>
        ) : null}
      </div>

      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-2 pb-3">
        {items.map((item) => {
          const active =
            pathname === item.href ||
            (item.href !== routes.dashboard && pathname.startsWith(item.href));
          return (
            <Button
              key={item.href}
              asChild
              variant="ghost"
              className={cn(
                'w-full justify-start gap-2',
                active && 'bg-sidebar-accent text-sidebar-accent-foreground',
              )}
            >
              <Link href={item.href} onClick={() => setSidebarOpen(false)}>
                <item.icon className="size-4" />
                {item.label}
              </Link>
            </Button>
          );
        })}
      </nav>

      <Separator />

      <div className="p-3">
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
                  {user?.role}
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
