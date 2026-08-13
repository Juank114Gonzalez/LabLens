# Casos de uso — LabLens

**Fecha:** 2026-08-13
**Alcance:** cada caso de uso documentado corresponde a un endpoint real del backend (`backend/src/`), verificado leyendo controladores, servicios, validadores y repositorios completos — no solo firmas. Se cita archivo:línea donde es relevante. Cuando algo no está determinado en el código, se declara explícitamente en vez de asumirlo.

Roles del sistema: `EVALUATOR` y `ADMIN` (enum `Role`, Prisma). "Público" significa sin autenticación.

---

# Sección 1 — Identidad y administración

## 1.1 Iniciar sesión con credenciales

**Endpoint:** `POST /api/auth/login`
**Actores:** público.

**Flujo principal**
1. Valida `email` (formato válido, ≤255) y `password` (no vacío, ≤128) — `backend/src/validators/auth.validator.ts:3-6`.
2. Normaliza el email a minúsculas y exige dominio `@achcolombia.com.co` — `auth.service.ts:54-57`.
3. Busca el usuario por email; compara password con `bcrypt.compare`.
4. Si es válido: firma un access token JWT (`type:'access'`) y emite un refresh token (JWT con `jti` random, hasheado con SHA-256 y persistido en `RefreshToken`), seteando la cookie httpOnly `lablens_refresh` (`path:/api/auth`).
5. Responde con `{user, tokens:{accessToken, expiresAt}}`.

**Flujos alternativos / excepciones**
- Dominio de correo no permitido → `403`.
- Usuario no existe o password incorrecta → `401` "Invalid credentials" (mismo mensaje en ambos casos — no revela si el email existe).
- Cuenta inactiva (`isActive:false`) → `403` "User account is inactive".
- Body inválido → `400` (Zod).

**Precondiciones:** ninguna sesión previa requerida.
**Postcondiciones:** nueva fila en `RefreshToken`; cookie de refresh seteada; access token devuelto en el body.

---

## 1.2 Iniciar sesión con Microsoft (SSO)

**Endpoint:** `POST /api/auth/microsoft`
**Actores:** público (ya en posesión de un access token de Microsoft, obtenido por el frontend vía MSAL).

**Flujo principal**
1. Recibe `accessToken` de Microsoft y llama a `GET https://graph.microsoft.com/v1.0/me` para obtener el perfil.
2. Extrae el email (`mail` o `userPrincipalName`), lo normaliza y exige dominio `@achcolombia.com.co`.
3. Busca el usuario por email — **no lo crea si no existe**.
4. Si existe y está activo: misma creación de sesión que el login normal (access + refresh token + cookie).

**Flujos alternativos / excepciones**
- Token de Microsoft inválido/expirado o falla la llamada a Graph → `401`.
- Perfil sin email → `400`.
- Dominio no permitido → `403`.
- Usuario no registrado en el sistema → `401` "El usuario no está registrado en el sistema" (el login con Microsoft **nunca da de alta cuentas nuevas**; deben crearse antes vía `/api/users`).
- Cuenta inactiva → `403`.

**Precondiciones:** el usuario debe existir previamente en la tabla `User`, creado por un administrador.
**Postcondiciones:** igual que el login normal.

---

## 1.3 Cerrar sesión

**Endpoint:** `POST /api/auth/logout`
**Actores:** público (no exige autenticación; opera sobre la cookie de refresh si existe).

**Flujo principal**
1. Lee la cookie `lablens_refresh`.
2. Si existe, revoca ese refresh token en BD (`revokedAt`).
3. Borra la cookie.
4. Responde `{ok:true}`.

**Flujos alternativos / excepciones:** si no hay cookie, no ocurre ningún error — el endpoint nunca falla por falta de sesión.

**Precondiciones:** ninguna.
**Postcondiciones:** si existía un refresh token válido, queda revocado; cookie eliminada en el cliente.

---

## 1.4 Renovar sesión

**Endpoint:** `POST /api/auth/refresh`
**Actores:** público (autenticado por la cookie de refresh, no por header).

**Flujo principal**
1. Lee la cookie de refresh; si no existe → `401`.
2. Verifica firma/expiración del JWT de refresh y que `type==='refresh'`.
3. Busca la fila correspondiente en `RefreshToken` (debe estar no revocada, no expirada, y pertenecer al mismo usuario del JWT).
4. **Rota** el token: revoca el actual y emite uno nuevo.
5. Busca el usuario; si fue eliminado tras emitir el token → `401` (y limpia la cookie).
6. Responde `{accessToken, expiresAt}`.

**Flujos alternativos / excepciones**
- Sin cookie, JWT inválido/expirado, token revocado/desconocido o de otro usuario → `401` en todos los casos.
- Usuario borrado → `401` + limpieza de cookie.

**Precondiciones:** cookie de refresh válida y no revocada.
**Postcondiciones:** token de refresh anterior revocado; uno nuevo creado; cookie reemplazada.

---

## 1.5 Obtener perfil actual

**Endpoint:** `GET /api/auth/me`
**Actores:** cualquier usuario autenticado (EVALUATOR o ADMIN).

**Flujo principal:** valida el access token del header `Authorization: Bearer`, busca el usuario por id y devuelve su perfil público.

**Flujos alternativos / excepciones:** sin token o token inválido/expirado → `401`; usuario borrado tras emitir el token → `404`.

**Precondiciones:** access token válido vigente.
**Postcondiciones:** ninguna (solo lectura).

---

## 1.6 Administrar usuarios (patrón CRUD + reglas de negocio)

**Endpoints:** todos bajo `/api/users`, protegidos por `authenticate + authorize(ADMIN)` a nivel de router — **solo ADMIN** puede acceder a cualquiera de estos.

