-- Las preguntas 7 (a quién impacta) y 8 (producto relacionado) pasan de opción
-- única a selección múltiple.
--
-- El USING conserva cualquier valor ya capturado convirtiéndolo en un arreglo de
-- un elemento, en vez de descartarlo: la conversión es reversible en contenido y
-- no pierde datos aunque ya se hubieran registrado iniciativas.

-- AlterTable: impactaA -> TEXT[]
ALTER TABLE "Initiative" ALTER COLUMN "impactaA" DROP DEFAULT;
ALTER TABLE "Initiative"
  ALTER COLUMN "impactaA" TYPE TEXT[]
  USING (CASE WHEN "impactaA" = '' THEN ARRAY[]::TEXT[] ELSE ARRAY["impactaA"] END);
ALTER TABLE "Initiative" ALTER COLUMN "impactaA" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Initiative" ALTER COLUMN "impactaA" SET NOT NULL;

-- AlterTable: productoRelacionado -> TEXT[]
ALTER TABLE "Initiative" ALTER COLUMN "productoRelacionado" DROP DEFAULT;
ALTER TABLE "Initiative"
  ALTER COLUMN "productoRelacionado" TYPE TEXT[]
  USING (CASE WHEN "productoRelacionado" = '' THEN ARRAY[]::TEXT[] ELSE ARRAY["productoRelacionado"] END);
ALTER TABLE "Initiative" ALTER COLUMN "productoRelacionado" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Initiative" ALTER COLUMN "productoRelacionado" SET NOT NULL;

-- `beneficios` se creó sin NOT NULL en la migración anterior, a diferencia de lo
-- que genera Prisma para una lista escalar. Se alinea aquí: nunca hubo NULL
-- porque el default es un arreglo vacío y todas las escrituras pasan por Prisma.
UPDATE "Initiative" SET "beneficios" = ARRAY[]::TEXT[] WHERE "beneficios" IS NULL;
ALTER TABLE "Initiative" ALTER COLUMN "beneficios" SET NOT NULL;
