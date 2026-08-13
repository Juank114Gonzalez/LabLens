# Requisitos No Funcionales — LabLens

**Fecha:** 2026-08-13
**Método:** cada RNF de este documento se infiere de una decisión técnica verificable en el código (no de negocio). Se documentan también, sin adornos, las **limitaciones actuales** — RNF que hoy no se cumplen o se cumplen solo parcialmente — como insumo directo para el diseño TO-BE.

---

## 1. Rendimiento

### Cumplido hoy
- **RNF-01:** El sistema debe mantener en caché de memoria el contenido de la base de conocimiento del Laboratorio, evitando releer los archivos en disco en cada consulta del agente de IA (`backend/src/services/knowledge.service.ts`).
- **RNF-02:** El sistema debe calcular en paralelo la puntuación de cada criterio de evaluación durante el pipeline de evaluación, en lugar de secuencialmente (`Promise.all` en `evaluation-pipeline.service.ts`).
- **RNF-03:** El sistema debe limitar el tamaño de las solicitudes JSON a 1MB y el de cada archivo adjunto a 15MB (máximo 10 archivos por envío), para evitar solicitudes desproporcionadas.

### Limitaciones actuales
- **No hay caché de consultas a base de datos** en ningún punto — cada listado (catálogos, iniciativas, evaluaciones, usuarios) golpea Postgres directamente en cada request.
- **Ningún endpoint de listado implementa paginación** (`GET /api/users`, `GET /api/initiatives`, `GET /api/evaluations`, `GET /api/conversations`, catálogos): se verificó explícitamente ausencia de `skip`/`take`/`cursor` en todos los repositorios — cargan el conjunto completo de filas en cada llamada. El rendimiento se degradará a medida que crezcan los datos.
- El **barrido masivo de triage** (`triage-sweep`) procesa las iniciativas **secuencialmente por diseño** (para no saturar el rate limit del proveedor de IA), lo que limita su throughput deliberadamente — aceptable hoy por volumen bajo, pero no escala a lotes grandes.
- La descarga de adjuntos en ZIP descarga cada archivo de Cloudinary uno por uno dentro de la misma request, sin paralelismo.

---

## 2. Seguridad

### Cumplido hoy
- **RNF-04:** El sistema debe almacenar las contraseñas con hash `bcrypt`, nunca en texto plano.
- **RNF-05:** El sistema debe usar JSON Web Tokens de acceso de corta duración junto con tokens de renovación rotativos y revocables, almacenando el token de renovación **hasheado con SHA-256** en base de datos (nunca en claro).
- **RNF-06:** El sistema debe entregar el token de renovación únicamente mediante una cookie `httpOnly`, con el atributo `secure` activado condicionalmente según el entorno.
- **RNF-07:** El sistema debe restringir el origen de las peticiones (CORS) a una lista dinámica de orígenes permitidos, nunca a `*`.
- **RNF-08:** El sistema debe validar con esquemas Zod la entrada de todos los endpoints, rechazando datos malformados antes de ejecutar lógica de negocio.
- **RNF-09:** El sistema debe autorizar cada operación sensible según el rol del usuario autenticado (`EVALUATOR`/`ADMIN`), mediante middleware centralizado.
- **RNF-10:** El sistema debe restringir el inicio de sesión (con credenciales o SSO) a cuentas de correo del dominio corporativo `@achcolombia.com.co`.
- **RNF-11:** El sistema debe limitar la tasa de envíos del formulario público por dirección IP, para mitigar abuso automatizado.

### Limitaciones actuales
- **No se declaran cabeceras de seguridad HTTP** (sin `helmet`, sin Content-Security-Policy, sin HSTS) — se verificó explícitamente su ausencia en el código del backend.
- **`POST /api/auth/login` no tiene límite de intentos** — solo el envío público tiene rate limiting; el login queda expuesto a ataques de fuerza bruta más allá de la restricción de dominio de correo.
- **Sin protección CSRF explícita** más allá de la política de cookies (`sameSite`); no se implementa un token anti-CSRF dedicado.
- **Los secretos se gestionan como variables de entorno planas** (`.env`), sin un gestor de secretos (vault) ni política de rotación.
- **El reseteo de contraseña es un placeholder sin efecto real** — no existe hoy una vía funcional de autorecuperación de cuenta; un usuario que olvida su contraseña depende de que un administrador la cambie manualmente.
- **No hay registro de auditoría** de inicios de sesión, cambios de rol o acciones administrativas — solo `console.log/error` no estructurado.
- **HTTPS no se fuerza en el código de la aplicación** — depende por completo de que la plataforma de hosting (Render/Vercel) termine TLS; no hay redirección explícita de HTTP a HTTPS a nivel de aplicación.

