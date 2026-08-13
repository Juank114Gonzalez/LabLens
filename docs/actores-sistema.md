# Mapa de actores del sistema — LabLens

**Fecha:** 2026-08-13
**Alcance:** quién y qué interactúa con el sistema LabLens, clasificado en actores primarios (personas que inician casos de uso), secundarios (sistemas externos consumidos) y "silenciosos" (procesos automáticos). Basado en el código real del repositorio (`backend/`, `frontend/`).

---

## 1. Actores primarios

Personas que inician acciones directamente sobre el sistema.

| Actor | Autenticación | Qué hace |
|---|---|---|
| **Remitente de idea** | Ninguna (público) | Envía una iniciativa vía `/submit` → `POST /api/public/initiatives`. Tres variantes según `sourceType`: colaborador interno, contratista/proveedor externo, referente internacional. No tiene cuenta ni acceso al back-office; nunca vuelve a interactuar con el sistema tras el envío. |
| **Evaluador** (rol `EVALUATOR`) | Login (email/password o Microsoft SSO) | Revisa y edita iniciativas propias, ejecuta triage puntual, inicia y conduce evaluaciones (chat con el agente IA), consulta catálogos (solo lectura). No puede gestionar usuarios ni catálogos. |
| **Administrador** (rol `ADMIN`) | Login (email/password o Microsoft SSO) | Superset del evaluador: además gestiona usuarios (crear, cambiar rol, activar/desactivar, eliminar), criterios de evaluación (con pesos y versionado), clasificaciones inteligentes y mesas de trabajo, y ejecuta `triage-sweep` (reclasificación en lote). Es el único rol que puede eliminar evaluaciones. |

**Nota:** el sistema solo reconoce dos roles de cuenta (`EVALUATOR`, `ADMIN` — enum `Role` en el esquema Prisma). No existe autorregistro de cuentas: todo usuario lo crea un administrador.

**Nota:** `CompanyContact` (contacto de una empresa externa interesada, asociado a una iniciativa) es un **dato**, no un actor — es información capturada sobre un tercero, que nunca inicia sesión ni interactúa con el sistema.

---

## 2. Actores secundarios

Sistemas externos que LabLens consume para funcionar.

| Sistema | Rol que cumple | Dónde se invoca | Variable(s) de entorno |
|---|---|---|---|
| **Anthropic Claude** (API LLM) | Motor de triage automático de iniciativas, pipeline de evaluación por criterios (scoring, clasificación, prioridad, business case), y agente conversacional con tool-use en el "Modo Entrevista" | `backend/src/services/llm.service.ts`, `agent.service.ts`, `triage.service.ts`, `evaluation-pipeline.service.ts` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| **Cloudinary** | Almacenamiento de adjuntos/evidencias de las iniciativas (PDF, DOCX, XLSX, PNG, JPG) | `backend/src/services/cloudinary.service.ts` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` |
| **Servidor SMTP** (vía Nodemailer) | Envío del correo de notificación a la mesa de trabajo cuando una iniciativa se enruta fuera del Lab | `backend/src/services/notification.service.ts` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — si no están configuradas, el envío se omite silenciosamente (no es un error) |
| **Microsoft Graph API / Azure AD (MSAL)** | Validación de identidad para el login corporativo SSO: el frontend obtiene un token vía MSAL y el backend lo valida contra `https://graph.microsoft.com/v1.0/me` | `frontend/src/config/msal.ts`, `backend/src/services/auth.service.ts` | `NEXT_PUBLIC_MSAL_CLIENT_ID`, `NEXT_PUBLIC_MSAL_TENANT_ID` |
| **Neon (PostgreSQL)** | Motor de base de datos subyacente — persistencia de todo el dominio | `backend/prisma/schema.prisma` | `DATABASE_URL` |

Se incluye Neon por completitud, aunque como motor de base de datos es más una dependencia de infraestructura que un "actor" en el sentido estricto de caso de uso.

**Sin integraciones de:** pagos, analytics/monitoring externo (APM), ni otros proveedores de LLM.

---

## 3. Actores "silenciosos" / procesos automáticos

**Hallazgo explícito verificado:** se buscó en todo `backend/` cualquier librería de scheduling (`node-cron`, `node-schedule`, `bull`/`bullmq`, `agenda`, `setInterval`, `CronJob`) y **no se encontró ninguna**. LabLens no tiene procesos programados por temporizador — toda la automatización actual es reactiva a una petición HTTP concreta, nunca disparada por reloj.

| Proceso | Qué lo dispara | Naturaleza |
|---|---|---|
| **Triage automático** | Cada envío público (`POST /api/public/initiatives`) y cada registro interno (`POST /api/initiatives/:id/register`) dispara `runTriage` internamente | Automático (sin intervención humana adicional), pero disparado por evento HTTP — no es background/cron |
| **Notificación por correo a la mesa de trabajo** | Efecto colateral automático del triage, solo cuando la iniciativa se enruta fuera del Lab (`TRIAGED_EXTERNAL`) | El más cercano a "silencioso": nadie lo invoca explícitamente en ese instante, ocurre encadenado a una acción previa. Diseñado para nunca fallar de forma bloqueante (best-effort) |
| **`triage-sweep`** (reclasificación en lote) | Un ADMIN lo dispara manualmente desde `/initiatives` | Automático en su ejecución (procesa muchas iniciativas sin supervisión puntual), pero **no es un cron** — requiere accionamiento humano explícito cada vez |
| **Seed de base de datos** (`backend/prisma/seed.ts`) y **migraciones** (`prisma migrate deploy`, parte de `render:build`) | Proceso de despliegue (Render), no de runtime en producción | Automatización de infraestructura/CI de despliegue, no un actor del sistema en operación normal |

**Conclusión:** LabLens no tiene "actores silenciosos" en el sentido clásico de jobs programados independientes. El proceso más parecido a un actor autónomo es el propio motor de triage IA, que actúa como un "evaluador automático de primera línea" cada vez que entra o se registra una iniciativa, pero siempre en respuesta a una acción humana (envío o registro), nunca por su cuenta.