| Caso de uso | Endpoint | Detalle |
|---|---|---|
| Listar usuarios | `GET /api/users` | Sin filtros ni paginación; nunca expone `passwordHash`. |
| Crear usuario | `POST /api/users` | Exige dominio `@achcolombia.com.co`; email único (`409` si ya existe); password hasheado con bcrypt; rol default `EVALUATOR`. |
| Obtener usuario | `GET /api/users/:id` | `404` si no existe. |
| Cambiar rol | `PATCH /api/users/:id/role` | **Regla:** un admin no puede autodegradarse (`400` si `id===actorId` y el nuevo rol no es ADMIN). |
| Actualizar usuario | `PATCH /api/users/:id` | Campos opcionales. Si cambia el email: valida dominio y unicidad. Si se autoedita el rol a no-ADMIN → `400`. **Regla:** no puede autodesactivarse (`isActive:false` sobre sí mismo → `400`). |
| Resetear contraseña | `POST /api/users/:id/reset-password` | **Es un placeholder**: valida que el usuario exista pero no modifica nada en BD ni envía correos — devuelve un mensaje indicando que está "pendiente de integración". |
| Eliminar usuario | `DELETE /api/users/:id` | **Regla:** no puede eliminarse a sí mismo (`400`, verificado antes de buscar el usuario). Hard delete; el efecto en cascada sobre sus iniciativas/evaluaciones/refresh tokens depende de las reglas `onDelete` del esquema Prisma. |

**Flujos alternativos / excepciones comunes:** recurso no encontrado → `404`; rol distinto de ADMIN → `403`; body inválido → `400` (Zod); email duplicado → `409`.

**Precondiciones:** sesión ADMIN vigente.
**Postcondiciones:** mutación reflejada de inmediato en `User` (sin transacciones explícitas; cada operación es atómica por sí sola).

---

## 1.7 Gestionar catálogos: clasificaciones inteligentes y mesas de trabajo (patrón CRUD)

**Endpoints:** `/api/intelligent-classifications` y `/api/work-tables`, mismo patrón en ambos.

| Operación | Rol | Detalle |
|---|---|---|
| Listar (`GET /`) | Cualquier autenticado | Ordenado por `nombre asc`. |
| Obtener (`GET /:id`) | Cualquier autenticado | `404` si no existe. |
| Crear (`POST /`) | ADMIN | Valida `nombre` (único), `descripcion`, `promptContext` no vacíos; `activo` default `true`. |
| Actualizar (`PATCH /:id`) | ADMIN | Verifica existencia antes de mutar (para dar `404` explícito). |
| Eliminar (`DELETE /:id`) | ADMIN | Verifica existencia; hard delete. |

**Nota específica de mesas de trabajo:** el campo `notificationEmail` (correo al que se notifica cuando el triage enruta una iniciativa a esa mesa) es visible en las relaciones consultadas por el motor de triage, aunque no se determinó en el código revisado si se gestiona explícitamente a través de este mismo CRUD o solo vía seed inicial.

**Flujos alternativos / excepciones:** recurso no encontrado → `404`; rol insuficiente en escritura → `403`; datos inválidos → `400`.

---

## 1.8 Gestionar criterios de evaluación (con reglas especiales)

**Endpoints:** `/api/evaluation-criteria`. Lectura: cualquier autenticado. Escritura: ADMIN.

### Crear / Actualizar / Eliminar criterio
**Regla de negocio central: la suma de los pesos (`peso`) de todos los criterios *activos* debe ser exactamente 100% (tolerancia `1e-6`)**, verificada en cada mutación:
- **Crear:** suma los pesos activos existentes + el nuevo (si es activo); si no da 100% → `400` con el total actual.
- **Actualizar:** recalcula la suma sustituyendo el estado anterior del criterio por el nuevo.
- **Eliminar:** si el criterio a borrar está activo, valida que el resto siga sumando 100% sin él — **no se puede borrar un criterio activo si rompe la suma**.

Cada mutación exitosa dispara `ensureCurrentCriteriaVersion`: calcula un hash SHA-256 de todos los criterios activos (id, nombre, descripción, promptContext, peso, orden); si esa combinación exacta nunca existió, crea una nueva fila en `CriteriaVersion` con número incremental (idempotente si ya existe).

### Reordenar (`PUT /api/evaluation-criteria/reorder`)
El cliente envía el estado completo propuesto de todos los criterios afectados (`{id, orden, peso, activo}`); se valida que los marcados `activo:true` sumen 100%, y se aplica en una **transacción atómica** (todo o nada).

### Listar versiones (`GET /api/evaluation-criteria/versions`)
Solo lectura; devuelve cada `CriteriaVersion` con su snapshot congelado y el conteo de evaluaciones que la usaron — permite auditar con qué configuración exacta se evaluó cada iniciativa, incluso si los criterios cambiaron después.

**Flujos alternativos / excepciones**
- Pesos activos que no sumen 100% en creación/edición/reorder/eliminación → `400` con el total actual.
- Sin criterios activos (todos desactivados) → `ensureCurrentCriteriaVersion` retorna `null` sin error (estado transitorio permitido).
- Colisión de índice único al crear versión (concurrencia) → reintenta una vez; si persiste, error genérico `500`.

**Precondiciones:** ADMIN para mutar.
**Postcondiciones:** catálogo de criterios actualizado; nueva `CriteriaVersion` si el conjunto de criterios activos cambió.

---

## 1.9 Gestionar contactos de empresa

**Endpoints:** `/api/company-contacts`. Requiere autenticación; mutaciones requieren rol EVALUATOR o ADMIN.

**Flujo principal**
- **Listar** (`GET /?initiativeId=`): valida que `initiativeId` sea UUID; verifica acceso a esa iniciativa (propietario o rol EVALUATOR/ADMIN); lista sus contactos.
- **Crear** (`POST /`): requiere `initiativeId` + datos del contacto (empresa, contacto, cargo, correo, teléfono); valida acceso a la iniciativa antes de crear.
- **Actualizar/Eliminar** (`PATCH`/`DELETE /:id`): busca el contacto, valida acceso a **su** iniciativa, luego muta.

