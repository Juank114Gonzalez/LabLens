'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Menu, PanelRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ConversationSidebar } from '@/features/conversation/components/conversation-sidebar';
import { RightInsightPanel } from '@/features/evaluation/components/right-insight-panel';
import { useUiStore } from '@/stores/ui.store';
import { cn } from '@/lib/utils';

type AppShellProps = {
  children: React.ReactNode;
  showRightPanel?: boolean;
};

export function AppShell({ children, showRightPanel = true }: AppShellProps) {
  const params = useParams<{ conversationId?: string }>();
  const conversationId = params?.conversationId;

  /*
   * El panel derecho es el estado de *una* entrevista, así que solo existe
   * cuando hay una abierta. El layout envuelve todas las páginas del
   * back-office, y sin esta condición aparecía también en iniciativas,
   * evaluaciones y administración, donde nunca tuvo nada que mostrar: se veía
   * una columna con "Estado de Evaluación · Modo entrevista · sin juicios" y un
   * marco vacío debajo, robando 340px de ancho a la tabla.
   */
  const panelVisible = showRightPanel && Boolean(conversationId);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const rightPanelOpen = useUiStore((state) => state.rightPanelOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const setRightPanelOpen = useUiStore((state) => state.setRightPanelOpen);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const toggleRightPanel = useUiStore((state) => state.toggleRightPanel);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggleSidebar();
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'i') {
        event.preventDefault();
        toggleRightPanel();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [toggleRightPanel, toggleSidebar]);

  return (
    <div className="flex h-svh overflow-hidden bg-background">
      <div
        className={cn(
          'fixed inset-y-0 left-0 z-40 h-full min-h-0 w-[300px] transition-transform lg:static lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <ConversationSidebar />
      </div>

      {sidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          aria-label="Cerrar sidebar"
          onClick={() => setSidebarOpen(false)}
        />
      ) : null}

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <div className="flex items-center gap-2 border-b border-border/70 px-3 py-2 lg:hidden">
          <Button
            type="button"
            size="icon"
            variant="ghost"
            onClick={() => setSidebarOpen(true)}
            aria-label="Abrir menú"
          >
            <Menu className="size-4" />
          </Button>
          {panelVisible ? (
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="ml-auto"
              onClick={() => setRightPanelOpen(true)}
              aria-label="Abrir panel de evaluación"
            >
              <PanelRight className="size-4" />
            </Button>
          ) : null}
        </div>

        <main className="min-h-0 min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>

      {panelVisible ? (
        <>
          <div
            className={cn(
              'fixed inset-y-0 right-0 z-40 h-full min-h-0 w-[340px] transition-transform xl:static xl:translate-x-0',
              rightPanelOpen ? 'translate-x-0' : 'translate-x-full',
            )}
          >
            <RightInsightPanel conversationId={conversationId} />
          </div>
          {rightPanelOpen ? (
            <button
              type="button"
              className="fixed inset-0 z-30 bg-black/40 xl:hidden"
              aria-label="Cerrar panel derecho"
              onClick={() => setRightPanelOpen(false)}
            />
          ) : null}
        </>
      ) : null}
    </div>
  );
}
