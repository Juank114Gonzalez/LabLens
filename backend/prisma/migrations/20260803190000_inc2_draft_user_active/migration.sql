-- AlterTable
ALTER TABLE "Initiative" ALTER COLUMN "status" SET DEFAULT 'DRAFT',
ALTER COLUMN "diligenciadoPor" SET DEFAULT '',
ALTER COLUMN "fechaDiligenciamiento" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "expectativaSolucion" SET DEFAULT '',
ALTER COLUMN "nombre" SET DEFAULT '',
ALTER COLUMN "areaProcesoImpactado" SET DEFAULT '',
ALTER COLUMN "areaInvolucrada" SET DEFAULT '',
ALTER COLUMN "urgencia" SET DEFAULT '',
ALTER COLUMN "impacto" SET DEFAULT '',
ALTER COLUMN "necesidad" SET DEFAULT '',
ALTER COLUMN "porQueAhora" SET DEFAULT '',
ALTER COLUMN "paraQue" SET DEFAULT '',
ALTER COLUMN "comoSeResuelveHoy" SET DEFAULT '';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true;
