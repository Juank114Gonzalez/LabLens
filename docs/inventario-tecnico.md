# Inventario técnico — LabLens

**Fecha:** 2026-08-13
**Alcance:** repositorio `LabLens` (prototipo de recolección de ideas de innovación mediante formulario público + clasificador con IA + evaluación). Monorepo de dos proyectos independientes: `backend/` (API) y `frontend/` (interfaz web), sin workspace raíz.

Este documento describe el estado **actual** del código. Cuando algo está solo diseñado/documentado pero no implementado, se marca explícitamente como "planeado a futuro".

---

## 1. Pantallas / vistas / endpoints existentes

### 1.1 Pantallas del frontend (Next.js 15, App Router)

#### Público (sin autenticación)

| Ruta | Archivo | Descripción |
|---|---|---|
| `/` | `frontend/src/app/page.tsx` | Landing del "Comité Virtual del Laboratorio Digital". CTA "Dar mi idea" → `/submit`, enlace para compartir (QR/link) y acceso a "Iniciar sesión". |
| `/submit` | `frontend/src/app/submit/page.tsx` (+ `layout.tsx`) | Wizard público multi-paso para enviar una iniciativa (`public-initiative-form.tsx`): datos del remitente, la idea, alcance/valor, adjuntos de evidencia (PDF/DOCX/XLSX/PNG/JPG, máx. 10 archivos / 15MB). Muestra el resultado del triage automático tras el envío. Soporta `?source=internal|external|international`. |
| `/login` | `frontend/src/app/(auth)/login/page.tsx` | Login de evaluadores/administradores: email+password o botón "Iniciar sesión con Microsoft" (MSAL). |

#### Autenticado — grupo `(app)` (protegido por `AuthGuard` + `AppShell`)

| Ruta | Archivo | Descripción |
|---|---|---|
| `/dashboard` | `frontend/src/app/(app)/dashboard/page.tsx` | KPIs y gráficas: totales, distribución por estado/origen/clasificación/área, línea de tiempo. |
| `/inbox` | `frontend/src/app/(app)/inbox/page.tsx` | "Bandeja del Lab": iniciativas clasificadas (`TRIAGED_LAB`) pendientes de evaluación completa. |
| `/initiatives` | `frontend/src/app/(app)/initiatives/page.tsx` | Listado completo de iniciativas, con filtros y acciones (ver, editar si es `DRAFT`, copiar, ver evaluaciones, descargar evidencias, eliminar, clasificar pendientes/reclasificar todo para admin). |
| `/initiatives/new` | `frontend/src/app/(app)/initiatives/new/page.tsx` | Crea un borrador y redirige a edición. |
| `/initiatives/[id]` | `frontend/src/app/(app)/initiatives/[id]/page.tsx` | Ficha de detalle: clasificación automática, datos del formulario, contactos, evidencias, historial de evaluaciones. |
| `/initiatives/[id]/edit` | `frontend/src/app/(app)/initiatives/[id]/edit/page.tsx` | Wizard de edición del borrador (formulario interno completo). |
| `/initiatives/[id]/evaluations` | `frontend/src/app/(app)/initiatives/[id]/evaluations/page.tsx` | Historial de evaluaciones de una iniciativa concreta. |
| `/evaluations` | `frontend/src/app/(app)/evaluations/page.tsx` | Listado global de evaluaciones, filtros, diálogo "Nueva evaluación", eliminación (solo admin). |
| `/evaluations/[conversationId]` | `frontend/src/app/(app)/evaluations/[conversationId]/page.tsx` | Detalle del resultado de una evaluación. |
| `/chat/[conversationId]` | `frontend/src/app/(app)/chat/[conversationId]/page.tsx` | Interfaz de chat/entrevista con el asistente IA. |
| `/admin` | `frontend/src/app/(app)/admin/page.tsx` | Sin UI propia; redirige a `/admin/users`. |
| `/admin/users` | `frontend/src/app/(app)/admin/users/page.tsx` | CRUD de usuarios/evaluadores. Solo ADMIN. |
| `/admin/criteria` | `frontend/src/app/(app)/admin/criteria/page.tsx` | Gestión de criterios de evaluación: reordenar (drag&drop), pesos (deben sumar 100%), activar/desactivar, historial de versiones. |
| `/admin/classifications` | `frontend/src/app/(app)/admin/classifications/page.tsx` | CRUD del catálogo "Clasificaciones inteligentes" (usado por el triage IA). |
| `/admin/work-tables` | `frontend/src/app/(app)/admin/work-tables/page.tsx` | CRUD del catálogo "Mesas de trabajo" (destino cuando el triage enruta fuera del Lab). |