**Flujos alternativos / excepciones**
- `initiativeId` faltante o no-UUID → `400`.
- Iniciativa inexistente o no accesible por el actor → `404` (**no `403`** — oculta deliberadamente la existencia de iniciativas ajenas).
- Contacto inexistente → `404`.
- Correo con formato inválido u otros datos inválidos → `400`.

**Precondiciones:** la iniciativa referenciada debe existir y ser accesible por el actor.
**Postcondiciones:** mutación reflejada de inmediato en `CompanyContact`.

---

# Sección 2 — Ciclo de vida de las iniciativas

### Máquina de estados real (`InitiativeStatus`)

```
DRAFT → REGISTERED → TRIAGED_LAB | TRIAGED_EXTERNAL | UNDER_REVIEW
```

- `DRAFT` es el único estado editable; cualquier intento de modificar/adjuntar/eliminar evidencias fuera de `DRAFT` es rechazado.
- No existen transiciones hacia atrás: una iniciativa ya triada "queda como registro"; para modificarla hay que copiarla (la copia siempre nace en `DRAFT`).
- Los estados `EVALUATED`, `APPROVED`, `REJECTED`, `ARCHIVED` pertenecen al pipeline de evaluación (Sección 3), no al triage.

---

## 2.1 Enviar iniciativa pública (formulario de 12 preguntas)

**Endpoint:** `POST /api/public/initiatives`
**Actores:** público sin autenticación.

**Flujo principal**
1. Rate limit por IP (ventana de 1 hora, límite configurable — default 10).
2. Si la petición es `multipart/form-data`, procesa hasta 10 archivos / 15MB c/u con Multer (memoria); si es JSON puro, se omite ese paso.
3. Valida los 12 campos del formulario (Zod); exige al menos un `companyContacts` si `tieneInteresado=true`.
4. Crea la iniciativa directamente con `status: REGISTERED` (nunca pasa por `DRAFT`), `userId: null`.
5. Sube cada adjunto a Cloudinary y crea su fila `Attachment` (secuencial, uno por uno).
6. Dispara el **triage automático** (ver 2.11) dentro de un `try/catch`: si falla, se loguea y la iniciativa queda `REGISTERED` sin bloquear la respuesta.
7. Responde `201` con el estado final (clasificado o `REGISTERED` si el triage falló) y el resultado del triage (o `null`).

**Flujos alternativos / excepciones**
- Rate limit excedido → respuesta directa del middleware, sin pasar por el formato estándar de error.
- `payload` mal formado (multipart) → `400`.
- Validación Zod fallida (campos faltantes, selección vacía, email inválido, interesado sin contactos) → `400`.
- Archivo con MIME no permitido → `400` — **ocurre después de crear la iniciativa**: si el primer archivo es inválido, la iniciativa ya quedó creada sin adjuntos ni triage (no hay rollback).
- Archivo &gt;15MB o &gt;10 archivos → error de Multer; no hay middleware dedicado para traducirlo a un mensaje de negocio (no determinado exactamente qué status devuelve en este caso).
- Fallo de Cloudinary → `502`.
- Fallo del triage (LLM, catálogos vacíos, JSON inválido) → absorbido; no bloquea la respuesta.

**Precondiciones:** ninguna sesión; deben existir clasificaciones y mesas de trabajo activas para que el triage funcione (si no, la iniciativa queda `REGISTERED` sin clasificar).
**Postcondiciones:** iniciativa creada (`REGISTERED` como mínimo, clasificada si el triage tuvo éxito); adjuntos en `Attachment` + Cloudinary; posible notificación por correo (ver 2.14).

---

## 2.2 Listar iniciativas

**Endpoint:** `GET /api/initiatives`
**Actores:** cualquier autenticado. EVALUATOR/ADMIN ven todas; cualquier otro rol vería solo las propias (no aplica en la práctica, solo existen esos dos roles).

**Flujo principal:** valida filtros de query (`status`, `sourceType`, clasificación, mesa, rango de fechas, búsqueda de texto); lista ordenado por `updatedAt desc` con relaciones completas incluidas.

**Flujos alternativos / excepciones:** filtro inválido (UUID/fecha/enum mal formado) → `400`; sin autenticación → `401`.
**Precondiciones/Postcondiciones:** solo lectura.

---

## 2.3 Obtener una iniciativa por id

**Endpoint:** `GET /api/initiatives/:id`
**Actores:** cualquier autenticado, con alcance restringido si no es EVALUATOR/ADMIN.

**Flujo principal:** valida el id como UUID; busca la iniciativa; si no es dueño y no tiene rol con visión global → se le oculta.

**Flujos alternativos / excepciones:** id no UUID → `400`; no encontrada o sin acceso → `404` (mismo mensaje en ambos casos, deliberadamente).
**Precondiciones/Postcondiciones:** solo lectura.

---

## 2.4 Crear borrador de iniciativa (canal interno)

**Endpoint:** `POST /api/initiatives`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal:** todos los campos son opcionales (autoguardado incremental); crea con `status: DRAFT` forzado, `diligenciadoPor` default el nombre del usuario si no viene.

**Flujos alternativos / excepciones:** body inválido → `400`; rol insuficiente → `403`.
**Precondiciones:** rol EVALUATOR/ADMIN.
**Postcondiciones:** iniciativa nueva en `DRAFT`, editable, sin triage ni adjuntos.

---

## 2.5 Actualizar iniciativa (autoguardado de borrador)

**Endpoint:** `PATCH /api/initiatives/:id`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal:** solo permitido si la iniciativa está en `DRAFT`; el `status` que venga en el body **se ignora siempre** — se reafirma `DRAFT`; si vienen `companyContacts`, se reemplazan todos (borra e inserta en una operación).

**Flujos alternativos / excepciones:** iniciativa no `DRAFT` → `409` "Esta iniciativa ya fue clasificada y queda como registro. Sácale una copia para modificarla."; no encontrada/sin acceso → `404`; body inválido → `400`.

