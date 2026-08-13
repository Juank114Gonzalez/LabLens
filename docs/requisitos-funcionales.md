# Requisitos Funcionales — LabLens

**Fecha:** 2026-08-13
**Fuente:** destilación directa de `docs/casos-de-uso.md` e `docs/inventario-tecnico.md` — formularios existentes, validaciones (Zod) y lógica de negocio en controladores/servicios del código real. Cada requisito corresponde a una capacidad que el sistema **ya ejecuta hoy**; no se incluye nada planeado o no implementado sin marcarlo explícitamente.

---

## 1. Autenticación y sesión

**RF-01:** El sistema debe permitir a un usuario iniciar sesión con correo y contraseña, restringido a cuentas con dominio corporativo `@achcolombia.com.co`.

**RF-02:** El sistema debe permitir iniciar sesión mediante autenticación corporativa de Microsoft (SSO), validando el token contra Microsoft Graph, sin crear cuentas nuevas automáticamente (el usuario debe existir previamente en el sistema).

**RF-03:** El sistema debe permitir cerrar sesión, revocando el token de renovación de sesión activo.

**RF-04:** El sistema debe permitir renovar una sesión expirada mediante un token de renovación válido, invalidando el anterior y emitiendo uno nuevo en cada renovación.

**RF-05:** El sistema debe permitir a un usuario autenticado consultar su propio perfil (nombre, correo, rol).

---

## 2. Administración de usuarios

**RF-06:** El sistema debe permitir a un administrador listar todos los usuarios registrados.

**RF-07:** El sistema debe permitir a un administrador crear nuevos usuarios (nombre, correo corporativo único, contraseña, rol), sin autorregistro público.

**RF-08:** El sistema debe permitir a un administrador consultar el detalle de un usuario específico.

**RF-09:** El sistema debe permitir a un administrador actualizar los datos, el rol y el estado (activo/inactivo) de un usuario.

**RF-10:** El sistema debe impedir que un administrador se autodegrade de rol, se autodesactive o se elimine a sí mismo.

**RF-11:** El sistema debe permitir a un administrador eliminar una cuenta de usuario (excepto la propia).

**RF-12:** El sistema debe ofrecer una función de reseteo de contraseña de usuario. *(Parcialmente implementado: hoy es un placeholder que valida al usuario pero no modifica la contraseña ni envía notificación — sin efecto real todavía).*

---

## 3. Catálogos de configuración

**RF-13:** El sistema debe permitir a cualquier usuario autenticado consultar los catálogos de clasificaciones inteligentes, mesas de trabajo y criterios de evaluación.

**RF-14:** El sistema debe permitir a un administrador crear, actualizar y eliminar clasificaciones inteligentes (usadas por el clasificador de IA).

**RF-15:** El sistema debe permitir a un administrador crear, actualizar y eliminar mesas de trabajo, incluyendo un correo de notificación por cada una.

**RF-16:** El sistema debe permitir a un administrador crear, actualizar y eliminar criterios de evaluación (nombre, descripción, contexto para la IA, peso).

**RF-17:** El sistema debe exigir que la suma de los pesos de todos los criterios de evaluación **activos** sea exactamente 100%, validándolo al crear, actualizar y eliminar cualquier criterio.

**RF-18:** El sistema debe impedir eliminar un criterio activo si su ausencia rompe la regla de suma de pesos al 100%.

**RF-19:** El sistema debe permitir a un administrador reordenar el conjunto completo de criterios de evaluación en una sola operación atómica (todo o nada).

**RF-20:** El sistema debe versionar automáticamente la configuración de criterios de evaluación cada vez que cambia el conjunto de criterios activos, conservando un identificador único e inmutable por versión.

**RF-21:** El sistema debe permitir consultar el historial completo de versiones de criterios, incluyendo cuántas evaluaciones se hicieron con cada versión.

