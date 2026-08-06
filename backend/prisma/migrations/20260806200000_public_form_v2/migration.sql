-- Formulario público v2 (12 preguntas).
--
-- Todas las columnas son aditivas y con default, así que las iniciativas ya
-- registradas y el formulario interno —que no diligencia estos campos— siguen
-- funcionando sin tocar nada.
--
-- Las respuestas de opción cerrada se guardan estructuradas a propósito: el
-- valor del formulario nuevo está en poder filtrar por producto o contar
-- beneficios, y eso se pierde si se concatenan en texto libre.

-- AlterTable
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "areaSolicitante" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "solucionPropuesta" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "impactaA" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "productoRelacionado" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "beneficios" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "tieneInteresado" BOOLEAN;
