# Manual de usuario y API

## Parte 1 · Enviar una iniciativa (sin cuenta)

1. Entra a `/submit`. No necesitas usuario ni contraseña.
2. Elige el canal de origen. Determina qué te pregunta el formulario:
   - **Área interna de ACH** — Operaciones, Negocio, Riesgos, TI o Canales Digitales.
   - **Organización externa** — proveedores, aliados o contractors con acceso.
   - **Referencia internacional** — un benchmark visto en un congreso o publicación. Pide además la organización, el evento, el enlace y por qué es relevante para ACH.
3. Diligencia los atributos obligatorios: quién envía, expectativa de la solución, nombre, área o proceso impactado, áreas a involucrar, urgencia, impacto, y la compuerta mínima (qué necesita, por qué ahora, para qué, cómo se resuelve hoy). Registra al menos una empresa o persona que reporte el dolor.
4. Envía. En segundos verás la categoría asignada, la justificación, la mesa de trabajo responsable y —si no corresponde al Lab— la confirmación de que el área ya fue notificada por correo.

Puedes compartir un enlace directo con el canal preseleccionado: `/submit?source=international` (también `internal` y `external`). Sirve para el QR de un congreso.

**Si el análisis automático falla**, la iniciativa igual queda guardada y un evaluador la clasifica a mano. Nunca se pierde un envío.

## Parte 2 · Trabajar los casos (evaluadores y admins)

No hay registro público. Un administrador crea las cuentas desde **Admin → Usuarios**.

- **Dashboard** — volumen recibido, distribución por clasificación y por canal, tendencia de 30 días separando lo que se quedó en el Lab de lo que se enrutó afuera, y las últimas iniciativas pendientes.
- **Bandeja del Lab** — solo lo clasificado como disruptivo o adyacente, con la confianza del triage. Dos acciones por caso:
  - **Entrevistar** abre la conversación para enriquecer el contexto antes de puntuar. No emite scores.
  - **Evaluar ahora** dispara el pipeline completo sobre los datos ya registrados.
- **Todas las iniciativas** — el listado global con filtros por estado, canal, clasificación, fecha y texto libre. Es la vista de auditoría: sirve para revisar si el triage enrutó bien lo que sacó del Lab.
- **Admin** — usuarios, criterios de evaluación (los pesos activos deben sumar 100), clasificaciones y mesas de trabajo. El correo de notificación de cada mesa se configura aquí.

## Parte 3 · API

Base local: `http://localhost:3001`. Todas las respuestas usan el mismo envelope:

```json
{ "success": true, "data": { } }
{ "success": false, "message": "…" }
```

### Público (sin autenticación)

#### `POST /api/public/initiatives`

Crea la iniciativa y ejecuta el triage en la misma petición. Límite de 10 envíos por hora y por origen (configurable con `PUBLIC_SUBMISSION_RATE_LIMIT`).

```bash
curl -X POST http://localhost:3001/api/public/initiatives \
  -H 'Content-Type: application/json' \
  -d '{
    "sourceType": "INTERNAL",
    "submitterName": "Ana Ríos",
    "submitterEmail": "ana.rios@ach.com.co",
    "diligenciadoPor": "Ana Ríos",
    "expectativaSolucion": "Validar pagos en tiempo real con verificación de identidad.",
    "nombre": "Verificación de identidad en transferencias inmediatas",
    "areaProcesoImpactado": "Canales Digitales",
    "areaInvolucrada": "Riesgos, TI",
    "urgencia": "Alta",
    "impacto": "Alto",
    "necesidad": "Los bancos reportan fraude en transferencias inmediatas de primer uso.",
    "porQueAhora": "La entrada de Bre-B multiplica el volumen de transferencias entre desconocidos.",
    "paraQue": "Reducir el fraude de primer contacto sin agregar fricción al pago.",
    "comoSeResuelveHoy": "Reglas estáticas por monto, revisadas manualmente.",
    "companyContacts": [
      {
        "empresa": "Banco XYZ",
        "contacto": "Carlos Pérez",
        "cargo": "Gerente de Fraude",
        "correo": "carlos.perez@bancoxyz.com",
        "telefono": "+57 300 000 0000"
      }
    ]
  }'
```