**RF-22:** El sistema debe reutilizar (no duplicar) una versión de criterios ya existente si la configuración resultante es idéntica a una anterior.

---

## 4. Contactos de empresa

**RF-23:** El sistema debe permitir registrar uno o más contactos de empresa (empresa, contacto, cargo, correo, teléfono) asociados a una iniciativa.

**RF-24:** El sistema debe permitir actualizar y eliminar contactos de empresa de una iniciativa.

**RF-25:** El sistema debe exigir al menos un contacto de empresa cuando el formulario de la iniciativa indica que existe un interesado externo.

---

## 5. Envío público de iniciativas

**RF-26:** El sistema debe permitir a cualquier persona, sin necesidad de autenticarse, enviar una iniciativa de innovación mediante un formulario público de 12 preguntas.

**RF-27:** El sistema debe distinguir el origen de una iniciativa pública entre colaborador interno, contratista/proveedor externo o referente internacional.

**RF-28:** El sistema debe exigir al menos una selección en los campos de área impactada y producto/servicio relacionado del formulario público.

**RF-29:** El sistema debe permitir adjuntar evidencias (PDF, DOCX, XLSX, PNG, JPG) al envío público, con un límite de 10 archivos y 15MB por archivo.

**RF-30:** El sistema debe limitar la cantidad de envíos públicos por dirección IP en una ventana de una hora, para prevenir abuso.

**RF-31:** El sistema debe clasificar automáticamente con inteligencia artificial cada iniciativa recién enviada por el formulario público, sin bloquear la confirmación del envío si la clasificación falla.

---

## 6. Gestión y ciclo de vida interno de iniciativas

**RF-32:** El sistema debe permitir a un evaluador o administrador crear un borrador de iniciativa desde el back-office, con guardado incremental de campos opcionales.

**RF-33:** El sistema debe permitir editar libremente una iniciativa mientras se encuentre en estado de borrador.

**RF-34:** El sistema debe impedir la edición de una iniciativa una vez que fue registrada o clasificada, indicando que debe copiarse para poder modificarse.

**RF-35:** El sistema debe exigir que todos los campos obligatorios del formulario interno y al menos una evidencia adjunta estén completos antes de registrar formalmente una iniciativa.

**RF-36:** El sistema debe disparar automáticamente la clasificación por IA al registrar una iniciativa desde el canal interno.

**RF-37:** El sistema debe permitir copiar una iniciativa existente como un nuevo borrador editable, conservando la trazabilidad hacia la iniciativa original y reutilizando sus evidencias sin duplicar los archivos.

**RF-38:** El sistema debe permitir eliminar una iniciativa, restringiendo a un evaluador (no administrador) a eliminar únicamente sus propios borradores.

**RF-39:** El sistema debe permitir listar y filtrar iniciativas por estado, origen, clasificación, mesa de trabajo, rango de fechas y texto de búsqueda.

**RF-40:** El sistema debe presentar estadísticas agregadas de iniciativas (totales, comparativa temporal, distribución por estado/origen/clasificación/área, línea de tiempo) a evaluadores y administradores.

---

## 7. Clasificación automática con inteligencia artificial (triage)

**RF-41:** El sistema debe clasificar cada iniciativa mediante inteligencia artificial, asignando una clasificación, una mesa de trabajo, un nivel de confianza y una justificación.

**RF-42:** El sistema debe enviar a revisión manual (sin clasificación automática) cualquier iniciativa cuando la IA determine que el contenido no es clasificable, cuando la confianza sea menor al umbral mínimo, o cuando la IA proponga una clasificación o mesa fuera del catálogo activo.

**RF-43:** El sistema debe permitir a un evaluador o administrador volver a ejecutar la clasificación de una iniciativa individual en cualquier momento después de registrada.

**RF-44:** El sistema debe permitir a un administrador ejecutar una reclasificación masiva sobre las iniciativas pendientes o sobre todo el histórico, sin que el fallo de una iniciativa individual detenga el proceso completo.

