# Decisiones — Experiencia Generador

- Las iniciativas nacen en `DRAFT` y se autoguardan con `PATCH` (debounce ~1.5s).
- `POST /register` valida campos completos, ≥1 contacto y ≥1 evidencia; pasa a `REGISTERED` y bloquea edición.
- Los contactos se reemplazan en cada autosave (array completo).
- Las evidencias se suben a Cloudinary vía `multipart`; la descarga masiva genera un ZIP en backend.
- El historial de evaluaciones es solo lectura; iniciar evaluación queda en 501 para el siguiente incremento.