**Precondiciones:** iniciativa existente en `DRAFT`.
**Postcondiciones:** campos actualizados; `status` permanece `DRAFT`.

> **Observación de código:** el chequeo de acceso de este endpoint usa `role===ADMIN` estrictamente (no incluye EVALUATOR como "ve todo"), a diferencia de otros métodos del mismo servicio que sí usan un chequeo más amplio. El efecto práctico: un EVALUATOR que no es dueño puede *ver y listar* una iniciativa ajena, pero al intentar editarla recibe `404` en vez de un mensaje de permiso. No está documentado como intencional en el código.

---

## 2.6 Registrar iniciativa (`DRAFT` → `REGISTERED` + triage)

**Endpoint:** `POST /api/initiatives/:id/register`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal**
1. Exige que la iniciativa esté en `DRAFT`.
2. Mergea el body sobre los valores ya guardados y valida que **todos** los campos obligatorios del formulario interno estén completos, junto con al menos un contacto de empresa.
3. **Regla de negocio:** exige al menos un adjunto ya cargado (`400` "Debe adjuntar al menos una evidencia" si no hay ninguno).
4. Actualiza `status: REGISTERED`.
5. Dispara el triage automático (ver 2.11) en `try/catch` — un fallo no revierte el registro.
6. La respuesta HTTP refleja el estado intermedio `REGISTERED`, **no** el resultado final del triage (el frontend debe volver a consultar la iniciativa para ver si ya fue clasificada).

**Flujos alternativos / excepciones**
- Iniciativa no `DRAFT` → `409`.
- Faltan campos obligatorios o contactos → `400` (Zod, mensajes concatenados).
- Sin adjuntos → `400` "Debe adjuntar al menos una evidencia".
- Fallo del triage posterior → no se propaga; la iniciativa queda `REGISTERED`, recuperable vía `triage-sweep`.

**Precondiciones:** iniciativa en `DRAFT`, con al menos un adjunto y todos los campos obligatorios completos.
**Postcondiciones:** `status ≥ REGISTERED`; si el triage corre bien, pasa a `TRIAGED_LAB`/`TRIAGED_EXTERNAL`/`UNDER_REVIEW` (aunque la respuesta de este endpoint específico no lo refleje).

---

## 2.7 Eliminar iniciativa

**Endpoint:** `DELETE /api/initiatives/:id`
**Actores:** EVALUATOR (con restricciones) o ADMIN (sin restricciones).

**Flujo principal**
- Un **ADMIN** puede eliminar cualquier iniciativa en cualquier estado.
- Un **EVALUATOR** solo puede eliminar iniciativas **propias** y que estén en `DRAFT`.
- Hard delete (`prisma.initiative.delete`); no hay limpieza explícita de adjuntos en Cloudinary en este flujo — depende de las reglas de cascada del esquema.

**Flujos alternativos / excepciones**
- No encontrada, o no es tuya (si no ADMIN) → `404`.
- EVALUATOR intentando borrar algo que no es `DRAFT` → `409` "Solo se pueden eliminar borradores".

**Precondiciones:** ADMIN sin restricción; EVALUATOR debe ser dueño y estado `DRAFT`.
**Postcondiciones:** registro eliminado de `Initiative` (con el efecto de cascada de Prisma sobre adjuntos/contactos/evaluaciones asociados).

---

## 2.8 Copiar iniciativa

**Endpoint:** `POST /api/initiatives/:id/copy`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal**
1. Verifica acceso a la iniciativa original.
2. Crea una nueva iniciativa: descarta triage, fechas y estado previos; nace en `DRAFT`; `nombre` = `"{original} (copia)"`; `userId` = quien copió (no el dueño original); guarda `copiedFromId` para mantener el linaje.
3. Recrea los contactos de empresa.
4. **Los adjuntos reutilizan el mismo archivo de Cloudinary** (mismo `publicId`/`secureUrl`) — no se vuelve a subir el archivo físico, solo se crea una nueva fila `Attachment` que apunta al mismo asset remoto.

**Flujos alternativos / excepciones:** original no encontrado → `404`; rol no autorizado → `403`.
**Precondiciones:** iniciativa original existente y accesible.
**Postcondiciones:** nueva iniciativa en `DRAFT`, sin triage, con adjuntos "compartidos" a nivel de archivo remoto pero con filas `Attachment` independientes (relevante para el caso 2.18).

---

## 2.9 Re-triage puntual de una iniciativa

**Endpoint:** `POST /api/initiatives/:id/triage`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal:** exige que la iniciativa no esté en `DRAFT`; ejecuta el motor de triage (2.11) **sin absorber sus errores** — a diferencia del triage automático en envío/registro, aquí un fallo del LLM se propaga como error HTTP al cliente.

**Flujos alternativos / excepciones:** iniciativa en `DRAFT` → `409` "Registra la iniciativa antes de clasificarla"; fallo del motor de triage → se propaga tal cual (`502` típicamente).
**Precondiciones:** iniciativa en cualquier estado salvo `DRAFT`.
**Postcondiciones:** sobrescribe la clasificación/mesa/estado de triage previos.

---

## 2.10 Barrido masivo de triage

**Endpoint:** `POST /api/initiatives/triage-sweep`
**Actores:** solo ADMIN.

**Flujo principal**
1. Body: `{alcance: 'pendientes'|'todas'}` (default `'pendientes'`).
2. `'pendientes'` excluye `DRAFT` y filtra las que nunca fueron triadas (`triagedAt: null`); `'todas'` reclasifica todo el histórico ya triado (destructivo — sobrescribe dictámenes ya comunicados).
3. Procesa **secuencialmente** (no en paralelo, deliberado para no agotar el rate limit del LLM); cada iniciativa en su propio `try/catch` — un fallo individual no aborta el resto.
4. Responde `{alcance, total, triadas, fallidas}`.

