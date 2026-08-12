-- El enunciado del reto (sección 5.3) declara pesos de 12.5% para Escalabilidad y
-- Factibilidad técnica. La columna era INTEGER, así que ese 12.5 se venía
-- repartiendo como 13 + 12 para que la suma diera 100.
--
-- Ampliar INTEGER a DOUBLE PRECISION no pierde datos y no necesita USING.
ALTER TABLE "EvaluationCriteria" ALTER COLUMN "peso" SET DATA TYPE DOUBLE PRECISION;
