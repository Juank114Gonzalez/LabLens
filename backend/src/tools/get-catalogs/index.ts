import { Type } from '@google/genai';
import { listClassifications } from '../../repositories/classification.repository.js';
import { listWorkTables } from '../../repositories/work-table.repository.js';
import type { ToolDefinition } from '../../types/tools.types.js';

export const getClassificationsTool: ToolDefinition = {
  name: 'getClassifications',
  declaration: {
    name: 'getClassifications',
    description:
      'Lista clasificaciones inteligentes activas (nombre, descripción, promptContext). Debes elegir UNA al evaluar.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  execute: async () => {
    const items = (await listClassifications()).filter((item) => item.activo);
    return {
      count: items.length,
      classifications: items.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        promptContext: item.promptContext,
      })),
    };
  },
};

export const getWorkTablesTool: ToolDefinition = {
  name: 'getWorkTables',
  declaration: {
    name: 'getWorkTables',
    description:
      'Lista mesas de trabajo activas (nombre, descripción, promptContext). Debes elegir UNA al evaluar.',
    parameters: { type: Type.OBJECT, properties: {} },
  },
  execute: async () => {
    const items = (await listWorkTables()).filter((item) => item.activo);
    return {
      count: items.length,
      workTables: items.map((item) => ({
        id: item.id,
        nombre: item.nombre,
        descripcion: item.descripcion,
        promptContext: item.promptContext,
      })),
    };
  },
};