**Flujos alternativos / excepciones:** rol distinto de ADMIN → `403`; fallos individuales → contabilizados en `fallidas`, sin abortar el barrido.
**Precondiciones:** actor ADMIN.
**Postcondiciones:** cada iniciativa procesada cambia de estado según el motor de triage; las fallidas quedan sin cambios.

---

## 2.11 Motor de triage con IA (lógica común a 2.1, 2.6, 2.9, 2.10)

**Flujo principal**
1. Carga la iniciativa y los catálogos activos de clasificaciones y mesas de trabajo (si falta alguno → `409`).
2. Construye un prompt con el catálogo disponible y el contexto de la iniciativa (serializado sin `id`/`status`, para no confundir al modelo).
3. Llama a Claude pidiendo una decisión estructurada: si la iniciativa es "clasificable" o no, y si sí, exactamente una clasificación + una mesa de trabajo + nivel de confianza (0–1).
4. Parsea y valida la respuesta JSON contra un esquema estricto.
5. **Decisión de enrutamiento**, en este orden:
   - Si el modelo dice que **no es clasificable** (texto sin sentido, pruebas, contenido del que no se puede inferir problema/solución) → `UNDER_REVIEW` (revisión manual).
   - Si el modelo devuelve un id de clasificación/mesa que **no existe** en el catálogo activo → `UNDER_REVIEW` (diseño deliberado: antes esto rompía con error, ahora se conserva para revisión humana en vez de perder el envío).
   - Si la **confianza es menor a 0.4** → `UNDER_REVIEW`.
   - En cualquier otro caso → clasificación aplicada: `TRIAGED_LAB` si la clasificación es "Innovación disruptiva/adyacente", `TRIAGED_EXTERNAL` en cualquier otro caso.
6. Si el resultado es `TRIAGED_EXTERNAL`, dispara la notificación por correo (2.14, best-effort). Si es `TRIAGED_LAB`, no se notifica a nadie (queda en la bandeja del Lab). Si es `UNDER_REVIEW`, tampoco se notifica.

**Flujos alternativos / excepciones (tabla consolidada)**

| Causa | Efecto |
|---|---|
| Iniciativa no existe | `404` |
| Sin clasificaciones/mesas activas | `409` |
| Llamada a Claude falla (red, rate limit, error de API) | `502` |
| El modelo "rechaza" procesar la solicitud (`stop_reason: refusal`) | `502` |
| Respuesta vacía del modelo | `502` |
| JSON de respuesta no parseable | `502` "formato inválido" |
| JSON no cumple el esquema esperado | Error de validación sin envolver — se propaga como `400` en el re-triage puntual (inconsistencia respecto a los demás casos de fallo del LLM, que dan `502`) |
| Modelo dice "no clasificable" | Resuelto internamente → `UNDER_REVIEW`, sin excepción |
| Modelo devuelve id de catálogo inválido | Resuelto internamente → `UNDER_REVIEW`, sin excepción |
| Confianza &lt; 0.4 | Resuelto internamente → `UNDER_REVIEW`, sin excepción |
| Falla el envío de correo (SMTP) | Absorbido — el triage ya se aplicó; solo queda `notificationSent:false` |

En los casos donde el motor de triage sí lanza una excepción (no las resueltas a `UNDER_REVIEW`), quien lo invoca decide si la absorbe (envío público, registro, barrido) o la propaga (re-triage puntual).

**Precondiciones:** iniciativa existente; al menos una clasificación y una mesa de trabajo activas; `ANTHROPIC_API_KEY` configurada.
**Postcondiciones:** `triagedAt` siempre se actualiza (éxito o revisión manual); `status` nunca revierte a `REGISTERED`; `notificationSentAt` se marca solo si el correo se envió con éxito.

---

## 2.12 Estadísticas de iniciativas

**Endpoint:** `GET /api/initiatives/stats`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal:** calcula en paralelo conteos totales, comparativa de 30 días vs. ventana anterior, agrupaciones por estado/origen/clasificación/área, y un timeline diario de 30 días clasificando cada iniciativa reciente en Lab / externa / pendiente.

**Flujos alternativos / excepciones:** rol no autorizado → `403`.
**Precondiciones/Postcondiciones:** solo lectura.

---

## 2.13 Listar evaluaciones de una iniciativa

**Endpoint:** `GET /api/initiatives/:id/evaluations`
**Actores:** cualquier autenticado con acceso a la iniciativa.

**Flujo principal:** reutiliza el mismo chequeo de acceso que "obtener iniciativa" (2.3) y devuelve solo su arreglo de evaluaciones.

**Flujos alternativos / excepciones:** iniciativa no encontrada/sin acceso → `404`.

---

## 2.14 Notificación por correo a la mesa de trabajo

**Disparada por:** el motor de triage (2.11), únicamente cuando el resultado es `TRIAGED_EXTERNAL`.

**Flujo principal**
1. Si la mesa de trabajo no tiene `notificationEmail` configurado → se omite (sin error).
2. Si no hay `SMTP_HOST` configurado → se omite (sin error, solo advertencia en logs).
3. Si hay transporte configurado, construye el cuerpo del correo (datos de la iniciativa, clasificación, confianza, enlace directo) y lo envía.
4. **Diseño explícito: nunca lanza una excepción** — un fallo de notificación no debe revertir un triage ya aplicado.

**Flujos alternativos / excepciones:** cualquier fallo (SMTP no configurado, error de envío) se traduce en `notificationSent:false`, sin afectar el estado de la iniciativa ni la respuesta HTTP de la operación que lo disparó.

**Precondiciones:** `notificationEmail` de la mesa configurado; `SMTP_HOST` configurado.
**Postcondiciones:** correo entregado al servidor SMTP (no se confirma entrega final al destinatario); `notificationSentAt` solo si el envío fue exitoso.

---

## 2.15 Listar adjuntos de una iniciativa

**Endpoint:** `GET /api/attachments?initiativeId=...`
**Actores:** cualquier autenticado con acceso a la iniciativa.

**Flujo principal:** valida `initiativeId` como UUID; verifica acceso; lista ordenado por fecha de creación descendente.

