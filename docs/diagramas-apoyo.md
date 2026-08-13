# Diagramas de apoyo — LabLens

**Fecha:** 2026-08-13
**Formato:** código [Mermaid](https://mermaid.js.org/) embebido en bloques ```` ```mermaid ```` — es texto plano (editable como descripción) que además se renderiza como diagrama real en GitHub, VS Code, Pandoc y la mayoría de conversores a PDF con soporte Mermaid. Todo el contenido es trazable 1:1 a `docs/actores-sistema.md`, `docs/casos-de-uso.md` e `docs/inventario-tecnico.md`.

---

## 1. Diagrama de casos de uso (UML)

Mermaid no tiene un tipo nativo de "diagrama de casos de uso"; se modela como un `flowchart` con los actores primarios conectados a sus casos de uso, agrupados por dominio funcional. El actor "Claude" se incluye como actor de sistema (no humano) en los casos de uso donde interviene directamente.

```mermaid
flowchart LR
  actorRemitente(["👤 Remitente de idea<br/>(público, sin cuenta)"])
  actorEvaluador(["👤 Evaluador"])
  actorAdmin(["👤 Administrador"])
  actorClaude(["🤖 Claude<br/>(actor de sistema)"])

  actorAdmin -. "hereda todo de" .-> actorEvaluador

  subgraph S1["Identidad y administración"]
    UC1["Iniciar sesión<br/>(credenciales o Microsoft SSO)"]
    UC2["Cerrar / renovar sesión"]
    UC3["Administrar usuarios"]
    UC4["Gestionar catálogos<br/>(clasificaciones, mesas, criterios)"]
    UC5["Gestionar contactos de empresa"]
  end

  subgraph S2["Ciclo de vida de iniciativas"]
    UC6["Enviar iniciativa pública"]
    UC7["Crear / editar borrador"]
    UC8["Registrar iniciativa"]
    UC9["Copiar iniciativa"]
    UC10["Eliminar iniciativa"]
    UC11["Re-triage puntual"]
    UC11B["Barrido masivo de triage"]
    UC12["Gestionar evidencias adjuntas"]
    UC13["Consultar estadísticas"]
  end

  subgraph S3["Evaluación asistida por IA"]
    UC14["Iniciar evaluación"]
    UC15["Conversar en modo entrevista"]
    UC16["Generar evaluación"]
    UC17["Consultar evaluaciones"]
    UC17B["Eliminar evaluación"]
  end

  actorRemitente --> UC6

  actorEvaluador --> UC1
  actorEvaluador --> UC2
  actorEvaluador --> UC5
  actorEvaluador --> UC7
  actorEvaluador --> UC8
  actorEvaluador --> UC9
  actorEvaluador --> UC10
  actorEvaluador --> UC11
  actorEvaluador --> UC12
  actorEvaluador --> UC13
  actorEvaluador --> UC14
  actorEvaluador --> UC15
  actorEvaluador --> UC16
  actorEvaluador --> UC17

  actorAdmin --> UC3
  actorAdmin --> UC4
  actorAdmin --> UC11B
  actorAdmin --> UC17B

  actorClaude -.-> UC6
  actorClaude -.-> UC11
  actorClaude -.-> UC11B
  actorClaude -.-> UC15
  actorClaude -.-> UC16
```

**Nota:** el rol `ADMIN` incluye todas las capacidades de `EVALUATOR` (flecha "hereda todo de") más las exclusivas mostradas arriba. `CompanyContact` no aparece como actor porque es un dato, no un actor (ver `docs/actores-sistema.md`).

---

## 2. Diagrama de arquitectura AS-IS

Capas, componentes principales y dirección real del flujo de datos, según el código actual (sin el roadmap AWS, que es solo diseño futuro).

```mermaid
flowchart TB
  subgraph FE["Frontend — Next.js 15 App Router (Vercel)"]
    FEPub["Páginas públicas<br/>/ , /submit , /login"]
    FEApp["Páginas autenticadas (app)<br/>dashboard, initiatives, chat, evaluations, admin/*"]
    FEState["Zustand + TanStack Query"]
    FEApi["Cliente HTTP<br/>api/client.ts"]
  end

  subgraph BE["Backend — Express 5 (Render)"]
    Routes["Rutas /api/*"]
    Mid["Middlewares<br/>authenticate · authorize · validate (Zod) · rate-limit"]
    Ctrl["Controladores"]
    Svc["Servicios de dominio<br/>triage · evaluation-pipeline · agent · chat · notification"]
    Repo["Repositorios (Prisma)"]
  end

  DB[("PostgreSQL — Neon")]

  subgraph EXT["Servicios externos"]
    Claude["Anthropic Claude<br/>(triage, pipeline, agente conversacional)"]
    Cloud["Cloudinary<br/>(adjuntos/evidencias)"]
    SMTP["SMTP / Nodemailer<br/>(notificación best-effort)"]
    MSGraph["Microsoft Graph API<br/>(validación SSO)"]
  end

  FEPub --> FEApi
  FEApp --> FEState --> FEApi
  FEApi -->|HTTPS / JSON| Routes
  Routes --> Mid --> Ctrl --> Svc
  Svc --> Repo --> DB
  Svc -->|clasificación / evaluación / entrevista| Claude
  Svc -->|subir / eliminar archivos| Cloud
  Svc -->|correo de enrutamiento| SMTP
  Svc -->|validar token SSO| MSGraph
```

**Notas del AS-IS:** monolito de dos procesos independientes (sin descomposición en microservicios); sin colas asíncronas — las llamadas a Claude ocurren dentro de la misma petición HTTP; sin caché de base de datos ni CDN propio (más allá de lo que Vercel/Render den por defecto). Detalle completo en `docs/requisitos-no-funcionales.md`.

---

## 3. Diagrama entidad-relación

Basado en `backend/prisma/schema.prisma`, con las 12 entidades documentadas en `docs/inventario-tecnico.md` (sección 2).

```mermaid
erDiagram
  USER {
    string id
    string name
    string email
    string passwordHash
    string role
    boolean isActive
  }
  REFRESH_TOKEN {
    string id
    string userId
    string tokenHash
    datetime expiresAt
    datetime revokedAt
  }
  INITIATIVE {
    string id
    string userId
    string status
    string sourceType
    string triageClassificationId
    string triageWorkTableId
    float triageConfidence
    string copiedFromId
  }
  COMPANY_CONTACT {
    string id
    string initiativeId
    string empresa
    string contacto
    string correo
  }
  ATTACHMENT {
    string id
    string initiativeId
    string publicId
    string secureUrl
    string mimeType
  }
  EVALUATION {
    string id
    string initiativeId
    string evaluatorId
    string status
    string readinessStatus
    string priority
    string criteriaVersionId
    json results
  }
  CONVERSATION {
    string id
    string evaluationId
    string status
    int completion
  }
  MESSAGE {
    string id
    string conversationId
    string role
    string content
  }
  CRITERIA_VERSION {
    string id
    int numero
    string hash
    float totalPeso
  }
  EVALUATION_CRITERIA {
    string id
    string nombre
    float peso
    boolean activo
    int orden
  }
  INTELLIGENT_CLASSIFICATION {
    string id
    string nombre
    boolean activo
  }
  WORK_TABLE {
    string id
    string nombre
    string notificationEmail
    boolean activo
  }

  USER ||--o{ REFRESH_TOKEN : "posee"
  USER ||--o{ INITIATIVE : "crea (canal interno, opcional)"
  USER ||--o{ EVALUATION : "evalúa"

  INITIATIVE ||--o{ COMPANY_CONTACT : "tiene"
  INITIATIVE ||--o{ ATTACHMENT : "tiene"
  INITIATIVE ||--o{ EVALUATION : "es evaluada en"
  INITIATIVE }o--o| INITIATIVE : "copiada de (self)"
  INITIATIVE }o--o| INTELLIGENT_CLASSIFICATION : "triage clasifica"
  INITIATIVE }o--o| WORK_TABLE : "triage enruta"

  EVALUATION ||--|| CONVERSATION : "tiene"
  EVALUATION }o--o| INTELLIGENT_CLASSIFICATION : "clasifica"
  EVALUATION }o--o| WORK_TABLE : "asigna"
  EVALUATION }o--|| CRITERIA_VERSION : "usa versión"

  CONVERSATION ||--o{ MESSAGE : "contiene"
```

**Nota:** `EvaluationCriteria` es el catálogo editable de criterios; `CriteriaVersion` es el snapshot inmutable que cada `Evaluation` referencia para auditoría (ver RF-20/RF-59 en `docs/requisitos-funcionales.md`).

---

## 4. Diagramas de secuencia — flujos críticos

Se eligieron los 3 flujos de mayor riesgo/complejidad del sistema.

### 4.1 Login con credenciales

```mermaid
sequenceDiagram
    actor Usuario
    participant FE as Frontend
    participant API as Backend (auth.routes)
    participant SVC as auth.service
    participant DB as PostgreSQL

    Usuario->>FE: Ingresa email + password
    FE->>API: POST /api/auth/login
    API->>SVC: loginUser(body)
    SVC->>SVC: Valida dominio @achcolombia.com.co
    alt Dominio no permitido
        SVC-->>API: 403 dominio no permitido
        API-->>FE: 403
    else Dominio válido
        SVC->>DB: findUserByEmail(email)
        alt Usuario no existe o password incorrecta
            SVC-->>API: 401 Invalid credentials
            API-->>FE: 401
        else Cuenta inactiva
            SVC-->>API: 403 User account is inactive
            API-->>FE: 403
        else Credenciales válidas
            SVC->>SVC: bcrypt.compare(password)
            SVC->>SVC: signAccessToken + issueRefreshToken
            SVC->>DB: INSERT RefreshToken (hash SHA-256)
            SVC-->>API: user + accessToken + cookie httpOnly
            API-->>FE: 200 {user, tokens}
        end
    end
    FE-->>Usuario: Redirige a /dashboard
```

### 4.2 Envío público de iniciativa + triage automático con IA

```mermaid
sequenceDiagram
    actor Remitente
    participant FE as Frontend (/submit)
    participant API as Backend (public.routes)
    participant SVC as public-initiative.service
    participant Cloud as Cloudinary
    participant DB as PostgreSQL
    participant Triage as triage.service
    participant Claude as Anthropic Claude
    participant Mail as SMTP

    Remitente->>FE: Completa formulario (12 preguntas) + adjunta evidencias
    FE->>API: POST /api/public/initiatives (multipart)
    API->>API: Rate limit por IP / hora
    API->>SVC: submitPublicInitiative(body, files)
    SVC->>DB: createInitiative(status = REGISTERED)
    loop por cada archivo adjunto
        SVC->>Cloud: uploadAttachmentBuffer
        SVC->>DB: createAttachment
    end
    SVC->>Triage: runTriage(initiative.id)
    Triage->>DB: Carga clasificaciones y mesas activas
    Triage->>Claude: Prompt de clasificación con catálogo + contexto
    Claude-->>Triage: {clasificable, classificationId, workTableId, confidence}
    alt No clasificable, confianza < 0.4, o catálogo inválido
        Triage->>DB: status = UNDER_REVIEW
    else Clasificado con confianza suficiente
        Triage->>DB: status = TRIAGED_LAB | TRIAGED_EXTERNAL
        opt Fuera del alcance del Lab
            Triage->>Mail: notifyWorkTable (best-effort, nunca falla)
        end
    end
    Triage-->>SVC: TriageResult
    SVC-->>API: iniciativa + resultado de triage (o null si el triage falló)
    API-->>FE: 201 {status, triage}
    FE-->>Remitente: Muestra el resultado de la clasificación
```

### 4.3 Generar evaluación desde la conversación (pipeline de IA)

```mermaid
sequenceDiagram
    actor Evaluador
    participant FE as Frontend (chat)
    participant API as Backend (conversation.routes)
    participant SVC as evaluation.service
    participant Pipe as evaluation-pipeline.service
    participant Claude as Anthropic Claude
    participant Persist as evaluation-persistence.service
    participant DB as PostgreSQL

    Evaluador->>FE: Clic en "Generar evaluación"
    FE->>API: POST /api/conversations/:id/generate
    API->>SVC: generateEvaluationFromConversation(id)
    alt Evaluación ya completada
        SVC-->>API: 200 resultado existente (inmutable)
    else Evaluación en progreso
        SVC->>Pipe: runEvaluationPipeline(transcript)
        par Scoring por cada criterio activo
            Pipe->>Claude: Prompt de scoring (criterio aislado)
            Claude-->>Pipe: {score, justification}
        end
        Pipe->>Claude: Prompt de clasificación
        Claude-->>Pipe: classificationId
        Pipe->>Claude: Prompt de mesa de trabajo
        Claude-->>Pipe: workTableId
        Pipe->>Claude: Prompt de prioridad
        Claude-->>Pipe: priority
        Pipe->>Claude: Prompt de business case
        Claude-->>Pipe: businessCase
        Pipe->>Persist: persistEvaluationResult(scores, priority, businessCase)
        Persist->>Persist: computeWeightedFit(scores, pesos)
        Persist->>DB: UPDATE Evaluation (status=COMPLETED, snapshots inmutables)
        Persist->>DB: UPDATE Conversation (status=COMPLETED)
        Persist->>DB: UPDATE Initiative (status=EVALUATED)
        Persist-->>SVC: resultado completo
    end
    SVC-->>API: {evaluation, reply}
    API-->>FE: 200
    FE-->>Evaluador: Muestra el resultado de la evaluación
```
