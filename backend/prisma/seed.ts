import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';

// `prisma db seed` loads .env before running this file, but `tsx prisma/seed.ts`
// does not. Loading it here keeps both entry points working; on Render the vars
// already live in the environment and dotenv finds nothing to override.
loadDotenv();

const prisma = new PrismaClient();

const classifications = [
  {
    nombre: 'Innovación disruptiva',
    descripcion:
      'Nuevos modelos de negocio, tecnologías emergentes o experiencias sin antecedente en la empresa. Alto riesgo, alta incertidumbre y alto potencial de transformación.',
    promptContext:
      'Clasifica como Innovación disruptiva cuando la iniciativa introduce modelos, tecnologías o experiencias sin antecedente claro en la organización, con alto potencial transformador e incertidumbre elevada.',
  },
  {
    nombre: 'Innovación adyacente',
    descripcion:
      'Expansión de capacidades existentes hacia nuevos mercados, canales, segmentos de clientes o líneas de negocio relacionadas.',
    promptContext:
      'Clasifica como Innovación adyacente cuando se expanden capacidades existentes hacia mercados, canales, segmentos o líneas relacionadas.',
  },
  {
    nombre: 'Mejora incremental',
    descripcion:
      'Evolución funcional de productos existentes mediante nuevas funcionalidades, mejoras de experiencia de usuario o pequeños incrementos de valor.',
    promptContext:
      'Clasifica como Mejora incremental cuando evoluciona un producto existente con funcionalidades o mejoras de experiencia de valor moderado.',
  },
  {
    nombre: 'Mejora de procesos',
    descripcion:
      'Automatización de procesos internos, optimización operativa, reducción de tiempos, eliminación de desperdicios y aumento de eficiencia.',
    promptContext:
      'Clasifica como Mejora de procesos cuando el foco es automatización, optimización operativa, reducción de tiempos o eliminación de desperdicios.',
  },
  {
    nombre: 'Solicitud operativa',
    descripcion:
      'Corrección de errores, mantenimiento, soporte, requerimientos regulatorios o cambios operativos que no representan innovación.',
    promptContext:
      'Clasifica como Solicitud operativa cuando se trata de mantenimiento, soporte, corrección, cumplimiento regulatorio o cambios operativos sin componente de innovación.',
  },
] as const;

const workTables = [
  {
    nombre: 'Laboratorio Digital',
    descripcion:
      'Evalúa iniciativas disruptivas o adyacentes con alta incertidumbre que requieren experimentación rápida, validación de hipótesis y construcción de MVPs.',
    promptContext:
      'Sugiere Laboratorio Digital para iniciativas disruptivas o adyacentes con alta incertidumbre que requieren experimentación, validación de hipótesis y MVPs.',
    notificationEmail: 'lab@ach.local',
  },
  {
    nombre: 'Procesos',
    descripcion:
      'Evalúa iniciativas enfocadas en automatización, RPA, optimización de procesos y eficiencias operativas.',
    promptContext:
      'Sugiere Procesos para iniciativas de automatización, RPA, optimización de procesos y eficiencias operativas.',
    notificationEmail: 'procesos@ach.local',
  },
  {
    nombre: 'Producto / Operaciones & TI',
    descripcion:
      'Evalúa mejoras sobre productos existentes, nuevas funcionalidades, mantenimiento, soporte y requerimientos operativos.',
    promptContext:
      'Sugiere Producto / Operaciones & TI para mejoras de producto, nuevas funcionalidades, mantenimiento, soporte y requerimientos operativos.',
    notificationEmail: 'producto@ach.local',
  },
  {
    nombre: 'Seguridad / Data & Analytics',
    descripcion:
      'Evalúa iniciativas relacionadas con gobierno de datos, analítica, inteligencia artificial, calidad de datos y ciberseguridad.',
    promptContext:
      'Sugiere Seguridad / Data & Analytics para gobierno de datos, analítica, IA, calidad de datos y ciberseguridad.',
    notificationEmail: 'seguridad@ach.local',
  },
] as const;