**Flujos alternativos / excepciones:** `initiativeId` faltante/no-UUID → `400`; iniciativa sin acceso → `404`.

---

## 2.16 Descargar adjuntos como ZIP

**Endpoint:** `GET /api/attachments/download?initiativeId=...`
**Actores:** cualquier autenticado con acceso a la iniciativa.

**Flujo principal:** valida acceso; si no hay adjuntos → `404`; genera un ZIP en streaming descargando cada archivo desde Cloudinary y empaquetándolo con su nombre original.

**Flujos alternativos / excepciones**
- Sin adjuntos → `404` "No hay evidencias para descargar".
- Si un adjunto individual falla al descargarse de Cloudinary (URL caída, etc.) → **se omite silenciosamente del ZIP**, sin avisar al cliente que faltó un archivo; el ZIP se genera igual, potencialmente incompleto.

**Precondiciones:** iniciativa accesible, con al menos un adjunto registrado (el archivo real en Cloudinary podría no existir ya).
**Postcondiciones:** ninguna en BD; operación de solo lectura/streaming.

---

## 2.17 Subir un adjunto

**Endpoint:** `POST /api/attachments`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal:** exige que la iniciativa esté en `DRAFT`; valida el MIME permitido (PDF, DOCX, XLSX, PNG, JPEG); sube a Cloudinary; crea la fila `Attachment`.

**Flujos alternativos / excepciones**
- Sin archivo → `400` "file is required".
- MIME no permitido → `400`.
- Archivo &gt;15MB → error de Multer (sin manejo de negocio dedicado observado).
- Iniciativa no en `DRAFT` → `409` "Solo se pueden adjuntar evidencias en borrador".
- Fallo de Cloudinary → `502`.

**Precondiciones:** iniciativa en `DRAFT`, accesible por el actor.
**Postcondiciones:** fila `Attachment` creada; asset subido a Cloudinary.

---

## 2.18 Eliminar un adjunto

**Endpoint:** `DELETE /api/attachments/:id`
**Actores:** EVALUATOR o ADMIN.

**Flujo principal**
1. Verifica que el adjunto exista y que su iniciativa sea accesible y esté en `DRAFT`.
2. **Cuenta cuántas filas `Attachment` comparten el mismo `publicId`** de Cloudinary (por el caso de copias, ver 2.8): solo destruye el archivo remoto si esta es la única referencia.
3. Intenta destruir el asset en Cloudinary (con un reintento de estrategia); si falla, el error se ignora silenciosamente ("best-effort").
4. **La fila en BD se elimina siempre**, sin importar si la limpieza en Cloudinary tuvo éxito.

**Flujos alternativos / excepciones**
- Adjunto no existe → `404`.
- Iniciativa no en `DRAFT` → `409` "Solo se pueden eliminar evidencias en borrador".
- Fallo al destruir en Cloudinary → no se propaga; puede dejar un asset huérfano en Cloudinary (aceptado como best-effort).

**Precondiciones:** iniciativa asociada en `DRAFT`.
**Postcondiciones:** fila `Attachment` eliminada siempre; asset de Cloudinary eliminado solo si no hay otras copias que lo referencien y la operación tuvo éxito.

---

### Observaciones abiertas de la Sección 2 (encontradas en el código, no inventadas)

1. Varios métodos de `initiative.service.ts` usan chequeos de acceso inconsistentes entre sí: algunos consideran "acceso total" solo a `ADMIN`, otros a `ADMIN` y `EVALUATOR` juntos. El efecto es que un EVALUATOR puede ver/listar una iniciativa ajena pero no editarla/registrarla/eliminarla (recibe `404` en vez de un mensaje de permiso claro).
2. No se encontró manejo dedicado para errores de Multer (`LIMIT_FILE_SIZE`, `LIMIT_FILE_COUNT`) — no está determinado con exactitud qué status HTTP devuelven hoy.
3. El borrado de una iniciativa no incluye limpieza explícita de sus adjuntos en Cloudinary en el propio flujo; depende de reglas de cascada de la base de datos.
4. Las transiciones a `EVALUATED`/`APPROVED`/`REJECTED`/`ARCHIVED` no ocurren en el código de triage/ciclo de vida — pertenecen al pipeline de evaluación (Sección 3).

---

# Sección 3 — Evaluación asistida por IA

## 3.1 Iniciar evaluación de una iniciativa

**Endpoint:** `POST /api/initiatives/:id/evaluations`
**Actores:** EVALUATOR o ADMIN. Claude actúa como sistema (no como actor humano).

**Flujo principal**
1. Body opcional `{mode: 'interview'|'direct'}`, default `'interview'`.
2. Si la iniciativa está `ARCHIVED` → `409` "No se pueden evaluar iniciativas archivadas".
3. Exige al menos un criterio de evaluación activo (si no → `409`).
4. En una transacción: crea `Evaluation` (`status: IN_PROGRESS`, `readinessStatus: INSUFFICIENT`, con snapshot de pesos/criterios) y su `Conversation` anidada (`status: COLLECTING_INFORMATION`); actualiza `Initiative.status = UNDER_REVIEW`.
5. **Modo `interview` (default):** lanza el agente conversacional con un mensaje de apertura que le instruye revisar la iniciativa/criterios/evaluaciones previas, no emitir juicios todavía, y hacer una sola pregunta.
6. **Modo `direct`:** ejecuta inmediatamente el pipeline de evaluación (3.4) sin transcript de entrevista, basándose solo en los datos de la iniciativa.

**Flujos alternativos / excepciones**
- Iniciativa no encontrada → `404`; `ARCHIVED` → `409`; sin criterios activos → `409`.
- Fallo de Claude en modo entrevista (rechazo, error de red, respuesta vacía) → error HTTP (típicamente `502`); **la evaluación y conversación ya quedaron creadas antes de invocar al agente**, por lo que un fallo aquí deja la evaluación en `IN_PROGRESS` sin mensaje de apertura.
- Rol no autorizado → `403`.