**Notas de routing:** rutas centralizadas en `frontend/src/config/routes.ts`; guard de autenticación client-side en `frontend/src/features/auth/components/auth-guard.tsx` con reglas de rol en `frontend/src/features/auth/lib/roles.ts` (`/admin` solo ADMIN; `/chat` y `/evaluations` solo EVALUATOR/ADMIN). `frontend/src/middleware.ts` es un **placeholder** — no valida sesión del lado del servidor todavía (TODO explícito en el código).

### 1.2 Endpoints del backend (Express, prefijo `/api`)

Formato de respuesta estándar: éxito `{success:true, data}`, error `{success:false, message}`.

#### Público

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/public/initiatives` | No | Formulario público de 12 preguntas; acepta JSON o `multipart/form-data`; dispara triage automático internamente; rate limit por IP/hora. |

#### Autenticación

| Método | Ruta | Auth | Descripción |
|---|---|---|---|
| POST | `/api/auth/login` | No | Login con email/password (dominio `@achcolombia.com.co` obligatorio). |
| POST | `/api/auth/microsoft` | No | Login con token de Microsoft Graph (SSO); no crea usuarios nuevos. |
| POST | `/api/auth/logout` | No (usa cookie) | Revoca refresh token y limpia cookie. |
| POST | `/api/auth/refresh` | No (usa cookie) | Rota refresh token, emite nuevo access token. |
| GET | `/api/auth/me` | Sí | Perfil del usuario autenticado. |

#### Administración de usuarios (`/api/users`) — todo el router requiere ADMIN

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista usuarios. |
| POST | `/` | Crea usuario. |
| GET | `/:id` | Detalle de usuario. |
| PATCH | `/:id/role` | Cambia rol. |
| PATCH | `/:id` | Actualiza datos/estado. |
| POST | `/:id/reset-password` | Placeholder de reseteo de contraseña (no implementado aún). |
| DELETE | `/:id` | Elimina usuario. |

#### Iniciativas (`/api/initiatives`) — requiere autenticación; escritura EVALUATOR/ADMIN

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/` | Auth | Lista con filtros. |
| GET | `/stats` | EVALUATOR/ADMIN | Estadísticas agregadas. |
| POST | `/triage-sweep` | ADMIN | Re-ejecuta triage IA en lote. |
| POST | `/` | EVALUATOR/ADMIN | Crea borrador. |
| GET | `/:id` | Auth | Detalle. |
| PATCH | `/:id` | EVALUATOR/ADMIN | Actualiza borrador. |
| POST | `/:id/register` | EVALUATOR/ADMIN | Pasa de `DRAFT` a `REGISTERED` + dispara triage. |
| GET | `/:id/evaluations` | Auth | Evaluaciones de la iniciativa. |
| POST | `/:id/triage` | EVALUATOR/ADMIN | Re-triage puntual. |
| POST | `/:id/copy` | EVALUATOR/ADMIN | Copia editable enlazada. |
| POST | `/:id/evaluations` | EVALUATOR/ADMIN | Inicia evaluación (modo entrevista o directo). |
| DELETE | `/:id` | EVALUATOR/ADMIN | Elimina. |

#### Contactos de empresa (`/api/company-contacts`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/?initiativeId=` | Auth | Lista contactos de una iniciativa. |
| POST | `/` | EVALUATOR/ADMIN | Crea contacto. |
| PATCH | `/:id` | EVALUATOR/ADMIN | Actualiza. |
| DELETE | `/:id` | EVALUATOR/ADMIN | Elimina. |

#### Adjuntos (`/api/attachments`)

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/?initiativeId=` | Auth | Lista adjuntos. |
| GET | `/download?initiativeId=` | Auth | Descarga ZIP (streaming). |
| POST | `/` | EVALUATOR/ADMIN | Sube archivo (máx 15MB) → Cloudinary. |
| DELETE | `/:id` | EVALUATOR/ADMIN | Elimina adjunto (BD + Cloudinary best-effort). |

#### Catálogos

| Recurso | Rutas | Lectura | Escritura |
|---|---|---|---|
| Clasificaciones inteligentes | `/api/intelligent-classifications` (`/`, `/:id`) | Auth | ADMIN |
| Mesas de trabajo | `/api/work-tables` (`/`, `/:id`) | Auth | ADMIN |
| Criterios de evaluación | `/api/evaluation-criteria` (`/`, `/:id`, `/versions`, `/reorder`) | Auth | ADMIN |

#### Conversaciones / chat IA (`/api/conversations`) — todo el router requiere EVALUATOR/ADMIN

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/` | Lista conversaciones del evaluador (o todas si ADMIN). |
| GET | `/:id` | Detalle + mensajes. |
| POST | `/:id/messages` | Envía mensaje al agente IA ("Modo Entrevista" con tool-use). |
| POST | `/:id/generate` | Dispara el pipeline determinístico de evaluación. |

