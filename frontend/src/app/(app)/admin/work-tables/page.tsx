'use client';

import { CatalogAdminPage } from '@/features/admin/components/catalog-admin-page';
import {
  createWorkTable,
  deleteWorkTable,
  listWorkTables,
  updateWorkTable,
} from '@/features/admin/services/admin.service';

export default function AdminWorkTablesPage() {
  return (
    <CatalogAdminPage
      title="Mesas de trabajo"
      description="Catálogo editable consumido desde la API."
      queryKey="admin-work-tables"
      list={listWorkTables}
      create={createWorkTable}
      update={updateWorkTable}
      remove={deleteWorkTable}
    />
  );
}