**Precondiciones:** iniciativa existente y no `ARCHIVED`; al menos un criterio activo.
**Postcondiciones:** `Initiative.status → UNDER_REVIEW`; `Evaluation` creada (`IN_PROGRESS`); `Conversation` creada (`COLLECTING_INFORMATION`). En modo `direct` exitoso, puede completarse de inmediato (ver 3.4).

> **Observación de código:** este endpoint pasa `isAdmin: true` siempre al validar el acceso a la iniciativa, lo que en la práctica permite a cualquier EVALUATOR iniciar una evaluación sobre cualquier iniciativa, no solo las propias — a diferencia de otros endpoints de evaluación que sí restringen por propiedad.

---

## 3.2 Listar y ver conversaciones

**Endpoints:** `GET /api/conversations`, `GET /api/conversations/:id`
**Actores:** EVALUATOR (solo las propias) o ADMIN (todas).

**Flujo principal (lista):** filtra por evaluador propietario salvo que el actor sea ADMIN; incluye un preview del último mensaje.

**Flujo principal (detalle):** si la conversación no tiene evaluación asociada, o el actor EVALUATOR no es su dueño → `404` (oculta existencia, no usa `403`). Si la evaluación está completada, incluye el resultado completo; calcula `canGenerate = status !== COMPLETED`.

**Flujos alternativos / excepciones:** conversación inexistente o ajena → `404` en ambos endpoints; rol no autorizado → `403`.
**Precondiciones/Postcondiciones:** solo lectura.

---

## 3.3 Enviar mensaje en Modo Entrevista (agente con tool-use)

**Endpoint:** `POST /api/conversations/:id/messages`
**Actores:** EVALUATOR/ADMIN como interlocutor; Claude como ejecutor de herramientas de solo consulta.

**Flujo principal**
1. Valida el mensaje (no vacío, ≤4000 caracteres).
2. Si la conversación no existe, no tiene evaluación, o el EVALUATOR no es dueño → `404`.
3. Si la evaluación ya está `COMPLETED` → `409` "La evaluación ya está cerrada" — no se permite seguir chateando.
4. Persiste el mensaje del usuario **antes** de invocar al agente.
5. Ejecuta el agente conversacional con el historial completo de la conversación, un prompt de sistema que le prohíbe emitir scores/clasificación/business case en este paso, y hasta 8 rondas de uso de herramientas.
6. Persiste la respuesta del asistente y devuelve el estado actualizado de disposición (`readiness`).

**Herramientas activas del agente (modo `interview`, único modo existente)**

| Herramienta | Qué hace | Notas de fallo |
|---|---|---|
| `searchKnowledge` | Devuelve el contenido de la base de conocimiento del Lab (archivos `.md` estáticos, con caché en memoria) — es un MVP, sin retrieval semántico real todavía | Si falta contenido o falla la lectura → error capturado y devuelto al modelo como `{error}`, sin romper la conversación |
| `searchSimilarInitiatives` / `findSimilarInitiatives` | Busca iniciativas similares por similitud textual (no por embeddings) | Resultado expuesto como "artifact" adicional de la respuesta |
| `getInitiative` | Trae la iniciativa completa en evaluación (formulario, contactos, adjuntos) | Iniciativa no encontrada → error devuelto al modelo, no a la conversación |
| `getEvaluationCriteria` | Lista los criterios activos con su peso | — |
| `getPreviousEvaluations` | Lista evaluaciones previas completadas de la misma iniciativa, para contexto histórico (nunca se recalculan) | — |
| `updateReadiness` | Persiste el estado de "disposición para evaluar" (7 indicadores + notas); sincroniza el porcentaje de avance de la conversación | Solo señaliza — **no genera la evaluación final** |

**Nota:** existen herramientas de código (`calculate-fit`, `generate-business-case`, `generate-executive-summary`, `get-catalogs`, `save-evaluation`) que **no están registradas** en ningún modo activo — son código de una arquitectura anterior; la puntuación y el business case reales se calculan en el pipeline determinístico (3.4), no en este loop de herramientas.

**Flujos alternativos / excepciones**
- Mensaje vacío o &gt;4000 caracteres → `400`.
- Conversación inexistente/ajena → `404`.
- Evaluación ya `COMPLETED` → `409`.
- El modelo "rechaza" procesar la solicitud → `502`.
- Respuesta final sin texto → `502` "El agente devolvió una respuesta vacía".
- Error de red/rate limit/timeout de Anthropic → `502`.
- Una herramienta individual falla (BD caída, iniciativa borrada a medio camino) → **no rompe el turno**; el modelo recibe el error y decide cómo continuar (reformular, probar otra herramienta, preguntar al evaluador).

**Precondiciones:** conversación y evaluación existentes, no completada; actor autorizado (dueño o ADMIN).
**Postcondiciones:** se crean los mensajes de usuario y asistente (el del usuario queda persistido incluso si Claude falla y no llega a responder); posible actualización de `readiness`/`completion`; `Evaluation.status` permanece `IN_PROGRESS` (este endpoint nunca completa la evaluación).

---

## 3.4 Generar evaluación desde la conversación (pipeline determinístico)

**Endpoint:** `POST /api/conversations/:id/generate`
**Actores:** EVALUATOR/ADMIN dispara la acción; Claude se usa en pasos discretos de generación (no en modo conversación).