---

## 3. Escalabilidad

### Cumplido hoy
- **RNF-12:** El sistema debe autenticar las peticiones mediante un token de acceso autocontenido (JWT) sin sesión en memoria del servidor, permitiendo que cualquier instancia del backend valide una petición sin estado compartido.
- **RNF-13:** El sistema debe persistir los datos en una base de datos PostgreSQL gestionada de forma serverless (Neon), capaz de escalar su capacidad de forma independiente al backend.
- **RNF-14:** El sistema debe organizar el backend en capas desacopladas (rutas → controladores → servicios → repositorios), facilitando extraer dominios a servicios independientes en el futuro.

### Limitaciones actuales
- **Arquitectura monolítica**: backend y frontend son cada uno un único proceso desplegado, sin descomposición en microservicios ni módulos independientes.
- **Sin colas de trabajo asíncronas**: las llamadas al modelo de IA (triage, entrevista, generación de evaluación) ocurren **dentro del ciclo de vida de la petición HTTP**, bloqueando esa conexión hasta que el LLM responde — no hay procesamiento en segundo plano ni notificación posterior.
- **Sin contenedores ni orquestación** — no existe ningún `Dockerfile` ni configuración de Kubernetes/ECS en el repositorio; el despliegue depende de que Render/Vercel ejecuten el código Node/Next directamente.
- **Sin balanceo de carga ni múltiples instancias** declaradas — no hay configuración de réplicas, ni de sesión compartida entre instancias más allá de la base de datos.
- **El refresh token exige una consulta a base de datos en cada renovación de sesión** — es el único componente de autenticación con estado, y se convierte en un cuello de botella si el volumen de usuarios concurrentes crece mucho.

---

## 4. Disponibilidad

### Cumplido hoy
- **RNF-15:** El sistema debe expuner un endpoint de verificación de salud (`GET /api/health`) sin autenticación.
- **RNF-16:** El sistema debe manejar todos los errores no controlados mediante un middleware centralizado que traduce cualquier excepción a una respuesta HTTP consistente, sin exponer detalles internos en producción.
- **RNF-17:** El sistema debe garantizar que un fallo en la notificación por correo o en la limpieza de archivos en Cloudinary **nunca revierta ni bloquee** la operación de negocio principal que lo originó (diseño "best-effort" explícito en el código).

### Limitaciones actuales
- **Sin reintentos automáticos (retry/backoff)** ante fallos transitorios de servicios externos (Anthropic, Cloudinary, SMTP) — se verificó explícitamente su ausencia en el código; cualquier error de red o rate limit se propaga de inmediato como error HTTP al usuario, sin ningún intento de recuperación automática.
- **Sin *circuit breakers*** ni degradación controlada cuando un proveedor externo está caído — el sistema simplemente falla petición por petición.
- **Sin monitoreo ni alertas** — no hay integración con herramientas de observabilidad (no se encontró `winston`, `pino`, Sentry, Datadog, New Relic, ni similares); el único registro es `console.log/error` local, no estructurado ni exportado a ningún lado.
- **El health check no verifica dependencias** — confirma que el proceso Node responde, pero no si la base de datos, Anthropic o Cloudinary están disponibles.
- **Sin redundancia de instancias documentada** — no hay evidencia de despliegue multi-zona ni de alta disponibilidad más allá de lo que Render/Vercel ofrezcan por defecto en su plan.
- Al descargar el ZIP de evidencias, **si un archivo individual falla al descargarse de Cloudinary se omite silenciosamente** — degrada la disponibilidad de datos sin informar al usuario que el resultado está incompleto.

---

## 5. Usabilidad

### Cumplido hoy
- **RNF-18:** El sistema debe construir la interfaz con componentes de UI accesibles por defecto (Radix UI vía shadcn/ui), que gestionan foco, navegación por teclado y roles ARIA sin trabajo adicional del equipo — confirmado por la presencia de atributos `aria-`/`role=` en 26 archivos del frontend.
- **RNF-19:** El sistema debe adaptar su diseño con utilidades responsive de Tailwind CSS (mobile-first) en las pantallas principales.
- **RNF-20:** El sistema debe ofrecer modo oscuro y retroalimentación visual inmediata (toasts, indicadores de carga/escritura) durante operaciones asíncronas como el chat con el agente de IA.

