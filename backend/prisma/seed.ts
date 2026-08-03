import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
  },
  {
    nombre: 'Procesos',
    descripcion:
      'Evalúa iniciativas enfocadas en automatización, RPA, optimización de procesos y eficiencias operativas.',
    promptContext:
      'Sugiere Procesos para iniciativas de automatización, RPA, optimización de procesos y eficiencias operativas.',
  },
  {
    nombre: 'Producto / Operaciones & TI',
    descripcion:
      'Evalúa mejoras sobre productos existentes, nuevas funcionalidades, mantenimiento, soporte y requerimientos operativos.',
    promptContext:
      'Sugiere Producto / Operaciones & TI para mejoras de producto, nuevas funcionalidades, mantenimiento, soporte y requerimientos operativos.',
  },
  {
    nombre: 'Seguridad / Data & Analytics',
    descripcion:
      'Evalúa iniciativas relacionadas con gobierno de datos, analítica, inteligencia artificial, calidad de datos y ciberseguridad.',
    promptContext:
      'Sugiere Seguridad / Data & Analytics para gobierno de datos, analítica, IA, calidad de datos y ciberseguridad.',
  },
] as const;

const criteria = [
  {
    nombre: 'Impacto en el negocio',
    descripcion: 'Impacto potencial sobre clientes, ingresos, eficiencia, cumplimiento o ventaja competitiva.',
    promptContext:
      'Evalúa el impacto potencial de la iniciativa sobre el negocio considerando clientes, ingresos, eficiencia, cumplimiento o ventaja competitiva.',
    peso: 25,
    orden: 1,
  },
  {
    nombre: 'Viabilidad técnica',
    descripcion: 'Viabilidad de implementación con tecnología, capacidades y arquitectura disponibles.',
    promptContext:
      'Evalúa qué tan viable es implementar la iniciativa con la tecnología, capacidades y arquitectura disponibles.',
    peso: 20,
    orden: 2,
  },
  {
    nombre: 'Disponibilidad y calidad de datos',
    descripcion: 'Existencia de datos suficientes, confiables y accesibles, especialmente para IA o analítica.',
    promptContext:
      'Evalúa si existen datos suficientes, confiables y accesibles para implementar la iniciativa, especialmente si involucra IA o analítica.',
    peso: 15,
    orden: 3,
  },
  {
    nombre: 'Alineación estratégica',
    descripcion: 'Alineación con objetivos estratégicos y el propósito del Innovation Lab.',
    promptContext:
      'Evalúa qué tan alineada está la iniciativa con los objetivos estratégicos y el propósito del Innovation Lab.',
    peso: 20,
    orden: 4,
  },
  {
    nombre: 'Complejidad de implementación',
    descripcion: 'Complejidad técnica, organizacional y operativa de implementación.',
    promptContext:
      'Evalúa el nivel de complejidad técnica, organizacional y operativa requerido para implementar la iniciativa.',
    peso: 10,
    orden: 5,
  },
  {
    nombre: 'Potencial de adopción y escalabilidad',
    descripcion: 'Probabilidad de adopción y potencial de escalar a otras áreas o procesos.',
    promptContext:
      'Evalúa la probabilidad de adopción por parte de los usuarios y el potencial de escalar la solución a otras áreas o procesos.',
    peso: 10,
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
    where: { email: 'admin@lablens.local' },
    update: {
      name: 'Administrador',
      passwordHash,
      role: Role.ADMIN,
    },
    create: {
      name: 'Administrador',
      email: 'admin@lablens.local',
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
        activo: true,
      },
      create: { ...item, activo: true },
    });
  }

  const existingCriteria = await prisma.evaluationCriteria.count();
  if (existingCriteria === 0) {
    await prisma.evaluationCriteria.createMany({
      data: criteria.map((item) => ({ ...item, activo: true })),
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
