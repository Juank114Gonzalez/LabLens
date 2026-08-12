-- Historial de versiones de la configuración de criterios.
--
-- `Evaluation.configVersion` congela la configuración de cada evaluación, pero
-- incluye el instante en que se abrió, así que dos evaluaciones con criterios
-- idénticos salían con versiones distintas y no se podían agrupar. La identidad
-- aquí es el hash del contenido.
CREATE TABLE IF NOT EXISTS "CriteriaVersion" (
  "id"        UUID NOT NULL,
  "numero"    INTEGER NOT NULL,
  "hash"      TEXT NOT NULL,
  "snapshot"  JSONB NOT NULL,
  "totalPeso" DOUBLE PRECISION NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CriteriaVersion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CriteriaVersion_numero_key" ON "CriteriaVersion"("numero");
CREATE UNIQUE INDEX IF NOT EXISTS "CriteriaVersion_hash_key" ON "CriteriaVersion"("hash");
CREATE INDEX IF NOT EXISTS "CriteriaVersion_createdAt_idx" ON "CriteriaVersion"("createdAt");

ALTER TABLE "Evaluation" ADD COLUMN IF NOT EXISTS "criteriaVersionId" UUID;

CREATE INDEX IF NOT EXISTS "Evaluation_criteriaVersionId_idx" ON "Evaluation"("criteriaVersionId");

-- SetNull: borrar una versión no debe borrar evaluaciones; cada una conserva su
-- propio criteriaSnapshot y sigue siendo auditable por sí sola.
ALTER TABLE "Evaluation"
  ADD CONSTRAINT "Evaluation_criteriaVersionId_fkey"
  FOREIGN KEY ("criteriaVersionId") REFERENCES "CriteriaVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