### Limitaciones actuales
- **El uso de breakpoints responsive es limitado**: solo 63 ocurrencias de `sm:`/`md:`/`lg:` repartidas en 34 archivos de todo el frontend — no está verificado que cada pantalla (en particular las tablas de administración y el dashboard) esté realmente optimizada para pantallas pequeñas.
- **Sin pruebas de accesibilidad automatizadas** (no hay `axe`, Lighthouse CI, ni auditoría documentada) — la accesibilidad depende enteramente de lo que Radix UI ofrece por defecto, sin verificación propia del proyecto.
- **Sin internacionalización**: todo el texto de la interfaz está escrito directamente en español dentro de los componentes, sin capa de traducción — el sistema no podría operar en otro idioma sin reescribir código.
- **El middleware de autenticación del frontend (`frontend/src/middleware.ts`) es un placeholder explícito** — no valida la sesión del lado del servidor todavía (hay un `TODO` propio en el código); la protección de rutas depende hoy solo de un guard en el cliente, lo que es una limitación tanto de seguridad como de experiencia (un usuario sin sesión podría ver un parpadeo de contenido protegido antes de ser redirigido).

---

## 6. Mantenibilidad

### Cumplido hoy
- **RNF-21:** El sistema debe estar escrito en TypeScript con modo estricto habilitado, tanto en frontend como en backend.
- **RNF-22:** El sistema debe aplicar reglas de lint (ESLint 9) y formato (Prettier) de forma consistente en ambos proyectos.
- **RNF-23:** El sistema debe organizar el backend en una arquitectura en capas consistente (rutas → controladores → servicios → repositorios) en todos los dominios.
- **RNF-24:** El sistema debe centralizar la validación de datos en esquemas Zod reutilizables, en lugar de validaciones dispersas.
- **RNF-25:** El sistema debe mantener documentación de arquitectura y puesta en marcha en archivos README y en la carpeta `docs/`.

### Limitaciones actuales
- **Cero pruebas automatizadas en todo el repositorio**: no existe ningún archivo `*.test.*`/`*.spec.*`, ningún framework de testing instalado (Jest, Vitest, Playwright, Testing Library) y ningún script `test` en `frontend/package.json` ni `backend/package.json` — se verificó explícitamente. Cualquier cambio depende enteramente de pruebas manuales.
- **Código muerto detectado**: herramientas de IA definidas pero no registradas en ningún modo activo (`calculate-fit`, `generate-business-case`, `generate-executive-summary`, `get-catalogs`, `save-evaluation`), y una heurística de cálculo de Fit (`fit.service.ts`) que no interviene en el resultado real que ve el usuario.
- **Inconsistencias de manejo de errores** ya documentadas en `docs/casos-de-uso.md`: el mismo tipo de fallo (respuesta del LLM que no cumple el esquema esperado) produce distinto código HTTP según el punto exacto del pipeline donde ocurre (`400` en unos casos, `502` en otros) — dificulta razonar sobre el comportamiento del sistema ante fallos.
- **Sin integración continua (CI/CD)**: no existe carpeta `.github/workflows` ni ninguna otra configuración de pipeline — no se ejecuta lint, build ni test automáticamente en cada cambio; el único control de calidad ocurre en la máquina de quien desarrolla.

---

## 7. Resumen de limitaciones para el TO-BE

| Categoría | Brecha principal | Riesgo si no se atiende |
|---|---|---|
| Rendimiento | Sin paginación en ningún listado | Degradación de tiempos de respuesta a medida que crecen iniciativas/usuarios/evaluaciones |
| Seguridad | Sin cabeceras de seguridad HTTP, sin rate limit en login, reset de contraseña no funcional | Superficie de ataque innecesaria; usuarios bloqueados sin vía de recuperación |
| Escalabilidad | Llamadas al LLM bloquean la petición HTTP; sin colas asíncronas | Tiempos de respuesta largos y frágiles ante picos de uso; no escala horizontalmente sin rediseño |
| Disponibilidad | Sin reintentos ante fallos transitorios; sin monitoreo/alertas | Cualquier hiccup de un proveedor externo se traduce directo en error visible al usuario, sin visibilidad operativa |
| Usabilidad | Middleware de auth del frontend es placeholder; accesibilidad no auditada | Riesgo de exposición momentánea de contenido protegido; accesibilidad real desconocida |
| Mantenibilidad | Cero pruebas automatizadas; sin CI/CD | Cualquier cambio puede romper funcionalidad existente sin que nadie lo detecte antes de producción |

Estas seis brechas son las de mayor impacto para priorizar en el diseño TO-BE, por afectar directamente la confiabilidad, seguridad o capacidad de evolución del sistema a mediano plazo.
