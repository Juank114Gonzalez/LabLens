# Lente de Innovación

**Comité Virtual** del Laboratorio Digital de ACH.

El Lente de Innovación es la primera línea de análisis del Laboratorio Digital. No reemplaza el criterio humano: filtra lo que no le corresponde al Lab, estandariza la evaluación de lo que sí, y entrega una recomendación fundamentada y auditable.

---

## ¿Qué resuelve?

El cuello de botella no es la falta de ideas, es el costo de mirarlas. El Lente de Innovación separa ese costo en dos caminos:

**Camino rápido — todos los envíos, sin cuenta.** Quien propone entra a `/submit`, elige su canal (área interna, organización externa o referencia internacional), diligencia el formulario y en segundos ve la categoría asignada y la mesa de trabajo responsable. Si la iniciativa no es del Lab, el área dueña recibe un correo con el contexto completo.

**Camino profundo — solo lo que se queda en el Lab.** Un evaluador toma el caso desde la bandeja y dispara el pipeline: seis criterios puntuados por separado, **Fit** calculado por la lógica de negocio (no inventado por el LLM), prioridad y business case de seis secciones. Cada evaluación congela los criterios y pesos que usó.

Los detalles de diseño están en [`docs/`](./docs).

---

## Estructura del repositorio

```text
LabLens/
├── backend/     # API Express + triage y pipeline sobre Claude
├── frontend/    # App Next.js (formulario público + back-office del Lab)
├── docs/        # Entregables del reto
└── README.md    # Este archivo
```

| Carpeta | Rol |
| --- | --- |
| [`backend/`](./backend) | API, triage rápido, pipeline de evaluación, PostgreSQL (Neon) |
| [`frontend/`](./frontend) | Formulario público sin login, dashboard del Lab, bandeja y evaluaciones |
| [`docs/`](./docs) | Arquitectura AWS, flujo operativo, modelo de datos, manual, deck y guion de demo |

Cada carpeta tiene su propio `README` con detalle de arquitectura, scripts y variables de entorno.

---

## Stack

### Backend

- Node.js · Express · TypeScript · pnpm
- Anthropic Claude (`@anthropic-ai/sdk`) con **tool use** — por defecto Haiku 4.5 por costo
- PostgreSQL (Neon) · Prisma
- Zod · dotenv

### Frontend

- Next.js 15 (App Router) · TypeScript · pnpm
- Tailwind CSS · shadcn/ui · Radix · Motion
- TanStack Query · Zustand · React Hook Form · Zod

---

## Arquitectura (visión)

```text
  Envío público                      Back-office del Lab
  (sin cuenta)                       (evaluadores y admins)
       │                                      │
       ▼                                      ▼
  POST /api/public/initiatives          GET /api/initiatives/stats
       │                                Bandeja · filtros · auditoría
       ▼                                      │
  triage.service  ── 1 llamada al LLM         ▼
       │                              evaluation-pipeline.service
       ├── ¿es del Lab? ── no ──▶ notification.service (SMTP)   6 pasos · scoring por criterio,
       │                                                        clasificación, mesa, prioridad,
       └── sí ──▶ bandeja del Lab ─────────────────────────────▶ business case, persistencia
```

**Principio clave:** el modelo razona y redacta; el número que ordena el portafolio lo calcula la lógica de negocio. Ver [`docs/flujo-operativo.md`](./docs/flujo-operativo.md) para el reparto exacto de decisiones.

El target serverless en AWS (Bedrock, Step Functions, Lambda, DynamoDB, S3, Cognito, SES) está en [`docs/arquitectura-aws.md`](./docs/arquitectura-aws.md).

---

## Requisitos

- Node.js ≥ 20
- pnpm
- Cuenta Anthropic (API key)
- Base PostgreSQL (Neon u otra compatible)

---

## Puesta en marcha rápida

### 1. Backend

```bash
cd backend
pnpm install
cp .env.example .env
# Completa ANTHROPIC_API_KEY, DATABASE_URL y FRONTEND_ORIGIN
# SMTP_* es opcional: sin él el triage enruta igual, solo omite el correo
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

API en [http://localhost:3001](http://localhost:3001)

#### Deploy en Render (Web Service)

| Campo | Valor |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install -g pnpm@10 && pnpm install && pnpm run render:build` |
| Start Command | `pnpm start` |

- No uses `corepack enable` (falla con `EROFS`).
- El prefijo `backend/ $` en la UI de Render **no** se escribe en el comando; solo indica el directorio.

Variables: `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL`, `NODE_ENV=production`, `DATABASE_URL`, `FRONTEND_ORIGIN` (URL de Vercel).

### 2. Frontend

```bash
cd frontend
pnpm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:3001
pnpm dev
```

App en [http://localhost:3000](http://localhost:3000)

### 3. Flujo de demostración

1. Sin sesión, entra a [http://localhost:3000/submit](http://localhost:3000/submit) y envía una iniciativa operativa. Observa el enrutamiento y el correo al área.
2. Envía otra claramente disruptiva: se queda en el Lab.
3. Inicia sesión (`admin@lablens.local` / `Admin123*` tras `pnpm prisma:seed`) y ve a la **Bandeja del Lab**.
4. Dispara **Evaluar ahora** o **Entrevistar** y revisa Fit, prioridad y business case.

El guion completo está en [`docs/guion-demo.md`](./docs/guion-demo.md).

---

## Estado del MVP

| Capacidad | Estado |
| --- | --- |
| Formulario público sin login, 3 canales de origen | ✅ |
| Triage rápido (1 llamada al LLM) con clasificación y enrutamiento | ✅ |
| Notificación automática al área dueña (SMTP) | ✅ |
| Pipeline profundo con scoring por criterio y business case | ✅ |
| Fit determinístico con snapshot de criterios y pesos | ✅ |
| Dashboard del Lab, bandeja y vista de auditoría | ✅ |
| Auth real (JWT + refresh HttpOnly), sin registro público | ✅ |
| Export PDF/DOCX del business case | ⏳ Previsto |
| RAG + pgvector sobre conocimiento del Lab | ⏳ Arquitectura lista (`searchKnowledge`) |
| Migración a Bedrock + Step Functions | ⏳ Diagramada en `docs/` |

---

## Documentación adicional

- Entregables del reto: [`docs/`](./docs)
- Backend: [`backend/README.md`](./backend/README.md)
- Frontend: [`frontend/README.md`](./frontend/README.md)

---

## Contexto ACH

El Lente de Innovación nace como prototipo para el **Innovation Lab / Laboratorio Digital de ACH**, con el objetivo de demostrar el flujo completo de evaluación y la experiencia conversacional antes de integrar fuentes corporativas reales.
