# Deck ejecutivo — 10 láminas

Guion de contenido, una sección por lámina. Cada una lleva el mensaje que debe quedar y lo que se muestra en pantalla.

---

## 1 · Portada

**LabLens — Comité Virtual de Innovación**
Laboratorio Digital de ACH Colombia · MVP funcional

*Visual:* logo, una línea de tagline, nombres del equipo. Nada más.

---

## 2 · El problema

**Mensaje:** el cuello de botella no es la falta de ideas, es el costo de mirarlas.

- La primera evaluación depende de comités tradicionales: **semanas de respuesta**.
- El Lab recibirá mantenimiento, cambios menores en APIs y soporte transaccional que **no son innovación experimental** y consumen el mismo tiempo de comité.
- Cada iniciativa sobre el riel sistémico exige verificar cumplimiento normativo y ciberseguridad desde la fase conceptual.

*Visual:* tres barras de tiempo mostrando dónde se va el reloj hoy.

---

## 3 · La solución en una frase

**Mensaje:** un triage automático separa lo que merece experimentación de lo que pertenece a la operación, y solo lo primero consume el presupuesto de razonamiento del Lab.

Dos caminos, no uno:

| | Camino rápido | Camino profundo |
| --- | --- | --- |
| A quién aplica | Todos los envíos | Solo lo que se queda en el Lab |
| Qué hace | Clasifica y enruta | Puntúa, prioriza y redacta el business case |
| Cuánto cuesta | 1 llamada al modelo | 6+ llamadas |
| Cuánto tarda | Segundos | Minutos |

---

## 4 · Cómo llega una iniciativa

**Mensaje:** tres canales, un solo formulario, cero fricción de cuenta.

- Áreas internas de ACH.
- Organizaciones externas y contractors.
- **Referencias internacionales** — lo que el equipo ve en un congreso o benchmark y quiere replicar. Un canal que el enunciado no pedía y que convierte al Lab en receptor activo de señales del mercado.

*Visual:* captura de `/submit` con el desplegable de canal abierto sobre el formulario.

---

## 5 · El dictamen, en vivo

**Mensaje:** quien envía no queda esperando; ve la decisión antes de cerrar la pestaña.

*Visual:* captura de la pantalla de resultado — categoría, confianza, justificación y mesa de trabajo, con el aviso de que el área ya fue notificada por correo.

---

## 6 · Qué decide la IA y qué no

**Mensaje:** el modelo razona y redacta; el número que ordena el portafolio lo calcula la lógica de negocio.

| Lo decide el modelo | Lo decide el sistema |
| --- | --- |
| Categoría de la taxonomía | Si esa categoría es alcance del Lab |
| Mesa de trabajo | El **Fit 0–100** (promedio ponderado) |
| Score de cada criterio, aislado | Los pesos vigentes |
| Redacción del business case | La estructura obligatoria de 6 secciones |

Cada evaluación congela los criterios y pesos que usó. Un cambio de configuración no reescribe los dictámenes pasados.

---

## 7 · El tablero del Lab

**Mensaje:** el portafolio deja de ser una bandeja de correos.

*Visual:* captura del dashboard — volumen contra el período anterior, distribución por clasificación, canal de origen y la tendencia de 30 días separando lo que se quedó del Lab de lo que se enrutó afuera.

La vista de auditoría permite revisar lo que el triage sacó del Lab y medir su precisión real.

---

## 8 · Arquitectura

**Mensaje:** serverless de punta a punta, con la frontera ya trazada en el código.

*Visual:* el diagrama de `docs/arquitectura-aws.md`.

Bedrock · Step Functions · Lambda + API Gateway · DynamoDB · S3 · Cognito · SES · QuickSight.

El MVP ya corre sobre **Anthropic Claude**, el mismo modelo que expone Bedrock: migrar a Bedrock es cambiar el cliente del SDK, no el código que lo usa. El almacenamiento y la identidad están aislados en un módulo cada uno, de modo que el resto de la migración también cambia adaptadores, no lógica.

---

## 9 · Métricas objetivo y cómo se miden

| Meta | Cómo la persigue el diseño | Cómo se verifica |
| --- | --- | --- |
| Primera evaluación **< 3 minutos** (hoy 15 días) | Triage de una sola llamada, síncrono al envío | `triagedAt − createdAt` por iniciativa |
| **95%** de acierto al desviar lo operativo | Taxonomía y mesas como catálogo editable inyectado al prompt; confianza reportada por caso | Vista de auditoría: revisión humana de lo enrutado fuera del Lab |
| Sin carga operativa de revisión manual | Notificación automática al área dueña | `notificationSentAt` |

---

## 10 · Roadmap y cierre

**Post-MVP inmediato**

- Migración a Bedrock + Step Functions con AWS CDK.
- Export del business case a PDF/DOCX.
- RAG sobre conocimiento histórico del Lab para contrastar contra iniciativas similares.
- QuickSight para el consumo directivo.

**Cierre:** el Laboratorio deja de gastar su recurso más escaso —el criterio de sus expertos— en decir «esto no es para nosotros».