#### Evaluaciones (`/api/evaluations`) — requiere EVALUATOR/ADMIN

| Método | Ruta | Rol | Descripción |
|---|---|---|---|
| GET | `/` | EVALUATOR/ADMIN | Lista. |
| GET | `/:id` | EVALUATOR/ADMIN | Detalle (incluye snapshots de criterios/pesos/resultados). |
| DELETE | `/:id` | ADMIN | Elimina (cascada sobre conversación y mensajes). |

#### Salud

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/health` | Health check, sin auth. |

---

## 2. Modelos de datos (Prisma / PostgreSQL)

| Entidad | Campos clave | Relaciones |
|---|---|---|
| **User** | id, name, email (único), passwordHash, role (`EVALUATOR`\|`ADMIN`), isActive | 1—N `Initiative`, 1—N `Evaluation` (como evaluador), 1—N `RefreshToken` |
| **RefreshToken** | id, userId, tokenHash, expiresAt, revokedAt | N—1 `User` (cascade) |
| **Initiative** | id, userId (nullable), status (`InitiativeStatus`: DRAFT, REGISTERED, TRIAGED_LAB, TRIAGED_EXTERNAL, UNDER_REVIEW, EVALUATED, APPROVED, REJECTED, ARCHIVED), sourceType (`INTERNAL`\|`EXTERNAL_CONTRACTOR`\|`INTERNATIONAL_REFERENCE`), campos del formulario interno y público, campos de triage (`triageClassificationId`, `triageWorkTableId`, `triageReasoning`, `triageConfidence`, `triagedAt`, `notificationSentAt`), `copiedFromId` (linaje de copias) | N—1 `User`, N—1 `IntelligentClassification`, N—1 `WorkTable`, 1—N `CompanyContact`, 1—N `Attachment`, 1—N `Evaluation`, auto-relación `copiedFrom`/`copies` |
| **CompanyContact** | id, initiativeId, empresa, contacto, cargo, correo, telefono | N—1 `Initiative` (cascade) |
| **Attachment** | id, initiativeId, publicId, secureUrl, originalName, mimeType, size | N—1 `Initiative` (cascade) — `publicId`/`secureUrl` de Cloudinary |
| **Evaluation** | id, initiativeId, evaluatorId, status (`EvaluationStatus`), readinessStatus (`ReadinessStatus`), readiness (Json), priority, configVersion, criteriaVersionId, criteriaSnapshot/weightsSnapshot/results/classificationSnapshot/workTableSnapshot (Json), businessCase, evaluatedAt | N—1 `Initiative`, N—1 `User`, N—1 `IntelligentClassification`, N—1 `WorkTable`, 1—1 `Conversation`, N—1 `CriteriaVersion` |
| **Conversation** | id, evaluationId (único), title, status (`ConversationStatus`: COLLECTING_INFORMATION, READY_TO_EVALUATE, COMPLETED), completion (%) | 1—1 `Evaluation`, 1—N `Message` |
| **Message** | id, conversationId, role (user/assistant/system), content, createdAt | N—1 `Conversation` (cascade) |
| **CriteriaVersion** | id, numero (único), hash (único), snapshot (Json), totalPeso | 1—N `Evaluation` |
| **EvaluationCriteria** | id, nombre, descripcion, promptContext, peso (%), activo, orden | catálogo del pipeline de evaluación |
| **IntelligentClassification** | id, nombre (único), descripcion, promptContext, activo | 1—N `Evaluation`, 1—N `Initiative` (triage) |
| **WorkTable** | id, nombre (único), descripcion, promptContext, notificationEmail, activo | 1—N `Evaluation`, 1—N `Initiative` (triage) |

**Migraciones relevantes** (evolución del modelo, en `backend/prisma/migrations/`): `domain_restructure`, `inc2_draft_user_active`, `evaluation_readiness`, `source_type_and_triage`, `remove_generator_role`, `public_form_v2`, `multi_select_scope`, `criteria_decimal_weights`, `initiative_copies`, `criteria_versions`.

**Seed** (`backend/prisma/seed.ts`): crea usuario admin, 5 clasificaciones, 4 mesas de trabajo (con correo de notificación) y 6 criterios de evaluación.

---

## 3. Integraciones externas

| Integración | Propósito | Dónde se usa | Variables de entorno |
|---|---|---|---|
| **Anthropic Claude** (LLM) | Motor de triage automático, pipeline de evaluación por criterios, agente conversacional con tool-use ("Modo Entrevista") | `backend/src/services/llm.service.ts`, `agent.service.ts`, `triage.service.ts`, `evaluation-pipeline.service.ts` | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` (default `claude-haiku-4-5`) |
| **Cloudinary** | Almacenamiento de adjuntos/evidencias (PDF, DOCX, XLSX, PNG, JPG) | `backend/src/services/cloudinary.service.ts` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `CLOUDINARY_FOLDER` |
| **SMTP (Nodemailer)** | Notificación por correo a la mesa de trabajo cuando el triage enruta una iniciativa fuera del Lab; opcional, best-effort (nunca revierte el triage si falla) | `backend/src/services/notification.service.ts` | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` |
| **Microsoft Graph API / Azure AD (MSAL)** | Login corporativo SSO: el frontend obtiene el token vía MSAL, el backend lo valida contra Microsoft Graph | `frontend/src/config/msal.ts`, `backend/src/services/auth.service.ts` (`fetchMicrosoftProfile`) | `NEXT_PUBLIC_MSAL_CLIENT_ID`, `NEXT_PUBLIC_MSAL_TENANT_ID` (frontend); ninguna propia en backend, valida el token recibido |

**Explícitamente ausentes:** sin pasarela de pagos, sin analytics/monitoring externo (APM) — el logging es local vía `console.log/error`. Sin proveedores LLM adicionales (solo Anthropic).

**Nota sobre RAG:** la tool `searchKnowledge` del agente conversacional está descrita como "arquitectura lista" en la documentación previa del proyecto, pero hoy es un MVP que lee archivos `.md` estáticos de `backend/src/knowledge/`, sin retrieval semántico real (no hay embeddings ni pgvector en uso).

---

## 4. Stack tecnológico

### 4.1 Frontend

| Aspecto | Detalle |
|---|---|
| Framework | Next.js 15.5.22 (App Router, Turbopack) |
| Librería UI | React 19.1.0 |
| Lenguaje | TypeScript 5 (strict) |
| Estilos/componentes | Tailwind CSS v4 + shadcn/ui + Radix UI, iconos `lucide-react`, animaciones `motion` |
| Estado | Zustand 5 (auth, ui, conversation-meta) + TanStack React Query 5 |
| Formularios/validación | React Hook Form 7 + Zod 4 |
| Build | Next.js con Turbopack |
| Gestor de paquetes | pnpm |
| Testing | No configurado (sin Jest/Vitest/Playwright) |
| Lint/formato | ESLint 9 + Prettier 3 |
| Otras libs | `@azure/msal-browser` (SSO Microsoft), `@dnd-kit` (drag&drop de criterios), `qrcode.react`, `react-markdown`, `sonner`, `next-themes` |

### 4.2 Backend

| Aspecto | Detalle |
|---|---|
| Framework | Express 5.1.0 |
| Lenguaje | TypeScript 5.9.2, ESM, ejecutado con `tsx` |
| Runtime | Node 20.x, pnpm 10.15.0 |
| ORM | Prisma 6.19.3 |
| Base de datos | PostgreSQL, hosteada en **Neon** |
| Validación | Zod v4 |
| Autenticación | JWT propio (access + refresh), `bcryptjs` para hashing, refresh token en cookie httpOnly; login alterno vía Microsoft Graph |
| Subida de archivos | `multer` (memoria) → Cloudinary |
| Rate limiting | `express-rate-limit` (solo en el endpoint público) |
| Email | `nodemailer` (SMTP opcional) |
| Zip de adjuntos | `archiver` |
| Lint/formato | ESLint 9 + typescript-eslint, Prettier |

### 4.3 Base de datos y hosting

- **Base de datos:** PostgreSQL en Neon, gestionada con Prisma (10 migraciones + seed).
- **Hosting backend:** Render (Web Service). Build: `pnpm install && pnpm run render:build` (que corre `prisma generate && prisma migrate deploy && pnpm prisma:seed`). Start: `pnpm start`.
- **Hosting frontend:** Vercel (implícito por convención del stack Next.js; no hay archivo `vercel.json` versionado).
- **Contenedores:** no se usa Docker en ningún punto del proyecto.
- **CI/CD:** no existe (`.github/workflows` no está presente en el repositorio).

### 4.4 Roadmap futuro (planeado, no implementado)

El proyecto documenta (en materiales de arquitectura previos) una migración objetivo a AWS: Amazon Bedrock (en lugar de la API directa de Anthropic), DynamoDB (en lugar de PostgreSQL), Lambda + API Gateway, Cognito, S3 + CloudFront, SES, QuickSight, WAF, Secrets Manager, AWS CDK como IaC. **Nada de esto está implementado en el código actual** — es exclusivamente un diseño documentado como target futuro.