**Flujo principal**
1. Mismos chequeos de conversación/evaluación/propiedad que en 3.3.
2. **Si la evaluación ya está `COMPLETED`**, no da error: responde con el resultado ya existente y un mensaje informativo (a diferencia de enviar un mensaje, que sí da `409` en este caso — asimetría deliberada entre ambos endpoints).
3. Si no está completada: construye el transcript completo de la conversación (vacío si es evaluación en modo directo) y ejecuta el pipeline:
   - **Paso 1 — Scoring:** para cada criterio activo, en paralelo, le pide a Claude un score (0-100) y justificación, aisladamente.
   - **Paso 2 — Clasificación:** un único prompt con el catálogo completo + contexto + scores; el modelo elige una clasificación. Si elige algo fuera del catálogo activo → `502`.
   - **Paso 3 — Mesa de trabajo:** análogo al paso 2.
   - **Paso 4 — Prioridad:** Alta/Media/Baja, decidida por el modelo (no hay un umbral determinístico en el código que la calcule a partir del Fit).
   - **Paso 5 — Business case:** resumen ejecutivo, objetivos, beneficios, riesgos, KPIs, recomendación final.
   - **Paso 6 — Persistencia** (ver detalle abajo).
   - **Paso 7 — Informe ejecutivo:** un último texto breve para mostrarse como respuesta del asistente en el chat (no se persiste como parte del resultado estructurado).
4. **Persistencia del resultado:**
   - Revalida que la clasificación/mesa elegidas existan y sigan activas.
   - Reconstruye los scores exigiendo que **todos** los criterios activos actuales tengan puntuación (si falta alguno → `400`).
   - **Cálculo del Fit:** promedio ponderado puro de `score × peso` de cada criterio, sobre la suma de pesos — es la única fórmula de Fit realmente usada (la heurística por palabras clave existente en el código no está conectada a este flujo).
   - Guarda snapshots inmutables: criterios activos completos, mapa de pesos, clasificación y mesa elegidas — así una evaluación conserva el contexto exacto con que se hizo aunque el catálogo cambie después.
   - Compara la clasificación de esta evaluación contra la del triage rápido original, pero **sin mostrarle esa comparación al modelo** (para no sesgarlo a coincidir con el triage) — solo se registra para medir precisión histórica.
   - Marca `Evaluation.status = COMPLETED`, `evaluatedAt`; `Conversation.status = COMPLETED`, `completion = 100`; `Initiative.status = EVALUATED`.

**Flujos alternativos / excepciones**
- Conversación/evaluación inexistente o ajena → `404`.
- Evaluación ya completada → `200` con mensaje informativo (no error). En una condición de carrera con dos llamadas casi simultáneas, la segunda que llegue a la persistencia después de que la primera ya completó sí recibiría `409`.
- **Generar sin suficiente información de entrevista:** el código no lo bloquea de ninguna forma — no hay chequeo de `readinessStatus` antes de correr el pipeline; si no hay transcript, el modelo puntúa solo con los datos del formulario (deliberado: el usuario decide cuándo generar).
- Sin criterios/clasificaciones/mesas activas → `409`.
- JSON de alguna respuesta del modelo no parseable → `502`.
- JSON parseable pero que no cumple el esquema esperado en algún paso → error de validación sin envolver, que llega como `400` (inconsistencia respecto a otros fallos de LLM en el mismo flujo, que dan `502`).
- Clasificación/mesa elegida fuera del catálogo activo → `502`.
- Error de red/timeout/rate limit de Anthropic en cualquier paso → `502`.
- Faltan scores para algún criterio activo al persistir → `400`.

**Precondiciones:** conversación y evaluación existentes; al menos un criterio/clasificación/mesa activos; actor autorizado.
**Postcondiciones (éxito):** `Evaluation: IN_PROGRESS → COMPLETED` con resultado, snapshots y business case inmutables; `Conversation → COMPLETED`; `Initiative.status → EVALUATED`.

---

## 3.5 Listar, ver y eliminar evaluaciones

**Endpoints:** `GET /api/evaluations`, `GET /api/evaluations/:id`, `DELETE /api/evaluations/:id`
**Actores:** EVALUATOR (lectura de las propias) / ADMIN (todas + único que puede eliminar).

**Flujo principal**
- **Listar:** filtra por evaluador propietario salvo ADMIN.
- **Detalle:** incluye conversación, mensajes, iniciativa y snapshots; si el EVALUATOR no es dueño → `404`. Usa los snapshots como respaldo si la clasificación/mesa original ya fue borrada.
- **Eliminar:** exige rol ADMIN estricto (chequeo redundante en ruta y servicio). Hard delete.

**Flujos alternativos / excepciones**
- Evaluación inexistente en cualquiera de los 3 endpoints → `404`.
- EVALUATOR viendo una evaluación ajena → `404`.
- EVALUATOR intentando eliminar → `403` (bloqueado antes de llegar al servicio).
- **Eliminar una evaluación con conversación activa:** el código no valida el estado de la conversación antes de borrar — procede sin importar si está en curso o completada. La base de datos elimina en cascada la `Conversation` y todos sus `Message` asociados, sin aviso ni posibilidad de recuperación. La `Initiative` y su `status` no se ven afectados por este borrado.

**Precondiciones:** usuario autenticado; para eliminar, rol ADMIN estricto.
**Postcondiciones:** lectura sin cambios; eliminación borra `Evaluation` + `Conversation` + `Message` en cascada, dejando la iniciativa intacta.

---

### Observaciones abiertas de la Sección 3 (encontradas en el código, no inventadas)

1. No está determinado en el código qué ocurre exactamente si el agente conversacional agota su límite de 8 rondas de uso de herramientas sin llegar a una respuesta de texto — depende del comportamiento interno del SDK de Anthropic, no inspeccionable en este entorno.
2. Los fallos de validación de esquema sobre las respuestas del LLM en el pipeline de evaluación no están envueltos de forma consistente: los de parseo JSON dan `502` (fallo del LLM), pero los de esquema (Zod) dan `400` (como si fuera error del cliente), aunque conceptualmente ambos son fallos del modelo.
3. `startEvaluationForInitiative` (3.1) desactiva efectivamente la restricción de propiedad sobre la iniciativa, a diferencia del resto de endpoints de evaluación/conversación, que sí la aplican.
4. La heurística de Fit por palabras clave (`fit.service.ts`) existe en el código pero no interviene en el cálculo real que ve el usuario — solo la usa una herramienta no registrada.
