import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { config as loadDotenv } from 'dotenv';
import { ensureCurrentCriteriaVersion } from '../src/services/criteria-version.service.js';

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

// Criterios oficiales del enunciado del reto (sección 5.3), con los pesos tal
// como se declaran allí: 20 / 20 / 20 / 15 / 12.5 / 12.5.
//
// El `promptContext` incorpora además las definiciones y preguntas orientadoras
// de la sección 9.1 (criterios de valor de ACH). Esa sección no reemplaza el
// modelo de scoring: lo detalla. Sus cinco criterios se reparten entre estos
// seis —potencial de ingresos, protección del negocio y diversificación caen en
// "Valor para el negocio"; experiencia del cliente en "Impacto al cliente";
// tamaño de mercado en "Escalabilidad"— porque puntuar diez dimensiones
// solapadas diluiría el score sin agregar criterio.
const criteria = [
  {
    nombre: 'Alineación estratégica',
    descripcion: 'Grado de acople con los OKRs organizacionales y con el propósito del Laboratorio Digital.',
    promptContext:
      'Evalúa qué tan alineada está la iniciativa con los OKRs organizacionales de ACH y con el propósito del Laboratorio Digital de innovación. ' +
      'Considera los dos ejes estratégicos declarados: proteger la posición de ACH en su negocio core de movimiento de dinero frente a competidores y nuevos entrantes como Bre-B, y diversificar sus fuentes de ingreso más allá de ese core. ' +
      'Pregunta orientadora: ¿esta iniciativa responde a alguno de esos dos ejes, o es ajena a la estrategia?',
    peso: 20,
    orden: 1,
  },
  {
    nombre: 'Nivel de innovación',
    descripcion: 'Novedad tecnológica y diferenciación competitiva frente al mercado y a lo ya existente en ACH.',
    promptContext:
      'Evalúa la novedad tecnológica de la iniciativa y su diferenciación competitiva: qué tanto se aparta de lo que ACH y el mercado ya hacen. ' +
      'Considera si la ventaja que genera sería difícil de replicar por un competidor. ' +
      'Pregunta orientadora: ¿esto existe ya en el mercado colombiano de pagos, y si alguien quisiera copiarlo, cuánto le costaría?',
    peso: 20,
    orden: 2,
  },
  {
    nombre: 'Valor para el negocio',
    descripcion:
      'Retorno esperado: ingresos nuevos o incrementales, protección del negocio core y diversificación de fuentes de ingreso.',
    promptContext:
      'Evalúa el retorno esperado de la iniciativa integrando los tres criterios de valor de ACH. ' +
      'Potencial de ingresos: ¿cuánto dinero nuevo puede generar para ACH, y con qué certeza? Pesa tanto el tamaño de la oportunidad como la probabilidad de que se materialice dentro del horizonte del laboratorio. ' +
      'Protección del negocio: ¿protege o amplía la posición de ACH en pagos y movimiento de dinero, aumentando market share, reduciendo fuga de clientes o cerrando brechas frente a competidores y nuevos entrantes como Bre-B? ' +
      'Diversificación: ¿abre una fuente de ingreso genuinamente nueva, distinta al negocio core? Las de mayor puntaje son aquellas sin las cuales el objetivo de diversificación se vería comprometido. ' +
      'Una iniciativa que solo ahorra costos internos, sin tocar ninguno de los tres, no puede puntuar alto aquí.',
    peso: 20,
    orden: 3,
  },
  {
    nombre: 'Impacto al cliente',
    descripcion: 'Mejora directa en la experiencia y satisfacción del usuario final.',
    promptContext:
      'Evalúa en qué medida la iniciativa resuelve un dolor real, frecuente y significativo del cliente, o crea una experiencia notablemente superior a la actual que constituya una ventaja competitiva difícil de replicar. ' +
      'Pregunta orientadora: ¿esto resuelve un dolor real del cliente mejor que cualquier alternativa actual, y es difícil de copiar? ' +
      'Un dolor declarado por varias empresas o clientes concretos pesa más que uno supuesto.',
    peso: 15,
    orden: 4,
  },
  {
    nombre: 'Escalabilidad',
    descripcion: 'Tamaño del mercado alcanzable y facilidad de replicar la iniciativa más allá del piloto.',
    promptContext:
      'Analiza el universo de clientes o usuarios que pueden beneficiarse de la iniciativa y la facilidad con la que puede escalar más allá del piloto inicial, sin necesidad de reinventarla. ' +
      'Pregunta orientadora: ¿a cuántos clientes puede llegar y qué tan fácil es replicarla o escalarla? ' +
      'Una solución a la medida de un solo cliente puntúa bajo aunque ese cliente sea grande.',
    peso: 12.5,
    orden: 5,
  },
  {
    nombre: 'Factibilidad técnica',
    descripcion: 'Disponibilidad de datos y APIs, y complejidad de integración con la arquitectura actual.',
    promptContext:
      'Evalúa la disponibilidad de datos y APIs necesarios y la complejidad de integrar la iniciativa con la arquitectura y capacidades actuales de ACH. ' +
      'Considera que el riel transaccional de ACH es infraestructura crítica: una iniciativa que exija tocar el core de liquidación es menos factible que una que se apoye en capacidades ya expuestas.',
    peso: 12.5,
    orden: 6,
  },
] as const;

async function main() {
  // Tolerancia por el mismo motivo que en criteria-weights.ts: los pesos son
  // decimales y la igualdad exacta en coma flotante es una trampa.
  const weightSum = criteria.reduce((sum, item) => sum + item.peso, 0);
  if (Math.abs(weightSum - 100) > 1e-6) {
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

  // El seed escribe los criterios directo con Prisma, sin pasar por
  // criteria.service, así que registra la versión a mano. Sin esto el historial
  // tendría un hueco justo en la configuración de arranque.
  const version = await ensureCurrentCriteriaVersion();

  console.log('Seed completed: admin, classifications, work tables, criteria');
  if (version) {
    console.log(`Criteria version: v${version.numero}`);
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
