# Lente de Innovación — Backend

Agente conversacional del Innovation Lab de ACH.

El modelo **no** calcula el Fit ni inventa conocimiento: decide qué herramientas usar,
interpreta resultados y redacta respuestas profesionales.

## Arquitectura de herramientas

```text
Usuario → ChatService → AgentService (Claude + tools) → respuesta
```

| Tool | Responsabilidad |
| --- | --- |
| `searchKnowledge` | Lee `knowledge/*.md` (futuro: RAG/pgvector) |
| `findSimilarInitiatives` | Keywords sobre `mock/iniciativas.json` |
| `calculateFit` | Motor determinístico (`fit.service`) |
| `generateExecutiveSummary` | Resumen ejecutivo vía el modelo, acotado |

El system prompt vive en `src/prompts/system.md`.

## Endpoints

- `POST /api/conversations`
- `GET /api/conversations/:id`
- `POST /api/conversations/:id/messages`
- `GET /api/health`

### Respuesta de mensaje (núcleo)

```json
{
  "success": true,
  "data": {
    "message": "...",
    "fit": { "fit": 84, "impact": 92, "alignment": 80, "dataAvailability": 70, "complexity": 65, "observations": [] },
    "similarInitiatives": [],
    "summary": {
      "problema": "...",
      "solucionPropuesta": "...",
      "beneficios": [],
      "riesgos": [],
      "siguientePasoRecomendado": "..."
    }
  }
}
```

También se incluyen campos de compatibilidad con el frontend actual (`reply`, `type`, `status`, `evaluation`, etc.).

## Setup

```bash
pnpm install
cp .env.example .env
pnpm prisma:migrate
pnpm dev
```

## Evolución a RAG

Solo `searchKnowledge` conoce la fuente de datos.
Reemplazar su `execute.ts` por retrieval semántico no requiere tocar ChatService ni el resto de tools.
