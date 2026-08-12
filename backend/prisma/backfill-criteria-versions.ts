/**
 * Reconstruye el historial de versiones a partir de las evaluaciones existentes.
 *
 * Cada evaluación ya guardaba su `criteriaSnapshot`, así que la información
 * estaba; lo que faltaba era agrupar las que compartían configuración. Se
 * recorren en orden cronológico para que los números de versión salgan en el
 * orden en que realmente se usaron.
 *
 * Es idempotente: reejecutarlo no duplica versiones ni reasigna las ya
 * enlazadas. Se corre una sola vez con `npx tsx prisma/backfill-criteria-versions.ts`.
 */
import { PrismaClient } from '@prisma/client';
import { config as loadDotenv } from 'dotenv';
import { ensureCriteriaVersion, type CriterioVersionado } from '../src/services/criteria-version.service.js';

loadDotenv();

const prisma = new PrismaClient();

function leerSnapshot(valor: unknown): CriterioVersionado[] | null {
  if (!Array.isArray(valor) || valor.length === 0) return null;

  const criterios: CriterioVersionado[] = [];
  for (const fila of valor) {
    if (!fila || typeof fila !== 'object') return null;
    const c = fila as Record<string, unknown>;
    if (typeof c.id !== 'string' || typeof c.peso !== 'number') return null;

    criterios.push({
      id: c.id,
      nombre: typeof c.nombre === 'string' ? c.nombre : '',
      descripcion: typeof c.descripcion === 'string' ? c.descripcion : '',
      promptContext: typeof c.promptContext === 'string' ? c.promptContext : '',
      peso: c.peso,
      orden: typeof c.orden === 'number' ? c.orden : 0,
    });
  }
  return criterios;
}

async function main() {
  const evaluaciones = await prisma.evaluation.findMany({
    where: { criteriaVersionId: null },
    orderBy: { createdAt: 'asc' },
    select: { id: true, criteriaSnapshot: true, createdAt: true },
  });

  console.log(`Evaluaciones sin versión: ${evaluaciones.length}`);

  let enlazadas = 0;
  let sinSnapshot = 0;

  for (const ev of evaluaciones) {
    const criterios = leerSnapshot(ev.criteriaSnapshot);
    if (!criterios) {
      sinSnapshot += 1;
      continue;
    }

    const version = await ensureCriteriaVersion(criterios);
    await prisma.evaluation.update({
      where: { id: ev.id },
      data: { criteriaVersionId: version.id },
    });
    enlazadas += 1;
  }

  const versiones = await prisma.criteriaVersion.findMany({
    orderBy: { numero: 'asc' },
    include: { _count: { select: { evaluations: true } } },
  });

  console.log(`Enlazadas: ${enlazadas} · sin snapshot utilizable: ${sinSnapshot}`);
  console.log('\nHistorial resultante:');
  for (const v of versiones) {
    const criterios = Array.isArray(v.snapshot) ? v.snapshot.length : 0;
    console.log(
      `  v${v.numero} · ${criterios} criterios · peso ${v.totalPeso} · ${v._count.evaluations} evaluaciones`,
    );
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
