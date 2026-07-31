# LabLens Frontend

Comité Virtual de Innovación del Laboratorio Digital de ACH.

Esta aplicación no es “solo un chat”: el chat es el canal de entrevista.
El panel derecho refleja el avance real de la iniciativa y, al terminar,
la evaluación completa.

## Stack

- Next.js 15 (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui + Radix UI
- Motion, TanStack Query, Zustand
- React Hook Form + Zod
- next-themes, react-markdown, sonner, Lucide

## Arquitectura

Arquitectura por **features** (no por tipo de componente global):

```text
src/
  app/                 # rutas App Router
  features/
    auth/
    chat/
    conversation/
    initiative/
    evaluation/
    dashboard/
  shared/              # UI/hooks/lib transversales
  api/                 # ApiClient tipado
  stores/              # estado local (Zustand)
  types/               # contratos compartidos
  config/              # env, routes, branding
  styles/              # design tokens
  components/ui/       # primitivos shadcn
```

Cada feature puede incluir `components/`, `hooks/`, `services/`, `types/`.

## Backend real vs mock

### Conectado al backend actual

- `POST /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages`

### Mock / local (con `TODO(backend)`)

- Auth login/register/refresh/logout
- Listado global de conversaciones
- Rename / delete / favorites persistidos en servidor
- CRUD de iniciativas como entidad separada
- Streaming SSE real (hoy se simula en cliente)

El historial del sidebar se persiste en `localStorage` y se sincroniza al
crear/abrir conversaciones reales.

## Instalación

```bash
cd frontend
pnpm install
cp .env.example .env.local
pnpm dev
```

App: [http://localhost:3000](http://localhost:3000)  
API esperada: [http://localhost:3001](http://localhost:3001)

## Variables de entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=LabLens
```

## Scripts

- `pnpm dev` — desarrollo (Turbopack)
- `pnpm build` — build de producción
- `pnpm start` — servir build
- `pnpm lint` — ESLint

## Flujo de producto

1. Login (mock listo para JWT + refresh HttpOnly)
2. Dashboard
3. Nueva iniciativa → crea conversación en backend
4. LabLens entrevista (una pregunta a la vez)
5. Panel derecho: completitud + checklist
6. Al completar: evaluación en tarjetas
7. Consulta posterior desde Evaluaciones

## Diseño

- Dark mode por defecto
- Identidad LabLens: tinta de laboratorio + teal luminoso (no azul genérico)
- Tipografía: Sora (heading) + Manrope (UI) + IBM Plex Mono
- Layout de 3 paneles: sidebar · chat · insight panel

## Buenas prácticas

- Nunca llamar `fetch` desde componentes: usar `src/api` + services de feature
- TanStack Query para remoto, Zustand para local/UI
- Formularios con RHF + Zod
- Tipado estricto, sin `any`
- Endpoints faltantes: interfaz + `TODO(backend)`, sin inventar lógica de negocio

## Cómo agregar una feature

1. Crea `src/features/<nombre>/{components,hooks,services,types}`
2. Define tipos en `types/` o en la feature
3. Agrega service que hable solo con `apiClient`
4. Expón hooks (`useQuery` / `useMutation`)
5. Compón UI en `app/` lo más delgada posible

## Cómo conectar un endpoint nuevo

1. Tipar request/response en `src/types` o `features/*/types`
2. Implementar método en el service de la feature
3. Quitar el mock/`TODO`
4. Cablear el hook y invalidar queries relacionadas

## Atajos

- `Ctrl/Cmd + B` — toggle sidebar
- `Ctrl/Cmd + I` — toggle panel derecho
- `Enter` — enviar mensaje
- `Shift + Enter` — nueva línea
