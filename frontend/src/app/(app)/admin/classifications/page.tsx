'use client';

import { CatalogAdminPage } from '@/features/admin/components/catalog-admin-page';
import {
  createClassification,
  deleteClassification,
  listClassifications,
  updateClassification,
} from '@/features/admin/services/admin.service';

export default function AdminClassificationsPage() {
  return (
    <CatalogAdminPage
      title="Clasificaciones inteligentes"
      description="Catálogo editable consumido desde la API."
      queryKey="admin-classifications"
      list={listClassifications}
      create={createClassification}
      update={updateClassification}
      remove={deleteClassification}
    />
  );
}