// Criterios oficiales del enunciado del reto (sección 5.3).
// Los pesos declarados son 20 / 20 / 20 / 15 / 12.5 / 12.5; como el modelo guarda enteros,
// el 12.5 se reparte en 13 (Escalabilidad) y 12 (Factibilidad técnica) para sumar 100.
const criteria = [
  {
    nombre: 'Alineación estratégica',
    descripcion: 'Grado de acople con los OKRs organizacionales y con el propósito del Laboratorio Digital.',
    promptContext:
      'Evalúa qué tan alineada está la iniciativa con los OKRs organizacionales de ACH y con el propósito del Laboratorio Digital de innovación.',
    peso: 20,
    orden: 1,
  },
  {
    nombre: 'Nivel de innovación',
    descripcion: 'Novedad tecnológica y diferenciación competitiva frente al mercado y a lo ya existente en ACH.',
    promptContext:
      'Evalúa la novedad tecnológica de la iniciativa y su diferenciación competitiva: qué tanto se aparta de lo que ACH y el mercado ya hacen.',
    peso: 20,
    orden: 2,
  },
  {
    nombre: 'Valor para el negocio',
    descripcion: 'Retorno esperado: aumento de ingresos, ahorro de costos o protección del negocio core.',
    promptContext:
      'Evalúa el retorno esperado de la iniciativa en términos de ingresos nuevos, ahorro de costos o protección de la posición de ACH en su negocio core de movimiento de dinero.',
    peso: 20,
    orden: 3,
  },
  {
    nombre: 'Impacto al cliente',
    descripcion: 'Mejora directa en la experiencia y satisfacción del usuario final.',
    promptContext:
      'Evalúa si la iniciativa resuelve un dolor real, frecuente y significativo del cliente, y si crea una experiencia notablemente superior a las alternativas actuales.',
    peso: 15,
    orden: 4,
  },
  {
    nombre: 'Escalabilidad',
    descripcion: 'Potencial de crecimiento y replicabilidad en otras áreas, clientes o mercados.',
    promptContext:
      'Evalúa a cuántos clientes o áreas puede llegar la iniciativa y qué tan fácil es replicarla o escalarla más allá del piloto inicial sin reinventarla.',
    peso: 13,
    orden: 5,
  },
  {
    nombre: 'Factibilidad técnica',
    descripcion: 'Disponibilidad de datos y APIs, y complejidad de integración con la arquitectura actual.',
    promptContext:
      'Evalúa la disponibilidad de datos y APIs necesarios y la complejidad de integrar la iniciativa con la arquitectura y capacidades actuales de ACH.',
    peso: 12,
    orden: 6,
  },
] as const;

async function main() {
  const weightSum = criteria.reduce((sum, item) => sum + item.peso, 0);
  if (weightSum !== 100) {
    throw new Error(`Seed criteria weights must sum to 100, got ${weightSum}`);
  }

  const passwordHash = await bcrypt.hash('Admin123*', 10);

  await prisma.user.upsert({
    where: { email: 'admin@achcolombia.com.co' },
    update: {
      name: 'Administrador',
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: 'Administrador',
      email: 'admin@achcolombia.com.co',
      passwordHash,
      role: Role.ADMIN,
    },
  });

  for (const item of classifications) {
    await prisma.intelligentClassification.upsert({
      where: { nombre: item.nombre },
      update: {
        descripcion: item.descripcion,
        promptContext: item.promptContext,
        activo: true,
      },
      create: { ...item, activo: true },
    });
  }

  for (const item of workTables) {
    await prisma.workTable.upsert({
      where: { nombre: item.nombre },
      update: {
        descripcion: item.descripcion,
        promptContext: item.promptContext,
        notificationEmail: item.notificationEmail,
        activo: true,
      },
      create: { ...item, activo: true },
    });
  }

  // Reconcilia los criterios con los del enunciado: elimina los que ya no aplican
  // y actualiza pesos/orden de los que sobreviven. Las evaluaciones existentes no se
  // ven afectadas porque guardan criteriaSnapshot y weightsSnapshot.
  await prisma.evaluationCriteria.deleteMany({
    where: { nombre: { notIn: criteria.map((item) => item.nombre) } },
  });

  for (const item of criteria) {
    const existing = await prisma.evaluationCriteria.findFirst({
      where: { nombre: item.nombre },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      await prisma.evaluationCriteria.update({
        where: { id: existing.id },
        data: {
          descripcion: item.descripcion,
          promptContext: item.promptContext,
          peso: item.peso,
          orden: item.orden,
          activo: true,
        },
      });
      continue;
    }

    await prisma.evaluationCriteria.create({
      data: { ...item, activo: true },
    });
  }

  console.log('Seed completed: admin, classifications, work tables, criteria');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
