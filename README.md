# LabLens

**Comité Virtual de Innovación** del Laboratorio Digital de ACH.

LabLens es un asistente inteligente que ayuda a evaluar y priorizar iniciativas de innovación. No reemplaza el criterio humano: estandariza el proceso, entrevista al proponente, consulta conocimiento histórico y entrega una recomendación fundamentada.

---

## ¿Qué resuelve?

Hoy las iniciativas suelen pasar por formularios y reuniones donde se acumulan comentarios y criterios. LabLens convierte ese flujo en una experiencia conversacional:

1. El usuario describe su iniciativa.
2. LabLens pregunta lo que falta.
3. Consulta conocimiento del Lab e iniciativas similares (tools).
4. Calcula un **Fit** con un motor propio (no inventado por el LLM).
5. Genera un resumen ejecutivo con fortalezas, riesgos y siguientes pasos.

---

## Estructura del repositorio

```text
LabLens/
├── backend/     # API Express + agente Gemini con tools
├── frontend/    # App Next.js (Comité Virtual)
└── README.md    # Este archivo
```

| Carpeta | Rol |
| --- | --- |
| [`backend/`](./backend) | API, agente con function calling, PostgreSQL (Neon), knowledge mock |
| [`frontend/`](./frontend) | UI SaaS: login, dashboard, chat de 3 paneles, evaluaciones |

Cada carpeta tiene su propio `README` con detalle de arquitectura, scripts y variables de entorno.

---

## Stack

### Backend

- Node.js · Express · TypeScript · pnpm
- Google Gemini (`@google/genai`) con **tools / function calling**
- PostgreSQL (Neon) · Prisma
- Zod · dotenv

### Frontend

- Next.js 15 (App Router) · TypeScript · pnpm
- Tailwind CSS · shadcn/ui · Radix · Motion
- TanStack Query · Zustand · React Hook Form · Zod

---

## Arquitectura (visión)

```text
┌────────────┐     ┌──────────────────────────────────────┐
│  Frontend  │────▶│  Backend API                         │
│  Next.js   │     │  ChatService → AgentService (Gemini) │
└────────────┘     │         ↓                            │
                   │    Tools (negocio)                   │
                   │  · searchKnowledge                   │
                   │  · findSimilarInitiatives            │
                   │  · calculateFit                      │
                   │  · generateExecutiveSummary          │
                   └──────────────────────────────────────┘
```

**Principio clave:** el LLM conversa y decide qué herramientas usar.  
Las reglas de negocio (Fit, knowledge, similares) viven en tools del backend.

---

## Requisitos

- Node.js ≥ 20
- pnpm
- Cuenta Gemini (API key)
- Base PostgreSQL (Neon u otra compatible)

---

## Puesta en marcha rápida

### 1. Backend

```bash
cd backend
pnpm install
cp .env.example .env
# Completa GEMINI_API_KEY, DATABASE_URL y FRONTEND_ORIGIN
pnpm prisma:migrate
pnpm dev
```

API en [http://localhost:3001](http://localhost:3001)

#### Deploy en Render (Web Service)

| Campo | Valor |
| --- | --- |
| Root Directory | `backend` |
| Build Command | `npm install -g pnpm@9 && pnpm run render:build` |
| Start Command | `pnpm start` |

No uses `corepack enable` en Render (falla con `EROFS`).

Variables: `GEMINI_API_KEY`, `GEMINI_MODEL`, `NODE_ENV=production`, `DATABASE_URL`, `FRONTEND_ORIGIN` (URL de Vercel).

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

1. Inicia sesión (auth mock en el frontend).
2. Crea una **nueva iniciativa / conversación**.
3. Describe tu idea; LabLens entrevista y, con suficiente contexto, evalúa.
4. Revisa el panel derecho y las evaluaciones completadas.

---

## Estado del MVP

| Capacidad | Estado |
| --- | --- |
| Chat conversacional con agente + tools | ✅ |
| Fit determinístico | ✅ |
| Knowledge e iniciativas mock (JSON/Markdown) | ✅ |
| Persistencia de conversaciones (Neon) | ✅ |
| UI Comité Virtual (3 paneles) | ✅ |
| Auth real (JWT + refresh HttpOnly) | ⏳ Preparado / mock |
| RAG + pgvector + embeddings | ⏳ Arquitectura lista (`searchKnowledge`) |
| LangGraph / multi-agente | ⏳ Evolución prevista |
| Integración Forms / SharePoint | ⏳ Futuro |

---

## Documentación adicional

- Backend: [`backend/README.md`](./backend/README.md)
- Frontend: [`frontend/README.md`](./frontend/README.md)

---

## Contexto ACH

LabLens nace como prototipo para el **Innovation Lab / Laboratorio Digital de ACH**, con el objetivo de demostrar el flujo completo de evaluación y la experiencia conversacional antes de integrar fuentes corporativas reales.