**RF-45:** El sistema debe distinguir si una iniciativa clasificada pertenece al alcance del Laboratorio Digital o debe enrutarse a un área externa, según el tipo de clasificación asignada.

---

## 8. Notificaciones

**RF-46:** El sistema debe notificar automáticamente por correo electrónico a la mesa de trabajo correspondiente cuando una iniciativa se clasifique como fuera del alcance del Laboratorio, sin que un fallo en el envío revierta la clasificación ya realizada.

---

## 9. Gestión de evidencias/adjuntos

**RF-47:** El sistema debe permitir listar las evidencias adjuntas a una iniciativa.

**RF-48:** El sistema debe permitir descargar todas las evidencias de una iniciativa en un único archivo comprimido.

**RF-49:** El sistema debe permitir adjuntar nuevas evidencias a una iniciativa únicamente mientras esté en estado de borrador, validando el tipo de archivo permitido.

**RF-50:** El sistema debe permitir eliminar una evidencia de una iniciativa únicamente mientras esté en estado de borrador.

---

## 10. Evaluación asistida por inteligencia artificial

**RF-51:** El sistema debe permitir a un evaluador o administrador iniciar la evaluación formal de una iniciativa, ya sea mediante una entrevista conversacional asistida por IA o mediante evaluación directa sin entrevista.

**RF-52:** El sistema debe impedir iniciar una evaluación sobre una iniciativa archivada.

**RF-53:** El sistema debe conducir una entrevista conversacional con el evaluador, mediante un asistente de inteligencia artificial que formule preguntas una a la vez para recabar contexto adicional sobre la iniciativa.

**RF-54:** El sistema debe permitir que el asistente de IA, durante la entrevista, consulte la base de conocimiento del Laboratorio, iniciativas similares ya registradas, los criterios de evaluación vigentes y evaluaciones previas de la misma iniciativa.

**RF-55:** El sistema debe registrar y actualizar el nivel de completitud/disposición de la información recabada durante la entrevista, sin permitir que el asistente emita puntuaciones o conclusiones antes de generar la evaluación formal.

**RF-56:** El sistema debe impedir enviar nuevos mensajes en una conversación cuya evaluación ya fue completada.

**RF-57:** El sistema debe generar de forma determinística el resultado de una evaluación a partir del formulario de la iniciativa y, si existe, la entrevista: una puntuación justificada por cada criterio activo, una clasificación, una mesa de trabajo, un nivel de prioridad y un caso de negocio (resumen ejecutivo, objetivos, beneficios, riesgos, KPIs y recomendación).

**RF-58:** El sistema debe calcular el ajuste (Fit) de una iniciativa como el promedio ponderado de las puntuaciones por criterio, según los pesos vigentes de cada criterio.

**RF-59:** El sistema debe conservar en cada evaluación completada una copia inmutable de los criterios, pesos, clasificación y mesa de trabajo usados en el momento de evaluar, de forma que la evaluación no cambie aunque el catálogo se modifique después. El sistema debe además registrar internamente la comparación entre la clasificación automática inicial y la clasificación decidida en la evaluación profunda, sin exponer esa comparación al modelo de IA que genera el resultado.

**RF-60:** El sistema debe marcar una evaluación como completada e inmutable una vez generado su resultado, actualizando el estado de la iniciativa a evaluada.

**RF-61:** El sistema debe permitir consultar el historial de conversaciones y evaluaciones asociadas a una iniciativa.

---

## 11. Administración de evaluaciones

**RF-62:** El sistema debe permitir a un evaluador consultar únicamente sus propias evaluaciones, y a un administrador consultar todas las evaluaciones registradas.

**RF-63:** El sistema debe permitir únicamente a un administrador eliminar una evaluación, eliminando en conjunto su conversación y mensajes asociados sin afectar el estado de la iniciativa.
