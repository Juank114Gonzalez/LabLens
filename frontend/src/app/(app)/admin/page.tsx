'use client';

export default function AdminPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-3 p-6 sm:p-8">
      <h1 className="font-heading text-3xl font-semibold">Administración</h1>
      <p className="text-sm text-muted-foreground">
        Panel de administración preparado para el siguiente incremento. Desde aquí se
        gestionarán usuarios, criterios, clasificaciones y mesas de trabajo.
      </p>
    </div>
  );
}