Respuesta `201`:

```json
{
  "success": true,
  "data": {
    "initiative": { "id": "…", "nombre": "…", "status": "TRIAGED_LAB", "sourceType": "INTERNAL" },
    "triage": {
      "isLabScope": true,
      "confidence": 0.88,
      "classification": { "id": "…", "nombre": "Innovación adyacente", "descripcion": "…" },
      "classificationReasoning": "…",
      "workTable": { "id": "…", "nombre": "Laboratorio Digital", "descripcion": "…" },
      "workTableReasoning": "…",
      "notificationSent": false
    }
  }
}
```

`triage` llega en `null` si el análisis automático falló; la iniciativa queda `REGISTERED` para revisión manual.

Para una referencia internacional agrega `referenceOrganization`, `referenceEvent`, `referenceLink` (URL válida) y `referenceRationale`; los cuatro son obligatorios en ese canal.

Errores: `400` esquema inválido con el detalle en `message`, `429` límite de envíos excedido.

### Autenticado

`POST /api/auth/login` devuelve `{ user, tokens: { accessToken, expiresAt } }` y deja la cookie HttpOnly de refresh. Usa `Authorization: Bearer <accessToken>` en el resto.

| Método | Ruta | Rol | Para qué |
| --- | --- | --- | --- |
| `GET` | `/api/initiatives` | EVALUATOR, ADMIN | Listado con filtros |
| `GET` | `/api/initiatives/stats` | EVALUATOR, ADMIN | Agregados del dashboard |
| `GET` | `/api/initiatives/:id` | EVALUATOR, ADMIN | Detalle con contactos, adjuntos y evaluaciones |
| `POST` | `/api/initiatives/:id/evaluations` | EVALUATOR, ADMIN | Inicia entrevista o evaluación directa |
| `POST` | `/api/conversations/:id/generate` | EVALUATOR, ADMIN | Genera la evaluación desde la entrevista |
| `GET` | `/api/evaluations/:id` | EVALUATOR, ADMIN | Resultado con Fit, prioridad y business case |
| `POST` | `/api/users` | ADMIN | Crea una cuenta de evaluador |
| `GET/POST/PATCH` | `/api/evaluation-criteria` | ADMIN | Catálogo de criterios (activos suman 100) |

Filtros de `GET /api/initiatives`, todos opcionales y combinables:

```
?status=TRIAGED_LAB,REGISTERED
&sourceType=INTERNATIONAL_REFERENCE
&triageClassificationId=<uuid>
&from=2026-07-01&to=2026-08-04
&search=fraude
```

```bash
curl -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/initiatives?status=TRIAGED_LAB&sourceType=INTERNAL"
```

## Parte 4 · Variables de entorno

Backend (`backend/.env`, ver `.env.example`):

| Variable | Obligatoria | Nota |
| --- | --- | --- |
| `DATABASE_URL` | Sí | PostgreSQL (Neon) |
| `ANTHROPIC_API_KEY` | Sí | Claude (triage y pipeline) |
| `ANTHROPIC_MODEL` | No | Por defecto `claude-haiku-4-5` (el más económico). Alternativas: `claude-sonnet-5`, `claude-opus-5` |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Sí | Mínimo 16 caracteres |
| `CLOUDINARY_*` | Sí | Adjuntos |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | No | Sin SMTP el triage enruta igual, solo se omite el correo |
| `PUBLIC_SUBMISSION_RATE_LIMIT` | No | Envíos por hora y origen; por defecto 10 |

Puesta en marcha:

```bash
cd backend && pnpm install && pnpm prisma:migrate && pnpm prisma:seed && pnpm dev
cd frontend && pnpm install && pnpm dev
```

El seed crea `admin@lablens.local` / `Admin123*`, los cinco tipos de clasificación, las cuatro mesas de trabajo con su correo de notificación y los seis criterios del enunciado.
