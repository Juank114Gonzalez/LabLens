import { findInitiativeById } from '../../repositories/domain-initiative.repository.js';
import type { ToolDefinition } from '../../types/tools.types.js';
import { AppError } from '../../utils/AppError.js';

export const getInitiativeTool: ToolDefinition = {
  name: 'getInitiative',
  declaration: {
    name: 'getInitiative',
    description:
      'Obtiene la información completa de la iniciativa en evaluación: formulario, contactos y evidencias.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  execute: async (_args, context) => {
    const initiative = await findInitiativeById(context.initiativeId);
    if (!initiative) {
      throw new AppError('Initiative not found', 404);
    }
    return {
      id: initiative.id,
      status: initiative.status,
      nombre: initiative.nombre,
      diligenciadoPor: initiative.diligenciadoPor,
      fechaDiligenciamiento: initiative.fechaDiligenciamiento,
      expectativaSolucion: initiative.expectativaSolucion,
      areaProcesoImpactado: initiative.areaProcesoImpactado,
      areaInvolucrada: initiative.areaInvolucrada,
      urgencia: initiative.urgencia,
      impacto: initiative.impacto,
      necesidad: initiative.necesidad,
      porQueAhora: initiative.porQueAhora,
      paraQue: initiative.paraQue,
      comoSeResuelveHoy: initiative.comoSeResuelveHoy,
      generador: initiative.user,
      companyContacts: initiative.companyContacts,
      attachments: initiative.attachments.map((item) => ({
        id: item.id,
        originalName: item.originalName,
        mimeType: item.mimeType,
        size: item.size,
        secureUrl: item.secureUrl,
      })),
    };
  },
};
