import type { Metadata } from 'next';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';

export const metadata: Metadata = {
  title: 'Dashboard',
};

export default function DashboardPage() {
  return (
    <div className="h-full min-h-0 overflow-y-auto">
      <DashboardView />
    </div>
  );
}
