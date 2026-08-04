'use client';

import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { listClassifications } from '@/features/admin/services/admin.service';
import { INITIATIVE_STATUS_LABELS, SOURCE_LABELS } from '@/features/initiative/lib/status';
import type { InitiativeFilters } from '@/features/initiative/services/initiative.service';
import type { InitiativeStatus, SourceType } from '@/features/initiative/types';

type Props = {
  value: InitiativeFilters;
  onChange: (next: InitiativeFilters) => void;
  /** The Lab inbox pins the status, so it hides that control. */
  showStatus?: boolean;
};

const selectClassName =
  'flex h-9 w-full rounded-lg border border-input bg-transparent px-3 text-sm';

export function InitiativeFiltersBar({ value, onChange, showStatus = true }: Props) {
  const classifications = useQuery({
    queryKey: ['intelligent-classifications'],
    queryFn: listClassifications,
  });

  function patch(next: Partial<InitiativeFilters>) {
    onChange({ ...value, ...next });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div className="space-y-1.5 lg:col-span-2">
        <Label htmlFor="filter-search">Buscar</Label>
        <Input
          id="filter-search"
          placeholder="Nombre, área o necesidad"
          value={value.search ?? ''}
          onChange={(event) => patch({ search: event.target.value || undefined })}
        />
      </div>

      {showStatus ? (
        <div className="space-y-1.5">
          <Label htmlFor="filter-status">Estado</Label>
          <select
            id="filter-status"
            className={selectClassName}
            value={value.status?.[0] ?? ''}
            onChange={(event) =>
              patch({
                status: event.target.value
                  ? [event.target.value as InitiativeStatus]
                  : undefined,
              })
            }
          >
            <option value="">Todos</option>
            {(Object.keys(INITIATIVE_STATUS_LABELS) as InitiativeStatus[]).map((status) => (
              <option key={status} value={status}>
                {INITIATIVE_STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="space-y-1.5">
        <Label htmlFor="filter-source">Canal</Label>
        <select
          id="filter-source"
          className={selectClassName}
          value={value.sourceType?.[0] ?? ''}
          onChange={(event) =>
            patch({
              sourceType: event.target.value
                ? [event.target.value as SourceType]
                : undefined,
            })
          }
        >
          <option value="">Todos</option>
          {(Object.keys(SOURCE_LABELS) as SourceType[]).map((source) => (
            <option key={source} value={source}>
              {SOURCE_LABELS[source]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-classification">Clasificación</Label>
        <select
          id="filter-classification"
          className={selectClassName}
          value={value.triageClassificationId ?? ''}
          onChange={(event) =>
            patch({ triageClassificationId: event.target.value || undefined })
          }
        >
          <option value="">Todas</option>
          {(classifications.data ?? []).map((item) => (
            <option key={item.id} value={item.id}>
              {item.nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-from">Desde</Label>
        <Input
          id="filter-from"
          type="date"
          value={value.from?.slice(0, 10) ?? ''}
          onChange={(event) =>
            patch({
              from: event.target.value
                ? new Date(event.target.value).toISOString()
                : undefined,
            })
          }
        />
      </div>
    </div>
  );
}
