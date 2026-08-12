-- Linaje de copias.
--
-- Una iniciativa que ya pasó por triage queda como registro inmutable de lo que
-- se envió. Para iterar sobre ella se saca una copia editable, que sí puede
-- volver a triarse. La copia guarda de dónde salió.
ALTER TABLE "Initiative" ADD COLUMN IF NOT EXISTS "copiedFromId" UUID;

CREATE INDEX IF NOT EXISTS "Initiative_copiedFromId_idx" ON "Initiative"("copiedFromId");

-- SetNull y no Cascade: borrar el original no debe arrastrar sus copias.
ALTER TABLE "Initiative"
  ADD CONSTRAINT "Initiative_copiedFromId_fkey"
  FOREIGN KEY ("copiedFromId") REFERENCES "Initiative"("id") ON DELETE SET NULL ON UPDATE CASCADE;
